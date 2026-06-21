/**
 * AuthContext.jsx
 *
 * Manages Supabase authentication state globally. Profile data is now
 * fetched and cached by React Query (useProfileQuery) rather than a manual
 * fetch inside this context, removing the duplicate DB call when navigating
 * between Profile page and other pages.
 *
 * Changes vs. original:
 *  ✗  fetchProfile() helper and its useCallback — replaced by queryClient.invalidateQueries
 *  ✗  initialFetchDone ref guard — React Query's enabled + staleTime handles de-dup
 *  ✗  setProfile / setIsAdmin state — profile data lives in React Query cache
 *  ✓  user, session, loading — still managed here via useState (auth-only concern)
 *  ✓  signUp, signIn, signOut, resetPassword — unchanged
 *  ✓  updateProfile — now delegates to useProfileQuery mutation in callers;
 *      kept here as a thin wrapper for backward compat with existing callers
 *  ✓  onAuthStateChange subscription — still required for global auth events
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { queryKeys } from '../lib/queryKeys';
import { updateProfileApi, fetchProfile } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, onOpenModal }) => {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Auth state bootstrap + listener ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // 1. Read the JWT from localStorage synchronously (no network call)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error('Session error:', error);

      setSession(session);
      setUser(session?.user ?? null);

      // Pre-warm the profile cache immediately if a session exists
      if (session?.user) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.profile.byUser(session.user.id),
          queryFn:  () => fetchProfile(session.user.id),
          staleTime: 5 * 60 * 1000,
        });
      }

      if (mounted) setLoading(false);
    }).catch((err) => {
      console.error('getSession exception:', err);
      if (mounted) setLoading(false);
    });

    // 2. React to sign-in / sign-out / token-refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Invalidate → React Query will re-fetch the profile automatically
        // when any component that calls useProfileQuery(uid) is mounted.
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUser(session.user.id) });
      } else {
        // On sign-out: remove all user-specific cached data
        queryClient.removeQueries({ queryKey: queryKeys.profile.all });
        queryClient.removeQueries({ queryKey: queryKeys.orders.all });
        queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // State cleared by onAuthStateChange listener above
  };

  /**
   * updateProfile — kept for backward compat.
   * Components that already call useAuth().updateProfile() will still work.
   * New components should prefer the useMutation from useProfileQuery directly.
   */
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    const data = await updateProfileApi(user.id, updates);
    // Update the React Query cache so all subscribers see fresh data instantly
    queryClient.setQueryData(queryKeys.profile.byUser(user.id), data);
    return data;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  /**
   * refreshProfile — triggers a React Query invalidation so the profile is
   * re-fetched from the DB. Replaces the old manual fetchProfile() call.
   */
  const refreshProfile = useCallback(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUser(user.id) });
    }
  }, [user?.id]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshProfile,
    openAuthModal: onOpenModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
