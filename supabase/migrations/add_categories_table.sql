-- Run this once in your Supabase project's SQL editor
-- (Project → SQL Editor → New Query → paste → Run)
--
-- Creates the `categories` table that powers the new dynamic category
-- system: Admin → Categories, the home page grid, the burger menu, the
-- Category picker when creating a product, and Inventory grouping.
--
-- Existing hardcoded categories (Tees & Tank Tops, Accessories, Bagcharms,
-- Limited Edition) are seeded as rows here too, marked `is_legacy = true`,
-- so they show up in the same ordered list — but their actual pages
-- (/shop, /accessories, /bagcharms, /limited-edition) are untouched and
-- keep working exactly as before. `is_legacy` just tells the frontend to
-- link to that fixed route instead of the new generic /category/:slug page.

create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  -- Free-text, not a Postgres enum — so a new type (e.g. "home_goods") can be
  -- introduced later just by typing it into the admin form, no migration.
  category_type text not null default 'wearable',
  description   text,
  image_url     text,
  display_order integer not null default 0,
  -- If null, the burger menu falls back to display_order.
  menu_order    integer,
  status        text not null default 'draft'
                  check (status in ('draft', 'coming_soon', 'live', 'archived')),
  -- Set automatically the moment status flips to 'live'. Drives the "New"
  -- badge on the home tile / menu item for a couple of weeks after launch.
  launched_at   timestamptz,
  -- True only for the 4 pre-existing categories that still live on their own
  -- hardcoded routes/pages. New categories created via the admin panel are
  -- always false and use the generic /category/:slug page.
  is_legacy     boolean not null default false,
  legacy_href   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists categories_status_idx on public.categories (status);
create index if not exists categories_display_order_idx on public.categories (display_order);

alter table public.categories enable row level security;

-- Matches this project's existing security model (no per-user auth; the
-- admin panel itself is the gate) — same pattern as admin_settings/products.
drop policy if exists "Allow read categories" on public.categories;
create policy "Allow read categories"
  on public.categories for select
  using (true);

drop policy if exists "Allow write categories" on public.categories;
create policy "Allow write categories"
  on public.categories for all
  using (true)
  with check (true);

grant select, insert, update, delete on public.categories to anon, authenticated;

-- Seed the 4 existing categories so they appear in the same ordered list as
-- new ones. Safe to re-run — skips rows that already exist by slug.
insert into public.categories (name, slug, category_type, display_order, status, is_legacy, legacy_href, launched_at)
values
  ('Tees & Tank Tops', 'shop',            'wearable',  1, 'live', true, '/shop',            now()),
  ('Limited Edition',  'limited-edition',  'wearable',  2, 'live', true, '/limited-edition', now()),
  ('Accessories',      'accessories',      'accessory', 3, 'live', true, '/accessories',     now()),
  ('Bagcharms',        'bagcharms',        'accessory', 4, 'live', true, '/bagcharms',       now())
on conflict (slug) do nothing;
