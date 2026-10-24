'use client';

import * as React from 'react';
import { Building2, FileText, Landmark, Palette } from 'lucide-react';
import { Button, ErrorState, Field, Input, Skeleton, Textarea, useToast } from '@/components/ui';
import { salesSetupApi, type SalesSettings, type SalesSettingsInput } from '@/lib/api/sales';
import { brandStyle, contrast, isBrandColor } from '../../public-sales/brandTheme';
import { errorMessage, fieldErrors, isValidEmail } from '../format';
import { NumberInput, Panel, useLoad } from '../ui';

const UPI = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

interface Form {
  phone: string; email: string; website: string; addressLine: string; city: string; state: string; postalCode: string; gstNumber: string;
  upiId: string; bankAccountName: string; bankName: string; bankAccountNumber: string; bankIfsc: string;
  quoteValidDays: string; advancePercent: string; balanceDueDaysBefore: string; brandColor: string; defaultTerms: string;
}

const toForm = (s: SalesSettings): Form => ({
  phone: s.business.phone ?? '', email: s.business.email ?? '', website: s.business.website ?? '', addressLine: s.business.addressLine ?? '', city: s.business.city ?? '',
  state: s.business.state ?? '', postalCode: s.business.postalCode ?? '', gstNumber: s.business.gstNumber ?? '',
  upiId: s.upiId ?? '', bankAccountName: s.bankAccountName ?? '', bankName: s.bankName ?? '', bankAccountNumber: s.bankAccountNumber ?? '', bankIfsc: s.bankIfsc ?? '',
  quoteValidDays: String(s.quoteValidDays), advancePercent: String(s.advancePercent), balanceDueDaysBefore: String(s.balanceDueDaysBefore),
  brandColor: s.brandColor ?? '', defaultTerms: s.defaultTerms ?? '',
});

function validate(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  const digits = f.phone.replace(/\D/g, '');
  if (f.phone && (!/^\+?[0-9 ()-]+$/.test(f.phone) || digits.length < 7 || digits.length > 15)) e.phone = 'Enter a phone number with 7 to 15 digits.';
  if (f.email && !isValidEmail(f.email)) e.email = 'Enter a valid email address.';
  if (f.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(f.website)) e.website = 'Enter the full address, such as https://yourstudio.com.';
  if (f.gstNumber && !GSTIN.test(f.gstNumber.toUpperCase())) e.gstNumber = 'A GSTIN has 15 characters, for example 27ABCDE1234F1Z5.';
  if (f.upiId && !UPI.test(f.upiId)) e.upiId = 'Enter a UPI ID like name@bank.';
  if (f.bankAccountNumber && !/^\d{6,34}$/.test(f.bankAccountNumber)) e.bankAccountNumber = 'Digits only, 6 to 34 of them.';
  if (f.bankIfsc && !IFSC.test(f.bankIfsc.toUpperCase())) e.bankIfsc = 'An IFSC looks like HDFC0001234.';
  if (f.bankAccountNumber && !f.bankIfsc) e.bankIfsc = 'Add the IFSC so customers can transfer.';
  const valid = Number(f.quoteValidDays);
  if (!f.quoteValidDays || valid < 1 || valid > 365) e.quoteValidDays = 'Enter 1 to 365 days.';
  if (f.advancePercent === '' || Number(f.advancePercent) > 100) e.advancePercent = 'Enter a percentage from 0 to 100.';
  if (f.balanceDueDaysBefore === '' || Number(f.balanceDueDaysBefore) > 365) e.balanceDueDaysBefore = 'Enter 0 to 365 days.';
  if (f.brandColor && !isBrandColor(f.brandColor)) e.brandColor = 'Use a colour like #6AA900.';
  return e;
}

const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

