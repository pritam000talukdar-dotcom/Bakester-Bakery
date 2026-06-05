-- ═══════════════════════════════════════════════════════════════
-- BAKESTER BAKERY — Guest Orders Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Ensure quantity column exists on products ──────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0;

-- ── 2. Make user_id nullable in orders (for guest checkout) ───
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- ── 3. Add guest info columns to orders ───────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone text;

-- ── 4. Update RLS policies to allow guest inserts ─────────────
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;

-- Allow anyone (logged in or guest) to place orders
CREATE POLICY "Anyone can place orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Users still view only their own orders when logged in
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ── 5. Admins can view and update all orders ──────────────────
-- (These already exist but re-create safely)
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update all orders" ON public.orders;

CREATE POLICY "Admins view all orders"
  ON public.orders FOR SELECT
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins update all orders"
  ON public.orders FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- NOTE: After running this migration, go to:
-- Supabase Dashboard → Database → Tables → products
-- Enable Realtime on the products table for live updates
-- ═══════════════════════════════════════════════════════════════
