import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Guard: catch missing env vars immediately at startup ─────────────────────
// On Netlify this happens when env vars are not set in the dashboard.
if (!supabaseUrl || !supabaseAnonKey) {
  // Log a clear actionable message instead of a cryptic network error
  console.error(
    '[Bakester] ❌ Supabase environment variables are missing!\n' +
    'If you are deploying to Netlify:\n' +
    '  1. Go to Netlify Dashboard → Site Settings → Environment Variables\n' +
    '  2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n' +
    '  3. Trigger a new deploy\n\n' +
    'If running locally, make sure .env exists with both variables.'
  );
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-client-info': 'bakester-bakery' },
    },
    db: {
      schema: 'public',
    },
  }
);

// Export a flag so components can check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
