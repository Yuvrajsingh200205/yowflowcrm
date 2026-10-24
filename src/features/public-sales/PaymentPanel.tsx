'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Landmark, Smartphone } from 'lucide-react';
import { Button, Card, CardContent, Skeleton, useToast } from '@/components/ui';
import type { PublicPayment } from '@/lib/api/sales';
import { inr } from '../sales/format';
import { copyText } from '../sales/ui';

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { toast } = useToast();
  const [done, setDone] = React.useState(false);
  const copy = async () => {
    if (await copyText(value)) { setDone(true); window.setTimeout(() => setDone(false), 1800); }
    else toast({ tone: 'error', title: 'Couldn’t copy automatically', description: 'Press and hold the text to copy it.' });
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0"><p className="text-xs text-fg-subtle">{label}</p><p className={`break-all text-sm font-medium text-fg ${mono ? 'font-mono' : ''}`}>{value}</p></div>
      <Button variant="secondary" size="sm" onClick={() => void copy()} aria-label={`Copy ${label}`} className="min-h-10 shrink-0">{done ? <Check /> : <Copy />}{done ? 'Copied' : 'Copy'}</Button>
    </div>
  );
}

/** Shown once a quote is accepted: the advance to pay and where to send it. Money goes straight to the studio. */
export function PaymentPanel({ payment, studioName }: { payment: PublicPayment; studioName: string }) {
  const [qr, setQr] = React.useState('');
  React.useEffect(() => {
    if (!payment.upiLink) return;
    let cancelled = false;
    QRCode.toDataURL(payment.upiLink, { width: 440, margin: 2, color: { dark: '#11160F', light: '#FFFFFF' } }).then((d) => { if (!cancelled) setQr(d); }).catch(() => { if (!cancelled) setQr(''); });
    return () => { cancelled = true; };
  }, [payment.upiLink]);

  return (
    <section aria-labelledby="pay-title" className="space-y-3">
      <h2 id="pay-title" className="text-lg font-semibold tracking-tight">Pay your advance</h2>
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-fg-muted">Advance to confirm your booking</p>
            <p className="font-display text-3xl font-semibold tabular-nums text-fg">{inr(payment.amount)}</p>
          </div>

          {payment.upiId && (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="mx-auto sm:mx-0">
                {payment.upiLink && (qr
                  // eslint-disable-next-line @next/next/no-img-element -- a locally generated data URL
                  ? <img src={qr} alt={`UPI QR code to pay ${inr(payment.amount)} to ${studioName}`} width={176} height={176} className="size-44 rounded-[var(--radius-md)] border border-line-soft bg-white p-1" />
                  : <Skeleton className="size-44" />)}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-fg"><Smartphone className="size-4 text-brand" aria-hidden="true" />Pay with any UPI app</p>
                <p className="text-[13px] leading-relaxed text-fg-muted">On your phone, tap the button. On a computer, scan the code with your UPI app.</p>
                {payment.upiLink && <Button asChild size="lg" className="mt-3 w-full sm:w-auto"><a href={payment.upiLink}>Pay {inr(payment.amount)} with UPI</a></Button>}
                <div className="mt-2"><CopyRow label="UPI ID" value={payment.upiId} mono /></div>
              </div>
            </div>
          )}

          {payment.bank && (
            <div className="rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-fg"><Landmark className="size-4 text-brand" aria-hidden="true" />Bank transfer</p>
              <div className="divide-y divide-line-soft">
                {payment.bank.accountName && <CopyRow label="Account name" value={payment.bank.accountName} />}
                {payment.bank.bankName && <CopyRow label="Bank" value={payment.bank.bankName} />}
                <CopyRow label="Account number" value={payment.bank.accountNumber} mono />
                {payment.bank.ifsc && <CopyRow label="IFSC" value={payment.bank.ifsc} mono />}
              </div>
            </div>
          )}

          <p className="text-[13px] leading-relaxed text-fg-muted">When you have paid, {studioName} confirms it on their side. If you do not hear back within a day, message them with your payment reference.</p>
        </CardContent>
      </Card>
    </section>
  );
}
