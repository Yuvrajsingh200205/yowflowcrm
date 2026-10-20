'use client';

import * as React from 'react';
import { MailWarning, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { accountApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/** Shown to signed-in users whose email address is not verified yet. */
export function VerifyEmailBanner({ email, verified }: { email?: string; verified?: boolean }) {
  const { toast } = useToast();
  const [hidden, setHidden] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  if (verified !== false || hidden) return null;

  const resend = async () => {
    setBusy(true);
    try {
      const r = await accountApi.resendVerification();
      toast({ tone: 'success', title: r.alreadyVerified ? 'Already verified' : 'Verification email sent', description: r.alreadyVerified ? undefined : `Check ${email ?? 'your inbox'}.` });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t send the email', description: e instanceof ApiError ? e.message : 'Try again in a minute.' });
    } finally { setBusy(false); }
  };

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-warn/30 bg-warn-bg px-4 py-2.5 text-[13px] text-fg sm:px-6">
      <MailWarning className="size-4 shrink-0 text-warn" aria-hidden="true" />
      <p className="min-w-0 flex-1">Verify your email{email ? <> (<strong className="font-medium">{email}</strong>)</> : null} to secure your account and receive important notices.</p>
      <Button size="sm" variant="secondary" loading={busy} onClick={resend}>Resend email</Button>
      <button type="button" aria-label="Dismiss" onClick={() => setHidden(true)} className="grid size-7 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-[var(--hover)] hover:text-fg"><X className="size-4" /></button>
    </div>
  );
}
