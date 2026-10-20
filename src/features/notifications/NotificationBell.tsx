'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/cn';

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const { items, unread, open, setOpen, markRead, markAllRead } = useNotifications(enabled);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  if (!enabled) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid size-10 cursor-pointer place-items-center rounded-[var(--radius-md)] text-fg-muted transition-colors hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[9px] font-bold leading-4 text-on-lime">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-12 z-[var(--z-dropdown)] w-80 overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface-raised shadow-[var(--elev-3)] animate-[ui-pop-in_var(--dur-base)_var(--ease-out)]">
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <p className="text-[13px] font-semibold text-fg">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="cursor-pointer text-xs font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-fg-muted">You’re all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { if (!item.isRead) void markRead(item.id); }}
                  className={cn('flex w-full cursor-pointer gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--hover)]', !item.isRead && 'bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]')}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.isRead ? 'bg-transparent' : 'bg-lime')} aria-hidden="true" />
                  <span>
                    <span className="block text-[13px] font-medium text-fg">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-fg-muted">{item.message}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
