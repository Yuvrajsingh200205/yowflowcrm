import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import { CheckCircle2, ChevronDown, IndianRupee, Target, TrendingUp, Users } from 'lucide-react';
import { LeadModalShell } from './LeadModalShell';

export interface LeadTargetValues {
  yearlyLeadTarget: number;
  monthlyLeadTarget: number;
  yearlyBookedTarget: number;
  monthlyBookedTarget: number;
  yearlyRevenueTarget: number;
  monthlyRevenueTarget: number;
  avgTicketSize?: number;
  targetYear: string | number;
}

interface LeadTargetsModalProps {
  open: boolean;
  value: LeadTargetValues;
  onChange: Dispatch<SetStateAction<LeadTargetValues>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function LeadTargetsModal({ open, value, onChange, onClose, onSubmit }: LeadTargetsModalProps) {
  if (!open) return null;
  const ticket = value.avgTicketSize ?? (value.yearlyBookedTarget > 0 ? Math.round(value.yearlyRevenueTarget / value.yearlyBookedTarget) : 125000);
  const patch = (next: Partial<LeadTargetValues>) => onChange((current) => ({ ...current, ...next }));

  return (
    <LeadModalShell icon={Target} eyebrow="Performance Planning" title="Set Lead & Sales Targets" description="Configure yearly and monthly acquisition, conversion and revenue goals." onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={onSubmit} className="space-y-5">
        <section className="space-y-3 rounded-3xl border border-[#ded3cf] bg-[#f5f0ed] p-4 sm:p-5">
          <h3 className="text-sm font-black uppercase tracking-[.1em] text-[#43383c]">Target year / financial year</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[.8fr_1.2fr]">
            <input type="text" value={value.targetYear} onChange={(event) => patch({ targetYear: event.target.value })} placeholder="e.g. 2026-2027" className={fieldClass} />
            <label className="relative"><select value={['2026-2027', '2025-2026', '2027-2028', '2028-2029', '2026', '2027'].includes(String(value.targetYear)) ? String(value.targetYear) : 'custom'} onChange={(event) => event.target.value !== 'custom' && patch({ targetYear: event.target.value })} className={`${fieldClass} appearance-none pr-11 text-[#285147]`}><option value="2026-2027">2026-2027 (FY)</option><option value="2025-2026">2025-2026 (FY)</option><option value="2027-2028">2027-2028 (FY)</option><option value="2028-2029">2028-2029 (FY)</option><option value="2026">2026 (CY)</option><option value="2027">2027 (CY)</option><option value="custom">Custom year</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#2F5149]" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-extrabold text-[#665b5f]">Quick presets:</span>{['2025-2026', '2026-2027', '2027-2028', '2028-2029'].map((year) => <button key={year} type="button" onClick={() => patch({ targetYear: year })} className={`min-h-10 rounded-xl border px-3 text-sm font-bold transition ${String(value.targetYear) === year ? 'border-[#315d53] bg-[#315d53] text-white' : 'border-[#d8ceca] bg-white text-[#554a4e] hover:border-[#497a6e]'}`}>{year}</button>)}</div>
        </section>

        <TargetSection icon={Users} title="1 · Total inquiry lead volume target" tone="rose">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Yearly lead target" value={value.yearlyLeadTarget} onChange={(yearlyLeadTarget) => patch({ yearlyLeadTarget, monthlyLeadTarget: Math.ceil(yearlyLeadTarget / 12) })} />
            <NumberField label="Monthly lead target" value={value.monthlyLeadTarget} onChange={(monthlyLeadTarget) => patch({ monthlyLeadTarget, yearlyLeadTarget: monthlyLeadTarget * 12 })} />
          </div>
        </TargetSection>

        <TargetSection icon={CheckCircle2} title="2 · Booked deals & average ticket size" tone="green">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField label="Yearly booked deals" value={value.yearlyBookedTarget} onChange={(yearlyBookedTarget) => { const yearlyRevenueTarget = yearlyBookedTarget * ticket; patch({ yearlyBookedTarget, monthlyBookedTarget: Math.ceil(yearlyBookedTarget / 12), avgTicketSize: ticket, yearlyRevenueTarget, monthlyRevenueTarget: Math.round(yearlyRevenueTarget / 12) }); }} />
            <NumberField label="Monthly booked deals" value={value.monthlyBookedTarget} onChange={(monthlyBookedTarget) => { const yearlyBookedTarget = monthlyBookedTarget * 12; const yearlyRevenueTarget = yearlyBookedTarget * ticket; patch({ monthlyBookedTarget, yearlyBookedTarget, avgTicketSize: ticket, yearlyRevenueTarget, monthlyRevenueTarget: monthlyBookedTarget * ticket }); }} />
            <NumberField label="Average ticket size ₹" value={ticket} highlight onChange={(avgTicketSize) => { const yearlyRevenueTarget = value.yearlyBookedTarget * avgTicketSize; patch({ avgTicketSize, yearlyRevenueTarget, monthlyRevenueTarget: value.monthlyBookedTarget > 0 ? value.monthlyBookedTarget * avgTicketSize : Math.round(yearlyRevenueTarget / 12) }); }} />
          </div>
        </TargetSection>

        <TargetSection icon={IndianRupee} title="3 · Booked revenue target" tone="gold" badge={<><TrendingUp className="size-4" />{value.yearlyBookedTarget || 0} deals × ₹{ticket.toLocaleString('en-IN')} = ₹{(value.yearlyRevenueTarget || 0).toLocaleString('en-IN')}</>}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Yearly revenue target (₹)" value={value.yearlyRevenueTarget} onChange={(yearlyRevenueTarget) => patch({ yearlyRevenueTarget, monthlyRevenueTarget: Math.round(yearlyRevenueTarget / 12), avgTicketSize: value.yearlyBookedTarget > 0 ? Math.round(yearlyRevenueTarget / value.yearlyBookedTarget) : 0 })} />
            <NumberField label="Monthly revenue target (₹)" value={value.monthlyRevenueTarget} onChange={(monthlyRevenueTarget) => patch({ monthlyRevenueTarget, yearlyRevenueTarget: monthlyRevenueTarget * 12, avgTicketSize: value.monthlyBookedTarget > 0 ? Math.round(monthlyRevenueTarget / value.monthlyBookedTarget) : 0 })} />
          </div>
        </TargetSection>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7dedb] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-[#d8ceca] px-5 text-sm font-extrabold text-[#5d5256] hover:bg-[#f7f2ef]">Cancel</button><button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#264e45] px-6 text-sm font-black text-white shadow-lg shadow-[#264e45]/15 transition hover:bg-[#1e3d36]"><CheckCircle2 className="size-5" />Save Lead Targets</button></div>
      </form>
    </LeadModalShell>
  );
}

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#d4c9c5] bg-white px-4 text-base font-bold text-[#392f33] outline-none transition focus:border-[#3f7064] focus:ring-4 focus:ring-[#3f7064]/10';

function NumberField({ label, value, onChange, highlight }: { label: string; value: number; onChange: (value: number) => void; highlight?: boolean }) {
  return <label className={`block text-sm font-extrabold ${highlight ? 'text-emerald-900' : 'text-[#4d4246]'}`}>{label}<input type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className={`${fieldClass} mt-2 font-mono ${highlight ? 'border-emerald-300 text-emerald-950 focus:border-emerald-600 focus:ring-emerald-700/10' : ''}`} required /></label>;
}

function TargetSection({ icon: Icon, title, tone, badge, children }: { icon: typeof Users; title: string; tone: 'rose' | 'green' | 'gold'; badge?: ReactNode; children: ReactNode }) {
  const styles = { rose: 'border-[#e0ebe8] bg-[#fafcfb] text-[#264e45]', green: 'border-emerald-100 bg-emerald-50/40 text-emerald-950', gold: 'border-amber-200 bg-amber-50/50 text-amber-950' }[tone];
  return <section className={`space-y-4 rounded-3xl border p-4 sm:p-5 ${styles}`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[.08em]"><Icon className="size-5" />{title}</h3>{badge && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-sm font-extrabold text-amber-900">{badge}</span>}</div>{children}</section>;
}
