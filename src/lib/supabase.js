import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // localStorage is the default — do NOT pass window.localStorage explicitly
    // as it can crash during module evaluation before the DOM is ready.
  },
  global: {
    headers: { 'x-client-info': 'bakester-bakery' },
  },
  db: {
    schema: 'public',
  },
});
