/**
 * CartContext.jsx
 *
 * Local cart state is managed by useReducer (instant UI updates, no network lag).
 * Cloud sync is handled by useCartQuery (React Query mutation), replacing the
 * hand-rolled async helpers in the original.
 *
 * Changes vs. original:
 *  ✗  syncToCloud() / loadCloudCart() inline helpers — now in src/lib/api.js
 *  ✗  Manual bootstrap() async function in useEffect — replaced by useCartQuery
 *  ✗  Duplicate supabase.auth.onAuthStateChange inside this context — CartContext
 *      now simply watches `cloudCart` from useCartQuery and dispatches SET_ITEMS
 *  ✓  useReducer + cartReducer — unchanged (local state is not a fetching concern)
 *  ✓  localStorage persistence — unchanged
 *  ✓  Debounced cloud sync — now fires syncCart() from useCartQuery
 *  ✓  All action creators (addItem, removeItem, etc.) — unchanged
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useCartQuery } from '../hooks/useCartQuery';

const CartContext = createContext(null);

// ── Reducer ───────────────────────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    default:
      return state;
  }
};

const initialState = {
  items: (() => {
    try { return JSON.parse(localStorage.getItem('bakester_cart') || '[]'); }
    catch { return []; }
  })(),
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const syncTimerRef  = useRef(null);
  const isFirstSync   = useRef(true); // skip outbound sync on the initial cloud load

  // ── React Query: cloud cart ─────────────────────────────────────────────
  const { cloudCart, syncCart } = useCartQuery(user?.id ?? null);

  // ── Merge cloud cart into local state once on sign-in ──────────────────
  // cloudCart transitions from null → array when the query resolves.
  const prevCloudCart = useRef(null);
  useEffect(() => {
    if (cloudCart === null || cloudCart === prevCloudCart.current) return;
    prevCloudCart.current = cloudCart;

    // Mark as first-sync so the debounced write-back doesn't immediately
    // overwrite the server data we just loaded.
    isFirstSync.current = true;
    dispatch({ type: 'SET_ITEMS', payload: cloudCart });
    // Allow outbound sync after a tick
    setTimeout(() => { isFirstSync.current = false; }, 0);
  }, [cloudCart]);

  // Reset first-sync guard when the user signs out
  useEffect(() => {
    if (!user?.id) {
      isFirstSync.current = true;
      prevCloudCart.current = null;
    }
  }, [user?.id]);

  // ── Persist to localStorage on every change ─────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('bakester_cart', JSON.stringify(state.items)); }
    catch { /* quota exceeded */ }
  }, [state.items]);

  // ── Debounced cloud sync (1 s after last local change) ──────────────────
  useEffect(() => {
    if (isFirstSync.current) return;
    if (!user?.id) return; // guests: local-only

    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncCart(state.items);
    }, 1000);

    return () => clearTimeout(syncTimerRef.current);
  }, [state.items, user?.id, syncCart]);

  // ── Action creators ──────────────────────────────────────────────────────
  const addItem        = useCallback((product)         => dispatch({ type: 'ADD_ITEM',      payload: product }),         []);
  const removeItem     = useCallback((id)              => dispatch({ type: 'REMOVE_ITEM',   payload: id }),              []);
  const updateQuantity = useCallback((id, quantity)    => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }), []);
  const clearCart      = useCallback(()                => dispatch({ type: 'CLEAR_CART' }),                             []);

  const cartCount = state.items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, cartCount, cartTotal, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
