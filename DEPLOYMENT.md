# Deployment

Yowflow is two deployables: this Next.js frontend and the Express/Prisma backend (`yowflow_backend`). Both run happily on Vercel; the backend also runs on any Node 20+ host (Railway, Render, Docker).

## 1. Database (Neon / any PostgreSQL 14+)

1. Create a Postgres project (Neon recommended). Copy the **pooled** connection string for the app and the **direct** one for migrations.
2. From `yowflow_backend`: `DATABASE_URL=<direct url> npx prisma migrate deploy`
3. Seed permissions and roles: `DATABASE_URL=<direct url> npm run seed` (set `SEED_DEMO_DATA=false` in production).

## 2. Backend (Vercel project, root `yowflow_backend`)

Set these environment variables (Production):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Pooled URL, add `&pgbouncer=true` for Prisma on Neon |
| `JWT_SECRET`, `REFRESH_TOKEN_SECRET` | `openssl rand -base64 48`, distinct, 32+ chars |
| `COOKIE_SECURE` | `true` |
| `CORS_ORIGIN` | Your frontend origin(s), comma-separated. No wildcards |
| `APP_URL` | Frontend origin; used in verification/reset e-mails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Required in production — mail never silently drops |
| `STORAGE_PROVIDER` | `DATABASE`, `S3`, `R2` or `SUPABASE` (`LOCAL` is rejected in production) |
| `STORAGE_PUBLIC_BASE_URL` | Public backend URL when `STORAGE_PROVIDER=DATABASE` |
| `BRAND_NAME`, `BRAND_COOKIE_PREFIX`, `BRAND_SUPPORT_EMAIL` | White-label identity |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Optional. `rzp_test_…` keys enable billing in test mode |
| `META_*` | Optional, for Meta Lead Ads |
| `CRON_SECRET` | Required for reminders. `openssl rand -hex 32`. Vercel Cron (scheduled in the backend's `vercel.json`) sends it as a bearer token |

Never commit `.env`. Rotate the secrets listed in `yowflow_backend/docs/SECURITY_ROTATION.md` for every new customer deployment.

## 3. Frontend (Vercel project, root `yowflow_frontend`)

| Variable | Value |
|---|---|
| `API_PROXY_TARGET` | The backend origin, e.g. `https://api.yourdomain.com` (**required** — the build fails without it) |
| `NEXT_PUBLIC_API_URL` | `/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_BRAND_COOKIE_PREFIX` | Must equal the backend's `BRAND_COOKIE_PREFIX` |

Then add your domain in Vercel and set `CORS_ORIGIN` / `APP_URL` on the backend to it.

## 4. Docker (backend)

```bash
docker build -t yowflow-backend ./yowflow_backend   # add a Dockerfile if your host needs one
docker run -p 5000:5000 --env-file .env yowflow-backend
```

## 5. After first deploy

1. Sign in with `SEED_ADMIN_EMAIL`, change the password, or send customers to `/signup` for self-serve workspaces.
2. Verify `/sitemap.xml`, `/robots.txt` and the OG image on your domain.
3. In Razorpay's dashboard (test mode) run a test payment from **Settings → Billing**.
4. Run `npm run e2e` against a staging database before promoting a release.
5. **Sales setup** (sidebar → Sales → Sales setup): add your packages, switch on the booking page, then open `/enquire/<your-studio-slug>` in a private window and make a test enquiry. Customers never need an account for `/enquire/…` or `/quote/…`.

## Demo account

Seed a demo workspace locally with `SEED_DEMO_DATA=true npm run seed` (backend): you get an Admin, Manager and Photo Editor account (password = `SEED_ADMIN_PASSWORD`) and sample projects. **Never enable demo data in production.**
