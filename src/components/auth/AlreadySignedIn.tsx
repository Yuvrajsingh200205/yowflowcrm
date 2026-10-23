'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { destinationForAuthenticatedUser } from '@/lib/auth/accountRouting';
import { useAuthSession, type AuthenticatedUser } from './AuthSessionProvider';
import { AuthShell } from './AuthShell';

/**
 * Shown instead of silently redirecting when someone who is already signed in opens the sign-in or sign-up page.
 * They can carry on to their workspace, or sign out and use a different account.
 */
export function AlreadySignedIn({ user, intent }: { user: AuthenticatedUser; intent: 'login' | 'signup' }) {
  const router = useRouter();
  const { logout } = useAuthSession();
  const [busy, setBusy] = React.useState(false);
  const signOut = async () => { setBusy(true); await logout(); setBusy(false); router.refresh(); };
  return (
    <AuthShell
      title={intent === 'signup' ? 'You’re already signed in' : 'Welcome back'}
      subtitle={<>You’re signed in as <strong className="text-fg">{user.name}</strong>{user.organization?.name ? <> · {user.organization.name}</> : null}.{intent === 'signup' ? ' To start a different workspace, sign out first.' : ''}</>}
    >
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={() => router.replace(destinationForAuthenticatedUser(user, null))}>Continue to {user.freelancerProfile ? 'my portal' : 'dashboard'}</Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={signOut} loading={busy}><LogOut />{intent === 'signup' ? 'Sign out and start a new workspace' : 'Sign out and use another account'}</Button>
      </div>
    </AuthShell>
  );
}
