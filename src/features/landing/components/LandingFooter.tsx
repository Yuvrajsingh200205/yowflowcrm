import Link from 'next/link';
import { Container } from './Editorial';
import { BRAND } from '@/config/brand';

/**
 * Footer as a colophon.
 *
 * The wordmark is set at display scale so the page closes on the brand rather
 * than trailing off into four columns of small links. The link groups sit to
 * the right on a hairline grid.
 */
const groups = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/pricing#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Audiences',
    links: [
      { href: '/studios', label: 'Studios' },
      { href: '/freelancers', label: 'Freelancers' },
      { href: '/clients', label: 'Clients' },
    ],
  },
  {
    title: 'Access',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/freelancers', label: 'Freelancers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="ed-ink">
      <Container className="pb-10 pt-[clamp(3.5rem,7vw,6rem)]">
        <div className="grid gap-x-8 gap-y-12 border-t border-[var(--ed-rule-ink)] pt-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="ed-display block max-w-[14ch] text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.06] tracking-[-0.02em] text-[var(--ed-on-ink)]">
              {BRAND.name}
            </Link>
            <p className="mt-6 max-w-[34ch] text-[0.8125rem] leading-[1.7] text-[var(--ed-on-ink-dim)]">
              Studio operations for wedding photography — from the first inquiry to the photographs a
              couple keeps.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="ed-label text-[var(--ed-brass)]">{group.title}</h2>
                <ul className="mt-5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.8125rem] text-[var(--ed-on-ink-dim)] transition-colors duration-300 hover:text-[var(--ed-on-ink)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[var(--ed-rule-ink)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.75rem] text-[var(--ed-on-ink-dim)]">© {year} {BRAND.name}</p>
          <p className="ed-numeral text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--ed-on-ink-dim)]">
            Set in Fraunces &amp; Instrument Sans
          </p>
        </div>
      </Container>
    </footer>
  );
}
