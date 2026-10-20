'use client';

import { useState } from 'react';
import { Clock3, LogIn, LogOut } from 'lucide-react';
import { useMyAttendance } from '@/hooks/useMyAttendance';
import { ApiError } from '@/lib/api/client';
import { Badge, BTN_GHOST, BTN_PRIMARY, CARD } from '@/features/team/components/TeamUiKit';

function localDate(): string { return new Date().toLocaleDateString('en-CA'); }
function time(value: string | null): string { return value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function duration(minutes: number): string { return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }

export function MyAttendanceCard({ userId, canView }: { userId: string; canView: boolean }) {
  const { records, loading, error, pending, mark } = useMyAttendance(userId, canView);
  const [actionError, setActionError] = useState<string | null>(null);
  const today = localDate();
  const record = records.find((item) => item.date.slice(0, 10) === today);
  const checkIn = async () => {
    setActionError(null);
    try { await mark({ date: today, checkIn: new Date().toISOString(), status: 'PRESENT', source: 'PASSWORD', workLocation: 'OFFICE' }); }
    catch (reason) { setActionError(reason instanceof ApiError && reason.status === 403 ? 'You do not have permission to mark attendance.' : reason instanceof Error ? reason.message : 'Unable to check in.'); }
  };
  const checkOut = async () => {
    if (!record?.checkIn) return;
    setActionError(null);
    try { await mark({ date: today, checkIn: record.checkIn, checkOut: new Date().toISOString(), status: record.status, source: 'PASSWORD', workLocation: record.workLocation }); }
    catch (reason) { setActionError(reason instanceof ApiError && reason.status === 403 ? 'You do not have permission to mark attendance.' : reason instanceof Error ? reason.message : 'Unable to check out.'); }
  };
  const message = error instanceof ApiError && error.status === 403 ? 'You do not have permission to access attendance.' : error?.message;
  return (
    <section className={`${CARD} flex h-full flex-col p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">My Attendance</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
        </div>
        <Badge className={record?.checkOut ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : record?.checkIn ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-600'}>
          {record?.checkOut ? 'Completed' : record?.checkIn ? 'Checked In' : 'Not Marked'}
        </Badge>
      </div>
      {loading ? <p className="mt-4 text-xs font-medium text-slate-500">Loading attendance…</p> : message ? <p className="mt-4 text-xs font-medium text-red-600">{message}</p> : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-[#FBFDF6] p-2"><p className="text-[10px] font-bold uppercase text-slate-400">Check in</p><p className="mt-1 font-extrabold text-slate-800">{time(record?.checkIn ?? null)}</p></div>
            <div className="rounded-xl bg-[#FBFDF6] p-2"><p className="text-[10px] font-bold uppercase text-slate-400">Check out</p><p className="mt-1 font-extrabold text-slate-800">{time(record?.checkOut ?? null)}</p></div>
            <div className="rounded-xl bg-[#FBFDF6] p-2"><p className="text-[10px] font-bold uppercase text-slate-400">Hours</p><p className="mt-1 font-extrabold text-slate-800">{record?.checkOut ? duration(record.workingMinutes) : '—'}</p></div>
          </div>
          <div className="mt-auto flex gap-2 pt-3">
            {!record?.checkIn ? <button type="button" disabled={pending} onClick={() => void checkIn()} className={BTN_PRIMARY}><LogIn className="size-3.5" /> {pending ? 'Checking in…' : 'Check In'}</button> : !record.checkOut ? <button type="button" disabled={pending} onClick={() => void checkOut()} className={BTN_PRIMARY}><LogOut className="size-3.5" /> {pending ? 'Checking out…' : 'Check Out'}</button> : <span className={`${BTN_GHOST} pointer-events-none`}><Clock3 className="size-3.5" /> Attendance complete</span>}
          </div>
          {actionError && <p className="mt-3 text-xs font-medium text-red-600">{actionError}</p>}
          {records.filter((item) => item.date.slice(0, 10) !== today).length > 0 && (
            <div className="mt-4 border-t border-[#eee7e2] pt-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recent attendance</p>
              <div className="mt-2 space-y-1.5">
                {records.filter((item) => item.date.slice(0, 10) !== today).slice(0, 5).map((item) => (
                  <p key={item.id} className="text-[11px] font-medium text-slate-600">{item.date.slice(0, 10)} · {time(item.checkIn)} – {time(item.checkOut)} · {item.checkOut ? duration(item.workingMinutes) : item.status}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
