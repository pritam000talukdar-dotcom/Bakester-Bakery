import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ProductsContext = createContext(null);

// ── Cache keys / TTL ──────────────────────────────────────────
const SESSION_KEY   = 'bakester_products_cache';
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 min

// ── Module-level in-memory cache (survives route changes) ─────
let memCache  = null;
let memStamp  = 0;

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) return { data, ts };
  } catch { /* ignore */ }
  return null;
}

function writeSessionCache(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded – ignore */ }
}

// ── Stock buffer ─────────────────────────────────────────────
const STOCK_BUFFER = 5;

function normalise(p) {
  const actualQty     = p.quantity ?? 0;
  const displayQuantity = Math.max(0, actualQty - STOCK_BUFFER);
  const userInStock   = p.in_stock !== false && actualQty > STOCK_BUFFER;
  return {
    ...p,
    image:           p.image_url || '',
    name:            p.name        || 'Unnamed Product',
    description:     p.description || '',
    price:           p.price       ?? 0,
    rating:          p.rating      ?? null,
    badge:           p.badge?.trim() || null,
    in_stock:        userInStock,
    quantity:        actualQty,
    displayQuantity,
  };
}

// ── Normalise a list once (memoised by reference) ─────────────
function normaliseList(raw) {
  return raw.map(normalise);
}

export const ProductsProvider = ({ children }) => {
  // Seed state from memory → session → empty
  const [rawProducts, setRawProducts] = useState(() => {
    if (memCache && Date.now() - memStamp < CACHE_TTL_MS) return memCache;
    const session = readSessionCache();
    if (session) { memCache = session.data; memStamp = session.ts; return session.data; }
    return [];
  });

  const [loading, setLoading] = useState(
    () => !!(isSupabaseConfigured && rawProducts.length === 0)
  );
  const [error, setError] = useState(
    isSupabaseConfigured ? null : 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );

  // Normalised list — recomputed only when rawProducts reference changes
  const [products, setProducts] = useState(() => normaliseList(rawProducts));
  const prevRaw = useRef(rawProducts);

  useEffect(() => {
    if (prevRaw.current !== rawProducts) {
      prevRaw.current = rawProducts;
      setProducts(normaliseList(rawProducts));
    }
  }, [rawProducts]);

  // ── Helpers to update all caches consistently ─────────────
  const applyRaw = useCallback((list) => {
    memCache = list;
    memStamp = Date.now();
    writeSessionCache(list);
    setRawProducts(list);
  }, []);

  // ── Fetch from Supabase ───────────────────────────────────
  const fetchProducts = useCallback(async (force = false) => {
    if (!isSupabaseConfigured) return;

    // Skip if valid cache exists
    if (!force && memCache && Date.now() - memStamp < CACHE_TTL_MS) {
      setRawProducts(memCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      applyRaw(data || []);
    } catch (e) {
      console.error('ProductsContext fetch error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [applyRaw]);

  // ── Bootstrap + realtime subscription ────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const isFresh = memCache && Date.now() - memStamp < CACHE_TTL_MS;
    if (isFresh) {
      setRawProducts(memCache);
      setLoading(false);
    } else {
      fetchProducts(true);
    }

    // Realtime: surgical updates so we never need a full re-fetch
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        setRawProducts((prev) => {
          let next;
          if (payload.eventType === 'INSERT') {
            const already = prev.some((p) => p.id === payload.new.id);
            next = already ? prev : [payload.new, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            next = prev.map((p) => p.id === payload.new.id ? payload.new : p);
          } else if (payload.eventType === 'DELETE') {
            next = prev.filter((p) => p.id !== payload.old.id);
          } else {
            return prev;
          }
          memCache = next; memStamp = Date.now();
          writeSessionCache(next);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProducts]);

  // ── Derived selectors (stable references) ─────────────────
  const getByCategory = useCallback(
    (category) => products.filter((p) => p.category === category),
    [products]
  );
  const getInStock = useCallback(
    () => products.filter((p) => p.in_stock !== false),
    [products]
  );
  const getTopRated = useCallback(
    (n = 4) => [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, n),
    [products]
  );

  return (
    <ProductsContext.Provider value={{
      products,
      loading,
      error,
      refetch: () => fetchProducts(true),
      getByCategory,
      getInStock,
      getTopRated,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};
