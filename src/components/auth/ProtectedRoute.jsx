import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps children — if user is not authenticated, renders the fallback (or null)
 * and opens the auth modal instead of navigating away.
 */
export default function ProtectedRoute({ children, fallback = null }) {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-rose-pale border-t-rose-bakery animate-spin" />
          <p className="text-chocolate/50 text-sm font-medium">Loading…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <div className="text-7xl mb-6">🔒</div>
          <h2 className="font-serif text-3xl font-bold text-chocolate mb-3">Sign In Required</h2>
          <p className="text-chocolate/60 mb-8">
            Please sign in to access this page and enjoy the full Bakester experience.
          </p>
          <button
            onClick={() => openAuthModal?.()}
            className="btn-primary inline-flex items-center gap-2"
          >
            Sign In / Create Account
          </button>
        </div>
      </main>
    );
  }

  return children;
}

/**
 * Admin-only guard — renders 403 if user is not an admin.
 */
export function AdminRoute({ children }) {
  const { user, isAdmin, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-rose-pale border-t-rose-bakery animate-spin" />
          <p className="text-chocolate/50 text-sm font-medium">Loading…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-7xl mb-6">🔐</div>
          <h2 className="font-serif text-3xl font-bold text-chocolate mb-3">Access Denied</h2>
          <p className="text-chocolate/60 mb-8">You need to sign in to access the admin panel.</p>
          <button onClick={() => openAuthModal?.()} className="btn-primary">Sign In</button>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-7xl mb-6">🚫</div>
          <h2 className="font-serif text-3xl font-bold text-chocolate mb-3">Forbidden</h2>
          <p className="text-chocolate/60">You don't have permission to access the admin panel.</p>
        </div>
      </main>
    );
  }

  return children;
}
