import type { Metadata } from 'next';
import { Mail, MessageSquare, Clock } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { ContactForm } from '@/features/marketing/ContactForm';
import { PageHero } from '@/features/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Book a ${BRAND.name} demo or ask us anything. We reply within one working day.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s talk about your studio." lead="Book a walkthrough, ask about pricing or tell us what you’d like to fix. A person replies, not a bot." />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-24 sm:px-6 sm:pb-32 lg:grid-cols-[1fr_20rem]">
        <ContactForm />
        <aside className="space-y-6 text-sm">
          {[
            { icon: Mail, title: 'Email', body: BRAND.supportEmail, href: `mailto:${BRAND.supportEmail}` },
            { icon: Clock, title: 'Response time', body: 'Within one working day' },
            { icon: MessageSquare, title: 'Demo', body: 'A 30-minute walkthrough tailored to how your studio works.' },
          ].map(({ icon: Icon, title, body, href }) => (
            <div key={title} className="flex gap-4 rounded-[var(--radius-lg)] border border-line-soft bg-surface p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-brand"><Icon className="size-4" aria-hidden="true" /></span>
              <div><p className="font-medium text-fg">{title}</p>{href ? <a href={href} className="mt-0.5 block text-fg-muted underline-offset-4 hover:text-fg hover:underline">{body}</a> : <p className="mt-0.5 text-fg-muted">{body}</p>}</div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
