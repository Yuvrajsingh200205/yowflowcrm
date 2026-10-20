import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { LegalPage, LegalSection } from '@/features/marketing/Legal';
import { PageHero } from '@/features/marketing/PageHero';

export const metadata: Metadata = { title: 'Privacy policy', description: `How ${BRAND.name} collects, uses and protects data.`, alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" lead={`How ${BRAND.name} handles information about you, your studio and your clients.`} />
      <LegalPage updated="21 October 2026">
        <LegalSection title="Who we are">
          <p>{BRAND.name} (“we”, “us”) provides studio-operations software. When a studio uses {BRAND.name} to manage its own clients, the studio is the controller of that client data and we act as its processor. For account, billing and website data, we are the controller.</p>
        </LegalSection>
        <LegalSection title="What we collect">
          <ul>
            <li><strong>Account data:</strong> name, email address, studio name and a hashed password.</li>
            <li><strong>Workspace data you add:</strong> client contacts, projects, shoots, invoices, payments, files and notes.</li>
            <li><strong>Usage and security data:</strong> sign-in times, IP address, device information and an audit log of sensitive actions.</li>
            <li><strong>Messages you send us:</strong> through the contact form or email.</li>
          </ul>
        </LegalSection>
        <LegalSection title="How we use it">
          <ul>
            <li>To provide, secure and support the service.</li>
            <li>To send transactional email such as verification and password-reset links.</li>
            <li>To detect abuse and enforce our terms.</li>
            <li>To improve the product, using aggregated information where possible.</li>
          </ul>
          <p>We do not sell personal data and we do not use client photographs or documents to train models.</p>
        </LegalSection>
        <LegalSection title="Where data is stored and who can see it">
          <p>Workspace data is stored in a PostgreSQL database; uploaded files are stored in object storage and served only through signed, expiring links. Access inside a workspace is controlled by roles and permissions set by the studio’s administrators.</p>
        </LegalSection>
        <LegalSection title="Retention and deletion">
          <p>We keep workspace data while your account is active. After cancellation you can export your data, and we delete it within 30 days unless the law requires us to keep it. You can ask us to delete or correct personal data at any time.</p>
        </LegalSection>
        <LegalSection title="Cookies">
          <p>We use strictly necessary cookies to keep you signed in (HttpOnly session cookies) and to remember preferences. We do not use advertising cookies.</p>
        </LegalSection>
        <LegalSection title="Your rights and contact">
          <p>You may request access, correction, export or deletion of your personal data. Email <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a> and we will respond within 30 days.</p>
          <p><em>This policy is a starting template. Have it reviewed by counsel for your jurisdiction before launch.</em></p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
