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

### Client portal (new, end to end)
- Couples get their own login (`/client/login`): invite e-mail → set password → private dashboard. Separate identity and cookies from staff; scoped to one client in one studio at the database-query level.
- Project overview (events, deliverables), payments (schedule, invoices, receipts), notifications, requests with studio replies, share links the couple can create and revoke.
- Gallery viewer: sections and folders, favourites, album picks with a studio-set target and "send selection", filters, keyboard lightbox with notes to the studio, gated downloads, infinite scroll over keyset-paginated media with generated thumbnails/previews.
- Studio side (Clients → *Client portal*): invite / resend / suspend / remove, publish + notify, per-section visible / download / share / watermark gates, upload, activity feed with replies and album-selection export.
- Galleries are now created as drafts; nothing reaches a client until the studio publishes.
- Replaced the localStorage-based prototype (`/client-gallery`).

### Fixed
- Intermittent "An unexpected database error occurred": pool exhaustion is now reported as a retryable 503 with `Retry-After`, reads retry automatically, connection-pool limits are configured, Vercel functions run in the database's region.
- Parallel first uploads into a new gallery section could fail with a unique-constraint error (serialised with an advisory lock).
- Production build proxied to the previous client's backend by default — now a required setting.
- Marketing routes shadowed the CRM `/clients` and `/freelancers` workspace routes.
- Client bundle crashed in production (`process is not defined`) — brand config now inlines correctly.
- Freelancer search ignored the paid-subscription eligibility rule (restored; two failing tests fixed).
- Removed mock freelancer/client-portal prototypes that stored a plaintext password in `localStorage`.
- Seed no longer creates a demo freelancer with a hard-coded weak password.

### Removed
- Placeholder `/client/*` pages, `/panel/*` and `/freelancers/*` mock flows, the old editorial landing stack and its CSS.
