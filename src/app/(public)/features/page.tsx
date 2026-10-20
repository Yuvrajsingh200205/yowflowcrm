import type { Metadata } from 'next';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { PageHero } from '@/features/marketing/PageHero';
import { Reveal } from '@/features/marketing/Reveal';
import { FinalCta } from '@/features/marketing/Sections';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Features',
  description: `Leads, projects, shoots, freelancers, finance, client galleries and permissions — everything ${BRAND.name} does for photo and video studios.`,
  alternates: { canonical: '/features' },
};

const SECTIONS = [
  { id: 'leads', title: 'Lead pipeline that never goes cold', body: 'Every enquiry lands in one place with its source, event date and owner. Reminders keep follow-ups on time, and a booked lead becomes a project in one click.', points: ['Capture from forms and Meta Lead Ads', 'Follow-up reminders and notes per lead', 'Quotations with taxes, validity and PDF export', 'Conversion and source analytics'], img: '/marketing/leads.webp' },
  { id: 'projects', title: 'One record per project', body: 'Events, deliverables, deadlines, payment milestones and the people involved, together. The status updates itself as shoots and deliveries are completed.', points: ['Multi-day events and sub-events', 'Payment schedules with milestones', 'Automatic progress from tasks and deliveries', 'WhatsApp-ready payment summaries'], img: '/marketing/projects.webp' },
  { id: 'shoots', title: 'Shoots and crew without the chaos', body: 'Plan each day, assign photographers, cinematographers and assistants by role, and catch double-bookings before the day of the shoot.', points: ['Calendar and call sheets', 'Role-based crew assignment', 'Freelancer availability and invitations', 'Attendance and day-wise reports'], img: '/marketing/dashboard.webp' },
  { id: 'finance', title: 'Money you can reason about', body: 'Quotations, invoices, payments and expenses roll up into monthly profit and loss, so you always know what is collected, due and spent.', points: ['Invoices and receipts as PDFs', 'Payment allocation across milestones', 'Expense categories and recurring costs', 'Staff salary and freelancer payouts'], img: '/marketing/dashboard.webp' },
  { id: 'portal', title: 'A private portal your clients will love', body: 'Share galleries through a branded portal with album selection, comments and request tracking. Family gets expiring links without needing an account.', points: ['Private galleries and sub-folders', 'Selection workflow for albums', 'Expiring, optionally password-protected links', 'Client payment schedule and receipts'], img: '/marketing/projects.webp' },
  { id: 'access', title: 'Access that matches your org chart', body: 'Roles and fine-grained permissions decide who can view or change what. Sensitive actions are recorded in an audit log.', points: ['System and custom roles', 'Per-user permission overrides', 'Audit trail with who, what and when', 'HttpOnly session cookies, no tokens in the browser'], img: '/marketing/leads.webp' },
] as const;

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="Everything your studio runs on, connected." lead={`${BRAND.name} replaces the spreadsheets, chat threads and half-used tools with a single workspace.`} />
      <div className="mx-auto max-w-6xl space-y-24 px-4 pb-24 sm:space-y-32 sm:px-6 sm:pb-32">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="grid items-center gap-10 scroll-mt-24 lg:grid-cols-2 lg:gap-16">
            <Reveal className={cn(i % 2 === 1 && 'lg:order-2')}>
              <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-4xl">{s.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-fg-muted">{s.body}</p>
              <ul className="mt-6 space-y-3">
                {s.points.map((p) => <li key={p} className="flex gap-3 text-[15px] text-fg"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{p}</li>)}
              </ul>
            </Reveal>
            <Reveal delay={0.08} className={cn(i % 2 === 1 && 'lg:order-1')}>
              <div className="overflow-hidden rounded-[1.2rem] border border-line bg-surface shadow-[0_30px_90px_-30px_rgba(0,0,0,.7)]">
                <Image src={s.img} alt={`${BRAND.name} ${s.title} screen`} width={1440} height={900} sizes="(min-width:1024px) 560px, 100vw" className="h-auto w-full" />
              </div>
            </Reveal>
          </section>
        ))}
      </div>
      <FinalCta />
    </>
  );
}
