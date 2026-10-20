import Image from 'next/image';
import { Action, Container, Display, Lead, RuleList, Section, SectionMark, TextLink } from './Editorial';
import { Reveal } from './Reveal';
import { clients, freelancers, studios } from '../data/landingContent';

/** A status note for capability that is honestly still in build. */
function StatusNote({ children }: { children: string }) {
  return (
    <p className="mt-8 flex items-start gap-3 border-t border-[var(--ed-rule-paper)] pt-4 text-[0.75rem] leading-[1.65] text-[var(--ed-on-paper-dim)] [.ed-ink_&]:text-[var(--ed-on-ink-dim)]">
      <span className="ed-label mt-0.5 shrink-0 text-[var(--ed-brass)]">Status</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * A production docket, drawn entirely in type.
 *
 * The brief's instinct is to show a product screenshot here; there isn't one,
 * and a faked UI card would be the generic move. Instead this is what the CRM
 * actually holds for a wedding, set as a printed job docket: tabular rows,
 * hairlines, one figure in brass. It is a visual made of information.
 */
function ProductionDocket() {
  const rows = [
    ['Wedding', 'Aarav & Meera'],
    ['Dates', '14–16 Feb'],
    ['Venue', 'Jaipur'],
    ['Crew', '2 staff · 3 freelancers'],
    ['Package', '₹4,80,000'],
    ['Received', '₹3,20,000'],
  ];
  return (
    <div className="bg-[var(--ed-paper-2)] p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--ed-rule-paper)] pb-4">
        <span className="ed-label text-[var(--ed-plum)]">Project record — example</span>
        <span className="ed-numeral text-[0.6875rem] text-[var(--ed-on-paper-dim)]">No. 0247</span>
      </div>
      <dl className="mt-1">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-6 border-b border-[var(--ed-rule-paper)] py-3"
          >
            <dt className="text-[0.75rem] uppercase tracking-[0.1em] text-[var(--ed-on-paper-dim)]">{label}</dt>
            <dd className="ed-numeral text-right text-[0.875rem] text-[var(--ed-on-paper)]">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <span className="ed-label text-[var(--ed-on-paper-dim)]">Balance due</span>
        <span className="ed-display text-[1.375rem] text-[var(--ed-plum)]">₹1,60,000</span>
      </div>
      <div className="mt-4 h-px w-full bg-[var(--ed-rule-paper)]">
        <div className="h-px w-2/3 bg-[var(--ed-brass)]" aria-hidden="true" />
      </div>
      <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--ed-on-paper-dim)]">
        Two thirds collected · delivery in progress
      </p>
    </div>
  );
}

/** Studios: type left, the docket right, dropped below the heading baseline. */
export function StudioSection() {
  return (
    <Section id="studios" tone="paper">
      <div className="grid gap-x-8 gap-y-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal>
            <SectionMark index={studios.mark.index} label={studios.mark.label} />
          </Reveal>
          <Reveal delay={80}>
            <Display step="ed-d2" className="mt-10 max-w-[18ch] text-[var(--ed-on-paper)]">
              {studios.heading[0]}
              <br />
              <em>{studios.heading[1]}</em>
            </Display>
          </Reveal>
          <Reveal delay={140}>
            <Lead className="mt-7">{studios.lead}</Lead>
          </Reveal>
          <Reveal delay={200}>
            <RuleList items={studios.bullets} />
            <div className="mt-10">
              <Action href={studios.cta.href}>{studios.cta.label}</Action>
            </div>
          </Reveal>
        </div>

        <Reveal delay={260} className="lg:col-span-5 lg:col-start-8 lg:pt-[6rem]">
          <ProductionDocket />
        </Reveal>
      </div>
    </Section>
  );
}

/** Freelancers: mirrored, opened by a full-measure pull quote. */
export function FreelancerSection() {
  return (
    <Section id="freelancers" tone="paper-2">
      <Reveal>
        <SectionMark index={freelancers.mark.index} label={freelancers.mark.label} />
      </Reveal>

      <Reveal delay={80}>
        <blockquote className="mt-10 max-w-[30ch] lg:max-w-[34ch]">
          <p className="ed-display ed-d2 text-[var(--ed-plum-deep)]">
            <em>{freelancers.pullquote}</em>
          </p>
        </blockquote>
      </Reveal>

      <div className="mt-[clamp(3rem,6vw,5rem)] grid gap-x-8 gap-y-10 border-t border-[var(--ed-rule-paper)] pt-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <Display step="ed-d3" className="max-w-[16ch] text-[var(--ed-on-paper)]">
            {freelancers.heading[0]}
            <br />
            {freelancers.heading[1]}
          </Display>
          <Lead className="mt-6">{freelancers.lead}</Lead>
          <StatusNote>{freelancers.status}</StatusNote>
        </Reveal>

        <Reveal delay={140} className="lg:col-span-6 lg:col-start-7">
          <RuleList items={freelancers.bullets} className="mt-0" />
          <div className="mt-10">
            <TextLink href={freelancers.cta.href}>{freelancers.cta.label}</TextLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/**
 * Clients: the page's cinematic break.
 *
 * Full-bleed, ink, the wide crop of the photograph running edge to edge with
 * the argument set over it in a single narrow column. This is where the page
 * stops being a product site for a moment, which is the point — it is the only
 * section written for the couple rather than the studio.
 */
export function ClientSection() {
  return (
    <section id="clients" className="ed-ink relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/studio-light.svg"
          alt=""
          aria-hidden="true"
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-[50%_22%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,16,15,.96)_0%,rgba(20,16,15,.86)_42%,rgba(20,16,15,.42)_100%)]"
        />
      </div>

      <Container className="py-[clamp(5.5rem,11vw,11rem)]">
        <div className="max-w-[34rem]">
          <Reveal>
            <SectionMark index={clients.mark.index} label={clients.mark.label} />
          </Reveal>
          <Reveal delay={80}>
            <Display step="ed-d2" className="mt-10 text-[var(--ed-on-ink)]">
              {clients.heading[0]}{' '}
              <em>{clients.heading[1]}</em>
            </Display>
          </Reveal>
          <Reveal delay={140}>
            <Lead className="mt-7">{clients.lead}</Lead>
            <RuleList items={clients.bullets} />
            <StatusNote>{clients.status}</StatusNote>
            <div className="mt-9">
              <TextLink href={clients.cta.href}>{clients.cta.label}</TextLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
