import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import {
  FiEdit2, FiPackage, FiHeart, FiSettings, FiLogOut,
  FiCamera, FiCheckCircle, FiAlertCircle, FiLayers, FiArrowRight,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const navItems = [
  { label: 'Profile',  icon: FiEdit2,    id: 'profile'  },
  { label: 'Orders',   icon: FiPackage,  id: 'orders'   },
  { label: 'Wishlist', icon: FiHeart,    id: 'wishlist'  },
  { label: 'Settings', icon: FiSettings, id: 'settings'  },
];

const statusColors = {
  Delivered:  'bg-green-50 text-green-700 border-green-200',
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped:    'bg-blue-50 text-blue-700 border-blue-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
};

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab]     = useState('profile');
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isAdminLocal, setIsAdminLocal]   = useState(false);

  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });

  // ── Sync profile → form ──────────────────────────────────
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone:     profile.phone     || '',
        address:   profile.address   || '',
      });
    }
  }, [profile]);

  // ── Admin check ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setIsAdminLocal(data.is_admin === true);
      });
  }, [user?.id]);

  // ── Fetch orders ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const run = async () => {
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, created_at, status, total, items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        if (!cancelled) setRecentOrders(data || []);
      } catch (err) {
        console.error('Orders error:', err.message);
        if (!cancelled) setRecentOrders([]);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !cancelled) run();
    });

    // 2. Auth listener to ensure token is attached
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !cancelled) run();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim(),
        address:   form.address.trim(),
      });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch (err) { console.error(err.message); }
  };

  // ── Utils ─────────────────────────────────────────────────
  const joinedDate = user?.created_at
    ? `Member since ${new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
    : 'New Member';

  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  // ── Tab content ───────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate">My Profile</h2>
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1 text-xs text-green-600 font-semibold"
                  >
                    <FiCheckCircle size={13} /> Saved!
                  </motion.span>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={editing ? handleSave : () => setEditing(true)}
                  disabled={saving}
                  className={editing ? 'btn-primary text-sm py-2 px-4 disabled:opacity-60' : 'btn-outline text-sm py-2 px-4'}
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Edit Profile'}
                </motion.button>
                {editing && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setEditing(false); setSaveError(''); }}
                    className="btn-ghost text-sm text-chocolate/50 py-2 px-3"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
                <FiAlertCircle size={15} className="flex-shrink-0" /> {saveError}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name',         key: 'full_name', type: 'text'  },
                { label: 'Email Address',     key: 'email',     type: 'email', readOnly: true },
                { label: 'Phone Number',      key: 'phone',     type: 'tel'   },
                { label: 'Delivery Address',  key: 'address',   type: 'text'  },
              ].map(({ label, key, type, readOnly }) => (
                <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-chocolate/70 mb-1.5">{label}</label>
                  {editing && !readOnly ? (
                    <input
                      type={type}
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-field text-sm"
                      placeholder={`Enter your ${label.toLowerCase()}`}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-cream-50 rounded-xl text-sm text-chocolate border border-cream-200">
                      {key === 'email' ? (user?.email || '—') : (form[key] || '—')}
                      {readOnly && (
                        <span className="ml-2 text-xs text-chocolate/40">(cannot change)</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent orders preview */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-chocolate">Recent Orders</h3>
                {recentOrders.length > 0 && (
                  <Link to="/orders" className="text-xs text-rose-bakery font-semibold hover:text-rose-dark">
                    View all →
                  </Link>
                )}
              </div>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />)}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 bg-cream-50 rounded-xl border border-cream-200">
                  <p className="text-3xl mb-2">📦</p>
                  <p className="text-sm text-chocolate/50 mb-2">No orders yet. Start shopping!</p>
                  <Link to="/products" className="text-rose-bakery text-sm font-semibold hover:text-rose-dark">
                    Browse Products →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id}
                      className="flex items-center justify-between gap-3 p-3.5 bg-cream-50 rounded-xl border border-cream-200 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-chocolate truncate">{order.order_number}</p>
                        <p className="text-xs text-chocolate/50">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusColors[order.status] || statusColors.Processing}`}>
                          {order.status}
                        </span>
                        <span className="font-bold text-sm text-chocolate">₹{order.total?.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate mb-5">My Orders</h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-cream-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-14 bg-cream-50 rounded-2xl border border-cream-200">
                <p className="text-5xl mb-4">📦</p>
                <h3 className="font-serif text-xl font-bold text-chocolate mb-2">No orders yet</h3>
                <p className="text-chocolate/50 mb-6 text-sm">Your orders will appear here once you've placed them.</p>
                <Link to="/products" className="btn-primary inline-block">Shop Now</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    whileHover={{ x: 2 }}
                    className="p-4 bg-cream-50 rounded-2xl border border-cream-200"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-rose-pale rounded-xl flex items-center justify-center flex-shrink-0">
                          <FiPackage className="text-rose-bakery" size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-chocolate text-sm truncate">{order.order_number}</p>
                          <p className="text-xs text-chocolate/50">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[order.status] || statusColors.Processing}`}>
                          {order.status}
                        </span>
                        <span className="font-bold font-serif text-chocolate">₹{order.total?.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <p className="text-xs text-chocolate/40 mt-2.5 pl-13 truncate">
                        {order.items.map((i) => `${i.name} ×${i.qty || 1}`).join(', ')}
                      </p>
                    )}

                    <div className="flex justify-end mt-2">
                      <Link to="/orders" className="text-xs text-rose-bakery font-semibold hover:text-rose-dark underline-offset-2 hover:underline">
                        View Details →
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'wishlist':
        return (
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate mb-5">My Wishlist</h2>
            <div className="text-center py-14 bg-cream-50 rounded-2xl border border-cream-200">
              <p className="text-5xl mb-4">💝</p>
              <h3 className="font-serif text-xl font-bold text-chocolate mb-2">Coming Soon</h3>
              <p className="text-chocolate/50 text-sm">Wishlist feature will be available soon.</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate mb-5">Account Settings</h2>
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-cream-50 rounded-2xl border border-cream-200">
                <p className="text-sm font-semibold text-chocolate mb-1">Email Address</p>
                <p className="text-sm text-chocolate/60 break-all">{user?.email}</p>
                <p className="text-xs text-chocolate/40 mt-1">{joinedDate}</p>
              </div>
              <div className="pt-4 border-t border-cream-200">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-red-500 font-semibold hover:text-red-700 hover:bg-red-50 transition-all border border-red-200"
                >
                  <FiLogOut size={16} /> Sign Out
                </motion.button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="pt-16 sm:pt-20 min-h-screen bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <AnimatedSection>

          {/* ── Profile hero card (always visible) ─────────── */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-5 sm:p-6 mb-5 flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-bakery flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                {getUserInitials()}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-rose-bakery rounded-full flex items-center justify-center text-white shadow"
                aria-label="Change avatar"
              >
                <FiCamera size={11} />
              </motion.button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-chocolate truncate">
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-xs text-chocolate/50 mt-0.5">{joinedDate}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-rose-bakery font-semibold px-2.5 py-0.5 bg-rose-pale rounded-full">
                  Club Member ✓
                </span>
                {isAdminLocal && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold px-2.5 py-0.5 bg-amber-50 border border-amber-300 rounded-full"
                  >
                    <FiLayers size={10} /> ADMIN
                  </motion.span>
                )}
              </div>
            </div>

            {/* Admin panel link (desktop only, visible in hero) */}
            {isAdminLocal && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 flex-shrink-0 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all"
              >
                <FiLayers size={13} /> Admin Panel
                <FiArrowRight size={12} />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* ── Sidebar (desktop) / Tab strip (mobile) ────── */}
            <div className="lg:col-span-1 space-y-4">
              {/* Mobile: horizontal scrollable tab pills */}
              <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 -mx-1 px-1 no-scrollbar">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                      activeTab === item.id
                        ? 'bg-rose-bakery text-white shadow-sm'
                        : 'bg-white text-chocolate/70 border border-cream-200 hover:border-rose-bakery/30'
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Desktop: vertical card nav */}
              <nav className="hidden lg:block bg-white rounded-3xl shadow-card p-3 space-y-1">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-rose-pale text-rose-bakery'
                        : 'text-chocolate/70 hover:bg-cream-50 hover:text-rose-bakery'
                    }`}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </motion.button>
                ))}
              </nav>

              {/* Admin panel card (desktop sidebar) */}
              {isAdminLocal && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hidden lg:block"
                >
                  <Link
                    to="/admin"
                    className="block bg-gradient-to-br from-[#1a1a24] to-[#2d1030] rounded-2xl p-4 group hover:shadow-xl hover:shadow-rose-bakery/20 transition-all border border-rose-bakery/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-rose-bakery/30 rounded-xl flex items-center justify-center">
                        <FiLayers size={17} className="text-rose-bakery" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Admin Panel</p>
                        <p className="text-[10px] text-rose-bakery/60">Inventory &amp; Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/50">Manage products &amp; stock</p>
                      <FiArrowRight size={14} className="text-rose-bakery group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Admin panel link (mobile — below tab strip) */}
              {isAdminLocal && (
                <Link
                  to="/admin"
                  className="lg:hidden flex items-center justify-between gap-2 w-full px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FiLayers size={15} /> Go to Admin Panel
                  </span>
                  <FiArrowRight size={14} />
                </Link>
              )}
            </div>

            {/* ── Main content ──────────────────────────────── */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-5 sm:p-7"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </AnimatedSection>
      </div>
    </main>
  );
}
