'use client';

import * as React from 'react';
import { FileText, Search, X } from 'lucide-react';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Input, Pagination, Select, Skeleton, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { EVENT_TYPE_LABELS, num, quotesApi, type QuoteListQuery, type QuoteStatus, type QuoteSummary } from '@/lib/api/sales';
import { fmtDate, inr, quoteStatusMeta, timeAgo } from '../format';
import { useLoad } from '../ui';

const PAGE_SIZE = 15;
const STATUSES: Array<{ value: '' | QuoteStatus; label: string }> = [
  { value: '', label: 'All statuses' }, { value: 'DRAFT', label: 'Draft' }, { value: 'SENT', label: 'Sent' }, { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Declined' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'CANCELLED', label: 'Cancelled' },
];

export function StatusBadge({ q }: { q: Pick<QuoteSummary, 'status' | 'effectiveStatus' | 'viewState' | 'needsReview'> }) {
  const meta = quoteStatusMeta(q.effectiveStatus ?? q.status, q.viewState, q.needsReview);
  return <Badge tone={meta.tone} dot>{meta.label}</Badge>;
}

export function QuoteList({ onOpen, leadFilter, onClearLead, version }: { onOpen: (id: string) => void; leadFilter: { id: string; name: string } | null; onClearLead: () => void; version: number }) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [term, setTerm] = React.useState('');
  const [status, setStatus] = React.useState<'' | QuoteStatus>('');
  const [review, setReview] = React.useState(false);

  // Typing in the search box waits for a pause before asking the server.
  React.useEffect(() => { const t = window.setTimeout(() => { setTerm(search.trim()); setPage(1); }, 300); return () => window.clearTimeout(t); }, [search]);

  const query: QuoteListQuery = { page, limit: PAGE_SIZE, search: term || undefined, status: status || undefined, needsReview: review ? true : undefined, leadId: leadFilter?.id };
  const { data, error, loading, reload } = useLoad(() => quotesApi.list(query), [page, term, status, review, leadFilter?.id, version]);

  const rows = data?.data ?? [];
  const pagination = data?.meta.pagination;
  const filtered = Boolean(term || status || review || leadFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <label htmlFor="quote-search" className="sr-only">Search quotes</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <Input id="quote-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or quote number" className="pl-9" autoComplete="off" />
        </div>
        <div className="w-44">
          <label htmlFor="quote-status" className="sr-only">Filter by status</label>
          <Select id="quote-status" value={status} onChange={(e) => { setStatus(e.target.value as '' | QuoteStatus); setPage(1); }}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        </div>
        <div className="flex h-10 items-center"><Checkbox label="Needs review" checked={review} onChange={(e) => { setReview(e.target.checked); setPage(1); }} /></div>
      </div>
      {leadFilter && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          Showing quotes for <Badge tone="brand">{leadFilter.name}</Badge>
          <Button variant="ghost" size="sm" onClick={onClearLead} aria-label="Show all quotes"><X />Show all</Button>
        </p>
      )}

      {loading && !data ? (
        <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      ) : error && !data ? (
        <Card><ErrorState title="Couldn’t load your quotes" description={error} action={{ label: 'Try again', onClick: () => void reload() }} /></Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title={filtered ? 'No quotes match' : 'No quotes yet'}
            description={filtered ? 'Try a different search or clear the filters.' : 'Quotes appear here when a customer uses your booking page or when you make one from a lead.'}
            action={filtered ? { label: 'Clear filters', onClick: () => { setSearch(''); setStatus(''); setReview(false); onClearLead(); } } : undefined}
          />
        </Card>
      ) : (
        <div aria-busy={loading || undefined} className={loading ? 'opacity-70 transition-opacity' : undefined}>
          <Table aria-label="Quotes" className="min-w-[44rem]">
            <THead><TR className="hover:bg-transparent"><TH>Quote</TH><TH>Customer</TH><TH>Event</TH><TH className="text-right">Total</TH><TH>Status</TH></TR></THead>
            <TBody>
              {rows.map((q) => (
                <TR key={q.id} className="cursor-pointer" onClick={() => onOpen(q.id)}>
                  <TD>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(q.id); }} className="cursor-pointer rounded-sm text-left font-medium text-fg underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">{q.quotationNumber}</button>
                    <p className="text-xs text-fg-subtle">{fmtDate(q.issueDate)}{q.autoGenerated ? ' · from enquiry' : ''}</p>
                  </TD>
                  <TD><p className="font-medium">{q.customerName ?? q.client?.displayName ?? '—'}</p><p className="text-xs text-fg-subtle">{q.customerPhone ?? ''}</p></TD>
                  <TD><p>{q.eventType ? EVENT_TYPE_LABELS[q.eventType] : '—'}</p><p className="text-xs text-fg-subtle">{q.eventDate ? fmtDate(q.eventDate) : 'Date not set'}</p></TD>
                  <TD className="text-right font-medium tabular-nums">{inr(num(q.grandTotal))}</TD>
                  <TD>
                    <StatusBadge q={q} />
                    {q.viewCount > 0 && q.effectiveStatus === 'SENT' && <p className="mt-1 text-xs text-fg-subtle">Opened {q.viewCount}×{q.lastViewedAt ? ` · ${timeAgo(q.lastViewedAt)}` : ''}</p>}
                    {q.effectiveStatus === 'SENT' && q.viewState === 'NOT_OPENED' && <p className="mt-1 text-xs text-fg-subtle">Not opened{q.sentAt ? ` · sent ${timeAgo(q.sentAt)}` : ''}</p>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-fg-muted">{pagination ? `${pagination.total} quote${pagination.total === 1 ? '' : 's'}` : ''}</p>
            <Pagination page={pagination?.page ?? page} pageCount={pagination?.totalPages ?? 1} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
