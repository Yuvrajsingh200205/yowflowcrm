import { BarChart3, CheckCircle2, FileText, LockKeyhole, Plus, ShieldCheck, Target } from 'lucide-react';

interface LeadsHeaderProps {
  userName: string;
  userRole: string;
  isOwner: boolean;
  canAddLead: boolean;
  activeView: 'list' | 'analytics';
  onViewChange: (view: 'list' | 'analytics') => void;
  onAddLead: () => void;
}

export function LeadsHeader({ userName, userRole, isOwner, canAddLead, activeView, onViewChange, onAddLead }: LeadsHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(204,235,142,.2),transparent_30%),linear-gradient(125deg,#41463E,#55333f_50%,#21241F)] p-5 text-white shadow-xl sm:p-7">
      <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
      <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center xl:gap-8">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#E6E8E4]">
              <ShieldCheck className="size-4 text-emerald-300" />Studio Lead CRM
            </span>
            <span className="rounded-lg border border-white/15 bg-black/10 px-3 py-1 text-sm font-semibold text-[#dfeae7]">{userName} · {userRole}</span>
            {!isOwner && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-100">
                <LockKeyhole className="size-4" />My leads only
              </span>
            )}
          </div>
          <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
              <Target className="size-6 text-[#DCDFDA]" />
            </span>
            Leads & Inquiry Management
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
            Track every couple from first inquiry to confirmed booking, with quotations, ownership and follow-up history in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
          {isOwner && (
            <div className="shrink-0 rounded-2xl border border-white/25 bg-[#151714]/55 p-1.5 shadow-inner">
              <p className="mb-1 px-2 text-[9px] font-black uppercase tracking-[.18em] text-rose-200">Current view</p>
              <div className="flex gap-1">
                <button
                  aria-current={activeView === 'list' ? 'page' : undefined}
                  onClick={() => onViewChange('list')}
                  className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-extrabold transition sm:flex-none ${activeView === 'list' ? 'border-[#DBF1AE] bg-[#fffaf6] text-[#373B35] shadow-[0_5px_16px_rgba(0,0,0,.28)]' : 'border-transparent text-[#CFD3CD] hover:bg-white/10 hover:text-white'}`}
                >
                  <FileText className="size-4" />All Leads{activeView === 'list' && <CheckCircle2 className="size-4 text-emerald-700" />}
                </button>
                <button
                  aria-current={activeView === 'analytics' ? 'page' : undefined}
                  onClick={() => onViewChange('analytics')}
                  className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-extrabold transition sm:flex-none ${activeView === 'analytics' ? 'border-[#DBF1AE] bg-[#fffaf6] text-[#373B35] shadow-[0_5px_16px_rgba(0,0,0,.28)]' : 'border-transparent text-[#CFD3CD] hover:bg-white/10 hover:text-white'}`}
                >
                  <BarChart3 className="size-4" />Analytics{activeView === 'analytics' && <CheckCircle2 className="size-4 text-emerald-700" />}
                </button>
              </div>
            </div>
          )}
          {canAddLead && (
            <button
              onClick={onAddLead}
              className="group inline-flex min-h-[52px] min-w-[138px] shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl border border-white/60 bg-gradient-to-r from-[#f9eee7] to-[#edcfc3] px-5 py-3 text-sm font-extrabold text-[#373B35] shadow-[0_10px_24px_rgba(10,20,17,.22)] transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9F4A2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#30342E]"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-[#3F443D] text-white transition group-hover:rotate-6">
                <Plus className="size-5" />
              </span>
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
