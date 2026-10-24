'use client';

import * as React from 'react';
import { BellRing, Mail, MessageCircle } from 'lucide-react';
import { Button, ErrorState, Skeleton, useToast } from '@/components/ui';
import { salesSetupApi } from '@/lib/api/sales';
import { errorMessage } from '../format';
import { Panel, Toggle, useLoad } from '../ui';

const SCHEDULE: Array<{ when: string; what: string }> = [
  { when: '1 to 3 days before a payment is due', what: 'You are notified, and the client gets a friendly email reminder.' },
  { when: 'On the due date', what: 'You are notified so you can call or message them.' },
  { when: '1 to 3 days overdue', what: 'You are notified, and the client gets an email.' },
  { when: '4 to 7 days overdue', what: 'You are notified again.' },
  { when: '8 to 30 days overdue', what: 'You are notified, and the client gets a final email.' },
  { when: 'A quote was sent but not opened for 2 days', what: 'The client gets a gentle nudge by email.' },
  { when: 'A quote expires within 2 days', what: 'The client is told it is about to expire.' },
  { when: 'An enquiry quote waits for your review for 4 hours', what: 'You are reminded to check and send it.' },
];

export function RemindersTab() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(() => salesSetupApi.settings(), []);
  const [busy, setBusy] = React.useState<string | null>(null);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if ((error && !data) || !data) return <ErrorState title="Couldn’t load reminder settings" description={error || 'Try again in a moment.'} action={{ label: 'Try again', onClick: () => void reload() }} />;

  const change = async (key: 'remindersEnabled' | 'remindersEmailClients', value: boolean) => {
    setBusy(key);
    try { await salesSetupApi.updateSettings({ [key]: value }); await reload(); toast({ tone: 'success', title: 'Reminder settings saved' }); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t save', description: errorMessage(e, 'Please try again.') }); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <Panel title="Automatic reminders" description="A check runs once every morning and sends each reminder only once, so nobody is nagged twice." icon={BellRing}>
        <div className="grid gap-5">
          <Toggle checked={data.remindersEnabled} onChange={(v) => void change('remindersEnabled', v)} disabled={busy !== null} label="Send reminders" description="Turns the daily check on or off for your studio. Your Today list on the Quotes page always works." />
          <Toggle checked={data.remindersEmailClients} onChange={(v) => void change('remindersEmailClients', v)} disabled={busy !== null || !data.remindersEnabled} label="Email clients too" description="When off, only you and your team are notified, and you send the reminders yourself." />
        </div>
      </Panel>

      <Panel title="What is sent, and when" icon={Mail} description="Reminders use the dates on each payment schedule and quote.">
        <ul className="divide-y divide-line-soft rounded-[var(--radius-lg)] border border-line-soft">
          {SCHEDULE.map((s) => (
            <li key={s.when} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[18rem_1fr] sm:gap-4">
              <span className="font-medium text-fg">{s.when}</span>
              <span className="text-fg-muted">{s.what}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-lg)] bg-surface-sunken p-4 text-sm text-fg-muted">
          <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <p>WhatsApp messages are not sent automatically. Your <strong className="text-fg">Today</strong> list on the Quotes page shows who to follow up with, and a button opens WhatsApp with the message already written.</p>
        </div>
        <div className="mt-4"><Button variant="secondary" asChild><a href="/quotes">Open today’s list</a></Button></div>
      </Panel>
    </div>
  );
}
