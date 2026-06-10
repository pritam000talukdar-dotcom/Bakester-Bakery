import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiImage, FiShoppingBag, FiPlus, FiEdit2, FiTrash2,
  FiUpload, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiSearch,
  FiDollarSign, FiStar, FiArrowLeft, FiAlertTriangle,
  FiLayers, FiBarChart2, FiGrid, FiMenu,
  FiTrendingUp, FiDownload,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ── Constants ────────────────────────────────────────────────
const statusColors = {
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped:    'bg-blue-50 text-blue-700 border-blue-200',
  Delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
};
const statusDot = {
  Processing: 'bg-amber-400',
  Shipped:    'bg-blue-400',
  Delivered:  'bg-emerald-400',
  Cancelled:  'bg-red-400',
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
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
    </motion.div>
  );
}

// ── Inline Price / Quantity Edit ─────────────────────────────
function InlineEdit({ value, onSave, prefix = '', step = '0.01' }) {
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
  if (editing) return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-gray-400 text-sm">{prefix}</span>}
      <input ref={inputRef} type="number" step={step} min="0" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 px-2 py-1 border-2 border-rose-400 rounded-lg text-sm outline-none text-right font-bold text-gray-800 bg-white" />
    </div>
  );
  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 font-semibold text-gray-800 hover:text-rose-500 transition-colors group"
      title="Click to edit">
      {prefix}{typeof value === 'number' ? (step === '1' ? value : value?.toFixed(2)) : value}
      <FiEdit2 size={10} className="opacity-0 group-hover:opacity-100 text-rose-400 transition-opacity ml-0.5" />
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
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});
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
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file, { contentType: file.type });
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
      await onSave({ ...form, price: Number(form.price), rating: Number(form.rating), quantity: Number(form.quantity) });
      onClose();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><FiX size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Image</label>
            <div className="relative h-36 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/30 transition-all overflow-hidden"
              onClick={() => fileRef.current?.click()}>
              {form.image_url ? (
                <>
                  <img src={form.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                    <p className="text-white text-sm font-semibold">Click to change</p>
                  </div>
                </>
              ) : uploading ? (
                <div className="w-7 h-7 border-2 border-gray-200 border-t-rose-400 rounded-full animate-spin" />
              ) : (
                <>
                  <FiUpload size={22} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Click to upload</p>
                  <p className="text-xs text-gray-300">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0])} />
            <input type="url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="Or paste image URL…"
              className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-rose-400 bg-white text-gray-800 placeholder-gray-300" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white text-gray-800 transition-all ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-rose-400'}`}
              placeholder="e.g. Red Velvet Dream Cake" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-rose-400 text-sm outline-none bg-white text-gray-800 resize-none"
              rows={3} placeholder="Describe the product…" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" step="1" min="0" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className={`w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm outline-none bg-white text-gray-800 ${errors.price ? 'border-red-300' : 'border-gray-200 focus:border-rose-400'}`}
                  placeholder="0" />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-rose-400 text-sm outline-none bg-white text-gray-800">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Qty + Rating + Badge */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity</label>
              <input type="number" step="1" min="0" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-rose-400 text-sm outline-none bg-white text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rating</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-rose-400 text-sm outline-none bg-white text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Badge</label>
              <input type="text" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-rose-400 text-sm outline-none bg-white text-gray-800"
                placeholder="e.g. New" />
            </div>
          </div>

          {/* In Stock Toggle */}
          <div onClick={() => setForm((f) => ({ ...f, in_stock: !f.in_stock }))}
            className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${form.in_stock ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold ${form.in_stock ? 'text-emerald-700' : 'text-red-700'}`}>
              {form.in_stock ? '✓ In Stock' : '✕ Out of Stock'}
            </p>
            <div className={`w-10 h-5 rounded-full transition-colors ${form.in_stock ? 'bg-emerald-500' : 'bg-red-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${form.in_stock ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <motion.button type="submit" disabled={saving || uploading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-60 transition-all hover:bg-gray-800">
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor = 'text-emerald-600', icon: Icon, iconBg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={14} className="text-gray-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

// ── Mobile card for a product row ────────────────────────────
function ProductCard({ product, onEdit, onDelete, onInlineUpdate }) {
  const isLowStock = (product.quantity ?? 0) > 0 && (product.quantity ?? 0) < 5;
  const isOut = !product.in_stock || (product.quantity ?? 0) === 0;
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isOut ? 'border-red-100' : isLowStock ? 'border-amber-100' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🎂</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onEdit(product)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                <FiEdit2 size={12} />
              </button>
              <button onClick={() => onDelete(product.id, product.name)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                <FiTrash2 size={12} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Price */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-400">₹</span>
              <InlineEdit value={product.price} step="1"
                onSave={(v) => onInlineUpdate(product.id, 'price', v)} />
            </div>

            {/* Qty */}
            <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${isLowStock ? 'bg-amber-50' : isOut ? 'bg-red-50' : 'bg-gray-50'}`}>
              <span className={`text-xs ${isLowStock ? 'text-amber-500' : isOut ? 'text-red-500' : 'text-gray-400'}`}>Qty:</span>
              <InlineEdit value={product.quantity ?? 0} step="1"
                onSave={(v) => onInlineUpdate(product.id, 'quantity', v)} />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
              <FiStar size={10} className="text-amber-400" />
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>

            {/* Status toggle */}
            <button onClick={() => onInlineUpdate(product.id, 'in_stock', !product.in_stock)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                product.in_stock
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </button>

            {isLowStock && <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-semibold">Low</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile card for an order row ─────────────────────────────
function OrderCard({ order, onStatusChange }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${statusDot[order.status] || 'bg-gray-300'}`} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">₹{order.total?.toFixed(0)}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusColors[order.status] || statusColors.Processing}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Guest info */}
      {(order.guest_name || order.address) && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
          {order.guest_name && <p>👤 {order.guest_name}{order.guest_phone ? ` · ${order.guest_phone}` : ''}</p>}
          {order.address && <p>📍 {order.address}</p>}
        </div>
      )}

      {/* Items mini preview */}
      {Array.isArray(order.items) && order.items.length > 0 && (
        <p className="text-xs text-gray-400">
          {order.items.map((i) => `${i.name} ×${i.qty || 1}`).join(', ')}
        </p>
      )}

      {/* Status changer */}
      <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)}
        className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer">
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Products
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch]     = useState('');
  const [showModal, setShowModal]             = useState(false);
  const [editingProduct, setEditingProduct]   = useState(null);
  const [categoryFilter, setCategoryFilter]   = useState('All');

  // Orders
  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');

  // Images
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagesLoading, setImagesLoading]   = useState(false);
  const dropRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0, outOfStock: 0 });

  const addToast    = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Loaders ──────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
      setStats((s) => ({
        ...s,
        products:   data?.length || 0,
        lowStock:   (data || []).filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 5).length,
        outOfStock: (data || []).filter((p) => !p.in_stock || (p.quantity ?? 0) === 0).length,
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
        (data || []).filter((f) => f.name !== '.emptyFolderPlaceholder')
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

  // ── CRUD Handlers ────────────────────────────────────────
  const handleInlineUpdate = async (productId, field, value) => {
    try {
      const extra = {};
      if (field === 'quantity') { extra.in_stock = Number(value) > 0; }
      const { error } = await supabase
        .from('products')
        .update({ [field]: value, ...extra, updated_at: new Date().toISOString() })
        .eq('id', productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, [field]: value, ...extra } : p));
      addToast(
        field === 'price'
          ? 'Price updated!'
          : `Quantity updated! ${Number(value) === 0 ? '(Marked out of stock)' : Number(value) < 5 ? '(Low stock warning)' : ''}`
      );
    } catch (err) {
      addToast('Update failed: ' + err.message, 'error');
    }
  };

  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      const { error } = await supabase.from('products').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editingProduct.id);
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

  // ── Filters ──────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch   = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchSearch = !orderSearch ||
      o.order_number?.toLowerCase().includes(q) ||
      o.guest_name?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Derived dashboard data ───────────────────────────────
  const recentOrders   = orders.slice(0, 5);
  const topProducts    = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  const categoryGroups = CATEGORIES.map((cat) => ({
    name: cat, count: products.filter((p) => p.category === cat).length,
  }));

  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',    icon: FiGrid },
    { id: 'inventory', label: 'Inventory',    icon: FiLayers },
    { id: 'orders',    label: 'Orders',       icon: FiShoppingBag },
    { id: 'images',    label: 'Images',       icon: FiImage },
    { id: 'analytics', label: 'Analytics',    icon: FiBarChart2 },
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // ── Low stock items ──────────────────────────────────────
  const lowStockItems  = products.filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 5);
  const outOfStockItems = products.filter((p) => !p.in_stock || (p.quantity ?? 0) === 0);

  return (
    <div className="min-h-screen bg-gray-50 flex pt-16">

      {/* ── Toast Stack ── */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[300] flex flex-col gap-2 max-w-xs">
        <AnimatePresence>
          {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />)}
        </AnimatePresence>
      </div>

      {/* ── Product Modal ── */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            onSave={handleSaveProduct}
          />
        )}
      </AnimatePresence>

      {/* ══════════ MOBILE SIDEBAR OVERLAY ═══════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col lg:hidden shadow-2xl"
            >
              <SidebarContent
                navItems={navItems} activeTab={activeTab}
                onTabChange={handleTabChange}
                profileName={profile?.full_name || 'Admin'}
                initials={getUserInitials()}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ DESKTOP SIDEBAR ══════════════════════════ */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col fixed top-16 bottom-0 left-0 z-30">
        <SidebarContent
          navItems={navItems} activeTab={activeTab}
          onTabChange={handleTabChange}
          profileName={profile?.full_name || 'Admin'}
          initials={getUserInitials()}
        />
      </aside>

      {/* ══════════ MAIN CONTENT ═════════════════════════════ */}
      <main className="flex-1 lg:ml-56 p-4 sm:p-6 overflow-auto pb-20 lg:pb-6">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm text-gray-600"
          >
            <FiMenu size={18} />
          </button>
          <p className="font-bold text-gray-800 text-sm capitalize">{activeTab}</p>
          <button
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm"
          >
            <FiPlus size={18} />
          </button>
        </div>

        {/* ─────────── DASHBOARD TAB ─────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bakery Management</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">
                  Monitor stock, manage products and track orders.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => { loadProducts(); loadOrders(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all">
                  <FiRefreshCw size={13} /> Refresh
                </button>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all">
                  <FiPlus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Stat Cards — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Products"     value={stats.products}
                sub="Active listings" subColor="text-emerald-600"
                icon={FiPackage} iconBg="bg-gray-100" />
              <StatCard label="Low Stock"    value={stats.lowStock}
                sub={stats.lowStock > 0 ? 'Restock soon' : 'All good ✓'}
                subColor={stats.lowStock > 0 ? 'text-amber-500' : 'text-emerald-600'}
                icon={FiAlertTriangle} iconBg="bg-amber-50" />
              <StatCard label="Out of Stock" value={stats.outOfStock}
                sub={stats.outOfStock > 0 ? 'Needs attention' : 'None out ✓'}
                subColor={stats.outOfStock > 0 ? 'text-red-500' : 'text-emerald-600'}
                icon={FiAlertCircle} iconBg="bg-red-50" />
              <StatCard label="Revenue"      value={`₹${stats.revenue.toFixed(0)}`}
                sub={`${stats.orders} orders`} subColor="text-emerald-600"
                icon={FiDollarSign} iconBg="bg-emerald-50" />
            </div>

            {/* Stock Overview + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Stock Overview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Stock Overview</h2>
                    <p className="text-xs text-gray-400">Inventory by category</p>
                  </div>
                  <button onClick={() => setActiveTab('inventory')}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-all">
                    <FiDownload size={11} /> View All
                  </button>
                </div>
                {productsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {categoryGroups.map((cat) => {
                      const maxCount = Math.max(...categoryGroups.map((c) => c.count), 1);
                      const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                      return (
                        <div key={cat.name} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">{cat.name}</span>
                            <span className="text-xs text-gray-400">{cat.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-800 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-1">Quick Actions</h2>
                <p className="text-xs text-gray-400 mb-4">Common tasks</p>
                <div className="space-y-2">
                  {[
                    { icon: FiPlus,       label: 'Add New Product',  action: () => { setEditingProduct(null); setShowModal(true); } },
                    { icon: FiLayers,     label: 'Manage Inventory', action: () => setActiveTab('inventory') },
                    { icon: FiShoppingBag,label: 'View Orders',      action: () => setActiveTab('orders') },
                    { icon: FiImage,      label: 'Upload Images',    action: () => setActiveTab('images') },
                  ].map((item) => (
                    <button key={item.label} onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 transition-all text-left">
                      <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <item.icon size={12} className="text-gray-500" />
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders + Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Orders */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
                    <p className="text-xs text-gray-400">Latest customer orders</p>
                  </div>
                  <button onClick={() => setActiveTab('orders')}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium">
                    View all →
                  </button>
                </div>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-sm text-gray-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[order.status] || 'bg-gray-300'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{order.order_number}</p>
                            <p className="text-xs text-gray-400">
                              {order.guest_name || 'Customer'} ·{' '}
                              {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`hidden sm:inline text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColors[order.status] || statusColors.Processing}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-bold text-gray-900">₹{order.total?.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-gray-800">Top Products</h2>
                  <p className="text-xs text-gray-400">Best rated items</p>
                </div>
                {productsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No products yet</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🎂</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">₹{product.price?.toFixed(0)}</p>
                          <p className="text-xs text-amber-500 flex items-center justify-end gap-0.5">
                            <FiStar size={9} /> {product.rating}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────── INVENTORY TAB ─────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Product Inventory</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Manage products, pricing and stock</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={loadProducts} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 transition-all"><FiRefreshCw size={14} /></button>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all">
                  <FiPlus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* ── Low Stock Alert Section ── */}
            {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
              <div className="space-y-3">
                {outOfStockItems.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FiAlertCircle size={15} className="text-red-500 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-red-700">Out of Stock ({outOfStockItems.length})</h3>
                      <span className="text-xs text-red-400 ml-auto hidden sm:inline">Hidden from users</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {outOfStockItems.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 border border-red-100">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎂</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-red-500">Qty: 0</p>
                          </div>
                          <InlineEdit value={p.quantity ?? 0} step="1" onSave={(v) => handleInlineUpdate(p.id, 'quantity', v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lowStockItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FiAlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-amber-700">Low Stock ({lowStockItems.length})</h3>
                      <span className="text-xs text-amber-400 ml-auto hidden sm:inline">Less than 5 units</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {lowStockItems.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 border border-amber-100">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎂</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-amber-600">Only {p.quantity} left</p>
                          </div>
                          <InlineEdit value={p.quantity ?? 0} step="1" onSave={(v) => handleInlineUpdate(p.id, 'quantity', v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 flex-1 min-w-[140px]">
                <FiSearch size={13} className="text-gray-400 flex-shrink-0" />
                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products…"
                  className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-300 w-full" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer">
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="text-xs text-gray-400 ml-auto">{filteredProducts.length}/{products.length}</div>
            </div>

            {/* Products — Desktop: table | Mobile: cards */}
            {productsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map((i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
                <p className="text-4xl mb-3">🎂</p>
                <p className="font-semibold text-gray-700 mb-1">No products found</p>
                <p className="text-sm text-gray-400 mb-4">Add your first product to get started.</p>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">Add Product</button>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id} product={product}
                      onEdit={(p) => { setEditingProduct(p); setShowModal(true); }}
                      onDelete={handleDeleteProduct}
                      onInlineUpdate={handleInlineUpdate}
                    />
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="text-left px-5 py-3">Product</th>
                        <th className="text-left px-4 py-3">Category</th>
                        <th className="text-right px-4 py-3">Price (₹)</th>
                        <th className="text-center px-4 py-3">Qty</th>
                        <th className="text-center px-4 py-3">Rating</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((product) => {
                        const isLowStock = (product.quantity ?? 0) > 0 && (product.quantity ?? 0) < 5;
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {product.image_url
                                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-base">🎂</div>}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 leading-tight">{product.name}</p>
                                  {product.badge && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded font-semibold">{product.badge}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-400 text-xs">{product.category}</td>
                            <td className="px-4 py-3.5 text-right">
                              <InlineEdit value={product.price} prefix="₹" step="1"
                                onSave={(v) => handleInlineUpdate(product.id, 'price', v)} />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <InlineEdit value={product.quantity ?? 0} step="1"
                                  onSave={(v) => handleInlineUpdate(product.id, 'quantity', v)} />
                                {isLowStock && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-semibold">Low</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="flex items-center justify-center gap-1 text-gray-500 text-xs">
                                <FiStar size={10} className="text-amber-400" />{product.rating}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => handleInlineUpdate(product.id, 'in_stock', !product.in_stock)}
                                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                                  product.in_stock
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                }`}>
                                {product.in_stock ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setEditingProduct(product); setShowModal(true); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                                  <FiEdit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id, product.name)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredProducts.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-300">
                      {filteredProducts.length} products · Click price or qty to edit inline
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─────────── ORDERS TAB ────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">All Orders</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Manage and update customer orders</p>
              </div>
              <button onClick={loadOrders} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 transition-all">
                <FiRefreshCw size={14} />
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 flex-1 min-w-[140px]">
                <FiSearch size={13} className="text-gray-400 flex-shrink-0" />
                <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order, name…"
                  className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-300 w-full" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none cursor-pointer">
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-xs text-gray-400 ml-auto hidden sm:block">
                {filteredOrders.length} orders · ₹{stats.revenue.toFixed(0)}
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-semibold text-gray-700 mb-1">No orders yet</p>
                <p className="text-sm text-gray-400">Orders will appear here once customers place them.</p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="space-y-3 lg:hidden">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleOrderStatus} />
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="text-left px-5 py-3">Order</th>
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">Address</th>
                        <th className="text-right px-4 py-3">Total</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-center px-5 py-3">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[order.status] || 'bg-gray-300'}`} />
                              <p className="font-semibold text-gray-800 text-xs">{order.order_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">
                            <p>{order.guest_name || (order.user_id ? 'User' : 'Guest')}</p>
                            {order.guest_phone && <p className="text-gray-400">{order.guest_phone}</p>}
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs max-w-[150px] truncate">{order.address || '—'}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-gray-900">₹{order.total?.toFixed(0)}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[order.status] || statusColors.Processing}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <select value={order.status} onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none cursor-pointer hover:border-gray-400 transition-all">
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─────────── IMAGES TAB ────────────────────────── */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Image Library</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Upload and manage product images</p>
            </div>

            {/* Drop Zone */}
            <div ref={dropRef}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 p-8 sm:p-10 text-center cursor-pointer transition-all"
              onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('border-gray-800', 'bg-gray-50'); }}
              onDragLeave={() => dropRef.current?.classList.remove('border-gray-800', 'bg-gray-50')}
              onDrop={(e) => { e.preventDefault(); dropRef.current?.classList.remove('border-gray-800', 'bg-gray-50'); handleImagesDrop(e.dataTransfer.files); }}>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiUpload size={22} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">Upload Product Images</h3>
              <p className="text-xs text-gray-400 mb-4 hidden sm:block">Drag and drop images here, or click to browse</p>
              <label className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-all">
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImagesDrop(e.target.files)} />
                Browse Files
              </label>
              <p className="text-xs text-gray-300 mt-3">PNG, JPG, WEBP up to 5MB each</p>
            </div>

            {/* Image Grid */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">
                  Uploaded Images <span className="text-gray-400 font-normal">({uploadedImages.length})</span>
                </h2>
                <button onClick={loadImages} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  <FiRefreshCw size={12} /> Refresh
                </button>
              </div>
              {imagesLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {[1,2,3,4,5].map((i) => <div key={i} className="aspect-square bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : uploadedImages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm text-gray-400">No images yet. Upload some above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedImages.map((img) => (
                    <motion.div key={img.name} whileHover={{ scale: 1.02 }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={img.publicUrl} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <button onClick={() => { navigator.clipboard.writeText(img.publicUrl); addToast('URL copied!'); }}
                          className="w-full py-1.5 rounded-lg bg-white text-gray-800 text-xs font-semibold hover:bg-gray-100 transition-all">
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

        {/* ─────────── ANALYTICS TAB ─────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Store performance overview</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Total Orders',   value: stats.orders,                                                                      icon: FiShoppingBag,  color: 'bg-blue-50 text-blue-600' },
                { label: 'Revenue',        value: `₹${stats.revenue.toFixed(0)}`,                                                    icon: FiDollarSign,   color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Avg Order',      value: stats.orders > 0 ? `₹${(stats.revenue / stats.orders).toFixed(0)}` : '₹0',        icon: FiTrendingUp,   color: 'bg-violet-50 text-violet-600' },
                { label: 'Products',       value: stats.products,                                                                    icon: FiPackage,      color: 'bg-amber-50 text-amber-600' },
                { label: 'Low Stock',      value: stats.lowStock,                                                                    icon: FiAlertTriangle,color: 'bg-orange-50 text-orange-600' },
                { label: 'Out of Stock',   value: stats.outOfStock,                                                                  icon: FiAlertCircle,  color: 'bg-red-50 text-red-600' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    <p className="text-xl font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Order Status Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATUSES.map((status) => {
                  const count = orders.filter((o) => o.status === status).length;
                  const pct   = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${statusDot[status]}`} />
                      <p className="text-xs text-gray-500 font-medium">{status}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
                      <p className="text-xs text-gray-400">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ══════════ MOBILE BOTTOM NAV ════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative ${
              activeTab === item.id ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-900 rounded-full"
              />
            )}
            <item.icon size={activeTab === item.id ? 20 : 18} strokeWidth={activeTab === item.id ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium leading-none ${activeTab === item.id ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
}

// ── Extracted Sidebar Content ────────────────────────────────
function SidebarContent({ navItems, activeTab, onTabChange, profileName, initials }) {
  return (
    <>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-none truncate">{profileName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Bakester Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              activeTab === item.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}>
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Back to store */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
          <FiArrowLeft size={14} />
          Back to Store
        </Link>
      </div>
    </>
  );
}
