import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiSearch, FiChevronDown } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import { useProducts } from '../../context/ProductsContext';

// ── Filter constants (derived dynamically from products) ───────────────
const PRICE_RANGES = [
  { label: 'Any Price',    min: 0,   max: Infinity },
  { label: 'Under ₹100',  min: 0,   max: 100 },
  { label: '₹100 – ₹150', min: 100, max: 150 },
  { label: '₹150+',        min: 150, max: Infinity },
];
const RATINGS = [
  { label: 'Any Rating', value: 0 },
  { label: '4+ Stars',   value: 4 },
  { label: '4.5+ Stars', value: 4.5 },
  { label: '4.7+ Stars', value: 4.7 },
];

// ── Slides ───────────────────────────────────────────────────
// Slide content (images injected dynamically from DB in component)
const SLIDE_CONTENT = [
  {
    id: 1,
    eyebrow: 'Homemade with Love, Every Single Day',
    title: "Bakester — A Mom's Bakery",
    subtitle: "Every cake, brownie and tart is lovingly baked at home from scratch \u2014 using grandma's recipes, the freshest local ingredients, and a generous handful of heart.",
    cta: 'Explore Our Bakes',
    ctaLink: '/products',
    bg: 'from-cream-100 via-rose-pale/30 to-cream-200',
    preferCategory: 'Cakes',
  },
  {
    id: 2,
    eyebrow: 'Small Batch · Big Heart',
    title: 'Beautiful Creations, Made at Home',
    subtitle: "From delicate celebration cakes to fudgy brownies and buttery tarts \u2014 every creation at Bakester is handcrafted in small batches to ensure it's perfect just for you.",
    cta: 'View Specialities',
    ctaLink: '/speciality-cakes',
    bg: 'from-rose-pale/40 via-cream-100 to-cream-200',
    preferCategory: 'Speciality',
  },
  {
    id: 3,
    eyebrow: 'Celebration Masterpieces',
    title: 'Make Your Special Moment Unforgettable',
    subtitle: "Birthdays, anniversaries, weddings \u2014 let us bake the centrepiece of your most precious memories. Custom designs, personal flavours, crafted with a mother's care.",
    cta: 'Order Custom Cake',
    ctaLink: '/speciality-cakes',
    bg: 'from-cream-200 via-rose-pale/20 to-cream-100',
    preferCategory: 'Celebration',
  },
];

// Real fallback cake images (only used if DB has zero products)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop&auto=format&q=85',
  'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800&h=600&fit=crop&auto=format&q=85',
];

// ── Popular search tags ──────────────────────────────────────
const POPULAR_TAGS = ['Birthday Cake', 'Brownies', 'Red Velvet', 'Wedding Cake', 'Chocolate'];

