import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AnimatedSection from '../ui/AnimatedSection';
import ProductCard from '../ui/ProductCard';
import { bestSellers } from '../../data/products';

export default function BestSellers() {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
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

        {/* Scrollable product row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bestSellers.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.12 }}
              className="min-w-[280px] sm:min-w-[300px] snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
