import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ProductsContext = createContext(null);

// ─── In-memory cache so products survive route changes without re-fetching ───
let cachedProducts = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState(cachedProducts || []);
  const [loading, setLoading]   = useState(!cachedProducts && isSupabaseConfigured);
  const [error, setError]       = useState(
    isSupabaseConfigured ? null : 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
  const productsRef = useRef(cachedProducts || []);

  // Normalise a DB row into the shape the UI expects
  const normalise = useCallback((p) => ({
    ...p,
    image: p.image_url || '',
    name: p.name || 'Unnamed Product',
    description: p.description || '',
    price: p.price ?? 0,
    rating: p.rating ?? null,
    badge: p.badge?.trim() || null,
    in_stock: p.in_stock !== false,
    quantity: p.quantity ?? 0,
  }), []);

  const fetchProducts = useCallback(async (force = false) => {
    if (!isSupabaseConfigured) return;

    const now = Date.now();
    if (!force && cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
      setProducts(cachedProducts);
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

      const list = data || [];
      cachedProducts = list;
      cacheTimestamp = Date.now();
      productsRef.current = list;
      setProducts(list);
    } catch (e) {
      console.error('ProductsContext fetch error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const now = Date.now();
    if (cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
      setProducts(cachedProducts);
      setLoading(false);
    } else {
      fetchProducts(true);
    }

    // Realtime subscription for live product updates
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts((prev) => {
              const already = prev.some((p) => p.id === payload.new.id);
              const next = already ? prev : [payload.new, ...prev];
              cachedProducts = next;
              productsRef.current = next;
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            setProducts((prev) => {
              const next = prev.map((p) => (p.id === payload.new.id ? payload.new : p));
              cachedProducts = next;
              productsRef.current = next;
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => {
              const next = prev.filter((p) => p.id !== payload.old.id);
              cachedProducts = next;
              productsRef.current = next;
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const getByCategory = useCallback(
    (category) => products.filter((p) => p.category === category).map(normalise),
    [products, normalise]
  );

  const getInStock = useCallback(
    () => products.filter((p) => p.in_stock !== false).map(normalise),
    [products, normalise]
  );

  const getTopRated = useCallback(
    (n = 4) =>
      [...products]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, n)
        .map(normalise),
    [products, normalise]
  );

  return (
    <ProductsContext.Provider
      value={{
        products: products.map(normalise),
        loading,
        error,
        refetch: () => fetchProducts(true),
        getByCategory,
        getInStock,
        getTopRated,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};
