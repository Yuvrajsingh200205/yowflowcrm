'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Save, Trash2, Video, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { freelancerPortalApi, AvailabilityStatus, PortalAvailability, PortalPortfolioItem, PortalShootSummary } from '@/lib/api/freelancerPortal';
import { getFreelancerProfileCompletion } from '../profileCompletion';
import { useFreelancerPortal } from '../useFreelancerPortal';
import { PortalCard, PortalState } from './FreelancerPortalShell';
import { BRAND } from '@/config/brand';

const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#3B665C] px-4 py-2 text-sm font-black text-white transition hover:bg-[#30564D] disabled:opacity-60';
const field = 'mt-1 w-full rounded-xl border border-[#DFD9D2] bg-[#F7F6F3] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#3B665C]';
const label = 'text-xs font-extrabold text-[#686164]';

function LoadingState() {
  return <PortalState title="Loading portal" text="Fetching your latest freelancer profile." action={<Loader2 className="mx-auto size-5 animate-spin text-[#3B665C]" />} />;
}

function ErrorState({ text, retry }: { text: string; retry: () => void }) {
  return <PortalState title="Could not load portal" text={text} action={<button className={btn} onClick={retry}>Retry</button>} />;
}

export function DashboardPage() {
  const { data, loading, error, reload } = useFreelancerPortal();
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No portal data available.'} retry={reload} />;
  const profile = data.freelancer;
  const completion = getFreelancerProfileCompletion(profile);
  const subscription = profile.subscriptions[0];
  const today = new Date().toISOString().slice(0, 10);
  const todayAvailability = profile.availability.find((item) => item.date.slice(0, 10) === today);
  const futureAssignments = profile.assignments.filter((item) => item.shoot && item.shoot.shootDate.slice(0, 10) >= today);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#3B665C]">Freelancer Portal</p>
        <h1 className="text-3xl font-black">Welcome, {profile.fullName}</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PortalCard>
          <p className="text-sm font-black">Profile completion</p>
          <div className="mt-3 h-3 rounded-full bg-[#F0EDE9]"><div className="h-3 rounded-full bg-[#527A68]" style={{ width: `${completion.percentage}%` }} /></div>
          <p className="mt-2 text-2xl font-black">{completion.percentage}%</p>
          <p className="text-xs font-medium text-[#686164]">{completion.missing[0] ? `Missing: ${completion.missing.slice(0, 3).join(', ')}` : 'Profile requirements complete.'}</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-black">Subscription</p>
          <p className="mt-2 text-2xl font-black">{subscription?.plan?.name ?? 'No active plan'}</p>
          <p className="text-xs font-bold text-[#686164]">{subscription ? `${subscription.status} · ${subscription.currentPeriodEnd ? `until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : 'no expiry set'}` : 'Choose a plan when checkout is available.'}</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm font-black">Searchability</p>
          <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${data.searchable ? 'bg-[#527A68]/10 text-[#527A68]' : 'bg-[#B78332]/10 text-[#B78332]'}`}>
            {data.searchable ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {data.searchable ? 'Visible to studio search' : 'Not searchable yet'}
          </p>
        </PortalCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PortalCard>
          <div className="flex items-center justify-between gap-3"><h2 className="font-black">Availability</h2><Link className="text-sm font-black text-[#3B665C]" href="/freelancer/availability">Update</Link></div>
          <p className="mt-3 text-sm font-semibold text-[#686164]">Today: {todayAvailability?.status?.replaceAll('_', ' ') ?? 'No availability added'}</p>
        </PortalCard>
        <PortalCard>
          <h2 className="font-black">Connections & assignments</h2>
          <p className="mt-3 text-sm font-semibold text-[#686164]">{profile.connections.length} connection records</p>
          <p className="text-sm font-semibold text-[#686164]">{futureAssignments.length} future assignments</p>
        </PortalCard>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const profile = data?.freelancer;
  const [form, setForm] = useState<Record<string, string>>({});
  const value = (key: keyof NonNullable<typeof profile>) => form[String(key)] ?? String(profile?.[key] ?? '');
  if (loading) return <LoadingState />;
  if (error || !data || !profile) return <ErrorState text={error || 'No profile loaded.'} retry={reload} />;
  const completion = getFreelancerProfileCompletion(profile);
  const latestApplication = profile.applications[0];
  const latestSubscription = profile.subscriptions[0];
  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await freelancerPortalApi.updateProfile({
        fullName: value('fullName'),
        email: value('email') || null,
        city: value('city') || null,
        experienceYears: Number(value('experienceYears')) || 0,
        skills: value('skills').split(',').map((s) => s.trim()).filter(Boolean),
        equipmentNotes: value('equipmentNotes') || null,
        notes: value('notes') || null,
      });
      setData({ ...data, freelancer: { ...profile, ...updated } });
      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };
  const initials = profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'F';
  const roleLabel = (profile.primarySkill || 'OTHER').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-[#152A25] to-[#1B352F] p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#C9A876]">{BRAND.name}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">My Profile</h1>
        <p className="mt-2 max-w-2xl text-base font-medium leading-6 text-white/65">Review and refine the details you submitted after purchase.</p>
      </section>
      <div className="grid gap-5 rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-[#EDE8E2] bg-[#fbfaf8] p-6 text-center">
          <div className="mx-auto grid size-40 place-items-center rounded-full bg-[#EDF4F2] text-5xl font-black text-[#3B665C]">{initials.slice(0, 1)}</div>
          <button type="button" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8BE93] bg-white px-5 text-sm font-black text-[#254b42] transition hover:bg-[#EDF4F2]"><Camera className="size-4" />Upload Photo</button>
          <p className="mt-4 text-sm font-bold text-[#35423F]">{latestSubscription?.plan?.name ?? 'Freelancer'}{latestSubscription?.plan?.billingInterval ? ` · ${String(latestSubscription.plan.billingInterval).toLowerCase()}` : ''}</p>
          <div className="mt-6 rounded-xl border border-[#eee7e2] bg-white p-3 text-left text-xs font-bold text-[#35423F]">
            <p>Completion: {completion.percentage}%</p>
            <p className="mt-1">Application: {latestApplication?.status ?? 'No application'}</p>
            <p className="mt-1">Searchable: {data.searchable ? 'Yes' : 'Not yet'}</p>
          </div>
        </aside>
        <div className="grid gap-4 lg:grid-cols-2">
          <label><span className={label}>Name</span><input className={field} value={value('fullName')} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label><span className={label}>Studio / Brand</span><input className={field} value={value('notes').split('\n').find((line) => line.startsWith('Studio:'))?.replace('Studio:', '').trim() || profile.fullName} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <label><span className={label}>Phone</span><input className={field} value={profile.phone} disabled /></label>
          <label><span className={label}>Email</span><input className={field} value={value('email')} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span className={label}>Base city</span><input className={field} value={value('city')} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label><span className={label}>Primary role</span><input className={field} value={roleLabel} disabled /></label>
          <label className="lg:col-span-2"><span className={label}>Professional headline</span><input className={field} value={value('notes').split('\n').find((line) => line.startsWith('Headline:'))?.replace('Headline:', '').trim() || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <label><span className={label}>Experience years</span><input type="number" className={field} value={value('experienceYears')} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} /></label>
          <label><span className={label}>Daily rate</span><input className={field} value={String(profile.rate ?? '')} disabled /></label>
          <label className="lg:col-span-2"><span className={label}>Skills, comma separated</span><input className={field} value={form.skills ?? profile.skills.join(', ')} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></label>
          <label className="lg:col-span-2"><span className={label}>Portfolio links</span><textarea className={field} value={value('notes').split('\n').find((line) => line.startsWith('Portfolio:'))?.replace('Portfolio:', '').trim() || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Instagram, YouTube, website or Behance link" /></label>
          <label className="lg:col-span-2"><span className={label}>Bio / notes</span><textarea className={field} value={value('notes')} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button className={btn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>{message ? <p className="text-sm font-bold text-[#686164]">{message}</p> : null}</div>
        </div>
      </div>
      <ProfileAvailabilityCalendar />
    </div>
  );
}

const statusCopy: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Available',
  PARTIALLY_AVAILABLE: 'Partially available',
  UNAVAILABLE: 'Unavailable',
};

