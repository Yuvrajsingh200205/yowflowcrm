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
- [x] Rotation checklist in `docs/SECURITY_ROTATION.md`
## Phase 2 — Brand identity  [x]
- [x] Name **Yowflow**, tagline, value prop, SVG mark + wordmark, favicon (`app/icon.svg`)
- [ ] OG image (PNG) → Phase 5; trademark/domain check on "Yowflow" is on the owner
## Phase 3 — Design system  [x]
- [x] Tokens (light + dark, semantic), type, radius, elevation, motion, z-index
- [x] 25+ components with hover/focus/active/disabled/loading/error states; `/design-system`
- [x] App shell: sidebar, top bar, notifications, ⌘K command palette, verify-email banner

## Phase 4 — Pages  [~]
- [x] A. Marketing: home (all 13 sections), features, pricing (+ comparison), about, contact (working), changelog, privacy, terms, 404, for-freelancers
- [x] B. Auth: login, signup, forgot/reset password, verify email (+ freelancer login)
- [x] C. App: dashboard (KPIs, charts, onboarding checklist), settings (profile, workspace, team, billing, notifications, security, API keys, access), notifications centre, ⌘K
- [~] C2. Existing CRM screens (leads, projects, shoots, finance, team, …) are re-themed and a11y-clean but not restructured; the six god-components (RoleDashboards 6.4k LOC, ProjectDetailModal, …) still need splitting
- [~] C3. Freelancer portal: shell + login rebuilt; inner pages re-themed only
- [x] Placeholder client-portal pages removed; clients use share links (`/share/[token]`) and the staff-facing gallery screens
- [ ] D. Separate admin panel: the project has none (the owner workspace is the admin surface)

## Phase 5 — Quality bar  [x]
- [x] Responsive 375/768/1440 (no overflow on 15 pages), axe AA clean, Lighthouse desktop 100 / mobile 82–93, SEO (sitemap, robots, OG, JSON-LD)

## Phase 6 — Backend  [x]
- [x] Audit fixes (see TEST_REPORT.md), signup/verify/reset, contact, API keys, billing (Razorpay test mode), dashboard trends, workspace members, neutral seed
- [ ] Triage the ~95 TODO/FIXME markers; bump Prisma to clear the 3 npm-audit highs (dev-tooling path)

## Phase 7 — Testing  [x]
- [x] Unit, API (backend), Playwright E2E (70), axe, responsive screenshots, Lighthouse → `TEST_REPORT.md`

## Phase 8 — Docs & handover  [x]
- [x] README, DEPLOYMENT, CHANGELOG, SECURITY_ROTATION, demo-account notes

## Owner decisions (21 Oct)
- Product name is **Yowflow**; logo supplied (`public/brand`, `src/app/icon.png`). Cookie prefix `yf`.
- Previous deep-green/gold theme rejected → ink + lime, matching the logo. Dark is the signature marketing look; the CRM shell stays light until legacy screens are dark-ready.
- Work continues autonomously through all phases; no per-step permission prompts.

## Phase 7 — Quote in seconds  [x]
Goal: a customer fills in their event and sees a priced quotation within seconds; the studio sees who opened it, and acceptance books the date.
- [x] Price list (packages, add-ons, GST, per-day / per-guest pricing, starter set), booking page + QR, availability (capacity, notice, window, closed dates, double-booking guard), business and payment details, reminders: *Sales setup*
- [x] Public booking page `/enquire/<studio>` (instant quote, approval, or enquiry only) and customer quote page `/quote/<token>` (extras, accept, decline, ask, PDF, payment details after acceptance)
- [x] Quotes screen: Today list with WhatsApp links, search/filter, detail with timeline, builder, send (email / WhatsApp / link), preview, PDF, book now with override, invoice panel (PDF, mark as issued)
- [x] Leads rows create and show quotes; notifications open the quote; project form warns on a full or closed date
- [x] Daily reminder job (Vercel Cron, `CRON_SECRET`), quote and invoice PDFs with GST, bank details and UPI QR
- [x] Tests: backend 37 new integration tests, frontend unit tests, Playwright `e2e/sales.spec.ts` (setup → instant quote → accept → booking, approval flow, builder, axe, 375px)

### Not built yet (deliberately), in rough order of value
1. **Online advance payment on the quote** (Razorpay order + auto-marking the payment milestone paid). Today the customer sees UPI link/QR/bank and the studio confirms receipt. Needs each studio's own gateway account.
2. **Official WhatsApp Business API** (automatic sending and replies). Needs Meta business verification and approved templates; today the app opens `wa.me` with the message written.
3. **Indian GST detail**: CGST + SGST vs IGST split by state, HSN/SAC codes, GSTR-ready exports. Today a line carries one GST rate and the PDF shows the combined GST.
4. **Reports and exports**: quote funnel (sent → opened → accepted), conversion by source, revenue forecast, CSV/Excel.
5. **Studio public website** (portfolio, package pages, SEO). `/enquire/<studio>` is client-rendered and set to noindex until it is server-rendered.
6. **Quote options and versions**: Good / Better / Best on one quote, edit history, discount approval.
7. **E-sign contracts** (legally valid e-signature, contract templates). Today acceptance is a typed name with time and device recorded.
8. **Google Calendar / ICS sync** for shoots and for the customer ("add to calendar").
9. **More lead sources and routing**: Instagram / Facebook DMs, portals, round-robin assignment, lead scoring.
10. **Telephony**: click-to-call, call logging, missed-call lead capture.
11. **AI quote builder** (suggest a package from the enquiry and budget).
12. **Availability by crew**, not just a per-day capacity; hard block (not just a warning) when staff create a project on a full date.
13. **CSV import** of leads and clients; reviews and testimonials; couple questionnaires and itinerary builder.
14. **PWA / push notifications**, SMS (DLT-registered), customised email templates.
15. **Supplier directory** (venues, decorators) alongside the freelancer network.

