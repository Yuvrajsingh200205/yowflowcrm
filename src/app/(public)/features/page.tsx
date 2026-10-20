import Link from 'next/link';
import { Action, Container, Display, TextLink } from '@/features/landing/components/Editorial';
import { Reveal } from '@/features/landing/components/Reveal';
import { shippedModules } from '@/features/landing/data/landingContent';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: 'Features',
  description: `Plan, shoot, collect and deliver a wedding from one ${BRAND.name} record.`,
};

const chapters = [
  {
    index: '01',
    kicker: 'Plan',
    title: 'The inquiry becomes a project, not a lost message.',
    body: 'Leads, follow-ups and the wedding itself sit on one record, with the budget and the milestones beside the names.',
    points: ['Inquiries and follow-ups', 'Project budget and milestones', 'Tasks across the team'],
  },
  {
    index: '02',
    kicker: 'Create',
    title: 'The day is written down before anyone leaves.',
    body: 'Shoots carry the venue, the call time and who is actually standing there with a camera.',
    points: ['Shoot schedules', 'Venues and crew', 'Day-of assignments'],
  },
  {
    index: '03',
    kicker: 'Collect',
    title: 'What is owed stays attached to the wedding.',
    body: 'Invoices, receipts, expenses and freelancer payouts are part of the same production record.',
    points: ['Invoices and receipts', 'Expenses', 'Freelancer payouts'],
  },
  {
    index: '04',
    kicker: 'Deliver',
    title: 'The handoff keeps moving after the wedding.',
    body: 'Delivery status and client assets are tracked today. The gallery a couple signs into is still being built on that record.',
    points: ['Delivery status', 'Client assets on the project', 'Gallery foundation, in build'],
  },
  {
    index: '05',
    kicker: 'Connect',
    title: 'The studio, the crew and the couple share one wedding.',
    body: 'Role-based access for the team. Freelancer records today. A portal and a client gallery still being finished.',
    points: ['Clients on the project', 'Freelancer assignments', 'Notifications to the right role'],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <header className="ed-ink">
        <Container className="grid items-end gap-10 pb-16 pt-[clamp(8rem,14vw,11rem)] lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="ed-label text-[var(--ed-brass)]">Features</p>
            <Display as="h1" step="ed-d1" className="mt-6 max-w-[14ch] text-[var(--ed-on-ink)]">
              Five parts of one wedding.
            </Display>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-[0.9375rem] leading-[1.75] text-[var(--ed-on-ink-dim)]">
              Not a list of buttons. The work a studio actually does, in the order it happens, on the record that already exists.
            </p>
            <div className="mt-8">
              <Action href="/contact">Get Started</Action>
            </div>
          </div>
        </Container>
      </header>

      <section className="bg-[var(--ed-paper)]">
        <Container className="py-[clamp(3rem,6vw,5rem)]">
          <ol className="border-t border-[var(--ed-rule-paper)]">
            {chapters.map((chapter) => (
              <Reveal as="li" key={chapter.index} className="grid gap-8 border-b border-[var(--ed-rule-paper)] py-12 lg:grid-cols-12 lg:py-16">
                <div className="lg:col-span-3">
                  <p className="ed-numeral text-[clamp(2rem,4vw,3rem)] leading-none text-[var(--ed-brass)]">{chapter.index}</p>
                  <p className="ed-label mt-4 text-[var(--ed-plum)]">{chapter.kicker}</p>
                </div>
                <div className="lg:col-span-5">
                  <h2 className="ed-display ed-d3 text-[var(--ed-on-paper)]">{chapter.title}</h2>
                  <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-[1.75] text-[var(--ed-on-paper-dim)]">{chapter.body}</p>
                </div>
                <ul className="lg:col-span-3 lg:col-start-10">
                  {chapter.points.map((point) => (
                    <li key={point} className="border-t border-[var(--ed-rule-paper)] py-3 text-[0.875rem]">
                      {point}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="ed-ink">
        <Container className="py-[clamp(4rem,8vw,7rem)]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Display step="ed-d2" className="max-w-[12ch] text-[var(--ed-on-ink)]">
              Live in the CRM today.
            </Display>
            <p className="max-w-[28ch] text-[0.8125rem] leading-[1.7] text-[var(--ed-on-ink-dim)]">
              Nine modules. Each one writes to the same project.
            </p>
          </div>
          <ol className="mt-12 grid border-t border-[var(--ed-rule-ink)] sm:grid-cols-2 lg:grid-cols-3">
            {shippedModules.map((module, index) => (
              <li key={module.title} className="border-b border-[var(--ed-rule-ink)] py-6 pr-8">
                <span className="ed-numeral text-[0.75rem] text-[var(--ed-brass)]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="ed-display ed-d4 mt-3 text-[var(--ed-on-ink)]">{module.title}</h3>
                <p className="mt-2 text-[0.8125rem] leading-[1.65] text-[var(--ed-on-ink-dim)]">{module.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap items-center gap-8">
            <Action href="/studios">View for Studios</Action>
            <TextLink href="/pricing">Pricing</TextLink>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--ed-paper)]">
        <Container className="flex flex-col gap-6 py-16 sm:flex-row sm:items-end sm:justify-between">
          <p className="ed-display max-w-[18ch] text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.15] text-[var(--ed-on-paper)]">
            See it against a real season. <em>Talk to us.</em>
          </p>
          <Link href="/contact" className="ed-action">Contact Us</Link>
        </Container>
      </section>
    </>
  );
}
