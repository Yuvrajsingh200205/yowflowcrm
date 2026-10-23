import { Suspense } from 'react';
import { AuthFallback } from '@/components/auth/AuthFallback';
import { PORTAL_AUTH_HEADING, PORTAL_AUTH_POINTS } from '@/features/portal/authCopy';
import { PortalForgotScreen } from '@/features/portal/PortalAuthScreens';

export const metadata = { title: 'Client portal', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback title="Reset your password" subtitle="Enter the email your studio invited and we’ll send a reset link." heading={PORTAL_AUTH_HEADING} points={PORTAL_AUTH_POINTS} fields={1} />}>
      <PortalForgotScreen />
    </Suspense>
  );
}
