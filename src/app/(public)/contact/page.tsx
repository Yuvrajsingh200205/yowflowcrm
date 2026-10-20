import Link from 'next/link';
import { Container, Section, TextLink } from '@/features/landing/components/Editorial';
import { PageHeader } from '@/features/landing/components/PageHeader';
import { Reveal } from '@/features/landing/components/Reveal';
import { contactChannels, contactDoors } from '@/features/landing/data/contactContent';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: 'Contact',
  description: `Reach ${BRAND.name} — studio access, freelancer registration and client sign-in.`,
};

/**
 * Contact.
 *
 * Deliberately not a form: no public inquiry endpoint exists yet, and a form
 * that silently posts nowhere is worse than no form. Instead this routes each
 * visitor to the door they actually need — all three destinations are routes
 * that already work — with direct channels alongside.
 */
export default function ContactPage() {
  return (
    <>
      <PageHeader
        mark="Contact"
        title={<>Tell us which side of the wedding you are on.</>}
        lead="Studios, freelancers and couples need different things from us. Pick the one that fits and you will skip a round of email."
      >
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 sm:max-w-xl">
          {contactChannels.map((channel) => (
            <div key={channel.label} className="border-t border-[var(--ed-rule-ink)] pt-4">
              <dt className="ed-label text-[var(--ed-brass)]">{channel.label}</dt>
              <dd className="mt-2">
                <a
                  href={channel.href}
                  className="ed-display ed-d4 text-[var(--ed-on-ink)] underline decoration-[var(--ed-brass)]/40 decoration-1 underline-offset-[6px] transition-colors hover:decoration-[var(--ed-brass)]"
                >
                  {channel.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <Section tone="paper">
        <div className="border-t border-[var(--ed-rule-paper)]">
          {contactDoors.map((door, i) => (
            <Reveal key={door.index} delay={i * 110} className="group border-b border-[var(--ed-rule-paper)]">
              <div className="grid items-baseline gap-x-8 gap-y-4 py-9 lg:grid-cols-12">
                <div className="flex items-baseline gap-5 lg:col-span-5">
                  <span className="ed-numeral shrink-0 text-[0.75rem] text-[var(--ed-brass)]">{door.index}</span>
                  <h2 className="ed-display ed-d3 text-[var(--ed-on-paper)]">{door.title}</h2>
                </div>
                <p className="text-[0.875rem] leading-[1.75] text-[var(--ed-on-paper-dim)] lg:col-span-4">
                  {door.description}
                </p>
                <div className="lg:col-span-3 lg:justify-self-end">
                  <TextLink href={door.href}>{door.cta}</TextLink>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="bg-[var(--ed-paper-2)]">
        <Container className="py-12">
          <p className="text-[0.8125rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">
            Looking for what the product does today?{' '}
            <Link href="/features" className="text-[var(--ed-plum)] underline decoration-1 underline-offset-4">
              The capability index
            </Link>{' '}
            lists every module that is live.
          </p>
        </Container>
      </section>
    </>
  );
}
