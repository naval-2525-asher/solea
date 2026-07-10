-- Run this once in your Supabase project's SQL editor
-- (Project → SQL Editor → New Query → paste → Run)
--
-- Creates (or replaces) the two RPC functions the Orders panel calls when an
-- order is confirmed / cancelled:
--
--   decrement_product_stock(p_product_id, p_style, p_size, p_color, p_qty)
--   increment_product_stock(p_product_id, p_style, p_size, p_color, p_qty)
--
-- IMPORTANT: this version adds a p_color parameter. If you already have
-- versions of these functions from before, this migration replaces them —
-- the app code has also been updated to pass color as the 4th argument.
--
-- What they do, per product:
--   • tee/tank + size + color → decrements/increments the specific cell in
--     tee_size_color_stock / tank_size_color_stock (the {size:{color:qty}}
--     grid), AND keeps the per-size total (tee_variants/tank_variants) in
--     sync so "Tee S" style pages still show the right number.
--   • tee/tank + size, no matching grid cell → falls back to just adjusting
--     the per-size total.
--   • accessory + color → decrements/increments color_stock[color].
--   • Always keeps the flat stock_count (+ stock_status badge) in sync too,
--     since listing pages read those flat fields directly.
--
-- Stock never goes below 0 on decrement.

drop function if exists public.decrement_product_stock(uuid, text, text, integer);
drop function if exists public.increment_product_stock(uuid, text, text, integer);
drop function if exists public.decrement_product_stock(uuid, text, text, text, integer);
drop function if exists public.increment_product_stock(uuid, text, text, text, integer);

