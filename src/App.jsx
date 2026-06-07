import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute, { AdminRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// ─── Lazy-load all pages so each route only loads its JS chunk when visited ───
const Home             = lazy(() => import('./pages/Home'));
const About            = lazy(() => import('./pages/About'));
const Products         = lazy(() => import('./pages/Products'));
const SpecialityCakes  = lazy(() => import('./pages/SpecialityCakes'));
const Contact          = lazy(() => import('./pages/Contact'));
const Profile          = lazy(() => import('./pages/Profile'));
const Orders           = lazy(() => import('./pages/Orders'));
const Cart             = lazy(() => import('./pages/Cart'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' }); // instant is faster on mobile
  }, [pathname]);
  return null;
}

// Lightweight page fallback — shows immediately without layout shift
function PageFallback() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-rose-bakery border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function AppRoutes({ onOpenAuthModal }) {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <Navbar onOpenAuthModal={onOpenAuthModal} />
      {/* Suspense wraps lazy routes — each page chunk loads on demand */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/about"             element={<About />} />
          <Route path="/products"          element={<Products />} />
          <Route path="/speciality-cakes"  element={<SpecialityCakes />} />
          <Route path="/contact"           element={<Contact />} />
          <Route path="/cart"              element={<Cart />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-cream-50">
                <div className="text-8xl mb-6">🎂</div>
                <h1 className="font-serif text-4xl font-bold text-chocolate mb-3">Page Not Found</h1>
                <p className="text-chocolate/60 mb-8">This page seems to have crumbled. Let's get you back on track!</p>
                <a href="/" className="btn-primary">Back to Home</a>
              </div>
            }
          />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal  = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <BrowserRouter>
      <AuthProvider onOpenModal={openAuthModal}>
        <ProductsProvider>
          <CartProvider>
            <AppRoutes onOpenAuthModal={openAuthModal} />
            <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
