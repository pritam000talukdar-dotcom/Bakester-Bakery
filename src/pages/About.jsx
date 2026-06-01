import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiBook, FiHeart, FiShield, FiDollarSign, FiArrowRight } from 'react-icons/fi';

const values = [
  {
    icon: FiBook,
    title: 'Authentic Recipes',
    desc: 'Timeless recipes passed down through generations, preserved with respect.',
  },
  {
    icon: FiHeart,
    title: 'Baked with Love',
    desc: 'We believe that the emotion baked into our creations makes all the difference.',
  },
  {
    icon: FiShield,
    title: 'Quality First',
    desc: 'Only the finest organic flours, churned butter, and seasonal fruits make the cut.',
  },
  {
    icon: FiDollarSign,
    title: 'Honestly Priced',
    desc: 'Premium craftsmanship made accessible for every celebration, large or small.',
  },
];

const timeline = [
  {
    year: '12',
    title: 'The First Whisk',
    desc: "Bakester Bakery opens its tiny doors in a quiet corner of the city.",
  },
  {
    year: '16',
    title: 'Growing the Dream',
    desc: "Expanded to our second flagship location and introduced our signature cake line.",
  },
  {
    year: '20',
    title: 'Resilience in Bloom',
    desc: 'Launched our online platform, bringing handcrafted goods directly to your doorstep.',
  },
  {
    year: '24',
    title: 'Artfully Crafted Future',
    desc: "Celebrating 12 years of sweetness with a commitment to sustainable, ethical baking.",
  },
];

export default function About() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="py-24 lg:py-32 text-center bg-gradient-to-br from-cream-100 to-rose-pale/20">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection>
            <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest mb-4">Our Story</p>
            <h1 className="font-serif text-5xl lg:text-7xl font-bold text-chocolate mb-6">
              Handcrafted Heritage
            </h1>
            <p className="text-chocolate/60 text-lg">
              Cultivating sweetness and connection since 2012.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <AnimatedSection direction="left" className="space-y-6">
              <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest">Our Story</p>
              <h2 className="font-serif text-4xl font-bold text-chocolate leading-tight">
                A Journey of Flour, Sugar & Soul
              </h2>
              <p className="text-chocolate/60 leading-relaxed">
                Bakester Bakery was born from a simple kitchen table and a profound love for the art of traditional French patisserie. What started as a quest to bake the perfect croissant for friends soon blossomed into a neighbourhood sanctuary for dessert enthusiasts.
              </p>
              <p className="text-chocolate/60 leading-relaxed">
                Our founder believed that every cake tells a story and every pastry holds a memory. By merging time-honored methods with contemporary flavors, we've spent over a decade perfecting the delicate balance of texture and taste that defines the Bakester signature.
              </p>
              <p className="text-chocolate/60 leading-relaxed">
                Today we continue to honor those humble beginnings, ensuring that every batch is filled with the same true-to-soul care that defined our first day in the kitchen.
              </p>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="relative">
                <div className="absolute inset-4 bg-rose-pale/40 rounded-3xl rotate-2" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=700&h=500&fit=crop"
                    alt="Bakester Bakery storefront"
                    className="w-full h-[480px] object-cover"
                  />
                </div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-card-hover px-5 py-4"
                >
                  <p className="text-xs font-bold text-chocolate">Feed of the Gods</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-gold text-sm">★</span>)}
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="section-title mb-3">Our Values</h2>
            <p className="section-subtitle">The ingredients of our integrity are simple, pure, and never compromised.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
            {values.map((v, i) => (
              <AnimatedSection key={v.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="w-12 h-12 bg-rose-pale rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <v.icon size={22} className="text-rose-bakery" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-chocolate mb-3">{v.title}</h3>
                  <p className="text-sm text-chocolate/60 leading-relaxed">{v.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2 className="section-title">Our Journey</h2>
          </AnimatedSection>

          <div className="space-y-0">
            {timeline.map((item, i) => (
              <AnimatedSection key={item.year} delay={i * 0.15}>
                <div className={`flex items-start gap-8 py-8 border-b border-cream-200 last:border-0 ${i % 2 === 1 ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-14 h-14 rounded-full bg-rose-bakery text-white flex items-center justify-center font-serif text-lg font-bold shadow-rose"
                    >
                      {item.year}
                    </motion.div>
                  </div>
                  <div className={i % 2 === 1 ? 'text-right' : ''}>
                    <h3 className="font-serif text-xl font-semibold text-chocolate mb-2">{item.title}</h3>
                    <p className="text-chocolate/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-rose-pale/30 to-cream-200">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-chocolate mb-4">
              Taste the Tradition
            </h2>
            <p className="text-chocolate/60 mb-8">
              Join us in celebrating the simple pleasure of a perfectly baked pastry.
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2 group">
              Visit Our Patisserie
              <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
