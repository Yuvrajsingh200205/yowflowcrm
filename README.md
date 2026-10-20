# Yowflow — Frontend

Next.js (App Router) frontend for **Yowflow**, a studio-operations platform for photo and video studios: leads, projects, shoots, freelancers, invoices and client galleries in one workspace.

It talks to the Yowflow backend (`yowflow_backend`) over HTTP and proxies `/api/v1` through Next rewrites so auth cookies stay first-party.

## White-label

All branding lives in [`src/config/brand.ts`](src/config/brand.ts): name, tagline, domain, support email/phone, cookie prefix, logo paths and colors. Every value can also be overridden with a `NEXT_PUBLIC_BRAND_*` env var. `NEXT_PUBLIC_BRAND_COOKIE_PREFIX` must equal the backend's `BRAND_COOKIE_PREFIX`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm test` | Vitest unit tests |

## Environment

See [`.env.example`](.env.example).
