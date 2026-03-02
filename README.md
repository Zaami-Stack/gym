# ESPACE FITNESS SM Website (Next.js + Supabase + Vercel)

Fullstack gym website with admin dashboard, using the same auth concept as `zaamiflower`:

- `ADMIN_EMAIL` + `ADMIN_PASSWORD` from env = admin account
- `Sign up` creates normal users in database (`customer`)
- Signed-in admin sees dashboard, non-admin users do not

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
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Example:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUTH_SECRET=replace-with-very-long-random-string
ADMIN_EMAIL=admin@yourgym.com
ADMIN_PASSWORD=StrongAdminPassword123!
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

- Admin account is **not** created in Supabase Auth.
- Admin credentials come from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- Customer accounts are created by `Sign up` and stored in `public.users`.
