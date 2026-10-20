'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { freelancerPortalApi } from '@/lib/api/freelancerPortal';
import { safeReturnPath } from '@/lib/auth/routeProtection';

export function FreelancerLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');
  const safeReturnTo = safeReturnPath(rawReturnTo);
  const returnTo = safeReturnTo.startsWith('/freelancer/') ? safeReturnTo : '/freelancer/dashboard';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setMessage('Please enter your email/mobile and password.');
      return;
    }
    setSubmitting(true);
    try {
      await freelancerPortalApi.login({ identifier: cleanIdentifier, password });
      router.replace(returnTo);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#F7FCEE] px-4 py-10 text-[#0D1816]">
      <section className="w-full max-w-md rounded-2xl border border-[#DFD9D2] bg-white p-7 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#191D15] text-[#C7E982]">
            <Camera className="size-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#292F22]">Freelancer Portal</p>
            <h1 className="text-3xl font-black">Sign in</h1>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-black text-[#1E2319]">Email or mobile</span>
            <span className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border border-[#DFD9D2] bg-white px-4 focus-within:border-[#292F22] focus-within:ring-4 focus-within:ring-[#EDF4F2]">
              <Mail className="size-5 shrink-0 text-[#292F22]" />
              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setMessage('');
                }}
                className="w-full bg-transparent text-base font-semibold outline-none"
                autoComplete="username"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#1E2319]">Password</span>
            <span className="mt-2 flex min-h-14 items-center gap-3 rounded-xl border border-[#DFD9D2] bg-white px-4 focus-within:border-[#292F22] focus-within:ring-4 focus-within:ring-[#EDF4F2]">
              <LockKeyhole className="size-5 shrink-0 text-[#292F22]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage('');
                }}
                className="w-full bg-transparent text-base font-semibold outline-none"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#292F22] transition hover:bg-[#EDF4F2]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {message ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-13 w-full rounded-xl bg-[#292F22] px-5 text-base font-black text-white transition hover:bg-[#22271C] disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-[#686164]">
          New here? <Link href="/freelancers/join" className="text-[#292F22] hover:underline">Submit an application</Link>
        </p>
      </section>
    </main>
  );
}
