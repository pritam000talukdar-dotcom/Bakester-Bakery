-- ═══════════════════════════════════════════════════════════════
-- BAKESTER BAKERY — Add recipe, weight_g, quantity columns
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Add 'quantity' column (how many left in stock)
alter table public.products
  add column if not exists quantity integer default 0;

-- Add 'weight_g' column (cake weight in grams, used to estimate servings)
alter table public.products
  add column if not exists weight_g integer;

-- Add 'recipe' column (how the cake is made — shown on speciality page)
alter table public.products
  add column if not exists recipe text;

-- Update 'updated_at' trigger (if not exists)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();
