'use client';

import * as React from 'react';
import { AlertTriangle, Check, Copy, Link2, Mail, MessageCircle } from 'lucide-react';
import { Button, Dialog, DialogContent, useToast } from '@/components/ui';
import { quotesApi, type QuoteDetail, type SendChannel, type SendResult } from '@/lib/api/sales';
import { errorMessage, inr } from '../format';
import { copyText } from '../ui';

const OPTIONS: Array<{ id: SendChannel; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'EMAIL', title: 'Email', icon: Mail },
  { id: 'WHATSAPP', title: 'WhatsApp', icon: MessageCircle },
  { id: 'LINK', title: 'Copy link', icon: Link2 },
];

export function SendDialog({ quote, total, dateWarning, onClose, onSent }: { quote: QuoteDetail; total: number; dateWarning: string | null; onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const hasEmail = Boolean(quote.customerEmail);
  const hasPhone = Boolean(quote.customerPhone);
  const [channel, setChannel] = React.useState<SendChannel>(hasPhone ? 'WHATSAPP' : hasEmail ? 'EMAIL' : 'LINK');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<SendResult | null>(null);
  const [copied, setCopied] = React.useState(false);
  const resending = quote.status !== 'DRAFT';

  const detail = (id: SendChannel) => id === 'EMAIL' ? (hasEmail ? quote.customerEmail : 'Add an email address to the quote to use this.') : id === 'WHATSAPP' ? (hasPhone ? `${quote.customerPhone} · opens WhatsApp with the message ready` : 'Add a phone number to the quote to use this.') : 'Share the link anywhere: Instagram, SMS, in person.';
  const disabled = (id: SendChannel) => (id === 'EMAIL' && !hasEmail) || (id === 'WHATSAPP' && !hasPhone);

  const send = async () => {
    setBusy(true);
    try {
      const r = await quotesApi.send(quote.id, channel);
      setResult(r);
      onSent();
      if (channel === 'LINK') { if (await copyText(r.publicUrl)) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); } }
    } catch (error) {
      toast({ tone: 'error', title: 'Couldn’t send the quote', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };

  const copy = async () => {
    if (!result) return;
    if (await copyText(result.publicUrl)) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    else toast({ tone: 'error', title: 'Couldn’t copy automatically', description: 'Select the link and copy it by hand.' });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        title={result ? 'Quote sent' : resending ? 'Send this quote again' : 'Send this quote'}
        description={result ? undefined : `${quote.quotationNumber} · ${inr(total)} · ${quote.customerName ?? 'customer'}`}
        footer={result ? <Button onClick={onClose}>Done</Button> : <><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={() => void send()} loading={busy} disabled={total <= 0}>{resending ? 'Send again' : 'Send quote'}</Button></>}
      >
        {result ? (
          <div className="space-y-4">
            <p role="status" className="text-sm text-fg">
              {result.emailed ? `We emailed the link to ${quote.customerEmail}.`
                : channel === 'EMAIL' ? 'The quote is marked as sent, but the email could not be delivered. Share the link below instead.'
                  : channel === 'WHATSAPP' ? 'The quote is marked as sent. Open WhatsApp to message the link.'
                    : 'The quote is marked as sent. The link is ready to share.'}
            </p>
            {channel === 'EMAIL' && !result.emailed && <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Email sending may not be set up for your workspace yet.</p>}
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-surface-sunken p-2">
              <input readOnly aria-label="Quote link" value={result.publicUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-2 font-mono text-[13px] text-fg outline-none" />
              <Button variant="secondary" size="sm" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}</Button>
            </div>
            {result.whatsappUrl && <Button asChild><a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle />Open WhatsApp</a></Button>}
            {channel === 'WHATSAPP' && !result.whatsappUrl && <p className="text-[13px] text-warn">That phone number does not look valid for WhatsApp. Copy the link and send it yourself.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {quote.needsReview && <p className="rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-[13px] text-fg-muted">This quote was prepared from an enquiry. Sending it also approves it.</p>}
            {dateWarning && <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{dateWarning} The customer will not be able to accept online.</span></p>}
            {total <= 0 && <p role="alert" className="text-[13px] font-medium text-bad">The total is ₹0. Edit the quote and add a price before sending.</p>}
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-fg">How would you like to send it?</legend>
              <div className="grid gap-2">
                {OPTIONS.map((o) => (
                  <label key={o.id} className={`flex items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)] ${disabled(o.id) ? 'cursor-not-allowed border-line-soft opacity-60' : channel === o.id ? 'cursor-pointer border-brand bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'cursor-pointer border-line bg-surface hover:bg-[var(--hover)]'}`}>
                    <input type="radio" name="send-channel" value={o.id} checked={channel === o.id} disabled={disabled(o.id)} onChange={() => setChannel(o.id)} className="mt-1 size-4 accent-[var(--primary)]" />
                    <o.icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span><span className="block text-sm font-semibold text-fg">{o.title}</span><span className="block text-[13px] text-fg-muted">{detail(o.id)}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
