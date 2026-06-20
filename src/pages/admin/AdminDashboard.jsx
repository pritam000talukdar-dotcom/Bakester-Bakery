import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiImage, FiShoppingBag, FiPlus, FiEdit2, FiTrash2,
  FiUpload, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiSearch,
  FiDollarSign, FiStar, FiArrowLeft, FiAlertTriangle,
  FiLayers, FiBarChart2, FiGrid, FiMenu,
  FiTrendingUp, FiDownload, FiBell, FiInfo,
  FiMessageSquare, FiToggleLeft, FiToggleRight, FiXCircle, FiCheckCircle, FiClock,
  FiUsers, FiRepeat, FiHeart, FiAward, FiShoppingCart, FiTrash, FiCalendar,
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ── Stock buffer — users see this many fewer units than the DB holds ──────────
const STOCK_BUFFER = 5;

// ── Notification helpers ──────────────────────────────────────────────────────
const NOTIF_STORAGE_KEY = 'bakester_admin_notifications';
function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveNotifications(notifs) {
  try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs.slice(0, 50))); } catch {}
}
function buildNotification(message, entityId, type = 'out_of_stock') {
  const displayMessage =
    type === 'out_of_stock'
      ? `"${message}" is now Out of Stock!`
      : message; // ready_pickup and cancelled pass the full message directly
  return {
    id: `${entityId}_${Date.now()}`,
    entityId,
    type,
    message: displayMessage,
    time: new Date().toISOString(),
    read: false,
    // For order notifications, clicking the bell will jump to orders tab
    targetTab: (type === 'ready_pickup' || type === 'cancelled') ? 'orders' : null,
  };
}

const playNotificationSound = () => {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.warn('Audio play blocked by browser:', e));
  } catch (e) {}
};

// ── Constants ────────────────────────────────────────────────
const statusColors = {
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};
const statusDot = {
  Processing: 'bg-amber-400',
  Shipped: 'bg-blue-400',
  Delivered: 'bg-emerald-400',
  Cancelled: 'bg-red-400',
};
const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const CATEGORIES = ['Cakes', 'Brownies', 'Tarts', 'Celebration', 'Speciality'];

// ── Admin Purchases (raw material orders) — localStorage ──────
const ADMIN_PURCHASES_KEY = 'bakester_admin_purchases';
function loadAdminPurchases() {
  try {
    const raw = localStorage.getItem(ADMIN_PURCHASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveAdminPurchases(list) {
  try { localStorage.setItem(ADMIN_PURCHASES_KEY, JSON.stringify(list)); } catch {}
}

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
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
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
      {prefix && <span className="text-white text-sm">{prefix}</span>}
      <input ref={inputRef} type="number" step={step} min="0" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 px-2 py-1 border-2 border-rose-400 rounded-lg text-sm outline-none text-right font-bold text-white bg-transparent" />
    </div>
  );
  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 font-semibold text-white hover:text-white transition-colors group"
      title="Click to edit">
      {prefix}{typeof value === 'number' ? (step === '1' ? value : value?.toFixed(2)) : value}
      <FiEdit2 size={10} className="opacity-0 group-hover:opacity-100 text-rose-400 transition-opacity ml-0.5" />
    </button>
  );
}

