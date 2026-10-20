import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { PLANS } from '@/config/marketing';
import { PageHero } from '@/features/marketing/PageHero';
import { PricingSection } from '@/features/marketing/PricingSection';
import { Faq, FinalCta } from '@/features/marketing/Sections';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `${BRAND.name} plans for solo photographers, growing studios and multi-branch agencies. 14-day free trial, no credit card.`,
  alternates: { canonical: '/pricing' },
};

const ROWS: Array<[string, boolean | string, boolean | string, boolean | string]> = [
  ['Team members', '2', '10', 'Unlimited'],
  ['Active projects', '25', 'Unlimited', 'Unlimited'],
  ['Lead pipeline and quotations', true, true, true],
  ['Invoices and payment tracking', true, true, true],
  ['Client portal storage', '5 GB / project', '25 GB / project', 'Custom'],
  ['Freelancer network and payouts', false, true, true],
  ['Shoot scheduling and crew assignment', false, true, true],
  ['Finance, expenses and reports', false, true, true],
  ['Meta Lead Ads integration', false, true, true],
  ['Roles, permissions and audit log', false, true, true],
  ['Multiple branches', false, false, true],
  ['API access and webhooks', false, false, true],
  ['Custom branding', false, false, true],
  ['Support', 'Email', 'Priority', 'Dedicated + SLA'],
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <><Check className="mx-auto size-4 text-brand" aria-hidden="true" /><span className="sr-only">Included</span></>;
  if (v === false) return <><Minus className="mx-auto size-4 text-fg-subtle" aria-hidden="true" /><span className="sr-only">Not included</span></>;
  return <span className="text-fg">{v}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple pricing for studios of every size." lead="Start with a 14-day free trial. Upgrade, downgrade or cancel whenever you like." />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6"><PricingSection /></div>

      <section aria-labelledby="compare" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 sm:pb-32">
        <h2 id="compare" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Compare plans</h2>
        <div className="relative mt-8 overflow-x-auto rounded-[var(--radius-xl)] border border-line-soft bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-sunken">
                <th scope="col" className="px-5 py-4 font-medium text-fg-muted">Feature</th>
                {PLANS.map((p) => <th key={p.id} scope="col" className="px-5 py-4 text-center font-display text-base font-semibold">{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, a, b, c]) => (
                <tr key={label} className="border-t border-line-soft">
                  <th scope="row" className="px-5 py-3.5 font-normal text-fg-muted">{label}</th>
                  {[a, b, c].map((v, i) => <td key={i} className="px-5 py-3.5 text-center"><Cell v={v} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Faq />
      <FinalCta />
    </>
  );
}
