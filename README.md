# ESPACE FITNESS SM Website (Next.js + Supabase + Vercel)

Fullstack gym website with admin dashboard, using the same auth concept as `zaamiflower`:

- `Sign up` creates users in database (`customer` by default)
- Any user with role `admin` can access the dashboard
- Signed-in non-admin users cannot access `/admin`

## Features

- Public website:
  - Dynamic hero title/subtitle/image
  - Dynamic gallery
  - Dynamic notification bar
- Auth:
  - `Sign in` and `Sign up` (email + password only)
  - Cookie session auth (`/api/auth/*`)
- Admin dashboard (admin role only):
  - Update hero content
  - Add/toggle/delete notifications
  - Add/delete/reorder gallery images

## 1) Supabase Setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in SQL Editor.
3. In Supabase `Project Settings -> API`, copy:
   - `Project URL`
   - `service_role` key

## 2) Environment Variables

Create `.env.local` from `.env.example`.

Required vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET` (strong random string, 24+ chars)

Example:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUTH_SECRET=replace-with-very-long-random-string
```

## 3) Run Locally

```bash
npm install
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Auth page: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin`

## 4) Deploy to Vercel

1. Push to GitHub.
2. Import repo in Vercel.
3. Add the same env vars in Vercel project settings.
4. Deploy.

## Auth Notes

- Accounts are stored in `public.users` (not Supabase Auth).
- `Sign up` always creates `role = 'customer'`.
- Admin access is controlled by `users.role = 'admin'`.

## Add Admin Account

1. Sign up normally from `/admin/login` (creates a customer user).
2. In Supabase SQL Editor, run:

```sql
update public.users
set role = 'admin'
where email = lower('admin@example.com');
```

Replace `admin@example.com` with the real user email.
