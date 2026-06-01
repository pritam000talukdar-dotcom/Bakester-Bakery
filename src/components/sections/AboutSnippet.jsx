import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from '../ui/AnimatedSection';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const values = [
  { emoji: '🌾', label: '100% Organic' },
  { emoji: '❤️', label: 'Baked with Love' },
  { emoji: '🏆', label: 'Award Winning' },
];

export default function AboutSnippet() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-rose-pale/20 to-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image side */}
          <AnimatedSection direction="left">
            <div className="relative">
              {/* Background card */}
              <div className="absolute inset-4 bg-rose-pale/40 rounded-3xl -rotate-2" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=700&h=500&fit=crop"
                  alt="Bakester Bakery store front"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-card-hover p-5"
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">🎂</div>
                  <p className="text-xs font-bold text-chocolate">Feed of the Gods</p>
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
                Baked with Heart, Served with Sincerity
              </h2>
            </div>

            <p className="text-chocolate/60 leading-relaxed">
              At Bakester Bakery, we believe that every cake tells a story and every pastry holds a moment. 
              By merging time-honored methods with contemporary flavors, we've spent over a decade perfecting 
              the delicate balance of texture and taste that defines the Bakester signature.
            </p>

            {/* Values */}
            <div className="flex flex-wrap gap-4">
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

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 btn-primary group"
              >
                Read Our Gallery
                <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
