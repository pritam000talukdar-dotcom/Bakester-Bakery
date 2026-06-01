import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const mockOrders = [
  {
    id: 'ORD-2024-001',
    items: [
      { name: 'Red Velvet Dream', qty: 1, price: 48, image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=80&h=80&fit=crop' },
    ],
    date: 'May 28, 2024',
    status: 'Delivered',
    total: 53,
    address: '45 Maple Avenue, New York',
    tracking: 'TRK-998821',
  },
  {
    id: 'ORD-2024-002',
    items: [
      { name: 'Triple Cocoa Brownie', qty: 2, price: 28, image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=80&h=80&fit=crop' },
      { name: 'Exotic Pineapple Cake', qty: 1, price: 49, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=80&h=80&fit=crop' },
    ],
    date: 'May 20, 2024',
    status: 'Processing',
    total: 110,
    address: '45 Maple Avenue, New York',
    tracking: 'TRK-998822',
  },
  {
    id: 'ORD-2024-003',
    items: [
      { name: 'Classic Pineapple Cream', qty: 1, price: 35, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=80&h=80&fit=crop' },
    ],
    date: 'May 10, 2024',
    status: 'Delivered',
    total: 40,
    address: '45 Maple Avenue, New York',
    tracking: 'TRK-998800',
  },
];

const statusConfig = {
  Delivered: { color: 'text-green-700 bg-green-50', icon: FiCheckCircle, iconColor: 'text-green-600' },
  Processing: { color: 'text-amber-700 bg-amber-50', icon: FiClock, iconColor: 'text-amber-600' },
  Shipped: { color: 'text-blue-700 bg-blue-50', icon: FiTruck, iconColor: 'text-blue-600' },
  Cancelled: { color: 'text-red-700 bg-red-50', icon: FiPackage, iconColor: 'text-red-600' },
};

const orderSteps = [
  { label: 'Order Placed', icon: FiPackage },
  { label: 'Baking', icon: '🎂' },
  { label: 'Out for Delivery', icon: FiTruck },
  { label: 'Delivered', icon: FiCheckCircle },
];

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] || statusConfig.Processing;
  const StatusIcon = cfg.icon;

  const stepIndex = order.status === 'Delivered' ? 3 : order.status === 'Shipped' ? 2 : order.status === 'Processing' ? 1 : 0;

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-pale rounded-xl flex items-center justify-center flex-shrink-0">
            <FiPackage className="text-rose-bakery" size={20} />
          </div>
          <div>
            <p className="font-semibold text-chocolate">{order.id}</p>
            <p className="text-xs text-chocolate/50">{order.date} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${cfg.color}`}>
            <StatusIcon size={11} className={cfg.iconColor} />
            {order.status}
          </span>
          <span className="font-serif text-xl font-bold text-chocolate">${order.total}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <FiChevronDown className="text-chocolate/40" size={18} />
          </motion.div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-cream-200 pt-5">
              {/* Order tracking bar */}
              <div className="relative">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-5 h-0.5 bg-cream-200" />
                  <div
                    className="absolute left-0 top-5 h-0.5 bg-rose-bakery transition-all"
                    style={{ width: `${(stepIndex / 3) * 100}%` }}
                  />
                  {orderSteps.map((step, i) => (
                    <div key={step.label} className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        i <= stepIndex ? 'bg-rose-bakery text-white' : 'bg-cream-200 text-chocolate/40'
                      }`}>
                        {typeof step.icon === 'string' ? (
                          <span className="text-base">{step.icon}</span>
                        ) : (
                          <step.icon size={16} />
                        )}
                      </div>
                      <p className="text-[10px] text-chocolate/60 font-medium text-center">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-chocolate">{item.name}</p>
                      <p className="text-xs text-chocolate/50">Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold text-chocolate">${item.price * item.qty}</p>
                  </div>
                ))}
              </div>

              {/* Delivery & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-cream-50 rounded-xl">
                  <p className="text-xs text-chocolate/50 mb-1">Delivery Address</p>
                  <p className="text-chocolate font-medium">{order.address}</p>
                </div>
                <div className="p-3 bg-cream-50 rounded-xl">
                  <p className="text-xs text-chocolate/50 mb-1">Tracking Number</p>
                  <p className="text-chocolate font-mono font-bold">{order.tracking}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-outline text-sm flex-1">Reorder</button>
                {order.status !== 'Delivered' && (
                  <button className="btn-ghost text-sm text-red-500 hover:text-red-700">Cancel Order</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Orders() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Processing', 'Delivered', 'Cancelled'];

  const filtered = filter === 'All' ? mockOrders : mockOrders.filter(o => o.status === filter);

  return (
    <main className="pt-20 min-h-screen bg-cream-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection>
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-chocolate mb-2">My Orders</h1>
            <p className="text-chocolate/60">Track and manage your Bakester orders</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {filters.map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  filter === f
                    ? 'bg-rose-bakery text-white shadow-rose'
                    : 'bg-white text-chocolate/70 hover:bg-cream-200 shadow-sm'
                }`}
              >
                {f}
              </motion.button>
            ))}
          </div>

          {/* Order list */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="font-serif text-xl font-bold text-chocolate mb-2">No orders found</h3>
                <p className="text-chocolate/50 mb-6">You don't have any {filter.toLowerCase()} orders.</p>
                <Link to="/products" className="btn-primary inline-block">
                  Shop Now
                </Link>
              </div>
            ) : (
              filtered.map((order) => (
                <AnimatedSection key={order.id}>
                  <OrderCard order={order} />
                </AnimatedSection>
              ))
            )}
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
