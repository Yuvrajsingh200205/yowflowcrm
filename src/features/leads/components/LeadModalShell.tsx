import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Sparkles, X } from 'lucide-react';

interface LeadModalShellProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: string;
  zIndex?: string;
  bodyClassName?: string;
}

export function LeadModalShell({ icon: Icon, eyebrow, title, description, onClose, children, actions, maxWidth = 'max-w-2xl', zIndex = 'z-50', bodyClassName = 'space-y-6 p-5 sm:p-7' }: LeadModalShellProps) {
  return <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-[#111a18]/75 p-3 backdrop-blur-sm sm:p-6`}>
    <div role="dialog" aria-modal="true" className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(9,19,17,.42)]`}>
      <header className="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#33514A,#55333f_52%,#1b2825)] px-5 py-5 text-white sm:px-7 sm:py-6">
        <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner"><Icon className="size-7 text-[#f6d9ca]" /></span><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#d2e2de]"><Sparkles className="size-3.5" />{eyebrow}</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{title}</h2>{description && <div className="mt-1 text-sm font-medium leading-relaxed text-[#dfeae7]">{description}</div>}</div></div>
          <div className="flex shrink-0 items-center gap-2">{actions}<button type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid size-10 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white"><X className="size-5" /></button></div>
        </div>
      </header>
      <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
    </div>
  </div>;
}
