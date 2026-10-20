import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/features/marketing/PageHero';
import { Reveal } from '@/features/marketing/Reveal';
import { FinalCta } from '@/features/marketing/Sections';

export const metadata: Metadata = {
  title: 'About',
  description: `Why ${BRAND.name} exists: calmer operations for photo and video studios.`,
  alternates: { canonical: '/about' },
};

const PRINCIPLES = [
  { title: 'The studio’s time belongs behind the camera', body: 'Every screen is judged by one question: does it remove admin, or add some?' },
  { title: 'One record, many views', body: 'A client, a project and a payment are entered once and appear wherever they are needed.' },
  { title: 'Calm by default', body: 'Clear status, honest empty states and quiet design, so a busy season doesn’t feel louder.' },
  { title: 'Your data stays yours', body: 'Standard PostgreSQL, exportable at any time, with access you control down to the permission.' },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={`Software for the business side of beautiful work.`} lead={`${BRAND.name} was built for studios whose craft is storytelling, and whose days are lost to follow-ups, schedules and invoices.`} />
      <section className="mx-auto max-w-3xl space-y-6 px-4 pb-20 text-base leading-relaxed text-fg-muted sm:px-6">
        <Reveal><p>Running a photo or video studio means doing two jobs: the creative work clients hire you for, and the operations that keep it on time and paid for. The second job is usually held together with spreadsheets, chat groups and memory.</p></Reveal>
        <Reveal><p>{BRAND.name} brings that second job into one workspace: leads, bookings, crews, freelancers, invoices and deliveries share a single record, so the whole team sees the same truth and clients get a professional experience from first enquiry to final gallery.</p></Reveal>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-32">
        <Reveal><h2 className="text-center font-display text-3xl font-semibold tracking-tight">What we believe</h2></Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="h-full rounded-[var(--radius-xl)] border border-line-soft bg-surface p-7">
                <h3 className="font-display text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center"><Button asChild variant="secondary" size="lg"><Link href="/contact">Talk to us</Link></Button></div>
      </section>
      <FinalCta />
    </>
  );
}