create or replace function public.decrement_product_stock(
  p_product_id uuid,
  p_style text,
  p_size text,
  p_color text,
  p_qty int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tee_variants  jsonb;
  v_tank_variants jsonb;
  v_tee_scs       jsonb;
  v_tank_scs      jsonb;
  v_color_stock   jsonb;
  v_stock_count   int;
  v_current       numeric;
  v_new_count     int;
begin
  select tee_variants, tank_variants, tee_size_color_stock, tank_size_color_stock,
         color_stock, coalesce(stock_count, 0)
    into v_tee_variants, v_tank_variants, v_tee_scs, v_tank_scs, v_color_stock, v_stock_count
  from public.products
  where id = p_product_id
  for update;

  if not found then
    return;
  end if;

  if p_style in ('tee', 'tank') and p_size is not null then
    if p_style = 'tee' then
      -- size+color grid cell, if it exists for this size/color
      if p_color is not null and v_tee_scs ? p_size and (v_tee_scs -> p_size) ? p_color then
        v_current := coalesce((v_tee_scs -> p_size ->> p_color)::numeric, 0);
        v_tee_scs := jsonb_set(v_tee_scs, array[p_size, p_color], to_jsonb(greatest(0, v_current - p_qty)));
      end if;
      -- per-size total, always kept in sync
      v_current := coalesce((v_tee_variants ->> p_size)::numeric, 0);
      v_tee_variants := jsonb_set(coalesce(v_tee_variants, '{}'::jsonb), array[p_size], to_jsonb(greatest(0, v_current - p_qty)));
    else
      if p_color is not null and v_tank_scs ? p_size and (v_tank_scs -> p_size) ? p_color then
        v_current := coalesce((v_tank_scs -> p_size ->> p_color)::numeric, 0);
        v_tank_scs := jsonb_set(v_tank_scs, array[p_size, p_color], to_jsonb(greatest(0, v_current - p_qty)));
      end if;
      v_current := coalesce((v_tank_variants ->> p_size)::numeric, 0);
      v_tank_variants := jsonb_set(coalesce(v_tank_variants, '{}'::jsonb), array[p_size], to_jsonb(greatest(0, v_current - p_qty)));
    end if;
  elsif p_style = 'accessory' and p_color is not null and v_color_stock ? p_color then
    v_current := coalesce((v_color_stock ->> p_color)::numeric, 0);
    v_color_stock := jsonb_set(v_color_stock, array[p_color], to_jsonb(greatest(0, v_current - p_qty)));
  end if;

  v_new_count := greatest(0, v_stock_count - p_qty);

  update public.products
  set
    tee_variants           = coalesce(v_tee_variants, tee_variants),
    tank_variants          = coalesce(v_tank_variants, tank_variants),
    tee_size_color_stock   = coalesce(v_tee_scs, tee_size_color_stock),
    tank_size_color_stock  = coalesce(v_tank_scs, tank_size_color_stock),
    color_stock            = coalesce(v_color_stock, color_stock),
    stock_count            = v_new_count,
    stock_status           = case
                                when v_new_count = 0 then 'out_of_stock'
                                when v_new_count <= 5 then 'low_stock'
                                else 'in_stock'
                              end,
    updated_at             = now()
  where id = p_product_id;
end;
$$;

create or replace function public.increment_product_stock(
  p_product_id uuid,
  p_style text,
  p_size text,
  p_color text,
  p_qty int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tee_variants  jsonb;
  v_tank_variants jsonb;
  v_tee_scs       jsonb;
  v_tank_scs      jsonb;
  v_color_stock   jsonb;
  v_stock_count   int;
  v_current       numeric;
  v_new_count     int;
begin
  select tee_variants, tank_variants, tee_size_color_stock, tank_size_color_stock,
         color_stock, coalesce(stock_count, 0)
    into v_tee_variants, v_tank_variants, v_tee_scs, v_tank_scs, v_color_stock, v_stock_count
  from public.products
  where id = p_product_id
  for update;

  if not found then
    return;
  end if;

  if p_style in ('tee', 'tank') and p_size is not null then
    if p_style = 'tee' then
      if p_color is not null and v_tee_scs ? p_size and (v_tee_scs -> p_size) ? p_color then
        v_current := coalesce((v_tee_scs -> p_size ->> p_color)::numeric, 0);
        v_tee_scs := jsonb_set(v_tee_scs, array[p_size, p_color], to_jsonb(v_current + p_qty));
      end if;
      v_current := coalesce((v_tee_variants ->> p_size)::numeric, 0);
      v_tee_variants := jsonb_set(coalesce(v_tee_variants, '{}'::jsonb), array[p_size], to_jsonb(v_current + p_qty));
    else
      if p_color is not null and v_tank_scs ? p_size and (v_tank_scs -> p_size) ? p_color then
        v_current := coalesce((v_tank_scs -> p_size ->> p_color)::numeric, 0);
        v_tank_scs := jsonb_set(v_tank_scs, array[p_size, p_color], to_jsonb(v_current + p_qty));
      end if;
      v_current := coalesce((v_tank_variants ->> p_size)::numeric, 0);
      v_tank_variants := jsonb_set(coalesce(v_tank_variants, '{}'::jsonb), array[p_size], to_jsonb(v_current + p_qty));
    end if;
  elsif p_style = 'accessory' and p_color is not null and v_color_stock ? p_color then
    v_current := coalesce((v_color_stock ->> p_color)::numeric, 0);
    v_color_stock := jsonb_set(v_color_stock, array[p_color], to_jsonb(v_current + p_qty));
  end if;

  v_new_count := v_stock_count + p_qty;

  update public.products
  set
    tee_variants           = coalesce(v_tee_variants, tee_variants),
    tank_variants          = coalesce(v_tank_variants, tank_variants),
    tee_size_color_stock   = coalesce(v_tee_scs, tee_size_color_stock),
    tank_size_color_stock  = coalesce(v_tank_scs, tank_size_color_stock),
    color_stock            = coalesce(v_color_stock, color_stock),
    stock_count            = v_new_count,
    stock_status           = case
                                when v_new_count = 0 then 'out_of_stock'
                                when v_new_count <= 5 then 'low_stock'
                                else 'in_stock'
                              end,
    updated_at             = now()
  where id = p_product_id;
end;
$$;

-- Let the app (anon key) call these functions, matching the rest of this
-- project's security model (no per-user auth; the admin panel gates access).
grant execute on function public.decrement_product_stock(uuid, text, text, text, int) to anon, authenticated;
grant execute on function public.increment_product_stock(uuid, text, text, text, int) to anon, authenticated;
