import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiImage, FiShoppingBag, FiPlus, FiEdit2, FiTrash2,
  FiUpload, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiSearch,
  FiDollarSign, FiStar, FiArrowLeft, FiHash, FiAlertTriangle,
  FiChevronUp, FiChevronDown, FiLayers,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ── Constants ────────────────────────────────────────────────
const statusColors = {
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped:    'bg-blue-50 text-blue-700 border-blue-200',
  Delivered:  'bg-green-50 text-green-700 border-green-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
};
const STATUSES   = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const CATEGORIES = ['Cakes', 'Brownies', 'Tarts', 'Celebration', 'Speciality'];

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
    </motion.div>
  );
}

// ── Quick Price / Quantity Edit cell ─────────────────────────
function InlineEdit({ value, onSave, prefix = '', type = 'number', step = '0.01', min = '0' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setVal(value); }, [value]);

  const commit = () => {
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num !== value) onSave(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {prefix && <span className="text-chocolate/40 text-sm">{prefix}</span>}
        <input
          ref={inputRef}
          type="number"
          step={step}
          min={min}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-20 px-2 py-1 border-2 border-rose-bakery rounded-lg text-sm text-chocolate outline-none text-right font-bold"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 font-bold text-chocolate hover:text-rose-bakery hover:underline transition-colors group"
      title="Click to edit"
    >
      {prefix}{typeof value === 'number' ? (step === '1' ? value : value?.toFixed(2)) : value}
      <FiEdit2 size={11} className="opacity-0 group-hover:opacity-100 text-rose-bakery transition-opacity" />
    </button>
  );
}

