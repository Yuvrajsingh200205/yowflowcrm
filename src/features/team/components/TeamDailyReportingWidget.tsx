import React, { useState, useMemo } from 'react';
import { TeamMember, AttendanceRecord, TeamTask, Project } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Lock, 
  Monitor, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  Phone, 
  ArrowUpRight, 
  FileText, 
  CheckSquare,
  AlertTriangle,
  Send,
  Eye,
  Check,
  Target,
  DollarSign
} from 'lucide-react';
import { BRAND } from '@/config/brand';

interface TeamDailyReportingWidgetProps {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  tasks: TeamTask[];
  projects?: Project[];
  onUpdateTask?: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (task: TeamTask) => void;
  onOpenMemberModal?: (member: TeamMember) => void;
}

export const TeamDailyReportingWidget: React.FC<TeamDailyReportingWidgetProps> = ({
  team = [],
  attendance = [],
  tasks = [],
  projects = [],
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onOpenMemberModal,
}) => {
  // Filters State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'logged_in' | 'logged_out' | 'has_pending'>('all');
  const [expandedMemberIds, setExpandedMemberIds] = useState<Record<string, boolean>>({});

  // Quick New Task Modal State
  const [assigningTaskMember, setAssigningTaskMember] = useState<TeamMember | null>(null);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskCategoryInput, setTaskCategoryInput] = useState<TeamTask['category']>('social_media');
  const [taskDomainInput, setTaskDomainInput] = useState(`${BRAND.domain}`);
  const [taskProjectIdInput, setTaskProjectIdInput] = useState('');
  const [taskPriorityInput, setTaskPriorityInput] = useState<'high' | 'medium' | 'low'>('high');
  const [taskDueDateInput, setTaskDueDateInput] = useState(selectedDate);
  const [taskNotesInput, setTaskNotesInput] = useState('');
  const [taskBookingTargetInput, setTaskBookingTargetInput] = useState<string>('');
  const [taskTargetRevenueInput, setTaskTargetRevenueInput] = useState<string>('');
  const [taskTargetLeadsCountInput, setTaskTargetLeadsCountInput] = useState<string>('');

  // Editing existing task
  const [editingTaskItem, setEditingTaskItem] = useState<TeamTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TeamTask | null>(null);

  // Toggle card expansion
  const toggleMemberExpand = (id: string) => {
    setExpandedMemberIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set(team.map((m) => m.role));
    return Array.from(rolesSet);
  }, [team]);

  // Compute daily metrics across all team members for selected date
  const summaryMetrics = useMemo(() => {
    const totalMembers = team.length;
    
    // Attendance records for selected date
    const dateAttendance = attendance.filter((a) => a.date === selectedDate);
    
    const loggedInCount = team.filter((m) => {
      if (m.workStatus && m.workStatus !== 'CLOCKED_OUT') return true;
      const att = dateAttendance.find((a) => a.teamMemberId === m.id || a.teamMemberName?.toLowerCase() === m.name.toLowerCase());
      return att && att.inTime && (!att.outTime || att.outTime === 'Active');
    }).length;

    // Tasks completed & pending
    let completedTasksCount = 0;
    let pendingTasksCount = 0;
    let membersWithPendingCount = 0;

    team.forEach((m) => {
      const memberTasks = tasks.filter((t) => t.assignedToId === m.id || t.assignedToName?.toLowerCase() === m.name.toLowerCase());
      const comp = memberTasks.filter((t) => t.status === 'completed');
      const pend = memberTasks.filter((t) => t.status !== 'completed');
      
      completedTasksCount += comp.length;
      pendingTasksCount += pend.length;
      if (pend.length > 0) membersWithPendingCount++;
    });

    return {
      totalMembers,
      loggedInCount,
      completedTasksCount,
      pendingTasksCount,
      membersWithPendingCount,
    };
  }, [team, attendance, tasks, selectedDate]);

  // Filter team members according to search & status filters
  const filteredTeamMembers = useMemo(() => {
    return team.filter((m) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = m.name.toLowerCase().includes(q);
        const roleMatch = m.role.toLowerCase().includes(q);
        const emailMatch = (m.email || '').toLowerCase().includes(q);
        if (!nameMatch && !roleMatch && !emailMatch) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && m.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'logged_in') {
        const isLoggedIn = m.workStatus && m.workStatus !== 'CLOCKED_OUT';
        const dateAtt = attendance.find((a) => a.date === selectedDate && (a.teamMemberId === m.id || a.teamMemberName?.toLowerCase() === m.name.toLowerCase()));
        const isAttIn = dateAtt && dateAtt.inTime && !dateAtt.outTime;
        if (!isLoggedIn && !isAttIn) return false;
      } else if (statusFilter === 'logged_out') {
        const isLoggedIn = m.workStatus && m.workStatus !== 'CLOCKED_OUT';
        if (isLoggedIn) return false;
      } else if (statusFilter === 'has_pending') {
        const memberTasks = tasks.filter((t) => t.assignedToId === m.id || t.assignedToName?.toLowerCase() === m.name.toLowerCase());
        const pending = memberTasks.filter((t) => t.status !== 'completed');
        if (pending.length === 0) return false;
      }

      return true;
    });
  }, [team, searchQuery, roleFilter, statusFilter, attendance, selectedDate, tasks]);

  // Handle open add task form
  const handleOpenAssignTask = (member: TeamMember) => {
    setAssigningTaskMember(member);
    setEditingTaskItem(null);
    setTaskTitleInput('');
    setTaskCategoryInput('management');
    setTaskDomainInput(`${BRAND.domain}`);
    setTaskProjectIdInput('');
    setTaskPriorityInput('high');
    setTaskDueDateInput(selectedDate);
    setTaskNotesInput('');
    setTaskBookingTargetInput('');
    setTaskTargetRevenueInput('');
    setTaskTargetLeadsCountInput('');
  };

  // Handle edit task
  const handleOpenEditTask = (task: TeamTask) => {
    const member = team.find((m) => m.id === task.assignedToId || m.name.toLowerCase() === task.assignedToName?.toLowerCase());
    if (member) {
      setAssigningTaskMember(member);
      setEditingTaskItem(task);
      setTaskTitleInput(task.title);
      setTaskCategoryInput(task.category || 'social_media');
      setTaskDomainInput(task.domainName || `${BRAND.domain}`);
      setTaskProjectIdInput(task.projectId || '');
      setTaskPriorityInput(task.priority || 'high');
      setTaskDueDateInput(task.dueDate || selectedDate);
      setTaskNotesInput(task.notes || '');
      setTaskBookingTargetInput(task.bookingTarget ? String(task.bookingTarget) : '');
      setTaskTargetRevenueInput(task.targetRevenue ? String(task.targetRevenue) : '');
      setTaskTargetLeadsCountInput(task.targetLeadsCount ? String(task.targetLeadsCount) : '');
    }
  };

  // Handle submit task form
  const handleSaveTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTaskMember || !taskTitleInput.trim()) return;

    const proj = projects.find((p) => p.id === taskProjectIdInput);

    const bTarget = taskBookingTargetInput ? Number(taskBookingTargetInput) : undefined;
    const tRevenue = taskTargetRevenueInput ? Number(taskTargetRevenueInput) : undefined;
    const tLeads = taskTargetLeadsCountInput ? Number(taskTargetLeadsCountInput) : undefined;

    if (editingTaskItem) {
      const updated: TeamTask = {
        ...editingTaskItem,
        title: taskTitleInput.trim(),
        assignedToId: assigningTaskMember.id,
        assignedToName: assigningTaskMember.name,
        assignedRole: assigningTaskMember.role,
        domainName: taskDomainInput.trim() || undefined,
        projectId: proj?.id,
        projectTitle: proj?.clientWeddingTitle,
        category: taskCategoryInput,
        dueDate: taskDueDateInput,
        priority: taskPriorityInput,
        notes: taskNotesInput.trim() || undefined,
        bookingTarget: bTarget,
        targetRevenue: tRevenue,
        targetLeadsCount: tLeads,
      };
      onUpdateTask?.(updated);
      setAssigningTaskMember(null);
      setEditingTaskItem(null);
      return;
    }

    const newTask: TeamTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: taskTitleInput.trim(),
      assignedToId: assigningTaskMember.id,
      assignedToName: assigningTaskMember.name,
      assignedRole: assigningTaskMember.role,
      domainName: taskDomainInput.trim() || undefined,
      projectId: proj?.id,
      projectTitle: proj?.clientWeddingTitle,
      category: taskCategoryInput,
      dueDate: taskDueDateInput,
      priority: taskPriorityInput,
      status: 'not_started',
      notes: taskNotesInput.trim() || undefined,
      bookingTarget: bTarget,
      targetRevenue: tRevenue,
      targetLeadsCount: tLeads,
    };

    onAddTask?.(newTask);
    setAssigningTaskMember(null);
    setTaskTitleInput('');
    setTaskNotesInput('');
    setTaskBookingTargetInput('');
    setTaskTargetRevenueInput('');
    setTaskTargetLeadsCountInput('');
  };

  return (
    <div className="space-y-5 rounded-2xl border border-[#e2d9d3] bg-white p-4 shadow-[0_8px_24px_rgba(48,44,46,.05)] sm:p-5">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#8f3655] text-xs font-black uppercase tracking-wider mb-0.5">
            <Sparkles className="w-4 h-4 text-[#8f3655]" />
            <span>Daily Member Activity & Reporting</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Team Work Status & Attendance Log
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor clock-in/out times, completed work, and pending tasks for every studio team member.
          </p>
        </div>

        {/* Date Filter & Preset Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#8f3655]" />
            <span className="text-xs font-bold text-slate-700 uppercase">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 focus:outline-[#8f3655] shadow-2xs cursor-pointer"
            />
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-[10px] font-bold text-[#8f3655] hover:underline px-1 bg-rose-50 rounded"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Team</p>
          <p className="text-lg font-black text-slate-900">{summaryMetrics.totalMembers}</p>
          <p className="text-[10px] text-slate-500">Active Roster</p>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-0.5">
          <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Clocked-In Today</p>
          <p className="text-lg font-black text-emerald-700">{summaryMetrics.loggedInCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Logged In & On Duty</p>
        </div>

        <div className="bg-green-50/80 p-3 rounded-xl border border-green-200 space-y-0.5">
          <p className="text-[10px] font-extrabold text-green-800 uppercase tracking-wider">Completed Tasks</p>
          <p className="text-lg font-black text-green-700">✓ {summaryMetrics.completedTasksCount}</p>
          <p className="text-[10px] text-green-600 font-medium">Finished Work Items</p>
        </div>

        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-0.5">
          <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">Pending Work</p>
          <p className="text-lg font-black text-amber-800">{summaryMetrics.pendingTasksCount}</p>
          <p className="text-[10px] text-amber-700 font-medium">In Progress / Pending</p>
        </div>

        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 space-y-0.5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-extrabold text-[#55333f] uppercase tracking-wider">Staff With Pending Work</p>
          <p className="text-lg font-black text-[#6d2f45]">{summaryMetrics.membersWithPendingCount} Members</p>
          <p className="text-[10px] text-[#8f3655] font-medium">Require Follow-up</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name or role..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-[#8f3655] shadow-2xs"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">All Members</option>
            <option value="logged_in">Currently Clocked In</option>
            <option value="has_pending">Has Pending Tasks</option>
            <option value="logged_out">Logged Out / Off Duty</option>
          </select>
        </div>

      </div>

      {/* Main Team Members Daily Report Cards */}
      <div className="space-y-4">
        {filteredTeamMembers.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No team members found matching filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting "All Members".</p>
          </div>
        ) : (
          filteredTeamMembers.map((member) => {
            // Member specific tasks
            const memberTasks = tasks.filter(
              (t) => t.assignedToId === member.id || (t.assignedToName && t.assignedToName.toLowerCase().trim() === member.name.toLowerCase().trim())
            );

            const completedTasks = memberTasks.filter((t) => t.status === 'completed');
            const pendingTasks = memberTasks.filter((t) => t.status !== 'completed');

            // Member specific attendance for selected date
            const dateAtt = attendance.find(
              (a) => a.date === selectedDate && (a.teamMemberId === member.id || (a.teamMemberName && a.teamMemberName.toLowerCase().trim() === member.name.toLowerCase().trim()))
            );

            // Login / Clock-in details
            const inTime = dateAtt?.inTime || member.inTime || 'Not Logged In';
            const outTime = dateAtt?.outTime || (member.workStatus === 'CLOCKED_OUT' ? member.outTime || '7:00 PM' : 'Shift Active');
            const workStatus = member.workStatus || (dateAtt ? 'EDITING' : 'CLOCKED_OUT');

            const isExpanded = expandedMemberIds[member.id] !== false; // Default expanded

            return (
              <div 
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-rose-300 transition shadow-2xs overflow-hidden"
              >
                {/* Member Header Banner */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8f3655] text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900">{member.name}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-100 text-[#6d2f45] border border-rose-200 uppercase tracking-wide">
                          {member.role}
                        </span>

                        {/* Clock-in / Work Status Pill */}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 ${
                          workStatus === 'EDITING' || workStatus === 'ON_BREAK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                            : workStatus === 'IDLE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${workStatus === 'EDITING' ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`} />
                          {workStatus === 'EDITING' ? 'Clocked In & Working' : workStatus === 'IDLE' ? 'Idle' : 'Clocked Out'}
                        </span>

                        {/* Software status if available */}
                        {member.currentSoftware && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 rounded flex items-center gap-1">
                            <Monitor className="w-3 h-3 text-[#9b4865]" />
                            {member.currentSoftware}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          In: <strong className="text-slate-800">{inTime}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          Out: <strong className="text-slate-800">{outTime}</strong>
                        </span>
                        {member.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenAssignTask(member)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#8f3655] hover:bg-[#6d2f45] text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      title="Assign new task to this member"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Task</span>
                    </button>

                    {onOpenMemberModal && (
                      <button
                        type="button"
                        onClick={() => onOpenMemberModal(member)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        title="Open full member details & attendance history"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Profile</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleMemberExpand(member.id)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content: Work Done vs Pending Work Grid */}
                {isExpanded && (
                  <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* LEFT COLUMN: COMPLETED WORK */}
                    <div className="space-y-2.5 bg-green-50/40 p-3 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between border-b border-green-200 pb-2">
                        <span className="font-black text-green-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Work Done / Completed Tasks ({completedTasks.length})
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-green-200 text-green-900 rounded-full">
                          ✓ Done
                        </span>
                      </div>

                      {completedTasks.length === 0 ? (
                        <div className="p-3 text-center bg-white rounded-lg border border-slate-200 text-slate-400 italic text-[11px]">
                          No completed tasks logged for {member.name} yet today.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {completedTasks.map((task) => (
                            <div 
                              key={task.id} 
                              className="p-2.5 rounded-lg bg-white border border-green-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 text-green-600 font-black" />
                                    {task.title}
                                  </span>
                                  {task.domainName && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-50 text-[#6d2f45] border border-rose-200 rounded">
                                      {task.domainName}
                                    </span>
                                  )}
                                </div>
                                {task.notes && (
                                  <p className="text-[11px] text-slate-600 italic">"{task.notes}"</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <select
                                  value={task.status}
                                  onChange={(e) => onUpdateTask?.({ ...task, status: e.target.value as any })}
                                  className="bg-green-50 border border-green-300 rounded px-2 py-0.5 text-[10px] font-extrabold text-green-900 cursor-pointer"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="completed">✓ Completed</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1 text-slate-500 hover:text-[#8f3655] cursor-pointer"
                                  title="Edit Task"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: PENDING WORK */}
                    <div className="space-y-2.5 bg-amber-50/40 p-3 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Pending Work & Assigned Tasks ({pendingTasks.length})
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full">
                          Pending
                        </span>
                      </div>

                      {pendingTasks.length === 0 ? (
                        <div className="p-3 text-center bg-white rounded-lg border border-slate-200 text-emerald-700 font-semibold text-[11px]">
                          All tasks completed. No pending work for {member.name}.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pendingTasks.map((task) => (
                            <div 
                              key={task.id} 
                              className="p-2.5 rounded-lg bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs">{task.title}</span>
                                  <span className={`px-1.5 py-0.2 text-[9px] font-black rounded uppercase ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  {task.domainName && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-50 text-[#6d2f45] border border-rose-200 rounded">
                                      {task.domainName}
                                    </span>
                                  )}
                                </div>
                                {task.notes && (
                                  <p className="text-[11px] text-slate-600 italic">"{task.notes}"</p>
                                )}
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Due: {task.dueDate || 'Today'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <select
                                  value={task.status}
                                  onChange={(e) => onUpdateTask?.({ ...task, status: e.target.value as any })}
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold text-slate-800 cursor-pointer shadow-2xs"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="completed">✓ Completed</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-[#6d2f45] cursor-pointer"
                                  title="Edit Task Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                 {onDeleteTask && (
                                  <button
                                    type="button"
                                    onClick={() => setTaskToDelete(task)}
                                    className="p-1 rounded bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 cursor-pointer"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Assigning / Editing Task */}
      {assigningTaskMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#8f3655]" />
                <span>{editingTaskItem ? 'Edit Task' : `Assign New Task to ${assigningTaskMember.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAssigningTaskMember(null);
                  setEditingTaskItem(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Work Details *</label>
                <input
                  type="text"
                  required
                  value={taskTitleInput}
                  onChange={(e) => setTaskTitleInput(e.target.value)}
                  placeholder="e.g. Edit Haldi Teaser Reel, Website SEO, Lead Followup..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-[#8f3655]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={taskCategoryInput}
                  onChange={(e) => setTaskCategoryInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-[#8f3655] cursor-pointer"
                >
                  <option value="sales_target">Monthly Booking Target & Revenue Goal</option>
                  <option value="sales_lead">Sales & Client Followups</option>
                  <option value="social_media">Social Media & Reels</option>
                  <option value="editing_video">Video Editing</option>
                  <option value="editing_photo">Photo Editing</option>
                  <option value="management">Management & Support</option>
                </select>
              </div>

              {/* Sales Team Targets Section */}
              <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#38262d] flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#8f3655] shrink-0" />
                    <span>Sales Targets & Monthly Goals</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-[#6d2f45] bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Sales KPI Target
                  </span>
                </div>

                {/* Quick Target Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskBookingTargetInput('5');
                      setTaskTargetRevenueInput('500000');
                      setTaskTargetLeadsCountInput('25');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-[#6d2f45] border border-rose-200 cursor-pointer shadow-2xs transition"
                  >
                    5 Deals (₹5 Lakh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskTargetLeadsCountInput('20');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-[#6d2f45] border border-rose-200 cursor-pointer shadow-2xs transition"
                  >
                    20 Hot Lead Calls
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskBookingTargetInput('10');
                      setTaskTargetRevenueInput('1000000');
                      setTaskTargetLeadsCountInput('40');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-[#6d2f45] border border-rose-200 cursor-pointer shadow-2xs transition"
                  >
                    ₹10 Lakh Goal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-extrabold uppercase text-[#55333f] mb-1 leading-tight min-h-[28px] flex items-end">Monthly Booking Target</label>
                    <input
                      type="number"
                      value={taskBookingTargetInput}
                      onChange={(e) => setTaskBookingTargetInput(e.target.value)}
                      placeholder="e.g. 5 Deals"
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#38262d] focus:outline-[#8f3655]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-extrabold uppercase text-[#55333f] mb-1 leading-tight min-h-[28px] flex items-end">Target Revenue (₹)</label>
                    <input
                      type="number"
                      value={taskTargetRevenueInput}
                      onChange={(e) => setTaskTargetRevenueInput(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#38262d] focus:outline-[#8f3655]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-extrabold uppercase text-[#55333f] mb-1 leading-tight min-h-[28px] flex items-end">Calls / Leads Target</label>
                    <input
                      type="number"
                      value={taskTargetLeadsCountInput}
                      onChange={(e) => setTaskTargetLeadsCountInput(e.target.value)}
                      placeholder="e.g. 20 Calls"
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#38262d] focus:outline-[#8f3655]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriorityInput}
                    onChange={(e) => setTaskPriorityInput(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-[#8f3655] cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDateInput}
                    onChange={(e) => setTaskDueDateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-[#8f3655] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={taskNotesInput}
                  onChange={(e) => setTaskNotesInput(e.target.value)}
                  placeholder="Additional work notes or links..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-[#8f3655]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAssigningTaskMember(null);
                    setEditingTaskItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8f3655] hover:bg-[#6d2f45] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editingTaskItem ? 'Save Changes' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        itemTitle={taskToDelete?.title || 'Task'}
        message={`Are you sure you want to delete task "${taskToDelete?.title || ''}"?`}
        onConfirm={() => {
          if (taskToDelete && onDeleteTask) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
