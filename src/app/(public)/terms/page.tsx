import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { LegalPage, LegalSection } from '@/features/marketing/Legal';
import { PageHero } from '@/features/marketing/PageHero';

export const metadata: Metadata = { title: 'Terms of service', description: `The terms for using ${BRAND.name}.`, alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of service" lead={`The agreement between you and ${BRAND.name}.`} />
      <LegalPage updated="21 October 2026">
        <LegalSection title="1. The service">
          <p>{BRAND.name} provides a hosted workspace for photo and video studios. By creating an account or using the service you agree to these terms on behalf of yourself and your studio.</p>
        </LegalSection>
        <LegalSection title="2. Accounts">
          <p>You must provide accurate information and keep your credentials secure. You are responsible for activity under your workspace, including the permissions you grant to your team. Tell us promptly if you suspect unauthorised access.</p>
        </LegalSection>
        <LegalSection title="3. Your data">
          <p>You own the data you put into {BRAND.name}. You grant us a limited licence to host and process it to provide the service. You are responsible for having the right to store your clients’ information and files, and for the lawful use of any client photographs.</p>
        </LegalSection>
        <LegalSection title="4. Acceptable use">
          <ul>
            <li>No unlawful, infringing or harmful content.</li>
            <li>No attempts to breach security, probe other tenants or overload the service.</li>
            <li>No reselling of the service without a written agreement.</li>
          </ul>
        </LegalSection>
        <LegalSection title="5. Plans, trials and billing">
          <p>Paid plans are billed in advance, monthly or yearly, in Indian rupees excluding applicable taxes. Trials last 14 days and convert to a paid plan only when you choose one. You can cancel at any time; cancellation takes effect at the end of the paid period.</p>
        </LegalSection>
        <LegalSection title="6. Availability and support">
          <p>We aim for high availability but do not guarantee uninterrupted service. Planned maintenance is announced in advance where possible. Support is provided according to your plan.</p>
        </LegalSection>
        <LegalSection title="7. Liability">
          <p>To the extent permitted by law, the service is provided “as is” and our total liability is limited to the fees you paid in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</p>
        </LegalSection>
        <LegalSection title="8. Termination">
          <p>You may stop using the service at any time and export your data. We may suspend accounts that breach these terms. After termination we delete your data as described in the privacy policy.</p>
        </LegalSection>
        <LegalSection title="9. Changes and contact">
          <p>We may update these terms and will notify you of material changes. Questions: <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
          <p><em>These terms are a starting template. Have them reviewed by counsel before launch.</em></p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
