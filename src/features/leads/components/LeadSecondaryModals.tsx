import type { FormEvent } from 'react';
import type { OwnerLead } from '@/types';
import { Check, CheckCircle2, FileText, History, IndianRupee } from 'lucide-react';
import { LeadModalShell } from './LeadModalShell';

interface LeadHistoryModalProps { lead: OwnerLead | null; onClose: () => void }

export function LeadHistoryModal({ lead, onClose }: LeadHistoryModalProps) {
  if (!lead) return null;
  const logs = lead.activityLogs || [];
  return (
    <LeadModalShell icon={History} eyebrow={`Lead #${lead.id.slice(-4)}`} title="Lead Activity Timeline" description={<>Complete activity history for <strong>{lead.clientName}</strong> · Created by {lead.createdBy || 'Studio Owner'}</>} onClose={onClose} maxWidth="max-w-2xl">
      {logs.length === 0 ? (
        <div className="grid min-h-40 place-items-center rounded-3xl border-2 border-dashed border-[#cddad7] bg-[#faf7f5] p-6 text-center"><div><History className="mx-auto size-8 text-[#497a6e]" /><p className="mt-3 text-base font-bold text-[#554b4f]">No activity recorded yet</p></div></div>
      ) : (
        <div className="relative ml-2 space-y-4 border-l-2 border-[#bfd6d1] py-1 pl-6">
          {logs.map((log) => <article key={log.id} className="relative rounded-2xl border border-[#e2d8d4] bg-[#faf7f5] p-4"><span className="absolute -left-[31px] top-5 size-3 rounded-full bg-[#316156] ring-4 ring-white" /><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><time className="text-sm font-bold text-[#807579]">{log.timestamp}</time><span className="text-sm font-extrabold text-[#285147]">by {log.performedBy}</span></div><p className="mt-2 text-base font-bold leading-relaxed text-[#3b3336]">{log.description}</p></article>)}
        </div>
      )}
      <div className="flex justify-end border-t border-[#e7dedb] pt-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-[#264e45] px-5 text-sm font-extrabold text-white transition hover:bg-[#1e3d36]">Close Timeline</button></div>
    </LeadModalShell>
  );
}

interface LeadNoteModalProps { lead: OwnerLead | null; value: string; onValueChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }

export function LeadNoteModal({ lead, value, onValueChange, onClose, onSubmit }: LeadNoteModalProps) {
  if (!lead) return null;
  return (
    <LeadModalShell icon={FileText} eyebrow={`Lead #${lead.id.slice(-4)}`} title="Add Lead Note" description={<>Record an important follow-up for <strong>{lead.clientName}</strong>.</>} onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block text-base font-extrabold text-[#41383c]">Note / important remark<textarea rows={6} required placeholder="e.g. Client requested a 3-day wedding package and called today for budget negotiation." value={value} onChange={(event) => onValueChange(event.target.value)} className="mt-2 w-full resize-y rounded-2xl border border-[#d9ceca] bg-[#fbf9f7] p-4 text-base font-medium leading-relaxed text-[#352e31] outline-none transition placeholder:text-[#aaa1a4] focus:border-[#3f7064] focus:ring-4 focus:ring-[#3f7064]/10" /></label>
        <div className="flex flex-col-reverse gap-2 border-t border-[#e7dedb] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#d8ceca] bg-white px-5 text-sm font-extrabold text-[#5d5256] hover:bg-[#f7f2ef]">Cancel</button><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#264e45] px-5 text-sm font-black text-white shadow-lg shadow-[#264e45]/15 transition hover:bg-[#1e3d36]"><Check className="size-4" />Save Note</button></div>
      </form>
    </LeadModalShell>
  );
}

interface LeadBookingModalProps { lead: OwnerLead | null; finalAmount: string; advanceAmount: string; onFinalAmountChange: (value: string) => void; onAdvanceAmountChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }

export function LeadBookingModal({ lead, finalAmount, advanceAmount, onFinalAmountChange, onAdvanceAmountChange, onClose, onSubmit }: LeadBookingModalProps) {
  if (!lead) return null;
  return (
    <LeadModalShell icon={CheckCircle2} eyebrow="Deal Conversion" title="Booked Deal Details" description={<>Confirm the finalized package value for <strong>{lead.clientName}</strong>.</>} onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
          <AmountField label="Finalized deal amount" description="Total agreed package amount." value={finalAmount} onChange={onFinalAmountChange} required autoFocus />
          <div className="border-t border-emerald-200 pt-5"><AmountField label="Advance amount received" description="Deposit collected at booking time." value={advanceAmount} onChange={onAdvanceAmountChange} /></div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#e7dedb] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#d8ceca] px-5 text-sm font-extrabold text-[#5d5256] hover:bg-[#f7f2ef]">Cancel</button><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#477a67] px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#376553]"><CheckCircle2 className="size-4" />Confirm Booked Deal</button></div>
      </form>
    </LeadModalShell>
  );
}

function AmountField({ label, description, value, onChange, required, autoFocus }: { label: string; description: string; value: string; onChange: (value: string) => void; required?: boolean; autoFocus?: boolean }) {
  return <label className="block text-sm font-black uppercase tracking-wide text-emerald-950">{label} {required && '*'}<span className="mt-1 block text-sm font-medium normal-case tracking-normal text-emerald-800">{description}</span><span className="relative mt-2 block"><IndianRupee className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-emerald-700" /><input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. 250000" className="min-h-13 w-full rounded-xl border border-emerald-300 bg-white pl-11 pr-4 text-base font-black text-[#253a32] outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-700/10" required={required} autoFocus={autoFocus} /></span></label>;
}
