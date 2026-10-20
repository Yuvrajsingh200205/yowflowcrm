import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { PricingSection } from '@/features/marketing/PricingSection';
import { ProductShowcase } from '@/features/marketing/ProductShowcase';
import { Reveal } from '@/features/marketing/Reveal';
import { Faq, FeatureBento, FinalCta, Hero, HowItWorks, Integrations, ProblemSolution, ProofStrip, SectionHead, Testimonials, UseCases } from '@/features/marketing/Sections';

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
  alternates: { canonical: '/' },
  openGraph: { title: `${BRAND.name} — ${BRAND.tagline}`, description: BRAND.description, url: '/', type: 'website' },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <ProblemSolution />
      <FeatureBento />
      <ProductShowcase />
      <HowItWorks />
      <UseCases />
      <Testimonials />
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
        <Reveal><SectionHead eyebrow="Pricing" title="Simple plans that grow with your studio." body="Start free for 14 days. Pick a plan when you’re ready." center /></Reveal>
        <div className="mt-12"><PricingSection /></div>
      </section>
      <Integrations />
      <Faq />
      <FinalCta />
    </>
  );
}