// ── Product Form Modal ────────────────────────────────────────
function ProductModal({ product, onClose, onSave, isDark, T }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'Cakes',
    image_url: product?.image_url || '',
    rating: product?.rating || 4.5,
    badge: product?.badge || '',
    quantity: product?.quantity ?? 0,
    in_stock: product?.in_stock !== false,
    recipe: product?.recipe || '',
    weight_g: product?.weight_g || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
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
      const publicUrl = data.publicUrl;

      // ── Permanent fix: immediately save image_url to DB for existing products ──
      // This ensures the image is always linked even if the form save fails later.
      if (product?.id) {
        await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', product.id);
      }

      setForm((f) => ({ ...f, image_url: publicUrl }));
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
        price:    Number(form.price)    || 0,
        rating:   Number(form.rating)   || null,
        quantity: Number(form.quantity) || 0,
        // weight_g is an integer column — send null instead of empty string
        weight_g: form.weight_g !== '' && form.weight_g !== null ? Number(form.weight_g) : null,
        // badge — trim and send null if empty so DB stays clean
        badge:    form.badge?.trim() || null,
      });
      onClose();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const modalBg = T?.card || '#fff';
  const modalBorder = T?.cardBorder || '#e5e7eb';
  const inputBg = T?.input || '#fff';
  const inputBdr = T?.inputBorder || '#e5e7eb';
  const labelColor = T?.textSub || '#6b7280';
  const titleColor = T?.text || '#111827';
  const accentColor = T?.accent || '#7c3aed';
  const tagBg = T?.tagBg || '#f3f4f6';
  const inputStyle = { background: inputBg, borderColor: inputBdr, color: titleColor };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: modalBg }}
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: modalBg, borderBottom: `1px solid ${modalBorder}` }}>
          <h3 className="text-base font-bold" style={{ color: titleColor }}>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: labelColor }}
            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1" style={{ background: modalBg }}>
          {/* Image */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: labelColor }}>Product Image</label>
            <div className="relative h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
              style={{ background: tagBg, borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb' }}
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
                  <FiUpload size={22} className="mb-2" style={{ color: labelColor }} />
                  <p className="text-sm" style={{ color: labelColor }}>Click to upload</p>
                  <p className="text-xs" style={{ color: T?.textMuted || '#9ca3af' }}>PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0])} />
            <input type="url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="Or paste image URL…"
              className="mt-2 w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
              style={{ ...inputStyle, borderColor: errors.name ? '#9c5555ff' : inputBdr }}
              placeholder="e.g. Red Velvet Dream Cake" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={inputStyle}
              rows={3} placeholder="Describe the product…" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: labelColor }}>₹</span>
                <input type="number" step="1" min="0" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ ...inputStyle, borderColor: errors.price ? '#f87171' : inputBdr }}
                  placeholder="0" />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Qty + Rating + Badge */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Quantity</label>
              <input type="number" step="1" min="0" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={inputStyle} />
              <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: T?.textMuted || '#9ca3af' }}>
                <FiInfo size={9} />
                Users see {Math.max(0, Number(form.quantity || 0) - STOCK_BUFFER)} (actual&nbsp;−&nbsp;{STOCK_BUFFER})
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Rating</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Badge</label>
              <input type="text" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
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

          {/* Weight (for servings calc) */}
          {(form.category === 'Speciality' || form.category === 'Cakes' || form.category === 'Celebration') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Cake Weight (grams)</label>
              <input type="number" step="50" min="0" value={form.weight_g}
                onChange={(e) => setForm((f) => ({ ...f, weight_g: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
                placeholder="e.g. 500" />
              <p className="text-xs mt-1" style={{ color: T?.textMuted || '#9ca3af' }}>Used to estimate servings (approx 85g per person)</p>
            </div>
          )}

          {/* Recipe — shown when Speciality category */}
          {form.category === 'Speciality' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: labelColor }}>Recipe / How It's Made 👩‍🍳</label>
              <textarea value={form.recipe} onChange={(e) => setForm((f) => ({ ...f, recipe: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
                style={inputStyle}
                rows={5} placeholder="Describe the key ingredients, process, and what makes this cake special..." />
              <p className="text-xs mt-1" style={{ color: T?.textMuted || '#9ca3af' }}>This recipe story is shown to customers on the speciality cakes page.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all"
              style={{ borderColor: modalBorder, color: labelColor, background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              Cancel
            </button>
            <motion.button type="submit" disabled={saving || uploading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all"
              style={{ background: accentColor }}>
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Stat Card (matches wireframe layout) ────────────────────────────
function StatCard({ label, value, sub, subIcon: SubIcon, subColor, icon: Icon, iconColor, T, isDark }) {
  return (
    <div className="rounded-3xl border p-6 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: T?.statCard || (isDark ? '#18181b' : '#ffffff'),
        borderColor: T?.cardBorder || (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
        boxShadow: isDark ? '0 18px 50px -30px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.06)',
      }}>
      {/* Row 1: label left, icon right */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: T?.textSub || '#6b7280' }}>{label}</span>
        <Icon size={16} style={{ color: iconColor || T?.accent || '#03ecfc' }} />
      </div>
      {/* Row 2: big value */}
      <p className="text-3xl font-semibold tracking-tight" style={{ color: T?.text || '#111827' }}>{value}</p>
      {/* Row 3: trend */}
      {sub && (
        <div className="flex items-center gap-1.5 text-sm" style={{ color: subColor }}>
          {SubIcon && <SubIcon size={13} />}
          <span>{sub}</span>
        </div>
      )}
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
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${product.in_stock
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

// ── Rich Admin Order Card ─────────────────────────────────────
function AdminOrderCard({ order, onStatusChange, onReadyForPickup, onCancelOrder, T, isDark }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const totalItems = items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  const sizeBadge =
    totalItems <= 2 ? { label: 'Small Order', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    : totalItems <= 4 ? { label: 'Medium Order', color: 'bg-purple-50 text-purple-700 border-purple-200' }
    : { label: 'Large Order', color: 'bg-orange-50 text-orange-700 border-orange-200' };

  const isCancelled = order.status === 'Cancelled';
  const isPickupReady = order.ready_for_pickup;

  const cardBg = isDark ? '#1c1c1f' : '#ffffff';
  const borderCol = isDark
    ? isCancelled ? 'rgba(239,68,68,0.25)' : isPickupReady ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'
    : isCancelled ? '#fecaca' : isPickupReady ? '#6ee7b7' : '#e5e7eb';

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm transition-all"
      style={{ background: cardBg, borderColor: borderCol }}>

      {/* ── Header strip */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa' }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[order.status] || 'bg-gray-300'}`} />
          <div>
            <p className="font-bold text-sm" style={{ color: isDark ? '#fafafa' : '#111827' }}>{order.order_number}</p>
            <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Order size badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sizeBadge.color}`}>
            {sizeBadge.label}
          </span>
          {/* Status badge */}
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${statusColors[order.status] || statusColors.Processing}`}>
            {order.status}
          </span>
          {/* Ready for pickup glow badge */}
          {isPickupReady && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500 text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Ready!
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Customer info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#6b7280' }}>
          {(order.guest_name) && <span>👤 <strong style={{ color: isDark ? '#fafafa' : '#374151' }}>{order.guest_name}</strong></span>}
          {order.guest_phone && <span>📞 {order.guest_phone}</span>}
          {order.address && <span className="flex-1">📍 {order.address}</span>}
        </div>

        {/* Special Notes — highlighted */}
        {order.special_notes && (
          <div className="flex items-start gap-2 p-3 rounded-xl border"
            style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', borderColor: isDark ? 'rgba(245,158,11,0.25)' : '#fde68a' }}>
            <FiMessageSquare size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-0.5">Special Notes</p>
              <p className="text-xs font-medium" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>{order.special_notes}</p>
            </div>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
            <div className="px-3 py-2 border-b flex items-center justify-between"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                Order Items ({totalItems} unit{totalItems !== 1 ? 's' : ''})
              </span>
              <span className="text-sm font-bold" style={{ color: isDark ? '#fafafa' : '#111827' }}>₹{order.total?.toFixed(0)}</span>
            </div>
            <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb' }}>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>🎂</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: isDark ? '#fafafa' : '#111827' }}>{item.name}</p>
                    {item.category && <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>{item.category}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: isDark ? '#fafafa' : '#111827' }}>₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(0)}</p>
                    <p className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>×{item.qty || item.quantity || 1} @ ₹{item.price?.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions row */}
        {!isCancelled && (
          <div className="flex items-center gap-2 pt-1">
            {/* Ready for Pickup toggle */}
            <button
              onClick={() => !isPickupReady && onReadyForPickup(order.id, order.order_number, order.guest_name)}
              disabled={isPickupReady}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex-1 justify-center ${
                isPickupReady
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                  : 'border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer'
              }`}
              style={isPickupReady ? {} : { background: isDark ? 'rgba(255,255,255,0.04)' : 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}
            >
              {isPickupReady
                ? <><FiCheckCircle size={13} /> Ready for Pickup ✓</>
                : <><FiToggleLeft size={13} /> Mark Ready for Pickup</>}
            </button>

            {/* Cancel Order */}
            <button
              onClick={() => onCancelOrder(order.id, order.order_number)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{ color: '#ef4444', borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#fecaca', background: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.18)' : '#fee2e2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5'; }}
            >
              <FiXCircle size={13} /> Cancel
            </button>
          </div>
        )}

        {/* Cancelled by admin label */}
        {isCancelled && order.cancelled_by_admin && (
          <p className="text-[10px] text-red-500 font-semibold text-center py-1">⛔ Cancelled by admin</p>
        )}

        {/* Status dropdown */}
        <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="w-full text-xs px-3 py-2 rounded-xl border outline-none cursor-pointer transition-all"
          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', color: isDark ? '#fafafa' : '#374151' }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isDark, setIsDark] = useState(true);

  // Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Images (kept for backward compat, tab removed from sidebar)
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const dropRef = useRef(null);

  // Admin Purchases (raw material ledger)
  const [adminPurchases, setAdminPurchases] = useState(() => loadAdminPurchases());

  // Stats
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0, outOfStock: 0 });

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState(() => loadStoredNotifications());
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPanelRef = useRef(null);
  const prevQtyRef = useRef({}); // track previous quantities for Realtime diff

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((productName, productId, type = 'out_of_stock') => {
    const notif = buildNotification(productName, productId, type);
    setNotifications((prev) => {
      const next = [notif, ...prev].slice(0, 50);
      saveNotifications(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(next);
      return next;
    });
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      saveNotifications(next);
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const addToast = useCallback((message, type = 'success') => {
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
      // Seed the previous-quantity tracker so Realtime diffs are accurate
      const qtyMap = {};
      (data || []).forEach((p) => { qtyMap[p.id] = p.quantity ?? 0; });
      prevQtyRef.current = qtyMap;
      setStats((s) => ({
        ...s,
        products: data?.length || 0,
        // Admin low-stock: actual qty > 0 and <= STOCK_BUFFER
        lowStock: (data || []).filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= STOCK_BUFFER).length,
        // Admin out-of-stock: in_stock false OR qty == 0
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

  // ── Realtime subscription: watch for out-of-stock events ─────
  useEffect(() => {
    const channel = supabase
      .channel('admin-stock-watcher')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        const updated = payload.new;
        const prev = payload.old;
        const newQty = updated.quantity ?? 0;
        const oldQty = prev.quantity ?? 0;

        // Crossed into out-of-stock territory (qty dropped to <= STOCK_BUFFER)
        if (newQty <= STOCK_BUFFER && oldQty > STOCK_BUFFER) {
          addNotification(updated.name, updated.id, 'out_of_stock');
          addToast(`⚠️ "${updated.name}" is now Out of Stock!`, 'error');
        } else if (newQty <= STOCK_BUFFER && newQty > 0 && oldQty > STOCK_BUFFER) {
          // low stock edge case already covered above, but keep as fallback
        } else if (!updated.in_stock && prev.in_stock) {
          // in_stock toggled off manually
          addNotification(updated.name, updated.id, 'out_of_stock');
        }

        setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        prevQtyRef.current[updated.id] = newQty;
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification, addToast]);

  // ── Realtime subscription: watch for orders (new orders & user cancellations) ─────
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-watcher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new;
        addNotification(`New order received: ${newOrder.order_number}`, newOrder.id, 'new_order');
        addToast(`🛍️ New Order: ${newOrder.order_number}`, 'success');
        playNotificationSound();
        setOrders((prev) => [newOrder, ...prev]);
        setStats((s) => ({ ...s, orders: s.orders + 1, revenue: s.revenue + (newOrder.total || 0) }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new;
        const prev = payload.old;
        
        if (updated.status === 'Cancelled' && prev.status !== 'Cancelled') {
          addNotification(`Order ${updated.order_number} was cancelled by the customer`, updated.id, 'cancelled');
          addToast(`❌ Order Cancelled: ${updated.order_number}`, 'error');
          playNotificationSound();
        }
        
        setOrders((prevOrders) => prevOrders.map(o => o.id === updated.id ? updated : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addNotification, addToast]);
  useEffect(() => { if (activeTab === 'images') loadImages(); }, [activeTab, loadImages]);

  // ── CRUD Handlers ────────────────────────────────────────
  const handleInlineUpdate = async (productId, field, value) => {
    try {
      const extra = {};
      if (field === 'quantity') {
        const numVal = Number(value);
        // Auto out-of-stock when qty hits the buffer zone
        extra.in_stock = numVal > STOCK_BUFFER;
        // Fire a notification if crossing into out-of-stock
        const prevQty = prevQtyRef.current[productId] ?? Infinity;
        if (numVal <= STOCK_BUFFER && prevQty > STOCK_BUFFER) {
          const product = products.find((p) => p.id === productId);
          if (product) addNotification(product.name, productId, 'out_of_stock');
        }
        prevQtyRef.current[productId] = numVal;
      }
      const { error } = await supabase
        .from('products')
        .update({ [field]: value, ...extra, updated_at: new Date().toISOString() })
        .eq('id', productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, [field]: value, ...extra } : p));
      if (field === 'quantity') {
        const numVal = Number(value);
        addToast(
          numVal === 0
            ? '⚠️ Quantity set to 0 — product marked Out of Stock'
            : numVal <= STOCK_BUFFER
            ? `⚠️ Quantity = ${numVal} — product marked Out of Stock for users`
            : 'Quantity updated!'
        );
      } else {
        addToast('Price updated!');
      }
    } catch (err) {
      addToast('Update failed: ' + err.message, 'error');
    }
  };

  const handleSaveProduct = async (formData) => {
    // Auto out-of-stock when actual qty is within the buffer zone
    const autoData = { ...formData };
    if (Number(autoData.quantity) <= STOCK_BUFFER) {
      autoData.in_stock = false;
    }
    if (editingProduct) {
      const { error } = await supabase.from('products').update({ ...autoData, updated_at: new Date().toISOString() }).eq('id', editingProduct.id);
      if (error) throw error;
      if (Number(autoData.quantity) <= STOCK_BUFFER) {
        addNotification(autoData.name, editingProduct.id, 'out_of_stock');
        addToast(`⚠️ "${autoData.name}" saved as Out of Stock (qty ≤ ${STOCK_BUFFER})`, 'error');
      } else {
        addToast('Product updated!');
      }
    } else {
      const { error } = await supabase.from('products').insert(autoData);
      if (error) throw error;
      if (Number(autoData.quantity) <= STOCK_BUFFER) {
        addToast(`⚠️ "${autoData.name}" added as Out of Stock (qty ≤ ${STOCK_BUFFER})`, 'error');
      } else {
        addToast('Product added!');
      }
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

  const handleReadyForPickup = async (orderId, orderNumber, customerName) => {
    try {
      const { error } = await supabase.from('orders')
        .update({ ready_for_pickup: true, status: 'Shipped', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      setOrders((p) => p.map((o) => o.id === orderId ? { ...o, ready_for_pickup: true, status: 'Shipped' } : o));
      const msg = `Order ${orderNumber} is Ready for Pickup${customerName ? ` — ${customerName}` : ''}`;
      addNotification(msg, orderId, 'ready_pickup');
      addToast(`🎉 ${orderNumber} marked Ready for Pickup!`);
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!confirm(`Cancel order "${orderNumber}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('orders')
        .update({ status: 'Cancelled', cancelled_by_admin: true, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      setOrders((p) => p.map((o) => o.id === orderId ? { ...o, status: 'Cancelled', cancelled_by_admin: true } : o));
      addNotification(`Order ${orderNumber} was cancelled by admin`, orderId, 'cancelled');
      addToast(`Order ${orderNumber} cancelled.`, 'error');
    } catch (err) {
      addToast('Cancel failed: ' + err.message, 'error');
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

  // ── Admin Purchase Handlers ───────────────────────────────
  const handleAddPurchase = useCallback((item) => {
    setAdminPurchases((prev) => {
      const next = [item, ...prev];
      saveAdminPurchases(next);
      return next;
    });
  }, []);

  const handleDeletePurchase = useCallback((id) => {
    setAdminPurchases((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveAdminPurchases(next);
      return next;
    });
  }, []);

  // ── Filters ──────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchSearch = !orderSearch ||
      o.order_number?.toLowerCase().includes(q) ||
      o.guest_name?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q);
    // 'All' shows only active orders (Processing + Shipped)
    // Specific filter lets admin see Delivered / Cancelled on demand
    const matchStatus = statusFilter === 'All'
      ? (o.status === 'Processing' || o.status === 'Shipped')
      : o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Derived dashboard data ───────────────────────────────
  const recentOrders = orders.slice(0, 5);
  const topProducts = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // ── Theme tokens ─────────────────────────────────────────
  const T = isDark ? {
    bg:           '#09090b',          // wireframe: near-pure black
    sidebar:      '#111318',          // dark sidebar
    card:         '#18181b',          // wireframe card bg
    cardInner:    '#27272a',          // nested surfaces
    cardBorder:   'rgba(255,255,255,0.1)',
    input:        '#27272a',
    inputBorder:  'rgba(255,255,255,0.12)',
    text:         '#fafafa',          // wireframe: pure white
    textSub:      '#9f9fa9',          // wireframe: muted gray
    textMuted:    'rgba(255,255,255,0.3)',
    label:        '#03ecfc',          // wireframe cyan
    accent:       '#03ecfc',          // wireframe: cyan button
    accentHover:  '#00c8d4',
    navActive:    '#27272a',          // wireframe: dark button bg for active
    navActiveBdr: '#03ecfc',
    navText:      '#9f9fa9',
    navActiveText:'#fafafa',
    hover:        'rgba(255,255,255,0.05)',
    progress:     '#03ecfc',
    tagBg:        '#27272a',
    iconBg:       'rgba(3,236,252,0.15)',
    rowHover:     'rgba(255,255,255,0.04)',
    mobNav:       '#111318',
    mobNavBorder: 'rgba(255,255,255,0.1)',
    toggleBg:     '#27272a',
    toggleKnob:   '#03ecfc',
    avatarBg:     '#03ecfc',
    sectionBg:    '#09090b',
    statCard:     '#18181b',
  } : {
    bg: '#f4f6fa',
    sidebar: '#1a0f08',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    cardHover: '#f9fafb',
    input: '#ffffff',
    inputBorder: '#d1d5db',
    text: '#111827',
    textSub: '#6b7280',
    textMuted: '#9ca3af',
    label: '#7c3aed',
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    navActive: 'rgba(124,58,237,0.15)',
    navActiveBdr: '#c4a882',
    navText: 'rgba(255,255,255,0.45)',
    navActiveText: '#c4a882',
    hover: '#f3f4f6',
    progress: '#7c3aed',
    tagBg: '#f3f4f6',
    iconBg: '#ede9fe',
    rowHover: '#f9fafb',
    mobNav: '#ffffff',
    mobNavBorder: '#e5e7eb',
    toggleBg: '#e5e7eb',
    toggleKnob: '#7c3aed',
    avatarBg: '#7c3aed',          // purple in light mode
    sectionBg: '#f4f6fa',
    statCard: '#ffffff',
  };

  // ── Nav items ──────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: FiBarChart2 },
    { id: 'inventory', label: 'Inventory',  icon: FiPackage },
    { id: 'orders',    label: 'Orders',     icon: FiShoppingBag },
    { id: 'myorders',  label: 'My Orders',  icon: FiShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: FiTrendingUp },
  ];

  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || 'Admin';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const categoryGroups = CATEGORIES.map((cat) => ({
    name: cat,
    count: products.filter((p) => p.category === cat).length,
  })).filter((c) => c.count > 0);

  // Admin sees raw DB quantities, so use those for the alert panels
  const outOfStockItems = products.filter((p) => !p.in_stock || (p.quantity ?? 0) === 0);
  const lowStockItems   = products.filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= STOCK_BUFFER);

  return (
    <div className="min-h-screen flex transition-colors duration-300" style={{ background: T.bg }}>

      {/* ── Toast Stack ── */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[300] flex flex-col gap-2 max-w-xs">
        <AnimatePresence>
          {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />)}
        </AnimatePresence>
      </div>

      {/* ── Notification Panel (floating) ── */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            ref={notifPanelRef}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 right-4 sm:right-6 z-[400] w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: T.card,
              border: `1px solid ${T.cardBorder}`,
              maxHeight: '70vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: T.cardBorder }}>
              <div className="flex items-center gap-2">
                <FiBell size={15} style={{ color: T.label }} />
                <span className="text-sm font-bold" style={{ color: T.text }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: '#ef4444' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                    style={{ color: T.label, border: `1px solid ${T.cardBorder}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifications}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                    style={{ color: '#ef4444', border: `1px solid rgba(239,68,68,0.2)` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: T.textSub }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FiX size={12} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <FiBell size={28} style={{ color: T.textMuted }} />
                  <p className="text-sm" style={{ color: T.textSub }}>No notifications yet</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>Out-of-stock alerts will appear here</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 px-4 py-3 border-b transition-all cursor-pointer"
                    style={{
                      borderColor: T.cardBorder,
                      background: notif.read ? 'transparent' : (
                        notif.type === 'ready_pickup'
                          ? (isDark ? 'rgba(16,185,129,0.07)' : '#f0fdf4')
                          : (isDark ? 'rgba(239,68,68,0.07)' : '#fff5f5')
                      ),
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.rowHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : (
                      notif.type === 'ready_pickup'
                        ? (isDark ? 'rgba(16,185,129,0.07)' : '#f0fdf4')
                        : (isDark ? 'rgba(239,68,68,0.07)' : '#fff5f5')
                    )}
                    onClick={() => {
                      markOneRead(notif.id);
                      if (notif.targetTab) {
                        setActiveTab(notif.targetTab);
                        setNotifOpen(false);
                      }
                    }}
                  >
                    {/* Icon — green for pickup ready, red for stock/cancel */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: notif.type === 'ready_pickup'
                          ? (isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5')
                          : (isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2')
                      }}>
                      {notif.type === 'ready_pickup'
                        ? <FiCheckCircle size={14} className="text-emerald-500" />
                        : <FiAlertCircle size={14} className="text-red-500" />}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug" style={{ color: T.text }}>{notif.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: T.textMuted }}>
                        {new Date(notif.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {notif.targetTab && (
                        <p className="text-[10px] mt-0.5 font-semibold" style={{ color: T.label }}>Click to view orders →</p>
                      )}
                    </div>
                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Modal ── */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            onSave={handleSaveProduct}
            isDark={isDark}
            T={T}
          />
        )}
      </AnimatePresence>

      {/* ══════════ DESKTOP SIDEBAR ══════════════════════════ */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 z-30 transition-colors duration-300" style={{ background: T.sidebar }}>
        <SidebarContent
          navItems={navItems} activeTab={activeTab}
          onTabChange={handleTabChange}
          profileName={profile?.full_name || 'Admin'}
          initials={getUserInitials()}
          T={T}
        />
      </aside>

      {/* ══════════ MAIN CONTENT ═════════════════════════════ */}
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 overflow-auto pb-20 sm:pb-6 transition-colors duration-300" style={{ minHeight: '100vh', background: T.sectionBg }}>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between mb-4 sm:hidden">
          <p className="font-bold text-sm capitalize" style={{ color: T.text }}>{activeTab}</p>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle — mobile */}
            <button onClick={() => setIsDark(!isDark)}
              className="relative w-12 h-6 rounded-full transition-all duration-300 flex items-center"
              style={{ background: T.toggleBg, border: `1px solid ${T.cardBorder}` }}>
              <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute w-5 h-5 rounded-full shadow-md flex items-center justify-center text-[10px]"
                style={{ left: isDark ? '26px' : '2px', background: T.toggleKnob }}>
                {isDark ? '🌙' : '☀️'}
              </motion.div>
            </button>
            <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: T.accent }}>
              <FiPlus size={18} />
            </button>
          </div>
        </div>

        {/* ─────────── DASHBOARD TAB ─────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.label }}>Admin Dashboard</p>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: T.text }}>Bakery Management</h1>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: T.textSub }}>
                  Monitor stock, manage products and track orders.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                {/* ── Dark mode toggle ── */}
                <button onClick={() => setIsDark(!isDark)}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 flex items-center flex-shrink-0"
                  style={{
                    background: isDark ? 'rgba(3,236,252,0.15)' : '#e5e7eb',
                    border: isDark ? '1px solid rgba(3,236,252,0.3)' : '1px solid #d1d5db'
                  }}>
                  <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-xs"
                    style={{ left: isDark ? '30px' : '2px', background: '#03ecfc' }}>
                    {isDark ? '🌙' : '☀️'}
                  </motion.div>
                </button>
                <button onClick={() => { loadProducts(); loadOrders(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                  style={{ border: `1px solid ${T.cardBorder}`, color: T.textSub, background: T.card }}>
                  <FiRefreshCw size={13} /> Refresh
                </button>
                {/* ── Notification Bell ── */}
                <button
                  id="admin-notif-bell"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                  style={{ border: `1px solid ${T.cardBorder}`, color: T.textSub, background: T.card }}
                  title="Notifications"
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = T.card; e.currentTarget.style.color = T.textSub; }}
                >
                  <FiBell size={15} />
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                      style={{ background: '#ef4444' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: T.accent,
                    color: '#09090b',
                    boxShadow: isDark ? '0 8px 24px rgba(3,236,252,0.25)' : 'none'
                  }}>
                  <FiPlus size={14} /> Add Item
                </button>
              </div>
            </div>

            {/* Stat Cards — 4 cols desktop, 2 mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Products" value={stats.products}
                icon={FiPackage} iconColor={isDark ? '#03ecfc' : '#7c3aed'}
                subIcon={FiTrendingUp} sub="Active listings"
                subColor={isDark ? '#34d399' : '#059669'}
                isDark={isDark} T={T} />
              <StatCard
                label="Low Stock" value={stats.lowStock}
                icon={FiAlertTriangle} iconColor="#fbbf24"
                sub={stats.lowStock > 0 ? 'Needs restock soon' : 'All good \u2713'}
                subColor={stats.lowStock > 0 ? '#fcd34d' : (isDark ? '#34d399' : '#059669')}
                isDark={isDark} T={T} />
              <StatCard
                label="Out of Stock" value={stats.outOfStock}
                icon={FiAlertCircle} iconColor="#f87171"
                sub={stats.outOfStock > 0 ? 'Immediate action required' : 'None out \u2713'}
                subColor={stats.outOfStock > 0 ? '#fca5a5' : (isDark ? '#34d399' : '#059669')}
                isDark={isDark} T={T} />
              <StatCard
                label="Revenue" value={`\u20b9${stats.revenue.toFixed(0)}`}
                icon={FiDollarSign} iconColor={isDark ? '#03ecfc' : '#7c3aed'}
                subIcon={FiTrendingUp} sub={`${stats.orders} orders total`}
                subColor={isDark ? '#34d399' : '#059669'}
                isDark={isDark} T={T} />
            </div>

            {/* Stock Overview + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Stock Overview */}
              <div className="lg:col-span-2 rounded-2xl border p-5 shadow-sm transition-colors duration-300" style={{ background: T.card, borderColor: T.cardBorder }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Stock Overview</h2>
                    <p className="text-xs" style={{ color: T.textSub }}>Inventory by category</p>
                  </div>
                  <button onClick={() => setActiveTab('inventory')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: T.textSub, border: `1px solid ${T.cardBorder}` }}>
                    <FiDownload size={11} /> View All
                  </button>
                </div>
                {productsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: T.tagBg }} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {categoryGroups.map((cat) => {
                      const maxCount = Math.max(...categoryGroups.map((c) => c.count), 1);
                      const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                      return (
                        <div key={cat.name} className="rounded-xl p-3 transition-colors" style={{ background: T.tagBg }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold" style={{ color: T.text }}>{cat.name}</span>
                            <span className="text-xs" style={{ color: T.textSub }}>{cat.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.cardBorder }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: T.progress }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl border p-5 shadow-sm transition-colors duration-300" style={{ background: T.card, borderColor: T.cardBorder }}>
                <h2 className="text-sm font-bold mb-1" style={{ color: T.text }}>Quick Actions</h2>
                <p className="text-xs mb-4" style={{ color: T.textSub }}>Common tasks</p>
                <div className="space-y-2">
                  {[
                    { icon: FiPlus, label: 'Add New Product', action: () => { setEditingProduct(null); setShowModal(true); } },
                    { icon: FiLayers, label: 'Manage Inventory', action: () => setActiveTab('inventory') },
                    { icon: FiShoppingBag, label: 'View Orders', action: () => setActiveTab('orders') },
                    { icon: FiImage, label: 'Upload Images', action: () => setActiveTab('images') },
                  ].map((item) => (
                    <button key={item.label} onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                      style={{ border: `1px solid ${T.cardBorder}`, color: T.textSub, background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSub; }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.iconBg }}>
                        <item.icon size={13} style={{ color: T.label }} />
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
              <div className="lg:col-span-2 rounded-2xl border p-5 shadow-sm transition-colors duration-300" style={{ background: T.card, borderColor: T.cardBorder }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Recent Orders</h2>
                    <p className="text-xs" style={{ color: T.textSub }}>Latest customer orders</p>
                  </div>
                  <button onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold transition-colors" style={{ color: T.label }}>
                    View all →
                  </button>
                </div>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-sm text-gray-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentOrders.map((order) => (
                      <div key={order.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-all"
                        onMouseEnter={(e) => e.currentTarget.style.background = T.rowHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[order.status] || 'bg-gray-300'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{order.order_number}</p>
                            <p className="text-xs" style={{ color: T.textMuted }}>
                              {order.guest_name || 'Customer'} ·{' '}
                              {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`hidden sm:inline text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColors[order.status] || statusColors.Processing}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-bold" style={{ color: T.text }}>₹{order.total?.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Products */}
              <div className="rounded-2xl border p-5 shadow-sm transition-colors duration-300" style={{ background: T.card, borderColor: T.cardBorder }}>
                <div className="mb-4">
                  <h2 className="text-sm font-bold" style={{ color: T.text }}>Top Products</h2>
                  <p className="text-xs" style={{ color: T.textSub }}>Best rated items</p>
                </div>
                {productsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: T.tagBg }} />)}
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: T.textSub }}>No products yet</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: T.tagBg }}>
                          {product.image_url
                            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🎂</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{product.name}</p>
                          <p className="text-xs" style={{ color: T.textSub }}>{product.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: T.text }}>₹{product.price?.toFixed(0)}</p>
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
                <h1 className="text-xl font-bold" style={{ color: T.text }}>Product Inventory</h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: T.textSub }}>Manage products, pricing and stock</p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={loadProducts}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
                  style={{ borderColor: T.cardBorder, color: T.textSub, background: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <FiRefreshCw size={14} />
                </button>
                {/* Notification bell in inventory header */}
                <button
                  id="admin-notif-bell-inventory"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
                  style={{ borderColor: T.cardBorder, color: T.textSub, background: 'transparent' }}
                  title="Notifications"
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSub; }}
                >
                  <FiBell size={14} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#ef4444' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: T.accent }}>
                  <FiPlus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* ── Low Stock Alert Section ── */}
            {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
              <div className="space-y-3">
                {outOfStockItems.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <FiAlertCircle size={15} className="text-red-500 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-red-500">Out of Stock ({outOfStockItems.length})</h3>
                      <span className="text-xs text-red-400 ml-auto hidden sm:inline">Hidden from users</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {outOfStockItems.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2 border" style={{ background: T.card, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' }}>
                          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0" style={{ background: T.tagBg }}>
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎂</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{p.name}</p>
                            <p className="text-[10px] text-red-500">Qty: 0</p>
                          </div>
                          <InlineEdit value={p.quantity ?? 0} step="1" onSave={(v) => handleInlineUpdate(p.id, 'quantity', v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lowStockItems.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <FiAlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-amber-500">Low Stock ({lowStockItems.length})</h3>
                      <span className="text-xs text-amber-400 ml-auto hidden sm:inline">≤ {STOCK_BUFFER} units (hidden from users)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {lowStockItems.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2 border" style={{ background: T.card, borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }}>
                          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0" style={{ background: T.tagBg }}>
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎂</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{p.name}</p>
                            <p className="text-[10px] text-amber-500">Only {p.quantity} left</p>
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
            <div className="rounded-xl border p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-3" style={{ background: T.card, borderColor: T.cardBorder }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[140px]" style={{ background: T.tagBg, borderColor: T.inputBorder }}>
                <FiSearch size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products…"
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: T.text }} />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer border"
                style={{ background: T.tagBg, borderColor: T.inputBorder, color: T.text }}>
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="text-xs ml-auto" style={{ color: T.textMuted }}>{filteredProducts.length}/{products.length}</div>
            </div>

            {/* Products — Desktop: table | Mobile: cards */}
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 rounded-xl border animate-pulse" style={{ background: T.card, borderColor: T.cardBorder }} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border shadow-sm text-center py-16" style={{ background: T.card, borderColor: T.cardBorder }}>
                <p className="text-4xl mb-3">🎂</p>
                <p className="font-semibold mb-1" style={{ color: T.text }}>No products found</p>
                <p className="text-sm mb-4" style={{ color: T.textSub }}>Add your first product to get started.</p>
                <button onClick={() => { setEditingProduct(null); setShowModal(true); }}
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: T.accent }}>Add Product</button>
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
                <div className="hidden lg:block rounded-xl border shadow-sm overflow-hidden" style={{ background: T.card, borderColor: T.cardBorder }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: T.cardBorder, color: T.textSub }}>
                        <th className="text-left px-5 py-3">Product</th>
                        <th className="text-left px-4 py-3">Category</th>
                        <th className="text-right px-4 py-3">Price (₹)</th>
                        <th className="text-center px-4 py-3">Qty</th>
                        <th className="text-center px-4 py-3">Rating</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const isLowStock = (product.quantity ?? 0) > 0 && (product.quantity ?? 0) < 5;
                        return (
                          <tr key={product.id} className="transition-colors"
                            style={{ borderBottom: `1px solid ${T.cardBorder}` }}
                            onMouseEnter={(e) => e.currentTarget.style.background = T.rowHover}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: T.tagBg }}>
                                  {product.image_url
                                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-base">🎂</div>}
                                </div>
                                <div>
                                  <p className="font-semibold leading-tight" style={{ color: T.text }}>{product.name}</p>
                                  {product.badge && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded font-semibold">{product.badge}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs" style={{ color: T.textSub }}>{product.category}</td>
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
                              <span className="flex items-center justify-center gap-1 text-xs" style={{ color: T.textSub }}>
                                <FiStar size={10} className="text-amber-400" />{product.rating}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => handleInlineUpdate(product.id, 'in_stock', !product.in_stock)}
                                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${product.in_stock
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                  : 'bg-red-50 text-red-600 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                  }`}>
                                {product.in_stock ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setEditingProduct(product); setShowModal(true); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                  style={{ color: T.textSub }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSub; }}>
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
                    <div className="px-5 py-3 border-t text-xs" style={{ borderColor: T.cardBorder, color: T.textMuted }}>
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
                <h1 className="text-xl font-bold" style={{ color: T.text }}>All Orders</h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: T.textSub }}>Manage and update customer orders</p>
              </div>
              <button onClick={loadOrders}
                className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
                style={{ borderColor: T.cardBorder, color: T.textSub, background: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <FiRefreshCw size={14} />
              </button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-3" style={{ background: T.card, borderColor: T.cardBorder }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[140px]" style={{ background: T.tagBg, borderColor: T.inputBorder }}>
                <FiSearch size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
                <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order, name…"
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: T.text }} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer border"
                style={{ background: T.tagBg, borderColor: T.inputBorder, color: T.text }}>
                <option value="All" style={{ background: T.tagBg, color: T.text }}>All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: T.tagBg, color: T.text }}>{s}</option>
                ))}
              </select>
              <div className="text-xs ml-auto hidden sm:block" style={{ color: T.textMuted }}>
                {filteredOrders.length} orders · ₹{stats.revenue.toFixed(0)}
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl border animate-pulse" style={{ background: T.card, borderColor: T.cardBorder }} />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-xl border shadow-sm text-center py-16" style={{ background: T.card, borderColor: T.cardBorder }}>
                <p className="text-4xl mb-3">📦</p>
                <p className="font-semibold mb-1" style={{ color: T.text }}>No orders yet</p>
                <p className="text-sm" style={{ color: T.textSub }}>Orders will appear here once customers place them.</p>
              </div>
            ) : (
              /* Rich AdminOrderCard grid — same for all screen sizes */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <AdminOrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleOrderStatus}
                    onReadyForPickup={handleReadyForPickup}
                    onCancelOrder={handleCancelOrder}
                    T={T}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────── MY ORDERS TAB ───────────────────────── */}
        {activeTab === 'myorders' && (
          <MyOrdersTab
            purchases={adminPurchases}
            onAdd={handleAddPurchase}
            onDelete={handleDeletePurchase}
            isDark={isDark}
            T={T}
          />
        )}

        {/* ─────────── ANALYTICS TAB ─────────────────────── */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            stats={stats}
            orders={orders}
            products={products}
            adminPurchases={adminPurchases}
            isDark={isDark}
            T={T}
          />
        )}

      </main>

      {/* ══════════ MOBILE BOTTOM NAV ══════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-colors duration-300"
        style={{ background: T.mobNav, borderTop: `1px solid ${T.mobNavBorder}` }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative"
            style={{ color: activeTab === item.id ? T.navActiveText : T.navText }}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="mob-nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: T.navActiveBdr }}
              />
            )}
            <item.icon size={activeTab === item.id ? 19 : 17} strokeWidth={activeTab === item.id ? 2.5 : 1.8} />
            <span className="text-[9px] font-medium leading-none">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}


// ── My Orders Tab (Raw Material Ledger) ──────────────────────
function MyOrdersTab({ purchases, onAdd, onDelete, isDark, T }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const total = purchases.reduce((s, p) => s + (p.price || 0), 0);

  const handleAdd = () => {
    if (!name.trim()) { setError('Please enter a material name.'); return; }
    const p = parseFloat(price);
    if (!price || isNaN(p) || p < 0) { setError('Please enter a valid price.'); return; }
    setError('');
    onAdd({ id: `${Date.now()}-${Math.random()}`, name: name.trim(), price: p, date: new Date().toISOString() });
    setName('');
    setPrice('');
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleAdd(); };

  const inputStyle = {
    background: T.input,
    border: `1px solid ${T.inputBorder}`,
    color: T.text,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: T.text }}>My Orders</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: T.textSub }}>
          Raw material purchase ledger — track what you buy for the bakery
        </p>
      </div>

      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-5 flex items-center gap-4"
        style={{
          background: isDark
            ? 'linear-gradient(135deg,rgba(3,236,252,0.08),rgba(139,92,246,0.08))'
            : 'linear-gradient(135deg,#eff6ff,#ede9fe)',
          borderColor: T.cardBorder,
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: isDark ? 'rgba(3,236,252,0.15)' : 'rgba(124,58,237,0.12)' }}>
          <FiShoppingCart size={22} style={{ color: T.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: T.textSub }}>Total Investment</p>
          <p className="text-2xl font-bold" style={{ color: T.text }}>₹{total.toFixed(2)}</p>
          <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{purchases.length} item{purchases.length !== 1 ? 's' : ''} recorded</p>
        </div>
        {purchases.length > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-medium" style={{ color: T.textSub }}>Avg per item</p>
            <p className="text-base font-bold" style={{ color: T.accent }}>₹{(total / purchases.length).toFixed(2)}</p>
          </div>
        )}
      </motion.div>

      {/* Add form */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: T.card, borderColor: T.cardBorder }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.textSub }}>
          Add Raw Material
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Name */}
          <div className="flex-1">
            <input
              id="material-name"
              type="text"
              placeholder="Material name  (e.g. Flour, Sugar, Butter…)"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              style={inputStyle}
            />
          </div>
          {/* Price */}
          <div style={{ width: 150 }}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: T.textSub }}>₹</span>
              <input
                id="material-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>
          {/* Add btn */}
          <motion.button
            id="add-material-btn"
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
            style={{ background: isDark ? 'linear-gradient(135deg,#03ecfc,#8b5cf6)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <FiPlus size={15} />
            Add Item
          </motion.button>
        </div>
        {error && (
          <p className="text-xs mt-2 text-red-400 font-medium">{error}</p>
        )}
      </div>

      {/* Items list */}
      {purchases.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: T.card, borderColor: T.cardBorder }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: T.tagBg }}>
            <FiShoppingCart size={24} style={{ color: T.textSub }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: T.text }}>No materials added yet</p>
          <p className="text-sm" style={{ color: T.textSub }}>Add your first raw material purchase above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: T.card, borderColor: T.cardBorder }}>
          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-3 border-b text-xs font-bold uppercase tracking-wider"
            style={{ borderColor: T.cardBorder, color: T.textSub, background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
            <div className="col-span-6">Material Name</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-2 text-right hidden sm:block">Date</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
            <AnimatePresence initial={false}>
              {purchases.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 px-5 py-3.5 items-center"
                  style={{ borderColor: T.cardBorder }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.rowHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name */}
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: T.tagBg, color: T.textSub }}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.name}</span>
                  </div>
                  {/* Price */}
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-bold" style={{ color: '#10b981' }}>₹{item.price.toFixed(2)}</span>
                  </div>
                  {/* Date */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-xs" style={{ color: T.textSub }}>
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {/* Delete */}
                  <div className="col-span-1 flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: T.textSub }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSub; }}
                    >
                      <FiTrash size={13} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer total */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t"
            style={{ borderColor: T.cardBorder, background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textSub }}>
              Total ({purchases.length} items)
            </span>
            <span className="text-base font-bold" style={{ color: T.text }}>₹{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Chart Tooltip ──────────────────────────────────────
function ChartTooltip({ active, payload, label, isDark, T }) {
  if (!active || !payload?.length) return null;
  const bg     = isDark ? '#27272a' : (T?.card || '#f9fafb');
  const border = isDark ? 'rgba(255,255,255,0.12)' : (T?.cardBorder || '#e5e7eb');
  const textMain = isDark ? '#fafafa' : (T?.text || '#111827');
  const textSub  = isDark ? '#9f9fa9' : (T?.textSub || '#6b7280');
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: '10px 16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      minWidth: 160,
    }}>
      <p style={{ color: textSub, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill || p.color }} />
          <span style={{ color: textMain, fontSize: 12, fontWeight: 700 }}>
            {p.name}: ₹{Math.abs(Number(p.value)).toLocaleString('en-IN')}
            {p.name === 'Profit / Loss' && Number(p.value) < 0 ? ' (Loss)' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab({ stats, orders, products, adminPurchases, isDark, T }) {
  const [monthRange, setMonthRange] = useState('6');

  // ── Month filter helpers ──────────────────────────────────
  const getMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const getMonthLabel = (key) => {
    const [year, month] = key.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  // Build cutoff date
  const now = new Date();
  const cutoff = monthRange !== 'all'
    ? new Date(now.getFullYear(), now.getMonth() - parseInt(monthRange) + 1, 1)
    : null;

  const filteredOrders = cutoff ? orders.filter((o) => new Date(o.created_at) >= cutoff) : orders;
  const filteredPurchases = cutoff ? adminPurchases.filter((p) => new Date(p.date) >= cutoff) : adminPurchases;

  // ── Invest vs Revenue monthly bar chart data ──────────────
  const monthlyMap = {};
  filteredOrders.forEach((o) => {
    const key = getMonthKey(o.created_at);
    if (!key) return;
    if (!monthlyMap[key]) monthlyMap[key] = { key, label: getMonthLabel(key), revenue: 0, investment: 0 };
    monthlyMap[key].revenue += o.total || 0;
  });
  filteredPurchases.forEach((p) => {
    const key = getMonthKey(p.date);
    if (!key) return;
    if (!monthlyMap[key]) monthlyMap[key] = { key, label: getMonthLabel(key), revenue: 0, investment: 0 };
    monthlyMap[key].investment += p.price || 0;
  });
  const barData = Object.values(monthlyMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({
      ...m,
      revenue: Math.round(m.revenue),
      investment: Math.round(m.investment),
      profit: Math.round(m.revenue - m.investment),
    }));

  // ── Derived filtered stats ─────────────────────────────────
  const filtRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const filtInvest  = filteredPurchases.reduce((s, p) => s + (p.price || 0), 0);
  const filtProfit  = filtRevenue - filtInvest;
  const avgOrderValue = filteredOrders.length > 0 ? filtRevenue / filteredOrders.length : 0;

  // ── Category distribution pie ──────────────────────────────
  const catColors = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981'];
  const categoryData = CATEGORIES
    .map((cat) => ({ name: cat, value: products.filter((p) => p.category === cat).length }))
    .filter((d) => d.value > 0);

  // ── User retention ─────────────────────────────────────────
  const userOrderMap = {};
  orders.forEach((o) => {
    const uid = o.user_id || o.guest_name || 'guest';
    if (!userOrderMap[uid]) userOrderMap[uid] = [];
    userOrderMap[uid].push(o);
  });
  const allUserIds = Object.keys(userOrderMap);
  const returningUsers = allUserIds.filter((uid) => userOrderMap[uid].length > 1).length;
  const retentionRate = allUserIds.length > 0 ? Math.round((returningUsers / allUserIds.length) * 100) : 0;
  const retentionPieData = [
    { name: 'Returning', value: returningUsers },
    { name: 'New', value: allUserIds.length - returningUsers },
  ].filter((d) => d.value > 0);
  const retentionColors = ['#10b981', '#6366f1'];

  const topCustomers = allUserIds
    .map((uid) => {
      const uOrders = userOrderMap[uid];
      const name = uOrders[0]?.guest_name || 'Registered User';
      const totalSpent = uOrders.reduce((s, o) => s + (o.total || 0), 0);
      return { uid, name, orderCount: uOrders.length, totalSpent };
    })
    .sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);

  // ── Favourite products ─────────────────────────────────────
  const productFrequency = {};
  orders.forEach((order) => {
    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const id = item.id || item.product_id || item.name;
      if (!productFrequency[id])
        productFrequency[id] = { name: item.name || 'Unknown', count: 0, revenue: 0 };
      const qty = item.qty || item.quantity || 1;
      productFrequency[id].count += qty;
      productFrequency[id].revenue += (item.price || 0) * qty;
    });
  });
  const favProducts = Object.values(productFrequency).sort((a, b) => b.count - a.count).slice(0, 6);

  // ── Range filter pill style ────────────────────────────────
  const rangePillStyle = (val) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: `1px solid ${T.cardBorder}`,
    background: monthRange === val
      ? (isDark ? 'linear-gradient(135deg,#03ecfc,#8b5cf6)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)')
      : T.tagBg,
    color: monthRange === val ? '#fff' : T.textSub,
    transition: 'all 0.2s',
  });

  return (
    <div className="space-y-5">
      {/* ── Header + Month Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Analytics</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: T.textSub }}>Store performance overview</p>
        </div>
        {/* Month range pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <FiCalendar size={13} style={{ color: T.textSub }} />
          {[
            { label: '3 Months', val: '3' },
            { label: '6 Months', val: '6' },
            { label: '12 Months', val: '12' },
            { label: 'All Time', val: 'all' },
          ].map(({ label, val }) => (
            <button key={val} onClick={() => setMonthRange(val)} style={rangePillStyle(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Orders', value: filteredOrders.length, icon: FiShoppingBag, iconColor: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { label: 'Revenue', value: `₹${filtRevenue.toFixed(0)}`, icon: FiDollarSign, iconColor: '#10b981', bg: 'rgba(16,185,129,0.15)' },
          { label: 'Investment', value: `₹${filtInvest.toFixed(0)}`, icon: FiShoppingCart, iconColor: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          {
            label: filtProfit >= 0 ? 'Profit' : 'Loss',
            value: `₹${Math.abs(filtProfit).toFixed(0)}`,
            icon: FiTrendingUp,
            iconColor: filtProfit >= 0 ? '#10b981' : '#ef4444',
            bg: filtProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border p-4 shadow-sm flex items-center gap-3"
            style={{ background: T.statCard || T.card, borderColor: T.cardBorder }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: item.bg }}>
              <item.icon size={17} style={{ color: item.iconColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: T.textSub }}>{item.label}</p>
              <p className="text-lg font-bold truncate" style={{ color: item.label === 'Loss' ? '#ef4444' : T.text }}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Investment vs Revenue vs Profit Bar Chart ── */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: T.card, borderColor: T.cardBorder }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: isDark ? 'rgba(3,236,252,0.1)' : '#eff6ff' }}>
            <FiBarChart2 size={14} style={{ color: isDark ? '#03ecfc' : '#3b82f6' }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: T.text }}>Investment vs Revenue vs Profit / Loss</h2>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: T.tagBg, color: T.textSub }}>Month-wise</span>
        </div>

        {barData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={4} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: T.textSub, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: T.textSub, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                />
                <Tooltip
                  content={(props) => <ChartTooltip {...props} isDark={isDark} T={T} />}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                />
                <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb'} />
                <Bar dataKey="investment" name="Investment" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="profit" name="Profit / Loss" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.profit >= 0 ? '#6366f1' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 justify-center">
              {[
                { label: 'Investment', color: '#f59e0b' },
                { label: 'Revenue', color: '#10b981' },
                { label: 'Profit', color: '#6366f1' },
                { label: 'Loss', color: '#ef4444' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-[11px] font-medium" style={{ color: T.textSub }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Monthly summary rows */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {barData.map((m) => (
                <div key={m.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: T.tagBg }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: T.text }}>{m.label}</p>
                    <p className="text-[10px]" style={{ color: T.textSub }}>
                      Rev ₹{m.revenue.toLocaleString('en-IN')} · Inv ₹{m.investment.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: m.profit >= 0 ? '#10b981' : '#ef4444' }}>
                    {m.profit >= 0 ? '+' : ''}₹{m.profit.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color: T.textMuted }}>
            <FiBarChart2 size={32} />
            <p className="text-sm text-center">
              No data for this period.<br />Add purchases in <strong>My Orders</strong> and wait for customer orders.
            </p>
          </div>
        )}
      </div>

      {/* ── Category Pie + User Retention row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Category Distribution Pie */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: T.card, borderColor: T.cardBorder }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: isDark ? 'rgba(139,92,246,0.15)' : '#ede9fe' }}>
              <FiGrid size={14} style={{ color: '#8b5cf6' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: T.text }}>Products by Category</h2>
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={catColors[i % catColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: isDark ? '#27272a' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, borderRadius: 12, padding: '8px 14px' }}>
                          <p style={{ color: isDark ? '#fafafa' : '#111827', fontWeight: 700, fontSize: 13 }}>{payload[0].name}</p>
                          <p style={{ color: isDark ? '#9f9fa9' : '#6b7280', fontSize: 12 }}>{payload[0].value} products</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ color: T.textSub, fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: T.tagBg }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                      <span className="text-xs font-medium" style={{ color: T.textSub }}>{d.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: T.text }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48" style={{ color: T.textMuted }}>
              <p className="text-sm">No product data yet</p>
            </div>
          )}
        </div>

        {/* User Retention */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: T.card, borderColor: T.cardBorder }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5' }}>
              <FiUsers size={14} style={{ color: '#10b981' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: T.text }}>User Retention</h2>
          </div>
          {/* Mini KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total', value: allUserIds.length, color: '#6366f1', icon: FiUsers },
              { label: 'Returning', value: returningUsers, color: '#10b981', icon: FiRepeat },
              { label: 'Rate', value: `${retentionRate}%`, color: '#f59e0b', icon: FiAward },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: T.tagBg }}>
                <m.icon size={14} style={{ color: m.color, margin: '0 auto 4px' }} />
                <p className="text-base font-bold" style={{ color: T.text }}>{m.value}</p>
                <p className="text-[10px]" style={{ color: T.textSub }}>{m.label}</p>
              </div>
            ))}
          </div>
          {/* Pie */}
          {retentionPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={retentionPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                  paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {retentionPieData.map((entry, i) => <Cell key={entry.name} fill={retentionColors[i]} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{ background: isDark ? '#27272a' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, borderRadius: 12, padding: '8px 14px' }}>
                        <p style={{ color: isDark ? '#fafafa' : '#111827', fontWeight: 700, fontSize: 13 }}>{payload[0].name}</p>
                        <p style={{ color: isDark ? '#9f9fa9' : '#6b7280', fontSize: 12 }}>{payload[0].value} customers</p>
                      </div>
                    );
                  }}
                />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ color: T.textSub, fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: T.textMuted }}>
              <p className="text-sm">No customer data yet</p>
            </div>
          )}
          {/* Top customers */}
          {topCustomers.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {topCustomers.slice(0, 3).map((cust, idx) => (
                <div key={cust.uid} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: T.tagBg }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7f32', color: '#fff' }}>
                    {idx + 1}
                  </div>
                  <p className="text-xs font-semibold flex-1 truncate" style={{ color: T.text }}>{cust.name}</p>
                  <p className="text-xs font-bold" style={{ color: T.accent }}>{cust.orderCount} orders</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Favourite Products ── */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: T.card, borderColor: T.cardBorder }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: isDark ? 'rgba(236,72,153,0.15)' : '#fdf2f8' }}>
            <FiHeart size={14} style={{ color: '#ec4899' }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: T.text }}>Customer Favourite Products</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: isDark ? 'rgba(236,72,153,0.15)' : '#fce7f3', color: '#ec4899' }}>
            By Order Volume
          </span>
        </div>
        {favProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favProducts.map((prod, idx) => {
              const maxCount = favProducts[0].count;
              const barPct = maxCount > 0 ? (prod.count / maxCount) * 100 : 0;
              const rankColors = ['#f59e0b', '#94a3b8', '#cd7f32', '#8b5cf6', '#06b6d4', '#ec4899'];
              return (
                <motion.div key={prod.name} whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-xl border p-4" style={{ background: T.tagBg, borderColor: T.cardBorder }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 text-white"
                      style={{ background: `linear-gradient(135deg,${rankColors[idx]},${rankColors[idx]}aa)` }}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: T.text }}>{prod.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: T.textSub }}>₹{prod.revenue.toFixed(0)} revenue</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-medium" style={{ color: T.textSub }}>Units Sold</span>
                      <span className="text-xs font-bold" style={{ color: T.text }}>{prod.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }} className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg,${rankColors[idx]},${rankColors[idx]}aa)` }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: T.textMuted }}>
            <FiHeart size={28} />
            <p className="text-sm">No order data yet — favourite products will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Extracted Sidebar Content ────────────────────────────────
// Sidebar always stays dark (per the reference design)
function SidebarContent({ navItems, activeTab, onTabChange, profileName, initials, T }) {
  const sidebarBg = T?.sidebar || '#1a0f08';
  const avatarBg = T?.avatarBg || '#7c3aed';   // teal in dark, purple in light
  const activeBg = T?.navActive || 'rgba(124,58,237,0.25)';
  const activeColor = T?.navActiveText || '#c4a882';
  const activeBdr = T?.navActiveBdr || '#c4a882';
  const navColor = 'rgba(255,255,255,0.45)';

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ background: sidebarBg }}>
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-colors duration-300"
            style={{ background: avatarBg }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate text-white">{profileName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Bakester Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              background: activeTab === item.id ? activeBg : 'transparent',
              color: activeTab === item.id ? activeColor : navColor,
              borderLeft: activeTab === item.id ? `3px solid ${activeBdr}` : '3px solid transparent',
            }}>
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Back to store */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Link to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = activeColor}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
          <FiArrowLeft size={14} />
          Back to Store
        </Link>
      </div>
    </div>
  );
}
