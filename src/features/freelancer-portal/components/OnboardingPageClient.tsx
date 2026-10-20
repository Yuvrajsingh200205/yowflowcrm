'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { freelancerPortalApi, OnboardingValidation } from '@/lib/api/freelancerPortal';

const field = 'mt-1 h-12 w-full rounded-lg border border-[#ddd5cf] bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#292F22] focus:ring-2 focus:ring-[#292F22]/20';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1C2018] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#191D15] disabled:cursor-not-allowed disabled:opacity-60';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#ddd5cf] bg-white px-4 py-2 text-sm font-black text-[#191D15] transition hover:bg-[#F8FBF2]';

function messageFor(status: OnboardingValidation['status'] | 'missing') {
  if (status === 'expired') return { title: 'This invitation has expired.', text: 'Contact the studio team and ask them to send a fresh onboarding invitation.', action: 'Contact the studio' };
  if (status === 'used') return { title: 'This invitation has already been used.', text: 'Your password has already been created. Continue to freelancer login.', action: 'Go to Freelancer Login' };
  if (status === 'revoked') return { title: 'This invitation is no longer active.', text: 'A newer invitation may have been issued. Use the latest link from the studio.', action: 'Contact the studio' };
  return { title: 'We could not verify this invitation.', text: 'Check that you opened the full link from the studio. The token was not saved on this device.', action: 'Contact the studio' };
}

export function OnboardingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState<OnboardingValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function validate() {
      setLoading(true);
      setError('');
      try {
        if (!token) {
          if (active) setState({ valid: false, status: 'invalid' });
          return;
        }
        const result = await freelancerPortalApi.validateOnboarding(token);
        if (active) setState(result);
      } catch {
        if (active) setState({ valid: false, status: 'invalid' });
      } finally {
        if (active) setLoading(false);
      }
    }
    void validate();
    return () => { active = false; };
  }, [token]);

  const passwordHelp = useMemo(() => {
    const checks = [
      { label: 'At least 8 characters', ok: password.length >= 8 },
      { label: 'Passwords match', ok: Boolean(password) && password === confirmPassword },
    ];
    return checks;
  }, [password, confirmPassword]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!token || !state?.valid) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await freelancerPortalApi.setOnboardingPassword(token, { password, confirmPassword });
      router.replace('/login?returnTo=/freelancer/dashboard');
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Unable to create password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#FBFDF6] px-5">
        <div className="text-center text-sm font-bold text-slate-600"><Loader2 className="mx-auto mb-3 size-5 animate-spin text-[#292F22]" />Checking invitation...</div>
      </main>
    );
  }

  if (!state?.valid) {
    const copy = messageFor(state?.status ?? 'missing');
    return (
      <main className="min-h-screen bg-[#FBFDF6] px-5 py-10">
        <section className="mx-auto max-w-xl rounded-lg border border-[#eee7e2] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-amber-50 text-amber-700"><AlertCircle className="size-6" /></div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{copy.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">{copy.text}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {state?.status === 'used' ? <Link className={primary} href="/login?returnTo=/freelancer/dashboard">Go to Login</Link> : <Link className={secondary} href="/contact"><Mail className="size-4" />{copy.action}</Link>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFDF6] px-5 py-8 sm:py-12">
      <section className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[#eee7e2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#292F22]">Freelancer onboarding</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Welcome, {state.freelancer?.displayName}</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Create your portal password. After this, you will sign in through the freelancer login page.</p>
            </div>
          </div>

          <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
            <label>
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Password</span>
              <input className={field} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} />
            </label>
            <label>
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Confirm password</span>
              <input className={field} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} />
            </label>
            <div className="grid gap-2 rounded-lg border border-[#eee7e2] bg-[#FBFDF6] p-3">
              {passwordHelp.map((item) => (
                <p key={item.label} className={`flex items-center gap-2 text-xs font-bold ${item.ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                  <CheckCircle2 className="size-4" />{item.label}
                </p>
              ))}
            </div>
            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <button className={primary} disabled={submitting} type="submit">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {submitting ? 'Creating password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
