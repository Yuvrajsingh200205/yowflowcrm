import type { DayStatus, QuoteStatus, QuoteViewState } from '@/lib/api/sales';

const RUPEES = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const RUPEES_FIXED = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** ₹1,35,700 — paise only when there are some, so round prices stay readable. */
export const inr = (n: number | null | undefined): string => `₹${RUPEES.format(Number.isFinite(n as number) ? (n as number) : 0)}`;
/** ₹1,35,700.00 for places where columns of amounts line up. */
export const inrFixed = (n: number | null | undefined): string => `₹${RUPEES_FIXED.format(Number.isFinite(n as number) ? (n as number) : 0)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** `2027-01-21` -> `21 Jan 2027`, read as a calendar date so no time zone can shift the day. */
export function fmtDate(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!m) return '—';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function fmtDateLong(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!m) return '—';
  const weekday = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' });
  return `${weekday}, ${Number(m[3])} ${MONTHS_LONG[Number(m[2]) - 1]} ${m[1]}`;
}

export const monthLabel = (year: number, month0: number) => `${MONTHS_LONG[month0]} ${year}`;

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** "5 minutes ago", "2 days ago": for activity feeds where the exact time matters less than recency. */
export function timeAgo(value: string | null | undefined, now = Date.now()): string {
  if (!value) return '—';
  const diff = Math.max(0, now - new Date(value).getTime());
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const ymdOf = (year: number, month0: number, day: number) => `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
/** Today in the browser's own calendar, as YYYY-MM-DD (the server's own "today" is used where it matters). */
export const localToday = (): string => {
  const d = new Date();
  return ymdOf(d.getFullYear(), d.getMonth(), d.getDate());
};

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export function quoteStatusMeta(status: QuoteStatus, viewState: QuoteViewState, needsReview = false): { label: string; tone: Tone } {
  if (status === 'DRAFT') return needsReview ? { label: 'Needs review', tone: 'warning' } : { label: 'Draft', tone: 'neutral' };
  if (status === 'SENT') return viewState === 'OPENED' ? { label: 'Opened', tone: 'info' } : { label: 'Sent', tone: 'brand' };
  if (status === 'ACCEPTED') return { label: 'Accepted', tone: 'success' };
  if (status === 'REJECTED') return { label: 'Declined', tone: 'danger' };
  if (status === 'EXPIRED') return { label: 'Expired', tone: 'warning' };
  return { label: 'Cancelled', tone: 'neutral' };
}

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  AVAILABLE: 'Available',
  LIMITED: 'Limited',
  FULL: 'Fully booked',
  CLOSED: 'Closed',
  PAST: 'Past date',
  TOO_SOON: 'Too soon to book',
  TOO_FAR: 'Too far ahead',
};

/** Reduces what people type for an Indian mobile to the ten digits the server expects. */
export function normalizeMobile(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return d;
}
export const isValidMobile = (value: string): boolean => /^[6-9]\d{9}$/.test(normalizeMobile(value));
export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const errorMessage = (error: unknown, fallback: string): string => (error instanceof Error && error.message ? error.message : fallback);

/** Field-level messages from an API validation error, keyed by field name. */
export function fieldErrors(error: unknown): Record<string, string> {
  const details = (error as { details?: unknown } | null)?.details;
  const out: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const d of details) {
      const f = (d as { field?: unknown; message?: unknown }) ?? {};
      if (typeof f.field === 'string' && typeof f.message === 'string' && !out[f.field]) out[f.field] = f.message;
    }
  }
  return out;
}
