# Test report — Yowflow 2.0

Last run: 21 Oct 2026, macOS, Node 25, Chromium (Playwright 1.x), isolated local PostgreSQL.

## Summary

| Layer | Tool | Result |
|---|---|---|
| Backend integration + unit | Vitest + Supertest, real PostgreSQL | **300 / 300** (24 files) — includes signup, email verification, password reset, contact form, API keys, billing, dashboard trends, workspace members, **client-portal auth (12) and data API (12: tenant isolation, hidden-section leakage, download gating, album cap, keyset pagination, thumbnails from real JPEGs, comments/requests/share links/notifications, parallel-upload race)**, error mapping and query budgets |
| Frontend unit | Vitest | **56 / 56** |
| End-to-end | Playwright | **77** (70 + 7 client-portal and shared-link) |
| Accessibility | axe-core (WCAG 2.0/2.1 A + AA), 11 public + 4 app pages | **0 serious/critical violations** |
| Responsive | Playwright at 375 / 768 / 1440, 11 public + 4 app pages | **no horizontal overflow**, screenshots reviewed |
| Type-check | `tsc --noEmit` (both repos) | clean |
| Lint | ESLint (backend) | clean (0 warnings) |
| Lighthouse | v12, production build | see below |

## What the E2E suite covers (75 tests)

- **Client portal (5):** studio invites the couple from the UI, hides a section, enables downloads, publishes → the couple accepts the e-mailed link in a fresh browser, sets a password, sees the project / payments / gallery (hidden section absent), favourites and fills the album to its cap, sends the selection, uses the keyboard lightbox, sends a note, files a request, creates a share link → the studio sees all of it and replies → the couple sees the reply and notification, signs out and is bounced to login; wrong-password and staff-cookie-cannot-enter checks; invalid invite link; **axe + no sideways scroll at 375px on 7 portal screens and 2 auth screens**; **130-photo gallery pages in 48 at a time with no duplicates, lazy-loaded, thumbnails < 60 kB**.

- **Marketing (10):** home content and console errors, every nav link, pricing monthly/yearly toggle and plan → signup deep link, FAQ keyboard accordion, contact form validation and delivery, legal/about/changelog, branded 404 with a real 404 status, sitemap/robots/JSON-LD/OG tags, mobile menu.
- **Authentication and account lifecycle (10):** protected-route redirect with `returnTo`, wrong password, empty submit and password reveal, session survives reload then logout, self-serve signup with verify banner and onboarding, email verification link, duplicate signup, forgot → reset → sign in (single-use link), no account enumeration, bad/missing tokens.
- **Workspace (14):** all 12 sidebar destinations load with no runtime errors, ⌘K palette (search, run, arrow keys, empty state, Esc), dashboard KPI/quick actions/charts with table view and keyboard-reachable points, theme isolation (app light, sidebar dark), notifications popover, account menu, mobile drawer without overflow.
- **Settings (5):** profile save, team list, billing plans/test-mode messaging, API-key create → shown once → listed (prefix only) → revoke, password policy.
- **CRM flows (7):** create a lead through the UI (validation, save, filters, analytics), cancel modal, projects filters, open a project, new-project page, shoots/finance/team/freelancers/clients/equipment/data/roles views error-free, API docs reachable.
- **Quality gates (30):** axe on 15 pages; screenshots + overflow check on 15 pages × 3 widths.

The suite runs against a throw-away database (`yowflow_e2e`), a backend on :5051 and a production build on :3002, so it never touches real data. Dev e-mail is captured from the backend log to exercise verification and reset links.

## Lighthouse (production build, Lighthouse 12, simulated throttling)

| Page | Mobile P / A / BP / SEO | Desktop P / A / BP / SEO |
|---|---|---|
| `/` | 87 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/features` | 93 / 99 / 100 / 100 | 100 / 99 / 100 / 100 |
| `/pricing` | 92 / 98* / 100 / 100 | 100 / 98* / 100 / 100 |
| `/contact` | 93 / 99 / 100 / 100 | 100 / 99 / 100 / 100 |
| `/about` | 91 / 99 / 100 / 100 | 100 / 99 / 100 / 100 |
| `/login` | 86 / 100 / 100 / 100 | — |
| `/signup` | 82 / 100 / 100 / 100 | — |

\* the two remaining accessibility notes (logo `alt` duplicating adjacent text, heading order on `/pricing`) were fixed after this run.

Performance work that moved the numbers: hero content no longer hidden until hydration (was +2.5 s LCP), scroll-reveal rewritten without an animation library, font preloads trimmed (`optional` display for the display face, mono face not preloaded), rupee amounts set in the system font to avoid a large latin-ext download, and the heavy workspace bundle is now warmed on idle instead of on the login screen's critical path.

Mobile home (87) and the auth pages (82–86) are slightly under the 90 target in the simulated 4×CPU / slow-4G profile; desktop is 100 everywhere. Remaining cost is shared client JS (React, Radix, the auth provider); route-level splitting of the auth provider is the next lever.

## Defects found and fixed during testing

| Found by | Defect | Fix |
|---|---|---|
| E2E (prod build) | Client crash: `process is not defined` — brand config aliased `process.env` | literal `process.env.NEXT_PUBLIC_*` references |
| Audit | Production proxy defaulted to the previous client's backend | removed; `API_PROXY_TARGET` required |
| Audit | Marketing routes shadowed CRM `/clients` and `/freelancers` | marketing moved/removed; route-protection tests added |
| E2E | Unknown URLs bounced to the login page (HTTP 200) | proxy lets unknown paths 404 |
| E2E | Logout left the URL on `/dashboard` | navigates to `/login` |
| E2E console check | Invalid `pattern` regexes on phone inputs (browser `v` flag) | escaped character classes |
| axe | Unlabelled selects/inputs/icon buttons, `<ol>` with non-`li` children, label-in-name mismatch, duplicate logo alt, heading order | labels / semantics fixed |
| Backend tests | Freelancer search ignored the subscription rule (2 failing tests) | rule restored |
| Backend tests | Signup violated the `EMP-S##` employee-code constraint | corrected |
| Review | Mock freelancer flow stored a plaintext password in `localStorage` | module removed |
| Review | Seed created a demo freelancer with password `1234` | now demo-only, uses `SEED_ADMIN_PASSWORD` |

## Not covered / known gaps

- **Payments:** Razorpay checkout is verified at the API level (order creation, amount in paise, signature verification, replay protection) with a mocked gateway; the hosted payment window itself needs real `rzp_test_` keys to try by hand.
- **E-mail:** delivery is verified through the dev transport; point `SMTP_*` at a real server before launch.
- **Legacy CRM screens** (leads, projects, shoots, finance, team, …) are re-themed and keyboard/axe-clean on the pages tested, but their internals are still the original large components; deeper restructuring is listed in `PLAN.md`.
- **Dark mode** is available on marketing, auth and the design system; the CRM shell is intentionally light until those legacy screens are migrated.
- **Testimonials and pricing** on the marketing site are placeholders to be replaced with real quotes and final prices (`src/config/marketing.ts`).
