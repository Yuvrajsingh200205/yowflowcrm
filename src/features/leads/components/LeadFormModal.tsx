import type { FormEvent, ReactNode } from 'react';
import type { LeadStatus, OwnerLead } from '@/types';
import { nextIndianMobileValue } from '@/lib/validation/indianMobile';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleX,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

interface LeadFormModalProps {
  open: boolean;
  editingLead: OwnerLead | null;
  clientName: string;
  mobile: string;
  email: string;
  eventType: string;
  eventDate: string;
  budgetEstimate: number | '';
  advanceReceived: number | '';
  status: LeadStatus;
  source: string;
  assignedTo: string;
  notes: string;
  teamOptions: string[];
  onClientNameChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEventTypeChange: (value: string) => void;
  onEventDateChange: (value: string) => void;
  onBudgetChange: (value: number | '') => void;
  onAdvanceChange: (value: number | '') => void;
  onStatusChange: (value: LeadStatus) => void;
  onSourceChange: (value: string) => void;
  onAssignedToChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; icon: typeof Target; tone: string }[] = [
  { value: 'new', label: 'New Inquiry', icon: Sparkles, tone: 'peer-checked:border-rose-600 peer-checked:bg-rose-700 peer-checked:text-white' },
  { value: 'contacted', label: 'Contacted', icon: Phone, tone: 'peer-checked:border-sky-600 peer-checked:bg-sky-700 peer-checked:text-white' },
  { value: 'meeting_fixed', label: 'Meeting Fixed', icon: CalendarDays, tone: 'peer-checked:border-amber-600 peer-checked:bg-amber-600 peer-checked:text-white' },
  { value: 'quotation_sent', label: 'Quote Sent', icon: FileText, tone: 'peer-checked:border-violet-600 peer-checked:bg-violet-700 peer-checked:text-white' },
  { value: 'booked', label: 'Booked Deal', icon: CheckCircle2, tone: 'peer-checked:border-emerald-600 peer-checked:bg-emerald-700 peer-checked:text-white' },
  { value: 'lost', label: 'Lost', icon: CircleX, tone: 'peer-checked:border-red-600 peer-checked:bg-red-700 peer-checked:text-white' },
];

const field = 'w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#50574D] focus:bg-white focus:ring-4 focus:ring-rose-100';

