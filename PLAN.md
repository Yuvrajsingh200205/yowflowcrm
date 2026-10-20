# Rebrand & Redesign Plan (white-label SaaS)

Branch: `rebrand/v2` (frontend) — backend gets a matching `rebrand/v2` branch.
Legend: [x] done · [~] in progress · [ ] todo

## Phase 0 — Audit  [x]

### Stack
- **Frontend**: Next.js 16 (App Router, webpack build), React 19, Tailwind 4, `motion`, zod 4, lucide-react, jspdf, qrcode. Vitest (7 files / 57 tests, all green). `tsc --noEmit` clean. `npm audit`: 0 vulns.
- **Backend**: Express + Prisma 6 + PostgreSQL (Neon), zod, helmet, express-rate-limit, pino, JWT in HttpOnly cookies, pdfkit, swagger-ui. 84 models, 33 migrations, 16 test files, ~21k LOC. `tsc --noEmit` clean.
- **Hosting**: Vercel (both). Frontend proxies `/api/v1` to backend (first-party cookies).

### Surface area
- ~50 pages: public (home, features, pricing, contact, studios, clients, freelancers, services/[slug], privacy, terms), auth (admin login, client login, freelancer login/join/onboarding), admin/owner workspace (`/[workspace]`, `/admin`), `/panel/*`, `/projects/*`, `/shoots/schedule`, `/expenses/new`, `/payments/new`, client portal (`/client/*`, `/client-gallery/*`, `/share/[token]`), freelancer portal (`/freelancer/*` x14).
- Domain: photography-studio CRM — leads (Meta Lead Ads), clients, projects, events/shoots, freelancers (marketplace + subscriptions), tasks, deliveries/galleries, quotations/invoices/payments, expenses, HR (attendance, leave, salary), notifications, audit log, client portal.

### Findings
**Brand / white-label (blocker for resale)**
- 56 frontend files + 13 backend files reference "Wedding Photo Planet" / `weddingphotoplanet(.com|crm.com)`.
- Hardcoded real contact info: `hello@weddingphotoplanet.com`, a real phone number in `InvoiceModal.tsx`, domain list in `RoleDashboards.tsx` (`standardDomains`).
- Cookie/storage keys are branded: `wpp_access_token`, `wpp_refresh_token`, `wpp_client_session`, `wpp_freelancer_session`, `wpp_owner_lead_targets`, `wpp_web_domains_v`, `wpp_web_calendar_posts_v`, `wpp_txn_`.
- `layout.tsx` metadataBase falls back to weddingphotoplanet.com; docs reference weddingphotoplanetcrm.com webhook URL.
- Images in `public/images` are the previous client's (wedding-band, wedding-login-hero, wedding-portrait, wpp-landing-hero-cinematic).
- Seed: org "Wedding Photo Planet", admin `admin@gmail.com`, demo client/project.
- Default `PUBLIC_FREELANCER_INTAKE_ORGANIZATION_ID` is a real org UUID in local `.env`.

**Code health**
- God-components: `RoleDashboards.tsx` 6.4k LOC, `ProjectDetailModal.tsx` 4.4k, `SocialMediaCalendarWidget.tsx` 3.7k, `ShootAssignmentsView.tsx` 2.2k, `MemberDashboardModal.tsx` 1.7k, `CrmApplication.tsx` 1.5k. Must be split during redesign.
- 95 TODO/FIXME/HACK markers in backend `src`.
- Some CRM state (lead targets, social calendar, domains) lives in `localStorage` — not synced, lost per device, not multi-tenant safe. Needs to move server-side or be removed.
- Frontend has no component tests, no e2e (Playwright) tests. Backend integration tests need a local Postgres.

**Security**
- Backend `npm audit`: 3 high (deepmerge-ts via prisma/@prisma/config — dev tooling path; fix via prisma bump).
- No tracked `.env`; no secrets found in git history (checked key patterns, `DATABASE_URL`, private keys). Only AWS docs example key in a unit test.
- **Rotate** (they existed in local/previous deployments): old Neon DB credentials (us-east-2), JWT/refresh secrets, Meta app secret + page token + webhook verify token, any Vercel env of the old project.
- Auth rules to preserve (owner constraints): HttpOnly cookie tokens only, never public `/auth/me`, no wildcard CORS with credentials, freelancer auth stays separate from admin auth.

**Product gaps vs "sellable SaaS"**
- Single-tenant feel: org slug exists in schema, but branding/domains are hardcoded.
- No self-serve signup/billing for the studio (only freelancer subscription plans); no email verification/forgot-password flow confirmed for admin users; no API keys, no command palette, no onboarding flow, no changelog/blog.
- No Lighthouse/a11y/SEO baseline (no sitemap/robots/OG assets confirmed).

### Decisions (made, not asked)
1. **Positioning**: multi-tenant studio-ops SaaS for photo/video studios (wedding, events, commercial). Keep all existing features.
2. **Direction**: refined *light-first* premium UI with a true dark mode (Linear/Stripe feel): warm-neutral canvas, one deep accent, glass only on floating layers.
3. **Delivery**: incremental on `rebrand/v2`; `main` and the deployed app stay untouched until each phase is green.
4. **Auth cookies**: rename via brand config, changed in frontend + backend together and re-verified with the login → /me → refresh → logout flow.

## Phase 1 — White-label cleanup  [x]
- [x] `src/config/brand.ts` (FE) + `src/config/brand.ts` + `BRAND_*` env (BE): name, tagline, support email, domain, cookie prefix
- [x] Replace all hardcoded brand strings/emails/phones/domains with config (codemod: `scripts/codemod_brand.py`)
- [x] Previous-client images removed; neutral SVG art. [x] Owner/other-client names scrubbed from demo data (full demo-data rewrite → Phase 6)
- [x] Neutral seed org + `.env.example` (BRAND_*). [ ] Realistic fake dataset → Phase 6
- [x] Docs (webhook URL etc.) use placeholders
- [ ] Rotation checklist in `docs/SECURITY_ROTATION.md`
## Phase 2 — Brand identity  [~]
- [x] Name **Frameloom**, tagline, value prop, SVG mark + wordmark, favicon (`app/icon.svg`)
- [ ] OG image (PNG) → Phase 5; trademark/domain check on "Frameloom" is on the owner
## Phase 3 — Design system  [ ]
- [ ] Tokens (color light/dark, type, space, radius, shadow, motion)
- [ ] Components with all states + `/design-system` docs page
- [ ] Shell: app layout, sidebar, topbar, Cmd+K
## Phase 4 — Pages  [ ]
- [ ] A. Marketing (landing, pricing, features, about, contact, privacy, terms, 404)
- [ ] B. Auth (login, signup, forgot/reset, verify email)
- [ ] C. App: onboarding, dashboard, settings (profile/billing/team/notifications/API keys), notifications, all existing CRM pages rebuilt and split
- [ ] C2. Client portal + freelancer portal
- [ ] D. Admin panel
## Phase 5 — Quality bar  [ ]
- [ ] Responsive, a11y AA, Lighthouse 90+, SEO (meta, OG, sitemap, robots, JSON-LD)
## Phase 6 — Backend  [ ]
- [ ] Audit fixes, prisma bump, TODO triage, forgot/verify email, API keys, billing (test mode)
## Phase 7 — Testing  [ ]
- [ ] Unit, API, Playwright e2e, screenshots 375/768/1440, lint/type/build/Lighthouse, `TEST_REPORT.md`
## Phase 8 — Docs & handover  [ ]
- [ ] README, DEPLOYMENT, demo account, feature list, CHANGELOG