const statusClass: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'border-[#527A68] bg-[#527A68]/10 text-[#527A68]',
  PARTIALLY_AVAILABLE: 'border-[#B78332] bg-[#B78332]/10 text-[#B78332]',
  UNAVAILABLE: 'border-[#B94A48] bg-[#B94A48]/10 text-[#B94A48]',
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthBounds = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { first, last, from: dateKey(first), to: dateKey(last) };
};

const dateFromIso = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const displayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const displayTime = (value?: string | null) => value
  ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  : 'Time pending';

function ProfileAvailabilityCalendar() {
  const { data, setData } = useFreelancerPortal();
  const today = dateKey(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [monthAvailability, setMonthAvailability] = useState<PortalAvailability[]>([]);
  const [monthShoots, setMonthShoots] = useState<PortalShootSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>('AVAILABLE');
  const [notes, setNotes] = useState('');
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [savingDate, setSavingDate] = useState('');
  const [message, setMessage] = useState('');
  const bounds = useMemo(() => monthBounds(month), [month]);
  const availabilityByDate = useMemo(() => new Map(monthAvailability.map((item) => [dateFromIso(item.date), item])), [monthAvailability]);
  const shootsByDate = useMemo(() => {
    const grouped = new Map<string, PortalShootSummary[]>();
    monthShoots.forEach((shoot) => {
      const key = dateFromIso(shoot.shootDate);
      if (!key) return;
      grouped.set(key, [...(grouped.get(key) ?? []), shoot]);
    });
    return grouped;
  }, [monthShoots]);
  const selectedRecord = availabilityByDate.get(selectedDate);
  const selectedShoots = shootsByDate.get(selectedDate) ?? [];

  useEffect(() => {
    let cancelled = false;
    setLoadingMonth(true);
    setMessage('');
    void Promise.all([
      freelancerPortalApi.availability(`?from=${bounds.from}&to=${bounds.to}&limit=80`),
      freelancerPortalApi.shoots(`?view=all&from=${bounds.from}&to=${bounds.to}&limit=100`),
    ])
      .then(([availability, shoots]) => {
        if (cancelled) return;
        setMonthAvailability(availability.items);
        setMonthShoots(shoots.items);
        if (data) {
          setData({
            ...data,
            freelancer: {
              ...data.freelancer,
              availability: [
                ...availability.items,
                ...data.freelancer.availability.filter((item) => {
                  const key = dateFromIso(item.date);
                  return key < bounds.from || key > bounds.to;
                }),
              ],
            },
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : 'Unable to load calendar data.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bounds.from, bounds.to]);

  useEffect(() => {
    const record = availabilityByDate.get(selectedDate);
    setSelectedStatus(record?.status ?? 'AVAILABLE');
    setNotes(record?.notes ?? '');
  }, [selectedDate, availabilityByDate]);

  const monthDays = Array.from({ length: bounds.last.getDate() }, (_, index) => new Date(bounds.first.getFullYear(), bounds.first.getMonth(), index + 1));
  const leadingBlanks = Array.from({ length: (bounds.first.getDay() + 6) % 7 });
  const syncRecord = (record: PortalAvailability | null, targetDate: string) => {
    setMonthAvailability((current) => record
      ? [record, ...current.filter((item) => dateFromIso(item.date) !== targetDate)].sort((a, b) => a.date.localeCompare(b.date))
      : current.filter((item) => dateFromIso(item.date) !== targetDate));
    if (data) {
      setData({
        ...data,
        freelancer: {
          ...data.freelancer,
          availability: record
            ? [record, ...data.freelancer.availability.filter((item) => dateFromIso(item.date) !== targetDate)]
            : data.freelancer.availability.filter((item) => dateFromIso(item.date) !== targetDate),
        },
      });
    }
  };
  const saveAvailability = async () => {
    setSavingDate(selectedDate);
    setMessage('');
    try {
      const saved = await freelancerPortalApi.saveAvailability({
        date: selectedDate,
        status: selectedStatus,
        startTime: null,
        endTime: null,
        notes: notes || null,
      });
      syncRecord(saved, selectedDate);
      setMessage(`Availability saved for ${displayDate(selectedDate)}.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to save availability.');
    } finally {
      setSavingDate('');
    }
  };
  const clearAvailability = async () => {
    if (!selectedRecord) return;
    setSavingDate(selectedDate);
    setMessage('');
    try {
      await freelancerPortalApi.deleteAvailability(selectedDate);
      syncRecord(null, selectedDate);
      setSelectedStatus('AVAILABLE');
      setNotes('');
      setMessage(`Availability cleared for ${displayDate(selectedDate)}.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to clear availability.');
    } finally {
      setSavingDate('');
    }
  };

  return (
    <section className="rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#3B665C]/10 text-[#3B665C]"><CalendarDays className="size-5" /></span>
          <div>
            <h2 className="text-xl font-black text-[#0D1816]">Availability & Shoot Calendar</h2>
            <p className="text-sm font-semibold text-[#686164]">Manage your availability and view assigned shoots from the CRM.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMonth(new Date())} className="min-h-11 rounded-xl border border-[#DFD9D2] bg-white px-4 text-sm font-black text-[#22413A] focus:ring-2 focus:ring-[#3B665C]/30">Today</button>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-11 place-items-center rounded-xl border border-[#DFD9D2] bg-white focus:ring-2 focus:ring-[#3B665C]/30" aria-label="Previous month"><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-11 place-items-center rounded-xl border border-[#DFD9D2] bg-white focus:ring-2 focus:ring-[#3B665C]/30" aria-label="Next month"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-black">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            <div className="flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full border border-[#527A68]/30 bg-[#527A68]/10 px-2.5 py-1 text-[#527A68]">Available</span>
              <span className="rounded-full border border-[#B78332]/30 bg-[#B78332]/10 px-2.5 py-1 text-[#B78332]">Partial</span>
              <span className="rounded-full border border-[#B94A48]/30 bg-[#B94A48]/10 px-2.5 py-1 text-[#B94A48]">Unavailable</span>
              <span className="rounded-full border border-[#3B665C]/25 bg-[#3B665C]/10 px-2.5 py-1 text-[#3B665C]">Shoot</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[.08em] text-[#686164] sm:gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
            {leadingBlanks.map((_, index) => <div key={`profile-calendar-blank-${index}`} className="min-h-16 rounded-xl bg-[#F7F6F3] sm:min-h-24" />)}
            {monthDays.map((day) => {
              const key = dateKey(day);
              const record = availabilityByDate.get(key);
              const shoots = shootsByDate.get(key) ?? [];
              const selected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`min-h-16 rounded-xl border p-2 text-left transition focus:ring-2 focus:ring-[#3B665C]/30 sm:min-h-24 ${record ? statusClass[record.status] : 'border-[#EDE8E2] bg-[#FFFEFC] text-[#0D1816]'} ${selected ? 'ring-2 ring-[#3B665C]/35' : ''}`}
                >
                  <span className="block text-sm font-black">{day.getDate()}</span>
                  {record ? <span className="mt-1 block truncate text-[10px] font-black">{statusCopy[record.status]}</span> : null}
                  {shoots.length ? <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#3B665C] px-1.5 py-0.5 text-[9px] font-black text-white"><Video className="size-3 shrink-0" />{shoots.length} shoot{shoots.length > 1 ? 's' : ''}</span> : null}
                </button>
              );
            })}
          </div>
          {loadingMonth ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#686164]"><Loader2 className="size-4 animate-spin" /> Loading month calendar...</p> : null}
        </div>
        <aside className="rounded-2xl border border-[#EDE8E2] bg-[#fbfaf8] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-[#3B665C]">Selected date</p>
              <h3 className="mt-1 text-xl font-black">{displayDate(selectedDate)}</h3>
              <p className="mt-1 text-sm font-bold text-[#686164]">{selectedRecord ? statusCopy[selectedRecord.status] : 'No availability marked'}</p>
            </div>
            {selectedRecord ? <button type="button" onClick={clearAvailability} disabled={savingDate === selectedDate} className="grid size-10 place-items-center rounded-xl border border-[#B94A48]/30 bg-white text-[#B94A48] disabled:opacity-60" aria-label="Clear availability"><Trash2 className="size-4" /></button> : null}
          </div>
          <div className="mt-4 space-y-2">
            <p className={label}>Availability</p>
            {(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE'] as AvailabilityStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-black focus:ring-2 focus:ring-[#3B665C]/30 ${selectedStatus === status ? statusClass[status] : 'border-[#DFD9D2] bg-white text-[#22413A]'}`}
              >
                {statusCopy[status]}
                {selectedStatus === status ? <CheckCircle2 className="size-4" /> : null}
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className={label}>Notes</span>
            <textarea className={`${field} min-h-24 resize-y bg-white`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes for this date" />
          </label>
          <button type="button" onClick={saveAvailability} disabled={savingDate === selectedDate} className={`${btn} mt-4 w-full gap-2`}>
            {savingDate === selectedDate ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {savingDate === selectedDate ? 'Saving...' : 'Save availability'}
          </button>
          <div className="mt-5 border-t border-[#EDE8E2] pt-4">
            <p className="flex items-center gap-2 text-sm font-black"><BriefcaseBusiness className="size-4 text-[#3B665C]" /> Assigned shoots</p>
            <div className="mt-3 space-y-3">
              {selectedShoots.length ? selectedShoots.map((shoot) => (
                <div key={shoot.id} className="rounded-xl border border-[#EDE8E2] bg-white p-3">
                  <p className="font-black text-[#302C2E]">{shoot.title}</p>
                  <p className="mt-1 text-xs font-bold text-[#686164]">{shoot.project?.name ?? 'Project'} · {shoot.assignment?.role?.replaceAll('_', ' ') ?? 'Assigned crew'}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#686164]"><Clock className="size-3" /> {displayTime(shoot.startTime)}{shoot.endTime ? ` - ${displayTime(shoot.endTime)}` : ''}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#686164]"><MapPin className="size-3" /> {shoot.location || shoot.city || 'Location pending'}</p>
                </div>
              )) : <p className="rounded-xl border border-dashed border-[#DFD9D2] bg-white p-3 text-sm font-semibold text-[#686164]">No assigned shoot on this date.</p>}
            </div>
          </div>
          {message ? <p className="mt-4 rounded-xl bg-[#EDF4F2] px-3 py-2 text-sm font-bold text-[#22413A]">{message}</p> : null}
        </aside>
      </div>
    </section>
  );
}

export function AvailabilityPage() {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(() => new Date());
  const [monthAvailability, setMonthAvailability] = useState<PortalAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [rangeLoading, setRangeLoading] = useState(false);
  const [savingDate, setSavingDate] = useState('');
  const [message, setMessage] = useState('');
  const bounds = useMemo(() => monthBounds(month), [month]);
  const byDate = useMemo(() => new Map(monthAvailability.map((item) => [item.date.slice(0, 10), item])), [monthAvailability]);
  const selectedRecord = byDate.get(selectedDate);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    setRangeLoading(true);
    setMessage('');
    void freelancerPortalApi.availability(`?from=${bounds.from}&to=${bounds.to}&limit=62`)
      .then((result) => {
        if (cancelled) return;
        setMonthAvailability(result.items);
        setData({
          ...data,
          freelancer: {
            ...data.freelancer,
            availability: [
              ...result.items,
              ...data.freelancer.availability.filter((item) => {
                const key = item.date.slice(0, 10);
                return key < bounds.from || key > bounds.to;
              }),
            ],
          },
        });
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : 'Unable to load availability.');
      })
      .finally(() => {
        if (!cancelled) setRangeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bounds.from, bounds.to]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No availability loaded.'} retry={reload} />;
  const monthDays = Array.from({ length: bounds.last.getDate() }, (_, index) => new Date(bounds.first.getFullYear(), bounds.first.getMonth(), index + 1));
  const leadingBlanks = Array.from({ length: (bounds.first.getDay() + 6) % 7 });
  const syncRecord = (record: PortalAvailability | null, targetDate: string) => {
    setMonthAvailability((current) => record
      ? [record, ...current.filter((item) => item.date.slice(0, 10) !== targetDate)].sort((a, b) => a.date.localeCompare(b.date))
      : current.filter((item) => item.date.slice(0, 10) !== targetDate));
    setData({
      ...data,
      freelancer: {
        ...data.freelancer,
        availability: record
          ? [record, ...data.freelancer.availability.filter((item) => item.date.slice(0, 10) !== targetDate)]
          : data.freelancer.availability.filter((item) => item.date.slice(0, 10) !== targetDate),
      },
    });
  };
  const saveStatus = async (targetDate: string, status: AvailabilityStatus) => {
    setSavingDate(targetDate);
    setMessage('');
    try {
      const saved = await freelancerPortalApi.saveAvailability({
        date: targetDate,
        status,
        startTime: null,
        endTime: null,
        notes: targetDate === selectedDate ? notes || selectedRecord?.notes || null : selectedRecord?.notes || null,
      });
      syncRecord(saved, targetDate);
      setMessage(`${statusCopy[status]} saved for ${targetDate}.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to save availability.');
    } finally {
      setSavingDate('');
    }
  };
  const deleteDate = async () => {
    if (!selectedRecord) return;
    setSavingDate(selectedDate);
    setMessage('');
    try {
      await freelancerPortalApi.deleteAvailability(selectedDate);
      syncRecord(null, selectedDate);
      setNotes('');
      setMessage(`Availability removed for ${selectedDate}.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to clear availability.');
    } finally {
      setSavingDate('');
    }
  };
  const saveNotes = async () => {
    if (!selectedRecord) return;
    setSavingDate(selectedDate);
    setMessage('');
    try {
      const updated = await freelancerPortalApi.updateAvailability(selectedDate, { notes: notes || null });
      syncRecord(updated, selectedDate);
      setMessage(`Notes saved for ${selectedDate}.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to save notes.');
    } finally {
      setSavingDate('');
    }
  };
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Availability</h1>
      <PortalCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-black">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            <p className="mt-1 text-xs font-bold text-[#686164]">One API request loads this full month.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid size-10 place-items-center rounded-xl border border-[#DFD9D2] bg-white" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft className="size-4" /></button>
            <button className="grid size-10 place-items-center rounded-xl border border-[#DFD9D2] bg-white" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase tracking-[.08em] text-[#686164]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {leadingBlanks.map((_, index) => <div key={`blank-${index}`} className="aspect-square rounded-xl bg-[#F7F6F3]" />)}
          {monthDays.map((day) => {
            const key = dateKey(day);
            const record = byDate.get(key);
            const isSelected = selectedDate === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDate(key);
                  setNotes(record?.notes || '');
                }}
                className={`aspect-square rounded-xl border p-1 text-left text-xs font-black transition ${record ? statusClass[record.status] : 'border-[#EDE8E2] bg-white text-[#0D1816]'} ${isSelected ? 'ring-3 ring-[#3B665C]/25' : ''}`}
              >
                <span>{day.getDate()}</span>
                {record ? <span className="mt-1 block truncate text-[9px]">{statusCopy[record.status]}</span> : null}
              </button>
            );
          })}
        </div>
        {rangeLoading ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#686164]"><Loader2 className="size-4 animate-spin" /> Loading month availability…</p> : null}
      </PortalCard>
      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black">Selected date</p>
            <p className="mt-1 text-2xl font-black">{selectedDate}</p>
            <p className="text-sm font-bold text-[#686164]">{selectedRecord ? statusCopy[selectedRecord.status] : 'No status marked'}</p>
          </div>
          {selectedRecord ? <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B94A48]/30 px-3 text-sm font-black text-[#B94A48]" onClick={deleteDate} disabled={savingDate === selectedDate}><Trash2 className="size-4" /> Clear</button> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE'] as AvailabilityStatus[]).map((status) => (
            <button key={status} className={`min-h-10 rounded-xl border px-3 text-sm font-black ${statusClass[status]}`} disabled={savingDate === selectedDate} onClick={() => void saveStatus(selectedDate, status)}>{statusCopy[status]}</button>
          ))}
        </div>
        <label className="mt-4 block"><span className={label}>Notes</span><textarea className={field} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note for this date" /></label>
        <div className="mt-4 flex items-center gap-3"><button className={btn} onClick={saveNotes} disabled={!selectedRecord || savingDate === selectedDate}>{savingDate === selectedDate ? 'Saving…' : 'Save notes'}</button>{message ? <p className="text-sm font-bold text-[#686164]">{message}</p> : null}</div>
      </PortalCard>
      <PortalCard>
        <p className="font-black">This month</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE'] as AvailabilityStatus[]).map((status) => (
            <div key={status} className={`rounded-xl border px-3 py-2 text-sm font-black ${statusClass[status]}`}>
              {statusCopy[status]} · {monthAvailability.filter((item) => item.status === status).length}
            </div>
          ))}
        </div>
      </PortalCard>
    </div>
  );
}

export function PortfolioPage() {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const [form, setForm] = useState({ fileObjectId: '', title: '', description: '', category: '', isPublished: true });
  const [message, setMessage] = useState('');
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No portfolio loaded.'} retry={reload} />;
  const create = async () => {
    try {
      const item = await freelancerPortalApi.createPortfolioItem(form);
      setData({ ...data, freelancer: { ...data.freelancer, portfolioItems: [item, ...data.freelancer.portfolioItems] } });
      setForm({ fileObjectId: '', title: '', description: '', category: '', isPublished: true });
      setMessage('Portfolio item added.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to add portfolio item.');
    }
  };
  const toggle = async (item: PortalPortfolioItem) => {
    const updated = await freelancerPortalApi.updatePortfolioItem(item.id, { isPublished: !item.isPublished });
    setData({ ...data, freelancer: { ...data.freelancer, portfolioItems: data.freelancer.portfolioItems.map((p) => p.id === item.id ? updated : p) } });
  };
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Portfolio</h1>
      <PortalCard>
        <p className="font-black">Add existing uploaded file</p>
        <p className="mt-1 text-xs font-medium text-[#686164]">Upload binaries through the existing Files API, then attach the resulting FileObject ID here.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={field} placeholder="FileObject ID" value={form.fileObjectId} onChange={(e) => setForm({ ...form, fileObjectId: e.target.value })} />
          <input className={field} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={field} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
          <textarea className={`${field} sm:col-span-2`} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="mt-4 flex items-center gap-3"><button className={btn} onClick={create} disabled={!form.fileObjectId || !form.title}>Add item</button>{message ? <p className="text-sm font-bold text-[#686164]">{message}</p> : null}</div>
      </PortalCard>
      <div className="grid gap-3 sm:grid-cols-2">{data.freelancer.portfolioItems.length ? data.freelancer.portfolioItems.map((item) => <PortalCard key={item.id}><p className="font-black">{item.title}</p><p className="text-sm font-medium text-[#686164]">{item.description || 'No description'}</p><button onClick={() => toggle(item)} className="mt-3 text-sm font-black text-[#3B665C]">{item.isPublished ? 'Unpublish' : 'Publish'}</button></PortalCard>) : <PortalState title="No portfolio items yet" text="Add approved FileObject media to build your freelancer portfolio." />}</div>
    </div>
  );
}

export function SubscriptionPage() {
  const { data, loading, error, reload } = useFreelancerPortal();
  const [plans, setPlans] = useState<Awaited<ReturnType<typeof freelancerPortalApi.plans>> | null>(null);
  const [notice, setNotice] = useState('');
  useMemo(() => { if (data && !plans) void freelancerPortalApi.plans().then(setPlans).catch(() => setPlans([])); }, [data, plans]);
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No subscription loaded.'} retry={reload} />;
  const subscription = data.freelancer.subscriptions[0];
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Subscription</h1>
      <PortalCard>
        <p className="text-sm font-black">Current plan</p>
        <p className="mt-2 text-2xl font-black">{subscription?.plan.name ?? 'No active subscription'}</p>
        <p className="text-sm font-bold text-[#686164]">{subscription ? `${subscription.status} · ${subscription.currentPeriodEnd ? `ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : 'no expiry set'}` : 'Checkout is not enabled yet.'}</p>
      </PortalCard>
      <div className="grid gap-3 sm:grid-cols-2">{plans?.length ? plans.map((plan) => <PortalCard key={plan.id}><p className="font-black">{plan.name}</p><p className="mt-1 text-sm font-bold text-[#686164]">{plan.currency} {Number(plan.price).toLocaleString('en-IN')} · {plan.billingInterval}</p><button className={`${btn} mt-4`} onClick={() => setNotice('Subscription checkout coming soon. No transaction was created.')}>Choose Plan</button></PortalCard>) : <PortalState title="No plans available" text="The studio has not published freelancer plans yet." />}</div>
      {notice ? <p className="rounded-xl bg-[#B78332]/10 px-4 py-3 text-sm font-bold text-[#B78332]">{notice}</p> : null}
    </div>
  );
}

export function SimplePortalListPage({ kind }: { kind: 'connections' | 'assignments' | 'payments' }) {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No data loaded.'} retry={reload} />;
  const items = kind === 'connections' ? data.freelancer.connections : kind === 'assignments' ? data.freelancer.assignments : data.freelancer.payouts;
  const respond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setSavingId(id);
    setMessage('');
    try {
      const updated = await freelancerPortalApi.respondToConnection(id, { status });
      setData({
        ...data,
        freelancer: {
          ...data.freelancer,
          connections: data.freelancer.connections.map((item) => item.id === id ? updated : item),
        },
      });
      setMessage(status === 'ACCEPTED' ? 'Project interest accepted.' : 'Project interest declined.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to update this connection.');
    } finally {
      setSavingId('');
    }
  };
  if (kind === 'connections') {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-black">My Vendors</h1>
        {message ? <p className="rounded-xl bg-[#EDF4F2] px-4 py-3 text-sm font-bold text-[#22413A]">{message}</p> : null}
        {data.freelancer.connections.length ? data.freelancer.connections.map((connection) => {
          const canRespond = ['INTERESTED', 'CONTACTED'].includes(connection.status);
          const statusText = connection.status === 'ACCEPTED'
            ? 'You accepted this request. Studio can now connect you to the selected project or shoot.'
            : connection.status === 'DECLINED'
              ? 'You declined this request.'
              : connection.status === 'ASSIGNED'
                ? 'Studio connected you to this work.'
                : 'Review this studio request and accept or decline it.';
          return (
            <PortalCard key={connection.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#3B665C]">{connection.status.replaceAll('_', ' ')}</p>
                  <h2 className="mt-1 text-xl font-black">{connection.project?.name ?? 'Studio interest'}</h2>
                  <p className="mt-1 text-sm font-bold text-[#686164]">{connection.project?.projectNumber ?? 'Project not selected yet'}</p>
                  {connection.shoot ? <p className="mt-2 text-sm font-bold text-[#686164]">{connection.shoot.title} · {new Date(connection.shoot.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p> : null}
                  {connection.createdBy?.fullName ? <p className="mt-2 text-xs font-bold text-[#686164]">From: {connection.createdBy.fullName}</p> : null}
                  <p className="mt-3 rounded-xl bg-[#fbfaf8] p-3 text-sm font-bold leading-6 text-[#686164]">{statusText}</p>
                  {connection.notes ? <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fbfaf8] p-3 text-sm font-semibold leading-6 text-[#686164]">{connection.notes}</p> : null}
                </div>
                {canRespond ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => void respond(connection.id, 'ACCEPTED')} disabled={savingId === connection.id} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#527A68] px-4 text-sm font-black text-white disabled:opacity-60">
                      {savingId === connection.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Accept
                    </button>
                    <button type="button" onClick={() => void respond(connection.id, 'DECLINED')} disabled={savingId === connection.id} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#B94A48]/30 bg-white px-4 text-sm font-black text-[#B94A48] disabled:opacity-60">
                      <X className="size-4" />
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            </PortalCard>
          );
        }) : <PortalState title="No vendor/project interests yet" text="Studio project interests will appear here. You can accept or decline them from this panel." />}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black capitalize">{kind}</h1>
      {items.length ? items.map((item: any) => <PortalCard key={item.id}><p className="font-black">{item.status || item.paymentMethod}</p><p className="text-sm font-medium text-[#686164]">{item.notes || item.role || item.paymentDate || 'No additional details'}</p></PortalCard>) : <PortalState title={`No ${kind} yet`} text="Nothing is available here yet. The studio will update this when records exist." />}
    </div>
  );
}
