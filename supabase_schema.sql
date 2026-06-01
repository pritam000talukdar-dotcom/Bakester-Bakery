-- ═══════════════════════════════════════════════════════════════
-- BAKESTER BAKERY — Supabase Schema (Safe to run multiple times)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════


-- ── 1. PROFILES ──────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;

create policy "Users view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. PRODUCTS ──────────────────────────────────────────────
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  rating numeric default 4.5,
  badge text,
  in_stock boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Anyone can view products"
  on public.products for select using (true);
create policy "Admins can insert products"
  on public.products for insert
  with check ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins can update products"
  on public.products for update
  using ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins can delete products"
  on public.products for delete
  using ((select is_admin from public.profiles where id = auth.uid()));


-- ── 3. ORDERS ────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  order_number text not null,
  items jsonb not null default '[]',
  status text not null default 'Processing',
  total numeric not null,
  address text,
  tracking text,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;

drop policy if exists "Users view own orders" on public.orders;
drop policy if exists "Users insert own orders" on public.orders;
drop policy if exists "Admins view all orders" on public.orders;
drop policy if exists "Admins update all orders" on public.orders;

create policy "Users view own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders"
  on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins view all orders"
  on public.orders for select
  using ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins update all orders"
  on public.orders for update
  using ((select is_admin from public.profiles where id = auth.uid()));


-- ── 4. CART ITEMS ─────────────────────────────────────────────
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  quantity integer not null default 1,
  product_data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, product_id)
);
alter table public.cart_items enable row level security;

drop policy if exists "Users manage own cart" on public.cart_items;

create policy "Users manage own cart"
  on public.cart_items for all using (auth.uid() = user_id);


-- ── 5. STORAGE — product-images bucket ────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (select is_admin from public.profiles where id = auth.uid())
  );
create policy "Admins can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (select is_admin from public.profiles where id = auth.uid())
  );
create policy "Admins can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (select is_admin from public.profiles where id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════════
-- AFTER RUNNING:
-- 1. Sign up on the app  →  your profile row is auto-created
-- 2. Supabase → Table Editor → profiles
--    → find your row → set is_admin = true
--    → do the same for the admin operator after they sign up
-- ═══════════════════════════════════════════════════════════════
