import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiChevronDown } from 'react-icons/fi';

const specialityProducts = [
  {
    id: 1,
    name: 'Red Velvet Dream',
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&h=300&fit=crop',
    price: 48,
    description: 'A stunning red velvet cake with velvety cream cheese frosting.',
  },
  {
    id: 2,
    name: 'Classic Pineapple Cream',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
    price: 35,
    description: 'Light vanilla sponge layered with house-made pineapple compote.',
  },
  {
    id: 3,
    name: 'Belgian Chocolate',
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5994?w=400&h=300&fit=crop',
    price: 42,
    description: 'Deep Belgian chocolate layered cake with ganache frosting.',
  },
  {
    id: 4,
    name: 'Hazelnut Divine',
    image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
    price: 45,
    description: 'Rich hazelnut cake with praline cream and chocolate shards.',
  },
];

const themes = ['Wedding', 'Birthday', 'Anniversary', 'Baby Shower', 'Corporate', 'Other'];
const sizes = ['6 inch (6-8 servings)', '8 inch (10-12 servings)', '10 inch (16-20 servings)', 'Tiered (Custom)'];

export default function SpecialityCakes() {
  const [formData, setFormData] = useState({
    fullName: '', lastName: '', email: '', phone: '', theme: '', size: '', date: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1200&h=500&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-chocolate/60 backdrop-blur-sm" />
        <div className="relative max-w-3xl mx-auto px-4 text-white">
          <AnimatedSection>
            <p className="text-xs text-rose-light font-semibold uppercase tracking-widest mb-3">
              Artisan Bakery — Speciality Cakes
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              The Mango Specials
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-xl leading-relaxed">
              A symphony of tropical flavors in every slice. Our signature mango cakes are handcrafted using the finest Alfonso mangoes sourced from local farms.
            </p>
            <button className="btn-primary">
              Explore Specials
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Signature Collection */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="section-title">The Signature Collection</h2>
          </AnimatedSection>

          <div className="space-y-8">
            {/* Feature two */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specialityProducts.slice(0, 2).map((p, i) => (
                <AnimatedSection key={p.id} delay={i * 0.15}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-chocolate/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-xs opacity-70 mb-1">Artisan Special</p>
                        <h3 className="font-serif text-xl font-bold">{p.name}</h3>
                        <p className="text-sm opacity-80 mt-1 max-w-xs">{p.description}</p>
                      </div>
                      <div className="absolute bottom-4 right-4 flex items-center gap-3">
                        <span className="text-white font-bold font-serif text-lg">${p.price}</span>
                        <button className="text-xs bg-white text-chocolate px-4 py-2 rounded-full font-semibold hover:bg-rose-bakery hover:text-white transition-all">
                          Order Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
            {/* Classic 4 grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {specialityProducts.map((p, i) => (
                <AnimatedSection key={p.id + 10} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="group bg-cream-50 rounded-xl overflow-hidden shadow-sm hover:shadow-card transition-all"
                  >
                    <div className="h-36 overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-serif text-sm font-bold text-chocolate">{p.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-chocolate">${p.price}</span>
                        <button className="text-[10px] bg-rose-bakery text-white px-2 py-1 rounded-full font-semibold">
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Weddings & Special Events Form */}
      <section className="py-20 bg-cream-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="section-title mb-3">Weddings & Special Events</h2>
            <p className="section-subtitle">
              Dreaming of a bespoke centrepiece for your big day? From Thai wedding cakes to elaborate celebration creations, we'll make your vision into reality.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <motion.form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-card p-8 lg:p-10 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-chocolate mb-2">Full Name</label>
                  <input
                    id="fullName" name="fullName" type="text" required
                    value={formData.fullName} onChange={handleChange}
                    placeholder="First Name" className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-chocolate mb-2">&nbsp;</label>
                  <input
                    id="lastName" name="lastName" type="text"
                    value={formData.lastName} onChange={handleChange}
                    placeholder="Last Name" className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-chocolate mb-2">Occasion Theme</label>
                <div className="relative">
                  <select
                    id="theme" name="theme"
                    value={formData.theme} onChange={handleChange}
                    className="input-field appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">Select theme...</option>
                    {themes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-chocolate mb-2">
                  Special Details (Flavour, Design, Themes, Size requirements)
                </label>
                <textarea
                  id="message" name="message" rows={4}
                  value={formData.message} onChange={handleChange}
                  placeholder="Tell us about your dream cake..."
                  className="input-field resize-none"
                />
              </div>

              <div className="text-center pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="btn-primary px-10 py-4"
                >
                  {submitted ? '✓ Request Submitted!' : 'Request a Consultation'}
                </motion.button>
              </div>
            </motion.form>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
