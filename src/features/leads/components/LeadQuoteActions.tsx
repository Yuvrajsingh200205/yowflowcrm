'use client';

import { FilePlus2, Files } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { inr, quoteStatusMeta } from '@/features/sales/format';
import type { LeadQuoteSummary } from '../useLeadQuotes';

/** What a lead row offers for quotes: make one, or open the latest and see the rest. */
export function LeadQuoteActions({ summary, canCreate, canView, onCreate, onOpen, onViewAll }: {
  summary?: LeadQuoteSummary;
  canCreate: boolean;
  canView: boolean;
  onCreate: () => void;
  onOpen: (quoteId: string) => void;
  onViewAll: () => void;
}) {
  if (!summary) {
    return canCreate
      ? <Button size="sm" variant="secondary" onClick={onCreate}><FilePlus2 />Create quote</Button>
      : <span className="text-xs text-fg-subtle">No quote</span>;
  }
  const { latest, count } = summary;
  const meta = quoteStatusMeta(latest.status, latest.viewState, latest.needsReview);
  return (
    <div className="flex flex-col items-start gap-1.5">
      {canView ? (
        <button type="button" onClick={() => onOpen(latest.id)} className="group flex cursor-pointer flex-col items-start gap-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]" aria-label={`Open quote ${latest.number}, ${meta.label}`}>
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
          <span className="text-xs font-medium text-fg group-hover:underline">{latest.number} · {inr(latest.total)}</span>
        </button>
      ) : <Badge tone={meta.tone} dot>{meta.label}</Badge>}
      <div className="flex flex-wrap gap-1">
        {canView && count > 1 && <Button size="sm" variant="ghost" onClick={onViewAll}><Files />All {count}</Button>}
        {canCreate && <Button size="sm" variant="ghost" onClick={onCreate}><FilePlus2 />New</Button>}
      </div>
    </div>
  );
}
