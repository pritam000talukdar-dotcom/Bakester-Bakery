import React from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';

// Fallback category thumbnails when no product image is available
const CATEGORY_FALLBACKS = {
  Brownies: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=350&h=280&fit=crop',
  Cakes:    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=350&h=280&fit=crop',
  Tarts:    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=350&h=280&fit=crop',
  Celebration: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=350&h=280&fit=crop',
  Speciality:  'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=350&h=280&fit=crop',
};

const CATEGORY_DESCRIPTIONS = {
  Brownies:    'Dense, fudgy brownies with a crackly top and gooey center.',
  Cakes:       'Each cake is perfected to become a masterpiece of your emotions.',
  Tarts:       'Miniature pastries with a delicate balance of texture and the Bakester signature.',
  Celebration: 'Grand custom creations for every special milestone.',
  Speciality:  'Unique artisan creations you won\'t find anywhere else.',
};

export default function Specialities() {
  const { products, loading } = useProducts();

  // Derive unique categories that have at least one product
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // For each category, pick the first product's image as the hero thumbnail
  const categoryItems = categories.map((cat) => {
    const first = products.find((p) => p.category === cat && p.image_url);
    return {
      id: cat,
      name: cat,
      image: first?.image_url || CATEGORY_FALLBACKS[cat] || CATEGORY_FALLBACKS.Cakes,
      description: CATEGORY_DESCRIPTIONS[cat] || `Fresh ${cat.toLowerCase()} baked daily.`,
    };
  });

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-left mb-12">
          <p className="text-[11px] text-rose-bakery/70 font-semibold uppercase tracking-widest mb-2">
            The Bakery Store
          </p>
          <h2 className="section-title">Meticulously Crafted Specialities</h2>
          <p className="text-chocolate/60 text-sm mt-3 max-w-md leading-relaxed">
            Our freshest goods are baked fresh every morning, by mixing time-honoured
            techniques with modern flair.
          </p>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-cream-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : categoryItems.length === 0 ? (
          <div className="text-center py-12 text-chocolate/50">
            Check back soon for our fresh collection!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {categoryItems.map((item, i) => (
              <AnimatedSection key={item.id} delay={i * 0.12}>
                <Link to={`/products?category=${encodeURIComponent(item.name)}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-2xl overflow-hidden h-64 bg-cream-100 mb-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-chocolate/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-chocolate mb-2">
                      {item.name}
                    </h3>
                    <p className="text-chocolate/60 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        )}

        <AnimatedSection delay={0.4} className="mt-12 text-center">
          <Link to="/products" className="btn-outline inline-flex items-center gap-2">
            View All Specialities
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
