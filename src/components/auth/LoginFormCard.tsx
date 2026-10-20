import React from 'react';
import { ArrowRight, Camera, Check, Eye, EyeOff, LockKeyhole, Moon, ShieldCheck, Sun, Users } from 'lucide-react';

type Message = { type: 'error' | 'info'; text: string } | null;

interface LoginFormCardProps {
  identifier: string;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
  isDark: boolean;
  message: Message;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onPasswordVisibility: () => void;
  onThemeChange: (dark: boolean) => void;
  onForgotPassword: () => void;
  onGoogleLogin: () => void;
  isSubmitting?: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const benefits = [
  { icon: Camera, title: 'All in One Place', detail: 'Manage everything seamlessly' },
  { icon: Users, title: 'Team Collaboration', detail: 'Work together efficiently' },
  { icon: ShieldCheck, title: 'Secure & Reliable', detail: 'Your data is always protected' },
];

export function LoginFormCard(props: LoginFormCardProps) {
  const { isDark } = props;
  const panel = isDark ? 'bg-[#181917] text-[#f7ece8]' : 'bg-[radial-gradient(circle_at_80%_8%,rgba(214,164,151,.28),transparent_26%),linear-gradient(145deg,#f9eee9,#ead9d2)]';
  const card = isDark ? 'border-[#3B4039] bg-[rgba(33,36,31,.94)]' : 'border-white/90 bg-[rgba(255,252,250,.86)]';
  const field = isDark ? 'border-[#3F443C] bg-[#1a2522] text-white' : 'border-[#dbcac5] bg-white/85 text-[#272A26]';

  return (
    <section className={`relative px-3.5 pb-7 pt-4 sm:px-[6vw] sm:pb-11 sm:pt-6 lg:h-full lg:overflow-y-auto lg:px-[clamp(24px,4vw,56px)] lg:py-4 ${panel}`}>
      <div className="mb-4 flex justify-end sm:mb-5 lg:mb-3">
        <div className={`inline-flex rounded-full border p-1 shadow-sm ${isDark ? 'border-white/10 bg-black/20' : 'border-[#CDD0CB] bg-white/55'}`} role="group" aria-label="Choose appearance">
          <ThemeButton label="Light mode" active={!isDark} isDark={isDark} onClick={() => props.onThemeChange(false)}><Sun className="size-4.5" /></ThemeButton>
          <ThemeButton label="Dark mode" active={isDark} isDark={isDark} onClick={() => props.onThemeChange(true)}><Moon className="size-4.5" /></ThemeButton>
        </div>
      </div>

      <div className={`relative mx-auto w-full max-w-180 overflow-hidden rounded-[22px] border px-5 py-7.5 shadow-[0_25px_60px_rgba(40,43,39,.14)] backdrop-blur-2xl sm:px-[clamp(28px,7vw,58px)] sm:py-9.5 lg:rounded-[28px] lg:px-[clamp(28px,4vw,52px)] lg:py-7 ${card}`}>
        <div className="mb-5 flex items-center gap-3 lg:mb-4">
          <span className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-[#f9e4ca] text-[#4A5047] lg:size-12"><ShieldCheck className="size-5.5" /></span>
          <div><strong className="block text-base font-extrabold uppercase tracking-[.04em]">Secure Access Portal</strong><small className={`mt-1 block text-sm leading-relaxed sm:text-[15px] ${isDark ? 'text-[#BEC3BB]' : 'text-[#8b7b7d]'}`}>Your data is protected with enterprise grade security</small></div>
        </div>

        <header><h2 className={`font-serif text-[clamp(34px,6vw,44px)] font-medium leading-[1.12] 2xl:text-5xl ${isDark ? 'text-[#969F92]' : 'text-[#4B5248]'}`}>Login to Your Account</h2><p className={`mt-2 text-base leading-relaxed sm:text-[17px] ${isDark ? 'text-[#BEC3BB]' : 'text-[#8b7d7e]'}`}>Enter your credentials to continue to your dashboard</p></header>

        <form onSubmit={props.onSubmit} noValidate className="mt-6 lg:mt-5">
          <FieldLabel htmlFor="login-identifier">Email or Username</FieldLabel>
          <div className={`flex min-h-14 items-center gap-3.5 rounded-[15px] border px-4.5 py-2.5 transition-all duration-200 focus-within:border-[#5B6257] focus-within:shadow-[0_0_0_4px_rgba(83,90,80,.12)] lg:min-h-15 ${field}`}>
            <Users className="size-5.5 shrink-0 text-[#5B6257]" /><input id="login-identifier" name="identifier" value={props.identifier} onChange={(event) => props.onIdentifierChange(event.target.value)} placeholder="Enter your email or username" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-[#a99ca0] focus-visible:!outline-none" />
          </div>

          <div className="mt-5 lg:mt-4"><FieldLabel htmlFor="login-password">Password</FieldLabel></div>
          <div className={`flex min-h-14 items-center gap-3.5 rounded-[15px] border px-4.5 py-2.5 transition-all duration-200 focus-within:border-[#5B6257] focus-within:shadow-[0_0_0_4px_rgba(83,90,80,.12)] lg:min-h-15 ${field}`}>
            <LockKeyhole className="size-5.5 shrink-0 text-[#5B6257]" /><input id="login-password" name="password" type={props.showPassword ? 'text' : 'password'} value={props.password} onChange={(event) => props.onPasswordChange(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-[#a99ca0] focus-visible:!outline-none" />
            <button type="button" onClick={props.onPasswordVisibility} aria-label={props.showPassword ? 'Hide password' : 'Show password'} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#928689] transition hover:bg-[#535A50]/10 hover:text-[#5B6257]">{props.showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
          </div>

          <div className="my-4 flex items-start justify-between gap-4 text-base font-bold sm:items-center">
            <label className="group flex cursor-pointer items-center gap-2.5"><input type="checkbox" checked={props.rememberMe} onChange={(event) => props.onRememberChange(event.target.checked)} className="peer sr-only" /><span className="grid size-5.5 shrink-0 place-items-center rounded-md border border-[#98A094] bg-white/10 transition peer-checked:border-[#5B6257] peer-checked:bg-[#5B6257] peer-focus-visible:ring-3 peer-focus-visible:ring-[#535A50]/20"><Check className={`size-4 stroke-3 text-white transition ${props.rememberMe ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} /></span><span>Remember me</span></label>
            <button type="button" onClick={props.onForgotPassword} className={isDark ? 'text-[#CACFC8]' : 'text-[#494E46]'}>Forgot Password?</button>
          </div>

          <button type="submit" disabled={props.isSubmitting} className="relative flex min-h-15 w-full items-center justify-center rounded-[15px] bg-linear-to-r from-[#40453E] to-[#333731] px-13 text-lg font-bold text-white shadow-[0_12px_25px_rgba(58,63,56,.23)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"><span>{props.isSubmitting ? 'Signing in…' : 'Login to Dashboard'}</span><i className="absolute right-2.5 grid size-10 place-items-center rounded-full bg-[#575E54]"><ArrowRight className="size-5.5" /></i></button>
          <div className="my-4 flex items-center gap-3 text-sm text-[#8d7e80]"><span className="h-px flex-1 bg-[#e4d7d2]" />OR<span className="h-px flex-1 bg-[#e4d7d2]" /></div>
          <button type="button" onClick={props.onGoogleLogin} className={`min-h-14 w-full rounded-[15px] border border-[#949C90] text-[17px] font-semibold ${isDark ? 'bg-[#1a2522] text-white' : 'bg-white/45 text-[#645558]'}`}><b className="mr-2 text-xl text-[#4285f4]">G</b> Continue with Google</button>
        </form>

        <div className={`mt-5 grid grid-cols-1 divide-y border-t pt-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 ${isDark ? 'divide-[#3D423B] border-[#3D423B]' : 'divide-[#D5D8D3] border-[#eadeda]'}`}>
          {benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="grid grid-cols-[48px_1fr] gap-x-3 py-4 text-left first:pt-0 last:pb-0 sm:flex sm:flex-col sm:items-center sm:px-4 sm:py-0 sm:text-center"><span className="row-span-2 grid size-12 place-items-center rounded-full border border-[#efd3d6] bg-[#f9e9e9] text-[#535A50]"><Icon className="size-5.5" /></span><strong className={`text-[15px] leading-snug ${isDark ? 'text-[#969F92]' : 'text-[#4B5248]'}`}>{title}</strong><small className={`mt-1 block text-sm leading-snug ${isDark ? 'text-[#D0D3CE]' : 'text-[#6f6064]'}`}>{detail}</small></div>)}
        </div>
      </div>
    </section>
  );
}

function ThemeButton({ label, active, isDark, onClick, children }: { label: string; active: boolean; isDark: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} aria-pressed={active} className={`grid size-9 place-items-center rounded-full transition ${active ? 'bg-[#535A50] text-white shadow-sm' : isDark ? 'text-[#C1C6BE] hover:bg-white/10' : 'text-[#725f65] hover:bg-white/70'}`}>{children}</button>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-[17px] font-extrabold sm:text-lg">{children}</label>;
}
