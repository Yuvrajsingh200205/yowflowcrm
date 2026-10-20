import Image from 'next/image';
import { Action, Container, Display, TextLink } from '@/features/landing/components/Editorial';
import { Reveal } from '@/features/landing/components/Reveal';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: 'For Studios',
  description: 'Run a wedding photography studio from one record: projects, shoots, crew, payments and delivery.',
};

const day = [
  { time: 'Morning', title: 'What is due', body: 'Balances, follow-ups and the weddings that need a decision today.' },
  { time: 'Before call', title: 'Who is on the shoot', body: 'Staff, freelancers, venue and the role each person is covering.' },
  { time: 'After the day', title: 'What moved', body: 'Tasks, attendance and the delivery status written back onto the project.' },
  { time: 'End of week', title: 'What was collected', body: 'Invoices, receipts, expenses and payouts, still attached to the wedding.' },
];

const holds = [
  ['Wedding', 'One production record'],
  ['Crew', 'Staff and freelancers'],
  ['Money', 'Budget, receipts, payouts'],
  ['Delivery', 'Status and client assets'],
];

export default function StudiosPage() {
  return (
    <>
      <header className="ed-ink relative isolate overflow-hidden">
        <Image
          src="/images/hero-aperture.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_40%] opacity-40"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,14,13,0.94)_0%,rgba(9,14,13,0.78)_48%,rgba(9,14,13,0.35)_100%)]" />
        <Container className="relative pb-20 pt-[clamp(8rem,14vw,11rem)]">
          <p className="ed-label text-[var(--ed-brass-lt)]">For studios</p>
          <Display as="h1" step="ed-d1" className="mt-6 max-w-[13ch] text-[#F7F1E8]">
            Run the studio from one place.
          </Display>
          <p className="mt-6 max-w-[38ch] text-[1rem] leading-[1.7] text-[rgba(247,241,232,0.78)]">
            Projects, clients, the day’s shoots, the crew, the payments and the delivery — written to the wedding they belong to.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-8">
            <Action href="/contact">Get Started</Action>
            <TextLink href="/features">Explore Features</TextLink>
          </div>
        </Container>
      </header>

      <section className="bg-[var(--ed-paper)]">
        <Container className="py-[clamp(4rem,8vw,7rem)]">
          <p className="ed-label text-[var(--ed-plum)]">A working day</p>
          <Display step="ed-d2" className="mt-5 max-w-[16ch]">
            The season, without the spreadsheet chase.
          </Display>
          <ol className="mt-12 grid gap-px bg-[var(--ed-rule-paper)] md:grid-cols-2 lg:grid-cols-4">
            {day.map((item, index) => (
              <Reveal key={item.title} as="li" delay={index * 70} className="bg-[var(--ed-paper)] p-6 sm:p-8">
                <p className="ed-numeral text-[0.75rem] text-[var(--ed-brass)]">{String(index + 1).padStart(2, '0')}</p>
                <p className="ed-label mt-4 text-[var(--ed-plum)]">{item.time}</p>
                <h2 className="ed-display ed-d4 mt-3">{item.title}</h2>
                <p className="mt-3 text-[0.875rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">{item.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-[var(--ed-paper-2)]">
        <Container className="grid items-center gap-12 py-[clamp(4rem,8vw,7rem)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="ed-label text-[var(--ed-plum)]">The record</p>
            <Display step="ed-d2" className="mt-5">
              One wedding. <em>Every number.</em>
            </Display>
            <p className="mt-5 max-w-[36ch] text-[0.9375rem] leading-[1.75] text-[var(--ed-on-paper-dim)]">
              Role-based access for the people who touch the job. The same dataset the freelancer record and the client delivery are built on.
            </p>
          </div>
          <dl className="border-t border-[var(--ed-rule-paper)] lg:col-span-6 lg:col-start-7">
            {holds.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-[var(--ed-rule-paper)] py-5">
                <dt className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--ed-on-paper-dim)]">{label}</dt>
                <dd className="ed-display text-[1.15rem]">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="ed-ink">
        <Container className="flex flex-col gap-8 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ed-label text-[var(--ed-brass)]">Next</p>
            <p className="ed-display mt-4 max-w-[16ch] text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.12] text-[var(--ed-on-ink)]">
              Tell us the size of the season.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <Action href="/contact">Contact Us</Action>
            <TextLink href="/pricing">Pricing</TextLink>
          </div>
        </Container>
      </section>
    </>
  );
}
