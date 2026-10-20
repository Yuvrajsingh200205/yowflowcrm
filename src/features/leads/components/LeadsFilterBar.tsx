import { ChevronDown, Search, Share2, SlidersHorizontal, UserRoundCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface LeadsFilterBarProps {
  search: string;
  status: string;
  source: string;
  assignee: string;
  teamOptions: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
}

const selectClass = 'w-full appearance-none bg-transparent py-2.5 pl-9 pr-9 text-sm font-bold text-slate-700 outline-none';

export function LeadsFilterBar(props: LeadsFilterBarProps) {
  return <section className="rounded-2xl border border-[#e2d9d3] bg-white p-3 shadow-[0_8px_24px_rgba(48,44,46,.05)] sm:p-4"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700"><SlidersHorizontal className="size-4 text-[#24291E]" />Search & Filter Leads</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label className="relative"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#293022]" /><input value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Search client, phone or event…" className="w-full rounded-xl border border-[#ded5cf] bg-[#FBFDF6] py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#293022] focus:ring-4 focus:ring-rose-100" /></label>
    <SelectWrap icon={<SlidersHorizontal className="size-4" />}><select value={props.status} onChange={(e) => props.onStatusChange(e.target.value)} className={selectClass}><option value="all">All Lead Statuses</option><option value="new">New Inquiries</option><option value="contacted">Contacted / Follow-up</option><option value="meeting_fixed">Meeting Fixed</option><option value="quotation_sent">Quotation Sent</option><option value="booked">Booked Deals</option><option value="lost">Lost / Unconverted</option></select></SelectWrap>
    <SelectWrap icon={<Share2 className="size-4" />}><select value={props.source} onChange={(e) => props.onSourceChange(e.target.value)} className={selectClass}><option value="all">All Lead Sources</option><option value="Instagram">Instagram</option><option value="WhatsApp">WhatsApp</option><option value="Meta Ads">Meta Ads</option><option value="Google Ads">Google Ads</option><option value="Reference / Word of Mouth">Reference / Word of Mouth</option><option value="Website">Website</option><option value="Walk-in">Walk-in</option><option value="Google Search">Google Search</option></select></SelectWrap>
    <SelectWrap icon={<UserRoundCheck className="size-4" />}><select value={props.assignee} onChange={(e) => props.onAssigneeChange(e.target.value)} className={selectClass}><option value="all">All Staff Assignees</option>{props.teamOptions.map((member) => <option key={member} value={member}>{member}</option>)}</select></SelectWrap>
  </div></section>;
}

function SelectWrap({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <label className="relative rounded-xl border border-[#ded5cf] bg-[#FBFDF6] focus-within:border-[#293022] focus-within:ring-4 focus-within:ring-rose-100"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#293022]">{icon}</span>{children}<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" /></label>;
}
