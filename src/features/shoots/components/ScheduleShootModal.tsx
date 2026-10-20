import React, { type ReactNode, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Camera, ChevronDown, Clock3, MapPin, MessageSquareText, Plus, Sparkles, Target, Trash2, UserRound, UsersRound, X } from 'lucide-react';
import { CrewMemberAssignment, Project, ShootEvent, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import { employeeAssignees } from '@/features/projects/assigneeOptions';

interface Props {
  isOpen: boolean;
  variant?: 'modal' | 'page';
  onClose: () => void;
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
  team?: TeamMember[];
  /** Pre-select a project, e.g. when opened from that project's own workspace. */
  defaultProjectId?: string;
}

const SHOOT_TYPE_SUGGESTIONS = ['Haldi', 'Mehendi', 'Sangeet', 'Wedding Ceremony', 'Reception', 'Pre-Wedding Shoot', 'Engagement'];
const field = 'w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#50574D] focus:bg-white focus:ring-4 focus:ring-rose-100';

export function ScheduleShootModal({ isOpen, variant = 'modal', onClose, projects, onUpdateProject, team = [], defaultProjectId }: Props) {
  const { showToast } = useToast();
  const { can } = usePermission();

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [shootType, setShootType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [cinematographer, setCinematographer] = useState('');
  const [editorTeam, setEditorTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [additionalCrew, setAdditionalCrew] = useState<Array<{ id: string; role: string; name: string }>>([]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const crewNames = useMemo(() => employeeAssignees(team).map((m) => m.name), [team]);
  const photographerNames = crewNames;
  const cinematographerNames = crewNames;
  const editorNames = crewNames;

  if (!isOpen) return null;

  const resetForm = () => {
    setProjectId(defaultProjectId || '');
    setShootType('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setVenue('');
    setPhotographer('');
    setCinematographer('');
    setEditorTeam('');
    setNotes('');
    setAdditionalCrew([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('shoots.create')) {
      showToast('You do not have permission to schedule a shoot.', { variant: 'error' });
      return;
    }
    if (!selectedProject || !shootType.trim() || !date) {
      showToast('Pick a project, shoot type, and date to schedule a shoot.', { variant: 'error' });
      return;
    }

    const crewAssignments: CrewMemberAssignment[] = [];
    if (photographer.trim()) crewAssignments.push({ id: `crew-${Date.now()}-1`, name: photographer.trim(), role: 'Photographer' });
    if (cinematographer.trim()) crewAssignments.push({ id: `crew-${Date.now()}-2`, name: cinematographer.trim(), role: 'Cinematographer' });
    if (editorTeam.trim()) crewAssignments.push({ id: `crew-${Date.now()}-3`, name: editorTeam.trim(), role: 'Editor / Live' });
    additionalCrew.forEach((member, index) => {
      if (member.name.trim()) crewAssignments.push({ id: member.id, name: member.name.trim(), role: member.role.trim() || `Crew member ${index + 1}` });
    });

    const displayTime = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || 'Time TBD';

    const newShoot: ShootEvent = {
      id: `shoot-${Date.now()}`,
      title: shootType.trim(),
      date,
      time: displayTime,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      venue: venue.trim() || selectedProject.venueLocation,
      location: selectedProject.venueLocation,
      leadPhotographer: photographer.trim() || undefined,
      cinematographer: cinematographer.trim() || undefined,
      crewAssignments,
      status: 'scheduled',
      notes: notes.trim() || undefined,
    };

    onUpdateProject({ ...selectedProject, shoots: [...selectedProject.shoots, newShoot] });
    showToast(`${shootType.trim()} shoot scheduled for ${selectedProject.clientWeddingTitle}.`);
    handleClose();
  };

  return (
    <div className={variant === 'page' ? 'w-full space-y-3' : 'fixed inset-0 z-50 flex items-center justify-center bg-[#151714]/75 p-3 backdrop-blur-sm sm:p-6'}>
      {variant === 'page' && (
        <button type="button" onClick={handleClose} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#dfd9d2] bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800">
          <ArrowLeft className="h-4 w-4" /><span className="text-xs font-bold">Back to Dashboard</span>
        </button>
      )}
      <div role="dialog" aria-modal="true" aria-labelledby="shoot-form-title" className={variant === 'page' ? 'mx-auto min-h-[calc(100vh-9rem)] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(14,15,13,.22)]' : 'max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(14,15,13,.42)]'}>
        <header className="relative overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#41463E,#30342E_52%,#21241F)] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
          <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner"><Camera className="size-7 text-[#f6d9ca]" /></span><div><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]"><Sparkles className="size-3.5" /> Production schedule</p><h2 id="shoot-form-title" className="mt-1 text-xl font-black sm:text-2xl">Schedule a Shoot</h2><p className="mt-1 text-sm leading-relaxed text-[#dfeae7]">Add the function details and line up the crew with confidence.</p></div></div>
          {variant === 'modal' && (
            <button type="button" onClick={handleClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="Close schedule shoot form">
              <X className="size-5" />
            </button>
          )}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          <section className="space-y-3"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">01 · Function Details</p><p className="mt-0.5 text-sm text-slate-500">Set the client, function, date and location for this shoot.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Project / Client" icon={<UserRound className="size-5" />}><select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`${field} appearance-none cursor-pointer`}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.clientWeddingTitle}</option>
              ))}
            </select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" /></Field></div>
            <Field label="Shoot Type" icon={<Camera className="size-5" />}>
              <input
                required
                list="shoot-type-suggestions"
                type="text"
                placeholder="e.g. Sangeet"
                value={shootType}
                onChange={(e) => setShootType(e.target.value)}
                className={field}
              />
              <datalist id="shoot-type-suggestions">
                {SHOOT_TYPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </Field>
            <Field label="Date" icon={<CalendarDays className="size-5" />}>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Start Time" icon={<Clock3 className="size-5" />}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="End Time" icon={<Clock3 className="size-5" />}>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={field}
              />
            </Field>
            <div className="sm:col-span-2"><Field label="Location / Venue" icon={<MapPin className="size-5" />}>
            <input
              type="text"
              placeholder={selectedProject?.venueLocation || 'e.g. Grand Ballroom, Udaivilas'}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={field}
            />
            </Field></div>
          </div></section>

          <section className="space-y-3 border-t border-[#eee7e2] pt-5"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">02 · Crew & Handover</p><p className="mt-0.5 text-sm text-slate-500">Optional now — you can update crew assignments later.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Photographer" icon={<UserRound className="size-5" />}>
              <input
                list="photographer-suggestions"
                type="text"
                placeholder="Lead photographer"
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                className={field}
              />
              <datalist id="photographer-suggestions">
                {photographerNames.map((n) => <option key={n} value={n} />)}
              </datalist>
            </Field>
            <Field label="Cinematographer" icon={<Camera className="size-5" />}>
              <input
                list="cinematographer-suggestions"
                type="text"
                placeholder="Cinematographer"
                value={cinematographer}
                onChange={(e) => setCinematographer(e.target.value)}
                className={field}
              />
              <datalist id="cinematographer-suggestions">
                {cinematographerNames.map((n) => <option key={n} value={n} />)}
              </datalist>
            </Field>
            <div className="sm:col-span-2"><Field label="Editor / Additional Team" icon={<UsersRound className="size-5" />}>
            <input
              list="editor-suggestions"
              type="text"
              placeholder="Assigned editor or additional crew"
              value={editorTeam}
              onChange={(e) => setEditorTeam(e.target.value)}
              className={field}
            />
            <datalist id="editor-suggestions">
              {editorNames.map((n) => <option key={n} value={n} />)}
            </datalist>
            </Field></div>
            <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#CED2CC] bg-[#fcfdfd] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-sm font-bold text-slate-700">Additional crew members</p><p className="mt-0.5 text-xs text-slate-500">Add roles such as drone pilot, assistant, lightman, or candid photographer.</p></div>
                <button type="button" onClick={() => setAdditionalCrew((current) => [...current, { id: `crew-${Date.now()}-${current.length}`, role: '', name: '' }])} className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-[#464B43] transition hover:bg-rose-50"><Plus className="size-4" />Add crew</button>
              </div>
              {additionalCrew.length > 0 && <div className="mt-3 space-y-2.5">{additionalCrew.map((member, index) => <div key={member.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)_auto] sm:items-end"><label className="block text-xs font-bold text-slate-600">Role<input value={member.role} onChange={(e) => setAdditionalCrew((current) => current.map((item) => item.id === member.id ? { ...item, role: e.target.value } : item))} placeholder="e.g. Drone pilot" className="mt-1 block w-full rounded-xl border border-[#ded5cf] bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#50574D] focus:ring-4 focus:ring-rose-100" /></label><label className="block text-xs font-bold text-slate-600">Crew member<input value={member.name} onChange={(e) => setAdditionalCrew((current) => current.map((item) => item.id === member.id ? { ...item, name: e.target.value } : item))} placeholder="Select or type a name" list={`extra-crew-${member.id}`} className="mt-1 block w-full rounded-xl border border-[#ded5cf] bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#50574D] focus:ring-4 focus:ring-rose-100" /><datalist id={`extra-crew-${member.id}`}>{[...photographerNames, ...cinematographerNames, ...editorNames].filter((name, itemIndex, names) => names.indexOf(name) === itemIndex).map((name) => <option key={name} value={name} />)}</datalist></label><button type="button" onClick={() => setAdditionalCrew((current) => current.filter((item) => item.id !== member.id))} className="mb-0.5 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Remove additional crew member ${index + 1}`}><Trash2 className="size-4" /></button></div>)}</div>}
            </div>
            <div className="sm:col-span-2"><Field label="Crew Notes / Special Requirements" icon={<MessageSquareText className="size-5" />}>
            <textarea
              rows={2}
              placeholder="Anything the crew should know…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${field} min-h-24 resize-none`}
            />
            </Field></div>
          </div></section>

          <footer className="flex flex-col-reverse gap-2 border-t border-[#eee7e2] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {variant === 'page' ? 'Back' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#464B43] to-[#373B35] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(55,59,53,.25)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Target className="size-5 transition group-hover:rotate-12" />Save Shoot Schedule
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="relative mt-1.5 block"><span className="absolute left-3.5 top-3.5 z-10 text-[#50574D]">{icon}</span>{children}</span></label>;
}
