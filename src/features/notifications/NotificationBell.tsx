'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const { items, unread, open, setOpen, markRead, markAllRead } = useNotifications(enabled);
  if (!enabled) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Notifications"
        className="relative flex h-9 items-center rounded-xl border border-[#e4d8d2] bg-white px-2.5 text-[#3F443C] transition hover:bg-[#faf5f3]"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#464B43] px-1 text-[9px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-[#e4d8d2] bg-white shadow-[0_14px_35px_rgba(27,29,26,.16)]">
          <div className="flex items-center justify-between border-b border-[#f0e9e5] px-3 py-2">
            <p className="text-xs font-extrabold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-[10px] font-bold text-[#464B43]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { if (!item.isRead) void markRead(item.id); }}
                  className={`block w-full border-b border-[#f6f0ed] px-3 py-2.5 text-left ${item.isRead ? 'bg-white' : 'bg-[#fbfcfc]'}`}
                >
                  <p className="text-xs font-extrabold text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{item.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
