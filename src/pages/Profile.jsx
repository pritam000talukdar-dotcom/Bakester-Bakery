import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiEdit2, FiPackage, FiHeart, FiSettings, FiLogOut, FiCamera, FiMapPin } from 'react-icons/fi';

const navItems = [
  { label: 'My Profile', icon: FiEdit2, id: 'profile' },
  { label: 'My Orders', icon: FiPackage, id: 'orders' },
  { label: 'Wishlist', icon: FiHeart, id: 'wishlist' },
  { label: 'Settings', icon: FiSettings, id: 'settings' },
];

const mockOrders = [
  { id: 'ORD-001', name: 'Red Velvet Dream', date: 'May 28, 2024', status: 'Delivered', amount: 48 },
  { id: 'ORD-002', name: 'Triple Cocoa Brownie', date: 'May 20, 2024', status: 'Processing', amount: 28 },
  { id: 'ORD-003', name: 'Exotic Pineapple Cake', date: 'May 10, 2024', status: 'Delivered', amount: 49 },
];

const statusColors = {
  Delivered: 'bg-green-50 text-green-700',
  Processing: 'bg-amber-50 text-amber-700',
  Cancelled: 'bg-red-50 text-red-700',
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 234-5678',
    address: '45 Maple Avenue, New York, NY 10001',
    joined: 'Member since January 2022',
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-chocolate">My Profile</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(!editing)}
                className={editing ? 'btn-primary text-sm' : 'btn-outline text-sm'}
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email Address', key: 'email', type: 'email' },
                { label: 'Phone Number', key: 'phone', type: 'tel' },
                { label: 'Delivery Address', key: 'address', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-chocolate/70 mb-2">{label}</label>
                  {editing ? (
                    <input
                      type={type}
                      value={profile[key]}
                      onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-cream-50 rounded-xl text-sm text-chocolate border border-cream-200">
                      {profile[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Orders preview */}
            <div className="mt-6">
              <h3 className="font-serif text-xl font-bold text-chocolate mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {mockOrders.slice(0, 2).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200">
                    <div>
                      <p className="font-semibold text-sm text-chocolate">{order.name}</p>
                      <p className="text-xs text-chocolate/50">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="font-bold text-chocolate">${order.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="mt-4 text-rose-bakery text-sm font-semibold hover:text-rose-dark transition-colors"
              >
                View all orders →
              </button>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">My Orders</h2>
            <div className="space-y-4">
              {mockOrders.map((order) => (
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
                      <p className="font-semibold text-chocolate">{order.name}</p>
                      <p className="text-xs text-chocolate/50">{order.id} · {order.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-xl font-serif text-chocolate">${order.amount}</span>
                    <Link to="/orders" className="text-xs text-rose-bakery font-semibold hover:text-rose-dark underline-offset-2 hover:underline">
                      Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">My Wishlist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Floral Birthday Dream', price: 68, image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=300&h=200&fit=crop' },
                { name: 'Belgian Chocolate', price: 42, image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5994?w=300&h=200&fit=crop' },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ y: -3 }} className="bg-white rounded-2xl overflow-hidden shadow-card">
                  <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-chocolate">{item.name}</p>
                      <p className="font-bold text-chocolate mt-1">${item.price}</p>
                    </div>
                    <button className="btn-primary text-xs py-2">Add to Cart</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-6">Account Settings</h2>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive order updates and promotions', enabled: true },
                { label: 'SMS Alerts', desc: 'Get delivery updates via text', enabled: false },
                { label: 'Newsletter', desc: 'Weekly baking tips and new arrivals', enabled: true },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-5 bg-cream-50 rounded-2xl">
                  <div>
                    <p className="font-semibold text-sm text-chocolate">{setting.label}</p>
                    <p className="text-xs text-chocolate/50 mt-0.5">{setting.desc}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${setting.enabled ? 'bg-rose-bakery' : 'bg-cream-300'}`}
                    role="switch"
                    aria-checked={setting.enabled}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${setting.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-cream-200">
                <button className="flex items-center gap-2 text-sm text-red-500 font-semibold hover:text-red-700 transition-colors">
                  <FiLogOut size={16} />
                  Sign Out
                </button>
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
                  <div className="w-20 h-20 rounded-full bg-rose-pale flex items-center justify-center text-3xl mx-auto">
                    🧁
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-rose-bakery rounded-full flex items-center justify-center text-white shadow"
                    aria-label="Change avatar"
                  >
                    <FiCamera size={12} />
                  </motion.button>
                </div>
                <h3 className="font-serif text-lg font-bold text-chocolate">{profile.name}</h3>
                <p className="text-xs text-chocolate/50 mt-1">{profile.joined}</p>
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
