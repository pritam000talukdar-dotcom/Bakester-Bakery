import React, { Suspense, lazy, useEffect, useState, useCallback, Component } from 'react';
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

// ─── Error Boundary — catches any render crash and shows a friendly screen ───
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Bakester ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 px-6 text-center">
          <div className="text-7xl mb-6">🎂</div>
          <h1 className="font-serif text-3xl font-bold text-chocolate mb-3">
            Something went wrong
          </h1>
          <p className="text-chocolate/60 mb-2 max-w-md">
            We ran into an unexpected issue. Please try refreshing the page.
          </p>
          <p className="text-xs text-chocolate/30 mb-8 font-mono max-w-lg break-all">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Scroll to top on route change ───────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// ─── Loading fallback — shows spinner while lazy chunk downloads ──────────────
function PageFallback() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-cream-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-pale border-t-rose-bakery rounded-full animate-spin" />
        <p className="text-chocolate/50 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

// ─── App routes — separate component so it can use router hooks ───────────────
function AppRoutes({ onOpenAuthModal }) {
  return (
    <>
      <ScrollToTop />
      <Navbar onOpenAuthModal={onOpenAuthModal} />
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
          {/* 404 */}
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

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const openAuthModal  = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
