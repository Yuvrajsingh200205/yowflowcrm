'use client';

import * as React from 'react';
import { CalendarClock, CheckCircle2, Eye, FileClock, HandCoins, MailOpen, MessageCircle, PhoneCall } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { quotesApi, type TodayList, type TodayQuoteRow } from '@/lib/api/sales';
import { fmtDate, inr } from '../format';
import { useLoad } from '../ui';

type Icon = React.ComponentType<{ className?: string }>;

function Group({ title, hint, icon: Icon, count, tone, children }: { title: string; hint: string; icon: Icon; count: number; tone: 'warning' | 'info' | 'neutral' | 'danger'; children: React.ReactNode }) {
  const id = React.useId();
  if (count === 0) return null;
  return (
    <section aria-labelledby={id}>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-brand" aria-hidden="true"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1"><h3 id={id} className="text-sm font-semibold text-fg">{title}</h3><p className="text-[13px] text-fg-muted">{hint}</p></div>
        <Badge tone={tone}>{count}</Badge>
      </div>
      <Card><ul className="divide-y divide-line-soft">{children}</ul></Card>
    </section>
  );
}

function RowShell({ title, meta, amount, actions }: { title: string; meta: string; amount?: string; actions: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        <p className="text-[13px] text-fg-muted">{meta}</p>
      </div>
      {amount && <p className="text-sm font-semibold tabular-nums text-fg">{amount}</p>}
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </li>
  );
}

const WhatsApp = ({ href, label }: { href: string | null; label: string }) =>
  href ? <Button variant="secondary" size="sm" asChild><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}><MessageCircle />WhatsApp</a></Button> : null;

export function TodayPanel({ onOpen, onOpenLead, canPayments, version }: { onOpen: (id: string) => void; onOpenLead?: (id: string) => void; canPayments: boolean; version: number }) {
  const { data, error, loading, reload } = useLoad(() => quotesApi.today(), [version]);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  if (error && !data) return <ErrorState title="Couldn’t load today’s list" description={error} action={{ label: 'Try again', onClick: () => void reload() }} />;
  const d: TodayList = data ?? { toReview: [], notOpened: [], openedNotAccepted: [], expiringSoon: [], payments: [], followUps: [] };
  const empty = d.toReview.length + d.notOpened.length + d.openedNotAccepted.length + d.expiringSoon.length + d.payments.length + d.followUps.length === 0;
  if (empty) return <Card><EmptyState icon={<CheckCircle2 />} title="You’re all caught up" description="Nothing needs a nudge right now. New enquiries, unopened quotes and payments due will show up here." /></Card>;

  const quoteRow = (q: TodayQuoteRow, primary: string) => (
    <RowShell
      key={q.id}
      title={`${q.customer ?? 'Customer'} · ${q.number}`}
      meta={q.hint}
      amount={inr(q.total)}
      actions={<><WhatsApp href={q.whatsappUrl} label={`WhatsApp ${q.customer ?? 'customer'} about ${q.number}`} /><Button size="sm" onClick={() => onOpen(q.id)}>{primary}</Button></>}
    />
  );

  return (
    <div className="space-y-6">
      <Group title="Needs your review" hint="Quotes prepared from new enquiries. Check and send." icon={FileClock} count={d.toReview.length} tone="warning">{d.toReview.map((q) => quoteRow(q, 'Review & send'))}</Group>
      <Group title="Not opened yet" hint="Sent over a day ago and still unopened. A nudge on WhatsApp works well." icon={MailOpen} count={d.notOpened.length} tone="info">{d.notOpened.map((q) => quoteRow(q, 'Open'))}</Group>
      <Group title="Opened, not accepted" hint="They have looked at it. A call can close it." icon={Eye} count={d.openedNotAccepted.length} tone="info">{d.openedNotAccepted.map((q) => quoteRow(q, 'Open'))}</Group>
      <Group title="Expiring soon" hint="Valid for two more days or fewer." icon={CalendarClock} count={d.expiringSoon.length} tone="warning">{d.expiringSoon.map((q) => quoteRow(q, 'Open'))}</Group>
      {canPayments && (
        <Group title="Payments to collect" hint="Due within a week, or already overdue." icon={HandCoins} count={d.payments.length} tone="danger">
          {d.payments.map((p) => (
            <RowShell
              key={p.id}
              title={`${p.client} · ${p.title}`}
              meta={`${p.project} · ${p.overdue ? `overdue since ${fmtDate(p.dueDate)}` : p.daysUntil === 0 ? 'due today' : `due ${fmtDate(p.dueDate)}`}`}
              amount={inr(p.amount)}
              actions={<>{p.overdue && <Badge tone="danger">Overdue</Badge>}<WhatsApp href={p.whatsappUrl} label={`WhatsApp ${p.client} about ${p.title}`} /></>}
            />
          ))}
        </Group>
      )}
      <Group title="Follow-ups due" hint="Leads you planned to contact today or earlier." icon={PhoneCall} count={d.followUps.length} tone="neutral">
        {d.followUps.map((l) => (
          <RowShell
            key={l.id}
            title={l.name}
            meta={`${l.phone}${l.eventDate ? ` · event ${fmtDate(l.eventDate)}` : ''}`}
            actions={<><WhatsApp href={l.whatsappUrl} label={`WhatsApp ${l.name}`} />{onOpenLead && <Button size="sm" variant="secondary" onClick={() => onOpenLead(l.id)}>Make a quote</Button>}</>}
          />
        ))}
      </Group>
    </div>
  );
}
