import { Suspense } from 'react';
import { VerifyEmailScreen } from '@/components/auth/AccountScreens';

export const metadata = { title: 'Verify email' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailScreen />
    </Suspense>
  );
}
