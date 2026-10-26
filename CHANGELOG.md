# Changelog

## 2.2.1 — Creating a project is all or nothing

- **Fixed:** when saving a new project failed (for example the advance was rejected) and the studio fixed the problem and saved again, the project from the failed try was already there, so there were two. A new project, its client, shoots, tasks and its advance payment are now saved in one step on the server: if anything is wrong, nothing is saved.
- **Fixed:** the form no longer deletes a half-saved project when something fails (that permanent delete could leave a payment behind and left the project showing in the list).
- A save that timed out after the server had already saved the project is recognised when you press Save again: you get that project back instead of a second one.
- If only the client files fail to upload, the project stays saved and pressing Save again uploads just the files. The message says so.

## 2.2.0 — Ready-made templates and Quick quote

- **Ready-made library** (Sales setup → Packages & pricing → *Add ready-made packages*): 28 packages across weddings, pre-wedding, engagement and roka, haldi and mehendi, sangeet and reception, birthdays and kids, baby and family, anniversaries, corporate events and product shoots, plus 12 add-ons. Tick what you offer; prices are examples until you change them or confirm them.
- **Every new studio starts with the everyday set already in its price list**, so the first quote needs no setup. Existing studios add it with one tap.
- **Example prices are flagged** (badge on the item, banner on the list, warning on the booking page and on a freshly made quote) until the studio edits the item or presses *These are my prices*.
- **Quick quote** replaces the old "New quote" form: three short steps (who, which package, optional details), then *Send on WhatsApp*, *Copy link* or *Download PDF*. Makes the lead too, reuses an open lead with the same mobile number and date, and accepts a hand-typed price when no package fits. Works for non-technical users: one question at a time, big buttons, plain words, picture icons for each occasion.
- **Get-ready checklist** on Quotes and Sales setup: add packages, put your own prices, add phone and UPI, switch on the booking page. It disappears once done.
- *Copy* on any package to make a variation.

## 2.1.0 — Quote in seconds

### Product
- **Sales setup** (new): price list of packages and add-ons (fixed, per day or per guest pricing, GST, optional quantities, starter set), booking page settings with link and QR code, availability (capacity per day, notice, booking window, closed dates, calendar), business and payment details (UPI, bank, GSTIN, terms, brand colour), reminders.
- **Booking page** `/enquire/<studio>`: customers pick a date from a live availability calendar, a package and extras, see an estimate, and submit. The studio chooses *instant quote*, *draft for approval* or *enquiry only*. Bot trap, per-IP rate limit, lead de-duplication by phone and date.
- **Customer quote page** `/quote/<token>`: studio-branded, extras switch on and off with server-side re-pricing, accept with a typed name (recorded with time and device), decline, ask a question, PDF, and payment details (UPI link, QR code, bank) once accepted.
- **Quotes** (new): Today list (needs review, not opened, opened not accepted, expiring, payments to collect, follow-ups) with WhatsApp links; all quotes with search and filters; quote detail with activity timeline; builder with live totals and payment plan; send by email, WhatsApp or link; preview as the customer; PDF; book now with an availability guard and administrator override; invoice panel with PDF and "mark as issued".
- **Leads**: each lead row shows its latest quote or a *Create quote* button, replacing the old attach-a-file flow that was never connected.
- New project form warns when a function date is already full or closed.
- Notifications open the quote, lead or project they are about.
- Roles screen lists the new permission groups (Packages & pricing, Booking setup).

### Fixed
- Status text colours (success, warning) now meet WCAG AA contrast on their tinted backgrounds.

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

### Freelancer product
- Studios share a **join link** (`/freelancer/join?studio=<slug>`); applications are filed under the right studio instead of the first one in the database.
- Studio-side **Applications** review is now wired to real data (start review, approve, reject with a reason); previously real applications never appeared.
- Freelancers can **buy a listing plan** (Razorpay test/live, signature-verified, free plans supported, switching plans retires the old one, cancel anytime). Approved + subscribed freelancers appear in the studio's freelancer search.
- **Portfolio uploads** with real photo/film files and thumbnails (no more typing a file id); profile fields save independently (headline, bio, portfolio links no longer overwrite each other), rate/role/equipment are editable.
- One person can work with several studios: sign-in picks the account by password instead of failing with "provide organizationSlug".
- Large films: **multipart upload up to 5 GB** with progress and per-part retry (S3-compatible storage).
- Readable messages when payments are not configured (503 "not enabled") instead of a generic error.

### Sign-in and sign-out
- Fixed: the sidebar account menu's **Log out** appeared to do nothing once the 15-minute access token had expired (logout needed a valid access token, so cookies stayed and `/login` bounced straight back into the app). Logout now works from the refresh cookie alone for staff, freelancers and the client portal.
- Signed-in visitors get "continue or sign out" on `/login` and `/signup`, and "Open dashboard / Sign out" in the landing-page header.

### Security and quality
- Upgraded Next.js to 16.4.2 and dompurify (critical advisories); frontend `npm audit` is clean.
- Test runs can no longer send real e-mail or touch payment accounts, whatever is in the developer's `.env`.
- Auth and client-portal sign-in pages show their heading in the first HTML (mobile Lighthouse 90–94).
- `docs/SECURITY_ROTATION.md` added.

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
