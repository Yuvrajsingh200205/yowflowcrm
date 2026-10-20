'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { z } from 'zod';
import { ArrowRight, Camera, Check, CreditCard, Eye, EyeOff, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import { comparisonRows, plans, type BillingCycle } from './data';
import { FreelancerLanding } from './landing/FreelancerLanding';
import { saveMockFreelancerAccount } from './mockFreelancerStore';
import { BRAND } from '@/config/brand';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const container = 'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10';
const cta = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#959E91] to-[#5A6256] px-5 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(90,98,86,.28)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#C7E982] active:scale-[.97]';

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(8, 'Enter a valid phone number.'),
  city: z.string().trim().min(2, 'Enter your base city.'),
  studioName: z.string().trim().min(2, 'Enter your studio or brand name.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;
type Errors = Partial<Record<keyof CheckoutForm, string>>;

export function FreelancerLandingPage() {
  return <FreelancerLanding />;
}

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  return (
    <div className="min-h-screen bg-[#F7FCEE] text-[#0D1816]">
      <FreelancerNav active="pricing" light />
      <main className={`${container} pb-20 pt-32`}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#4F554C]">Freelancer pricing</p>
          <h1 className="mt-3 font-[var(--font-display)] text-5xl font-black leading-tight">Choose the plan that fits your wedding season.</h1>
          <div className="mx-auto mt-7 inline-flex rounded-full border border-[#EDE8E2] bg-white p-1 shadow-sm">{(['monthly', 'yearly'] as BillingCycle[]).map((item) => <button key={item} type="button" onClick={() => setCycle(item)} className={`rounded-full px-5 py-2 text-sm font-black capitalize transition ${cycle === item ? 'bg-[#1F211E] text-white' : 'text-[#3A3F38] hover:bg-[#EDF4F2]'}`}>{item}</button>)}</div>
          <p className="mt-3 text-sm font-bold text-[#2E8B57]">{cycle === 'yearly' ? 'Yearly billing saves roughly two months compared with monthly.' : 'Switch to yearly to unlock the freelancer season saver.'}</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} cycle={cycle} />)}</div>
        <section className="mt-12 overflow-hidden rounded-2xl border border-[#EDE8E2] bg-white">
          <div className="grid grid-cols-2 border-b border-[#EDE8E2] bg-[#FBFDF6] p-4 text-xs font-black uppercase tracking-[.1em] text-[#3A3F38] sm:grid-cols-4"><span>Feature</span><span>Starter</span><span>Pro</span><span>Studio</span></div>
          {comparisonRows.map((row) => <div key={row.feature} className="grid grid-cols-2 border-b border-[#EDE8E2] p-4 text-sm last:border-b-0 sm:grid-cols-4"><strong>{row.feature}</strong><span>{row.starter}</span><span>{row.pro}</span><span>{row.studio}</span></div>)}
        </section>
      </main>
    </div>
  );
}

