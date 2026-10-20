import { AlertTriangle, Trash2 } from 'lucide-react';
import { LeadModalShell } from './LeadModalShell';

interface LeadDeleteConfirmModalProps {
  open: boolean;
  title: string;
  itemTitle: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeadDeleteConfirmModal({ open, title, itemTitle, message, onConfirm, onCancel }: LeadDeleteConfirmModalProps) {
  if (!open) return null;
  return (
    <LeadModalShell icon={AlertTriangle} eyebrow="Confirmation Required" title={title} description="This action cannot be automatically reversed." onClose={onCancel} maxWidth="max-w-lg">
      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-5">
        <p className="text-sm font-extrabold uppercase tracking-wide text-red-800">Selected record</p>
        <p className="mt-1 text-lg font-black text-[#12150F]">{itemTitle}</p>
        <p className="mt-3 text-base font-medium leading-relaxed text-[#685d61]">{message}</p>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-[#e7dedb] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-[#d8ceca] px-5 text-sm font-extrabold text-[#5d5256] transition hover:bg-[#F5FAEC]">Keep Record</button>
        <button type="button" onClick={onConfirm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-900/10 transition hover:bg-red-700"><Trash2 className="size-4" />Delete Permanently</button>
      </div>
    </LeadModalShell>
  );
}
