import { Activity, AlertTriangle, ArrowDown, ArrowUpRight, Award, BarChart3, CalendarDays, CheckCircle2, Clock3, FileCheck2, IndianRupee, Lightbulb, Sparkles, Target, TrendingUp, UserCheck, Users } from 'lucide-react';
import type { OwnerLead } from '@/types';
import type { LeadTargets } from './LeadsManagement';

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const statusMeta = [
  { id: 'new', label: 'New Inquiries', color: '#293022' },
  { id: 'contacted', label: 'Contacted', color: '#607c96' },
  { id: 'meeting_fixed', label: 'Meeting Fixed', color: '#b78332' },
  { id: 'quotation_sent', label: 'Quotation Sent', color: '#262B1F' },
  { id: 'booked', label: 'Booked', color: '#527a68' },
  { id: 'lost', label: 'Lost', color: '#b95052' },
] as const;

export function LeadAnalyticsDashboard({ leads, targets }: { leads: OwnerLead[]; targets: LeadTargets }) {
  const total = leads.length;
  const booked = leads.filter((lead) => lead.status === 'booked');
  const lost = leads.filter((lead) => lead.status === 'lost');
  const active = leads.filter((lead) => !['booked', 'lost'].includes(lead.status));
  const quoted = leads.filter((lead) => lead.status === 'quotation_sent' || (lead.quotations?.length || 0) > 0);
  const pipelineValue = active.reduce((sum, lead) => sum + (lead.budgetEstimate || 0), 0);
  const bookedRevenue = booked.reduce((sum, lead) => sum + (lead.finalAmount || lead.budgetEstimate || 0), 0);
  const conversion = total ? (booked.length / total) * 100 : 0;
  const quoteConversion = quoted.length ? (booked.length / quoted.length) * 100 : 0;
  const avgTicket = booked.length ? bookedRevenue / booked.length : 0;
  const targetProgress = targets.monthlyRevenueTarget ? Math.min(100, (bookedRevenue / targets.monthlyRevenueTarget) * 100) : 0;
  const healthScore = Math.round(Math.min(100, conversion * 1.6 + Math.min(25, quoteConversion * .25) + Math.min(25, targetProgress * .25)));

  const stages = statusMeta.map((stage) => ({ ...stage, count: leads.filter((lead) => lead.status === stage.id).length }));
  const maxStage = Math.max(...stages.map((stage) => stage.count), 1);
  const sources = Object.entries(leads.reduce<Record<string, { leads: number; booked: number; value: number }>>((map, lead) => {
    const source = lead.source || 'Direct / Other';
    map[source] ||= { leads: 0, booked: 0, value: 0 };
    map[source].leads += 1;
    map[source].booked += lead.status === 'booked' ? 1 : 0;
    map[source].value += lead.budgetEstimate || 0;
    return map;
  }, {})).sort((a, b) => b[1].leads - a[1].leads);
  const assignees = Object.entries(leads.reduce<Record<string, { leads: number; booked: number; active: number; value: number; quotes: number }>>((map, lead) => {
    const name = lead.assignedTo || 'Unassigned';
    map[name] ||= { leads: 0, booked: 0, active: 0, value: 0, quotes: 0 };
    map[name].leads += 1; map[name].booked += lead.status === 'booked' ? 1 : 0; map[name].active += !['booked','lost'].includes(lead.status) ? 1 : 0;
    map[name].value += lead.budgetEstimate || 0; map[name].quotes += lead.quotations?.length || 0;
    return map;
  }, {})).sort((a, b) => b[1].booked - a[1].booked || b[1].value - a[1].value);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(2026, 2 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthly = leads.filter((lead) => lead.createdDate?.startsWith(key));
    return { key, label: date.toLocaleString('en-IN', { month: 'short' }), leads: monthly.length, revenue: monthly.filter((lead) => lead.status === 'booked').reduce((sum, lead) => sum + (lead.finalAmount || lead.budgetEstimate || 0), 0) };
  });
  const maxMonthly = Math.max(...months.map((month) => month.leads), 1);
  const maxRevenue = Math.max(...months.map((month) => month.revenue), 1);
  const upcoming = leads.filter((lead) => lead.eventDate && lead.eventDate >= '2026-08-22' && !['lost'].includes(lead.status)).sort((a,b) => (a.eventDate || '').localeCompare(b.eventDate || '')).slice(0, 5);
  const needsAttention = leads.filter((lead) => lead.status === 'new' || (lead.status !== 'booked' && !(lead.activityLogs?.length))).length;
  const recentActivity = leads.flatMap((lead) => (lead.activityLogs || []).map((log) => ({ ...log, client: lead.clientName }))).slice(-8).reverse();

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Lead Conversion" value={`${conversion.toFixed(1)}%`} detail={`${booked.length} of ${total} leads booked`} icon={TrendingUp} tone="emerald" />
      <MetricCard label="Active Pipeline" value={money(pipelineValue)} detail={`${active.length} open opportunities`} icon={Target} tone="rose" />
      <MetricCard label="Average Deal Value" value={money(avgTicket)} detail={`${money(bookedRevenue)} secured revenue`} icon={IndianRupee} tone="amber" />
      <MetricCard label="Quotation Success" value={`${quoteConversion.toFixed(1)}%`} detail={`${quoted.length} leads reached quote stage`} icon={FileCheck2} tone="blue" />
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-[0_12px_32px_rgba(48,44,46,.06)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#292F22]">Pipeline movement</p><h2 className="mt-1 text-xl font-black">Lead Conversion Funnel</h2><p className="text-sm text-slate-500">Every stage from inquiry to confirmed wedding.</p></div><span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{active.length} active leads</span></div>
        <div className="mt-6 space-y-3">{stages.map((stage, index) => <div key={stage.id} className="grid grid-cols-[115px_1fr_44px] items-center gap-3 sm:grid-cols-[150px_1fr_55px]"><div className="flex items-center gap-2 text-xs font-bold"><span className="grid size-6 place-items-center rounded-lg text-[10px] text-white" style={{backgroundColor:stage.color}}>{index+1}</span>{stage.label}</div><div className="h-8 overflow-hidden rounded-xl bg-slate-100"><div className="flex h-full min-w-8 items-center rounded-xl px-3 text-[10px] font-black text-white transition-all" style={{width:`${Math.max(7,(stage.count/maxStage)*100)}%`,backgroundColor:stage.color}}>{stage.count ? `${Math.round((stage.count/Math.max(total,1))*100)}%` : ''}</div></div><strong className="text-right text-lg">{stage.count}</strong></div>)}</div>
      </article>
      <article className="relative overflow-hidden rounded-3xl border border-[#252B1F] bg-[linear-gradient(145deg,#171A13,#0E100B)] p-5 text-white shadow-xl sm:p-6"><div className="absolute -right-16 -top-16 size-52 rounded-full border-[30px] border-white/[.04]"/><p className="text-xs font-black uppercase tracking-[.14em] text-rose-200">Pipeline Health</p><div className="relative mx-auto mt-5 grid size-44 place-items-center rounded-full" style={{background:`conic-gradient(#75aa91 ${healthScore*3.6}deg,rgba(255,255,255,.09) 0)`}}><div className="grid size-32 place-items-center rounded-full bg-[#10120D] text-center"><div><p className="text-4xl font-black">{healthScore}</p><p className="text-xs font-bold text-rose-200">out of 100</p></div></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><HealthItem label="Won" value={booked.length} good/><HealthItem label="Lost" value={lost.length}/><HealthItem label="Needs follow-up" value={needsAttention}/><HealthItem label="Target achieved" value={`${Math.round(targetProgress)}%`} good/></div></article>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">6-Month Growth Trend</h2><p className="text-xs text-slate-500">Lead volume and booked revenue movement</p></div><BarChart3 className="text-rose-700"/></div><div className="mt-6 flex h-52 items-end gap-3">{months.map((month) => <div key={month.key} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="flex flex-1 items-end justify-center gap-1"><div title={`${month.leads} leads`} className="w-3 rounded-t-md bg-[#293022] sm:w-5" style={{height:`${Math.max(4,(month.leads/maxMonthly)*145)}px`}}/><div title={money(month.revenue)} className="w-3 rounded-t-md bg-[#b99a5e] sm:w-5" style={{height:`${Math.max(4,(month.revenue/maxRevenue)*145)}px`}}/></div><p className="text-center text-[10px] font-black text-slate-500">{month.label}</p></div>)}</div><div className="mt-3 flex justify-center gap-5 text-xs font-bold"><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-[#293022]"/>Leads</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-[#b99a5e]"/>Booked revenue</span></div></article>
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black">Lead Source Quality</h2><p className="mb-5 text-xs text-slate-500">Volume, conversion and opportunity value</p><div className="space-y-3">{sources.length ? sources.map(([source, data], index) => <div key={source} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black"><span className="grid size-6 place-items-center rounded-lg bg-white text-[10px] shadow-sm">{index+1}</span>{source}</span><span className="text-xs font-black text-emerald-700">{data.leads ? Math.round((data.booked/data.leads)*100) : 0}% won</span></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{data.leads} leads · {data.booked} booked</span><strong className="text-slate-700">{money(data.value)}</strong></div></div>) : <Empty label="No source data yet"/>}</div></article>
    </section>

    <section className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#292F22]">Ownership & results</p><h2 className="mt-1 text-xl font-black">Sales Team Leaderboard</h2></div><Award className="size-7 text-amber-600"/></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[750px] text-left text-xs"><thead className="border-y bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{['Rank / Team Member','Assigned','Active','Booked','Quotes','Conversion','Pipeline Value'].map((heading)=><th key={heading} className="px-3 py-3 font-black">{heading}</th>)}</tr></thead><tbody className="divide-y">{assignees.map(([name,data],index)=><tr key={name} className="hover:bg-rose-50/40"><td className="px-3 py-3 font-black"><span className={`mr-2 inline-grid size-7 place-items-center rounded-lg ${index===0?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-600'}`}>{index+1}</span>{name}</td><td className="px-3 py-3 font-bold">{data.leads}</td><td className="px-3 py-3 text-amber-700">{data.active}</td><td className="px-3 py-3 font-black text-emerald-700">{data.booked}</td><td className="px-3 py-3">{data.quotes}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-700">{data.leads ? Math.round((data.booked/data.leads)*100) : 0}%</span></td><td className="px-3 py-3 font-black">{money(data.value)}</td></tr>)}</tbody></table></div></section>

    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-black"><CalendarDays className="size-5 text-rose-700"/>Upcoming Events</h2><div className="mt-4 space-y-2">{upcoming.length ? upcoming.map((lead)=><div key={lead.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-2"><p className="truncate text-xs font-black">{lead.clientName}</p><span className="shrink-0 text-[10px] font-bold text-rose-700">{lead.eventDate}</span></div><p className="mt-1 truncate text-[11px] text-slate-500">{lead.eventType} · {lead.assignedTo}</p></div>) : <Empty label="No upcoming events"/>}</div></article>
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-black"><Lightbulb className="size-5 text-amber-600"/>Business Insights</h2><div className="mt-4 space-y-2"><Insight good={conversion>=20} text={`Lead conversion is ${conversion.toFixed(1)}% across the complete pipeline.`}/><Insight good={quoteConversion>=35} text={`${quoteConversion.toFixed(1)}% of quoted opportunities have converted.`}/><Insight good={targetProgress>=50} text={`${Math.round(targetProgress)}% of monthly revenue target is secured.`}/><Insight good={needsAttention===0} text={`${needsAttention} leads need an immediate first follow-up.`}/></div></article>
      <article className="rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-black"><Activity className="size-5 text-emerald-700"/>Recent Activity</h2><div className="mt-4 max-h-64 space-y-3 overflow-y-auto">{recentActivity.length ? recentActivity.map((log)=><div key={log.id} className="border-l-2 border-rose-200 pl-3"><p className="text-xs font-bold">{log.client}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{log.description}</p><p className="mt-1 text-[9px] font-semibold text-slate-400">{log.timestamp}</p></div>) : <Empty label="No activity recorded"/>}</div></article>
    </section>
  </div>;
}

