# Yowflow — Frontend

**The operating system for photo & video studios.** Leads, projects, shoots, freelancers, invoices and client galleries in one workspace.

This repository is the Next.js (App Router) frontend. It talks to the Yowflow backend (`yowflow_backend`) over HTTP and proxies `/api/v1` through Next rewrites so auth cookies stay first-party.

| | |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 + design tokens (`src/app/globals.css`) |
| UI kit | `src/components/ui` (Radix primitives, CVA, motion) — see `/design-system` |
| Tests | Vitest (unit) · Playwright + axe (end-to-end, accessibility, responsive) |

## Quick start

```bash
cp .env.example .env     # set API_PROXY_TARGET to your backend origin
npm install
npm run dev              # http://localhost:3000
```

Run the backend first (`../yowflow_backend`, default `http://localhost:5050`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright suite on an isolated database (see below) |

## White-label

Every brand value lives in **[`src/config/brand.ts`](src/config/brand.ts)**: name, tagline, domain, support email/phone, cookie prefix, logo paths and colours. Override any of them with `NEXT_PUBLIC_BRAND_*` env vars. Marketing copy and pricing are in [`src/config/marketing.ts`](src/config/marketing.ts). Replace the files in `public/brand/` and `src/app/icon.png` to re-skin the logo.

Rules that keep re-skinning safe:

- Always reference `process.env.NEXT_PUBLIC_*` literally. Aliasing `process.env` breaks Next's build-time inlining and crashes the client bundle.
- `NEXT_PUBLIC_BRAND_COOKIE_PREFIX` must equal the backend's `BRAND_COOKIE_PREFIX` (default `yf`).

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `API_PROXY_TARGET` | **production** | Origin of the backend that `/api/v1/*` is proxied to. Production builds fail without it. |
| `NEXT_PUBLIC_API_URL` | | Browser API base. Keep `/api/v1` so cookies stay first-party. |
| `NEXT_PUBLIC_SITE_URL` | | Canonical site URL for metadata and the sitemap |
| `NEXT_PUBLIC_BRAND_*` | | Optional white-label overrides |

## Project layout

```text
src/
├── app/                  routes (public marketing, auth, workspace, /client portal, /freelancer portal)
├── components/ui/        design-system components
├── components/layout/    app shell: sidebar, top bar, command palette
├── features/             domain modules (leads, projects, shoots, finance, …)
├── config/               brand + marketing config
└── lib/                  API client, auth helpers, utilities
e2e/                      Playwright specs (marketing, auth, workspace, quality)
```

## End-to-end tests

`npm run e2e` starts an **isolated** stack — a throw-away local database (`yowflow_e2e`), the backend on `:5051` and a production build of this app on `:3002` — so it never touches your real data. It needs a local PostgreSQL and the backend dependencies installed. Set `E2E_FRESH=1` to force a clean database and rebuild.

See [`TEST_REPORT.md`](TEST_REPORT.md) for the last results.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md).


## Client portal

Couples sign in at `/client/login` (invite link from the studio → set password). Studios manage it from **Clients → Portal access** (the original gallery page stays under **Open Portal / Photos**):
invite, publish, per-section gates (visible / download / share / watermark), upload, and the couple's requests, notes and album picks.
Backend: `/api/v1/portal/*` (couple) and `/api/v1/projects/:id/gallery/*`, `/api/v1/clients/:id/portal-access` (studio). Portal sessions use their own httpOnly cookies and never grant staff access.
Thumbnails/previews are generated with `sharp` on upload (`GALLERY_DERIVATIVES=inline`); older uploads can be optimised from the studio panel.

## Freelancers

Each studio shares its own join link (**Freelancer Team → Applications → Copy link**, `/freelancer/join?studio=<slug>`).
Applicants are reviewed there; approved freelancers sign in at `/login`, keep their profile, availability and portfolio, and can buy a
listing plan (**Plan** page, Razorpay) to appear in that studio's freelancer search. Studios mark interest and the freelancer accepts or declines in **My vendors**.
A freelancer may work with several studios with the same phone/e-mail; the password selects the account.

Large films (over 50 MB, up to 5 GB) upload in parts and need S3-compatible storage (`STORAGE_PROVIDER=R2`, `STORAGE_REGION=auto`, and a bucket CORS rule that
allows `PUT` from your site and exposes the `ETag` header). See `docs/SECURITY_ROTATION.md` for the deployment settings checklist.
