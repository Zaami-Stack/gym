-- Run this script in Supabase SQL Editor.
-- Admin access is based on Auth email/password + email allowlist in public.admin_emails.

create extension if not exists pgcrypto;

-- Cleanup from previous role-based setup, safe for reruns.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;

create table if not exists public.admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

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

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admin_emails enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.gallery_images enable row level security;

drop policy if exists "Authenticated users can check own admin email" on public.admin_emails;
create policy "Authenticated users can check own admin email"
on public.admin_emails
for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to public
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read notifications" on public.notifications;
create policy "Public can read notifications"
on public.notifications
for select
to public
using (is_active = true);

drop policy if exists "Admins can manage notifications" on public.notifications;
create policy "Admins can manage notifications"
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read gallery images" on public.gallery_images;
create policy "Public can read gallery images"
on public.gallery_images
for select
to public
using (true);

drop policy if exists "Admins can manage gallery images" on public.gallery_images;
create policy "Admins can manage gallery images"
on public.gallery_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "Admins can upload media files" on storage.objects;
create policy "Admins can upload media files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can update media files" on storage.objects;
create policy "Admins can update media files"
on storage.objects
for update
to authenticated
using (bucket_id = 'media' and public.is_admin())
with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can delete media files" on storage.objects;
create policy "Admins can delete media files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'media' and public.is_admin());

-- Add one or more admin emails (must be lowercase and match Auth user email).
-- Example:
-- insert into public.admin_emails(email) values ('admin@example.com') on conflict do nothing;
