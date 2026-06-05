import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // Keep a ref so the realtime handler always reads latest state
  const productsRef = useRef([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      const list = data || [];
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
    // 1. Subscribe FIRST so we don't miss events that arrive during the fetch
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts((prev) => {
              // Guard against duplicates (in case the initial fetch also returned this row)
              const already = prev.some((p) => p.id === payload.new.id);
              const next = already ? prev : [payload.new, ...prev];
              productsRef.current = next;
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            setProducts((prev) => {
              const next = prev.map((p) => (p.id === payload.new.id ? payload.new : p));
              productsRef.current = next;
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => {
              const next = prev.filter((p) => p.id !== payload.old.id);
              productsRef.current = next;
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        // 2. Fetch only after the channel is confirmed live — prevents race
        if (status === 'SUBSCRIBED') {
          fetchProducts();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Normalise a DB product to the shape ProductCard / cart expect
  const normalise = (p) => ({
    ...p,
    image: p.image_url || p.image || '',
  });

  const getByCategory = useCallback(
    (category) => products.filter((p) => p.category === category).map(normalise),
    [products]
  );

  const getInStock = useCallback(
    () => products.filter((p) => p.in_stock !== false).map(normalise),
    [products]
  );

  const getTopRated = useCallback(
    (n = 4) =>
      [...products]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, n)
        .map(normalise),
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products: products.map(normalise),
        loading,
        error,
        refetch: fetchProducts,
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
