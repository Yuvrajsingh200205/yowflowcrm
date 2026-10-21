'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { LoginInput } from '@/lib/api/auth';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { safeReturnPath } from '@/lib/auth/routeProtection';
import { destinationForAuthenticatedUser } from '@/lib/auth/accountRouting';

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isHydrated, login } = useAuthSession();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));
  const loginRedirectingRef = useRef(false);

  useEffect(() => {
    // Keep the heavy CRM bundle warm, but do not prefetch protected routes
    // before authentication. A pre-login prefetch can cache the redirected
    // unauthenticated route payload, so the post-login replace lands on a page
    // whose data hooks never ran until a manual browser refresh.
    // Deferred to idle time so it never competes with the login screen's own load.
    const warm = () => { void import('@/components/app/CrmApplication'); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warm, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isHydrated && currentUser && !loginRedirectingRef.current) {
      router.replace(destinationForAuthenticatedUser(currentUser, returnTo));
    }
  }, [currentUser, isHydrated, returnTo, router]);

  const handleLogin = async (input: LoginInput) => {
    loginRedirectingRef.current = true;
    try {
      const user = await login(input);
      router.replace(destinationForAuthenticatedUser(user, returnTo));
    } catch (error) {
      loginRedirectingRef.current = false;
      throw error;
    }
  };

  return <LoginScreen onLogin={handleLogin} />;
}
