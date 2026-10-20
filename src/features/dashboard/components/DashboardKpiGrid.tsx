import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  totalRevenue: number; totalAdvanceReceived: number; totalBalanceDue: number;
  allProjectsCount: number; runningProjectsCount: number; readyToDeliverCount: number;
  deliveredProjectsCount: number; pendingProjectsCount: number; urgentProjectsCount: number;
  onPayments?: () => void; onProjects: () => void; onCompleted: () => void; onUrgent: () => void;
  showRevenue?: boolean; showKpi?: boolean;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const card = 'group relative flex min-h-32 flex-col justify-between rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4 text-left shadow-[var(--elev-1)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-line hover:shadow-[var(--elev-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 cursor-pointer';

export function DashboardKpiGrid(props: Props) {
  const showRevenue = props.showRevenue !== false;
  const showKpi = props.showKpi !== false;
  if (!showRevenue && !showKpi) return null;
  const cards = [
    { title: 'All projects', value: props.allProjectsCount, detail: `${props.runningProjectsCount} running`, action: props.onProjects },
    { title: 'Ready to deliver', value: props.readyToDeliverCount, detail: 'Films and albums ready', action: props.onCompleted },
    { title: 'Delivered', value: props.deliveredProjectsCount, detail: 'Completed archive', action: props.onProjects },
    { title: 'Pending', value: props.pendingProjectsCount, detail: 'Awaiting shoots or edits', action: props.onProjects },
    { title: 'Urgent', value: props.urgentProjectsCount, detail: 'Deadline approaching', action: props.onUrgent, danger: props.urgentProjectsCount > 0 },
  ];
  const cols = showRevenue && showKpi ? 'xl:grid-cols-6' : showKpi ? 'xl:grid-cols-5' : 'xl:grid-cols-1';
  return (
    <section aria-label="Key figures" className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3', cols)}>
      {showRevenue && (
        <button type="button" onClick={props.onPayments} className={cn(card, 'sm:col-span-2 md:col-span-1')}>
          <span className="flex items-center justify-between text-[13px] font-medium text-fg-muted">Total revenue<ArrowUpRight className="size-4 text-fg-subtle transition-colors group-hover:text-brand" aria-hidden="true" /></span>
          <strong className="mt-2 block font-display text-2xl font-semibold tracking-tight text-fg tabular">{inr(props.totalRevenue)}</strong>
          <span className="mt-1 flex justify-between text-xs font-medium tabular"><span className="text-ok">Received {inr(props.totalAdvanceReceived)}</span><span className="text-bad">Due {inr(props.totalBalanceDue)}</span></span>
        </button>
      )}
      {showKpi && cards.map((c) => (
        <button key={c.title} type="button" onClick={c.action} className={card}>
          <span className="flex items-center justify-between text-[13px] font-medium text-fg-muted">{c.title}<ArrowUpRight className="size-4 text-fg-subtle transition-colors group-hover:text-brand" aria-hidden="true" /></span>
          <strong className={cn('mt-2 block font-display text-3xl font-semibold tracking-tight tabular', c.danger ? 'text-bad' : 'text-fg')}>{c.value}</strong>
          <span className="mt-1 block text-xs text-fg-subtle">{c.detail}</span>
        </button>
      ))}
    </section>
  );
}
