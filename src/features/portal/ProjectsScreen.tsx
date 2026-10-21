'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, Camera, ChevronRight, ImageIcon, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { portalApi, errorMessage, fmtDate, inr, type ProjectCard } from './api';
import { usePortal } from './PortalProvider';

function ProjectTile({ p }: { p: ProjectCard }) {
  const pct = p.payments.total > 0 ? Math.min(100, Math.round((p.payments.received / p.payments.total) * 100)) : 0;
  return (
    <Card interactive className="group relative p-0">
      <Link href={`/client/projects/${p.id}`} className="block rounded-[inherit] p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold tracking-tight text-fg">{p.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{fmtDate(p.weddingDate)}</span>
              {(p.venueName || p.venueCity) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{[p.venueName, p.venueCity].filter(Boolean).join(', ')}</span>}
            </p>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] bg-surface-sunken p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-subtle"><ImageIcon className="size-3.5" aria-hidden="true" />Gallery</p>
            {p.gallery.published
              ? <p className="mt-1.5 text-sm text-fg"><strong className="text-lg font-semibold">{p.gallery.mediaCount}</strong> photographs ready</p>
              : <p className="mt-1.5 text-sm text-fg-muted">{p.gallery.expectedDeliveryDate ? <>Expected around {fmtDate(p.gallery.expectedDeliveryDate)}</> : 'We’ll let you know when it’s ready'}</p>}
          </div>
          <div className="rounded-[var(--radius-lg)] bg-surface-sunken p-4">
            <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-fg-subtle"><span>Payments</span><span>{pct}%</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Paid" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-sm text-fg-muted">{p.payments.balance > 0 ? <>{inr(p.payments.balance)} balance</> : 'Fully paid'}</p>
          </div>
        </div>
        {p.openRequests > 0 && <Badge tone="info" className="mt-4">{p.openRequests} open request{p.openRequests > 1 ? 's' : ''}</Badge>}
      </Link>
    </Card>
  );
}

export function ProjectsScreen() {
  const { me, setUnread } = usePortal();
  const [data, setData] = React.useState<Awaited<ReturnType<typeof portalApi.projects>> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => {
    setError(null);
    portalApi.projects().then((d) => { setData(d); setUnread(d.unreadNotifications); }).catch((e) => setError(errorMessage(e)));
  }, [setUnread]);
  React.useEffect(load, [load]);

  const name = me.client.brideName && me.client.groomName ? `${me.client.brideName} & ${me.client.groomName}` : me.client.displayName;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome, {name}</h1>
      <p className="mt-1.5 text-[15px] text-fg-muted">Everything {me.studio.name} is creating for you, in one place.</p>
      <div className="mt-8 space-y-4">
        {error && <ErrorState title="We couldn’t load your projects" description={error} action={{ label: 'Try again', onClick: load }} />}
        {!error && !data && <><Skeleton className="h-52 w-full rounded-[var(--radius-xl)]" /><Skeleton className="h-52 w-full rounded-[var(--radius-xl)]" /></>}
        {data && data.projects.length === 0 && <EmptyState icon={<Camera />} title="No projects yet" description="Your studio will add your wedding here. You’ll get an email as soon as there’s something to see." />}
        {data?.projects.map((p) => <ProjectTile key={p.id} p={p} />)}
      </div>
    </div>
  );
}
