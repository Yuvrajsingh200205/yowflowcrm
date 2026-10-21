# Changelog

## 2.0.0 — Yowflow rebrand and redesign

### Brand
- New product identity: **Yowflow** (owner-supplied logo), ink + lime theme, Space Grotesk / Inter / JetBrains Mono.
- Single white-label config (`src/config/brand.ts`, backend `BRAND_*`); cookie prefix `yf`.
- Removed every trace of the previous client (names, domains, phone/email, images, demo content).

### Design system
- Tokens (light and dark), motion, elevation; 25+ accessible components; `/design-system` page.
- Legacy palette migrated by codemod (`scripts/codemod_*.py`).

### Product
- New app shell (sidebar, top bar, ⌘K command palette, notifications), rebuilt dashboard with charts and onboarding.
- Settings rebuilt: profile, workspace, team, billing (Razorpay test mode), notifications, security, API keys, access.
- Auth: new login, self-serve signup, forgot/reset password, email verification (+ in-app banner).
- Marketing site: home, features, pricing (monthly/yearly), about, contact (working form), changelog, legal, 404, for-freelancers; SEO (sitemap, robots, OG, JSON-LD).
- Freelancer portal shell and login redesigned.

### Backend
- Self-serve tenant provisioning, email tokens, password reset, public contact endpoint.
- API keys (hashed, read-only/full, revocable, audited) and billing endpoints with signature-verified payments.
- Dashboard trends endpoint; workspace members endpoint; `emailVerified` on `/auth/me`.

### Fixed
- Production build proxied to the previous client's backend by default — now a required setting.
- Marketing routes shadowed the CRM `/clients` and `/freelancers` workspace routes.
- Client bundle crashed in production (`process is not defined`) — brand config now inlines correctly.
- Freelancer search ignored the paid-subscription eligibility rule (restored; two failing tests fixed).
- Removed mock freelancer/client-portal prototypes that stored a plaintext password in `localStorage`.
- Seed no longer creates a demo freelancer with a hard-coded weak password.

### Removed
- Placeholder `/client/*` pages, `/panel/*` and `/freelancers/*` mock flows, the old editorial landing stack and its CSS.
