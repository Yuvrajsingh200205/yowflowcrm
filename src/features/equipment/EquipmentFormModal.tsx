import { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Plus,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { EQUIPMENT_CATEGORIES, EquipmentItem } from './equipmentData';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<EquipmentItem, 'id'>) => void;
}

export function EquipmentFormModal({ open, onClose, onSubmit }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<EquipmentItem['category']>('Cameras');

  if (!open) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get('name') || '').trim(),
      category: String(data.get('category')) as EquipmentItem['category'],
      customCategory: String(data.get('customCategory') || '').trim() || undefined,
      status: String(data.get('status')) as EquipmentItem['status'],
      serialNumber: String(data.get('serial') || '').trim() || undefined,
      conditionNote: String(data.get('note') || '').trim() || undefined,
    });
  };

  const field = 'w-full rounded-2xl border border-[#ded5cf] bg-[#fbfaf8] py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#366e61] focus:bg-white focus:ring-4 focus:ring-rose-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111a18]/75 p-3 backdrop-blur-sm sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="equipment-form-title" className="no-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(9,19,17,.42)]">
        <header className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(235,190,167,.22),transparent_32%),linear-gradient(125deg,#33514A,#55333f_52%,#1b2825)] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -bottom-12 -right-8 size-40 rounded-full border-[22px] border-white/5" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner backdrop-blur-sm">
                <Camera className="size-7 text-[#f6d9ca]" />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#d2e2de]">
                  <Sparkles className="size-3.5" /> Studio Asset Intake
                </p>
                <h2 id="equipment-form-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Add New Equipment</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#dfeae7]">Register a gear item and make it ready for studio allocation.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close add equipment form" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white">
              <X className="size-5" />
            </button>
          </div>
        </header>

        <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
          <section className="space-y-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[.1em] text-[#254b42]">01 · Asset Identity</p>
              <p className="mt-0.5 text-sm text-slate-500">Add the gear name and its unique serial reference.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr]">
              <label className="block text-sm font-bold text-slate-700">
                Equipment Name <span className="text-rose-700">*</span>
                <span className="relative mt-1.5 block">
                  <Camera className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#366e61]" />
                  <input name="name" required autoFocus placeholder="e.g. Sony FX30 Cinema Camera" className={field} />
                </span>
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Serial Number
                <span className="relative mt-1.5 block">
                  <Hash className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#366e61]" />
                  <input name="serial" placeholder="SN-882103" className={field} />
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-[#eee7e2] pt-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[.1em] text-[#254b42]">02 · Gear Category</p>
              <p className="mt-0.5 text-sm text-slate-500">Choose where this item belongs in the inventory.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EQUIPMENT_CATEGORIES.map((category) => (
                <label key={category} className="cursor-pointer">
                  <input type="radio" name="category" value={category} checked={selectedCategory === category} onChange={() => setSelectedCategory(category)} className="peer sr-only" />
                  <span className="flex min-h-14 items-center justify-center rounded-xl border border-[#ded5cf] bg-[#fbfaf8] px-2.5 py-2 text-center text-sm font-bold leading-tight text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 peer-checked:border-[#2f5f54] peer-checked:bg-[#2f5f54] peer-checked:text-white peer-checked:hover:border-[#264d44] peer-checked:hover:bg-[#264d44] peer-focus-visible:ring-4 peer-focus-visible:ring-rose-100">
                    {category}
                  </span>
                </label>
              ))}
            </div>
            {selectedCategory === 'Other' && (
              <label className="block rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-3 text-sm font-bold text-slate-700">
                Enter Custom Category <span className="text-rose-700">*</span>
                <span className="relative mt-1.5 block">
                  <Plus className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#366e61]" />
                  <input name="customCategory" required placeholder="e.g. Tripods, Storage Drives, Monitors…" className={field} />
                </span>
              </label>
            )}
          </section>

          <section className="space-y-3 border-t border-[#eee7e2] pt-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[.1em] text-[#254b42]">03 · Current Availability</p>
              <p className="mt-0.5 text-sm text-slate-500">Set the live operational state for your team.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="cursor-pointer">
                <input type="radio" name="status" value="available" defaultChecked className="peer sr-only" />
                <span className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-extrabold text-emerald-800 transition peer-checked:border-emerald-600 peer-checked:ring-2 peer-checked:ring-emerald-200 peer-focus-visible:ring-4">
                  <CheckCircle2 className="size-5" /> Available
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="status" value="in_use" className="peer sr-only" />
                <span className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-extrabold text-amber-900 transition peer-checked:border-amber-600 peer-checked:ring-2 peer-checked:ring-amber-200 peer-focus-visible:ring-4">
                  <Camera className="size-5" /> In Use / Shoot
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="status" value="maintenance" className="peer sr-only" />
                <span className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-extrabold text-red-800 transition peer-checked:border-red-600 peer-checked:ring-2 peer-checked:ring-red-200 peer-focus-visible:ring-4">
                  <Wrench className="size-5" /> Maintenance
                </span>
              </label>
            </div>
          </section>

          <section className="border-t border-[#eee7e2] pt-5">
            <label className="block text-sm font-bold text-slate-700">
              Condition & Kit Notes
              <span className="relative mt-1.5 block">
                <FileText className="absolute left-3.5 top-3.5 size-5 text-[#366e61]" />
                <textarea name="note" placeholder="Mention condition, batteries, charger or included accessories…" className={`${field} min-h-24 resize-none pl-11`} />
              </span>
            </label>
          </section>

          <footer className="flex flex-col-reverse gap-2 border-t border-[#eee7e2] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><ChevronDown className="size-4 -rotate-90 text-[#366e61]" />Fields marked with * are required</p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-none">Cancel</button>
              <button type="submit" className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f5f54] to-[#254b42] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(37,75,66,.25)] transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-none">
                <Plus className="size-5 transition group-hover:rotate-90" /> Save Equipment
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
