# Iron Temple Gym Website (Next.js + Supabase + Vercel)

Fullstack gym website with an admin dashboard.

## Features

- Public gym website with:
  - Dynamic hero title/subtitle/image
  - Dynamic gallery section
  - Dynamic top notifications bar
- Admin dashboard with email/password login:
  - Update hero content and hero image
  - Add/enable/disable/delete notifications
  - Add/delete/reorder gallery images
- Role-based access (`admin` vs `member`) using Supabase Auth + RLS policies
- Supabase Storage uploads for hero/gallery images (bucket: `media`)

## Tech

- Next.js App Router (TypeScript, Tailwind CSS)
- Supabase (Auth, Postgres, RLS, Storage)
- Vercel deployment

## 1) Create Supabase Project (Free Plan)

1. Create a new Supabase project.
2. In `SQL Editor`, run [`supabase/schema.sql`](./supabase/schema.sql).
3. In `Authentication > Users`, create a user for admin login (email + password).
4. In `SQL Editor`, set that user as admin:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

You can copy the UUID from `Authentication > Users`.

## 2) Configure Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both values are in `Supabase > Project Settings > API`.

## 3) Run Locally

```bash
npm install
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## 4) Deploy to Vercel

1. Push this repo to GitHub.
2. Import project into Vercel.
3. Add the same env vars in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

Your dashboard and public site will use Supabase data on Vercel.

## Notes

- The admin dashboard relies on Supabase RLS policies from `supabase/schema.sql`.
- Public visitors can only read published content.
- Only users with `profiles.role = 'admin'` can update site content.
