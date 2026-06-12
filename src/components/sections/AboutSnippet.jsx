import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from '../ui/AnimatedSection';
import { FiArrowRight } from 'react-icons/fi';
import { useProducts } from '../../context/ProductsContext';

const values = [
  { emoji: '🌾', label: '100% Fresh' },
  { emoji: '❤️', label: 'Baked with Love' },
  { emoji: '🏡', label: 'Home Baked' },
];

// Fallback bakery images (all genuine cake/bakery shots)
const BAKERY_FALLBACKS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=500&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&h=500&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=700&h=500&fit=crop&auto=format&q=85',
];

export default function AboutSnippet() {
  const { products } = useProducts();

  // Pick the highest-rated product image from DB, fallback to curated cake photos
  const heroImage = React.useMemo(() => {
    const withImage = [...products]
      .filter((p) => p.image_url)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return withImage[0]?.image_url || BAKERY_FALLBACKS[0];
  }, [products]);

  // Pick a secondary product image (different from hero)
  const secondaryImage = React.useMemo(() => {
    const withImage = [...products]
      .filter((p) => p.image_url)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return withImage[1]?.image_url || BAKERY_FALLBACKS[1];
  }, [products]);

  const topProduct = React.useMemo(() => {
    return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [products]);

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-rose-pale/20 to-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Image side — uses real DB product images */}
          <AnimatedSection direction="left">
            <div className="relative">
              {/* Rotated background card */}
              <div className="absolute inset-4 bg-rose-pale/40 rounded-3xl -rotate-2" />

              {/* Main image — top-rated product from DB */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="Bakester Bakery signature creation"
                  className="w-full h-[420px] object-cover"
                  loading="lazy"
                />
                {/* Soft gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-chocolate/20 to-transparent pointer-events-none" />
              </div>

              {/* Small inset image — second product */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -left-5 w-28 h-28 rounded-2xl overflow-hidden shadow-card-hover border-2 border-white hidden sm:block"
              >
                <img
                  src={secondaryImage}
                  alt="Another Bakester creation"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>

              {/* Floating rating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-card-hover p-4"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🎂</div>
                  <p className="text-[11px] font-bold text-chocolate leading-tight">
                    {topProduct?.name ? topProduct.name.slice(0, 14) + (topProduct.name.length > 14 ? '…' : '') : 'Feed of the Gods'}
                  </p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="text-gold text-xs">★</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* Text side */}
          <AnimatedSection direction="right" className="space-y-6">
            <div>
              <p className="text-[11px] text-rose-bakery/70 font-semibold uppercase tracking-widest mb-2">
                The Bakester Story
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-chocolate leading-tight">
                Baked with Heart,<br />Served with Sincerity
              </h2>
            </div>

            <p className="text-chocolate/60 leading-relaxed">
              At Bakester Bakery, we believe that every cake tells a story and every pastry holds a moment.
              By merging time-honored methods with contemporary flavors, we've spent over a decade perfecting
              the delicate balance of texture and taste that defines the Bakester signature.
            </p>

            {/* Values */}
            <div className="flex flex-wrap gap-3">
              {values.map((v) => (
                <div
                  key={v.label}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-cream-200"
                >
                  <span className="text-base">{v.emoji}</span>
                  <span className="text-sm font-medium text-chocolate">{v.label}</span>
                </div>
              ))}
            </div>

            <p className="text-chocolate/60 leading-relaxed">
              Today we continue to honor those humble beginnings, ensuring that every batch is filled with
              the same true-to-soul care that defined our first day in the kitchen.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 btn-primary group">
                Shop Our Bakes
                <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 btn-outline">
                Our Story
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
