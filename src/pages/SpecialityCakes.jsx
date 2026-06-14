import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiX, FiShoppingCart, FiChevronDown, FiStar, FiHeart } from 'react-icons/fi';
import { HiStar, HiOutlineHeart, HiHeart } from 'react-icons/hi2';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';

// ── Servings helper ───────────────────────────────────────────
function calcServings(product) {
  const w = Number(product.weight_g || product.weight);
  if (!w || isNaN(w)) return null;
  const s = Math.round(w / 85);
  return s >= 1 ? s : null;
}

// ── Skeleton ──────────────────────────────────────────────────
function CakeSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-card animate-pulse">
      <div className="h-72 bg-gradient-to-br from-cream-100 to-rose-pale/30" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-cream-200 rounded w-1/3" />
        <div className="h-5 bg-cream-200 rounded w-3/4" />
        <div className="h-3 bg-cream-100 rounded w-full" />
        <div className="h-3 bg-cream-100 rounded w-2/3" />
        <div className="flex justify-between mt-4">
          <div className="h-6 bg-cream-200 rounded w-20" />
          <div className="h-9 bg-cream-200 rounded-full w-28" />
        </div>
      </div>
    </div>
  );
}

// ── Cake Detail Modal ─────────────────────────────────────────
function CakeModal({ product, onClose }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const servings = calcServings(product);
  const outOfStock = product.in_stock === false;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem({ ...product, image: product.image_url || product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // Split recipe into paragraphs for nice display
  const recipeSteps = product.recipe
    ? product.recipe.split('\n').filter((l) => l.trim())
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full sm:max-w-2xl bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image header */}
        <div className="relative h-64 sm:h-80 flex-shrink-0 overflow-hidden">
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-100 to-rose-pale/40">
              <span className="text-8xl">🎂</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-chocolate/70 via-transparent to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-chocolate hover:bg-white transition-all shadow-md"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-4 left-4 bg-rose-bakery text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow">
              {product.badge}
            </span>
          )}

          {/* Name + price overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-rose-light text-xs font-bold uppercase tracking-widest mb-1">
              Bakester Bakery · Speciality
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5">

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-serif text-2xl font-bold text-chocolate">
              <span className="text-xl">₹</span>{product.price?.toFixed(0)}
            </span>
            {servings && (
              <span className="text-xs bg-cream-100 text-chocolate/70 px-3 py-1 rounded-full font-medium">
                🍰 Serves ~{servings} people
              </span>
            )}
            {product.rating > 0 && (
              <span className="flex items-center gap-1 text-xs bg-gold/10 text-chocolate px-3 py-1 rounded-full font-medium">
                <HiStar size={13} className="text-gold" />
                {product.rating}
              </span>
            )}
            {outOfStock ? (
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-semibold">
                Out of Stock
              </span>
            ) : product.displayQuantity > 0 ? (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                {product.displayQuantity} left
              </span>
            ) : null}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-chocolate/70 text-sm sm:text-base leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Recipe / How it's made */}
          {recipeSteps.length > 0 && (
            <div className="bg-gradient-to-br from-cream-50 to-rose-pale/20 rounded-2xl p-5 border border-cream-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">👩‍🍳</span>
                <h3 className="font-serif text-lg font-bold text-chocolate">How It's Made</h3>
              </div>
              <div className="space-y-3">
                {recipeSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-3 items-start"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-bakery text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-chocolate/80 leading-relaxed">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No recipe message */}
          {recipeSteps.length === 0 && (
            <div className="bg-cream-50 rounded-2xl p-5 border border-cream-200 text-center">
              <span className="text-3xl mb-2 block">✨</span>
              <p className="text-sm text-chocolate/60 italic">
                "Made with grandma's secret recipe and a generous handful of love."
              </p>
              <p className="text-xs text-chocolate/40 mt-1">— Bakester Bakery</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-cream-100 flex items-center gap-3">
          <button
            onClick={() => setLiked((v) => !v)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 border ${
              liked ? 'bg-rose-bakery border-rose-bakery text-white' : 'border-cream-300 text-rose-bakery hover:bg-rose-pale'
            }`}
            aria-label="Wishlist"
          >
            {liked ? <HiHeart size={18} /> : <HiOutlineHeart size={18} />}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={outOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-bakery text-white hover:bg-rose-dark'
            }`}
          >
            {!added && <FiShoppingCart size={16} />}
            {outOfStock ? 'Unavailable' : added ? '✓ Added to Cart!' : 'Add to Cart'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Speciality Cake Card ──────────────────────────────────────
function SpecialityCakeCard({ product, onClick, index }) {
  const servings = calcServings(product);
  const outOfStock = product.in_stock === false;
  const hasRecipe = product.recipe && product.recipe.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.3), duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className={`relative rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-400 ${outOfStock ? 'opacity-75' : ''}`}>

        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-108"
              style={{ transitionDuration: '600ms' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-100 to-rose-pale/40">
              <span className="text-6xl mb-2">🎂</span>
              <span className="text-xs text-chocolate/40 font-medium">No image</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-chocolate/60 via-chocolate/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 bg-gray-800/80 text-white text-xs font-bold rounded-full tracking-wide">
                Out of Stock
              </span>
            </div>
          )}

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-rose-bakery text-white text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-sm">
              {product.badge}
            </span>
          )}

          {/* Recipe chip — shows if recipe exists */}
          {hasRecipe && (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-chocolate/70 text-[9px] px-2 py-0.5 rounded-full font-semibold shadow-sm flex items-center gap-1">
              👩‍🍳 Recipe inside
            </span>
          )}

          {/* View detail hint */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="bg-white/90 backdrop-blur-sm text-chocolate text-xs font-bold px-4 py-1.5 rounded-full shadow">
              View Details →
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          <p className="text-[10px] sm:text-[11px] text-rose-bakery font-bold uppercase tracking-widest mb-1.5">
            Bakester Speciality
          </p>

          {/* Name */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-chocolate mb-2 leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs sm:text-[13px] text-chocolate/55 mb-3 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <HiStar
                  key={s}
                  size={11}
                  className={s <= Math.round(product.rating) ? 'text-gold' : 'text-cream-300'}
                />
              ))}
              <span className="text-[10px] text-chocolate/50 ml-1">{product.rating}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-cream-100 pt-3 flex items-end justify-between gap-2">
            <div>
              <div className="font-serif text-lg sm:text-xl font-bold text-chocolate flex items-baseline gap-0.5">
                <span className="text-base">₹</span>
                {product.price?.toFixed(0)}
              </div>
              {servings && (
                <p className="text-[10px] text-chocolate/50 mt-0.5">
                  Serves ~{servings} people
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => { e.stopPropagation(); onClick(product); }}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-rose-bakery text-white hover:bg-rose-dark transition-all flex-shrink-0"
            >
              View Cake
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Contact Form ──────────────────────────────────────────────
const themes = ['Wedding', 'Birthday', 'Anniversary', 'Baby Shower', 'Corporate', 'Other'];

function OrderForm() {
  const [form, setForm] = useState({ fullName: '', lastName: '', email: '', phone: '', theme: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({ fullName: '', lastName: '', email: '', phone: '', theme: '', message: '' }); }, 5000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-card p-10 text-center"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="font-serif text-2xl font-bold text-chocolate mb-2">Request Received!</h3>
        <p className="text-chocolate/60 text-sm max-w-sm mx-auto">
          Thank you! We'll reach out within 24 hours to discuss your dream cake at Bakester Bakery.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-card p-7 sm:p-10 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-chocolate mb-1.5">First Name</label>
          <input id="fullName" name="fullName" type="text" required value={form.fullName}
            onChange={handleChange} placeholder="e.g. Priya" className="input-field" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-chocolate mb-1.5">Last Name</label>
          <input id="lastName" name="lastName" type="text" value={form.lastName}
            onChange={handleChange} placeholder="e.g. Sharma" className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-chocolate mb-1.5">Email</label>
          <input id="email" name="email" type="email" required value={form.email}
            onChange={handleChange} placeholder="you@email.com" className="input-field" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-chocolate mb-1.5">Phone</label>
          <input id="phone" name="phone" type="tel" value={form.phone}
            onChange={handleChange} placeholder="+91 98765 43210" className="input-field" />
        </div>
      </div>
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-chocolate mb-1.5">Occasion</label>
        <div className="relative">
          <select id="theme" name="theme" value={form.theme} onChange={handleChange}
            className="input-field appearance-none pr-10 cursor-pointer">
            <option value="">Select occasion…</option>
            {themes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-chocolate mb-1.5">
          Your Dream Cake — Flavours, Design & Size
        </label>
        <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange}
          placeholder="Tell us about your vision — flavours, colours, number of tiers, servings needed…"
          className="input-field resize-none" />
      </div>
      <div className="text-center pt-1">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="btn-primary px-10 py-4 text-base"
        >
          Request a Consultation ✨
        </motion.button>
      </div>
    </motion.form>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SpecialityCakes() {
  const { products, loading } = useProducts();
  const [selectedCake, setSelectedCake] = useState(null);

  // Filter only Speciality category products
  const specialityProducts = useMemo(() =>
    products.filter((p) => p.category === 'Speciality'),
    [products]
  );

  return (
    <main className="pt-20 bg-cream-50">

      {/* ── Premium Hero ── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1400&h=800&fit=crop&auto=format&q=80')` }}
        />
        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-chocolate/75 via-chocolate/55 to-rose-dark/40" />

        {/* Decorative golden ring */}
        <div className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-gold/20 hidden lg:block" />
        <div className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-gold/15 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-gold text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-5 flex items-center gap-3"
            >
              <span className="w-8 h-px bg-gold/60" />
              Bakester Bakery — Speciality Collection
              <span className="w-8 h-px bg-gold/60" />
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
            >
              Artisan Cakes,<br />
              <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">
                Crafted with Love
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-xl"
            >
              Every speciality cake at Bakester Bakery is made from scratch — using
              grandma's time-tested recipes, the finest local ingredients, and a mother's
              touch that makes every bite unforgettable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#collection"
                className="btn-primary px-8 py-3.5 text-sm"
              >
                Explore Our Cakes ↓
              </a>
              <a
                href="#custom-order"
                className="px-8 py-3.5 text-sm font-semibold text-white border border-white/40 rounded-full hover:bg-white/10 transition-all"
              >
                Order Custom Cake
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6 mt-12"
            >
              {[
                { icon: '🏡', label: 'Home Baked' },
                { icon: '🌿', label: 'Fresh Ingredients' },
                { icon: '❤️', label: 'Made with Love' },
                { icon: '✨', label: 'Custom Designs' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-white/60 text-xs font-medium">{b.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Signature Quote Strip ── */}
      <section className="py-10 bg-gradient-to-r from-rose-bakery via-rose-dark to-rose-bakery overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-serif text-white text-xl sm:text-2xl lg:text-3xl font-light italic leading-relaxed">
            "Every cake tells a story — baked from the heart, served with joy."
          </p>
          <p className="text-white/60 text-sm mt-3 font-medium tracking-wide">— Bakester Bakery</p>
        </div>
      </section>

      {/* ── Speciality Collection ── */}
      <section id="collection" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-rose-bakery text-xs font-bold uppercase tracking-widest mb-3"
            >
              Handcrafted Selection
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="section-title mb-4"
            >
              The Speciality Collection
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="section-subtitle"
            >
              Click on any cake to discover the recipe and story behind it.
              Every creation is available for order — fresh and made to perfection.
            </motion.p>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => <CakeSkeleton key={i} />)}
            </div>
          ) : specialityProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-3xl border border-cream-200 max-w-2xl mx-auto"
            >
              <div className="text-7xl mb-5">🎂</div>
              <h3 className="font-serif text-2xl font-bold text-chocolate mb-3">
                Speciality Cakes Coming Soon
              </h3>
              <p className="text-chocolate/55 text-sm mb-6 max-w-sm mx-auto">
                Our baker is perfecting her signature recipes. Check back soon for our
                exclusive speciality collection!
              </p>
              <Link to="/products" className="btn-primary inline-block">
                Browse All Products
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {specialityProducts.map((product, i) => (
                <SpecialityCakeCard
                  key={product.id}
                  product={product}
                  index={i}
                  onClick={setSelectedCake}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Choose Bakester ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Why Choose Bakester Bakery?</h2>
            <p className="section-subtitle">Premium quality baked into every slice.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🧁', title: 'Small Batch', desc: 'Made in limited quantities so every cake receives full attention.' },
              { icon: '🌾', title: 'Fresh Daily', desc: 'Baked fresh every morning using locally sourced ingredients.' },
              { icon: '📖', title: 'Secret Recipes', desc: 'Grandma\'s time-tested recipes, perfected over generations.' },
              { icon: '🎨', title: 'Custom Designs', desc: 'Your vision brought to life with artistic precision.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-5"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-serif text-base font-bold text-chocolate mb-2">{item.title}</h3>
                <p className="text-xs text-chocolate/55 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Custom Order Form ── */}
      <section id="custom-order" className="py-20 sm:py-28 bg-gradient-to-br from-cream-100 via-white to-rose-pale/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-rose-bakery text-xs font-bold uppercase tracking-widest mb-3"
            >
              Bespoke Creations
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-title mb-4"
            >
              Order Your Dream Cake
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="section-subtitle"
            >
              Weddings, birthdays, anniversaries — we craft bespoke cakes for your most
              precious moments. Fill the form and we'll reach out within 24 hours.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <OrderForm />
          </motion.div>
        </div>
      </section>

      {/* ── Cake Modal ── */}
      <AnimatePresence>
        {selectedCake && (
          <CakeModal
            product={selectedCake}
            onClose={() => setSelectedCake(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
