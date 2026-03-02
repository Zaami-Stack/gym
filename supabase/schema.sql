-- Run this script in Supabase SQL Editor.
-- Auth concept:
-- - Admin account comes from env vars: ADMIN_EMAIL + ADMIN_PASSWORD
-- - Customers use signup/login with email + password stored in public.users
-- - Role checks happen in server API routes (cookie session), similar to zaamiflower concept

create extension if not exists pgcrypto;

-- Cleanup from older auth models if they exist.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop function after removing dependencies (CASCADE as fallback for any old unknown objects).
drop function if exists public.is_admin() cascade;

drop table if exists public.profiles;
drop table if exists public.admin_emails;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique check (email = lower(email)),
  phone text not null default '',
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer')),
  created_at timestamptz not null default now()
);

-- Migration-safe for existing projects.
alter table public.users
add column if not exists phone text not null default '';

create table if not exists public.site_settings (
  id int primary key,
  hero_title text not null,
  hero_subtitle text not null,
  hero_image_url text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text not null default '',
  display_order int not null default 1,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.gallery_images enable row level security;

-- Users table is API-only (service role). No public policies.
drop policy if exists "No public user access" on public.users;
create policy "No public user access"
on public.users
for select
to public
using (false);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to public
using (true);

drop policy if exists "Public can read active notifications" on public.notifications;
create policy "Public can read active notifications"
on public.notifications
for select
to public
using (is_active = true);

drop policy if exists "Public can read gallery images" on public.gallery_images;
create policy "Public can read gallery images"
on public.gallery_images
for select
to public
using (true);

insert into public.site_settings (id, hero_title, hero_subtitle, hero_image_url)
values (
  1,
  'Build Power. Move Better. Stay Consistent.',
  'Train with elite coaches, premium equipment, and a results-first program built for real progress.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80'
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view media files" on storage.objects;
create policy "Public can view media files"
on storage.objects
for select
to public
using (bucket_id = 'media');
