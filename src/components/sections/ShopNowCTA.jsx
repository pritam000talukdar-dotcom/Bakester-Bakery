import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShoppingBag, FiShoppingCart } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import AnimatedSection from '../ui/AnimatedSection';

// Compact flash-sale style product card
function FlashCard({ product, delay = 0 }) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);

  const img = product.image_url || product.image;

  const handleAdd = (e) => {
    e.preventDefault();
    addItem({ ...product, image: img });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-cream-100">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎂</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-chocolate/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {product.badge && (
          <span className="absolute top-2 left-2 bg-rose-bakery text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
            {product.badge}
          </span>
        )}
        {/* Rating bubble */}
        {product.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
            <HiStar size={10} className="text-gold" />
            <span className="text-[9px] font-bold text-chocolate">{product.rating}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-rose-bakery/70 font-semibold uppercase tracking-wider mb-0.5">
          {product.category}
        </p>
        <h4 className="font-serif text-sm font-bold text-chocolate mb-1 line-clamp-2 leading-tight flex-1">
          {product.name}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <span className="font-serif text-lg font-bold text-chocolate">
            <span className="text-sm">₹</span>{product.price?.toFixed(0)}
          </span>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleAdd}
            disabled={product.in_stock === false}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all ${
              added ? 'bg-emerald-500 text-white' :
              product.in_stock === false ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
              'bg-rose-bakery text-white hover:bg-rose-dark shadow-rose'
            }`}
          >
            {!added && <FiShoppingCart size={11} />}
            {added ? '✓ Added!' : 'Buy Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ShopNowCTA() {
  const { products } = useProducts();

  // Show a diverse cross-category selection, top rated
  const featured = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    const picks = [];

    // 1 top product per category, max 6 total
    cats.forEach((cat) => {
      const top = [...products.filter((p) => p.category === cat)]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      if (top) picks.push(top);
    });

    // Fill remaining with top-rated overall
    if (picks.length < 6) {
      const ids = new Set(picks.map((p) => p.id));
      const rest = [...products]
        .filter((p) => !ids.has(p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      picks.push(...rest.slice(0, 6 - picks.length));
    }

    return picks.slice(0, 6);
  }, [products]);

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-rose-pale/30 via-cream-100 to-cream-50">

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-rose-pale/40 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-gold/10 blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Big hero CTA header */}
        <AnimatedSection className="text-center mb-14">
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-5 inline-block"
          >
            🛍️
          </motion.div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-chocolate leading-tight mb-4">
            Ready to Order?<br />
            <span className="bg-gradient-to-r from-rose-bakery to-rose-dark bg-clip-text text-transparent">
              Shop Fresh Today
            </span>
          </h2>
          <p className="text-chocolate/60 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Every item is baked fresh daily at Bakester — no preservatives, no shortcuts,
            just pure home-baked goodness delivered to your door.
          </p>

          {/* Main CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 bg-rose-bakery hover:bg-rose-dark text-white font-bold px-8 py-4 rounded-full text-base shadow-rose transition-all group"
              >
                <FiShoppingBag size={18} />
                Shop All Products
                <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/speciality-cakes">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 border-2 border-rose-bakery text-rose-bakery hover:bg-rose-bakery hover:text-white font-bold px-8 py-4 rounded-full text-base transition-all group"
              >
                ✨ Order Custom Cake
              </motion.button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-chocolate/50">
            {[
              '🏠 Home Baked',
              '🌿 Fresh Daily',
              '🚚 Fast Delivery',
              '❤️ Made with Love',
            ].map((item) => (
              <span key={item} className="text-xs sm:text-sm font-medium">{item}</span>
            ))}
          </div>
        </AnimatedSection>

        {/* Featured product grid */}
        {featured.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-rose-bakery font-bold uppercase tracking-widest">
                🎂 Quick Add — Popular Right Now
              </p>
              <Link
                to="/products"
                className="text-xs text-chocolate/50 hover:text-rose-bakery transition-colors font-medium flex items-center gap-1 group"
              >
                View all <FiArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {featured.map((product, i) => (
                <FlashCard key={product.id} product={product} delay={i * 0.07} />
              ))}
            </div>
          </div>
        )}

        {/* Final call-to-action strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-rose-bakery to-rose-dark rounded-3xl p-7 sm:p-10 text-center text-white overflow-hidden relative"
        >
          {/* bg decoration */}
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
          <div className="relative">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
              🎂 Can't decide? Let us help!
            </h3>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              Chat with our baker to find the perfect treat for your occasion — or let us
              curate a custom gift box just for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/products" className="bg-white text-rose-bakery font-bold px-6 py-3 rounded-full text-sm hover:bg-cream-50 transition-all shadow-md flex items-center gap-2">
                <FiShoppingBag size={15} /> Browse All Bakes
              </Link>
              <Link to="/speciality-cakes#custom-order" className="border border-white/50 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                Request Custom Cake ✨
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
