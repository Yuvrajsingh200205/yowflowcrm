'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api/client';
import { LoginInput } from '@/lib/api/auth';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Field';
import { AuthShell } from './AuthShell';
import { PasswordField } from './PasswordField';

interface LoginScreenProps {
  onLogin: (input: LoginInput) => Promise<void>;
  onAddTeamMember?: unknown;
  onClose?: () => void;
}

const REMEMBER_KEY = `${BRAND.cookiePrefix}-remembered-account`;

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try { const r = window.localStorage.getItem(REMEMBER_KEY); if (r) setIdentifier(r); } catch { /* storage unavailable */ }
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const id = identifier.trim();
    const errs = { identifier: id ? undefined : 'Enter your email address.', password: password ? undefined : 'Enter your password.' };
    setFieldErrors(errs);
    if (errs.identifier || errs.password) return;

    try { if (rememberMe) window.localStorage.setItem(REMEMBER_KEY, id); else window.localStorage.removeItem(REMEMBER_KEY); } catch { /* ignore */ }
    setIsSubmitting(true);
    try {
      await onLogin({ email: id, password });
    } catch (e) {
      setPassword('');
      setError(e instanceof ApiError ? e.message : 'We couldn’t sign you in. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your studio workspace."
      footer={<>New to {BRAND.name}? <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">Start a free trial</Link></>}
    >
      <form onSubmit={handleLogin} noValidate className="space-y-5">
        {error && <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</div>}
        <Field label="Email" error={fieldErrors.identifier} required>
          {(a) => <Input id={a.id} name="identifier" type="email" inputMode="email" autoComplete="username" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(null); }} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="you@studio.com" autoFocus />}
        </Field>
        <PasswordField value={password} onChange={(v) => { setPassword(v); setError(null); }} error={fieldErrors.password} autoComplete="current-password" />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <Link href="/forgot-password" className="text-sm font-medium text-brand underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-8 border-t border-line-soft pt-6 text-center text-sm text-fg-muted">
        Freelancer? <Link href="/freelancer/login" className="font-medium text-fg underline-offset-4 hover:underline">Freelancer login</Link>
        <span className="mx-2 text-fg-subtle" aria-hidden="true">·</span>
        Client? <Link href="/client/login" className="font-medium text-fg underline-offset-4 hover:underline">Client portal</Link>
      </p>
    </AuthShell>
  );
};
