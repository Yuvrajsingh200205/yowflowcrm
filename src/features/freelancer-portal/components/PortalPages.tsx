'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Save, Trash2, Video, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { loadRazorpay } from '@/lib/api/billing';
import { freelancerPortalApi, AvailabilityStatus, PortalAvailability, PortalFreelancer, PortalPortfolioItem, PortalShootSummary } from '@/lib/api/freelancerPortal';
import { getFreelancerProfileCompletion } from '../profileCompletion';
import { composeNotes, parseNotes, type NoteKey, type ParsedNotes } from '../profileNotes';
import { useFreelancerPortal } from '../useFreelancerPortal';
import { PortalCard, PortalState } from './FreelancerPortalShell';
import { BRAND } from '@/config/brand';

const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#292F22] px-4 py-2 text-sm font-black text-white transition hover:bg-[#22271C] disabled:opacity-60';
const field = 'mt-1 w-full rounded-xl border border-[#DFD9D2] bg-[#F7FCEE] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#292F22]';
const label = 'text-xs font-extrabold text-[#686164]';

function LoadingState() {
  return <PortalState title="Loading portal" text="Fetching your latest freelancer profile." action={<Loader2 className="mx-auto size-5 animate-spin text-[#292F22]" />} />;
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
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#292F22]">Freelancer Portal</p>
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
          <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${data.searchable ? 'bg-[#527A68]/10 text-[#2E5242]' : 'bg-[#B78332]/10 text-[#7A5210]'}`}>
            {data.searchable ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {data.searchable ? 'Visible to studio search' : 'Not searchable yet'}
          </p>
        </PortalCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PortalCard>
          <div className="flex items-center justify-between gap-3"><h2 className="font-black">Availability</h2><Link className="text-sm font-black text-[#292F22]" href="/freelancer/availability">Update</Link></div>
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

const ROLE_OPTIONS: Array<[string, string]> = [
  ['LEAD_PHOTOGRAPHER', 'Lead photographer'], ['CANDID_PHOTOGRAPHER', 'Candid photographer'], ['TRADITIONAL_PHOTOGRAPHER', 'Traditional photographer'],
  ['CINEMATOGRAPHER', 'Cinematographer'], ['TRADITIONAL_VIDEOGRAPHER', 'Traditional videographer'], ['DRONE_OPERATOR', 'Drone operator'],
  ['ASSISTANT', 'Assistant'], ['LIGHT_ASSISTANT', 'Light assistant'], ['LIVE_EDITOR', 'Editor'], ['COORDINATOR', 'Coordinator'], ['OTHER', 'Other'],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ProfilePage() {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const profile = data?.freelancer;
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [notes, setNotes] = useState<ParsedNotes | null>(null);
  const [travel, setTravel] = useState(true);
  useEffect(() => {
    if (!profile || form) return;
    setForm({
      fullName: profile.fullName, email: profile.email ?? '', city: profile.city ?? '', primarySkill: profile.primarySkill,
      experienceYears: String(profile.experienceYears ?? 0), rate: String(Number(profile.rate ?? 0)), skills: profile.skills.join(', '), equipmentNotes: profile.equipmentNotes ?? '',
    });
    setNotes(parseNotes(profile.notes));
    setTravel(profile.travelAvailable);
  }, [profile, form]);
  if (loading || (profile && !form)) return <LoadingState />;
  if (error || !data || !profile || !form || !notes) return <ErrorState text={error || 'No profile loaded.'} retry={reload} />;
  const completion = getFreelancerProfileCompletion(profile);
  const latestApplication = profile.applications[0];
  const latestSubscription = profile.subscriptions.find((x) => x.status === 'ACTIVE' || x.status === 'PAST_DUE');
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const setNote = (k: NoteKey) => (e: { target: { value: string } }) => setNotes({ ...notes, fields: { ...notes.fields, [k]: e.target.value } });
  const save = async () => {
    setMessage(null);
    if (!form.fullName.trim()) { setMessage({ tone: 'bad', text: 'Your name cannot be empty.' }); return; }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) { setMessage({ tone: 'bad', text: 'Enter a valid email address.' }); return; }
    if (!(Number(form.rate) >= 0)) { setMessage({ tone: 'bad', text: 'Enter your daily rate as a number.' }); return; }
    setSaving(true);
    try {
      const updated = await freelancerPortalApi.updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        city: form.city.trim() || null,
        primarySkill: form.primarySkill,
        experienceYears: Math.max(0, Math.min(70, Number(form.experienceYears) || 0)),
        rate: String(Number(form.rate) || 0),
        travelAvailable: travel,
        skills: form.skills.split(',').map((x) => x.trim()).filter(Boolean),
        equipmentNotes: form.equipmentNotes.trim() || null,
        notes: composeNotes(notes) || null,
      } as Partial<PortalFreelancer>);
      setData({ ...data, freelancer: { ...profile, ...updated } });
      setMessage({ tone: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ tone: 'bad', text: err instanceof ApiError ? err.message : 'Unable to update your profile.' });
    } finally {
      setSaving(false);
    }
  };
  const initials = profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'F';
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-[#10120D] to-[#141711] p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#B6E25D]">{BRAND.name}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">My Profile</h1>
        <p className="mt-2 max-w-2xl text-base font-medium leading-6 text-white/65">Keep your details current so studios can find and book you.</p>
      </section>
      <div className="grid gap-5 rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#EDE8E2] bg-[#FBFDF6] p-6 text-center">
          <div className="mx-auto grid size-32 place-items-center rounded-full bg-[#EDF4F2] text-5xl font-black text-[#292F22]" aria-hidden="true">{initials.slice(0, 1)}</div>
          <p className="mt-4 text-sm font-bold text-[#1E2319]">{latestSubscription?.plan?.name ?? 'No active plan'}{latestSubscription?.plan?.billingInterval ? ` · ${String(latestSubscription.plan.billingInterval).toLowerCase()}` : ''}</p>
          <div className="mt-6 rounded-xl border border-[#eee7e2] bg-white p-3 text-left text-xs font-bold text-[#1E2319]">
            <p>Completion: {completion.percentage}%</p>
            {completion.missing.length ? <p className="mt-1 font-medium text-[#686164]">To do: {completion.missing.join(', ')}</p> : null}
            <p className="mt-1">Application: {latestApplication?.status ?? 'No application'}</p>
            {latestApplication?.status === 'REJECTED' && latestApplication.rejectionReason ? <p className="mt-1 font-medium text-[#8F2F2D]">Reason: {latestApplication.rejectionReason}</p> : null}
            <p className="mt-1">Searchable: {data.searchable ? 'Yes' : 'Not yet'}</p>
          </div>
        </aside>
        <div className="grid gap-4 lg:grid-cols-2">
          <label><span className={label}>Name</span><input className={field} value={form.fullName} onChange={set('fullName')} /></label>
          <label><span className={label}>Studio / Brand</span><input className={field} value={notes.fields.Studio} onChange={setNote('Studio')} placeholder="Optional" /></label>
          <label><span className={label}>Phone (used to sign in)</span><input className={field} value={profile.phone} disabled /></label>
          <label><span className={label}>Email</span><input type="email" className={field} value={form.email} onChange={set('email')} /></label>
          <label><span className={label}>Base city</span><input className={field} value={form.city} onChange={set('city')} /></label>
          <label><span className={label}>Primary role</span><select className={field} value={form.primarySkill} onChange={set('primarySkill')}>{ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="lg:col-span-2"><span className={label}>Professional headline</span><input className={field} value={notes.fields.Headline} maxLength={160} onChange={setNote('Headline')} placeholder="e.g. Candid wedding photographer" /></label>
          <label><span className={label}>Experience (years)</span><input type="number" min={0} max={70} className={field} value={form.experienceYears} onChange={set('experienceYears')} /></label>
          <label><span className={label}>Daily rate (₹)</span><input type="number" min={0} className={field} value={form.rate} onChange={set('rate')} /></label>
          <label className="flex items-center gap-2 text-sm font-bold lg:col-span-2"><input type="checkbox" checked={travel} onChange={(e) => setTravel(e.target.checked)} /> Open to travel and outstation work</label>
          <label className="lg:col-span-2"><span className={label}>Skills, comma separated</span><input className={field} value={form.skills} onChange={set('skills')} /></label>
          <label className="lg:col-span-2"><span className={label}>Equipment</span><textarea rows={2} className={field} value={form.equipmentNotes} onChange={set('equipmentNotes')} placeholder="Cameras, lenses, lights, drone…" /></label>
          <label className="lg:col-span-2"><span className={label}>Portfolio links</span><textarea rows={2} className={field} value={notes.fields.Portfolio} onChange={setNote('Portfolio')} placeholder="Instagram, YouTube, website or Behance link" /></label>
          <label className="lg:col-span-2"><span className={label}>About you</span><textarea rows={4} className={field} value={notes.fields.Bio} onChange={setNote('Bio')} /></label>
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button className={btn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>{message ? <p role={message.tone === 'bad' ? 'alert' : 'status'} className={`text-sm font-bold ${message.tone === 'bad' ? 'text-red-700' : 'text-emerald-700'}`}>{message.text}</p> : null}</div>
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
  AVAILABLE: 'border-[#527A68] bg-[#527A68]/10 text-[#2E5242]',
  PARTIALLY_AVAILABLE: 'border-[#B78332] bg-[#B78332]/10 text-[#7A5210]',
  UNAVAILABLE: 'border-[#B94A48] bg-[#B94A48]/10 text-[#8F2F2D]',
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
          <span className="grid size-11 place-items-center rounded-xl bg-[#292F22]/10 text-[#292F22]"><CalendarDays className="size-5" /></span>
          <div>
            <h2 className="text-xl font-black text-[#0D1816]">Availability & Shoot Calendar</h2>
            <p className="text-sm font-semibold text-[#686164]">Manage your availability and view assigned shoots from the CRM.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMonth(new Date())} className="min-h-11 rounded-xl border border-[#DFD9D2] bg-white px-4 text-sm font-black text-[#191D15] focus:ring-2 focus:ring-[#292F22]/30">Today</button>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-11 place-items-center rounded-xl border border-[#DFD9D2] bg-white focus:ring-2 focus:ring-[#292F22]/30" aria-label="Previous month"><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-11 place-items-center rounded-xl border border-[#DFD9D2] bg-white focus:ring-2 focus:ring-[#292F22]/30" aria-label="Next month"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-black">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            <div className="flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full border border-[#527A68]/30 bg-[#527A68]/10 px-2.5 py-1 text-[#2E5242]">Available</span>
              <span className="rounded-full border border-[#B78332]/30 bg-[#B78332]/10 px-2.5 py-1 text-[#7A5210]">Partial</span>
              <span className="rounded-full border border-[#B94A48]/30 bg-[#B94A48]/10 px-2.5 py-1 text-[#8F2F2D]">Unavailable</span>
              <span className="rounded-full border border-[#292F22]/25 bg-[#292F22]/10 px-2.5 py-1 text-[#292F22]">Shoot</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[.08em] text-[#686164] sm:gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
            {leadingBlanks.map((_, index) => <div key={`profile-calendar-blank-${index}`} className="min-h-16 rounded-xl bg-[#F7FCEE] sm:min-h-24" />)}
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
                  className={`min-h-16 rounded-xl border p-2 text-left transition focus:ring-2 focus:ring-[#292F22]/30 sm:min-h-24 ${record ? statusClass[record.status] : 'border-[#EDE8E2] bg-[#FEFFFC] text-[#0D1816]'} ${selected ? 'ring-2 ring-[#292F22]/35' : ''}`}
                >
                  <span className="block text-sm font-black">{day.getDate()}</span>
                  {record ? <span className="mt-1 block truncate text-[10px] font-black">{statusCopy[record.status]}</span> : null}
                  {shoots.length ? <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#292F22] px-1.5 py-0.5 text-[9px] font-black text-white"><Video className="size-3 shrink-0" />{shoots.length} shoot{shoots.length > 1 ? 's' : ''}</span> : null}
                </button>
              );
            })}
          </div>
          {loadingMonth ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#686164]"><Loader2 className="size-4 animate-spin" /> Loading month calendar...</p> : null}
        </div>
        <aside className="rounded-2xl border border-[#EDE8E2] bg-[#FBFDF6] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-[#292F22]">Selected date</p>
              <h3 className="mt-1 text-xl font-black">{displayDate(selectedDate)}</h3>
              <p className="mt-1 text-sm font-bold text-[#686164]">{selectedRecord ? statusCopy[selectedRecord.status] : 'No availability marked'}</p>
            </div>
            {selectedRecord ? <button type="button" onClick={clearAvailability} disabled={savingDate === selectedDate} className="grid size-10 place-items-center rounded-xl border border-[#B94A48]/30 bg-white text-[#8F2F2D] disabled:opacity-60" aria-label="Clear availability"><Trash2 className="size-4" /></button> : null}
          </div>
          <div className="mt-4 space-y-2">
            <p className={label}>Availability</p>
            {(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE'] as AvailabilityStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-black focus:ring-2 focus:ring-[#292F22]/30 ${selectedStatus === status ? statusClass[status] : 'border-[#DFD9D2] bg-white text-[#191D15]'}`}
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
            <p className="flex items-center gap-2 text-sm font-black"><BriefcaseBusiness className="size-4 text-[#292F22]" /> Assigned shoots</p>
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
          {message ? <p className="mt-4 rounded-xl bg-[#EDF4F2] px-3 py-2 text-sm font-bold text-[#191D15]">{message}</p> : null}
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
          {leadingBlanks.map((_, index) => <div key={`blank-${index}`} className="aspect-square rounded-xl bg-[#F7FCEE]" />)}
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
                className={`aspect-square rounded-xl border p-1 text-left text-xs font-black transition ${record ? statusClass[record.status] : 'border-[#EDE8E2] bg-white text-[#0D1816]'} ${isSelected ? 'ring-3 ring-[#292F22]/25' : ''}`}
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
          {selectedRecord ? <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B94A48]/30 px-3 text-sm font-black text-[#8F2F2D]" onClick={deleteDate} disabled={savingDate === selectedDate}><Trash2 className="size-4" /> Clear</button> : null}
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

const PORTFOLIO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const PORTFOLIO_MAX = 25 * 1024 * 1024;

export function PortfolioPage() {
  const { data, setData, loading, error, reload } = useFreelancerPortal();
  const [form, setForm] = useState({ title: '', description: '', category: '', isPublished: true });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No portfolio loaded.'} retry={reload} />;
  const items = data.freelancer.portfolioItems;

  const pick = (f: File | undefined) => {
    setMessage(null);
    if (!f) { setFile(null); return; }
    if (!PORTFOLIO_TYPES.includes(f.type)) { setMessage({ tone: 'bad', text: 'Choose a JPG, PNG or WEBP image, or an MP4 film.' }); setFile(null); return; }
    if (f.size > PORTFOLIO_MAX) { setMessage({ tone: 'bad', text: 'That file is over 25 MB. Choose a smaller one.' }); setFile(null); return; }
    setFile(f);
    setForm((cur) => ({ ...cur, title: cur.title || f.name.replace(/\.[^.]+$/, '').slice(0, 80) }));
  };
  const create = async () => {
    if (!file) return;
    setBusy(true); setMessage(null);
    try {
      const intent = await freelancerPortalApi.portfolioUploadIntent({ originalName: file.name, mimeType: file.type });
      const put = await fetch(intent.uploadUrl, { method: 'PUT', headers: intent.requiredHeaders, body: file });
      if (!put.ok) throw new Error('The upload did not finish. Please try again.');
      const item = await freelancerPortalApi.portfolioUpload({ bucket: intent.bucket, objectKey: intent.objectKey, originalName: file.name, mimeType: file.type, sizeBytes: file.size, title: form.title.trim(), description: form.description.trim() || undefined, category: form.category.trim() || undefined, isPublished: form.isPublished });
      setData({ ...data, freelancer: { ...data.freelancer, portfolioItems: [item, ...items] } });
      setForm({ title: '', description: '', category: '', isPublished: true }); setFile(null);
      setMessage({ tone: 'ok', text: 'Added to your portfolio.' });
    } catch (err) {
      setMessage({ tone: 'bad', text: err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to add this item.' });
    } finally { setBusy(false); }
  };
  const toggle = async (item: PortalPortfolioItem) => {
    try {
      const updated = await freelancerPortalApi.updatePortfolioItem(item.id, { isPublished: !item.isPublished });
      setData({ ...data, freelancer: { ...data.freelancer, portfolioItems: items.map((p) => (p.id === item.id ? { ...p, isPublished: updated.isPublished } : p)) } });
    } catch (err) { setMessage({ tone: 'bad', text: err instanceof ApiError ? err.message : 'Could not update this item.' }); }
  };
  const remove = async (item: PortalPortfolioItem) => {
    if (!window.confirm(`Remove "${item.title}" from your portfolio?`)) return;
    try {
      await freelancerPortalApi.deletePortfolioItem(item.id);
      setData({ ...data, freelancer: { ...data.freelancer, portfolioItems: items.filter((p) => p.id !== item.id) } });
    } catch (err) { setMessage({ tone: 'bad', text: err instanceof ApiError ? err.message : 'Could not remove this item.' }); }
  };
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Portfolio</h1>
      <PortalCard>
        <p className="font-black">Add a work sample</p>
        <p className="mt-1 text-xs font-medium text-[#686164]">Studios see published items when they look for freelancers. JPG, PNG, WEBP or MP4, up to 25 MB.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={label}>Photo or film</span><input type="file" accept={PORTFOLIO_TYPES.join(',')} className={field} onChange={(e) => pick(e.target.files?.[0])} /></label>
          <label><span className={label}>Title</span><input className={field} value={form.title} maxLength={160} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label><span className={label}>Category</span><input className={field} value={form.category} maxLength={80} placeholder="Candid, Cinematic, Drone…" onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className={label}>Description</span><textarea className={field} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Visible to studios</label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button className={btn} onClick={create} disabled={busy || !file || !form.title.trim()}>{busy ? 'Uploading…' : 'Add to portfolio'}</button>{message ? <p role={message.tone === 'bad' ? 'alert' : 'status'} className={`text-sm font-bold ${message.tone === 'bad' ? 'text-red-700' : 'text-emerald-700'}`}>{message.text}</p> : null}</div>
      </PortalCard>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length ? items.map((item) => (
          <PortalCard key={item.id} className="overflow-hidden !p-0">
            {item.fileObject?.url
              ? item.fileObject.mimeType.startsWith('video/')
                ? <video src={item.fileObject.url} controls preload="metadata" className="aspect-[4/3] w-full bg-black object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={item.fileObject.url} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              : <div className="grid aspect-[4/3] place-items-center bg-[#F7FCEE] text-xs font-bold text-[#686164]">No preview</div>}
            <div className="p-4">
              <p className="font-black">{item.title}</p>
              <p className="text-sm font-medium text-[#686164]">{item.description || item.category || 'No description'}</p>
              <div className="mt-3 flex items-center gap-4">
                <button onClick={() => toggle(item)} className="text-sm font-black text-[#292F22] underline-offset-2 hover:underline">{item.isPublished ? 'Hide from studios' : 'Show to studios'}</button>
                <button onClick={() => remove(item)} className="text-sm font-black text-red-700 underline-offset-2 hover:underline" aria-label={`Remove ${item.title}`}>Remove</button>
              </div>
            </div>
          </PortalCard>
        )) : <PortalState title="No work samples yet" text="Add your best photographs or films so studios can see your style." />}
      </div>
    </div>
  );
}

export function SubscriptionPage() {
  const { data, loading, error, reload } = useFreelancerPortal();
  const [plans, setPlans] = useState<Awaited<ReturnType<typeof freelancerPortalApi.plans>> | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  useEffect(() => { if (data && !plans) void freelancerPortalApi.plans().then(setPlans).catch(() => setPlans([])); }, [data, plans]);
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No subscription loaded.'} retry={reload} />;
  const live = data.freelancer.subscriptions.find((x) => x.status === 'ACTIVE' || x.status === 'PAST_DUE');

  const choose = async (planId: string) => {
    setBusy(planId); setNotice(null);
    try {
      const co = await freelancerPortalApi.startCheckout(planId);
      if (!('orderId' in co)) { setNotice({ tone: 'ok', text: 'Your plan is active.' }); reload(); return; }
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('The payment window could not open.');
      const rz = new window.Razorpay({
        key: co.keyId, amount: co.amount, currency: co.currency, order_id: co.orderId, name: co.name, description: co.description,
        theme: { color: '#B4F03C' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try { await freelancerPortalApi.verifyCheckout({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }); setNotice({ tone: 'ok', text: 'Payment received. Your plan is active and studios can find you.' }); reload(); }
          catch (e) { setNotice({ tone: 'bad', text: e instanceof ApiError ? `${e.message} If you were charged, contact your studio with payment id ${r.razorpay_payment_id}.` : 'We could not confirm the payment. If you were charged, contact your studio.' }); }
          finally { setBusy(''); }
        },
        modal: { ondismiss: () => setBusy('') },
      });
      rz.on('payment.failed', (r) => setNotice({ tone: 'bad', text: r.error?.description ?? 'The payment did not go through. Please try again.' }));
      rz.open();
    } catch (e) {
      setNotice({ tone: 'bad', text: e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not start checkout.' });
      setBusy('');
    }
  };
  const cancel = async () => {
    if (!window.confirm('Cancel your plan? You will stop appearing in studio search straight away.')) return;
    setBusy('cancel');
    try { await freelancerPortalApi.cancelSubscription(); setNotice({ tone: 'ok', text: 'Your plan was cancelled.' }); reload(); }
    catch (e) { setNotice({ tone: 'bad', text: e instanceof ApiError ? e.message : 'Could not cancel. Try again.' }); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black">Subscription</h1>
      <PortalCard>
        <p className="text-sm font-black">Current plan</p>
        <p className="mt-2 text-2xl font-black">{live?.plan.name ?? 'No active plan'}</p>
        <p className="text-sm font-bold text-[#686164]">{live ? `${live.status === 'PAST_DUE' ? 'Payment overdue' : 'Active'} · ${live.currentPeriodEnd ? `renews or ends ${new Date(live.currentPeriodEnd).toLocaleDateString('en-IN')}` : 'no expiry set'}` : 'Choose a plan to be listed in studio search.'}</p>
        {live ? <button className={`${btn} mt-4`} onClick={cancel} disabled={busy === 'cancel'}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel plan'}</button> : null}
      </PortalCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {plans?.length ? plans.map((plan) => (
          <PortalCard key={plan.id}>
            <p className="font-black">{plan.name}</p>
            <p className="mt-1 text-sm font-bold text-[#686164]">{Number(plan.price) === 0 ? 'Free' : `₹${Number(plan.price).toLocaleString('en-IN')}`} · {String(plan.billingInterval).toLowerCase()}</p>
            {plan.description ? <p className="mt-2 text-sm font-medium text-[#686164]">{plan.description}</p> : null}
            <button className={`${btn} mt-4`} disabled={Boolean(busy) || live?.plan.id === plan.id} onClick={() => void choose(plan.id)}>{live?.plan.id === plan.id ? 'Current plan' : busy === plan.id ? 'Opening…' : Number(plan.price) === 0 ? 'Activate' : 'Pay and activate'}</button>
          </PortalCard>
        )) : <PortalState title="No plans available" text="Your studio has not published plans yet." />}
      </div>
      {notice ? <p role={notice.tone === 'bad' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm font-bold ${notice.tone === 'bad' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{notice.text}</p> : null}
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
        {message ? <p className="rounded-xl bg-[#EDF4F2] px-4 py-3 text-sm font-bold text-[#191D15]">{message}</p> : null}
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
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#292F22]">{connection.status.replaceAll('_', ' ')}</p>
                  <h2 className="mt-1 text-xl font-black">{connection.project?.name ?? 'Studio interest'}</h2>
                  <p className="mt-1 text-sm font-bold text-[#686164]">{connection.project?.projectNumber ?? 'Project not selected yet'}</p>
                  {connection.shoot ? <p className="mt-2 text-sm font-bold text-[#686164]">{connection.shoot.title} · {new Date(connection.shoot.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p> : null}
                  {connection.createdBy?.fullName ? <p className="mt-2 text-xs font-bold text-[#686164]">From: {connection.createdBy.fullName}</p> : null}
                  <p className="mt-3 rounded-xl bg-[#FBFDF6] p-3 text-sm font-bold leading-6 text-[#686164]">{statusText}</p>
                  {connection.notes ? <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#FBFDF6] p-3 text-sm font-semibold leading-6 text-[#686164]">{connection.notes}</p> : null}
                </div>
                {canRespond ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => void respond(connection.id, 'ACCEPTED')} disabled={savingId === connection.id} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#527A68] px-4 text-sm font-black text-white disabled:opacity-60">
                      {savingId === connection.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Accept
                    </button>
                    <button type="button" onClick={() => void respond(connection.id, 'DECLINED')} disabled={savingId === connection.id} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#B94A48]/30 bg-white px-4 text-sm font-black text-[#8F2F2D] disabled:opacity-60">
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
