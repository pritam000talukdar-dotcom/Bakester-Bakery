import React, { useState, useMemo } from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';

// Category hero images + metadata
const CATEGORY_META = {
  Brownies: {
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&h=420&fit=crop&auto=format&q=80',
    emoji: '🍫',
    tagline: 'Dense, fudgy & irresistible',
    color: 'from-amber-900/80',
  },
  Cakes: {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=420&fit=crop&auto=format&q=80',
    emoji: '🎂',
    tagline: 'Every slice a masterpiece',
    color: 'from-rose-900/80',
  },
  Tarts: {
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=420&fit=crop&auto=format&q=80',
    emoji: '🥧',
    tagline: 'Buttery, golden, divine',
    color: 'from-yellow-900/70',
  },
  Celebration: {
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&h=420&fit=crop&auto=format&q=80',
    emoji: '🎉',
    tagline: 'For your most special moments',
    color: 'from-purple-900/80',
  },
  Speciality: {
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&h=420&fit=crop&auto=format&q=80',
    emoji: '✨',
    tagline: 'Artisan creations, uniquely ours',
    color: 'from-chocolate/80',
  },
};

// Mini product card for category preview
function MiniProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, image: product.image_url || product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-2.5 border border-cream-100 hover:border-rose-bakery/30 transition-all group"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-cream-100">
        {product.image_url || product.image ? (
          <img
            src={product.image_url || product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🎂</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-chocolate truncate leading-tight">{product.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <HiStar size={9} className="text-gold" />
              <span className="text-[9px] text-chocolate/50">{product.rating}</span>
            </span>
          )}
          <span className="text-[10px] font-bold text-rose-bakery ml-auto">₹{product.price?.toFixed(0)}</span>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={product.in_stock === false}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition-all ${
          added ? 'bg-emerald-500' : product.in_stock === false ? 'bg-gray-200' : 'bg-rose-bakery hover:bg-rose-dark'
        }`}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? '✓' : <FiShoppingCart size={11} />}
      </button>
    </motion.div>
  );
}

export default function Specialities() {
  const { products, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState(null);

  // Derive unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  // Init activeCategory once categories load
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Top-3 products per category
  const productsByCategory = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat] = [...products.filter((p) => p.category === cat)]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);
    });
    return map;
  }, [products, categories]);

  const activeMeta = CATEGORY_META[activeCategory] || CATEGORY_META.Cakes;
  const activeImage = activeMeta.image;
  const activeProducts = productsByCategory[activeCategory] || [];

  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] text-rose-bakery/70 font-semibold uppercase tracking-widest mb-2">
              The Bakery Store
            </p>
            <h2 className="section-title">Meticulous Specialities</h2>
            <p className="text-chocolate/60 text-sm mt-2 max-w-md leading-relaxed">
              Browse by category — from fluffy cakes to fudgy brownies.
              Click any product to add directly to your cart.
            </p>
          </div>
          <Link to="/products" className="btn-outline self-start sm:self-auto inline-flex items-center gap-2 flex-shrink-0">
            View All <FiArrowRight size={14} />
          </Link>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-cream-100 rounded-3xl animate-pulse" />
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />)}
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-chocolate/50">
            Fresh collection coming soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Left: category image card */}
            <AnimatedSection direction="left">
              <div className="relative rounded-3xl overflow-hidden shadow-card-hover h-[420px]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeCategory}
                    src={activeImage}
                    alt={activeCategory}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </AnimatePresence>
                {/* Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t ${activeMeta.color} to-transparent`} />

                {/* Category name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`label-${activeCategory}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                        {activeMeta.tagline}
                      </p>
                      <h3 className="font-serif text-3xl font-bold text-white">
                        {activeMeta.emoji} {activeCategory}
                      </h3>
                      <Link
                        to={`/products?category=${encodeURIComponent(activeCategory)}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white border border-white/30 hover:border-white px-4 py-1.5 rounded-full transition-all"
                      >
                        Browse all {activeCategory} <FiArrowRight size={13} />
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Category tab pills at top */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all backdrop-blur-sm ${
                        activeCategory === cat
                          ? 'bg-white text-chocolate shadow-md'
                          : 'bg-white/30 text-white hover:bg-white/50'
                      }`}
                    >
                      {CATEGORY_META[cat]?.emoji || '🎂'} {cat}
                    </button>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Right: product previews */}
            <AnimatedSection direction="right" className="space-y-5">
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`products-${activeCategory}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs text-rose-bakery font-bold uppercase tracking-widest mb-4">
                      Top Picks · {activeCategory}
                    </p>

                    {activeProducts.length === 0 ? (
                      <div className="text-center py-10 bg-cream-50 rounded-2xl border border-cream-200">
                        <p className="text-chocolate/50 text-sm">Coming soon…</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeProducts.map((product, i) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                          >
                            <MiniProductCard product={product} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <Link
                      to={`/products?category=${encodeURIComponent(activeCategory)}`}
                      className="mt-5 flex items-center gap-2 text-rose-bakery text-sm font-semibold hover:text-rose-dark transition-colors group"
                    >
                      See all {activeCategory}
                      <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4 bg-cream-50 rounded-2xl p-5 border border-cream-200">
                {[
                  { label: 'Recipes', value: '50+', emoji: '📖' },
                  { label: 'Families Served', value: '2K+', emoji: '❤️' },
                  { label: 'Baked Fresh', value: 'Daily', emoji: '🌿' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <p className="font-serif text-lg font-bold text-chocolate">{s.value}</p>
                    <p className="text-[10px] text-chocolate/50 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        )}
      </div>
    </section>
  );
}
