import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const CartContext = createContext(null);

// ── Reducer ───────────────────────────────────────────────────
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

// ── Cloud sync helpers ────────────────────────────────────────
// We use a single UPSERT + one targeted DELETE instead of 3 sequential calls.
async function syncToCloud(uid, items) {
  try {
    if (items.length === 0) {
      await supabase.from('cart_items').delete().eq('user_id', uid);
      return;
    }

    const rows = items.map((item) => ({
      user_id:      uid,
      product_id:   String(item.id),
      quantity:     item.quantity,
      product_data: { id: item.id, name: item.name, price: item.price, image: item.image, category: item.category },
      updated_at:   new Date().toISOString(),
    }));

    // Single upsert for all current items
    const { error: upsertErr } = await supabase
      .from('cart_items')
      .upsert(rows, { onConflict: 'user_id,product_id' });
    if (upsertErr) throw upsertErr;

    // Remove stale items in one query using NOT IN
    const activeIds = items.map((i) => String(i.id));
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', uid)
      .not('product_id', 'in', `(${activeIds.join(',')})`);
  } catch (err) {
    console.error('Cart sync error:', err.message);
  }
}

async function loadCloudCart(uid) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity, product_data')
      .eq('user_id', uid);
    if (error) throw error;

    const cloudItems = (data || []).map((row) => ({
      ...row.product_data,
      id:       row.product_id,
      quantity: row.quantity,
    }));

    // Merge cloud + local: keep highest quantity per item
    let localItems = [];
    try { localItems = JSON.parse(localStorage.getItem('bakester_cart') || '[]'); } catch { /* ignore */ }

    const merged = [...cloudItems];
    for (const local of localItems) {
      const existing = merged.find((c) => c.id === String(local.id));
      if (!existing) merged.push(local);
      else existing.quantity = Math.max(existing.quantity, local.quantity);
    }
    return merged;
  } catch (err) {
    console.error('Error loading cloud cart:', err.message);
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const userIdRef    = useRef(null);          // latest uid without causing re-renders
  const syncTimerRef = useRef(null);
  const isFirstSync  = useRef(true);          // skip cloud sync on initial mount

  // ── Persist to localStorage immediately on change ─────────
  useEffect(() => {
    try { localStorage.setItem('bakester_cart', JSON.stringify(state.items)); }
    catch { /* quota exceeded */ }
  }, [state.items]);

  // ── Auth listener: load cloud cart once on sign-in ────────
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      userIdRef.current = uid;

      if (uid) {
        const merged = await loadCloudCart(uid);
        if (merged && mounted) dispatch({ type: 'SET_ITEMS', payload: merged });
      }
      isFirstSync.current = false;
    }
    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id || null;
      const prevUid = userIdRef.current;
      userIdRef.current = uid;

      if (uid && uid !== prevUid) {
        // New sign-in → load cloud cart
        isFirstSync.current = true;
        const merged = await loadCloudCart(uid);
        if (merged && mounted) {
          dispatch({ type: 'SET_ITEMS', payload: merged });
        }
        isFirstSync.current = false;
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── Debounced cloud sync (1 s after last change) ──────────
  // Skip guests and the very first SET_ITEMS after sign-in to avoid
  // immediately overwriting the cloud cart we just loaded.
  useEffect(() => {
    if (isFirstSync.current) return;
    const uid = userIdRef.current;
    if (!uid) return;                // guest: local only

    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncToCloud(uid, state.items), 1000);
    return () => clearTimeout(syncTimerRef.current);
  }, [state.items]);

  const addItem      = useCallback((product) => dispatch({ type: 'ADD_ITEM',      payload: product }), []);
  const removeItem   = useCallback((id)      => dispatch({ type: 'REMOVE_ITEM',   payload: id }),      []);
  const updateQuantity = useCallback((id, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }), []);
  const clearCart    = useCallback(()        => dispatch({ type: 'CLEAR_CART' }),                      []);

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
