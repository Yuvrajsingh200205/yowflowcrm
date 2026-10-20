import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { FAQS, PLANS } from '@/config/marketing';
import { PricingSection } from '@/features/marketing/PricingSection';
import { ProductShowcase } from '@/features/marketing/ProductShowcase';
import { Reveal } from '@/features/marketing/Reveal';
import { Faq, FeatureBento, FinalCta, Hero, HowItWorks, Integrations, ProblemSolution, ProofStrip, SectionHead, Testimonials, UseCases } from '@/features/marketing/Sections';

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: BRAND.name, url: BRAND.siteUrl, logo: `${BRAND.siteUrl}/brand/mark-256.png`, email: BRAND.supportEmail },
    {
      '@type': 'SoftwareApplication',
      name: BRAND.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: BRAND.description,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: String(PLANS[0].monthly), highPrice: String(PLANS[PLANS.length - 1].monthly), offerCount: PLANS.length },
    },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
