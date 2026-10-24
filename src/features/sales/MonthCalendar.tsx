'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DayStatus } from '@/lib/api/sales';
import { DAY_STATUS_LABEL, fmtDateLong, monthLabel, pad2, ymdOf } from './format';

export interface CalendarCell {
  status: DayStatus;
  /** Whether the date can be picked. Informational calendars leave every date selectable. */
  bookable?: boolean;
  /** Short text under the day number (staff view), for example "2 booked". */
  note?: string;
}

export interface CalendarMonth { year: number; month0: number }

interface Props {
  month: CalendarMonth;
  onMonthChange: (next: CalendarMonth) => void;
  cells: Record<string, CalendarCell | undefined>;
  today: string;
  selected?: string | null;
  onSelect?: (date: string) => void;
  /** When true, dates without data are not selectable (the customer calendar before availability has loaded). */
  requireData?: boolean;
  loading?: boolean;
  minMonth?: CalendarMonth;
  maxMonth?: CalendarMonth;
  /** Larger cells that have room for a note; the customer calendar stays compact. */
  roomy?: boolean;
  /** Staff inspect any date, including full, closed and past ones. */
  anyDate?: boolean;
  label?: string;
  /** Legend wording for the chosen date: "Your date" for customers, "Selected" for staff. */
  selectedLabel?: string;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const cmp = (a: CalendarMonth, b: CalendarMonth) => a.year * 12 + a.month0 - (b.year * 12 + b.month0);
const shift = (m: CalendarMonth, delta: number): CalendarMonth => {
  const total = m.year * 12 + m.month0 + delta;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
};

export const monthRange = (m: CalendarMonth) => ({
  from: ymdOf(m.year, m.month0, 1),
  to: ymdOf(m.year, m.month0, new Date(Date.UTC(m.year, m.month0 + 1, 0)).getUTCDate()),
});
export const monthOf = (ymd: string): CalendarMonth => ({ year: Number(ymd.slice(0, 4)), month0: Number(ymd.slice(5, 7)) - 1 });

/** Whether a cell can be chosen: bookable when the data says so, otherwise anything that is not closed, full or out of range. */
export const isPickable = (cell: CalendarCell | undefined, requireData: boolean) => {
  if (!cell) return !requireData;
  if (cell.bookable !== undefined) return cell.bookable;
  return cell.status === 'AVAILABLE' || cell.status === 'LIMITED';
};

const TONE: Record<DayStatus, string> = {
  AVAILABLE: 'bg-ok-bg text-fg hover:border-ok',
  LIMITED: 'bg-warn-bg text-fg hover:border-warn',
  FULL: 'bg-bad-bg text-fg-muted line-through decoration-bad/60',
  CLOSED: 'bg-surface-sunken text-fg-subtle [background-image:repeating-linear-gradient(135deg,transparent_0_5px,var(--border)_5px_6px)]',
  PAST: 'bg-transparent text-fg-subtle',
  TOO_SOON: 'bg-transparent text-fg-subtle',
  TOO_FAR: 'bg-transparent text-fg-subtle',
};

export function MonthCalendar({ month, onMonthChange, cells, today, selected, onSelect, requireData = false, loading, minMonth, maxMonth, roomy, anyDate, label = 'Choose a date', selectedLabel = 'Your date', className }: Props) {
  const [focusDate, setFocusDate] = React.useState<string | null>(null);
  const buttons = React.useRef(new Map<string, HTMLButtonElement>());
  const first = new Date(Date.UTC(month.year, month.month0, 1)).getUTCDay();
  const length = new Date(Date.UTC(month.year, month.month0 + 1, 0)).getUTCDate();
  const canPrev = !minMonth || cmp(month, minMonth) > 0;
  const canNext = !maxMonth || cmp(month, maxMonth) < 0;
  const tabStop = focusDate && focusDate.startsWith(`${month.year}-${pad2(month.month0 + 1)}`) ? focusDate
    : selected && selected.startsWith(`${month.year}-${pad2(month.month0 + 1)}`) ? selected
      : today.startsWith(`${month.year}-${pad2(month.month0 + 1)}`) ? today : ymdOf(month.year, month.month0, 1);

  const move = (date: string, deltaDays: number) => {
    const d = new Date(Date.parse(`${date}T00:00:00Z`) + deltaDays * 86_400_000).toISOString().slice(0, 10);
    const target = monthOf(d);
    if ((minMonth && cmp(target, minMonth) < 0) || (maxMonth && cmp(target, maxMonth) > 0)) return;
    setFocusDate(d);
    if (cmp(target, month) !== 0) onMonthChange(target);
    requestAnimationFrame(() => buttons.current.get(d)?.focus());
  };

  const onKeyDown = (event: React.KeyboardEvent, date: string) => {
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in keys) { event.preventDefault(); move(date, keys[event.key]); return; }
    if (event.key === 'Home') { event.preventDefault(); move(date, -new Date(`${date}T00:00:00Z`).getUTCDay()); return; }
    if (event.key === 'End') { event.preventDefault(); move(date, 6 - new Date(`${date}T00:00:00Z`).getUTCDay()); return; }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const target = shift(month, event.key === 'PageUp' ? -1 : 1);
      if ((minMonth && cmp(target, minMonth) < 0) || (maxMonth && cmp(target, maxMonth) > 0)) return;
      const day = Math.min(Number(date.slice(8, 10)), new Date(Date.UTC(target.year, target.month0 + 1, 0)).getUTCDate());
      const next = ymdOf(target.year, target.month0, day);
      setFocusDate(next);
      onMonthChange(target);
      requestAnimationFrame(() => buttons.current.get(next)?.focus());
    }
  };

  const nav = 'grid size-11 cursor-pointer place-items-center rounded-[var(--radius-md)] border border-line bg-surface text-fg transition-colors hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" className={nav} aria-label="Previous month" disabled={!canPrev} onClick={() => onMonthChange(shift(month, -1))}><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <h3 className="text-sm font-semibold text-fg" aria-live="polite">{monthLabel(month.year, month.month0)}</h3>
        <button type="button" className={nav} aria-label="Next month" disabled={!canNext} onClick={() => onMonthChange(shift(month, 1))}><ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>
      <div role="group" aria-label={label} aria-busy={loading || undefined} className={cn('transition-opacity', loading && 'opacity-60')}>
        <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
          {WEEKDAYS.map((d) => <div key={d} className="text-center text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: first }, (_, i) => <div key={`pad-${i}`} aria-hidden="true" />)}
          {Array.from({ length }, (_, i) => {
            const day = i + 1;
            const date = ymdOf(month.year, month.month0, day);
            const cell = cells[date];
            const status: DayStatus = cell?.status ?? (date < today ? 'PAST' : 'AVAILABLE');
            const pickable = onSelect ? anyDate || (isPickable(cell, requireData) && date >= today) : false;
            const isSelected = selected === date;
            const known = Boolean(cell);
            const text = known ? DAY_STATUS_LABEL[status] : requireData ? 'checking' : '';
            return (
              <button
                key={date}
                ref={(el) => { if (el) buttons.current.set(date, el); else buttons.current.delete(date); }}
                type="button"
                tabIndex={date === tabStop ? 0 : -1}
                aria-label={`${fmtDateLong(date)}${text ? `, ${text.toLowerCase()}` : ''}${cell?.note ? `, ${cell.note}` : ''}${onSelect && !pickable ? ', not selectable' : ''}`}
                aria-pressed={onSelect ? isSelected : undefined}
                aria-disabled={onSelect && !pickable ? true : undefined}
                onFocus={() => setFocusDate(date)}
                onKeyDown={(e) => onKeyDown(e, date)}
                onClick={() => { if (onSelect && pickable) onSelect(date); }}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-transparent text-sm font-medium tabular-nums transition-colors',
                  roomy ? 'min-h-16 gap-0.5 py-1.5' : 'aspect-square min-h-11',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]',
                  known || !requireData ? TONE[status] : 'bg-surface-sunken text-fg-subtle',
                  onSelect && pickable ? 'cursor-pointer' : 'cursor-default',
                  date === today && !isSelected && 'border-line-strong',
                  isSelected && 'border-transparent bg-brand text-on-brand [background-image:none] no-underline hover:border-transparent',
                )}
              >
                <span aria-hidden="true">{day}</span>
                {roomy && cell?.note && <span className={cn('px-0.5 text-center text-[10px] font-normal leading-tight', isSelected ? 'text-on-brand' : 'text-fg-muted')} aria-hidden="true">{cell.note}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted" aria-label="Calendar key">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-ok-bg ring-1 ring-ok/40" aria-hidden="true" />Available</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-bad-bg ring-1 ring-bad/40" aria-hidden="true" />Booked</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-surface-sunken ring-1 ring-line [background-image:repeating-linear-gradient(135deg,transparent_0_3px,var(--border)_3px_4px)]" aria-hidden="true" />Closed</li>
        {selected !== undefined && <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-brand" aria-hidden="true" />{selectedLabel}</li>}
      </ul>
    </div>
  );
}
