import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiEdit2, FiPackage, FiHeart, FiSettings, FiLogOut, FiCamera, FiCheckCircle, FiAlertCircle, FiLayers, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const navItems = [
  { label: 'My Profile', icon: FiEdit2, id: 'profile' },
  { label: 'My Orders', icon: FiPackage, id: 'orders' },
  { label: 'Wishlist', icon: FiHeart, id: 'wishlist' },
  { label: 'Settings', icon: FiSettings, id: 'settings' },
];

const statusColors = {
  Delivered: 'bg-green-50 text-green-700',
  Processing: 'bg-amber-50 text-amber-700',
  Shipped: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-700',
};

export default function Profile() {
  const { user, profile, isAdmin, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  // Sync form with profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Fetch recent orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        if (error) throw error;
        setRecentOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
        setRecentOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
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
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err.message);
    }
  };

  const joinedDate = user?.created_at
    ? `Member since ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'New Member';

  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-chocolate">My Profile</h2>
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={editing ? handleSave : () => setEditing(true)}
                  disabled={saving}
                  className={editing ? 'btn-primary text-sm disabled:opacity-60' : 'btn-outline text-sm'}
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Edit Profile'}
                </motion.button>
                {editing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setEditing(false); setSaveError(''); }}
                    className="btn-ghost text-sm text-chocolate/50"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
                <FiAlertCircle size={15} /> {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text' },
                { label: 'Email Address', key: 'email', type: 'email', readOnly: true },
                { label: 'Phone Number', key: 'phone', type: 'tel' },
                { label: 'Delivery Address', key: 'address', type: 'text' },
              ].map(({ label, key, type, readOnly }) => (
                <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-chocolate/70 mb-2">{label}</label>
                  {editing && !readOnly ? (
                    <input
                      type={type}
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-field"
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

            {/* Recent Orders Preview */}
            <div className="mt-6">
              <h3 className="font-serif text-xl font-bold text-chocolate mb-4">Recent Orders</h3>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 bg-cream-50 rounded-xl border border-cream-200">
                  <p className="text-4xl mb-2">📦</p>
                  <p className="text-sm text-chocolate/50">No orders yet. Start shopping!</p>
                  <Link to="/products" className="text-rose-bakery text-sm font-semibold hover:text-rose-dark mt-2 inline-block">
                    Browse Products →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200">
                      <div>
                        <p className="font-semibold text-sm text-chocolate">{order.order_number}</p>
                        <p className="text-xs text-chocolate/50">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[order.status] || statusColors.Processing}`}>
                          {order.status}
                        </span>
                        <span className="font-bold text-chocolate">${order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/orders"
                    className="block mt-2 text-rose-bakery text-sm font-semibold hover:text-rose-dark transition-colors"
                  >
                    View all orders →
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">My Orders</h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-cream-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-16 bg-cream-50 rounded-2xl border border-cream-200">
                <p className="text-5xl mb-4">📦</p>
                <h3 className="font-serif text-xl font-bold text-chocolate mb-2">No orders yet</h3>
                <p className="text-chocolate/50 mb-6">Your orders will appear here once you've placed them.</p>
                <Link to="/products" className="btn-primary inline-block">Shop Now</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    whileHover={{ x: 4 }}
                    className="p-5 bg-cream-50 rounded-2xl border border-cream-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-pale rounded-xl flex items-center justify-center">
                        <FiPackage className="text-rose-bakery" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-chocolate">{order.order_number}</p>
                        <p className="text-xs text-chocolate/50">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColors[order.status] || statusColors.Processing}`}>
                        {order.status}
                      </span>
                      <span className="font-bold text-xl font-serif text-chocolate">${order.total?.toFixed(2)}</span>
                      <Link to="/orders" className="text-xs text-rose-bakery font-semibold hover:text-rose-dark underline-offset-2 hover:underline">
                        Details
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
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">My Wishlist</h2>
            <div className="text-center py-16 bg-cream-50 rounded-2xl border border-cream-200">
              <p className="text-5xl mb-4">💝</p>
              <h3 className="font-serif text-xl font-bold text-chocolate mb-2">Coming Soon</h3>
              <p className="text-chocolate/50">Wishlist feature will be available soon.</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">Account Settings</h2>
            <div className="space-y-4">
              <div className="p-5 bg-cream-50 rounded-2xl border border-cream-200">
                <p className="text-sm font-semibold text-chocolate mb-1">Email Address</p>
                <p className="text-sm text-chocolate/60">{user?.email}</p>
                <p className="text-xs text-chocolate/40 mt-1">{joinedDate}</p>
              </div>

              <div className="pt-4 border-t border-cream-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-red-500 font-semibold hover:text-red-700 hover:bg-red-50 transition-all border border-red-200"
                >
                  <FiLogOut size={16} />
                  Sign Out
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
    <main className="pt-20 min-h-screen bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-card p-6 text-center mb-5">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full bg-rose-bakery flex items-center justify-center text-2xl font-bold text-white mx-auto">
                    {getUserInitials()}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-rose-bakery rounded-full flex items-center justify-center text-white shadow"
                    aria-label="Change avatar"
                  >
                    <FiCamera size={12} />
                  </motion.button>
                </div>
                <h3 className="font-serif text-lg font-bold text-chocolate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-xs text-chocolate/50 mt-1">{joinedDate}</p>
                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-rose-pale rounded-full">
                  <span className="text-xs text-rose-bakery font-semibold">Club Member ✓</span>
                </div>
              </div>

              {/* Nav */}
              <nav className="bg-white rounded-3xl shadow-card p-3 space-y-1">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
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

              {/* Admin quick access — only visible to admin users */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Link
                    to="/admin"
                    className="block bg-gradient-to-br from-[#1a1a24] to-[#2a1a24] rounded-2xl p-4 group hover:shadow-xl transition-all border border-white/5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-rose-bakery/20 rounded-xl flex items-center justify-center">
                        <FiLayers size={17} className="text-rose-bakery" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Admin Panel</p>
                        <p className="text-[10px] text-white/30">Inventory & Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/40">Manage products, pricing &amp; stock</p>
                      <FiArrowRight size={13} className="text-rose-bakery opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-card p-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
