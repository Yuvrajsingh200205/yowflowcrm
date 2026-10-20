import { Calendar, MapPin } from 'lucide-react';
import { Project } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

type Shoot = Project['shoots'][number] & { clientTitle: string; projectId: string };

export function UpcomingShoots({ shoots, onOpen }: { shoots: Shoot[]; onOpen: () => void }) {
  return (
    <section aria-labelledby="upcoming-shoots" className="flex h-[34rem] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface shadow-[var(--elev-1)]">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
        <h3 id="upcoming-shoots" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg"><Calendar className="size-4 text-brand" aria-hidden="true" />Upcoming shoots</h3>
        <button type="button" onClick={onOpen} className="cursor-pointer text-[13px] font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">View calendar →</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {shoots.length === 0 ? (
          <EmptyState icon={<Calendar />} title="No shoots scheduled" description="Scheduled shoots show up here with crew and venue." action={{ label: 'Schedule a shoot', onClick: onOpen }} />
        ) : (
          <ul className="space-y-2">
            {shoots.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-md)] border border-line-soft bg-surface-sunken p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-fg">{s.title}</p>
                  <Badge tone="neutral" className="font-mono tabular">{s.date}</Badge>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-fg-muted">{s.clientTitle}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle"><MapPin className="size-3" aria-hidden="true" /><span className="truncate">{s.venue}</span></p>
                {(s.leadPhotographer || s.cinematographer || s.droneOperator) && (
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-line-soft pt-2 text-xs text-fg-muted">
                    {s.leadPhotographer && <span>Lead: {s.leadPhotographer}</span>}
                    {s.cinematographer && <span>Cine: {s.cinematographer}</span>}
                    {s.droneOperator && <span>Drone: {s.droneOperator}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