// ── Product Form Modal ────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        product?.name        || '',
    description: product?.description || '',
    price:       product?.price       || '',
    category:    product?.category    || 'Cakes',
    image_url:   product?.image_url   || '',
    rating:      product?.rating      || 4.5,
    badge:       product?.badge       || '',
    quantity:    product?.quantity    ?? 0,
    in_stock:    product?.in_stock    !== false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const fileRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Valid price is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        price:    Number(form.price),
        rating:   Number(form.rating),
        quantity: Number(form.quantity),
      });
      onClose();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-cream-200 sticky top-0 bg-white z-10">
          <h3 className="font-serif text-xl font-bold text-chocolate">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100 text-chocolate/50">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-chocolate/70 mb-2">Product Image</label>
            <div
              className="relative h-44 bg-cream-50 rounded-2xl border-2 border-dashed border-cream-300 flex flex-col items-center justify-center cursor-pointer hover:border-rose-bakery hover:bg-rose-pale/20 transition-all overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {form.image_url ? (
                <>
                  <img src={form.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                    <p className="text-white text-sm font-semibold">Click to change</p>
                  </div>
                </>
              ) : uploading ? (
                <div className="w-8 h-8 border-4 border-rose-pale border-t-rose-bakery rounded-full animate-spin" />
              ) : (
                <>
                  <FiUpload size={24} className="text-chocolate/30 mb-2" />
                  <p className="text-sm text-chocolate/50">Click to upload image</p>
                  <p className="text-xs text-chocolate/30">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImageUpload(e.target.files[0])} />
            <input type="url" value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="Or paste image URL…"
              className="mt-2 w-full px-4 py-2.5 rounded-xl border-2 border-cream-200 text-sm outline-none focus:border-rose-bakery bg-white text-chocolate placeholder-chocolate/30" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Product Name *</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white text-chocolate transition-all ${errors.name ? 'border-red-300' : 'border-cream-200 focus:border-rose-bakery'}`}
              placeholder="e.g. Red Velvet Dream Cake" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-200 focus:border-rose-bakery text-sm outline-none bg-white text-chocolate resize-none"
              rows={3} placeholder="Describe the product…" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-chocolate/40 text-sm">$</span>
                <input type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className={`w-full pl-7 pr-4 py-3 rounded-xl border-2 text-sm outline-none bg-white text-chocolate ${errors.price ? 'border-red-300' : 'border-cream-200 focus:border-rose-bakery'}`}
                  placeholder="0.00" />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Category</label>
              <select value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-200 focus:border-rose-bakery text-sm outline-none bg-white text-chocolate">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity + Rating + Badge */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Quantity (units)</label>
              <input type="number" step="1" min="0" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border-2 border-cream-200 focus:border-rose-bakery text-sm outline-none bg-white text-chocolate" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Rating</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border-2 border-cream-200 focus:border-rose-bakery text-sm outline-none bg-white text-chocolate" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-chocolate/70 mb-1.5">Badge</label>
              <input type="text" value={form.badge}
                onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border-2 border-cream-200 focus:border-rose-bakery text-sm outline-none bg-white text-chocolate"
                placeholder="e.g. New" />
            </div>
          </div>

          {/* In Stock toggle */}
          <div
            onClick={() => setForm((f) => ({ ...f, in_stock: !f.in_stock }))}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${form.in_stock ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
          >
            <div>
              <p className={`text-sm font-semibold ${form.in_stock ? 'text-green-700' : 'text-red-700'}`}>
                {form.in_stock ? '✓ In Stock' : '✕ Out of Stock'}
              </p>
              <p className="text-xs text-chocolate/40">Click to toggle</p>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${form.in_stock ? 'bg-green-500' : 'bg-red-400'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${form.in_stock ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving || uploading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 disabled:opacity-60">
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [toasts, setToasts]       = useState([]);

  // Products state
  const [products,        setProducts]        = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch,   setProductSearch]   = useState('');
  const [showModal,       setShowModal]        = useState(false);
  const [editingProduct,  setEditingProduct]  = useState(null);
  const [categoryFilter,  setCategoryFilter]  = useState('All');

  // Orders state
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch,   setOrderSearch]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All');

  // Images state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagesLoading,  setImagesLoading]  = useState(false);
  const dropRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0 });

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Data loaders ──────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
      setStats((s) => ({
        ...s,
        products:  data?.length || 0,
        lowStock:  (data || []).filter((p) => (p.quantity ?? 0) < 5).length,
      }));
    } catch (err) {
      addToast('Failed to load products: ' + err.message, 'error');
    } finally {
      setProductsLoading(false);
    }
  }, [addToast]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      const revenue = (data || []).reduce((s, o) => s + (o.total || 0), 0);
      setStats((s) => ({ ...s, orders: data?.length || 0, revenue }));
    } catch (err) {
      addToast('Failed to load orders: ' + err.message, 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [addToast]);

  const loadImages = useCallback(async () => {
    setImagesLoading(true);
    try {
      const { data, error } = await supabase.storage.from('product-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      setUploadedImages(
        (data || [])
          .filter((f) => f.name !== '.emptyFolderPlaceholder')
          .map((f) => ({ ...f, publicUrl: supabase.storage.from('product-images').getPublicUrl(f.name).data.publicUrl }))
      );
    } catch (err) {
      addToast('Failed to load images: ' + err.message, 'error');
    } finally {
      setImagesLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadProducts(); loadOrders(); }, [loadProducts, loadOrders]);
  useEffect(() => { if (activeTab === 'images') loadImages(); }, [activeTab, loadImages]);

  // ── Inline price/quantity update ─────────────────────────
  const handleInlineUpdate = async (productId, field, value) => {
    try {
      const { error } = await supabase.from('products')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, [field]: value } : p));
      addToast(`${field === 'price' ? 'Price' : 'Quantity'} updated!`);
    } catch (err) {
      addToast('Update failed: ' + err.message, 'error');
    }
  };

  // ── Product CRUD ─────────────────────────────────────────
  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      const { error } = await supabase.from('products')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
      if (error) throw error;
      addToast('Product updated!');
    } else {
      const { error } = await supabase.from('products').insert(formData);
      if (error) throw error;
      addToast('Product added!');
    }
    loadProducts();
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts((p) => p.filter((x) => x.id !== id));
      addToast('Product deleted.');
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    }
  };

  // ── Order status ─────────────────────────────────────────
  const handleOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      setOrders((p) => p.map((o) => o.id === orderId ? { ...o, status } : o));
      addToast(`Order updated to ${status}`);
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  // ── Image uploads ─────────────────────────────────────────
  const handleImagesDrop = async (files) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    for (const file of arr) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, { contentType: file.type });
      if (error) { addToast('Upload failed: ' + error.message, 'error'); continue; }
      addToast(`"${file.name}" uploaded!`);
    }
    loadImages();
  };

  const handleDeleteImage = async (name) => {
    if (!confirm('Delete this image?')) return;
    const { error } = await supabase.storage.from('product-images').remove([name]);
    if (error) { addToast('Delete failed: ' + error.message, 'error'); return; }
    setUploadedImages((p) => p.filter((i) => i.name !== name));
    addToast('Image deleted.');
  };

  // ── Filters ───────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch   = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredOrders = orders.filter((o) => {
    const matchSearch = !orderSearch || o.order_number?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { id: 'inventory', label: 'Inventory',     icon: FiLayers },
    { id: 'orders',    label: 'Orders',         icon: FiShoppingBag },
    { id: 'images',    label: 'Image Library',  icon: FiImage },
  ];

  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  };

  return (
    <main className="pt-20 min-h-screen bg-[#0f0f13]">
      {/* Toast */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />)}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            onSave={handleSaveProduct}
          />
        )}
      </AnimatePresence>

      {/* ── Dark Header Bar ── */}
      <div className="bg-[#1a1a24] border-b border-white/5 sticky top-[64px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <FiArrowLeft size={12} /> Back to Store
              </Link>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-rose-bakery rounded-lg flex items-center justify-center">
                  <FiLayers size={12} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white">Inventory Management</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-bakery flex items-center justify-center text-white text-xs font-bold">
                {getUserInitials()}
              </div>
              <span className="text-xs text-white/50 hidden sm:block">{profile?.full_name || user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FiPackage,       label: 'Total Products', value: stats.products,            color: 'from-rose-bakery to-rose-dark',     text: 'text-white' },
            { icon: FiShoppingBag,   label: 'Total Orders',   value: stats.orders,              color: 'from-amber-500 to-amber-600',       text: 'text-white' },
            { icon: FiDollarSign,    label: 'Revenue',         value: `$${stats.revenue.toFixed(2)}`, color: 'from-emerald-500 to-emerald-600', text: 'text-white' },
            { icon: FiAlertTriangle, label: 'Low Stock (< 5)', value: stats.lowStock,            color: 'from-slate-700 to-slate-800',       text: 'text-white' },
          ].map((s) => (
            <motion.div key={s.label} whileHover={{ y: -2 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 flex items-center gap-4 shadow-lg`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <s.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">{s.label}</p>
                <p className="text-white font-serif text-2xl font-bold">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#1a1a24] rounded-2xl mb-6 w-fit border border-white/5">
          {tabs.map((tab) => (
            <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-rose-bakery text-white shadow-rose'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* ══════════ INVENTORY TAB ══════════════════════════ */}
        {activeTab === 'inventory' && (
          <div className="bg-[#1a1a24] rounded-3xl border border-white/5 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
              <h2 className="font-serif text-xl font-bold text-white">Product Inventory</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 flex-1 sm:flex-none">
                  <FiSearch size={13} className="text-white/30" />
                  <input type="text" value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products…"
                    className="bg-transparent text-sm outline-none text-white placeholder-white/20 w-36" />
                </div>
                {/* Category filter */}
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 outline-none cursor-pointer">
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Add */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-bakery text-white text-sm font-semibold hover:bg-rose-dark transition-all shadow-rose whitespace-nowrap">
                  <FiPlus size={15} /> Add Product
                </motion.button>
                <button onClick={loadProducts} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>

            {productsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">🎂</p>
                <p className="font-serif text-xl font-bold text-white mb-2">No products found</p>
                <p className="text-white/40 text-sm mb-4">Add your first product to get started.</p>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="btn-primary">Add First Product</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs font-semibold uppercase tracking-wider">
                      <th className="text-left px-6 py-3">Product</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-right px-4 py-3">Price</th>
                      <th className="text-center px-4 py-3">Quantity</th>
                      <th className="text-center px-4 py-3">Rating</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-right px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((product) => {
                      const isLowStock = (product.quantity ?? 0) < 5;
                      return (
                        <motion.tr key={product.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} className="transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-xl">🎂</div>
                              )}
                              <div>
                                <p className="font-semibold text-white">{product.name}</p>
                                {product.badge && (
                                  <span className="text-[10px] px-2 py-0.5 bg-rose-bakery/20 text-rose-bakery rounded-full font-semibold">{product.badge}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-white/40">{product.category}</td>
                          {/* Inline price edit */}
                          <td className="px-4 py-4 text-right">
                            <InlineEdit
                              value={product.price}
                              prefix="$"
                              step="0.01"
                              onSave={(v) => handleInlineUpdate(product.id, 'price', v)}
                            />
                          </td>
                          {/* Inline quantity edit */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <InlineEdit
                                value={product.quantity ?? 0}
                                step="1"
                                onSave={(v) => handleInlineUpdate(product.id, 'quantity', v)}
                              />
                              {isLowStock && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-semibold">Low</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="flex items-center justify-center gap-1 text-white/50">
                              <FiStar size={11} className="text-yellow-400" />
                              {product.rating}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleInlineUpdate(product.id, 'in_stock', !product.in_stock)}
                              className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                                product.in_stock
                                  ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                                  : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'
                              }`}
                            >
                              {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => { setEditingProduct(product); setShowModal(true); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-rose-bakery/20 hover:text-rose-bakery transition-all">
                                <FiEdit2 size={13} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all">
                                <FiTrash2 size={13} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-white/5 text-xs text-white/20">
                  Showing {filteredProducts.length} of {products.length} products · Click price or quantity to edit inline
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ ORDERS TAB ═════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="bg-[#1a1a24] rounded-3xl border border-white/5 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
              <h2 className="font-serif text-xl font-bold text-white">All Customer Orders</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <FiSearch size={13} className="text-white/30" />
                  <input type="text" value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order…"
                    className="bg-transparent text-sm outline-none text-white placeholder-white/20 w-32" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 outline-none cursor-pointer">
                  <option value="All">All Statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={loadOrders} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>

            {ordersLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">📦</p>
                <p className="font-serif text-xl font-bold text-white mb-2">No orders yet</p>
                <p className="text-white/30 text-sm">Orders will appear here once customers place them.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs font-semibold uppercase tracking-wider">
                      <th className="text-left px-6 py-3">Order</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Address</th>
                      <th className="text-right px-4 py-3">Total</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-center px-6 py-3">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.map((order) => (
                      <motion.tr key={order.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} className="transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{order.order_number}</p>
                          <p className="text-xs text-white/20">{order.user_id?.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-4 text-white/40">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4 text-white/40 max-w-[160px] truncate">{order.address || '—'}</td>
                        <td className="px-4 py-4 text-right font-bold text-white">${order.total?.toFixed(2)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusColors[order.status] || statusColors.Processing}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select value={order.status} onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 outline-none cursor-pointer hover:border-rose-bakery transition-all">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-white/5 text-xs text-white/20">
                  {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} · Total revenue: ${stats.revenue.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ IMAGES TAB ═════════════════════════════ */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            {/* Drop zone */}
            <div ref={dropRef}
              className="bg-[#1a1a24] border-2 border-dashed border-white/10 hover:border-rose-bakery rounded-3xl p-10 text-center cursor-pointer transition-all"
              onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('border-rose-bakery', 'bg-rose-bakery/5'); }}
              onDragLeave={() => dropRef.current?.classList.remove('border-rose-bakery', 'bg-rose-bakery/5')}
              onDrop={(e) => { e.preventDefault(); dropRef.current?.classList.remove('border-rose-bakery', 'bg-rose-bakery/5'); handleImagesDrop(e.dataTransfer.files); }}
            >
              <div className="w-16 h-16 bg-rose-bakery/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiUpload size={28} className="text-rose-bakery" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Upload Product Images</h3>
              <p className="text-white/30 text-sm mb-5">Drag and drop images here, or click to browse</p>
              <label className="btn-primary cursor-pointer">
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => handleImagesDrop(e.target.files)} />
                Browse Files
              </label>
              <p className="text-xs text-white/20 mt-3">PNG, JPG, WEBP up to 5MB each</p>
            </div>

            {/* Image grid */}
            <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-xl font-bold text-white">Image Library <span className="text-white/30 text-sm font-normal">({uploadedImages.length})</span></h3>
                <button onClick={loadImages} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors">
                  <FiRefreshCw size={13} /> Refresh
                </button>
              </div>
              {imagesLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : uploadedImages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🖼️</p>
                  <p className="text-white/30 text-sm">No images yet. Upload some above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {uploadedImages.map((img) => (
                    <motion.div key={img.name} whileHover={{ scale: 1.03 }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 shadow-sm border border-white/5">
                      <img src={img.publicUrl} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <button onClick={() => { navigator.clipboard.writeText(img.publicUrl); addToast('URL copied!'); }}
                          className="w-full py-1.5 rounded-lg bg-white text-chocolate text-xs font-semibold hover:bg-cream-50 transition-all">
                          Copy URL
                        </button>
                        <button onClick={() => handleDeleteImage(img.name)}
                          className="w-full py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all">
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
