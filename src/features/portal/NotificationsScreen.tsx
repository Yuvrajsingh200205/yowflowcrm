'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { portalApi, errorMessage, fmtDate, type PortalNotification } from './api';
import { usePortal } from './PortalProvider';

export function NotificationsScreen() {
  const { setUnread } = usePortal();
  const [items, setItems] = React.useState<PortalNotification[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => { setError(null); portalApi.notifications().then((n) => { setItems(n.items); setUnread(n.unread); }).catch((e) => setError(errorMessage(e))); }, [setUnread]);
  React.useEffect(load, [load]);

  const unread = items?.filter((i) => !i.isRead).length ?? 0;
  const readAll = async () => { await portalApi.readAllNotifications().catch(() => undefined); setItems((cur) => cur?.map((i) => ({ ...i, isRead: true })) ?? cur); setUnread(0); };
  const markRead = (n: PortalNotification) => { if (n.isRead) return; portalApi.readNotification(n.id).catch(() => undefined); setItems((cur) => cur?.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)) ?? cur); setUnread(Math.max(0, unread - 1)); };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3"><h1 className="font-display text-3xl font-semibold tracking-tight">Notifications</h1>{unread > 0 && <Button size="sm" variant="secondary" onClick={readAll}>Mark all as read</Button>}</div>
      <div className="mt-6">
        {error && <ErrorState title="Couldn’t load notifications" description={error} action={{ label: 'Try again', onClick: load }} />}
        {!error && !items && <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
        {items?.length === 0 && <EmptyState icon={<Bell />} title="You’re all caught up" description="We’ll let you know when your gallery is ready or your studio replies." />}
        <ul className="divide-y divide-line-soft overflow-hidden rounded-[var(--radius-xl)] border border-line-soft bg-surface">
          {items?.map((n) => {
            const body = (
              <div className="flex gap-3 px-4 py-4">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-lime')} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm text-fg', !n.isRead && 'font-semibold')}>{n.isRead ? null : <span className="sr-only">Unread: </span>}{n.title}</p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-fg-subtle">{fmtDate(n.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{n.actionLabel ? ` · ${n.actionLabel}` : ''}</p>
                </div>
              </div>
            );
            return <li key={n.id}>{n.actionPath ? <Link href={n.actionPath} onClick={() => markRead(n)} className="block hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]">{body}</Link> : <button type="button" onClick={() => markRead(n)} className="block w-full cursor-pointer text-left hover:bg-[var(--hover)]">{body}</button>}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
