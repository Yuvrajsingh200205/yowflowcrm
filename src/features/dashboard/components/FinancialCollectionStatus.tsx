import { IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Props { totalRevenue: number; totalAdvanceReceived: number; totalBalanceDue: number; currentUserName?: string; }
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function FinancialCollectionStatus({ totalRevenue, totalAdvanceReceived, totalBalanceDue, currentUserName }: Props) {
  const collected = totalRevenue > 0 ? (totalAdvanceReceived / totalRevenue) * 100 : 0;
  const due = totalRevenue > 0 ? (totalBalanceDue / totalRevenue) * 100 : 0;
  return (
    <section aria-labelledby="fin-status" className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-5 shadow-[var(--elev-1)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="fin-status" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg"><IndianRupee className="size-4 text-brand" aria-hidden="true" />Collection status</h3>
          <p className="mt-1 text-[13px] text-fg-muted">Revenue collected against pending client balances.</p>
        </div>
        <Badge tone="neutral">{currentUserName ? `${currentUserName}'s ledger` : 'Studio ledger'}</Badge>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[13px] font-medium tabular"><span className="text-ok">Received {inr(totalAdvanceReceived)}</span><span className="text-bad">Due {inr(totalBalanceDue)}</span></div>
        <div className="mt-2 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label={`${Math.round(collected)} percent collected`}>
          <div className="h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${collected}%` }} />
          <div className="h-full rounded-full bg-bad/80 transition-[width] duration-500" style={{ width: `${due}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-fg-subtle tabular"><span>Total bookings {inr(totalRevenue)}</span><span>{Math.round(collected)}% collected</span></div>
      </div>
    </section>
  );
}
