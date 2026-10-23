import React, { useState } from 'react';
import { Project, ShootEvent, TeamMember } from '@/types';
import { Film, Calendar, CalendarDays, MapPin, Users, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Clock, AlertCircle, Sparkles, UserPlus, Edit3, Plus, Trash2, X, UserCheck, BarChart2, FileText, Copy, Check, AlertTriangle, Search, SlidersHorizontal, ListFilter, ClipboardCheck } from 'lucide-react';
import { getShootDateInfo, getShootTrackingStats } from '@/utils/shootTracking';
import { employeeAssignees } from '@/features/projects/assigneeOptions';
import { usePermission } from '@/features/access';
import { ScheduleShootModal } from './ScheduleShootModal';

interface ShootManagementProps {
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
  onSelectProject?: (project: Project) => void;
  team?: TeamMember[];
}

export const ShootManagement: React.FC<ShootManagementProps> = ({ projects, onUpdateProject, onSelectProject, team = [] }) => {
  const { can } = usePermission();
  const canCreate = can('shoots.create');
  const canAssign =
    can('shoots.assign_photographer') ||
    can('shoots.assign_cinematographer') ||
    can('shoots.assign_freelancer');
  const canManageStatus = can('shoots.manage_status');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showScheduleShoot, setShowScheduleShoot] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track expanded project IDs. By default, first project or none can be expanded
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);

  // State for Crew Assignment Modal
  const [editingCrewShoot, setEditingCrewShoot] = useState<{
    projectId: string;
    shootId: string;
    shootTitle: string;
    clientTitle: string;
    leadPhotographer: string;
    cinematographer: string;
    droneOperator: string;
    assistant: string;
    crewAssignments: Array<{ id: string; role: string; name: string; mobile?: string }>;
  } | null>(null);

  const toggleExpandProject = (projId: string) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const expandAll = () => {
    setExpandedProjectIds(projects.map((p) => p.id));
  };

  const collapseAll = () => {
    setExpandedProjectIds([]);
  };

  const handleOpenAssignCrew = (projectId: string, clientTitle: string, shoot: ShootEvent) => {
    if (!canAssign) return;
    setEditingCrewShoot({
      projectId,
      shootId: shoot.id,
      shootTitle: shoot.title,
      clientTitle,
      leadPhotographer: shoot.leadPhotographer || '',
      cinematographer: shoot.cinematographer || '',
      droneOperator: shoot.droneOperator || '',
      assistant: shoot.assistant || '',
      // Copy the rows too: the modal edits them in place, and sharing the
      // project's row objects hides the change from the "did shoots change"
      // check, so the edit would never be saved.
      crewAssignments: (shoot.crewAssignments || []).map((crew) => ({ ...crew })),
    });
  };

  const handleSaveCrewAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssign || !editingCrewShoot) return;

    const proj = projects.find((p) => p.id === editingCrewShoot.projectId);
    if (!proj) return;

    const updatedShoots: Project['shoots'] = proj.shoots.map((s) => {
      if (s.id === editingCrewShoot.shootId) {
        return {
          ...s,
          leadPhotographer: editingCrewShoot.leadPhotographer.trim() || undefined,
          cinematographer: editingCrewShoot.cinematographer.trim() || undefined,
          droneOperator: editingCrewShoot.droneOperator.trim() || undefined,
          assistant: editingCrewShoot.assistant.trim() || undefined,
          crewAssignments: editingCrewShoot.crewAssignments.filter(
            (c) => c.name.trim() !== '' || c.role.trim() !== ''
          ),
        };
      }
      return s;
    });

    onUpdateProject({
      ...proj,
      shoots: updatedShoots,
    });

    setEditingCrewShoot(null);
  };

  // List of candidate names from team & freelancers for easy click/fill
  const availableCrewNames = Array.from(
    new Set(employeeAssignees(team).map((member) => member.name).filter(Boolean)),
  );

  // Extract available months from projects' shoots
  const availableMonthOptions = React.useMemo(() => {
    const map = new Map<string, string>(); // 'YYYY-MM' -> 'Month YYYY'
    projects.forEach((p) => {
      p.shoots.forEach((s) => {
        if (s.date) {
          const match = s.date.match(/^(\d{4})-(\d{2})/);
          if (match) {
            const key = `${match[1]}-${match[2]}`;
            const yearNum = parseInt(match[1]);
            const monthNum = parseInt(match[2]) - 1;
            const dateObj = new Date(yearNum, monthNum, 1);
            const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            map.set(key, label);
          }
        }
      });
    });
    
    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((key) => ({ value: key, label: map.get(key)! }));
  }, [projects]);

  const overview = React.useMemo(() => {
    const shoots = projects.flatMap((project) => project.shoots);
    const status = shoots.map((shoot) => getShootDateInfo(shoot.date, shoot.status));
    return {
      total: shoots.length,
      completed: status.filter((item) => item.isDone).length,
      today: status.filter((item) => item.isToday).length,
      upcoming: status.filter((item) => !item.isDone && !item.isToday).length,
    };
  }, [projects]);

  // Group projects and filter shoots by date-based tracking status, selected month, and selected date
  const projectsWithShoots = projects
    .map((p) => {
      const filteredShoots = p.shoots.filter((s) => {
        const info = getShootDateInfo(s.date, s.status);

        // Status filter
        if (filterStatus === 'scheduled' && info.isDone) return false;
        if (filterStatus === 'completed' && !info.isDone) return false;

        // Month filter
        if (selectedMonth !== 'all') {
          if (!s.date || !s.date.startsWith(selectedMonth)) {
            return false;
          }
        }

        // Exact Date filter
        if (selectedDate) {
          if (!s.date || s.date !== selectedDate) {
            return false;
          }
        }

        return true;
      });

      return {
        project: p,
        shoots: filteredShoots,
      };
    })
    .filter((item) => {
      if (selectedProjectId !== 'all' && item.project.id !== selectedProjectId) {
        return false;
      }
      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase();
        const matchesProject = [item.project.clientWeddingTitle, item.project.name, item.project.venueLocation]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));
        const matchesShoot = item.shoots.some((shoot) => [shoot.title, shoot.venue, shoot.location]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle)));
        if (!matchesProject && !matchesShoot) return false;
      }
      return item.shoots && item.shoots.length > 0;
    });

  // State for Report Modal
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportMonthFilter, setReportMonthFilter] = useState<string>('all');
  const [reportDateFilter, setReportDateFilter] = useState<string>('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'assigned'>('all');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Extract all shoots across all projects for report calculations
  const reportShootItems = React.useMemo(() => {
    const items: Array<{
      project: Project;
      shoot: ShootEvent;
      dateKey: string;
      formattedDateLabel: string;
      requiredSlots: Array<{ role: string; name: string; isAssigned: boolean }>;
      totalRequired: number;
      totalAssigned: number;
      totalPending: number;
      isFullyAssigned: boolean;
    }> = [];

    projects.forEach((proj) => {
      proj.shoots.forEach((s) => {
        let requiredSlots: Array<{ role: string; name: string; isAssigned: boolean }> = [];

        if (s.crewAssignments && s.crewAssignments.length > 0) {
          requiredSlots = s.crewAssignments.map((c) => ({
            role: c.role || 'Team Member',
            name: c.name || '',
            isAssigned: Boolean(c.name && c.name.trim() !== ''),
          }));
        } else {
          const standard = [
            { role: 'Lead Photographer', name: s.leadPhotographer || '' },
            { role: 'Cinematographer', name: s.cinematographer || '' },
            { role: 'Drone Operator', name: s.droneOperator || '' },
            { role: 'Assistant', name: s.assistant || '' },
          ];
          requiredSlots = standard.map((st) => ({
            role: st.role,
            name: st.name,
            isAssigned: Boolean(st.name && st.name.trim() !== ''),
          }));
        }

        const totalRequired = requiredSlots.length;
        const totalAssigned = requiredSlots.filter((slot) => slot.isAssigned).length;
        const totalPending = totalRequired - totalAssigned;
        const isFullyAssigned = totalRequired > 0 && totalPending === 0;

        let dateKey = s.date || 'Unscheduled';
        let formattedDateLabel = dateKey;
        if (s.date && s.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = s.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          formattedDateLabel = dt.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        }

        items.push({
          project: proj,
          shoot: s,
          dateKey,
          formattedDateLabel,
          requiredSlots,
          totalRequired,
          totalAssigned,
          totalPending,
          isFullyAssigned,
        });
      });
    });

    return items;
  }, [projects]);

  // Filter report items by report filters
  const filteredReportItems = React.useMemo(() => {
    return reportShootItems.filter((item) => {
      if (reportMonthFilter !== 'all') {
        if (!item.dateKey || !item.dateKey.startsWith(reportMonthFilter)) {
          return false;
        }
      }

      if (reportDateFilter) {
        if (!item.dateKey || item.dateKey !== reportDateFilter) {
          return false;
        }
      }

      if (reportStatusFilter === 'pending' && item.isFullyAssigned) return false;
      if (reportStatusFilter === 'assigned' && !item.isFullyAssigned) return false;

      return true;
    });
  }, [reportShootItems, reportMonthFilter, reportDateFilter, reportStatusFilter]);

  // Group report items by Date
  const groupedDateReports = React.useMemo(() => {
    const map = new Map<string, typeof filteredReportItems>();

    filteredReportItems.forEach((item) => {
      const list = map.get(item.dateKey) || [];
      list.push(item);
      map.set(item.dateKey, list);
    });

    const sortedDates = Array.from(map.keys()).sort();

    return sortedDates.map((dateKey) => {
      const items = map.get(dateKey)!;
      const formattedLabel = items[0]?.formattedDateLabel || dateKey;
      const totalShoots = items.length;
      const totalRequired = items.reduce((acc, curr) => acc + curr.totalRequired, 0);
      const totalAssigned = items.reduce((acc, curr) => acc + curr.totalAssigned, 0);
      const totalPending = items.reduce((acc, curr) => acc + curr.totalPending, 0);
      const isDateFullyAssigned = totalPending === 0 && totalRequired > 0;

      return {
        dateKey,
        formattedLabel,
        items,
        totalShoots,
        totalRequired,
        totalAssigned,
        totalPending,
        isDateFullyAssigned,
      };
    });
  }, [filteredReportItems]);

  // Summary Metrics for the Report
  const reportMetrics = React.useMemo(() => {
    const totalShoots = filteredReportItems.length;
    const totalRequired = filteredReportItems.reduce((acc, c) => acc + c.totalRequired, 0);
    const totalAssigned = filteredReportItems.reduce((acc, c) => acc + c.totalAssigned, 0);
    const totalPending = filteredReportItems.reduce((acc, c) => acc + c.totalPending, 0);
    const fullyAssignedShoots = filteredReportItems.filter((c) => c.isFullyAssigned).length;
    const pendingShoots = totalShoots - fullyAssignedShoots;

    return {
      totalShoots,
      totalRequired,
      totalAssigned,
      totalPending,
      fullyAssignedShoots,
      pendingShoots,
    };
  }, [filteredReportItems]);

  const handleCopyReportSummary = () => {
    let monthLabel = reportMonthFilter === 'all' ? 'All Months' : reportMonthFilter;
    if (reportDateFilter) monthLabel += ` (Date: ${reportDateFilter})`;

    const lines = [
      `📊 *SHOOT & TEAM ALLOCATION RESOURCE REPORT*`,
      `📅 Filter Period: ${monthLabel}`,
      `----------------------------------------`,
      `• Total Scheduled Shoots: ${reportMetrics.totalShoots}`,
      `• Required Crew Slots: ${reportMetrics.totalRequired} Members`,
      `• Assigned Crew: ${reportMetrics.totalAssigned} | Pending: ${reportMetrics.totalPending}`,
      `• Fully Staffed Shoots: ${reportMetrics.fullyAssignedShoots} / ${reportMetrics.totalShoots}`,
      `----------------------------------------`,
      `*DATE-BY-DATE BREAKDOWN:*`,
      ``,
    ];

    groupedDateReports.forEach((group) => {
      lines.push(`📅 *Date: ${group.formattedLabel}* (${group.totalShoots} Shoot${group.totalShoots > 1 ? 's' : ''})`);
      lines.push(`   Status: ${group.isDateFullyAssigned ? '✅ Fully Assigned' : `⚠️ ${group.totalPending} Member(s) Pending`}`);
      lines.push(`   Crew Allocation: ${group.totalAssigned}/${group.totalRequired} Assigned`);

      group.items.forEach((item, idx) => {
        lines.push(`   ${idx + 1}. *${item.project.clientWeddingTitle || item.project.name}* - ${item.shoot.title}`);
        lines.push(`      Venue: ${item.shoot.venue || item.shoot.location || 'N/A'}`);

        const assignedNames = item.requiredSlots
          .filter((s) => s.isAssigned)
          .map((s) => `${s.role}: ${s.name}`)
          .join(', ');

        const pendingRoles = item.requiredSlots
          .filter((s) => !s.isAssigned)
          .map((s) => s.role)
          .join(', ');

        if (assignedNames) lines.push(`      ✓ Assigned: ${assignedNames}`);
        if (pendingRoles) lines.push(`      ❌ Needed: ${pendingRoles}`);
      });
      lines.push(``);
    });

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const toggleShootStatus = (projectId: string, shootId: string) => {
    if (!canManageStatus) return;
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    const updatedShoots = proj.shoots.map((s) => {
      if (s.id === shootId) {
        return {
          ...s,
          status: s.status === 'completed' ? ('scheduled' as const) : ('completed' as const),
        };
      }
      return s;
    });

    onUpdateProject({
      ...proj,
      shoots: updatedShoots,
    });
  };

  const formatShootDate = (date?: string) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Date to be confirmed';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5 pb-8 w-full">
      
      <section className="relative overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(204,235,142,.2),transparent_30%),linear-gradient(125deg,#21261C,#191C15_50%,#11130E)] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#E6E8E4]"><CalendarDays className="size-4 text-emerald-300" />Production workspace</span>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Film className="size-6 text-[#DCDFDA]" /></span>Shoot Management</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">Plan every function, assign the right crew, and keep each wedding shoot clear and on track.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button onClick={() => { setReportMonthFilter(selectedMonth); setReportDateFilter(selectedDate); setShowReportModal(true); }} className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"><BarChart2 className="size-4" />Crew report</button>
            {canCreate && (
            <button onClick={() => setShowScheduleShoot(true)} className="group flex items-center justify-center gap-2.5 rounded-2xl border border-white/60 bg-gradient-to-r from-[#F3F9E7] to-[#DFEDC3] px-5 py-3 text-sm font-extrabold text-[#1C2018] shadow-[0_10px_24px_rgba(10,20,17,.22)] transition hover:-translate-y-0.5 hover:shadow-xl"><span className="grid size-8 place-items-center rounded-xl bg-[#21251B] text-white transition group-hover:rotate-6"><Plus className="size-5" /></span>Schedule a shoot<Sparkles className="size-4 text-[#aa7251]" /></button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'All shoots', value: overview.total, hint: 'Across all projects', icon: Film, tone: 'text-slate-700 bg-white border-[#e2d9d3]' },
          { label: 'Upcoming', value: overview.upcoming, hint: 'Need preparation', icon: Clock, tone: 'text-amber-800 bg-amber-50 border-amber-200' },
          { label: 'Today', value: overview.today, hint: 'Active production', icon: Sparkles, tone: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
          { label: 'Completed', value: overview.completed, hint: 'Finished shoots', icon: CheckCircle2, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
        ].map(({ label, value, hint, icon: Icon, tone }) => <div key={label} className={`rounded-2xl border p-3.5 shadow-[0_8px_24px_rgba(48,44,46,.04)] ${tone}`}><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[11px] font-semibold opacity-75">{hint}</p></div><Icon className="size-5 opacity-70" /></div></div>)}
      </section>

      <section className="rounded-2xl border border-[#e2d9d3] bg-white p-3 shadow-[0_8px_24px_rgba(48,44,46,.05)] sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-extrabold text-slate-700"><SlidersHorizontal className="size-4 text-[#24291E]" />Find and filter shoots</div><div className="flex gap-1.5"><button onClick={expandAll} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#21251B] hover:bg-rose-50">Expand all</button><button onClick={collapseAll} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Collapse all</button></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#293022]" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search client, function or venue…" className="w-full rounded-xl border border-[#ded5cf] bg-[#FBFDF6] py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#293022] focus:ring-4 focus:ring-rose-100" /></label>
          <label className="relative rounded-xl border border-[#ded5cf] bg-[#FBFDF6]"><ListFilter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#293022]" /><select value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); if (e.target.value !== 'all') setExpandedProjectIds([e.target.value]); }} className="w-full appearance-none bg-transparent py-2.5 pl-9 pr-3 text-sm font-bold text-slate-700 outline-none"><option value="all">All projects ({projects.length})</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.clientWeddingTitle}</option>)}</select></label>
          <label className="relative rounded-xl border border-[#ded5cf] bg-[#FBFDF6]"><Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#293022]" /><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full appearance-none bg-transparent py-2.5 pl-9 pr-3 text-sm font-bold text-slate-700 outline-none"><option value="all">All months</option>{availableMonthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
          <label className="relative rounded-xl border border-[#ded5cf] bg-[#FBFDF6]"><CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#293022]" /><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'scheduled' | 'completed')} className="w-full appearance-none bg-transparent py-2.5 pl-9 pr-3 text-sm font-bold text-slate-700 outline-none"><option value="all">All statuses</option><option value="scheduled">Upcoming / scheduled</option><option value="completed">Completed</option></select></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-[#ded5cf] bg-[#FBFDF6] px-3 py-2 text-xs font-bold text-slate-600"><Calendar className="size-4 text-[#293022]" />Specific date <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent font-bold text-slate-700 outline-none" /></label>{(selectedProjectId !== 'all' || filterStatus !== 'all' || selectedMonth !== 'all' || selectedDate || searchQuery) && <button type="button" onClick={() => { setSelectedProjectId('all'); setFilterStatus('all'); setSelectedMonth('all'); setSelectedDate(''); setSearchQuery(''); }} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-50"><X className="size-3.5" />Clear filters</button>}</div>
      </section>

      {/* Projects Accordion List */}
      {projectsWithShoots.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
          No shoots found for the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {projectsWithShoots.map(({ project, shoots }) => {
            const isExpanded = expandedProjectIds.includes(project.id);
            const stats = getShootTrackingStats(project.shoots);

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Client Name Bar (Header with Shoot Tracking Overview) */}
                <div
                  onClick={() => toggleExpandProject(project.id)}
                  className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer select-none transition ${
                    isExpanded ? 'bg-indigo-50/50 border-b border-slate-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                      {project.clientWeddingTitle.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                          {project.clientWeddingTitle}
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                          {project.primaryServiceType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{project.venueLocation || 'Location N/A'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{project.weddingFunctionDates || 'Dates N/A'}</span>
                        </span>
                      </div>

                      {/* All Shoot Names & Date-Based Tracking Badges Preview */}
                      {shoots.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 self-start sm:self-center">
                            Shoots ({shoots.length}):
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {shoots.map((s) => {
                              const dateInfo = getShootDateInfo(s.date, s.status);
                              return (
                                <span
                                  key={s.id}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold border leading-none shadow-2xs ${dateInfo.badgeClass}`}
                                  title={`${s.title} • Date: ${s.date}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dateInfo.badgeDotColor}`} />
                                  <span className="whitespace-nowrap">{s.title}</span>
                                  <span className="opacity-80 text-[9px] shrink-0">({formatShootDate(s.date)})</span>
                                  <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-white/70 tracking-wider shrink-0">
                                    {dateInfo.dateBadgeText}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges, Progress & Expand Icon */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* Date-Based Status Counters */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border border-slate-200" title="Total Shoots">
                        {stats.total} Total
                      </span>
                      {stats.todayCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-black text-xs border border-indigo-300 animate-pulse flex items-center gap-1" title="Shoots scheduled for TODAY">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          {stats.todayCount} TODAY
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-200 flex items-center gap-1" title="Shoots Completed (or Past Date)">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {stats.completed} Done
                      </span>
                      {stats.pending > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-black text-xs border border-amber-200 flex items-center gap-1" title="Shoots Pending">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {stats.pending} Pending
                        </span>
                      )}
                    </div>

                    {/* Completion Mini Bar */}
                    <div className="w-full sm:w-28 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Done Rate</span>
                        <span className="text-indigo-600 font-extrabold">{stats.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${stats.completionPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {onSelectProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(project);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center gap-1 text-xs font-bold border border-indigo-200 cursor-pointer"
                          title="View full project details modal"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 space-y-4">
                    
                    {/* Shoot Tracking Summary Dashboard Banner */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Film className="w-4 h-4 text-indigo-600" />
                            SHOOT TRACKING & PROGRESS STATUS
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Auto-calculates shoot status (Completed/Done, Today, Pending) based on event dates vs current date for {project.clientWeddingTitle}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                          {stats.completed} / {stats.total} Shoots Completed ({stats.completionPercent}%)
                        </span>
                      </div>

                      {/* Stat Cards Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Scheduled</span>
                          <span className="text-lg font-black text-slate-900">{stats.total}</span>
                          <span className="text-[10px] text-slate-500 block font-medium">Shoot Events</span>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Shoot Done</span>
                          <span className="text-lg font-black text-emerald-700">{stats.completed}</span>
                          <span className="text-[10px] text-emerald-600 block font-bold">Completed / Past Date</span>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block">Today's Shoot</span>
                          <span className="text-lg font-black text-indigo-700">{stats.todayCount}</span>
                          <span className="text-[10px] text-indigo-600 block font-bold">Active Today</span>
                        </div>
                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-700 uppercase block">Pending</span>
                          <span className="text-lg font-black text-amber-800">{stats.pending}</span>
                          <span className="text-[10px] text-amber-600 block font-bold">Upcoming</span>
                        </div>
                      </div>

                      {/* Complete Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${stats.completionPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {shoots.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No shoots found matching filter for this client.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shoots.map((s, sIdx) => {
                          const dateInfo = getShootDateInfo(s.date, s.status);
                          return (
                            <div
                              key={s.id}
                              data-testid="shoot-card"
                              className={`rounded-xl border p-4 shadow-xs transition space-y-3 bg-white ${
                                dateInfo.isDone
                                  ? 'border-emerald-200 bg-emerald-50/20'
                                  : dateInfo.isToday
                                  ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200'
                                  : 'border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
                                    {project.clientWeddingTitle}
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">EVENT #{sIdx + 1}</span>
                                  <h4 className="text-base font-bold text-slate-900">{s.title}</h4>
                                </div>

                                {canManageStatus && (
                                <button
                                  onClick={() => toggleShootStatus(project.id, s.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 uppercase tracking-wider cursor-pointer border shadow-2xs ${
                                    s.status === 'completed'
                                      ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                  }`}
                                  title="Toggle status manually"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{s.status === 'completed' ? 'Shoot Done' : 'Mark Done'}</span>
                                </button>
                                )}
                              </div>

                              {/* Date Tracking Banner on Card */}
                              <div className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 ${dateInfo.badgeClass}`}>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className={`w-2 h-2 rounded-full ${dateInfo.badgeDotColor}`} />
                                  <span>{dateInfo.statusLabel}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/80 text-slate-800 border border-slate-200">
                                  {dateInfo.hindiLabel}
                                </span>
                              </div>

                              {/* Date & Location */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Date & Time</span>
                                    <span className="font-bold text-slate-900">{formatShootDate(s.date)} · {s.time || 'Full day'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Venue</span>
                                    <span className="font-bold text-slate-900 truncate block">{s.venue || 'Venue TBD'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Team Breakdown Banner */}
                              {(() => {
                                const roleCounts: Record<string, number> = {};
                                (s.crewAssignments || []).forEach((c) => {
                                  if (c.role) {
                                    roleCounts[c.role] = (roleCounts[c.role] || 0) + 1;
                                  }
                                });
                                const entries = Object.entries(roleCounts);
                                return (
                                  <div data-testid="team-breakdown" className="flex flex-wrap items-center gap-2 bg-[#f8f5f2] p-2.5 rounded-xl border border-[#e6ded8] text-xs">
                                    <span className="text-[10px] font-black text-[#1C2018] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                      <Users className="w-3.5 h-3.5 text-[#24291E]" />
                                      TEAM BREAKDOWN:
                                    </span>
                                    {entries.length === 0 ? (
                                      <span className="text-[10px] text-slate-400 italic">No crew assigned yet</span>
                                    ) : (
                                      entries.map(([role, count]) => (
                                        <span key={role} className="px-2.5 py-1 bg-white border border-[#dfd6d0] text-slate-800 rounded-lg font-bold text-xs shadow-2xs">
                                          {role}: <span className="text-[#24291E] font-extrabold">{count}</span>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                );
                              })()}

                            {/* Crew List */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  Assigned Shoot Crew
                                </span>
                                {canAssign && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignCrew(project.id, project.clientWeddingTitle || project.name, s)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-extrabold rounded-lg flex items-center gap-1 border border-indigo-200 cursor-pointer transition shadow-2xs"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>+ Assign / Edit Crew</span>
                                </button>
                                )}
                              </div>

                              {s.crewAssignments && s.crewAssignments.length > 0 ? (
                                <div 
                                  onClick={canAssign ? () => handleOpenAssignCrew(project.id, project.clientWeddingTitle || project.name, s) : undefined}
                                  className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs group ${canAssign ? 'cursor-pointer' : ''}`}
                                  title={canAssign ? 'Click to assign or edit team crew' : undefined}
                                >
                                  {s.crewAssignments.map((c, idx) => (
                                    <div key={c.id || idx} className="bg-slate-50 group-hover:bg-indigo-50/50 p-1.5 rounded border border-slate-200 group-hover:border-indigo-300 transition">
                                      <span className="text-[9px] text-indigo-600 block uppercase font-bold">{c.role} #{idx + 1}</span>
                                      <span className="font-bold text-slate-900 block truncate">{c.name || 'Unassigned'}</span>
                                      {c.mobile && (
                                        <span className="text-[10px] font-mono text-slate-500 block">{c.mobile}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div 
                                  onClick={canAssign ? () => handleOpenAssignCrew(project.id, project.clientWeddingTitle || project.name, s) : undefined}
                                  className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs group ${canAssign ? 'cursor-pointer' : ''}`}
                                  title={canAssign ? 'Click to assign or edit team crew' : undefined}
                                >
                                  {s.leadPhotographer && (
                                    <div className="bg-slate-50 group-hover:bg-indigo-50/50 p-1.5 rounded border border-slate-200 group-hover:border-indigo-300 transition">
                                      <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 block uppercase font-semibold">Lead Photo</span>
                                      <span className="font-bold text-slate-800">{s.leadPhotographer}</span>
                                    </div>
                                  )}
                                  {s.cinematographer && (
                                    <div className="bg-slate-50 group-hover:bg-indigo-50/50 p-1.5 rounded border border-slate-200 group-hover:border-indigo-300 transition">
                                      <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 block uppercase font-semibold">Cinematographer</span>
                                      <span className="font-bold text-slate-800">{s.cinematographer}</span>
                                    </div>
                                  )}
                                  {s.droneOperator && (
                                    <div className="bg-slate-50 group-hover:bg-indigo-50/50 p-1.5 rounded border border-slate-200 group-hover:border-indigo-300 transition">
                                      <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 block uppercase font-semibold">Drone Pilot</span>
                                      <span className="font-bold text-slate-800">{s.droneOperator}</span>
                                    </div>
                                  )}
                                  {s.assistant && (
                                    <div className="bg-slate-50 group-hover:bg-indigo-50/50 p-1.5 rounded border border-slate-200 group-hover:border-indigo-300 transition">
                                      <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 block uppercase font-semibold">Assistant</span>
                                      <span className="font-bold text-slate-800">{s.assistant}</span>
                                    </div>
                                  )}
                                  {!s.leadPhotographer && !s.cinematographer && !s.droneOperator && !s.assistant && (
                                    <div className="col-span-4 bg-amber-50/60 p-2 rounded border border-dashed border-amber-200 text-center hover:bg-amber-100/60 transition">
                                      <span className="text-xs font-extrabold text-amber-800 flex items-center justify-center gap-1">
                                        <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                                        No crew assigned yet — Click here to assign team
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Gear Checklist */}
                            {s.equipmentChecklist && s.equipmentChecklist.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gear Checklist:</span>
                                <div className="flex flex-wrap gap-1">
                                  {s.equipmentChecklist.map((gear, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-medium">
                                      • {gear}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREW ASSIGNMENT MODAL */}
      {editingCrewShoot && canAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C09]/75 p-3 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(7,8,6,.42)]">
            <header className="relative overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(214,236,169,.24),transparent_32%),linear-gradient(125deg,#21261C,#191C15_52%,#11130E)] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
              <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner">
                  <UserPlus className="size-7 text-[#E7F6CA]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]">Production crew</p><h3 className="mt-1 text-xl font-black sm:text-2xl">
                    Assign Team Crew
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#dfeae7]">
                    {editingCrewShoot.clientTitle} • {editingCrewShoot.shootTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCrewShoot(null)}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              </div>
            </header>

            <form onSubmit={handleSaveCrewAssignments} className="space-y-6 p-5 sm:p-7">
              
              {/* Quick Select Crew Pill Tags */}
              <section className="space-y-3"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#1C2018]">01 · Quick select</p><p className="mt-0.5 text-sm text-slate-500">Choose a person to fill the next available role automatically.</p></div>
                <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-3">
                  {availableCrewNames.map((name) => (
                    <span
                      key={name}
                      onClick={() => {
                        if (!editingCrewShoot.leadPhotographer) {
                          setEditingCrewShoot({ ...editingCrewShoot, leadPhotographer: name });
                        } else if (!editingCrewShoot.cinematographer) {
                          setEditingCrewShoot({ ...editingCrewShoot, cinematographer: name });
                        } else if (!editingCrewShoot.droneOperator) {
                          setEditingCrewShoot({ ...editingCrewShoot, droneOperator: name });
                        } else if (!editingCrewShoot.assistant) {
                          setEditingCrewShoot({ ...editingCrewShoot, assistant: name });
                        } else {
                          setEditingCrewShoot({
                            ...editingCrewShoot,
                            crewAssignments: [
                              ...editingCrewShoot.crewAssignments,
                              { id: `c-${Date.now()}`, role: 'Team Member', name },
                            ],
                          });
                        }
                      }}
                      className="rounded-xl border border-[#ded5cf] bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#24291E] hover:bg-[#24291E] hover:text-white"
                      title="Click to fill into next empty role"
                    >
                      + {name}
                    </span>
                  ))}
                </div>
              </section>

              {/* Standard Roles Fields */}
              <section className="space-y-3 border-t border-[#eee7e2] pt-5"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#1C2018]">02 · Core crew</p><p className="mt-0.5 text-sm text-slate-500">Assign the essential production roles for this shoot.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Lead Photographer</span>
                    {editingCrewShoot.leadPhotographer && (
                      <button
                        type="button"
                        onClick={() => setEditingCrewShoot({ ...editingCrewShoot, leadPhotographer: '' })}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingCrewShoot.leadPhotographer}
                    onChange={(e) => setEditingCrewShoot({ ...editingCrewShoot, leadPhotographer: e.target.value })}
                    placeholder="Enter name (e.g. Alex Morgan)"
                    className="w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#293022] focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Cinematographer</span>
                    {editingCrewShoot.cinematographer && (
                      <button
                        type="button"
                        onClick={() => setEditingCrewShoot({ ...editingCrewShoot, cinematographer: '' })}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingCrewShoot.cinematographer}
                    onChange={(e) => setEditingCrewShoot({ ...editingCrewShoot, cinematographer: e.target.value })}
                    placeholder="Enter name (e.g. Vikram Sharma)"
                    className="w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#293022] focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Drone Pilot / Operator</span>
                    {editingCrewShoot.droneOperator && (
                      <button
                        type="button"
                        onClick={() => setEditingCrewShoot({ ...editingCrewShoot, droneOperator: '' })}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingCrewShoot.droneOperator}
                    onChange={(e) => setEditingCrewShoot({ ...editingCrewShoot, droneOperator: e.target.value })}
                    placeholder="Enter name (e.g. Rahul Kumar)"
                    className="w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#293022] focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Assistant</span>
                    {editingCrewShoot.assistant && (
                      <button
                        type="button"
                        onClick={() => setEditingCrewShoot({ ...editingCrewShoot, assistant: '' })}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingCrewShoot.assistant}
                    onChange={(e) => setEditingCrewShoot({ ...editingCrewShoot, assistant: e.target.value })}
                    placeholder="Enter name (e.g. Amit Singh)"
                    className="w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#293022] focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />
                </div>
              </div></section>

              {/* Additional Custom Crew Members */}
              <section className="space-y-3 border-t border-[#eee7e2] pt-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-black uppercase tracking-[.1em] text-[#1C2018]">03 · Additional crew</p><p className="mt-0.5 text-sm text-slate-500">Add any specialised role needed for this event.</p></div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCrewShoot({
                        ...editingCrewShoot,
                        crewAssignments: [
                          ...editingCrewShoot.crewAssignments,
                          { id: `custom-${Date.now()}`, role: 'Candid Photo', name: '' },
                        ],
                      })
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-extrabold text-[#24291E] transition hover:bg-rose-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                {editingCrewShoot.crewAssignments.map((crew, idx) => (
                  <div key={crew.id || idx} className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-2.5">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={crew.role}
                        onChange={(e) => {
                          const updated = [...editingCrewShoot.crewAssignments];
                          updated[idx].role = e.target.value;
                          setEditingCrewShoot({ ...editingCrewShoot, crewAssignments: updated });
                        }}
                        placeholder="Role (e.g. Crane)"
                        className="w-full rounded-xl border border-[#ded5cf] bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#293022] focus:ring-4 focus:ring-rose-100"
                      />
                    </div>
                    <div className="col-span-7">
                      <input
                        type="text"
                        value={crew.name}
                        onChange={(e) => {
                          const updated = [...editingCrewShoot.crewAssignments];
                          updated[idx].name = e.target.value;
                          setEditingCrewShoot({ ...editingCrewShoot, crewAssignments: updated });
                        }}
                        placeholder="Person Name"
                        className="w-full rounded-xl border border-[#ded5cf] bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#293022] focus:ring-4 focus:ring-rose-100"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingCrewShoot.crewAssignments.filter((_, i) => i !== idx);
                          setEditingCrewShoot({ ...editingCrewShoot, crewAssignments: updated });
                        }}
                        className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Form Footer Actions */}
              <footer className="flex flex-col-reverse gap-2 border-t border-[#eee7e2] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCrewShoot(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#24291E] to-[#1C2018] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(28,32,24,.25)] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Save Crew Assignments</span>
                </button>
              </footer>

            </form>
          </div>
        </div>
      )}

      {/* SHOOT & TEAM RESOURCE ALLOCATION REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C09]/75 p-3 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(7,8,6,.42)]">
            
            {/* Modal Header */}
            <div className="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(214,236,169,.24),transparent_32%),linear-gradient(125deg,#21261C,#191C15_52%,#11130E)] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
              <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner">
                  <BarChart2 className="size-6 text-[#E7F6CA]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]">Production overview</p><h3 className="mt-1 text-lg font-black sm:text-xl">
                    <span>Shoot & Team Resource Allocation Report</span>
                  </h3>
                  <p className="mt-1 text-sm text-[#dfeae7]">
                    Check shoots per date, required crew members, assigned team status, and missing crew slots.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReportSummary}
                  className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                  title="Copy formatted summary report"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span className="font-extrabold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl border border-white/15 bg-black/15 p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              </div>
            </div>

            {/* Modal Controls / Filter Bar */}
            <div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-3 sm:mx-7">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Month Selector */}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Month:</span>
                  <select
                    value={reportMonthFilter}
                    onChange={(e) => setReportMonthFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    {availableMonthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Date Filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <input
                    type="date"
                    value={reportDateFilter}
                    onChange={(e) => setReportDateFilter(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                  {reportDateFilter && (
                    <button
                      type="button"
                      onClick={() => setReportDateFilter('')}
                      className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Status:</span>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Shoots</option>
                    <option value="pending">Pending crew needed</option>
                    <option value="assigned">Fully staffed only</option>
                  </select>
                </div>
              </div>

              {(reportMonthFilter !== 'all' || reportDateFilter !== '' || reportStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setReportMonthFilter('all');
                    setReportDateFilter('');
                    setReportStatusFilter('all');
                  }}
                  className="text-xs font-extrabold text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  Reset Report Filters
                </button>
              )}
            </div>

            {/* KPI Executive Summary Banner */}
            <div className="mx-5 mb-4 grid grid-cols-2 gap-2.5 sm:mx-7 sm:grid-cols-4 shrink-0">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Shoots</span>
                <span className="text-xl font-black text-slate-900">{reportMetrics.totalShoots}</span>
                <span className="text-[10px] text-slate-500 block">Scheduled Events</span>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Required Crew Slots</span>
                <span className="text-xl font-black text-indigo-900">{reportMetrics.totalRequired}</span>
                <span className="text-[10px] text-indigo-600 block">Total Team Need</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Crew Assigned</span>
                <span className="text-xl font-black text-emerald-900">{reportMetrics.totalAssigned}</span>
                <span className="text-[10px] text-emerald-600 block">Confirmed Team</span>
              </div>

              <div className={`p-3 rounded-xl border ${reportMetrics.totalPending > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase block ${reportMetrics.totalPending > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                  Pending Crew Slots
                </span>
                <span className={`text-xl font-black ${reportMetrics.totalPending > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                  {reportMetrics.totalPending}
                </span>
                <span className={`text-[10px] block ${reportMetrics.totalPending > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                  {reportMetrics.totalPending > 0 ? 'Action required' : 'All slots filled'}
                </span>
              </div>
            </div>

            {/* Scrollable Date-by-Date Allocation List */}
            <div className="mx-5 flex-1 space-y-4 overflow-y-auto pb-1 pr-1 sm:mx-7">
              {groupedDateReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No shoots match the selected report filter criteria.</p>
                </div>
              ) : (
                groupedDateReports.map((group) => (
                  <div key={group.dateKey} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    
                    {/* Date Card Header */}
                    <div className="bg-slate-800 text-white p-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-300" />
                        <span className="font-extrabold text-sm tracking-wide">{group.formattedLabel}</span>
                        <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600">
                          {group.totalShoots} Shoot{group.totalShoots > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-300 text-[11px]">
                          Crew Needed: <strong className="text-white">{group.totalRequired}</strong>
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          Assigned: <strong className="text-emerald-400">{group.totalAssigned}</strong>
                        </span>
                        {group.totalPending > 0 ? (
                          <span className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            <AlertTriangle className="size-3" />{group.totalPending} Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            <CheckCircle2 className="size-3" />Fully Staffed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shoots List under this Date */}
                    <div className="p-3 space-y-3 divide-y divide-slate-100">
                      {group.items.map((item, sIdx) => (
                        <div key={item.shoot.id || sIdx} className="pt-2 first:pt-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-xs sm:text-sm">
                                  {item.project.clientWeddingTitle || item.project.name}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  {item.shoot.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1"><MapPin className="size-3 text-rose-600" />{item.shoot.venue || item.shoot.location || 'Venue Not Set'}</span>
                                {item.shoot.time && <span className="flex items-center gap-1"><Clock className="size-3 text-rose-600" />{item.shoot.time}</span>}
                              </div>
                            </div>

                            {canAssign && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowReportModal(false);
                                handleOpenAssignCrew(item.project.id, item.project.clientWeddingTitle || item.project.name, item.shoot);
                              }}
                              className="self-start sm:self-auto px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Crew</span>
                            </button>
                            )}
                          </div>

                          {/* Crew Slots Grid for this shoot */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
                            {item.requiredSlots.map((slot, idx) => (
                              <div
                                key={idx}
                                className={`p-1.5 rounded border text-xs flex flex-col justify-between ${
                                  slot.isAssigned
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                                }`}
                              >
                                <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">
                                  {slot.role}
                                </span>
                                {slot.isAssigned ? (
                                  <span className="font-extrabold text-emerald-900 truncate flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    {slot.name}
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-amber-800 text-[11px] flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    Unassigned Needed
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mx-5 mt-3 flex shrink-0 items-center justify-between border-t border-[#eee7e2] pt-4 text-xs text-slate-500 sm:mx-7">
              <span>
                Showing <strong>{filteredReportItems.length}</strong> shoot events across <strong>{groupedDateReports.length}</strong> unique dates.
              </span>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {canCreate && (
      <ScheduleShootModal
        isOpen={showScheduleShoot}
        onClose={() => setShowScheduleShoot(false)}
        projects={projects}
        onUpdateProject={onUpdateProject}
        team={team}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />
      )}

    </div>
  );
};
