import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiChevronDown, FiSettings } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Our Story', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Speciality Cakes', to: '/speciality-cakes' },
  { label: 'Contact', to: '/contact' },
];

const FILTER_CATEGORIES = ['All', 'Cakes', 'Brownies', 'Tarts', 'Celebration'];
const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: 'Under $35',  min: 0, max: 35 },
  { label: '$35 – $50', min: 35, max: 50 },
  { label: '$50 – $80', min: 50, max: 80 },
  { label: '$80+',       min: 80, max: Infinity },
];
const RATINGS = [
  { label: 'Any Rating', value: 0 },
  { label: '4+ Stars',   value: 4 },
  { label: '4.5+ Stars', value: 4.5 },
  { label: '4.7+ Stars', value: 4.7 },
];

// ── SVG Bakery Logo ──────────────────────────────────────────
function BakeryLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Bakester Bakery logo">
      <ellipse cx="24" cy="36" rx="18" ry="4" fill="#F5D5DC" />
      <rect x="10" y="24" width="28" height="12" rx="3" fill="#E8899A" />
      <rect x="14" y="14" width="20" height="12" rx="3" fill="#C0576A" />
      <path d="M10 27 Q13 23 16 27 Q19 23 22 27 Q25 23 28 27 Q31 23 34 27 Q37 23 38 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 17 Q17 13 20 17 Q23 13 26 17 Q29 13 32 17 Q34 13 34 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="20" y="7" width="3" height="8" rx="1.5" fill="#8B2252" />
      <rect x="26" y="9" width="3" height="6" rx="1.5" fill="#D4A853" />
      <ellipse cx="21.5" cy="6.5" rx="1.5" ry="2" fill="#F0CC87" />
      <ellipse cx="27.5" cy="8.5" rx="1.5" ry="2" fill="#F0CC87" />
      <circle cx="15" cy="29" r="1" fill="white" opacity="0.8" />
      <circle cx="33" cy="31" r="1" fill="white" opacity="0.8" />
      <circle cx="24" cy="28" r="1" fill="white" opacity="0.8" />
    </svg>
  );
}