export default function Hero() {
  const [current, setCurrent]   = useState(0);
  const [direction, setDirection] = useState(1);
  const { products } = useProducts();

  // Build hero slides using REAL images from DB per preferred category
  const heroSlides = useMemo(() => {
    return SLIDE_CONTENT.map((slide, i) => {
      // Try to find top-rated product image in preferred category
      const inCategory = [...products]
        .filter((p) => p.category === slide.preferCategory && p.image_url)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      // If no match in preferred category, pick any top-rated product image not used yet
      const anyWithImage = [...products]
        .filter((p) => p.image_url)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const img =
        inCategory[0]?.image_url ||
        anyWithImage[i]?.image_url ||
        anyWithImage[0]?.image_url ||
        FALLBACK_IMAGES[i];

      // Also attach the matching product name for the floating badge
      const featuredProduct = inCategory[0] || anyWithImage[i] || anyWithImage[0] || null;

      return { ...slide, image: img, featuredProduct };
    });
  }, [products]);

  // Derive dynamic categories from actual products
  const dynamicCategories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [products]);

  // search + filter state
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [category, setCategory]           = useState('All');
  const [priceRange, setPriceRange]       = useState(PRICE_RANGES[0]);
  const [rating, setRating]               = useState(0);
  const searchBarRef = useRef(null);
  const navigate = useNavigate();

  const activeFilterCount = [category !== 'All', priceRange.label !== 'Any Price', rating > 0].filter(Boolean).length;

  // auto-advance slides — 7s is more network-friendly on mobile
  useEffect(() => {
    const t = setInterval(() => { setDirection(1); setCurrent((c) => (c + 1) % heroSlides.length); }, 7000);
    return () => clearInterval(t);
  }, []);

  // live search against Supabase products
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) { setSearchResults([]); return; }
    let list = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
    if (category !== 'All')               list = list.filter((p) => p.category === category);
    if (priceRange.label !== 'Any Price') list = list.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);
    if (rating > 0)                       list = list.filter((p) => (p.rating || 0) >= rating);
    setSearchResults(list.slice(0, 5));
  }, [searchQuery, category, priceRange, rating, products]);

  // click outside closes filter+results
  useEffect(() => {
    const fn = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setFilterOpen(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const clearFilters = () => { setCategory('All'); setPriceRange(PRICE_RANGES[0]); setRating(0); };

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (searchQuery.trim()) p.set('q', searchQuery.trim());
    if (category !== 'All') p.set('cat', category);
    if (priceRange.label !== 'Any Price') { p.set('pmin', priceRange.min); p.set('pmax', priceRange.max === Infinity ? '999999' : priceRange.max); }
    if (rating > 0) p.set('rating', rating);
    return p.toString();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qs = buildQuery();
    navigate(`/products${qs ? '?' + qs : ''}`);
    setFilterOpen(false);
    setSearchResults([]);
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    navigate(`/products?q=${encodeURIComponent(tag)}`);
  };

  const handleResultClick = (product) => {
    navigate(`/products?q=${encodeURIComponent(product.name)}`);
    setSearchResults([]);
    setSearchQuery('');
  };

  const go   = (idx) => { setDirection(idx > current ? 1 : -1); setCurrent(idx); };
  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length); };
  const next = () => { setDirection(1);  setCurrent((c) => (c + 1) % heroSlides.length); };

  const slide = heroSlides[current];

  return (
    <section className={`relative min-h-screen flex items-center bg-gradient-to-br ${slide.bg} transition-all duration-700`} style={{ overflow: 'visible' }}>
      {/* Decorative blobs */}
      <div className="absolute top-20 right-[5%] w-80 h-80 rounded-full bg-rose-pale/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-[5%] w-60 h-60 rounded-full bg-gold-light/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">

          {/* ── Left: text + search ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, x: direction * -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * 40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-rose-bakery text-sm font-semibold uppercase tracking-widest"
              >
                {slide.eyebrow}
              </motion.p>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-chocolate leading-[1.1] whitespace-pre-line">
                {slide.title}
              </h1>

              <p className="text-chocolate/60 text-base lg:text-lg leading-relaxed max-w-lg">
                {slide.subtitle}
              </p>

              {/* ── Hero Search Bar ── */}
              <div ref={searchBarRef} className="relative">
                <form onSubmit={handleSubmit} id="hero-search-form">
                  {/* Unified pill */}
                  <div className="flex items-center bg-white rounded-2xl shadow-[0_4px_24px_rgba(45,27,14,0.12)] border border-cream-200 focus-within:border-rose-bakery focus-within:ring-2 focus-within:ring-rose-pale transition-all overflow-visible">

                    {/* Search icon */}
                    <div className="pl-4 pr-2 flex-shrink-0 pointer-events-none">
                      <FiSearch size={18} className="text-chocolate/40" />
                    </div>

                    {/* Input */}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cakes, brownies, pastries…"
                      className="flex-1 min-w-0 py-3.5 text-sm text-chocolate placeholder-chocolate/40 bg-transparent outline-none"
                      aria-label="Search bakery products"
                      id="hero-search"
                    />

                    {/* Divider */}
                    <div className="w-px h-6 bg-cream-200 flex-shrink-0 mx-1" />

                    {/* Filter button */}
                    <div className="relative flex-shrink-0">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-semibold transition-colors ${
                          filterOpen || activeFilterCount > 0 ? 'text-rose-bakery' : 'text-chocolate/60 hover:text-rose-bakery'
                        }`}
                        aria-label="Toggle filters"
                        id="hero-filter-toggle"
                      >
                        {/* Filter lines icon */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Filters
                        {activeFilterCount > 0 && (
                          <span className="w-4 h-4 bg-rose-bakery text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                        <FiChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}
                        />
                      </motion.button>

                      {/* ── Filter Dropdown ── */}
                      <AnimatePresence>
                        {filterOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-card-hover border border-cream-200 z-50"
                          >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100">
                              <span className="text-xs font-bold text-chocolate uppercase tracking-wider">Filters</span>
                              {activeFilterCount > 0 && (
                                <button type="button" onClick={clearFilters} className="text-[11px] text-rose-bakery font-semibold hover:text-rose-dark">
                                  Clear all
                                </button>
                              )}
                            </div>

                            <div className="p-4 space-y-5">
                              {/* Category chips */}
                              <div>
                                <p className="text-[11px] font-bold text-chocolate/50 uppercase tracking-wider mb-2">Category</p>
                                <div className="flex flex-wrap gap-1.5">
                                {dynamicCategories.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setCategory(cat)}
                                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        category === cat
                                          ? 'bg-rose-bakery text-white shadow-rose'
                                          : 'bg-cream-100 text-chocolate/70 hover:bg-rose-pale hover:text-rose-bakery'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Price */}
                              <div>
                                <p className="text-[11px] font-bold text-chocolate/50 uppercase tracking-wider mb-2">Price Range</p>
                                <div className="space-y-1">
                                  {PRICE_RANGES.map((r) => (
                                    <button
                                      key={r.label}
                                      type="button"
                                      onClick={() => setPriceRange(r)}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                                        priceRange.label === r.label
                                          ? 'bg-rose-bakery text-white'
                                          : 'hover:bg-cream-100 text-chocolate/70'
                                      }`}
                                    >
                                      {r.label}
                                      {priceRange.label === r.label && <span>✓</span>}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Rating */}
                              <div>
                                <p className="text-[11px] font-bold text-chocolate/50 uppercase tracking-wider mb-2">Min. Rating</p>
                                <div className="space-y-1">
                                  {RATINGS.map((r) => (
                                    <button
                                      key={r.label}
                                      type="button"
                                      onClick={() => setRating(r.value)}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                        rating === r.value
                                          ? 'bg-rose-bakery text-white'
                                          : 'hover:bg-cream-100 text-chocolate/70'
                                      }`}
                                    >
                                      <span className="flex">
                                        {[1,2,3,4,5].map((s) => (
                                          <HiStar key={s} size={11} className={
                                            s <= Math.round(r.value) && r.value > 0
                                              ? (rating === r.value ? 'text-white' : 'text-gold')
                                              : (rating === r.value ? 'text-white/40' : 'text-cream-300')
                                          } />
                                        ))}
                                      </span>
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Apply button */}
                            <div className="px-4 pb-4">
                              <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFilterOpen(false)}
                                className="btn-primary w-full text-center text-xs py-2.5"
                              >
                                Apply Filters
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-cream-200 flex-shrink-0 mx-1" />

                    {/* Search button */}
                    <div className="pr-2 flex-shrink-0">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="btn-primary text-sm px-5 py-2.5 rounded-xl"
                        aria-label="Search"
                      >
                        Search
                      </motion.button>
                    </div>
                  </div>

                  {/* ── Live results ── */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-card-hover border border-cream-200 overflow-hidden z-40"
                      >
                        {searchResults.map((product, i) => (
                          <motion.button
                            key={product.id}
                            type="button"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleResultClick(product)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-50 transition-colors text-left border-b border-cream-100 last:border-0 group"
                          >
                            <img src={product.image_url || product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-chocolate truncate group-hover:text-rose-bakery transition-colors">{product.name}</p>
                              <p className="text-[11px] text-chocolate/50">{product.category} · ₹{product.price?.toFixed(0)}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 bg-rose-pale px-2 py-0.5 rounded-full">
                              <HiStar size={11} className="text-gold" />
                              <span className="text-[11px] font-bold text-rose-bakery">{product.rating}</span>
                            </div>
                          </motion.button>
                        ))}
                        <button
                          type="submit"
                          className="w-full px-4 py-2.5 text-xs text-rose-bakery font-semibold hover:bg-rose-pale/30 transition-colors text-center"
                        >
                          See all results{searchQuery ? ` for "${searchQuery}"` : ''} →
                        </button>
                      </motion.div>
                    )}

                    {/* No results */}
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-card border border-cream-200 px-4 py-4 text-center z-40"
                      >
                        <p className="text-sm text-chocolate/60">No results for <span className="font-semibold text-chocolate">"{searchQuery}"</span></p>
                        <button type="button" onClick={clearFilters} className="text-xs text-rose-bakery font-semibold mt-1 hover:underline">Clear filters</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                {/* Popular tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs text-chocolate/40 font-medium">Popular:</span>
                  {POPULAR_TAGS.map((tag) => (
                    <motion.button
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="text-xs bg-white/70 backdrop-blur-sm border border-cream-200 text-chocolate/60 px-3 py-1 rounded-full hover:border-rose-bakery hover:text-rose-bakery transition-all"
                    >
                      {tag}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 pt-1">
                <Link to={slide.ctaLink} className="btn-primary flex items-center gap-2 group">
                  {slide.cta}
                  <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/about" className="btn-outline">Our Story</Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4 border-t border-chocolate/10">
                {[
                  { label: 'Homemade Recipes', value: '50+' },
                  { label: 'Happy Families',   value: '2K+' },
                  { label: 'Love Baked In',    value: '100%' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-serif text-2xl font-bold text-chocolate">{stat.value}</p>
                    <p className="text-xs text-chocolate/50 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Right: image ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`img-${current}`}
              initial={{ opacity: 0, scale: 0.95, x: direction * 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: direction * -40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 -rotate-3 rounded-3xl bg-rose-pale/50" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={slide.image}
                  alt="Bakester signature creation"
                  fetchpriority={current === 0 ? 'high' : 'auto'}
                  loading={current === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                {/* Floating badge — shows real product from DB */}
                <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-card-hover p-4 flex items-center gap-3 max-w-[180px]">
                  <div className="w-10 h-10 bg-rose-pale rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {slide.featuredProduct?.image_url ? (
                      <img src={slide.featuredProduct.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-xl">🎂</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-chocolate truncate">
                      {slide.featuredProduct?.name || 'Bakester Special'}
                    </p>
                    <p className="text-[10px] text-chocolate/50">
                      {slide.featuredProduct?.category || 'Artisan Baked Daily'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Slide controls ── */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
        <button onClick={prev} aria-label="Previous slide" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-rose-bakery hover:text-white text-chocolate/70 transition-all duration-200">
          <FiChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-rose-bakery' : 'w-2 bg-chocolate/20'}`}
            />
          ))}
        </div>
        <button onClick={next} aria-label="Next slide" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-rose-bakery hover:text-white text-chocolate/70 transition-all duration-200">
          <FiChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