export function LeadFormModal(props: LeadFormModalProps) {
  if (!props.open) return null;
  const numberValue = (value: string) => value === '' ? '' : Number(value);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151714]/75 p-3 backdrop-blur-sm sm:p-6">
    <div role="dialog" aria-modal="true" aria-labelledby="lead-form-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(14,15,13,.42)]">
      <header className="relative overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#41463E,#30342E_52%,#21241F)] px-5 py-5 text-white sm:px-7 sm:py-6">
        <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner"><Target className="size-7 text-[#f6d9ca]" /></span><div><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]"><Sparkles className="size-3.5" /> Lead Journey Intake</p><h2 id="lead-form-title" className="mt-1 text-xl font-black sm:text-2xl">{props.editingLead ? 'Edit Lead Record' : 'Add New Lead / Inquiry'}</h2><p className="mt-1 text-sm leading-relaxed text-[#dfeae7]">Capture the couple’s requirement and assign the next action clearly.</p></div></div>
          <button type="button" onClick={props.onClose} aria-label="Close lead form" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white"><X className="size-5" /></button>
        </div>
      </header>

      <form onSubmit={props.onSubmit} className="space-y-6 p-5 sm:p-7">
        <section className="space-y-3"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">01 · Couple & Contact</p><p className="mt-0.5 text-sm text-slate-500">Basic contact details for quick follow-up.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Client / Couple Name" icon={<UserRound className="size-5" />}><input value={props.clientName} onChange={(e) => props.onClientNameChange(e.target.value)} placeholder="Aarav & Ishita / Verma Family" className={field} /></Field>
          <Field label="Mobile Number *" icon={<Phone className="size-5" />}><input type="tel" inputMode="tel" maxLength={20} pattern="[+0-9() -]{7,20}" required value={props.mobile} onChange={(e) => props.onMobileChange(nextIndianMobileValue(e.target.value, props.mobile))} placeholder="+1 415 555 0132" className={field} /></Field>
          <Field label="Email Address" icon={<Mail className="size-5" />}><input type="email" value={props.email} onChange={(e) => props.onEmailChange(e.target.value)} placeholder="client@gmail.com" className={field} /></Field>
          <Field label="Lead Source" icon={<MapPin className="size-5" />}><input list="lead-sources-list" value={props.source} onChange={(e) => props.onSourceChange(e.target.value)} placeholder="Instagram, WhatsApp, referral, website…" className={field} /><datalist id="lead-sources-list"><option value="Instagram" /><option value="WhatsApp" /><option value="Meta Ads" /><option value="Google Ads" /><option value="Reference / Word of Mouth" /><option value="Website" /><option value="Walk-in" /><option value="Google Search" /></datalist></Field>
        </div></section>

        <section className="space-y-3 border-t border-[#eee7e2] pt-5"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">02 · Event Requirement</p><p className="mt-0.5 text-sm text-slate-500">Record the event scope, date and expected value.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Event Requirement / Type" icon={<Camera className="size-5" />}><input value={props.eventType} onChange={(e) => props.onEventTypeChange(e.target.value)} placeholder="Wedding Photography + Drone + Album" className={field} /></Field></div>
          <Field label="Event Date" icon={<CalendarDays className="size-5" />}><input type="date" value={props.eventDate} onChange={(e) => props.onEventDateChange(e.target.value)} className={field} /></Field>
          <Field label="Estimated Budget" icon={<IndianRupee className="size-5" />}><input type="number" min="0" value={props.budgetEstimate} onChange={(e) => props.onBudgetChange(numberValue(e.target.value))} placeholder="150000" className={field} /></Field>
        </div></section>

        <section className="space-y-3 border-t border-[#eee7e2] pt-5"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">03 · Lead Stage</p><p className="mt-0.5 text-sm text-slate-500">Choose the current point in the sales journey.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{STATUS_OPTIONS.map(({ value, label, icon: Icon, tone }) => <label key={value} className="cursor-pointer"><input type="radio" name="leadStatus" checked={props.status === value} onChange={() => props.onStatusChange(value)} className="peer sr-only" /><span className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#ded5cf] bg-[#FBFDF6] px-2 py-2 text-center text-sm font-bold text-slate-600 transition hover:border-rose-300 peer-focus-visible:ring-4 peer-focus-visible:ring-rose-100 ${tone}`}><Icon className="size-4" />{label}</span></label>)}</div>
          {props.status === 'booked' && <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2"><Field label="Finalized Deal Amount *" icon={<IndianRupee className="size-5 text-emerald-700" />}><input type="number" min="0" required value={props.budgetEstimate} onChange={(e) => props.onBudgetChange(numberValue(e.target.value))} placeholder="180000" className={`${field} border-emerald-300 bg-white focus:border-emerald-600 focus:ring-emerald-100`} /></Field><Field label="Advance Received" icon={<CheckCircle2 className="size-5 text-emerald-700" />}><input type="number" min="0" value={props.advanceReceived} onChange={(e) => props.onAdvanceChange(numberValue(e.target.value))} placeholder="50000" className={`${field} border-emerald-300 bg-white focus:border-emerald-600 focus:ring-emerald-100`} /></Field></div>}
        </section>

        <section className="grid grid-cols-1 gap-3 border-t border-[#eee7e2] pt-5 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700">Assign Lead To<span className="relative mt-1.5 block"><UsersRound className="absolute left-3.5 top-1/2 z-10 size-5 -translate-y-1/2 text-[#50574D]" /><select value={props.assignedTo} onChange={(e) => props.onAssignedToChange(e.target.value)} className={`${field} appearance-none pr-10`}><option value="">Select sales / studio staff</option>{props.teamOptions.map((member) => <option key={member} value={member}>{member}</option>)}{props.assignedTo && !props.teamOptions.includes(props.assignedTo) && <option value={props.assignedTo}>{props.assignedTo}</option>}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" /></span></label>
          <Field label="Inquiry Notes / Special Remarks" icon={<MessageSquareText className="size-5" />}><textarea rows={2} value={props.notes} onChange={(e) => props.onNotesChange(e.target.value)} placeholder="Package preferences, follow-up notes…" className={`${field} min-h-20 resize-none`} /></Field>
        </section>

        <footer className="flex flex-col-reverse gap-2 border-t border-[#eee7e2] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={props.onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#464B43] to-[#373B35] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(55,59,53,.25)] transition hover:-translate-y-0.5 hover:shadow-lg"><Plus className="size-5 transition group-hover:rotate-90" />{props.editingLead ? 'Update Lead' : 'Save Lead Record'}</button></footer>
      </form>
    </div>
  </div>;
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="relative mt-1.5 block"><span className="absolute left-3.5 top-3.5 z-10 text-[#50574D]">{icon}</span>{children}</span></label>;
}
