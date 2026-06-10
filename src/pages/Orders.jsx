import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  const stepIndex =
    order.status === 'Delivered' ? 3
    : order.status === 'Shipped' ? 2
    : order.status === 'Processing' ? 1
    : 0;

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <motion.div layout className="bg-white rounded-2xl shadow-card overflow-hidden">
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
            <p className="font-semibold text-chocolate">{order.order_number}</p>
            <p className="text-xs text-chocolate/50">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })} · {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${cfg.color}`}>
            <StatusIcon size={11} className={cfg.iconColor} />
            {order.status}
          </span>
          <span className="font-serif text-xl font-bold text-chocolate">₹{order.total?.toFixed(0)}</span>
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
              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-chocolate">{item.name}</p>
                        <p className="text-xs text-chocolate/50">Qty: {item.qty || item.quantity || 1}</p>
                      </div>
                      <p className="font-bold text-chocolate">
                        ₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {order.address && (
                  <div className="p-3 bg-cream-50 rounded-xl">
                    <p className="text-xs text-chocolate/50 mb-1">Delivery Address</p>
                    <p className="text-chocolate font-medium">{order.address}</p>
                  </div>
                )}
                {order.tracking && (
                  <div className="p-3 bg-cream-50 rounded-xl">
                    <p className="text-xs text-chocolate/50 mb-1">Tracking Number</p>
                    <p className="text-chocolate font-mono font-bold">{order.tracking}</p>
                  </div>
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
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

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

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl shadow-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <div className="text-5xl mb-4">📦</div>
                  <h3 className="font-serif text-xl font-bold text-chocolate mb-2">
                    {orders.length === 0 ? 'No orders yet' : 'No orders found'}
                  </h3>
                  <p className="text-chocolate/50 mb-6">
                    {orders.length === 0
                      ? "You haven't placed any orders yet. Start shopping!"
                      : `You don't have any ${filter.toLowerCase()} orders.`}
                  </p>
                  <Link to="/products" className="btn-primary inline-block">Shop Now</Link>
                </div>
              ) : (
                filtered.map((order) => (
                  <AnimatedSection key={order.id}>
                    <OrderCard order={order} />
                  </AnimatedSection>
                ))
              )}
            </div>
          )}
        </AnimatedSection>
      </div>
    </main>
  );
}