// ── Filter Dropdown panel ────────────────────────────────────
function FilterDropdown({ category, setCategory, priceRange, setPriceRange, rating, setRating, onClear, activeCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-card-hover border border-cream-200 z-50 overflow-hidden"
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100">
        <span className="text-xs font-bold text-chocolate uppercase tracking-wider">Filters</span>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[11px] text-rose-bakery font-semibold hover:text-rose-dark transition-colors">
            Clear all
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Category */}
        <div>
          <p className="text-[11px] font-bold text-chocolate/50 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
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
                onClick={() => setRating(r.value)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  rating === r.value
                    ? 'bg-rose-bakery text-white'
                    : 'hover:bg-cream-100 text-chocolate/70'
                }`}
              >
                <span className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <HiStar key={s} size={11} className={s <= Math.round(r.value) && r.value > 0 ? 'text-gold' : (rating === r.value ? 'text-white/50' : 'text-cream-300')} />
                  ))}
                </span>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Navbar ──────────────────────────────────────────────
export default function Navbar({ onOpenAuthModal }) {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // filter state
  const [category, setCategory]     = useState('All');
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0]);
  const [rating, setRating]         = useState(0);

  const searchBarRef = useRef(null);
  const { cartCount } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const { products } = useProducts();
  const location = useLocation();
  const navigate  = useNavigate();

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const activeFilterCount = [category !== 'All', priceRange.label !== 'Any Price', rating > 0].filter(Boolean).length;

  // scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setFilterOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [location]);

  // live search results — searches real Supabase products
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

  // click outside closes search+filter
  useEffect(() => {
    const handler = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setSearchOpen(false);
        setFilterOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearFilters = () => {
    setCategory('All');
    setPriceRange(PRICE_RANGES[0]);
    setRating(0);
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (category !== 'All') params.set('cat', category);
    if (priceRange.label !== 'Any Price') { params.set('pmin', priceRange.min); params.set('pmax', priceRange.max === Infinity ? '999999' : priceRange.max); }
    if (rating > 0) params.set('rating', rating);
    return params.toString();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const qs = buildQuery();
    navigate(`/products${qs ? '?' + qs : ''}`);
    setSearchOpen(false);
    setFilterOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleResultClick = (product) => {
    navigate(`/products?q=${encodeURIComponent(product.name)}`);
    setSearchOpen(false);
    setFilterOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchBarRef.current?.querySelector('input')?.focus(), 80);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-safe shadow-[0_2px_20px_rgba(45,27,14,0.08)]'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Main bar ── */}
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-rose-pale to-rose-bakery/20 rounded-xl flex items-center justify-center shadow-sm border border-rose-pale">
                  <BakeryLogo className="w-8 h-8" />
                </div>
              </motion.div>
              <div className="leading-tight">
                <span className="block font-serif text-base font-bold text-chocolate group-hover:text-rose-bakery transition-colors leading-none">Bakester</span>
                <span className="block text-[10px] font-semibold text-rose-bakery/70 uppercase tracking-widest leading-none mt-0.5">Bakery</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <ul className="hidden lg:flex items-center gap-7 flex-1 justify-center">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors duration-200 relative ${
                        isActive ? 'text-rose-bakery' : 'text-chocolate/70 hover:text-rose-bakery'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <span className="relative">
                        {link.label}
                        {isActive && (
                          <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-bakery rounded-full" />
                        )}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search icon toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => searchOpen ? (setSearchOpen(false), setFilterOpen(false), setSearchQuery(''), setSearchResults([])) : openSearch()}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  searchOpen ? 'bg-rose-bakery text-white' : 'hover:bg-cream-200 text-chocolate/70 hover:text-rose-bakery'
                }`}
                aria-label="Toggle search"
                id="navbar-search-toggle"
              >
                {searchOpen ? <FiX size={17} /> : <FiSearch size={17} />}
              </motion.button>

              {/* Cart */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 text-chocolate/70 hover:text-rose-bakery transition-all" aria-label={`Cart (${cartCount} items)`}>
                  <FiShoppingCart size={17} />
                  {cartCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 bg-rose-bakery text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>

              {/* Admin Link (only for admins) */}
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chocolate text-white text-xs font-bold hover:bg-chocolate/80 transition-all"
                    aria-label="Admin Panel"
                  >
                    <FiSettings size={12} />
                    Admin
                  </Link>
                </motion.div>
              )}

              {/* Profile / Sign In */}
              {user ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/profile"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-bakery text-white hover:bg-rose-dark transition-all text-xs font-bold"
                    aria-label="Profile"
                  >
                    {getUserInitials()}
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenAuthModal}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-rose-bakery text-white text-sm font-semibold hover:bg-rose-dark transition-all shadow-rose"
                  aria-label="Sign In"
                  id="navbar-signin-btn"
                >
                  <FiUser size={14} />
                  Sign In
                </motion.button>
              )}

              {/* Mobile hamburger */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 text-chocolate transition-all"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </motion.button>
            </div>
          </div>

          {/* ── Expandable Search Bar row ── */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="overflow-visible"
                ref={searchBarRef}
              >
                <div className="pb-3 pt-1">
                  <form onSubmit={handleSearchSubmit}>
                    {/* Single unified search row */}
                    <div className="flex items-center bg-white border border-cream-300 rounded-2xl shadow-card overflow-visible focus-within:border-rose-bakery focus-within:ring-2 focus-within:ring-rose-pale transition-all">

                      {/* Search icon inside */}
                      <div className="pl-4 pr-2 flex-shrink-0 pointer-events-none">
                        <FiSearch size={16} className="text-chocolate/40" />
                      </div>

                      {/* Text input — takes all remaining space */}
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search cakes, brownies, tarts…"
                        className="flex-1 min-w-0 py-3 text-sm text-chocolate placeholder-chocolate/40 bg-transparent outline-none"
                        aria-label="Search products"
                        id="navbar-search"
                      />

                      {/* Divider */}
                      <div className="w-px h-6 bg-cream-200 flex-shrink-0 mx-1" />

                      {/* Filter toggle button */}
                      <div className="relative flex-shrink-0">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setFilterOpen(!filterOpen)}
                          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors ${
                            filterOpen || activeFilterCount > 0 ? 'text-rose-bakery' : 'text-chocolate/60 hover:text-rose-bakery'
                          }`}
                          aria-label="Toggle filters"
                          id="search-filter-toggle"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Filters
                          {activeFilterCount > 0 && (
                            <span className="w-4 h-4 bg-rose-bakery text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                              {activeFilterCount}
                            </span>
                          )}
                          <FiChevronDown size={12} className={`transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
                        </motion.button>

                        {/* Filter dropdown panel */}
                        <AnimatePresence>
                          {filterOpen && (
                            <FilterDropdown
                              category={category} setCategory={setCategory}
                              priceRange={priceRange} setPriceRange={setPriceRange}
                              rating={rating} setRating={setRating}
                              onClear={clearFilters}
                              activeCount={activeFilterCount}
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-6 bg-cream-200 flex-shrink-0 mx-1" />

                      {/* Search submit button */}
                      <div className="pr-1.5 flex-shrink-0">
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="btn-primary text-xs px-5 py-2 rounded-xl"
                          aria-label="Submit search"
                        >
                          Search
                        </motion.button>
                      </div>
                    </div>

                    {/* ── Live results dropdown ── */}
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="mt-1 bg-white rounded-2xl shadow-card-hover border border-cream-200 overflow-hidden"
                        >
                          {searchResults.map((product, i) => (
                            <motion.button
                              key={product.id}
                              type="button"
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => handleResultClick(product)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-50 transition-colors text-left group border-b border-cream-100 last:border-0"
                            >
                               <img src={product.image_url || product.image || ''} alt={product.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" loading="lazy" />
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

                      {/* No results state */}
                      {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1 bg-white rounded-2xl shadow-card border border-cream-200 px-4 py-4 text-center"
                        >
                          <p className="text-sm text-chocolate/60">No products found for <span className="font-semibold text-chocolate">"{searchQuery}"</span></p>
                          <button onClick={clearFilters} className="text-xs text-rose-bakery font-semibold mt-1 hover:underline">Clear filters</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </nav>
      </header>

      {/* ── Mobile slide-in menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-cream-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-pale to-rose-bakery/20 rounded-lg flex items-center justify-center">
                    <BakeryLogo className="w-6 h-6" />
                  </div>
                  <span className="font-serif text-base font-bold text-chocolate">Bakester Bakery</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100" aria-label="Close menu">
                  <FiX size={18} className="text-chocolate" />
                </button>
              </div>
              <nav className="flex-1 px-5 py-6 space-y-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div key={link.to} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                          isActive ? 'bg-rose-pale text-rose-bakery' : 'text-chocolate/70 hover:bg-cream-100 hover:text-rose-bakery'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
              <div className="p-5 border-t border-cream-200 space-y-3">
                {user ? (
                  <Link to="/profile" className="btn-primary w-full text-center block">My Account</Link>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); onOpenAuthModal?.(); }}
                    className="btn-primary w-full text-center block"
                  >
                    Sign In / Sign Up
                  </button>
                )}
                {isAdmin && (
                  <Link to="/admin" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-chocolate text-white text-sm font-semibold hover:bg-chocolate/80 transition-all">
                    <FiSettings size={14} /> Admin Panel
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
