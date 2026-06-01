import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import AnimatedSection from '../components/ui/AnimatedSection';

export default function Cart() {
  const { items, removeItem, updateQuantity, cartTotal, clearCart } = useCart();

  const shipping = cartTotal > 50 ? 0 : 5.99;
  const tax = cartTotal * 0.08;
  const orderTotal = cartTotal + shipping + tax;

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
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
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
                        ${(item.price * item.quantity).toFixed(2)}
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
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-chocolate/70">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-chocolate/70">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-rose-bakery bg-rose-pale/50 px-3 py-2 rounded-lg">
                      🎁 Add ${(50 - cartTotal).toFixed(2)} more for free shipping!
                    </p>
                  )}
                  <div className="border-t border-cream-200 pt-3 flex justify-between font-bold text-chocolate text-base">
                    <span>Total</span>
                    <span className="font-serif text-xl">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="input-field flex-1 text-sm py-2"
                    aria-label="Promo code"
                  />
                  <button className="btn-outline text-sm px-4 py-2 whitespace-nowrap">Apply</button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                >
                  Checkout
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