function PlanCard({ plan, cycle }: { plan: typeof plans[number]; cycle: BillingCycle }) {
  const price = cycle === 'monthly' ? plan.monthly : plan.yearly;
  const popular = Boolean(plan.badge);
  return <article className={`relative rounded-2xl border bg-white p-6 shadow-[0_2px_12px_rgba(13,24,22,.06)] transition ${popular ? 'scale-[1.02] border-[#B6E25D] ring-4 ring-[#B6E25D]/15' : 'border-[#EDE8E2]'}`}>{popular && <span className="absolute right-5 top-5 rounded-full bg-[#1F211E] px-3 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#C7E982]">{plan.badge}</span>}<p className="text-xs font-black uppercase tracking-[.1em] text-[#4F554C]">{plan.audience}</p><h2 className="mt-2 text-xl font-black">{plan.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-[#3A3F38]">{plan.description}</p><p className="mt-6 text-4xl font-black transition-all duration-300">{money(price)}<span className="text-sm font-bold text-[#3A3F38]">/{cycle === 'monthly' ? 'mo' : 'yr'}</span></p><Link href={`/freelancers/checkout/${plan.id}?billingCycle=${cycle}`} className={`${cta} mt-6 w-full`}>Choose Plan <ArrowRight className="size-4" /></Link><ul className="mt-6 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#3A3F38]"><Check className="mt-0.5 size-4 shrink-0 text-[#2E8B57]" />{feature}</li>)}</ul></article>;
}

export function CheckoutPage({ planId }: { planId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycle = searchParams.get('billingCycle') === 'yearly' || searchParams.get('cycle') === 'yearly' ? 'yearly' : 'monthly';
  const plan = plans.find((item) => item.id === planId) ?? plans[1];
  const [values, setValues] = useState<CheckoutForm>({ fullName: '', email: '', phone: '', city: '', studioName: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [complete, setComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const total = cycle === 'monthly' ? plan.monthly : plan.yearly;

  useEffect(() => {
    if (!complete) return;
    const timeout = window.setTimeout(() => router.push('/freelancers/join?fromCheckout=true'), 1400);
    return () => window.clearTimeout(timeout);
  }, [complete, router]);

  const update = (key: keyof CheckoutForm, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])) as Errors);
      return;
    }
    startTransition(() => {
      saveMockFreelancerAccount({ ...parsed.data, planId: plan.id, billingCycle: cycle, purchasedAt: new Date().toISOString() });
      window.localStorage.setItem(`${BRAND.cookiePrefix}-remembered-account`, parsed.data.email);
      window.setTimeout(() => setComplete(true), 650);
    });
  };

  return (
    <div className="min-h-screen bg-[#F7FCEE] text-[#0D1816]">
      <FreelancerNav active="pricing" light />
      <main className={`${container} grid gap-8 pb-20 pt-32 lg:grid-cols-[1.1fr_.9fr]`}>
        <section className="rounded-2xl border border-[#EDE8E2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#4F554C]">Checkout</p><h1 className="mt-2 text-3xl font-black">Create your freelancer account</h1>
          {complete ? <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800"><Check className="size-8" /><h2 className="mt-3 text-xl font-black">Payment successful</h2><p className="mt-2 text-sm leading-6">Your plan is active. Complete your freelancer profile next, then sign in with the email and password you just created.</p><Link href="/freelancers/join?fromCheckout=true" className={`${cta} mt-5`}>Complete Profile <ArrowRight className="size-4" /></Link></div> : (
            <form className="mt-7 grid gap-4" onSubmit={submit} noValidate>
              <Field icon={UserRound} label="Full name" value={values.fullName} error={errors.fullName} placeholder="Your name" onChange={(value) => update('fullName', value)} />
              <Field icon={Mail} label="Email" value={values.email} error={errors.email} placeholder="you@example.com" onChange={(value) => update('email', value)} />
              <Field icon={Phone} label="Phone" value={values.phone} error={errors.phone} placeholder="98765 43210" onChange={(value) => update('phone', value)} />
              <Field icon={MapPin} label="Base city" value={values.city} error={errors.city} placeholder="Delhi" onChange={(value) => update('city', value)} />
              <Field icon={Camera} label="Studio / brand name" value={values.studioName} error={errors.studioName} placeholder="Your creative brand" onChange={(value) => update('studioName', value)} />
              <Field icon={LockKeyhole} label="Create password" type="password" value={values.password} error={errors.password} placeholder="Minimum 6 characters" onChange={(value) => update('password', value)} />
              <button className={`${cta} mt-2`} disabled={isPending} type="submit"><LockKeyhole className="size-4" />{isPending ? 'Processing...' : 'Simulate Secure Payment'}</button>
            </form>
          )}
        </section>
        <aside className="rounded-2xl border border-[#EDE8E2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#4F554C]">Order summary</p><h2 className="mt-3 text-2xl font-black">{plan.name}</h2><p className="mt-2 text-sm text-[#3A3F38]">{plan.description}</p>
          <div className="mt-6 rounded-2xl bg-[#F7FCEE] p-5"><div className="flex justify-between text-sm"><span>Billing</span><strong className="capitalize">{cycle}</strong></div><div className="mt-3 flex justify-between text-sm"><span>Plan</span><strong>{money(total)}</strong></div><div className="mt-3 flex justify-between border-t border-[#EDE8E2] pt-3 text-lg font-black"><span>Total</span><span>{money(total)}</span></div></div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#EDE8E2] p-3 text-xs font-bold text-[#3A3F38]"><CreditCard className="size-4 text-[#4F554C]" /> Mock payment only. No backend or database write is performed.</div>
          <ul className="mt-5 space-y-2">{plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#3A3F38]"><ShieldCheck className="mt-0.5 size-4 text-[#2E8B57]" />{feature}</li>)}</ul>
        </aside>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, placeholder, value, error, onChange, type = 'text' }: { icon: LucideIcon; label: string; placeholder: string; value: string; error?: string; onChange: (value: string) => void; type?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const ToggleIcon = showPassword ? EyeOff : Eye;

  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[.1em] text-[#3A3F38]">{label}</span><span className="relative block"><Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4F554C]" /><input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`min-h-11 w-full rounded-xl border bg-[#FBFDF6] py-3 pl-10 text-sm outline-none transition focus:border-[#4F554C] focus:ring-4 focus:ring-[#EDF4F2] ${isPassword ? 'pr-13' : 'pr-3'} ${error ? 'border-red-300' : 'border-[#EDE8E2]'}`} />{isPassword && <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#4F554C] transition hover:bg-[#EDF4F2] focus:outline-none focus:ring-2 focus:ring-[#B6E25D]"><ToggleIcon className="size-4" aria-hidden="true" /></button>}</span>{error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}</label>;
}

function FreelancerNav({ active, light = false }: { active: 'freelancers' | 'pricing'; light?: boolean }) {
  const text = light ? 'text-[#0D1816]' : 'text-white';
  return <header className={`fixed inset-x-0 top-0 z-50 border-b ${light ? 'border-[#EDE8E2] bg-[#F7FCEE]/90' : 'border-white/10 bg-[#171816]/60'} backdrop-blur-xl`}><div className={`${container} flex h-18 items-center justify-between gap-4`}><Link href="/" className={`font-[var(--font-display)] text-lg font-black ${text}`}>{BRAND.name}</Link><nav className="hidden items-center gap-5 text-sm font-bold md:flex">{[['/freelancers', 'Home'], ['/freelancers#features', 'Features'], ['/freelancers#proof', 'Proof'], ['/freelancers/pricing', 'Pricing'], ['/contact', 'Contact']].map(([href, label]) => <Link key={href} href={href} className={`${text} ${active === 'pricing' && href.includes('pricing') ? 'opacity-100' : 'opacity-70'} transition hover:opacity-100`}>{label}</Link>)}</nav><div className="flex items-center gap-2"><Link href="/login" className={`hidden rounded-full border px-4 py-2 text-sm font-bold sm:inline-flex ${light ? 'border-[#EDE8E2] text-[#0D1816]' : 'border-white/25 text-white'}`}>Login</Link><Link href="/freelancers/pricing" className={cta}>Get Started</Link></div></div></header>;
}
