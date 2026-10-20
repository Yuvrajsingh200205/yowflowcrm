import { Container, Section } from '@/features/landing/components/Editorial';
import { PageHeader } from '@/features/landing/components/PageHeader';
import { LegalNotice } from '@/features/landing/components/LegalNotice';
import { BRAND } from '@/config/brand';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        mark="Legal · Privacy"
        title={<>What we hold, and why.</>}
        lead={`${BRAND.name} stores operational studio data — client contacts, project records, shoot schedules, payments and the photographs a studio uploads for delivery.`}
      />
      <Section tone="paper">
        <LegalNotice document="privacy policy" />
      </Section>
      <section className="bg-[var(--ed-paper-2)]">
        <Container className="py-12">
          <p className="text-[0.8125rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">
            Questions about data held on your studio or your wedding should go to your studio first — they are
            the controller of their own client records.
          </p>
        </Container>
      </section>
    </>
  );
}
