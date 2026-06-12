import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { useProducts } from '../../context/ProductsContext';
import AnimatedSection from '../ui/AnimatedSection';
import ProductCard from '../ui/ProductCard';

export default function ChocolateAd() {
  const { products, loading } = useProducts();

  // Top-rated Brownies from DB
  const brownieProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.category === 'Brownies')
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }, [products]);

  // Top chocolate cakes (for the main ad hero — any product with "chocolate" in name/desc)
  const heroChocolate = useMemo(() => {
    return [...products]
      .filter((p) =>
        p.name?.toLowerCase().includes('chocolate') ||
        p.description?.toLowerCase().includes('chocolate') ||
        p.category === 'Brownies'
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [products]);

  const heroImage = heroChocolate?.image_url ||
    'https://images.unsplash.com/photo-1606890737304-57a1ca8a5994?w=600&h=420&fit=crop&auto=format&q=85';

  return (
    <section
      className="py-16 sm:py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2D1B0E 0%, #4A2C16 40%, #3D2010 70%, #1A0F06 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Ad Banner ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-14">
          <AnimatedSection direction="left">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-amber-400/60" />
              Featured Ingredient
              <span className="w-6 h-px bg-amber-400/60" />
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              The World of<br />
              <span className="text-amber-400">Chocolate 🍫</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-6 max-w-md">
              From rich dark chocolate ganache cakes to fudgy Belgian brownies —
              our chocolate creations are in a class of their own. Also available:
              <span className="text-amber-300 font-semibold"> customized chocolate gifting boxes</span> crafted
              with love for every occasion.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {['Dark Chocolate', 'Belgian Brownie', 'Choco Tart', 'Gift Boxes'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-white/10 text-white/80 border border-white/20 px-3 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              to="/products?category=Brownies"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-chocolate font-bold px-6 py-3 rounded-full text-sm transition-all group shadow-lg hover:shadow-amber-500/30"
            >
              Shop Chocolate Treats
              <FiArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>

          {/* Hero chocolate image — real product from DB */}
          <AnimatedSection direction="right">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/10 blur-2xl" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              >
                <img
                  src={heroImage}
                  alt={heroChocolate?.name || 'Belgian chocolate cake'}
                  className="w-full h-72 sm:h-80 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-chocolate/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs text-amber-300 font-bold uppercase tracking-widest">
                    {heroChocolate ? heroChocolate.category : 'Premium Selection'}
                  </span>
                  <p className="font-serif text-xl font-bold text-white mt-0.5">
                    {heroChocolate?.name || 'Belgian Chocolate'}
                  </p>
                  {heroChocolate?.price && (
                    <p className="text-white/80 text-sm font-semibold mt-0.5">
                      ₹{heroChocolate.price.toFixed(0)}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Floating gift badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                animate={{ rotate: [0, 2, -2, 0] }}
                style={{ animationDuration: '5s', animationIterationCount: 'infinite' }}
                className="absolute -bottom-4 -right-4 bg-amber-400 text-chocolate rounded-2xl p-4 shadow-xl"
              >
                <div className="text-2xl mb-0.5">🎁</div>
                <p className="text-[10px] font-bold uppercase tracking-wide leading-tight">Custom</p>
                <p className="text-[10px] font-bold uppercase tracking-wide leading-tight">Gift Boxes</p>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>

        {/* ── Brownies Section ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-1">
                🍫 Top Rated · Brownies
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Our Fudgiest Brownies
              </h3>
            </div>
            <Link
              to="/products?category=Brownies"
              className="text-amber-400 text-xs font-semibold hover:text-amber-300 transition-colors flex items-center gap-1 group"
            >
              View all <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 bg-white/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : brownieProducts.length === 0 ? (
            /* No brownies yet — show promo placeholder cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  name: 'Belgian Brownie Box',
                  desc: 'Rich dense brownies made with premium Belgian cocoa.',
                  img: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop&auto=format&q=80',
                  price: 149,
                },
                {
                  name: 'Classic Fudge Brownie',
                  desc: 'Gooey centre, crackly top — the perfect brownie.',
                  img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop&auto=format&q=80',
                  price: 99,
                },
                {
                  name: 'Choco Walnut Brownie',
                  desc: 'Dark chocolate loaded with crunchy walnuts.',
                  img: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=400&h=300&fit=crop&auto=format&q=80',
                  price: 129,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="h-48 overflow-hidden">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-rose-bakery font-bold uppercase tracking-wider mb-1">Brownies</p>
                    <h4 className="font-serif text-base font-bold text-chocolate mb-1">{item.name}</h4>
                    <p className="text-xs text-chocolate/55 mb-3 line-clamp-2">{item.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg font-bold text-chocolate">
                        <span className="text-sm">₹</span>{item.price}
                      </span>
                      <Link
                        to="/products?category=Brownies"
                        className="text-xs font-semibold bg-rose-bakery text-white px-4 py-2 rounded-full hover:bg-rose-dark transition-all"
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Real brownie ProductCards from DB */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {brownieProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-white/40 text-xs font-medium mb-3">
            Can't find what you're looking for?
          </p>
          <Link
            to="/speciality-cakes#custom-order"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            Request a custom chocolate creation
            <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
