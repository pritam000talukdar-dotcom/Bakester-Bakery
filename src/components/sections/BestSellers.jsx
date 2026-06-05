import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AnimatedSection from '../ui/AnimatedSection';
import ProductCard from '../ui/ProductCard';
import { useProducts } from '../../context/ProductsContext';

export default function BestSellers() {
  const scrollRef = useRef(null);
  const { products, loading } = useProducts();

  // Show top-rated in-stock products (up to 6)
  const featured = [...products]
    .filter((p) => p.in_stock !== false)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

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
              Popular Choice
            </p>
            <h2 className="section-title">The Best Seller Collection</h2>
          </div>
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
        </AnimatedSection>

        {/* Loading skeleton */}
        {loading ? (
          <div className="flex gap-6 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[280px] sm:min-w-[300px] h-72 bg-cream-100 rounded-2xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <p className="text-4xl mb-3">🎂</p>
            <p className="text-chocolate/60">
              Our fresh collection is coming soon!
            </p>
            <Link to="/products" className="btn-primary mt-4 inline-block">
              Browse All
            </Link>
          </div>
        ) : (
          /* Scrollable product row */
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featured.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1 }}
                className="min-w-[280px] sm:min-w-[300px] snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
