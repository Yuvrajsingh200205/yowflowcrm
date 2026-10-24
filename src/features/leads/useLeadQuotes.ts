'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { num, quotesApi, type QuoteStatus, type QuoteViewState } from '@/lib/api/sales';

export interface LeadQuoteSummary {
  count: number;
  latest: { id: string; number: string; status: QuoteStatus; viewState: QuoteViewState; needsReview: boolean; total: number };
}

/**
 * The newest quote of every lead, from one request rather than one per row. The most recent hundred quotes cover
 * the leads a studio is actively working; older ones are reachable from the Quotes screen.
 */
export function useLeadQuotes(enabled: boolean) {
  const [byLead, setByLead] = useState<Map<string, LeadQuoteSummary>>(new Map());
  const [total, setTotal] = useState(0);
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    const id = ++latest.current;
    try {
      const { data, meta } = await quotesApi.list({ limit: 100 });
      if (id !== latest.current) return;
      const map = new Map<string, LeadQuoteSummary>();
      // Newest first, so the first quote seen for a lead is its latest one.
      for (const q of data) {
        if (!q.lead) continue;
        const existing = map.get(q.lead.id);
        if (existing) existing.count += 1;
        else map.set(q.lead.id, { count: 1, latest: { id: q.id, number: q.quotationNumber, status: q.effectiveStatus, viewState: q.viewState, needsReview: q.needsReview, total: num(q.grandTotal) } });
      }
      setByLead(map);
      setTotal(meta.pagination?.total ?? data.length);
    } catch {
      // The leads list works without quote badges; a failed lookup just leaves them off.
    }
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);

  return { byLead, total, reload: load };
}
