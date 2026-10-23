import { Suspense } from 'react';
import { AuthFallback } from '@/components/auth/AuthFallback';
import { PORTAL_AUTH_HEADING, PORTAL_AUTH_POINTS } from '@/features/portal/authCopy';
import { PortalResetScreen } from '@/features/portal/PortalAuthScreens';

export const metadata = { title: 'Client portal', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback title="Choose a new password" subtitle="You’ll be signed out everywhere and asked to sign in again." heading={PORTAL_AUTH_HEADING} points={PORTAL_AUTH_POINTS} fields={1} />}>
      <PortalResetScreen />
    </Suspense>
  );
}
