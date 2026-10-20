import { Suspense } from 'react';
import { ResetPasswordScreen } from '@/components/auth/AccountScreens';

export const metadata = { title: 'Choose a new password' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
