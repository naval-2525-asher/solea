-- Run this once in your Supabase project's SQL editor
-- (Project → SQL Editor → New Query → paste → Run)
--
-- Adds a DB-backed admin_username column, mirroring admin_password, so the
-- same username/password combo works from any browser or device.

alter table public.admin_settings
  add column if not exists admin_username text not null default 'superadmin';

-- Make sure the existing settings row has a value (the DEFAULT above already
-- covers this for the column-add itself, but this is a harmless safety net).
update public.admin_settings
  set admin_username = 'superadmin'
  where id = 1 and admin_username is null;

-- admin_settings already has RLS policies + grants for select/update from the
-- earlier migration (see the create-table script you already ran), and those
-- apply to the whole row — including this new column — so no additional
-- policy or grant changes are needed.
