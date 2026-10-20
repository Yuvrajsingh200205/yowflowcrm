import { Action, Container, Display, TextLink } from '@/features/landing/components/Editorial';
import { FaqSection } from '@/features/landing/components/FaqSection';
import { Reveal } from '@/features/landing/components/Reveal';
import { pricingPlans } from '@/features/landing/data/pricingData';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: 'Pricing',
  description: `${BRAND.name} is structured around studio, freelancer and client access. Studio terms are quoted.`,
};

export default function PricingPage() {
  return (
    <>
      <header className="ed-ink">
        <Container className="pb-16 pt-[clamp(8rem,14vw,11rem)]">
          <p className="ed-label text-[var(--ed-brass)]">Pricing</p>
          <Display as="h1" step="ed-d1" className="mt-6 max-w-[16ch] text-[var(--ed-on-ink)]">
            Priced for the role, <em>not the empty seat.</em>
          </Display>
          <p className="mt-6 max-w-[46ch] text-[0.9375rem] leading-[1.75] text-[var(--ed-on-ink-dim)]">
            A studio, a freelancer and a couple are not the same customer. Studio terms are quoted against the season. Nothing here is a contract.
          </p>
        </Container>
      </header>

      <section className="bg-[var(--ed-paper)]">
        <Container className="py-[clamp(3.5rem,7vw,6rem)]">
          <div className="grid gap-px bg-[var(--ed-rule-paper)] lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 80} className={`bg-[var(--ed-paper)] p-7 sm:p-9 ${plan.highlighted ? 'border-t-2 border-t-[var(--ed-brass)]' : ''}`}>
                <p className="ed-label text-[var(--ed-plum)]">{plan.label}</p>
                <h2 className="ed-display ed-d3 mt-4">{plan.name}</h2>
                <p className="ed-display mt-8 text-[2rem] leading-none text-[var(--ed-plum-deep)]">{plan.price}</p>
                <p className="mt-2 text-[0.75rem] uppercase tracking-[0.12em] text-[var(--ed-on-paper-dim)]">{plan.priceNote}</p>
                <p className="mt-6 min-h-[4.5rem] text-[0.875rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">{plan.description}</p>
                <ul className="mt-6 border-t border-[var(--ed-rule-paper)]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="border-b border-[var(--ed-rule-paper)] py-3 text-[0.875rem]">
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <TextLink href={plan.href}>{plan.cta}</TextLink>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-8">
            <Action href="/contact">Get Started</Action>
            <TextLink href="/studios">View for Studios</TextLink>
          </div>
        </Container>
      </section>

      <FaqSection />

      <section className="bg-[var(--ed-paper)]">
        <Container className="py-12">
          <p className="max-w-[62ch] text-[0.8125rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">
            Final pricing, billing terms and any trial are confirmed in writing before a studio is onboarded. Freelancer portal pricing is separate and still being set.
          </p>
        </Container>
      </section>
    </>
  );
}