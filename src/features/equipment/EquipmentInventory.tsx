'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EQUIPMENT_CATEGORIES, EquipmentItem, INITIAL_EQUIPMENT } from './equipmentData';
import { BRAND } from '@/config/brand';

const STORAGE_KEY = `${BRAND.cookiePrefix}_owner_equipment_inventory`;

export function EquipmentInventory() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment)), [equipment]);

  const filtered = useMemo(() => equipment.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.serialNumber?.toLowerCase().includes(query) || item.assignedToShoot?.toLowerCase().includes(query) || item.customCategory?.toLowerCase().includes(query);
    return matchesSearch && (category === 'all' || item.category === category);
  }), [category, equipment, search]);

  const counts = {
    available: equipment.filter((item) => item.status === 'available').length,
    inUse: equipment.filter((item) => item.status === 'in_use').length,
    maintenance: equipment.filter((item) => item.status === 'maintenance').length,
  };

  const addEquipment = (item: Omit<EquipmentItem, 'id'>) => {
    if (!item.name) return;
    setEquipment((current) => [{ ...item, id: `eq-${Date.now()}` }, ...current]);
    setShowForm(false);
  };

  const statusClasses: Record<EquipmentItem['status'], string> = {
    available: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    in_use: 'border-amber-300 bg-amber-100 text-amber-900',
    maintenance: 'border-red-300 bg-red-100 text-red-800',
  };

  return <div className="space-y-5 pb-10">
    <section className="overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_90%_0%,rgba(204,235,142,.18),transparent_30%),linear-gradient(125deg,#21261C,#191C15_48%,#11130E)] p-5 text-white shadow-xl sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#D8DBD6]">Studio Asset Control</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">All Studio Equipment & Gear Inventory</h2><p className="mt-2 text-sm text-[#dfeae7]">Track cameras, lenses, drones, lighting and audio gear across wedding shoots.</p></div><button onClick={() => setShowForm(true)} className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-r from-[#F3F9E7] to-[#DFEDC3] px-5 py-3 text-sm font-extrabold text-[#1C2018] shadow-[0_10px_24px_rgba(10,20,17,.22)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"><span className="absolute -right-3 -top-4 size-14 rounded-full bg-white/50 blur-xl" /><span className="relative grid size-8 place-items-center rounded-xl bg-[#21251B] text-white shadow-sm transition group-hover:rotate-6"><Plus className="size-5" /></span><span className="relative">Add New Equipment</span><Sparkles className="relative size-4 text-[#aa7251]" /></button></div>
    </section>

    <section className="space-y-4 rounded-3xl border border-[#dfd9d2] bg-white p-4 shadow-[0_10px_30px_rgba(48,44,46,.07)] sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="relative sm:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, serial number or assigned shoot…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700"><option value="all">All Categories ({equipment.length})</option>{EQUIPMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-emerald-800">Available: {counts.available}</span><span className="rounded-lg border border-amber-200 bg-amber-100 px-3 py-1.5 text-amber-900">In Use: {counts.inUse}</span><span className="rounded-lg border border-red-200 bg-red-100 px-3 py-1.5 text-red-800">Maintenance: {counts.maintenance}</span></div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm italic text-slate-400">No studio gear matched your search.</p> : filtered.map((item) => <article key={item.id} className="space-y-3 rounded-2xl border border-slate-200 bg-[#faf8f6] p-4 transition hover:border-rose-200">
          <div className="flex items-start justify-between gap-2"><div><span className="text-xs font-bold uppercase tracking-wider text-rose-700">{item.customCategory || item.category}</span><h3 className="text-sm font-extrabold text-slate-900">{item.name}</h3>{item.serialNumber && <p className="font-mono text-xs text-slate-400">S/N: {item.serialNumber}</p>}</div><button onClick={() => setEquipment((current) => current.filter((entry) => entry.id !== item.id))} title="Delete equipment" className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button></div>
          {item.conditionNote && <p className="rounded-lg border border-slate-200 bg-white p-2 text-xs italic text-slate-600">“{item.conditionNote}”</p>}
          {item.assignedToShoot && <div className="rounded-lg border border-rose-100 bg-rose-50 p-2 text-xs text-slate-700"><strong className="block text-rose-900">Assigned Project</strong>{item.assignedToShoot}{item.assignedMember && ` (${item.assignedMember})`}</div>}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2"><span className="text-xs font-bold uppercase text-slate-400">Live Status</span><select value={item.status} onChange={(event) => setEquipment((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: event.target.value as EquipmentItem['status'] } : entry))} className={`rounded-lg border px-2.5 py-1 text-xs font-black ${statusClasses[item.status]}`}><option value="available">Available</option><option value="in_use">In Use / On Shoot</option><option value="maintenance">Maintenance</option></select></div>
        </article>)}
      </div>
    </section>
    <EquipmentFormModal open={showForm} onClose={() => setShowForm(false)} onSubmit={addEquipment} />
  </div>;
}