function toInput(f: Form, original: Form): SalesSettingsInput {
  const out: Record<string, unknown> = {};
  const text: Array<keyof Form> = ['phone', 'email', 'website', 'addressLine', 'city', 'state', 'postalCode', 'upiId', 'bankAccountName', 'bankName', 'bankAccountNumber', 'defaultTerms'];
  for (const k of text) if (f[k] !== original[k]) out[k] = orNull(f[k]);
  if (f.gstNumber !== original.gstNumber) out.gstNumber = orNull(f.gstNumber.toUpperCase());
  if (f.bankIfsc !== original.bankIfsc) out.bankIfsc = orNull(f.bankIfsc.toUpperCase());
  if (f.brandColor !== original.brandColor) out.brandColor = orNull(f.brandColor);
  if (f.quoteValidDays !== original.quoteValidDays) out.quoteValidDays = Number(f.quoteValidDays);
  if (f.advancePercent !== original.advancePercent) out.advancePercent = Number(f.advancePercent);
  if (f.balanceDueDaysBefore !== original.balanceDueDaysBefore) out.balanceDueDaysBefore = Number(f.balanceDueDaysBefore);
  return out as SalesSettingsInput;
}

export function BusinessTab({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(() => salesSetupApi.settings(), []);
  const [f, setF] = React.useState<Form | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (data) setF(toForm(data)); }, [data]);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-56" /><Skeleton className="h-56" /></div>;
  if ((error && !data) || !data || !f) return <ErrorState title="Couldn’t load your business details" description={error || 'Try again in a moment.'} action={{ label: 'Try again', onClick: () => void reload() }} />;

  const original = toForm(data);
  const dirty = JSON.stringify(f) !== JSON.stringify(original);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setF({ ...f, [k]: e.target.value }); setErrors((x) => ({ ...x, [k]: '' })); };
  const setValue = (k: keyof Form) => (v: string) => { setF({ ...f, [k]: v }); setErrors((x) => ({ ...x, [k]: '' })); };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) { toast({ tone: 'error', title: 'Some details need a look', description: 'The fields marked in red explain what to fix.' }); return; }
    setBusy(true);
    try {
      await salesSetupApi.updateSettings(toInput(f, original));
      toast({ tone: 'success', title: 'Business details saved' });
      await reload();
      onChanged?.();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast({ tone: 'error', title: 'Couldn’t save your details', description: errorMessage(e, 'Please try again.') });
    } finally { setBusy(false); }
  };

  const brandOk = isBrandColor(f.brandColor);
  const swatch = brandStyle(f.brandColor) as Record<string, string>;

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Everything here is printed on your quotes and invoices, so check it once and it stays right everywhere.</p>
        <Button type="submit" loading={busy} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</Button>
      </div>

      <Panel title="Studio details" description={<>Shown at the top of every quote and invoice. The studio name (<strong>{data.business.name}</strong>) is changed in Settings → Workspace.</>} icon={Building2}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" error={errors.phone}>{(a) => <Input id={a.id} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={32} />}</Field>
          <Field label="Email" hint="Customers can reply to this address." error={errors.email}>{(a) => <Input id={a.id} type="email" autoComplete="email" value={f.email} onChange={set('email')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={160} />}</Field>
          <Field label="Website" error={errors.website} className="sm:col-span-2">{(a) => <Input id={a.id} type="url" inputMode="url" value={f.website} onChange={set('website')} placeholder="https://yourstudio.com" invalid={a.invalid} aria-describedby={a.describedBy} maxLength={200} />}</Field>
          <Field label="Address" error={errors.addressLine} className="sm:col-span-2">{(a) => <Input id={a.id} autoComplete="street-address" value={f.addressLine} onChange={set('addressLine')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={255} />}</Field>
          <Field label="City" error={errors.city}>{(a) => <Input id={a.id} autoComplete="address-level2" value={f.city} onChange={set('city')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={80} />}</Field>
          <Field label="State" error={errors.state}>{(a) => <Input id={a.id} autoComplete="address-level1" value={f.state} onChange={set('state')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={80} />}</Field>
          <Field label="PIN code" error={errors.postalCode}>{(a) => <Input id={a.id} autoComplete="postal-code" inputMode="numeric" value={f.postalCode} onChange={set('postalCode')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={16} />}</Field>
          <Field label="GSTIN" hint="Printed on tax invoices. Leave empty if you are not registered." error={errors.gstNumber}>{(a) => <Input id={a.id} value={f.gstNumber} onChange={(e) => { setF({ ...f, gstNumber: e.target.value.toUpperCase() }); setErrors((x) => ({ ...x, gstNumber: '' })); }} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={15} className="font-mono uppercase" autoCapitalize="characters" />}</Field>
        </div>
      </Panel>

      <Panel title="How customers pay you" description="Shown on quotes and invoices, and revealed to a customer as soon as they accept a quote. Money goes straight to your own account." icon={Landmark}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="UPI ID" hint="A QR code for this ID is printed on your quotes." error={errors.upiId} className="sm:col-span-2">{(a) => <Input id={a.id} value={f.upiId} onChange={set('upiId')} placeholder="yourstudio@okhdfcbank" invalid={a.invalid} aria-describedby={a.describedBy} maxLength={80} autoCapitalize="none" autoCorrect="off" spellCheck={false} />}</Field>
          <Field label="Account holder name" error={errors.bankAccountName}>{(a) => <Input id={a.id} value={f.bankAccountName} onChange={set('bankAccountName')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={160} />}</Field>
          <Field label="Bank name" error={errors.bankName}>{(a) => <Input id={a.id} value={f.bankName} onChange={set('bankName')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={120} />}</Field>
          <Field label="Account number" error={errors.bankAccountNumber}>{(a) => <NumberInput id={a.id} value={f.bankAccountNumber} onChange={setValue('bankAccountNumber')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={34} />}</Field>
          <Field label="IFSC code" error={errors.bankIfsc}>{(a) => <Input id={a.id} value={f.bankIfsc} onChange={(e) => { setF({ ...f, bankIfsc: e.target.value.toUpperCase() }); setErrors((x) => ({ ...x, bankIfsc: '' })); }} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={11} className="font-mono uppercase" autoCapitalize="characters" />}</Field>
        </div>
      </Panel>

      <Panel title="Quote defaults" description="Every new quote starts from these. You can still change them on an individual quote." icon={FileText}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Quote valid for (days)" error={errors.quoteValidDays}>{(a) => <NumberInput id={a.id} value={f.quoteValidDays} onChange={setValue('quoteValidDays')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={3} />}</Field>
          <Field label="Advance to confirm (%)" hint="Due the moment they accept." error={errors.advancePercent}>{(a) => <NumberInput id={a.id} value={f.advancePercent} onChange={setValue('advancePercent')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={3} />}</Field>
          <Field label="Balance due before event (days)" hint="The rest is due this many days before the date." error={errors.balanceDueDaysBefore}>{(a) => <NumberInput id={a.id} value={f.balanceDueDaysBefore} onChange={setValue('balanceDueDaysBefore')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={3} />}</Field>
          <Field label="Terms and conditions" hint="One point per line. Printed at the bottom of every quote and invoice." error={errors.defaultTerms} className="sm:col-span-3">{(a) => <Textarea id={a.id} rows={6} value={f.defaultTerms} onChange={set('defaultTerms')} maxLength={6000} aria-describedby={a.describedBy} placeholder={'30% advance confirms the booking and is non-refundable.\nBalance is due 7 days before the event.\nDelivery within 21 days of the event.'} />}</Field>
        </div>
      </Panel>

      <Panel title="Brand colour" description="Tints your booking page, quote page and PDFs. Leave empty to use the default look." icon={Palette}>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-start">
          <Field label="Colour" hint="A hex code such as #6AA900." error={errors.brandColor}>{(a) => (
            <div className="flex items-center gap-2">
              <input type="color" aria-label="Pick a colour" value={brandOk ? f.brandColor : '#11160f'} onChange={(e) => { setF({ ...f, brandColor: e.target.value }); setErrors((x) => ({ ...x, brandColor: '' })); }} className="size-10 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-line bg-surface p-1" />
              <Input id={a.id} value={f.brandColor} onChange={set('brandColor')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={7} placeholder="#6AA900" className="font-mono" autoCapitalize="none" spellCheck={false} />
            </div>
          )}</Field>
          <div style={swatch} className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4" aria-label="Preview of your colour">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">Preview</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" tabIndex={-1}>Accept quotation</Button>
              <Button type="button" variant="secondary" tabIndex={-1}>Ask a question</Button>
            </div>
            {brandOk && contrast(f.brandColor, '#FFFFFF') < 3 && contrast(f.brandColor, '#11160F') < 3 && <p className="mt-3 text-xs text-warn">This colour is hard to read against both light and dark text. A deeper or stronger colour works better.</p>}
          </div>
        </div>
      </Panel>
    </form>
  );
}
