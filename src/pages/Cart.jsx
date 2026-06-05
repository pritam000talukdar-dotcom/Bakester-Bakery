import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight,
  FiX, FiCheck, FiMapPin, FiUser, FiPhone, FiMail,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import AnimatedSection from '../components/ui/AnimatedSection';
import { supabase } from '../lib/supabase';

// ── Order number generator
function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `BKS-${date}-${rand}`;
}

// ── Checkout Modal
function CheckoutModal({ isOpen, onClose, cartItems, cartTotal, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = details, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', notes: '',
  });
  const [orderNumber, setOrderNumber] = useState('');

  const shipping = cartTotal > 500 ? 0 : 49;
  const tax = cartTotal * 0.05;
  const orderTotal = cartTotal + shipping + tax;

  const validate = () => {
    if (!form.name.trim())    return 'Please enter your name.';
    if (!form.address.trim()) return 'Please enter your delivery address.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      // Get current user (may be null for guests)
      const { data: { user } } = await supabase.auth.getUser();

      const num = generateOrderNumber();
      const orderItems = cartItems.map((item) => ({
        id:       item.id,
        name:     item.name,
        price:    item.price,
        qty:      item.quantity,
        image:    item.image || item.image_url || '',
        category: item.category || '',
      }));

      const { error: insertErr } = await supabase.from('orders').insert({
        user_id:      user?.id || null,
        order_number: num,
        items:        orderItems,
        total:        orderTotal,
        address:      form.address,
        status:       'Processing',
        guest_name:   user ? null : form.name,
        guest_email:  user ? null : form.email,
        guest_phone:  user ? null : form.phone,
      });

      if (insertErr) throw insertErr;

      setOrderNumber(num);
      setStep(2);
    } catch (err) {
      setError('Failed to place order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (step === 1) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-cream-100">
              <div>
                <h2 className="font-serif text-xl font-bold text-chocolate">Complete Your Order</h2>
                <p className="text-xs text-chocolate/50 mt-0.5">No account needed — just fill in your details</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100 text-chocolate/40 hover:text-chocolate transition-all"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Order mini-summary */}
            <div className="px-6 py-4 bg-cream-50 border-b border-cream-100">
              <div className="flex items-center justify-between text-sm font-semibold text-chocolate mb-1">
              <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
              <span className="font-serif text-base">₹{orderTotal.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-chocolate/50">
              <span>Subtotal: ₹{cartTotal.toFixed(0)}</span>
              <span>Shipping: {shipping === 0 ? 'Free' : `₹${shipping.toFixed(0)}`}</span>
              <span>GST: ₹{tax.toFixed(0)}</span>
            </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-chocolate/60 mb-1.5">
                    <FiUser size={10} className="inline mr-1" />Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-bakery text-sm outline-none text-chocolate bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-chocolate/60 mb-1.5">
                    <FiPhone size={10} className="inline mr-1" />Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-bakery text-sm outline-none text-chocolate bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-chocolate/60 mb-1.5">
                  <FiMail size={10} className="inline mr-1" />Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="for order confirmation"
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-bakery text-sm outline-none text-chocolate bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-chocolate/60 mb-1.5">
                  <FiMapPin size={10} className="inline mr-1" />Delivery Address *
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street address, city, state, zip code…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-bakery text-sm outline-none text-chocolate bg-white resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-chocolate/60 mb-1.5">Special Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Allergies, cake message, delivery instructions…"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-bakery text-sm outline-none text-chocolate bg-white resize-none"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 rounded-2xl bg-rose-bakery text-white font-bold text-sm hover:bg-rose-dark disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    Confirm Order — ₹{orderTotal.toFixed(0)}
                    <FiArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          /* ── Success step ── */
          <div className="px-8 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheck size={36} className="text-emerald-500" />
            </motion.div>
            <h2 className="font-serif text-2xl font-bold text-chocolate mb-2">Order Placed! 🎂</h2>
            <p className="text-chocolate/60 mb-2">
              Thank you, <span className="font-semibold text-chocolate">{form.name}</span>!
            </p>
            <div className="inline-block bg-cream-50 rounded-2xl px-5 py-3 mb-6">
              <p className="text-xs text-chocolate/50 mb-1">Your Order Number</p>
              <p className="font-mono text-lg font-bold text-rose-bakery">{orderNumber}</p>
            </div>
            <p className="text-sm text-chocolate/60 mb-8">
              We've received your order and will start preparing it shortly. 
              {form.email && ' A confirmation will be sent to your email.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="flex-1 py-3 rounded-2xl bg-rose-bakery text-white font-bold text-sm hover:bg-rose-dark transition-all"
              >
                Continue Shopping
              </button>
              <Link
                to="/orders"
                onClick={() => { onSuccess(); onClose(); }}
                className="flex-1 py-3 rounded-2xl border-2 border-chocolate text-chocolate font-bold text-sm hover:bg-cream-50 transition-all text-center"
              >
                View Orders
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Cart Page ─────────────────────────────────────────────
export default function Cart() {
  const { items, removeItem, updateQuantity, cartTotal, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const navigate = useNavigate();

  const shipping = cartTotal > 500 ? 0 : 49;
  const tax = cartTotal * 0.05;
  const orderTotal = cartTotal + shipping + tax;

  const handleOrderSuccess = () => {
    clearCart();
  };

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <AnimatedSection className="text-center py-20">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-8xl mb-6"
          >
            🛒
          </motion.div>
          <h2 className="font-serif text-4xl font-bold text-chocolate mb-3">Your cart is empty</h2>
          <p className="text-chocolate/60 mb-8 max-w-sm mx-auto">
            Looks like you haven't added anything yet. Explore our delicious collection!
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <FiShoppingBag size={16} />
            Explore Products
          </Link>
        </AnimatedSection>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen bg-cream-50">
      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            cartItems={items}
            cartTotal={cartTotal}
            onSuccess={handleOrderSuccess}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-chocolate">Shopping Cart</h1>
          <p className="text-chocolate/60 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-card p-5 flex flex-col sm:flex-row gap-5"
                >
                  <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                    {item.image || item.image_url ? (
                      <img
                        src={item.image || item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎂</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {item.category && (
                          <p className="text-[11px] text-rose-bakery font-semibold uppercase tracking-wider mb-1">
                            {item.category}
                          </p>
                        )}
                        <h3 className="font-serif text-lg font-semibold text-chocolate">{item.name}</h3>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-chocolate/40 hover:text-red-500 transition-all flex-shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <FiTrash2 size={15} />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-2 bg-cream-50 rounded-full px-2 py-1">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-rose-pale text-chocolate transition-all"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={13} />
                        </motion.button>
                        <span className="w-6 text-center font-bold text-chocolate text-sm">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-rose-pale text-chocolate transition-all"
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={13} />
                        </motion.button>
                      </div>

                      <span className="font-serif text-xl font-bold text-chocolate">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-chocolate/40 hover:text-red-500 transition-colors font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <AnimatedSection direction="right" className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
                <h3 className="font-serif text-xl font-bold text-chocolate">Order Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-chocolate/70">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-chocolate/70">
                    <span>Delivery</span>
                    <span>
                      {shipping === 0
                        ? <span className="text-green-600 font-semibold">Free</span>
                        : `₹${shipping.toFixed(0)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-chocolate/70">
                    <span>GST (5%)</span>
                    <span>₹{tax.toFixed(0)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-rose-bakery bg-rose-pale/50 px-3 py-2 rounded-lg">
                      🎁 Add ₹{(500 - cartTotal).toFixed(0)} more for free delivery!
                    </p>
                  )}
                  <div className="border-t border-cream-200 pt-3 flex justify-between font-bold text-chocolate text-base">
                    <span>Total</span>
                    <span className="font-serif text-xl">₹{orderTotal.toFixed(0)}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCheckoutOpen(true)}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                  id="checkout-button"
                >
                  Proceed to Checkout
                  <FiArrowRight size={16} />
                </motion.button>

                <Link to="/products" className="block text-center text-sm text-rose-bakery hover:text-rose-dark transition-colors">
                  ← Continue Shopping
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </main>
  );
}
