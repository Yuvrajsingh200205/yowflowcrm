'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { LoginInput } from '@/lib/api/auth';
import { LoginHero } from './LoginHero';
import { LoginFormCard } from './LoginFormCard';
import { LoginToast } from './LoginToast';
import { BRAND } from '@/config/brand';

interface LoginScreenProps {
  onLogin: (input: LoginInput) => Promise<void>;
  onAddTeamMember?: unknown;
  onClose?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const remembered = window.localStorage.getItem(`${BRAND.cookiePrefix}-remembered-account`);
    if (remembered) setIdentifier(remembered);
    setIsDark(window.localStorage.getItem(`${BRAND.cookiePrefix}-login-theme`) === 'dark');
  }, []);

  const selectTheme = (dark: boolean) => {
    setIsDark(dark);
    window.localStorage.setItem(`${BRAND.cookiePrefix}-login-theme`, dark ? 'dark' : 'light');
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const submittedIdentifier = String(formData.get('identifier') ?? identifier).trim();
    const submittedPassword = String(formData.get('password') ?? password).trim();

    if (!submittedIdentifier || !submittedPassword) {
      setMessage({ type: 'error', text: 'Please enter your email/username and password.' });
      return;
    }

    setIdentifier(submittedIdentifier);
    setPassword('');
    if (rememberMe) window.localStorage.setItem(`${BRAND.cookiePrefix}-remembered-account`, submittedIdentifier);
    else window.localStorage.removeItem(`${BRAND.cookiePrefix}-remembered-account`);
    setIsSubmitting(true);
    try {
      await onLogin({ email: submittedIdentifier, password: submittedPassword });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 z-60 min-h-dvh overflow-x-hidden overflow-y-auto bg-[#2d101e] bg-[radial-gradient(circle_at_12%_10%,#6f2841_0,transparent_29%),radial-gradient(circle_at_85%_90%,#5d2038_0,transparent_26%)] text-[#38242c] lg:h-dvh lg:overflow-hidden lg:px-[3vw] lg:pb-2 lg:pt-4">
      <Link
        href="/"
        aria-label="Go to home page"
        title="Go to home page"
        className="fixed left-5 top-5 z-70 grid size-11 place-items-center rounded-full border border-white/25 bg-white/12 text-white shadow-[0_12px_28px_rgba(12,2,8,.28)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/22 lg:left-[calc(3vw+14px)] lg:top-7"
      >
        <ArrowLeft className="size-5.5" />
      </Link>
      <div className="mx-auto grid min-h-dvh w-full overflow-hidden bg-[#f4e8e2] shadow-[0_35px_100px_rgba(12,2,8,.48)] lg:h-[calc(100dvh-54px)] lg:min-h-0 lg:max-w-360 lg:grid-cols-[46%_54%] lg:rounded-[30px] lg:border lg:border-[rgba(255,226,210,.6)] xl:grid-cols-[48%_52%]">
        <LoginHero />
        <LoginFormCard
          identifier={identifier} password={password} rememberMe={rememberMe}
          showPassword={showPassword} isDark={isDark} message={message}
          onIdentifierChange={(value) => { setIdentifier(value); setMessage(null); }}
          onPasswordChange={(value) => { setPassword(value); setMessage(null); }}
          onRememberChange={(value) => {
            setRememberMe(value);
            setMessage({ type: 'info', text: value ? 'Remember me enabled' : 'Remember me disabled' });
          }}
          onPasswordVisibility={() => setShowPassword((value) => !value)}
          onThemeChange={selectTheme}
          onForgotPassword={() => setMessage({ type: 'info', text: 'Please contact your administrator to reset your password.' })}
          onGoogleLogin={() => setMessage({ type: 'info', text: 'Google sign-in is not configured for this CRM.' })}
          onSubmit={handleLogin}
          isSubmitting={isSubmitting}
        />
        {onClose && <button type="button" onClick={onClose} aria-label="Close login" className="fixed right-4 top-4 z-70 rounded-full p-2 text-[#7d5c66] hover:bg-white/40"><X className="size-5" /></button>}
      </div>
      <footer className="hidden h-9 items-center justify-center gap-2.5 pt-2 text-xs font-extrabold uppercase tracking-[.12em] text-[#d9bdc4] lg:flex">
        {BRAND.name} © 2026 <span>·</span> <Heart className="size-3 fill-[#d56686] text-[#d56686]" /> Made with passion
      </footer>
      <LoginToast message={message} onDismiss={() => setMessage(null)} />
    </main>
  );
};
