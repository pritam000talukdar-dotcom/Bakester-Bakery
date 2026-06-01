import React from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import { specialities } from '../../data/products';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Specialities() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-left mb-12">
          <p className="text-[11px] text-rose-bakery/70 font-semibold uppercase tracking-widest mb-2">
            The Bakery Store
          </p>
          <h2 className="section-title">Meticulously Crafted Specialities</h2>
          <p className="text-chocolate/60 text-sm mt-3 max-w-md leading-relaxed">
            Our freshest goods are baked fresh every morning, by mixing time-honoured techniques with modern flair.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {specialities.map((item, i) => (
            <AnimatedSection key={item.id} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden h-64 bg-cream-100 mb-4">
                  <motion.img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-chocolate/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-chocolate mb-2">{item.name}</h3>
                <p className="text-chocolate/60 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4} className="mt-12 text-center">
          <Link to="/products" className="btn-outline inline-flex items-center gap-2">
            View All Specialities
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
