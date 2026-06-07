import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiSliders, FiX, FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import ProductCard from '../components/ui/ProductCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

// ── Filter constants ──────────────────────────────────────────────────────────
const PRICE_RANGES = [
  { label: 'Any Price',      min: 0,   max: Infinity },
  { label: 'Under ₹100',    min: 0,   max: 100 },
  { label: '₹100 – ₹150',  min: 100, max: 150 },
  { label: '₹150+',         min: 150, max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Newest',             value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Highest Rated',      value: 'rating-desc' },
];

// ── Skeleton loader ───────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-cream-100 animate-pulse">
      <div className="h-52 bg-gradient-to-br from-cream-100 to-cream-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-cream-200 rounded w-1/3" />
        <div className="h-4 bg-cream-200 rounded w-3/4" />
        <div className="h-3 bg-cream-100 rounded w-full" />
        <div className="h-3 bg-cream-100 rounded w-2/3" />
        <div className="flex justify-between items-center mt-3 pt-2">
          <div className="h-5 bg-cream-200 rounded w-16" />
          <div className="h-8 bg-cream-200 rounded-full w-28" />
        </div>
      </div>
    </div>
  );
}

// ── Rating stars display ──────────────────────────────────────────────────────
function RatingFilter({ value, onChange }) {
  const options = [
    { label: 'Any rating', value: 0 },
    { label: '4+ stars',   value: 4 },
    { label: '4.5+ stars', value: 4.5 },
  ];
  return (
    <div className="flex flex-col gap-1">
      {options.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value === value ? 0 : r.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
            value === r.value && r.value > 0
              ? 'bg-rose-bakery text-white'
              : 'hover:bg-cream-100 text-chocolate/70'
          }`}
        >
          {r.value > 0 && (
            <span className="flex">
              {[1,2,3,4,5].map((s) => (
                <HiStar key={s} size={11} className={
                  s <= Math.round(r.value)
                    ? (value === r.value ? 'text-white' : 'text-gold')
                    : (value === r.value ? 'text-white/40' : 'text-cream-300')
                } />
              ))}
            </span>
          )}
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Filter sidebar content (shared between desktop + mobile drawer) ───────────
function FilterContent({ categories, activeCategory, setActiveCategory, priceRange, setPriceRange, minRating, setMinRating, clearAllFilters, activeFilterCount }) {
  return (
    <div className="space-y-7">
      {/* Category */}
      <div>
        <h4 className="text-[11px] font-bold text-chocolate uppercase tracking-wider mb-3">Category</h4>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                activeCategory === cat
                  ? 'bg-rose-bakery text-white'
                  : 'hover:bg-cream-100 text-chocolate/70 hover:text-chocolate'
              }`}
            >
              <span>{cat}</span>
              {activeCategory === cat && (
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-[11px] font-bold text-chocolate uppercase tracking-wider mb-3">Price Range</h4>
        <div className="flex flex-col gap-1">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setPriceRange(range)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
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
        <h4 className="text-[11px] font-bold text-chocolate uppercase tracking-wider mb-3">Min. Rating</h4>
        <RatingFilter value={minRating} onChange={setMinRating} />
      </div>

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

// ── Active filter pill ────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-pale rounded-full text-xs font-semibold text-rose-bakery">
      {label}
      <button onClick={onRemove} className="hover:text-rose-dark transition-colors" aria-label={`Remove ${label} filter`}>
        <FiX size={11} />
      </button>
    </span>
  );
}

// ── Main Products page ────────────────────────────────────────────────────────
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { products, loading, error, refetch } = useProducts();

  const [searchQuery,    setSearchQuery]    = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [priceRange,     setPriceRange]     = useState(PRICE_RANGES[0]);
  const [minRating,      setMinRating]      = useState(0);
  const [sortBy,         setSortBy]         = useState('newest');
  const [filtersOpen,    setFiltersOpen]    = useState(false);
  // Toggle: false = show all, true = in-stock only
  const [stockOnly,      setStockOnly]      = useState(false);

  useEffect(() => {
    const q   = searchParams.get('q') || '';
    const cat = searchParams.get('category') || 'All';
    setSearchQuery(q);
    setActiveCategory(cat);
  }, [searchParams]);

  // Derive categories from live products
  const CATEGORIES = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [products]);

  const activeFilterCount = [
    activeCategory !== 'All',
    priceRange.label !== 'Any Price',
    minRating > 0,
    stockOnly,
  ].filter(Boolean).length;

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (stockOnly) {
      list = list.filter((p) => p.in_stock !== false);
    }

    list = list.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    if (minRating > 0) {
      list = list.filter((p) => (p.rating || 0) >= minRating);
    }

    switch (sortBy) {
      case 'price-asc':   list.sort((a, b) => a.price - b.price); break;
      case 'price-desc':  list.sort((a, b) => b.price - a.price); break;
      case 'rating-desc': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break;
    }

    return list;
  }, [products, searchQuery, activeCategory, priceRange, minRating, sortBy, stockOnly]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setPriceRange(PRICE_RANGES[0]);
    setMinRating(0);
    setSortBy('newest');
    setStockOnly(false);
    setSearchParams({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50">
        {/* Hero skeleton */}
        <section className="py-14 bg-gradient-to-br from-cream-100 to-rose-pale/20 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="h-3 bg-cream-200 rounded w-24 mx-auto mb-4 animate-pulse" />
            <div className="h-8 bg-cream-200 rounded-xl w-64 mx-auto mb-3 animate-pulse" />
            <div className="h-4 bg-cream-100 rounded-xl w-80 mx-auto mb-8 animate-pulse" />
            <div className="h-12 bg-cream-200 rounded-2xl max-w-lg mx-auto animate-pulse" />
          </div>
        </section>
        <section className="py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1,2,3,4,5,6].map((i) => <ProductSkeleton key={i} />)}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center py-20 px-4">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="font-serif text-2xl font-bold text-chocolate mb-2">Couldn't load products</h2>
          <p className="text-chocolate/60 mb-6 text-sm">{error}</p>
          <button onClick={refetch} className="btn-primary inline-flex items-center gap-2">
            <FiRefreshCw size={15} /> Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 bg-white min-h-screen">

      {/* ── Page Hero ── */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-cream-100 via-white to-rose-pale/20 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-rose-pale/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold-light/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs text-rose-bakery font-bold uppercase tracking-widest mb-3">Our Collection</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-chocolate mb-3 leading-tight">
              Every Bite, a Masterpiece
            </h1>
            <p className="text-chocolate/60 text-base max-w-md mx-auto mb-7">
              Handcrafted cakes, brownies & pastries — made fresh for you.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={17} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cakes, brownies, tarts…"
                  className="w-full pl-11 pr-28 py-3.5 bg-white border border-cream-200 rounded-2xl shadow-card text-chocolate text-sm placeholder-chocolate/40 focus:outline-none focus:border-rose-bakery focus:ring-2 focus:ring-rose-pale transition-all"
                  aria-label="Search products"
                  id="products-search"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-xs px-4 py-2"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Filter Sidebar ── */}
            <>
              {/* Mobile filter bar */}
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <button
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
                </button>

                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-cream-200 rounded-xl text-sm text-chocolate font-medium focus:outline-none focus:border-rose-bakery"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={14} />
                </div>
              </div>

              {/* Mobile drawer backdrop */}
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
                          Show {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-24 bg-cream-50 rounded-2xl p-6 space-y-7 border border-cream-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-chocolate">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAllFilters} className="text-xs text-rose-bakery font-semibold hover:text-rose-dark">
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

            {/* ── Products Grid ── */}
            <div className="flex-1 min-w-0">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-chocolate/60">
                    <span className="font-bold text-chocolate">{filteredProducts.length}</span>
                    {' '}product{filteredProducts.length !== 1 ? 's' : ''}
                    {searchQuery && (
                      <span> for <span className="font-semibold text-rose-bakery">"{searchQuery}"</span></span>
                    )}
                  </p>

                  {/* In-stock toggle chip */}
                  <button
                    onClick={() => setStockOnly(!stockOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      stockOnly
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-cream-200 text-chocolate/60 hover:border-rose-bakery hover:text-rose-bakery'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${stockOnly ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    In stock only
                  </button>

                  {/* Active filter pills */}
                  {activeCategory !== 'All' && <FilterPill label={activeCategory} onRemove={() => setActiveCategory('All')} />}
                  {priceRange.label !== 'Any Price' && <FilterPill label={priceRange.label} onRemove={() => setPriceRange(PRICE_RANGES[0])} />}
                  {minRating > 0 && <FilterPill label={`${minRating}+ ★`} onRemove={() => setMinRating(0)} />}
                </div>

                {/* Sort — desktop */}
                <div className="relative hidden lg:block flex-shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 bg-white border border-cream-200 rounded-xl text-sm text-chocolate font-medium focus:outline-none focus:border-rose-bakery cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chocolate/40 pointer-events-none" size={13} />
                </div>
              </div>

              {/* Grid */}
              {filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 bg-cream-50 rounded-3xl"
                >
                  <div className="text-5xl mb-4">
                    {products.length === 0 ? '🎂' : '🔍'}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-chocolate mb-2">
                    {products.length === 0 ? 'Fresh bakes coming soon!' : 'No results found'}
                  </h3>
                  <p className="text-chocolate/60 text-sm mb-6">
                    {products.length === 0
                      ? 'Our team is preparing something wonderful. Check back soon!'
                      : 'Try adjusting your filters or search term.'}
                  </p>
                  {products.length > 0 && (
                    <button onClick={clearAllFilters} className="btn-primary">Clear Filters</button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeCategory}-${sortBy}-${stockOnly}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
                >
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.15), duration: 0.25 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
