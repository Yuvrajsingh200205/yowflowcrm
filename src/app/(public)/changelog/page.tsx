import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { PageHero } from '@/features/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Changelog',
  description: `What’s new in ${BRAND.name}.`,
  alternates: { canonical: '/changelog' },
};

const RELEASES = [
  { version: '2.2', date: 'October 2026', title: 'Ready-made templates', items: ['28 ready-made packages and 12 add-ons for weddings, birthdays, pre-wedding shoots, corporate events and more', 'New studios start with the everyday packages already in place', 'Quick quote: name, mobile number, package, then send it on WhatsApp', 'A short checklist that shows what is left before your first quote'] },
  { version: '2.1', date: 'October 2026', title: 'Quote in seconds', items: ['A booking page and QR code for your studio: customers pick a free date and a package and get a priced quote on screen', 'Packages and add-ons with GST, per-day and per-guest pricing; quotes can be sent instantly or after your approval', 'Customers open a private quote link, switch extras on or off, and accept online; you see when it was opened', 'Accepted quotes create the project, payment schedule and a draft invoice, and block the date for everyone else', 'Quote and invoice PDFs with GST, bank details and a UPI QR code', 'A Today list of quotes and payments to follow up, with WhatsApp messages ready to send, plus daily email reminders'] },
  { version: '2.0', date: 'October 2026', title: `${BRAND.name} 2.0`, items: ['New brand, design system and dark/light themes', 'Redesigned workspace shell with command palette (⌘K)', 'Self-serve signup, password reset and email verification', 'Public contact form and refreshed marketing site'] },
  { version: '1.5', date: 'September 2026', title: 'Client portal and galleries', items: ['Private galleries with album selection and comments', 'Expiring and password-protected share links', 'Client payment schedule and request tracking'] },
  { version: '1.4', date: 'August 2026', title: 'Freelancer network', items: ['Freelancer onboarding with single-use invitations', 'Availability, assignments and payouts', 'Meta Lead Ads integration for instant lead capture'] },
] as const;

export default function ChangelogPage() {
  return (
    <>
      <PageHero eyebrow="Changelog" title="What’s new." lead="Product updates, improvements and fixes." />
      <ol className="mx-auto max-w-3xl space-y-12 px-4 pb-24 sm:px-6 sm:pb-32">
        {RELEASES.map((r) => (
          <li key={r.version} className="relative border-l border-line pl-8">
            <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-lime shadow-[0_0_10px_var(--accent)]" aria-hidden="true" />
            <p className="font-mono text-xs text-fg-subtle">v{r.version} · {r.date}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{r.title}</h2>
            <ul className="mt-4 space-y-2 text-[15px] text-fg-muted">{r.items.map((i) => <li key={i} className="flex gap-2.5"><span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" aria-hidden="true" />{i}</li>)}</ul>
          </li>
        ))}
      </ol>
    </>
  );
}
