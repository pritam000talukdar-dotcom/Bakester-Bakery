-- ══════════════════════════════════════════════════════
-- QUANTITY COLUMN — Run this in Supabase SQL Editor
-- Only needed if you ran the previous schema already
-- ══════════════════════════════════════════════════════

alter table public.products
  add column if not exists quantity integer default 0;
