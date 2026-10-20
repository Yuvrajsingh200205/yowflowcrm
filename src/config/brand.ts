/**
 * Single source of truth for the product identity.
 *
 * To resell under another name, change the values here (or override them with
 * the NEXT_PUBLIC_BRAND_* environment variables) — nothing else in the app
 * hardcodes the product name, domain, support address or cookie prefix.
 *
 * `cookiePrefix` MUST match the backend's BRAND_COOKIE_PREFIX, because the
 * frontend reads the readable session flag and the route guard looks for the
 * backend's HttpOnly cookies by name.
 */
const env = process.env;

const name = env.NEXT_PUBLIC_BRAND_NAME ?? 'Frameloom';

export const BRAND = {
  name,
  /** Used in compact spaces (nav lockups, page titles, PDFs). */
  shortName: env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? name,
  tagline: env.NEXT_PUBLIC_BRAND_TAGLINE ?? 'The operating system for photo & video studios.',
  description:
    env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    'Leads, projects, shoots, freelancers, invoices and client galleries — one calm workspace for your studio.',
  /** Bare domain, no protocol. */
  domain: env.NEXT_PUBLIC_BRAND_DOMAIN ?? 'frameloom.app',
  siteUrl: env.NEXT_PUBLIC_SITE_URL ?? `https://${env.NEXT_PUBLIC_BRAND_DOMAIN ?? 'frameloom.app'}`,
  supportEmail: env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL ?? 'support@frameloom.app',
  /** Shown on invoices and public contact pages; leave empty to hide. */
  supportPhone: env.NEXT_PUBLIC_BRAND_SUPPORT_PHONE ?? '',
  /** Prefix for cookies and localStorage keys. Lowercase letters/digits only. */
  cookiePrefix: env.NEXT_PUBLIC_BRAND_COOKIE_PREFIX ?? 'fl',
  logo: {
    mark: '/brand/mark.svg',
    wordmark: '/brand/wordmark.svg',
  },
  colors: {
    /** Mirrors the CSS tokens in globals.css; used for meta theme-color and PDFs. */
    primary: '#2F5F54',
    accent: '#C8A15A',
  },
} as const;

export type Brand = typeof BRAND;
