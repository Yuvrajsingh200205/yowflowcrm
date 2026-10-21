import { Suspense } from 'react';
import { PortalAcceptInviteScreen } from '@/features/portal/PortalAuthScreens';

export const metadata = { title: 'Client portal', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PortalAcceptInviteScreen />
    </Suspense>
  );
}
