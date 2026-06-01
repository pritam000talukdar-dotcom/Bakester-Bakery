import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute, { AdminRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import SpecialityCakes from './pages/SpecialityCakes';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import AdminDashboard from './pages/admin/AdminDashboard';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

// Page transition wrapper
function PageWrapper({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes({ onOpenAuthModal }) {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <Navbar onOpenAuthModal={onOpenAuthModal} />
      <PageWrapper>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/speciality-cakes" element={<SpecialityCakes />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
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
      </PageWrapper>
      <Footer />
    </>
  );
}

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <BrowserRouter>
      <AuthProvider onOpenModal={openAuthModal}>
        <CartProvider>
          <AppRoutes onOpenAuthModal={openAuthModal} />
          <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
