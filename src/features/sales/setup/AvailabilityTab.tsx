'use client';

import * as React from 'react';
import { CalendarCheck, CalendarOff, Lock, Plus, Unlock } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, Field, Input, Skeleton, useToast } from '@/components/ui';
import { salesSetupApi, type BlockedDate, type CalendarDay, type SalesSettings } from '@/lib/api/sales';
import { DAY_STATUS_LABEL, errorMessage, fieldErrors, fmtDate, fmtDateLong, localToday } from '../format';
import { MonthCalendar, monthOf, monthRange, type CalendarCell, type CalendarMonth } from '../MonthCalendar';
import { ConfirmDialog, NumberInput, Panel, useLoad } from '../ui';

const noteFor = (d: CalendarDay): string | undefined => {
  if (d.status === 'CLOSED') return d.closedReason || 'Closed';
  if (d.status === 'FULL') return d.capacity === 1 ? 'Booked' : `${d.booked}/${d.capacity} booked`;
  if (d.status === 'LIMITED') return `${d.booked}/${d.capacity} booked`;
  return undefined;
};

function RulesPanel({ settings, onSaved }: { settings: SalesSettings; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = React.useState({ capacityPerDay: String(settings.capacityPerDay), minLeadDays: String(settings.minLeadDays), maxAdvanceDays: String(settings.maxAdvanceDays) });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const dirty = f.capacityPerDay !== String(settings.capacityPerDay) || f.minLeadDays !== String(settings.minLeadDays) || f.maxAdvanceDays !== String(settings.maxAdvanceDays);
  const set = (k: keyof typeof f) => (v: string) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    const cap = Number(f.capacityPerDay);
    if (!f.capacityPerDay || cap < 1 || cap > 50) e.capacityPerDay = 'Enter a number from 1 to 50.';
    const lead = Number(f.minLeadDays);
    if (f.minLeadDays === '' || lead > 365) e.minLeadDays = 'Enter a number of days from 0 to 365.';
    const far = Number(f.maxAdvanceDays);
    if (!f.maxAdvanceDays || far < 30 || far > 1825) e.maxAdvanceDays = 'Enter a number of days from 30 to 1825.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await salesSetupApi.updateSettings({ capacityPerDay: cap, minLeadDays: lead, maxAdvanceDays: far });
      toast({ tone: 'success', title: 'Booking rules saved' });
      onSaved();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'Couldn’t save the rules', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Panel title="Booking rules" description="These decide which dates customers can pick on your booking page, and which dates a quote can still be accepted for." icon={CalendarCheck} actions={<Button type="submit" loading={busy} disabled={!dirty}>{dirty ? 'Save rules' : 'Saved'}</Button>}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Events you can take on one day" hint="1 if one crew covers one event per day; more if you run several crews." error={errors.capacityPerDay}>{(a) => <NumberInput id={a.id} value={f.capacityPerDay} onChange={set('capacityPerDay')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={2} />}</Field>
          <Field label="Minimum notice (days)" hint="A date closer than this cannot be booked online. 0 allows tomorrow." error={errors.minLeadDays}>{(a) => <NumberInput id={a.id} value={f.minLeadDays} onChange={set('minLeadDays')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={3} />}</Field>
          <Field label="How far ahead (days)" hint="730 is two years." error={errors.maxAdvanceDays}>{(a) => <NumberInput id={a.id} value={f.maxAdvanceDays} onChange={set('maxAdvanceDays')} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={4} />}</Field>
        </div>
      </Panel>
    </form>
  );
}

function ClosedDatesPanel({ blocked, onChanged, today, prefill }: { blocked: BlockedDate[]; onChanged: () => void; today: string; prefill: string | null }) {
  const { toast } = useToast();
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [removing, setRemoving] = React.useState<BlockedDate | null>(null);

  React.useEffect(() => { if (prefill) { setStart(prefill); setEnd(prefill); setErrors({}); } }, [prefill]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (!start) e.startDate = 'Choose the first date.';
    if (!end) e.endDate = 'Choose the last date (the same day for one day).';
    else if (start && end < start) e.endDate = 'The last date cannot be before the first.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await salesSetupApi.blockDates({ startDate: start, endDate: end, reason: reason.trim() || null });
      toast({ tone: 'success', title: 'Dates closed', description: 'Customers can no longer pick them. Existing bookings are not affected.' });
      setStart(''); setEnd(''); setReason('');
      onChanged();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'Couldn’t close those dates', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };

  const reopen = async () => {
    if (!removing) return;
    setBusy(true);
    try { await salesSetupApi.unblock(removing.id); toast({ tone: 'success', title: 'Dates reopened' }); setRemoving(null); onChanged(); }
    catch (error) { toast({ tone: 'error', title: 'Couldn’t reopen those dates', description: errorMessage(error, 'Please try again.') }); }
    finally { setBusy(false); }
  };

  const upcoming = blocked.filter((b) => b.endDate >= today);

  return (
    <Panel title="Closed dates" description="Holidays, personal days, or dates you are already committed to outside this system." icon={CalendarOff}>
      <form onSubmit={add} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-start">
        <Field label="From" required error={errors.startDate}>{(a) => <Input id={a.id} type="date" value={start} onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value); setErrors((x) => ({ ...x, startDate: '' })); }} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
        <Field label="To" required error={errors.endDate}>{(a) => <Input id={a.id} type="date" value={end} min={start || undefined} onChange={(e) => { setEnd(e.target.value); setErrors((x) => ({ ...x, endDate: '' })); }} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
        <Field label="Reason (only you see it)" error={errors.reason}>{(a) => <Input id={a.id} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Family function" invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
        <div className="sm:pt-[26px]"><Button type="submit" loading={busy}><Plus />Close dates</Button></div>
      </form>

      <div className="mt-6">
        {upcoming.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-surface-sunken px-4 py-5 text-center text-sm text-fg-muted">No closed dates coming up.</p>
        ) : (
          <ul className="divide-y divide-line-soft rounded-[var(--radius-lg)] border border-line-soft">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-fg">{b.startDate === b.endDate ? fmtDate(b.startDate) : `${fmtDate(b.startDate)} to ${fmtDate(b.endDate)}`}</p>
                  {b.reason && <p className="text-[13px] text-fg-muted">{b.reason}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(b)} aria-label={`Reopen ${fmtDate(b.startDate)}`}><Unlock />Reopen</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(removing)}
        title="Reopen these dates?"
        description={removing ? `${removing.startDate === removing.endDate ? fmtDate(removing.startDate) : `${fmtDate(removing.startDate)} to ${fmtDate(removing.endDate)}`} will be available to customers again (unless they are booked).` : undefined}
        confirmLabel="Reopen"
        busy={busy}
        onConfirm={() => void reopen()}
        onClose={() => setRemoving(null)}
      />
    </Panel>
  );
}

export function AvailabilityTab() {
  const today = React.useMemo(() => localToday(), []);
  const [month, setMonth] = React.useState<CalendarMonth>(() => monthOf(today));
  const [selected, setSelected] = React.useState<string | null>(null);
  const [days, setDays] = React.useState<Record<string, CalendarDay>>({});
  const [calendarError, setCalendarError] = React.useState('');
  const [calendarLoading, setCalendarLoading] = React.useState(true);
  const [prefill, setPrefill] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const settings = useLoad(() => salesSetupApi.settings(), []);
  const blocked = useLoad(() => salesSetupApi.blockedDates(), []);

  const loadMonth = React.useCallback(async (m: CalendarMonth) => {
    const id = ++requestId.current;
    setCalendarLoading(true);
    setCalendarError('');
    try {
      const { from, to } = monthRange(m);
      const result = await salesSetupApi.calendar(from, to);
      if (id !== requestId.current) return;
      setDays((prev) => ({ ...prev, ...Object.fromEntries(result.days.map((d) => [d.date, d])) }));
    } catch (error) {
      if (id === requestId.current) setCalendarError(errorMessage(error, 'Couldn’t load the calendar.'));
    } finally {
      if (id === requestId.current) setCalendarLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadMonth(month); }, [month, loadMonth]);

  const refreshAll = () => { setDays({}); void loadMonth(month); void blocked.reload(); void settings.reload(); };

  const cells = React.useMemo(() => {
    const out: Record<string, CalendarCell> = {};
    for (const [date, d] of Object.entries(days)) out[date] = { status: d.status, note: noteFor(d) };
    return out;
  }, [days]);

  if (settings.loading && !settings.data) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;
  if (settings.error && !settings.data) return <ErrorState title="Couldn’t load availability" description={settings.error} action={{ label: 'Try again', onClick: () => void settings.reload() }} />;

  const day = selected ? days[selected] : undefined;

  return (
    <div className="space-y-6">
      <Panel title="Calendar" description="Every confirmed booking and closed date at a glance. Select a date to see what is on it." icon={CalendarCheck}>
        {calendarError ? (
          <ErrorState title="Couldn’t load the calendar" description={calendarError} action={{ label: 'Try again', onClick: () => void loadMonth(month) }} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
            <MonthCalendar month={month} onMonthChange={setMonth} cells={cells} today={today} selected={selected} onSelect={setSelected} loading={calendarLoading} roomy anyDate label="Studio calendar" selectedLabel="Selected" />
            <div aria-live="polite">
              {!selected || !day ? (
                <EmptyState className="py-8" icon={<CalendarCheck />} title="Pick a date" description="You will see its bookings, how many slots are left, and whether it is closed." />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-fg">{fmtDateLong(day.date)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={day.status === 'AVAILABLE' ? 'success' : day.status === 'LIMITED' ? 'warning' : day.status === 'FULL' ? 'danger' : 'neutral'} dot>{DAY_STATUS_LABEL[day.status]}</Badge>
                      <span className="text-[13px] text-fg-muted">{day.booked} of {day.capacity} booked</span>
                    </div>
                  </div>
                  {day.bookings && day.bookings.length > 0 ? (
                    <ul className="divide-y divide-line-soft rounded-[var(--radius-lg)] border border-line-soft">
                      {day.bookings.map((b) => (
                        <li key={b.projectId} className="px-4 py-2.5 text-sm"><span className="font-medium text-fg">{b.name}</span> <span className="text-fg-subtle">· {b.projectNumber}</span></li>
                      ))}
                    </ul>
                  ) : day.status !== 'CLOSED' && <p className="text-sm text-fg-muted">Nothing booked on this date.</p>}
                  {day.status === 'CLOSED' && <p className="flex items-center gap-2 text-sm text-fg-muted"><Lock className="size-4" aria-hidden="true" />Closed{day.closedReason ? `: ${day.closedReason}` : ''}. Reopen it from the closed dates list below.</p>}
                  {day.status !== 'CLOSED' && day.status !== 'PAST' && (
                    <Button variant="secondary" size="sm" onClick={() => { setPrefill(day.date); window.requestAnimationFrame(() => document.getElementById('closed-dates')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); }}><CalendarOff />Close this date</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>
      <div id="closed-dates"><ClosedDatesPanel blocked={blocked.data ?? []} onChanged={refreshAll} today={today} prefill={prefill} /></div>
      {settings.data && <RulesPanel key={`${settings.data.capacityPerDay}-${settings.data.minLeadDays}-${settings.data.maxAdvanceDays}`} settings={settings.data} onSaved={refreshAll} />}
    </div>
  );
}
