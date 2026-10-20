import { Suspense } from 'react';
import { ForgotPasswordScreen } from '@/components/auth/AccountScreens';

export const metadata = { title: 'Reset password' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
