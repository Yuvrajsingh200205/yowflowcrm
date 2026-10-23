import { Suspense } from 'react';
import { LoginPageClient } from '@/components/auth/LoginPageClient';
import { AuthFallback } from '@/components/auth/AuthFallback';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback title="Welcome back" subtitle="Sign in to your studio workspace." fields={3} />}>
      <LoginPageClient />
    </Suspense>
  );
}
