/**
 * ProductsContext.jsx
 *
 * Thin wrapper context that delegates all data fetching / caching to
 * useProductsQuery (React Query). This context exists purely so that
 * components can call useProducts() without needing to know about React Query.
 *
 * What was removed vs. the original:
 *  ✗  Module-level memCache / memStamp variables
 *  ✗  readSessionCache / writeSessionCache (sessionStorage TTL logic)
 *  ✗  Manual fetchProducts useEffect + setLoading / setError plumbing
 *  ✗  prevRaw useRef + normalise useEffect
 *
 * What was kept:
 *  ✓  The same useProducts() hook API (products, loading, error, refetch, selectors)
 *  ✓  normalise() — now lives in useProductsQuery.js
 *  ✓  getByCategory / getInStock / getTopRated selectors (re-exported from hook)
 *  ✓  Realtime subscription — now lives in useProductsQuery.js
 */

import React, { createContext, useContext } from 'react';
import { useProductsQuery } from '../hooks/useProductsQuery';

const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const {
    products,
    rawProducts,
    isLoading,
    isFetching,
    error,
    refetch,
    getByCategory,
    getInStock,
    getTopRated,
  } = useProductsQuery();

  return (
    <ProductsContext.Provider
      value={{
        products,
        rawProducts,
        loading:   isLoading,
        isFetching,
        error,
        refetch,
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
