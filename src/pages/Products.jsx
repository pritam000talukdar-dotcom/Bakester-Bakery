import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiSliders, FiX, FiChevronDown, FiStar, FiRefreshCw } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import AnimatedSection from '../components/ui/AnimatedSection';
import ProductCard from '../components/ui/ProductCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

// ── Filter constants
const PRICE_RANGES = [
  { label: 'Any Price',  min: 0,  max: Infinity },
  { label: 'Under $35', min: 0,  max: 35 },
  { label: '$35 – $50', min: 35, max: 50 },
  { label: '$50 – $80', min: 50, max: 80 },
  { label: '$80+',      min: 80, max: Infinity },
];
const SORT_OPTIONS = [
  { label: 'Newest',             value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Highest Rated',      value: 'rating-desc' },
];

// ── Rating filter stars component
function RatingFilter({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      {[0, 4, 4.5, 4.7, 4.9].map((r, i) => (
        <button
          key={i}
          onClick={() => onChange(r === value ? 0 : r)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === r && r > 0
              ? 'bg-rose-bakery text-white'
              : 'hover:bg-cream-100 text-chocolate/70'
          }`}
        >
          <span className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <HiStar
                key={s}
                size={12}
                className={s <= Math.round(r) ? 'text-gold' : 'text-cream-300'}
              />
            ))}
          </span>
          <span>{r === 0 ? 'Any rating' : `${r}+ stars`}</span>
        </button>
      ))}
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { products, loading, error, refetch } = useProducts();

  // ── Filter state
  const [searchQuery,    setSearchQuery]    = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [priceRange,     setPriceRange]     = useState(PRICE_RANGES[0]);
  const [minRating,      setMinRating]      = useState(0);
  const [sortBy,         setSortBy]         = useState('newest');
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  // Sync URL params
  useEffect(() => {
    const q   = searchParams.get('q') || '';
    const cat = searchParams.get('category') || 'All';
    setSearchQuery(q);
    setActiveCategory(cat);
  }, [searchParams]);

  // Derive categories from live products
  const CATEGORIES = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['All', ...cats];
  }, [products]);

  // ── Active filter count badge
  const activeFilterCount = [
    activeCategory !== 'All',
    priceRange.label !== 'Any Price',
    minRating > 0,
  ].filter(Boolean).length;

  // ── Filtered + sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Price
    list = list.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => (p.rating || 0) >= minRating);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':   list.sort((a, b) => a.price - b.price); break;
      case 'price-desc':  list.sort((a, b) => b.price - a.price); break;
      case 'rating-desc': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break; // 'newest' — already sorted by created_at desc from API
    }

    return list;
  }, [products, searchQuery, activeCategory, priceRange, minRating, sortBy]);

  // Group by category for sections below the main search grid
  const groupByCategory = (cat) =>
    products
      .filter((p) => p.category === cat)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const signatureProducts  = groupByCategory('Speciality').slice(0, 4);
  const cakeProducts       = groupByCategory('Cakes').slice(0, 4);
  const celebrationProducts = groupByCategory('Celebration').slice(0, 4);

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setPriceRange(PRICE_RANGES[0]);
    setMinRating(0);
    setSortBy('newest');
    setSearchParams({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  // ── Loading skeleton
  if (loading) {
    return (
      <main className="pt-20 min-h-screen">
        <section className="py-16 bg-gradient-to-br from-cream-100 to-rose-pale/20 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <div className="h-8 bg-cream-200 rounded-xl w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-cream-200 rounded-xl w-96 mx-auto animate-pulse" />
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-80 bg-cream-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ── Error state
  if (error) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center py-20">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="font-serif text-2xl font-bold text-chocolate mb-2">
            Couldn't load products
          </h2>
          <p className="text-chocolate/60 mb-6">{error}</p>
          <button onClick={refetch} className="btn-primary inline-flex items-center gap-2">
            <FiRefreshCw size={15} /> Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20">

      {/* ── Page Hero ── */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-cream-100 to-rose-pale/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-rose-pale/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold-light/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <AnimatedSection>
            <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest mb-3">Our Collection</p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold text-chocolate mb-4">
              Every Bite, a Masterpiece
            </h1>
            <p className="text-chocolate/60 text-lg max-w-xl mx-auto mb-8">
              Explore our full range of handcrafted cakes, brownies, and pastries made fresh daily.
            </p>

            {/* ── Hero search bar ── */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cakes, brownies, tarts…"
                  className="w-full pl-11 pr-32 py-4 bg-white border border-cream-200 rounded-2xl shadow-card text-chocolate text-sm placeholder-chocolate/40 focus:outline-none focus:border-rose-bakery focus:ring-2 focus:ring-rose-pale transition-all"
                  aria-label="Search products"
                  id="products-search"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-sm px-5 py-2"
                >
                  Search
                </motion.button>
              </div>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Main content: sidebar + grid ── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Filter Sidebar / Drawer ── */}
            <>
              {/* Mobile filter toggle */}
              <div className="lg:hidden flex items-center gap-3 mb-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFiltersOpen(true)}
                  className="flex items-center gap-2 bg-white border border-cream-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-chocolate shadow-sm"
                >
                  <FiSliders size={15} className="text-rose-bakery" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-rose-bakery text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </motion.button>

                {/* Sort (mobile) */}
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-cream-200 rounded-xl text-sm text-chocolate font-medium focus:outline-none focus:border-rose-bakery"
                    aria-label="Sort products"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={14} />
                </div>
              </div>

              {/* Mobile filter drawer backdrop */}
              <AnimatePresence>
                {filtersOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                      onClick={() => setFiltersOpen(false)}
                    />
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                      className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden flex flex-col overflow-y-auto"
                    >
                      <div className="flex items-center justify-between p-5 border-b border-cream-200">
                        <span className="font-serif text-lg font-bold text-chocolate">Filters</span>
                        <button onClick={() => setFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100">
                          <FiX size={18} className="text-chocolate" />
                        </button>
                      </div>
                      <div className="p-5 space-y-8 flex-1">
                        <FilterContent
                          categories={CATEGORIES}
                          activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                          priceRange={priceRange} setPriceRange={setPriceRange}
                          minRating={minRating} setMinRating={setMinRating}
                          clearAllFilters={clearAllFilters} activeFilterCount={activeFilterCount}
                        />
                      </div>
                      <div className="p-5 border-t border-cream-200">
                        <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full">
                          Show {filteredProducts.length} results
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-60 flex-shrink-0">
                <div className="sticky top-24 bg-cream-50 rounded-2xl p-6 space-y-8 border border-cream-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-chocolate">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-rose-bakery font-semibold hover:text-rose-dark transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <FilterContent
                    categories={CATEGORIES}
                    activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    minRating={minRating} setMinRating={setMinRating}
                    clearAllFilters={clearAllFilters} activeFilterCount={activeFilterCount}
                  />
                </div>
              </aside>
            </>

            {/* ── Product Grid ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-chocolate/60">
                    <span className="font-bold text-chocolate">{filteredProducts.length}</span> products
                    {searchQuery && (
                      <span> for <span className="font-semibold text-rose-bakery">"{searchQuery}"</span></span>
                    )}
                  </p>
                  {/* Active filter pills */}
                  <div className="flex flex-wrap gap-2">
                    {activeCategory !== 'All' && (
                      <FilterPill label={activeCategory} onRemove={() => setActiveCategory('All')} />
                    )}
                    {priceRange.label !== 'Any Price' && (
                      <FilterPill label={priceRange.label} onRemove={() => setPriceRange(PRICE_RANGES[0])} />
                    )}
                    {minRating > 0 && (
                      <FilterPill label={`${minRating}+ ★`} onRemove={() => setMinRating(0)} />
                    )}
                  </div>
                </div>

                {/* Sort (desktop) */}
                <div className="relative hidden lg:block flex-shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 bg-white border border-cream-200 rounded-xl text-sm text-chocolate font-medium focus:outline-none focus:border-rose-bakery cursor-pointer"
                    aria-label="Sort products"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={13} />
                </div>
              </div>

              {/* Results grid */}
              <AnimatePresence mode="wait">
                {filteredProducts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20 bg-cream-50 rounded-3xl"
                  >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="font-serif text-2xl font-bold text-chocolate mb-2">No results found</h3>
                    <p className="text-chocolate/60 mb-6">
                      {products.length === 0
                        ? 'Our fresh collection is coming soon. Check back later!'
                        : 'Try adjusting your filters or search term.'}
                    </p>
                    {products.length > 0 && (
                      <button onClick={clearAllFilters} className="btn-primary">
                        Clear Filters
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {filteredProducts.map((product, i) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(i * 0.06, 0.3), duration: 0.4 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Signature / Speciality Section ── */}
      {signatureProducts.length > 0 && (
        <section className="py-16 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-10">
              <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest mb-2">Editor's Pick</p>
              <h2 className="section-title">The Signature Collection</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {signatureProducts.slice(0, 2).map((product, i) => (
                <AnimatedSection key={product.id} delay={i * 0.15}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group relative rounded-3xl overflow-hidden bg-cream-100 shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="relative h-72 overflow-hidden">
                      <motion.img
                        src={product.image_url || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-chocolate/60 to-transparent" />
                      {product.badge && (
                        <div className="absolute top-4 left-4">
                          <span className="badge bg-white/90 text-rose-bakery text-[10px]">{product.badge}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-chocolate/50 mb-1">{product.category}</p>
                        <h3 className="font-serif text-xl font-bold text-chocolate mb-1">{product.name}</h3>
                        <p className="text-sm text-chocolate/60 leading-relaxed max-w-xs">{product.description}</p>
                        {product.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, j) => (
                              <HiStar key={j} size={13} className={j < Math.floor(product.rating) ? 'text-gold' : 'text-cream-300'} />
                            ))}
                            <span className="text-[11px] text-chocolate/50 ml-1">{product.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-serif text-2xl font-bold text-chocolate mb-2">₹{product.price?.toFixed(0)}</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addItem({ ...product, image: product.image_url || product.image })}
                          disabled={product.in_stock === false}
                          className={`text-xs px-4 py-2 rounded-full font-semibold transition-all ${
                            product.in_stock === false
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'btn-primary'
                          }`}
                        >
                          {product.in_stock === false ? 'Out of Stock' : 'Order Now'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Classic Cakes Grid ── */}
      {cakeProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-10">
              <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest mb-2">From Our Kitchen</p>
              <h2 className="section-title">Timeless recipes for new traditions.</h2>
            </AnimatedSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {cakeProducts.map((product, i) => (
                <AnimatedSection key={product.id} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group bg-cream-50 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {product.image_url || product.image ? (
                        <img
                          src={product.image_url || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-cream-100">🎂</div>
                      )}
                      {product.badge && (
                        <span className="absolute top-2 left-2 text-[9px] bg-rose-bakery text-white px-2 py-0.5 rounded-full font-semibold">
                          {product.badge}
                        </span>
                      )}
                      {product.in_stock === false && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-full">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-sm font-semibold text-chocolate mb-1">{product.name}</h3>
                      {product.rating && (
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, j) => (
                            <HiStar key={j} size={11} className={j < Math.floor(product.rating) ? 'text-gold' : 'text-cream-300'} />
                          ))}
                          <span className="text-[10px] text-chocolate/50 ml-1">{product.rating}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-chocolate">₹{product.price?.toFixed(0)}</span>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addItem({ ...product, image: product.image_url || product.image })}
                          disabled={product.in_stock === false}
                          className={`text-[11px] px-3 py-1.5 rounded-full font-semibold border transition-all ${
                            product.in_stock === false
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-chocolate hover:bg-rose-bakery hover:text-white border-cream-200'
                          }`}
                        >
                          {product.in_stock === false ? 'Unavailable' : 'Add to Cart'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Celebration Masterpieces ── */}
      {celebrationProducts.length > 0 && (
        <section className="py-16 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-10 text-center">
              <h2 className="section-title">Celebration Masterpieces</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {celebrationProducts.map((product, i) => (
                <AnimatedSection key={product.id} delay={i * 0.15}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {product.image_url || product.image ? (
                        <img
                          src={product.image_url || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-cream-100">🎂</div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-rose-bakery font-semibold mb-1">{product.badge || product.category}</p>
                      <h3 className="font-serif text-xl font-bold text-chocolate mb-2">{product.name}</h3>
                      <p className="text-sm text-chocolate/60 mb-4 leading-relaxed">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-serif text-2xl font-bold text-chocolate">₹{product.price?.toFixed(0)}</span>
                          {product.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {[...Array(5)].map((_, j) => (
                                <HiStar key={j} size={12} className={j < Math.floor(product.rating) ? 'text-gold' : 'text-cream-300'} />
                              ))}
                              <span className="text-[11px] text-chocolate/50 ml-1">{product.rating}</span>
                            </div>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addItem({ ...product, image: product.image_url || product.image })}
                          disabled={product.in_stock === false}
                          className={`text-sm rounded-full px-4 py-2 font-semibold transition-all ${
                            product.in_stock === false
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'btn-primary'
                          }`}
                        >
                          {product.in_stock === false ? 'Out of Stock' : 'Enquire Now'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when NO products exist at all */}
      {!loading && products.length === 0 && (
        <section className="py-24 bg-cream-50 text-center">
          <p className="text-6xl mb-4">🎂</p>
          <h2 className="font-serif text-3xl font-bold text-chocolate mb-3">
            Fresh Bakes Coming Soon!
          </h2>
          <p className="text-chocolate/60 max-w-sm mx-auto">
            Our team is preparing something wonderful. Check back soon for our full collection.
          </p>
        </section>
      )}

    </main>
  );
}

// ── Shared filter content
function FilterContent({ categories, activeCategory, setActiveCategory, priceRange, setPriceRange, minRating, setMinRating, clearAllFilters, activeFilterCount }) {
  return (
    <div className="space-y-7">
      {/* Category */}
      <div>
        <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider mb-3">Category</h4>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-rose-bakery text-white'
                  : 'hover:bg-cream-100 text-chocolate/70 hover:text-chocolate'
              }`}
            >
              <span>{cat}</span>
              {activeCategory === cat && (
                <motion.span
                  layoutId="cat-check"
                  className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]"
                >
                  ✓
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider mb-3">Price Range</h4>
        <div className="flex flex-col gap-1">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setPriceRange(range)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                priceRange.label === range.label
                  ? 'bg-rose-bakery text-white'
                  : 'hover:bg-cream-100 text-chocolate/70 hover:text-chocolate'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider mb-3">Min. Rating</h4>
        <RatingFilter value={minRating} onChange={setMinRating} />
      </div>

      {/* Clear button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full text-xs font-semibold text-rose-bakery border border-rose-bakery/40 rounded-lg py-2 hover:bg-rose-pale transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// Active filter pill
function FilterPill({ label, onRemove }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-pale rounded-full text-xs font-semibold text-rose-bakery"
    >
      {label}
      <button onClick={onRemove} className="hover:text-rose-dark transition-colors" aria-label={`Remove ${label} filter`}>
        <FiX size={11} />
      </button>
    </motion.span>
  );
}
