import { Suspense } from 'react';
import { ForgotPasswordScreen } from '@/components/auth/AccountScreens';
import { AuthFallback } from '@/components/auth/AuthFallback';

export const metadata = { title: 'Reset password' };

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback title="Reset your password" subtitle="Enter the email you signed up with and we’ll send you a reset link." fields={1} />}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
