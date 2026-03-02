-- Run this script in Supabase SQL Editor.
-- It creates tables, RLS policies, admin role checks, and storage setup.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
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
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.gallery_images enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

-- After creating your admin user in Auth:
-- update public.profiles set role = 'admin' where id = 'USER_UUID_HERE';
