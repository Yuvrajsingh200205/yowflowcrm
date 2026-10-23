import { Suspense } from 'react';
import { AuthFallback } from '@/components/auth/AuthFallback';
import { PORTAL_AUTH_HEADING, PORTAL_AUTH_POINTS } from '@/features/portal/authCopy';
import { PortalLoginScreen } from '@/features/portal/PortalAuthScreens';

export const metadata = { title: 'Client portal', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback title="Welcome back" subtitle="Sign in to see your gallery, payments and requests." heading={PORTAL_AUTH_HEADING} points={PORTAL_AUTH_POINTS} fields={2} />}>
      <PortalLoginScreen />
    </Suspense>
  );
}
