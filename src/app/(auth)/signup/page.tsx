import { Suspense } from 'react';
import { SignupScreen } from '@/components/auth/AccountScreens';

export const metadata = { title: 'Start your free trial' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupScreen />
    </Suspense>
  );
}
