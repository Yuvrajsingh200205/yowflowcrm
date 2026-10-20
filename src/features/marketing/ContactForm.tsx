'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { accountApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm() {
  const [f, setF] = React.useState({ name: '', email: '', company: '', phone: '', message: '', website: '' });
  const [errs, setErrs] = React.useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrs((s) => ({ ...s, [k]: undefined })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      name: f.name.trim().length >= 2 ? undefined : 'Tell us your name.',
      email: EMAIL_RE.test(f.email.trim()) ? undefined : 'Enter a valid email, like name@studio.com.',
      message: f.message.trim().length >= 10 ? undefined : 'Tell us a little more (at least 10 characters).',
    };
    setErrs(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true); setError(null);
    try {
      await accountApi.contact({ name: f.name.trim(), email: f.email.trim(), company: f.company.trim() || undefined, phone: f.phone.trim() || undefined, message: f.message.trim(), source: 'contact-page', website: f.website });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We couldn’t send your message. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div role="status" className="grid place-items-center rounded-[var(--radius-xl)] border border-line-soft bg-surface px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-brand"><CheckCircle2 className="size-6" aria-hidden="true" /></span>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">Message received</h2>
        <p className="mt-2 max-w-sm text-sm text-fg-muted">Thanks, {f.name.split(' ')[0]}. We’ll reply to {f.email} within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-[var(--radius-xl)] border border-line-soft bg-surface p-6 sm:p-8">
      {error && <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errs.name} required>{(a) => <Input id={a.id} name="name" autoComplete="name" value={f.name} onChange={set('name')} aria-describedby={a.describedBy} invalid={a.invalid} />}</Field>
        <Field label="Work email" error={errs.email} required>{(a) => <Input id={a.id} name="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} aria-describedby={a.describedBy} invalid={a.invalid} />}</Field>
        <Field label="Studio or company">{(a) => <Input id={a.id} name="organization" autoComplete="organization" value={f.company} onChange={set('company')} />}</Field>
        <Field label="Phone" hint="Optional — only if you’d like a call.">{(a) => <Input id={a.id} name="tel" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} aria-describedby={a.describedBy} />}</Field>
      </div>
      <Field label="How can we help?" error={errs.message} required>{(a) => <Textarea id={a.id} name="message" rows={5} value={f.message} onChange={set('message')} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="Tell us about your studio and what you’d like to improve." />}</Field>
      {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
      <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto" loading={busy}>{busy ? 'Sending…' : 'Send message'}</Button>
    </form>
  );
}
