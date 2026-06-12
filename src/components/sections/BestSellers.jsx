import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import { HiStar, HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import AnimatedSection from '../ui/AnimatedSection';
import ProductCard from '../ui/ProductCard';
import { useProducts } from '../../context/ProductsContext';

export default function BestSellers() {
  const scrollRef = useRef(null);
  const { products, loading } = useProducts();

  // Top 6 by rating (min rating > 0), exclude out-of-stock last
  const featured = useMemo(() => {
    return [...products]
      .filter((p) => (p.rating || 0) > 0)
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        // If ratings equal, prefer in-stock
        return (a.in_stock === false ? 1 : 0) - (b.in_stock === false ? 1 : 0);
      })
      .slice(0, 6);
  }, [products]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] text-rose-bakery/70 font-semibold uppercase tracking-widest mb-2">
              ⭐ Customer Favourites
            </p>
            <h2 className="section-title">Top Rated Bakes</h2>
            <p className="text-chocolate/60 text-sm mt-2 max-w-md">
              Hand-picked from our highest rated treats — loved by families, perfect for gifting.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll(-1)}
                className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center text-chocolate hover:bg-rose-bakery hover:text-white transition-all"
                aria-label="Scroll left"
              >
                <FiChevronLeft size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll(1)}
                className="w-10 h-10 rounded-full bg-rose-bakery shadow-rose flex items-center justify-center text-white hover:bg-rose-dark transition-all"
                aria-label="Scroll right"
              >
                <FiChevronRight size={18} />
              </motion.button>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-rose-bakery hover:text-rose-dark transition-colors group"
            >
              All Products <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </AnimatedSection>

        {/* Loading skeleton */}
        {loading ? (
          <div className="flex gap-6 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px] sm:min-w-[300px] h-80 bg-cream-100 rounded-2xl animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-cream-200">
            <p className="text-4xl mb-3">🎂</p>
            <p className="text-chocolate/60 mb-4">Our fresh collection is coming soon!</p>
            <Link to="/products" className="btn-primary inline-block">Browse All</Link>
          </div>
        ) : (
          /* Scrollable product row */
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featured.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: Math.min(i * 0.06, 0.18), duration: 0.28 }}
                className="min-w-[280px] sm:min-w-[300px] snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="sm:hidden text-center mt-6">
          <Link to="/products" className="btn-outline inline-flex items-center gap-2">
            View All Products <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
