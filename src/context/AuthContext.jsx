import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, onOpenModal }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Track whether we already fetched for the initial session bootstrap so
  // onAuthStateChange doesn't duplicate the request on page load.
  // We intentionally do NOT skip subsequent manual refresh calls.
  const initialFetchDone = useRef(false);

  // Fetch profile from Supabase — select only the columns we need
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, address, is_admin, updated_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      setIsAdmin(data?.is_admin === true);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  // Public helper: force-refresh the current user's profile from the DB.
  // Call this on pages that need the freshest admin status (e.g. Profile page).
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // 1. Bootstrap immediately from the cached JWT (synchronous localStorage read)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error('Session error:', error);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        initialFetchDone.current = true;
      }

      if (mounted) setLoading(false);
    }).catch(err => {
      console.error('getSession exception:', err);
      if (mounted) setLoading(false);
    });

    // 2. React to sign-in / sign-out / token-refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip only the very first INITIAL_SESSION event if getSession() already
        // fetched the profile above. For SIGNED_IN (fresh login) always fetch.
        const isInitialEvent = event === 'INITIAL_SESSION';
        if (!isInitialEvent || !initialFetchDone.current) {
          await fetchProfile(session.user.id);
          initialFetchDone.current = true;
        }
      } else {
        initialFetchDone.current = false;
        setProfile(null);
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  // After signInWithPassword resolves, onAuthStateChange fires SIGNED_IN
  // which calls fetchProfile — no extra work needed here.
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    initialFetchDone.current = false;
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, full_name, phone, address, is_admin, updated_at')
      .single();
    if (error) throw error;
    setProfile(data);
    setIsAdmin(data?.is_admin === true);
    return data;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    fetchProfile,
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
