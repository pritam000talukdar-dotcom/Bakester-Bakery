/**
 * api.js — Pure async functions for every Supabase operation.
 *
 * These are NOT hooks. They are plain async functions consumed by
 * useQuery / useMutation in the custom hook layer (src/hooks/).
 *
 * Keeping them here means:
 *  1. A single place to change a query (select columns, filters, etc.)
 *  2. Easy to mock in tests
 *  3. No React import needed — they are framework-agnostic
 */

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the full product catalogue, newest first. */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Insert a new product row. */
export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Update an existing product. */
export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Delete a product by ID. */
export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS  (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all orders for a specific user (newest first). */
export async function fetchOrdersByUser(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Fetch all orders — admin view (newest first). */
export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Insert a new order row. Returns the created order. */
export async function placeOrder(payload) {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Cancel a user's own order (set status → 'Cancelled'). */
export async function cancelOrder(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Cancelled' })
    .eq('id', orderId);
  if (error) throw error;
  return { id: orderId, status: 'Cancelled' };
}

/** Admin: update order status field. */
export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
  return { id: orderId, status };
}

/** Admin: mark an order ready for pickup. */
export async function markOrderReadyForPickup(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({ ready_for_pickup: true, status: 'Shipped', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
  return { id: orderId, ready_for_pickup: true, status: 'Shipped' };
}

/** Admin: cancel an order. */
export async function adminCancelOrder(orderId) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Cancelled', cancelled_by_admin: true, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
  return { id: orderId, status: 'Cancelled', cancelled_by_admin: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch a user's profile row. */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, address, is_admin, updated_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/** Update a user's profile row. */
export async function updateProfileApi(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, full_name, phone, address, is_admin, updated_at')
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CART  (cloud sync)
// ─────────────────────────────────────────────────────────────────────────────

/** Load the cloud cart for a user and merge with localStorage. */
export async function fetchCloudCart(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity, product_data')
    .eq('user_id', userId);
  if (error) throw error;

  const cloudItems = (data || []).map((row) => ({
    ...row.product_data,
    id: row.product_id,
    quantity: row.quantity,
  }));

  // Merge cloud + local: prefer whichever has the higher quantity
  let localItems = [];
  try { localItems = JSON.parse(localStorage.getItem('bakester_cart') || '[]'); } catch { /* ignore */ }

  const merged = [...cloudItems];
  for (const local of localItems) {
    const existing = merged.find((c) => c.id === String(local.id));
    if (!existing) merged.push(local);
    else existing.quantity = Math.max(existing.quantity, local.quantity);
  }
  return merged;
}

/** Sync local cart items to the cloud (upsert + prune stale rows). */
export async function syncCartToCloud(userId, items) {
  if (items.length === 0) {
    await supabase.from('cart_items').delete().eq('user_id', userId);
    return;
  }

  const rows = items.map((item) => ({
    user_id:      userId,
    product_id:   String(item.id),
    quantity:     item.quantity,
    product_data: { id: item.id, name: item.name, price: item.price, image: item.image, category: item.category },
    updated_at:   new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase
    .from('cart_items')
    .upsert(rows, { onConflict: 'user_id,product_id' });
  if (upsertErr) throw upsertErr;

  const activeIds = items.map((i) => String(i.id));
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .not('product_id', 'in', `(${activeIds.join(',')})`);
}
