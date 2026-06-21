import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProducts } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

// ── Stock buffer — kept in sync with ProductsContext & AdminDashboard ──────────
const STOCK_BUFFER = 5;

/**
 * Normalise a raw DB product row into the shape the UI expects.
 * Users see (quantity - STOCK_BUFFER) and only "in stock" if actualQty > buffer.
 */
function normalise(p) {
  const actualQty      = p.quantity ?? 0;
  const displayQuantity = Math.max(0, actualQty - STOCK_BUFFER);
  const userInStock    = p.in_stock !== false && actualQty > STOCK_BUFFER;
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

/**
 * useProductsQuery — primary hook for product data.
 *
 * Wraps useQuery so that:
 *  - Data is cached for 5 min (staleTime from queryClient defaults)
 *  - A Supabase Realtime subscription keeps the cache surgically updated
 *    without issuing a new network fetch (INSERT/UPDATE/DELETE → setQueryData)
 *  - Normalised products are derived inline so all consumers share the same shape
 *
 * Returns:
 *   products    — normalised array (empty [] on loading/error)
 *   rawProducts — un-normalised (for admin use)
 *   isLoading, isFetching, error, refetch
 *   getByCategory, getInStock, getTopRated — stable selector functions
 */
export function useProductsQuery() {
  const queryClient = useQueryClient();

  const {
    data: rawProducts = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey:  queryKeys.products.list(),
    queryFn:   fetchProducts,
    enabled:   isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });

  // ── Realtime subscription: surgical cache updates (no extra network call) ──
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channelId = `products-realtime-rq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          queryClient.setQueryData(queryKeys.products.list(), (prev = []) => {
            if (payload.eventType === 'INSERT') {
              const already = prev.some((p) => p.id === payload.new.id);
              return already ? prev : [payload.new, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((p) => p.id === payload.new.id ? payload.new : p);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((p) => p.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ── Normalise once — memoised on rawProducts reference change ───────────
  const products = rawProducts.map(normalise);

  // ── Stable selector helpers ──────────────────────────────────────────────
  const getByCategory = useCallback(
    (category) => products.filter((p) => p.category === category),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawProducts]
  );
  const getInStock = useCallback(
    () => products.filter((p) => p.in_stock !== false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawProducts]
  );
  const getTopRated = useCallback(
    (n = 4) => [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, n),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawProducts]
  );

  return {
    products,
    rawProducts,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    refetch,
    getByCategory,
    getInStock,
    getTopRated,
  };
}
