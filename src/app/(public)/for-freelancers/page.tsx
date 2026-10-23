import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, CalendarCheck, Search, UserCheck } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/features/marketing/PageHero';
import { Reveal } from '@/features/marketing/Reveal';
import { FinalCta } from '@/features/marketing/Sections';

export const metadata: Metadata = {
  title: 'For freelancers',
  description: `Join the ${BRAND.name} freelancer network: get discovered by studios, manage bookings and track what you are owed.`,
  alternates: { canonical: '/for-freelancers' },
};

const BENEFITS = [
  { icon: Search, title: 'Get discovered', body: 'With a listing plan, studios search by city, craft and availability. A complete profile puts you in front of the right ones.' },
  { icon: CalendarCheck, title: 'Know your schedule', body: 'Bookings, call times and venues in one place, with your availability kept up to date.' },
  { icon: Banknote, title: 'Track what you’re owed', body: 'Assignments carry their payout status, so there is no chasing and no separate spreadsheet.' },
  { icon: UserCheck, title: 'Your profile, your terms', body: 'Set your rates, specialities and portfolio links. Studios invite you; you accept what fits.' },
] as const;

export default function ForFreelancersPage() {
  return (
    <>
      <PageHero eyebrow="For freelancers" title="Get booked by studios, and get paid on time." lead={`Creating a ${BRAND.name} profile is free. Add a listing plan and the studio you work with can find you, invite you and keep every assignment in one record.`} />
      <div className="mx-auto -mt-2 flex max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-16 sm:flex-row sm:px-6">
        <Button asChild variant="accent" size="lg"><Link href="/freelancer/join">Create your profile</Link></Button>
        <Button asChild variant="secondary" size="lg"><Link href="/freelancer/login">Freelancer login</Link></Button>
      </div>
      <p className="mx-auto -mt-10 max-w-xl px-4 pb-14 text-center text-sm text-fg-muted">You join through the studio you work with: ask them for their freelancer join link.</p>
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <article className="h-full rounded-[var(--radius-xl)] border border-line-soft bg-surface p-7">
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-brand"><Icon className="size-5" aria-hidden="true" /></span>
                <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
