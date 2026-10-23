import { Suspense } from 'react';
import { SignupScreen } from '@/components/auth/AccountScreens';
import { AuthFallback } from '@/components/auth/AuthFallback';

export const metadata = { title: 'Start your free trial' };

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback title="Start your free trial" subtitle="14 days, no credit card. Set up your studio workspace in a minute." fields={4} />}>
      <SignupScreen />
    </Suspense>
  );
}
