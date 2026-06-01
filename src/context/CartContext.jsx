import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CartContext = createContext(null);

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
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.payload.id),
        };
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
  items: JSON.parse(localStorage.getItem('bakester_cart') || '[]'),
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [userId, setUserId] = React.useState(null);
  const syncTimeoutRef = React.useRef(null);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadCloudCart(uid);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadCloudCart(uid);
      else {
        // On sign out, keep local cart but stop syncing
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load cart from Supabase and merge with local
  const loadCloudCart = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', uid);
      if (error) throw error;

      // Build cloud items
      const cloudItems = (data || []).map((row) => ({
        ...row.product_data,
        id: row.product_id,
        quantity: row.quantity,
      }));

      // Merge: take max quantity per item from local vs cloud
      const localItems = JSON.parse(localStorage.getItem('bakester_cart') || '[]');
      const merged = [...cloudItems];
      for (const local of localItems) {
        const existing = merged.find((c) => c.id === local.id);
        if (!existing) {
          merged.push(local);
        } else {
          existing.quantity = Math.max(existing.quantity, local.quantity);
        }
      }
      dispatch({ type: 'SET_ITEMS', payload: merged });
    } catch (err) {
      console.error('Error loading cloud cart:', err.message);
    }
  };

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('bakester_cart', JSON.stringify(state.items));
  }, [state.items]);

  // Debounce sync to Supabase (500ms after last change)
  useEffect(() => {
    if (!userId) return;
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncToCloud(userId, state.items), 500);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [state.items, userId]);

  const syncToCloud = async (uid, items) => {
    try {
      if (items.length === 0) {
        // Delete all cart items for this user
        await supabase.from('cart_items').delete().eq('user_id', uid);
        return;
      }

      // Upsert all items
      const rows = items.map((item) => ({
        user_id: uid,
        product_id: String(item.id),
        quantity: item.quantity,
        product_data: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
        },
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('cart_items')
        .upsert(rows, { onConflict: 'user_id,product_id' });

      if (error) throw error;

      // Remove items no longer in cart
      const activeIds = items.map((i) => String(i.id));
      const { data: existingRows } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('user_id', uid);

      const toDelete = (existingRows || [])
        .map((r) => r.product_id)
        .filter((pid) => !activeIds.includes(pid));

      if (toDelete.length > 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', uid)
          .in('product_id', toDelete);
      }
    } catch (err) {
      console.error('Cart sync error:', err.message);
    }
  };

  const addItem = (product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cartCount,
        cartTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
