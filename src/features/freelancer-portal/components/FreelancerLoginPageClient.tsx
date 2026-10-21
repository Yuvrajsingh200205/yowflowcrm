'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { freelancerPortalApi } from '@/lib/api/freelancerPortal';
import { safeReturnPath } from '@/lib/auth/routeProtection';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordField } from '@/components/auth/PasswordField';

export function FreelancerLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeReturnTo = safeReturnPath(searchParams.get('returnTo'));
  const returnTo = safeReturnTo.startsWith('/freelancer/') ? safeReturnTo : '/freelancer/dashboard';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const id = identifier.trim();
    const next = { identifier: id ? undefined : 'Enter your email or mobile number.', password: password ? undefined : 'Enter your password.' };
    setErrors(next);
    if (next.identifier || next.password) return;
    setSubmitting(true);
    try {
      await freelancerPortalApi.login({ identifier: id, password });
      router.replace(returnTo);
    } catch (error) {
      setPassword('');
      setMessage(error instanceof ApiError ? error.message : 'We couldn’t sign you in. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Freelancer sign in"
      subtitle="Manage your bookings, availability and payouts."
      footer={<>New here? <Link href="/freelancer/join" className="font-medium text-brand underline-offset-4 hover:underline">Submit an application</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {message && <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-bad-bg px-4 py-3 text-sm text-bad">{message}</div>}
        <Field label="Email or mobile" error={errors.identifier} required>
          {(a) => <Input id={a.id} name="identifier" autoComplete="username" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setMessage(''); }} aria-describedby={a.describedBy} invalid={a.invalid} autoFocus />}
        </Field>
        <PasswordField value={password} onChange={(v) => { setPassword(v); setMessage(''); }} error={errors.password} autoComplete="current-password" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-8 border-t border-line-soft pt-6 text-center text-sm text-fg-muted">Run a studio? <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">Studio login</Link></p>
    </AuthShell>
  );
}