function MetricCard({label,value,detail,icon:Icon,tone}:{label:string;value:string;detail:string;icon:typeof Target;tone:'emerald'|'rose'|'amber'|'blue'}) { const tones={emerald:'bg-emerald-50 text-emerald-700',rose:'bg-rose-50 text-rose-700',amber:'bg-amber-50 text-amber-700',blue:'bg-blue-50 text-blue-700'}; return <article className="rounded-2xl border border-[#e2d9d3] bg-white p-4 shadow-sm"><div className="flex justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></div><span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5"/></span></div></article> }
function HealthItem({label,value,good}:{label:string;value:string|number;good?:boolean}) { return <div className="rounded-xl border border-white/10 bg-white/[.06] p-3"><p className="text-[10px] font-bold text-rose-100">{label}</p><p className={`mt-1 text-lg font-black ${good?'text-emerald-300':'text-white'}`}>{value}</p></div> }
function Insight({text,good}:{text:string;good:boolean}) { return <div className={`flex gap-2 rounded-xl p-3 text-xs font-semibold ${good?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{good?<CheckCircle2 className="size-4 shrink-0"/>:<AlertTriangle className="size-4 shrink-0"/>}<span>{text}</span></div> }
function Empty({label}:{label:string}) { return <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">{label}</div> }
