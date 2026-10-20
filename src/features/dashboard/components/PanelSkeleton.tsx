import { Skeleton } from '@/components/ui/Skeleton';

/** Placeholder for a dashboard panel whose data is still loading. */
export function PanelSkeleton({ rows = 3, title }: { rows?: number; title?: string }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-5 shadow-[var(--elev-1)]" aria-busy="true" aria-label={title ? `${title} loading` : 'Loading'}>
      {title && <p className="text-sm font-medium text-fg-subtle">{title}</p>}
      <div className="mt-3 space-y-2.5">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
    </section>
  );
}
