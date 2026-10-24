'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';
import { salesSetupApi, type DateCheck } from '@/lib/api/sales';

/**
 * A heads-up under a date field when the studio is already booked or closed that day. It never blocks: staff may
 * know there is room (a second crew), and a failed lookup simply shows nothing.
 */
export function DateAvailabilityHint({ date, excludeProjectId }: { date: string; excludeProjectId?: string }) {
  const [check, setCheck] = React.useState<DateCheck | null>(null);

  React.useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setCheck(null); return; }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      salesSetupApi.checkDate(date, excludeProjectId).then((c) => { if (!cancelled) setCheck(c); }).catch(() => { if (!cancelled) setCheck(null); });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [date, excludeProjectId]);

  if (!check || (check.status !== 'FULL' && check.status !== 'CLOSED')) return null;
  return (
    <p role="status" className="mt-1 flex items-start gap-1 rounded bg-warn-bg px-2 py-1 text-[11px] font-medium leading-snug text-fg">
      <TriangleAlert className="mt-px size-3 shrink-0 text-warn" aria-hidden="true" />
      <span>{check.reason} You can still save it.</span>
    </p>
  );
}
