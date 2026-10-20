interface Props {
  totalRevenue: number; totalAdvanceReceived: number; totalBalanceDue: number;
  allProjectsCount: number; runningProjectsCount: number; readyToDeliverCount: number;
  deliveredProjectsCount: number; pendingProjectsCount: number; urgentProjectsCount: number;
  onPayments?: () => void; onProjects: () => void; onCompleted: () => void; onUrgent: () => void;
  showRevenue?: boolean; showKpi?: boolean;
}

export function DashboardKpiGrid(props: Props) {
  const showRevenue = props.showRevenue !== false;
  const showKpi = props.showKpi !== false;
  if (!showRevenue && !showKpi) return null;
  const cards = [
    ['All Projects', props.allProjectsCount, `${props.runningProjectsCount} Currently Running`, props.onProjects, 'to-[#F7F7F7]'],
    ['Ready to Deliver', props.readyToDeliverCount, 'Films & Albums Ready', props.onCompleted, 'to-[#f3f7fa]'],
    ['Delivered', props.deliveredProjectsCount, 'Completed Archive', props.onProjects, 'to-[#f2f8f5]'],
    ['Pending', props.pendingProjectsCount, 'Awaiting Shoots/Edits', props.onProjects, 'to-[#F7FCED]'],
    ['Urgent', props.urgentProjectsCount, 'Deadline Approaching', props.onUrgent, 'to-red-50'],
  ] as const;
  const cols = showRevenue && showKpi ? 'xl:grid-cols-6' : showKpi ? 'xl:grid-cols-5' : 'xl:grid-cols-1';
  return <section className={`grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 ${cols}`}>
    {showRevenue && <button onClick={props.onPayments} className="group min-h-32 rounded-2xl border border-[#dfd9d2] bg-linear-to-br from-white to-[#F8FCEF] p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-500">Total Revenue</span><strong className="mt-3 block text-2xl text-slate-900">₹{props.totalRevenue.toLocaleString('en-IN')}</strong><span className="mt-1 flex justify-between text-xs font-bold"><i className="not-italic text-emerald-600">Adv: ₹{props.totalAdvanceReceived.toLocaleString('en-IN')}</i><i className="not-italic text-red-500">Due: ₹{props.totalBalanceDue.toLocaleString('en-IN')}</i></span></button>}
    {showKpi && cards.map(([title, value, detail, action, color]) => <button key={title} onClick={action} className={`min-h-32 rounded-2xl border border-[#dfd9d2] bg-linear-to-br from-white ${color} p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span><strong className="mt-2 block text-xl text-slate-900">{value < 10 ? `0${value}` : value}</strong><span className="mt-1 block text-xs text-slate-600">{detail}</span></button>)}
  </section>;
}
