'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, TriangleAlert } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordField, isStrongPassword } from '@/components/auth/PasswordField';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { portalApi, errorMessage } from './api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEADING = 'Your wedding memories, in one private place.';
const POINTS = ['Watch your gallery the moment it is ready', 'Pick favourites and choose album photographs', 'Track payments, deliveries and requests'];
const link = 'font-medium text-brand underline-offset-4 hover:underline';

const Shell = (p: Omit<React.ComponentProps<typeof AuthShell>, 'heading' | 'points'>) => <AuthShell heading={HEADING} points={POINTS} {...p} />;
const FormError = ({ children }: { children: React.ReactNode }) => <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-bad-bg px-4 py-3 text-sm text-bad">{children}</div>;

/** Only same-app portal paths are honoured, so a crafted returnTo can never leave the site. */
const safePortalPath = (v: string | null) => (v && /^\/client\/(?!login|accept-invite|forgot-password|reset-password)[A-Za-z0-9/_\-?=&%.]*$/.test(v) && !v.includes('//') ? v : '/client');

export function PortalLoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('returnTo');
  const justReset = params.get('reset') === '1';
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errs, setErrs] = React.useState<{ email?: string; password?: string }>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { email: EMAIL_RE.test(email.trim()) ? undefined : 'Enter the email your studio invited.', password: password ? undefined : 'Enter your password.' };
    setErrs(next);
    if (next.email || next.password) return;
    setBusy(true); setError(null);
    try {
      await portalApi.login(email.trim(), password);
      router.replace(safePortalPath(returnTo));
    } catch (err) { setError(errorMessage(err, 'We couldn’t sign you in. Please try again.')); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Welcome back" subtitle="Sign in to see your gallery, payments and requests." footer={<>Photographer or studio team? <Link href="/login" className={link}>Sign in here</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {justReset && !error && <div role="status" className="rounded-[var(--radius-md)] border border-ok/40 bg-ok-bg px-4 py-3 text-sm text-ok">Your password was updated. Sign in with the new one.</div>}
        {error && <FormError>{error}</FormError>}
        <Field label="Email" error={errs.email} required>{(a) => <Input id={a.id} name="email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setErrs((s) => ({ ...s, email: undefined })); setError(null); }} aria-describedby={a.describedBy} invalid={a.invalid} autoFocus />}</Field>
        <PasswordField value={password} onChange={(v) => { setPassword(v); setErrs((s) => ({ ...s, password: undefined })); setError(null); }} error={errs.password} autoComplete="current-password" />
        <div className="flex justify-end"><Link href="/client/forgot-password" className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">Forgot password?</Link></div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </Shell>
  );
}

export function PortalAcceptInviteScreen() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [invite, setInvite] = React.useState<{ email: string; fullName: string; studioName: string } | null>(null);
  const [invalid, setInvalid] = React.useState(!token);
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [errs, setErrs] = React.useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    let live = true;
    portalApi.previewInvite(token).then((i) => live && setInvite(i)).catch(() => live && setInvalid(true));
    return () => { live = false; };
  }, [token]);

  if (invalid) {
    return (
      <Shell title="This invitation link has expired" subtitle="Invitation links work once and expire after a few days. Ask your studio to send a fresh one.">
        <div role="alert" className="grid place-items-center rounded-[var(--radius-xl)] border border-line-soft bg-surface py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-bad-bg text-bad"><TriangleAlert className="size-6" aria-hidden="true" /></span>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">Already set a password? <Link href="/client/login" className={link}>Sign in</Link>.</p>
        </div>
      </Shell>
    );
  }
  if (!invite) return <Shell title="Opening your invitation…"><div className="grid place-items-center py-10"><Spinner label="Checking your invitation" /></div></Shell>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { password: isStrongPassword(password) ? undefined : 'Use at least 10 characters with upper and lower case letters and a number.', confirm: confirm === password ? undefined : 'The passwords don’t match.' };
    setErrs(next);
    if (next.password || next.confirm) return;
    setBusy(true); setError(null);
    try { await portalApi.acceptInvite(token, password); router.replace('/client'); }
    catch (err) { setError(errorMessage(err, 'We couldn’t save your password. Please try again.')); }
    finally { setBusy(false); }
  };

  return (
    <Shell title={`Hello, ${invite.fullName.split(' ')[0]}`} subtitle={<>{invite.studioName} invited <strong className="text-fg">{invite.email}</strong> to your private portal. Choose a password to get started.</>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <PasswordField label="Create a password" value={password} onChange={(v) => { setPassword(v); setErrs((s) => ({ ...s, password: undefined })); }} error={errs.password} autoComplete="new-password" showRules />
        <PasswordField label="Confirm password" name="confirm" value={confirm} onChange={(v) => { setConfirm(v); setErrs((s) => ({ ...s, confirm: undefined })); }} error={errs.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={busy}>{busy ? 'Setting up…' : 'Set password and continue'}</Button>
      </form>
    </Shell>
  );
}

export function PortalForgotScreen() {
  const [email, setEmail] = React.useState('');
  const [err, setErr] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setErr('Enter a valid email address.'); return; }
    setBusy(true); setError(null);
    try { await portalApi.forgotPassword(email.trim()); setSent(true); }
    catch (e2) { setError(errorMessage(e2, 'We couldn’t send the email. Please try again.')); }
    finally { setBusy(false); }
  };
  if (sent) {
    return (
      <Shell title="Check your inbox" subtitle={<>If a portal exists for <strong className="text-fg">{email.trim()}</strong>, we’ve sent a link to reset your password. It expires in 1 hour.</>} footer={<Link href="/client/login" className={link}>Back to sign in</Link>}>
        <div role="status" className="grid place-items-center rounded-[var(--radius-xl)] border border-line-soft bg-surface py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-brand"><MailCheck className="size-6" aria-hidden="true" /></span>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">Didn’t get it? Check spam, or <button type="button" onClick={() => setSent(false)} className="cursor-pointer font-medium text-brand underline underline-offset-4">try again</button>.</p>
        </div>
      </Shell>
    );
  }
  return (
    <Shell title="Reset your password" subtitle="Enter the email your studio invited and we’ll send a reset link." footer={<Link href="/client/login" className={link}>Back to sign in</Link>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <Field label="Email" error={err} required>{(a) => <Input id={a.id} name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(undefined); }} aria-describedby={a.describedBy} invalid={a.invalid} autoFocus />}</Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
      </form>
    </Shell>
  );
}

export function PortalResetScreen() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState<string>();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  if (!token) return <Shell title="This reset link is not valid" subtitle="Request a new one and try again." footer={<Link href="/client/forgot-password" className={link}>Request a new link</Link>}><span /></Shell>;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(password)) { setErr('Use at least 10 characters with upper and lower case letters and a number.'); return; }
    setBusy(true); setError(null);
    try { await portalApi.resetPassword(token, password); router.replace('/client/login?reset=1'); }
    catch (e2) { setError(errorMessage(e2, 'This link may have expired. Request a new one.')); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Choose a new password" subtitle="You’ll be signed out everywhere and asked to sign in again." footer={<Link href="/client/login" className={link}>Back to sign in</Link>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <PasswordField label="New password" value={password} onChange={(v) => { setPassword(v); setErr(undefined); }} error={err} autoComplete="new-password" showRules />
        <Button type="submit" size="lg" className="w-full" loading={busy}>Update password</Button>
      </form>
    </Shell>
  );
}
