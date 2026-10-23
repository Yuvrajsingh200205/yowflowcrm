'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, MailCheck, TriangleAlert } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { accountApi } from '@/lib/api/auth';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useAuthSession } from './AuthSessionProvider';
import { AlreadySignedIn } from './AlreadySignedIn';
import { AuthShell } from './AuthShell';
import { PasswordField, isStrongPassword } from './PasswordField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

function FormError({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-bad-bg px-4 py-3 text-sm text-bad">{children}</div>;
}

/* ───────────────────────────── Signup ───────────────────────────── */
export function SignupScreen() {
  const { currentUser, isHydrated } = useAuthSession();
  if (isHydrated && currentUser) return <AlreadySignedIn user={currentUser} intent="signup" />;
  return <SignupForm />;
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = (['starter', 'studio', 'scale'] as const).find((p) => p === params.get('plan'));
  const [f, setF] = React.useState({ studioName: '', fullName: '', email: '', password: '' });
  const [errs, setErrs] = React.useState<Partial<Record<keyof typeof f, string>>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const set = (k: keyof typeof f) => (v: string) => { setF((s) => ({ ...s, [k]: v })); setErrs((s) => ({ ...s, [k]: undefined })); setError(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      studioName: f.studioName.trim().length >= 2 ? undefined : 'Enter your studio name.',
      fullName: f.fullName.trim().length >= 2 ? undefined : 'Enter your name.',
      email: EMAIL_RE.test(f.email.trim()) ? undefined : 'Enter a valid email, like name@studio.com.',
      password: isStrongPassword(f.password) ? undefined : 'Use at least 10 characters with upper and lower case letters and a number.',
    };
    setErrs(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true); setError(null);
    try {
      const email = f.email.trim();
      await accountApi.signup({ ...f, email, plan });
      // Creating the workspace does not sign anyone in: the owner signs in on
      // the login page with the credentials they just chose.
      router.replace(`/login?registered=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(msg(err, 'We couldn’t create your workspace. Check your connection and try again.'));
    } finally { setBusy(false); }
  };

  return (
    <AuthShell
      title="Start your free trial"
      subtitle="14 days, no credit card. Set up your studio workspace in a minute."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <Field label="Studio name" error={errs.studioName} required>{(a) => <Input id={a.id} name="organization" autoComplete="organization" value={f.studioName} onChange={(e) => set('studioName')(e.target.value)} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="Lumen Studio" autoFocus />}</Field>
        <Field label="Your name" error={errs.fullName} required>{(a) => <Input id={a.id} name="name" autoComplete="name" value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="Asha Rao" />}</Field>
        <Field label="Work email" error={errs.email} required>{(a) => <Input id={a.id} name="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => set('email')(e.target.value)} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="you@studio.com" />}</Field>
        <PasswordField value={f.password} onChange={set('password')} error={errs.password} autoComplete="new-password" showRules />
        <Button type="submit" size="lg" className="w-full" loading={busy}>{busy ? 'Creating your workspace…' : 'Create workspace'}</Button>
        <p className="text-center text-xs text-fg-subtle">By continuing you agree to the <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
      </form>
    </AuthShell>
  );
}

/* ───────────────────────── Forgot password ───────────────────────── */
export function ForgotPasswordScreen() {
  const [email, setEmail] = React.useState('');
  const [err, setErr] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setErr('Enter a valid email, like name@studio.com.'); return; }
    setBusy(true); setError(null);
    try { await accountApi.forgotPassword(email.trim()); setSent(true); }
    catch (e2) { setError(msg(e2, 'We couldn’t send the email. Check your connection and try again.')); }
    finally { setBusy(false); }
  };

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle={<>If an account exists for <strong className="text-fg">{email.trim()}</strong>, we’ve sent a link to reset your password. It expires in 1 hour.</>} footer={<Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Back to sign in</Link>}>
        <div role="status" className="grid place-items-center rounded-[var(--radius-xl)] border border-line-soft bg-surface py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-brand"><MailCheck className="size-6" aria-hidden="true" /></span>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">Didn’t get it? Check spam, or <button type="button" onClick={() => setSent(false)} className="cursor-pointer font-medium text-brand underline underline-offset-4">try again</button>.</p>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you signed up with and we’ll send you a reset link." footer={<Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error}</FormError>}
        <Field label="Email" error={err} required>{(a) => <Input id={a.id} name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(undefined); }} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="you@studio.com" autoFocus />}</Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
      </form>
    </AuthShell>
  );
}

/* ───────────────────────── Reset password ───────────────────────── */
export function ResetPasswordScreen() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const { toast } = useToast();
  const [pw, setPw] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [errs, setErrs] = React.useState<{ pw?: string; confirm?: string }>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (!token) {
    return (
      <AuthShell title="This link isn’t valid" subtitle="The reset link is missing or incomplete. Request a new one." footer={<Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Back to sign in</Link>}>
        <Button asChild size="lg" className="w-full"><Link href="/forgot-password">Request a new link</Link></Button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { pw: isStrongPassword(pw) ? undefined : 'Use at least 10 characters with upper and lower case letters and a number.', confirm: pw === confirm ? undefined : 'The passwords don’t match.' };
    setErrs(next);
    if (next.pw || next.confirm) return;
    setBusy(true); setError(null);
    try {
      await accountApi.resetPassword(token, pw);
      toast({ tone: 'success', title: 'Password updated', description: 'Sign in with your new password.' });
      router.replace('/login');
    } catch (e2) { setError(msg(e2, 'We couldn’t reset your password. Request a new link and try again.')); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="You’ll be signed out everywhere else once it’s changed.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <FormError>{error} <Link href="/forgot-password" className="font-medium underline">Request a new link</Link></FormError>}
        <PasswordField label="New password" name="new-password" value={pw} onChange={(v) => { setPw(v); setErrs((s) => ({ ...s, pw: undefined })); }} error={errs.pw} autoComplete="new-password" showRules />
        <PasswordField label="Confirm new password" name="confirm-password" value={confirm} onChange={(v) => { setConfirm(v); setErrs((s) => ({ ...s, confirm: undefined })); }} error={errs.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={busy}>Update password</Button>
      </form>
    </AuthShell>
  );
}

/* ───────────────────────── Verify email ───────────────────────── */
export function VerifyEmailScreen() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = React.useState<'working' | 'ok' | 'bad'>(token ? 'working' : 'bad');
  const [reason, setReason] = React.useState<string>('');
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    accountApi.verifyEmail(token).then(() => setState('ok')).catch((e) => { setReason(msg(e, '')); setState('bad'); });
  }, [token]);

  return (
    <AuthShell title={state === 'ok' ? 'Email verified' : state === 'bad' ? 'We couldn’t verify that link' : 'Verifying your email…'}>
      <div role="status" aria-live="polite" className="grid place-items-center rounded-[var(--radius-xl)] border border-line-soft bg-surface px-6 py-12 text-center">
        {state === 'working' && <Spinner label="Verifying" className="[&_svg]:size-7 text-brand" />}
        {state === 'ok' && (<><span className="grid size-14 place-items-center rounded-full bg-ok-bg text-ok"><CheckCircle2 className="size-6" aria-hidden="true" /></span><p className="mt-4 text-sm text-fg-muted">Thanks — your email address is confirmed.</p><Button asChild className="mt-6"><Link href="/dashboard">Continue to {BRAND.name}</Link></Button></>)}
        {state === 'bad' && (<><span className="grid size-14 place-items-center rounded-full bg-bad-bg text-bad"><TriangleAlert className="size-6" aria-hidden="true" /></span><p className="mt-4 max-w-xs text-sm text-fg-muted">{reason || 'This link is invalid or has expired.'} Sign in and use “Resend verification” to get a new one.</p><Button asChild variant="secondary" className="mt-6"><Link href="/login">Go to sign in</Link></Button></>)}
      </div>
    </AuthShell>
  );
}
