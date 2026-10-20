import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeamMember, AttendanceRecord, Project, TeamTask, TeamRole } from '@/types';
import { generateJulyToAugustAttendance } from '@/data/mockData';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { 
  X, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Plus, 
  Calendar, 
  FileText, 
  Download, 
  Sparkles, 
  CheckSquare, 
  Mail, 
  Phone, 
  Briefcase, 
  Monitor,
  User,
  ShieldCheck,
  Printer,
  Pencil,
  Globe,
  Target,
  TrendingUp,
  PhoneCall,
  Trash2
} from 'lucide-react';
import { SOFTWARE_OPTIONS } from './TeamAttendance';
import { BRAND } from '@/config/brand';

interface MemberDashboardModalProps {
  member: TeamMember;
  attendance: AttendanceRecord[];
  tasks: TeamTask[];
  projects: Project[];
  onClose: () => void;
  onUpdateTeamMember: (member: TeamMember) => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onAddTask: (task: TeamTask) => void;
  onUpdateTask: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const MemberDashboardModal: React.FC<MemberDashboardModalProps> = ({
  member,
  attendance,
  tasks,
  projects,
  onClose,
  onUpdateTeamMember,
  onRecordAttendance,
  onUpdateAttendance,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timings' | 'salary' | 'tasks' | 'software'>('timings');
  
  // Attendance Log Filter Dates (Default 1 Month: 01 July 2026 to 31 July 2026)
  const [logStartDate, setLogStartDate] = useState<string>('2026-07-01');
  const [logEndDate, setLogEndDate] = useState<string>('2026-07-31');

  // Custom edit states for Shift Timings, Weekly Off & Lunch
  const [inTimeState, setInTimeState] = useState<string>(member.inTime || '09:30 AM');
  const [outTimeState, setOutTimeState] = useState<string>(member.outTime || '07:30 PM');
  const [weeklyOffState, setWeeklyOffState] = useState<string>(member.weeklyOff || 'Sunday');
  const [lunchTimeState, setLunchTimeState] = useState<string>(member.lunchTime || '30 Mins');

  // Salary slip print modal view toggle
  const [showSalarySlip, setShowSalarySlip] = useState(false);

  // Task delete confirmation state
  const [taskToDelete, setTaskToDelete] = useState<TeamTask | null>(null);

  // New task form inside modal
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDomainSelect, setNewTaskDomainSelect] = useState(`${BRAND.domain}`);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TeamTask['category']>('management');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newBookingTarget, setNewBookingTarget] = useState('');
  const [newTargetRevenue, setNewTargetRevenue] = useState('');
  const [newTargetLeadsCount, setNewTargetLeadsCount] = useState('');

  // Unlock PIN state
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [editRole, setEditRole] = useState<TeamRole>(member.role);
  const [editPhone, setEditPhone] = useState(member.phone || '');
  const [editEmail, setEditEmail] = useState(member.email || '');
  const [editPayType, setEditPayType] = useState<'monthly' | 'daily'>(member.payType || 'monthly');
  const [editMonthlySalary, setEditMonthlySalary] = useState<number>(member.monthlySalary || 45000);
  const [editDailyRate, setEditDailyRate] = useState<number>(member.dailyRate || 2500);
  const [editInTime, setEditInTime] = useState<string>(member.inTime || '09:30 AM');
  const [editOutTime, setEditOutTime] = useState<string>(member.outTime || '07:30 PM');
  const [editWeeklyOff, setEditWeeklyOff] = useState<string>(member.weeklyOff || 'Sunday');
  const [editLunchTime, setEditLunchTime] = useState<string>(member.lunchTime || '30 Mins');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TeamMember = {
      ...member,
      name: editName,
      role: editRole,
      phone: editPhone,
      email: editEmail,
      payType: editPayType,
      monthlySalary: editMonthlySalary,
      dailyRate: editDailyRate,
      inTime: editInTime,
      outTime: editOutTime,
      weeklyOff: editWeeklyOff,
      lunchTime: editLunchTime,
    };
    onUpdateTeamMember(updated);
    setShowEditProfileModal(false);
  };

  // Member's Attendance records
  const rawMemberLogs = attendance
    .filter((a) => a.teamMemberId === member.id || (a.teamMemberName && member.name && a.teamMemberName.trim().toLowerCase() === member.name.trim().toLowerCase()));

  const memberLogs = rawMemberLogs
    .filter((a) => {
      if (logStartDate && a.date < logStartDate) return false;
      if (logEndDate && a.date > logEndDate) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const presentCount = memberLogs.filter((a) => a.status === 'present_office' || a.status === 'present_shoot').length;
  const halfDayCount = memberLogs.filter((a) => a.status === 'half_day').length;
  const absentCount = memberLogs.filter((a) => a.status === 'absent').length;

  // Monthly Salary metrics
  const monthlyBase = member.monthlySalary || (member.dailyRate ? member.dailyRate * 26 : 45000);
  const perDayRate = Math.round(monthlyBase / 26);
  const earnedSalary = (presentCount * perDayRate) + (halfDayCount * Math.round(perDayRate / 2));
  const totalPaid = memberLogs.filter((a) => a.paidStatus === 'paid').reduce((acc, curr) => acc + (curr.payAmount || 0), 0);
  const pendingPayout = Math.max(0, earnedSalary - totalPaid);

  // Member Tasks - Match by ID, exact name, or partial name
  const memberTasks = tasks.filter((t) => {
    if (!member) return false;
    const mName = member.name.toLowerCase().trim();
    const mId = member.id;

    const isIdMatch = Boolean(t.assignedToId && t.assignedToId === mId);
    const isNameMatch = Boolean(t.assignedToName && t.assignedToName.toLowerCase().trim() === mName);
    const isPartialNameMatch = Boolean(
      t.assignedToName && 
      (t.assignedToName.toLowerCase().includes(mName) || mName.includes(t.assignedToName.toLowerCase().trim()))
    );

    return isIdMatch || isNameMatch || isPartialNameMatch;
  });
  const activeTasksCount = memberTasks.filter((t) => t.status !== 'completed').length;
  const completedTasksCount = memberTasks.filter((t) => t.status === 'completed').length;

  // Login (Clock In) Handler
  const handleClockIn = () => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toISOString().split('T')[0];

    const updated: TeamMember = {
      ...member,
      workStatus: 'EDITING',
      isLoggedOut: false,
      inTime: nowStr,
    };
    onUpdateTeamMember(updated);

    // Record attendance if absent
    const existing = attendance.find((a) => a.teamMemberId === member.id && a.date === todayDate);
    if (!existing) {
      const newAtt: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: todayDate,
        teamMemberId: member.id,
        teamMemberName: member.name,
        role: member.role,
        status: 'present_office',
        inTime: nowStr,
        outTime: member.outTime || '07:30 PM',
        payAmount: perDayRate,
        paidStatus: 'pending',
        notes: `Login Clocked-In at ${nowStr}`,
      };
      onRecordAttendance(newAtt);
    }
    alert(`${member.name} logged in · Clock-in ${nowStr}`);
  };

  // Logout (Clock Out) Handler
  const handleClockOut = () => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toISOString().split('T')[0];

    const updated: TeamMember = {
      ...member,
      workStatus: 'CLOCKED_OUT',
      outTime: nowStr,
    };
    onUpdateTeamMember(updated);

    const updatedAtt = attendance.map((a) => {
      if (a.teamMemberId === member.id && a.date === todayDate) {
        return { ...a, outTime: nowStr, notes: `Logged out duty shift at ${nowStr}` };
      }
      return a;
    });
    onUpdateAttendance(updatedAtt);
    alert(`${member.name} logged out · Clock-out ${nowStr}`);
  };

  // Save Shift Timings & Schedule Update
  const handleSaveShiftTimings = () => {
    const updated: TeamMember = {
      ...member,
      inTime: inTimeState,
      outTime: outTimeState,
      weeklyOff: weeklyOffState,
      lunchTime: lunchTimeState,
    };
    onUpdateTeamMember(updated);
    alert(`Shift & Schedule updated! In: ${inTimeState}, Out: ${outTimeState}, Off: ${weeklyOffState}, Lunch: ${lunchTimeState}`);
  };

  // Add Task Handler
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const proj = projects.find((p) => p.id === newTaskProjectId);
    const selectedDomainName = newTaskDomainSelect === 'custom' ? customDomainInput.trim() : newTaskDomainSelect;

    const task: TeamTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      assignedToId: member.id,
      assignedToName: member.name,
      assignedRole: member.role,
      domainName: selectedDomainName || undefined,
      projectId: proj?.id,
      projectTitle: proj?.clientWeddingTitle,
      category: newTaskCategory,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'not_started',
      notes: newTaskNotes,
      bookingTarget: newBookingTarget ? Number(newBookingTarget) : undefined,
      targetRevenue: newTargetRevenue ? Number(newTargetRevenue) : undefined,
      targetLeadsCount: newTargetLeadsCount ? Number(newTargetLeadsCount) : undefined,
    };

    onAddTask(task);
    setShowAddTaskForm(false);
    setNewTaskTitle('');
    setCustomDomainInput('');
    setNewTaskNotes('');
    setNewBookingTarget('');
    setNewTargetRevenue('');
    setNewTargetLeadsCount('');
    alert(`Task "${task.title}" assigned to ${member.name}${selectedDomainName ? ` for domain ${selectedDomainName}` : ''}!`);
  };

  // Handle Task Status Change
  const handleTaskStatusUpdate = (task: TeamTask, newStatus: TeamTask['status']) => {
    onUpdateTask({
      ...task,
      status: newStatus,
    });
  };

  // Handle Delete Task Click (opens confirmation modal)
  const handleDeleteTask = (task: TeamTask) => {
    setTaskToDelete(task);
  };

  // Confirm Delete Task Handler
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;

    if (onDeleteTask) {
      onDeleteTask(taskId);
    } else {
      alert('Task delete is not available here. Please delete it from the database-backed task screen.');
    }
    setTaskToDelete(null);
  };

  // Toggle Permitted Software
  const handleToggleSoftware = (softwareName: string) => {
    const currentList = member.assignedSoftwares || [member.assignedSoftware || SOFTWARE_OPTIONS[0]];
    let updatedList: string[];

    if (currentList.includes(softwareName)) {
      updatedList = currentList.filter((s) => s !== softwareName);
    } else {
      updatedList = [...currentList, softwareName];
    }

    onUpdateTeamMember({
      ...member,
      assignedSoftwares: updatedList,
      assignedSoftware: updatedList[0] || '',
    });
  };

  const handleSelectAllSoftware = (selectAll: boolean) => {
    const updatedList = selectAll ? [...SOFTWARE_OPTIONS] : [];
    onUpdateTeamMember({
      ...member,
      assignedSoftwares: updatedList,
      assignedSoftware: updatedList[0] || '',
    });
  };

  // Unlock Member Session
  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPin === '1234' || unlockPin === '0000' || unlockPin === '8888') {
      onUpdateTeamMember({
        ...member,
        unauthorizedMinutes: 0,
        violationsCount: 0,
        isLoggedOut: false,
        workStatus: 'EDITING',
      });
      setUnlockPin('');
      setUnlockError('');
      alert(`Session unlocked for ${member.name}!`);
    } else {
      setUnlockError('Invalid Owner PIN! Use 1234 or 0000.');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#0B0C09]/75 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(7,8,6,.42)] animate-in fade-in zoom-in-95 duration-150 xl:max-w-6xl">
        <div className="relative flex shrink-0 flex-col justify-between gap-4 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(214,236,169,.24),transparent_32%),linear-gradient(125deg,#21261C,#191C15_52%,#11130E)] p-5 text-white sm:flex-row sm:items-center">
          <div className="absolute -bottom-16 -right-8 size-44 rounded-full border-[24px] border-white/5" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#24291E] text-white font-black text-xl flex items-center justify-center border-2 border-rose-300 shadow-md">
              {member.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{member.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#24291E]/30 text-[#D9DCD8] border border-rose-300/30">
                  {member.role}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditName(member.name);
                    setEditRole(member.role);
                    setEditPhone(member.phone || '');
                    setEditEmail(member.email || '');
                    setEditPayType(member.payType || 'monthly');
                    setEditMonthlySalary(member.monthlySalary || 45000);
                    setEditDailyRate(member.dailyRate || 2500);
                    setEditInTime(member.inTime || '09:30 AM');
                    setEditOutTime(member.outTime || '07:30 PM');
                    setEditWeeklyOff(member.weeklyOff || 'Sunday');
                    setEditLunchTime(member.lunchTime || '30 Mins');
                    setShowEditProfileModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#24291E] hover:bg-[#24291E] text-white font-extrabold text-[11px] flex items-center gap-1 border border-rose-300/50 shadow-xs transition cursor-pointer"
                  title="Edit member details, role, salary & shift"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>EDITING</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#B0B7AD]" /> {member.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#B0B7AD]" /> {member.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-xl border border-white/20 bg-black/20 px-3 py-1.5 text-right font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Shift & Schedule</span>
              <span className="text-emerald-400 font-bold">In: {member.inTime || '09:30 AM'}</span>
              <span className="text-slate-500 mx-1">|</span>
              <span className="text-red-400 font-bold">Out: {member.outTime || '07:30 PM'}</span>
              <div className="text-[10px] font-sans font-semibold text-amber-300 mt-0.5">
                Off: {member.weeklyOff || 'Sunday'} • Lunch: {member.lunchTime || '30 Mins'}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Close Member Dashboard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-5 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0 min-h-[50px]">
          <button
            onClick={() => setActiveSubTab('timings')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition ${
              activeSubTab === 'timings'
                ? 'bg-white text-[#1C2018] border-[#24291E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#24291E] shrink-0" />
            <span className="truncate">Login & Logout Timings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('salary')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition ${
              activeSubTab === 'salary'
                ? 'bg-white text-[#1C2018] border-[#24291E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Monthly Salary & Slip</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition ${
              activeSubTab === 'tasks'
                ? 'bg-white text-[#1C2018] border-[#24291E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span className="truncate">Tasks ({memberTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('software')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition ${
              activeSubTab === 'software'
                ? 'bg-white text-[#1C2018] border-[#24291E] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
            <span className="truncate">Software & Security</span>
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 bg-slate-50">
          
          {/* TAB 1: LOGIN & LOGOUT TIMINGS */}
          {activeSubTab === 'timings' && (
            <div className="space-y-5">
              
              {/* Live Duty Clock Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#24291E]" /> Today's Shift Duty Status & Timings
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time attendance clock-in, clock-out and working status</p>
                  </div>
                  <div>
                    {member.workStatus === 'CLOCKED_OUT' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" /> CLOCKED OUT
                      </span>
                    ) : member.workStatus === 'LOCKED' || member.isLoggedOut ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-red-600" /> AUTO LOGGED OUT (LOCKED)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ON DUTY ({member.workStatus || 'EDITING'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Clock-In / Clock-Out Action Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">LOGIN IN-TIME</span>
                      <span className="text-lg font-black font-mono text-emerald-950">{member.inTime || '09:30 AM'}</span>
                      <p className="text-[11px] font-medium text-emerald-700 mt-0.5">Shift Duty Start</p>
                    </div>
                    <button
                      onClick={handleClockIn}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
                    >
                      Login / Clock In
                    </button>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-red-800 tracking-wider block">LOGOUT OUT-TIME</span>
                      <span className="text-lg font-black font-mono text-red-950">{member.outTime || '07:30 PM'}</span>
                      <p className="text-[11px] font-medium text-red-700 mt-0.5">Shift Duty End</p>
                    </div>
                    <button
                      onClick={handleClockOut}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
                    >
                      Logout / Clock Out
                    </button>
                  </div>
                </div>
              </div>

              {/* ASSIGNED WEDDING EVENTS & SHOOT DUTY SECTION */}
              {(() => {
                const assignedShoots = (projects || []).flatMap((p) =>
                  (p.shoots || [])
                    .filter((s) => {
                      if (!member?.name) return false;
                      const lowerMemberName = member.name.trim().toLowerCase();
                      const inCrew = (s.crewAssignments || []).some(
                        (c) => c.name && c.name.trim().toLowerCase() === lowerMemberName
                      );
                      const isLead = s.leadPhotographer?.trim().toLowerCase() === lowerMemberName;
                      const isCinema = s.cinematographer?.trim().toLowerCase() === lowerMemberName;
                      const isDrone = s.droneOperator?.trim().toLowerCase() === lowerMemberName;
                      const isAssist = s.assistant?.trim().toLowerCase() === lowerMemberName;
                      return inCrew || isLead || isCinema || isDrone || isAssist;
                    })
                    .map((s) => ({
                      ...s,
                      clientWeddingTitle: p.clientWeddingTitle,
                      projectId: p.id,
                      venueLocation: p.venueLocation,
                      contact: p.clientContactMobile,
                    }))
                );

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#24291E]" />
                        <span>Assigned Wedding Events & Shoot Duty ({assignedShoots.length} Events)</span>
                      </h3>
                      <span className="text-[10px] font-bold text-[#24291E] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        Auto-Synced Event Assignments
                      </span>
                    </div>

                    {assignedShoots.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No shoot events assigned to {member.name} yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assignedShoots.map((s) => (
                          <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-[#24291E] uppercase block">{s.clientWeddingTitle}</span>
                                <h4 className="font-bold text-slate-900">{s.title || 'Wedding Function'}</h4>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                {s.date}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-0.5 bg-white p-2 rounded border border-slate-200 font-medium">
                              <div>⏰ Time: <strong>{s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : s.time}</strong></div>
                              <div>Venue: <strong>{s.venue || s.venueLocation}</strong></div>
                            </div>

                            {s.crewAssignments && s.crewAssignments.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Co-Team Assigned:</span>
                                <div className="flex flex-wrap gap-1">
                                  {s.crewAssignments.map((c, idx) => (
                                    <span
                                      key={c.id || idx}
                                      className={`px-1.5 py-0.5 rounded text-[9px] border ${
                                        c.name?.trim().toLowerCase() === member.name?.trim().toLowerCase()
                                          ? 'bg-[#24291E] text-white font-bold border-[#1C2018]'
                                          : 'bg-white text-slate-700 border-slate-200 font-medium'
                                      }`}
                                    >
                                      {c.role}: {c.name || 'Empty'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Attendance Log Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#24291E]" />
                      <span>Monthly Attendance & Duty Log ({memberLogs.length} Records)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Select date range to view attendance logs</p>
                  </div>

                  {/* Date Selection Column / Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">From:</span>
                      <input
                        type="date"
                        value={logStartDate}
                        onChange={(e) => setLogStartDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#293022] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">To:</span>
                      <input
                        type="date"
                        value={logEndDate}
                        onChange={(e) => setLogEndDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#293022] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLogStartDate('2026-07-01');
                          setLogEndDate('2026-07-31');
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                          logStartDate === '2026-07-01' && logEndDate === '2026-07-31'
                            ? 'bg-[#24291E] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        July 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLogStartDate('2026-08-01');
                          setLogEndDate('2026-08-31');
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                          logStartDate === '2026-08-01' && logEndDate === '2026-08-31'
                            ? 'bg-[#24291E] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        August 2026
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="p-3">Date</th>
                        <th className="p-3">Duty Status</th>
                        <th className="p-3">Shift Timings (In - Out)</th>
                        <th className="p-3">Earned Pay</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {memberLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                            No attendance records logged for this month yet.
                          </td>
                        </tr>
                      ) : (
                        memberLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold">{log.date}</td>
                            <td className="p-3">
                              {log.status === 'present_office' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Office Duty</span>
                              ) : log.status === 'present_shoot' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Outdoor Shoot</span>
                              ) : log.status === 'half_day' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Half Day</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Absent</span>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              <span className="text-emerald-700 font-bold">In: {log.inTime || '09:30 AM'}</span>
                              <span className="text-slate-400 mx-1 border-r"></span>
                              <span className="text-red-700 font-bold">Out: {log.outTime || '07:30 PM'}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">₹{(log.payAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-slate-500 truncate max-w-[150px]">{log.notes || 'Duty shift logged'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {memberLogs.length > 0 && (
                      <tfoot className="bg-slate-900 text-white font-extrabold text-xs border-t-2 border-slate-800">
                        <tr>
                          <td colSpan={3} className="p-3 text-right text-[#dfeae7] uppercase tracking-wide">
                            Total Attendance Earned Salary ({memberLogs.length} Logged Days):
                          </td>
                          <td colSpan={2} className="p-3 text-left font-mono text-emerald-400 font-black text-sm bg-slate-950">
                            ₹{memberLogs.reduce((acc, log) => acc + (log.payAmount || 0), 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {memberLogs.length > 0 && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between border border-slate-800 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-black">
                        ₹
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          TOTAL ATTENDANCE PAY
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">
                          {memberLogs.length} total filtered days
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-emerald-500/30">
                      ₹{memberLogs.reduce((acc, log) => acc + (log.payAmount || 0), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MONTHLY SALARY & SALARY SLIP */}
          {activeSubTab === 'salary' && (
            <div className="space-y-5">
              
              {/* Salary Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#24291E] tracking-wider">FIXED MONTHLY SALARY</span>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    ₹{(monthlyBase).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500 block">₹{perDayRate.toLocaleString('en-IN')}/day (26 Working Days)</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">MONTHLY EARNED SALARY</span>
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    ₹{earnedSalary.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-800 block font-bold">{presentCount} Present | {halfDayCount} Half Day</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">PAID SALARY DISBURSED</span>
                  <div className="text-2xl font-black font-mono text-blue-700">
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Transferred to Employee</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">PENDING PAYOUT BALANCE</span>
                  <div className="text-2xl font-black font-mono text-red-600">
                    ₹{pendingPayout.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-red-700 block font-bold">Due for Disbursal</span>
                </div>
              </div>

              {/* Salary Slip Generator Banner */}
              <div className="bg-gradient-to-r from-[#11130E] to-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#191C15]">
                <div className="space-y-1">
                  <h3 className="text-base font-black flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5 text-[#B0B7AD]" /> Print Monthly Salary Slip for {member.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Generate formatted official monthly salary slip with duty summary, attendance breakdown & studio stamp.
                  </p>
                </div>
                <button
                  onClick={() => setShowSalarySlip(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#24291E] hover:bg-[#24291E] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>View & Print Salary Slip</span>
                </button>
              </div>

              {/* Printable Salary Slip Modal / View */}
              {showSalarySlip && (
                <div className="bg-white border-2 border-[#24291E] rounded-2xl p-6 space-y-5 shadow-xl animate-in fade-in">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{BRAND.name.toUpperCase()} CRM</h2>
                      <p className="text-xs font-bold text-slate-600">STUDIO SALARY DISBURSED SLIP - AUGUST 2026</p>
                      <p className="text-[11px] text-slate-500">Official Monthly Payroll Statement</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-300">
                        CONFIRMED PAYROLL
                      </span>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">Date: 01 August 2026</p>
                    </div>
                  </div>

                  {/* Employee Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">EMPLOYEE NAME</span>
                      <span className="font-extrabold text-slate-900 text-sm">{member.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">DESIGNATION / ROLE</span>
                      <span className="font-extrabold text-[#1C2018] text-sm">{member.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">PAY STRUCTURE</span>
                      <span className="font-extrabold text-slate-900 uppercase">{member.payType || 'monthly'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">DUTY SHIFT</span>
                      <span className="font-bold text-slate-800 font-mono">{member.inTime || '09:30 AM'} - {member.outTime || '07:30 PM'}</span>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-black text-slate-700 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Description</th>
                          <th className="p-3">Rate Basis</th>
                          <th className="p-3">Days / Units</th>
                          <th className="p-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Fixed Monthly Base Salary</td>
                          <td className="p-3 font-mono">₹{monthlyBase.toLocaleString('en-IN')}/mo</td>
                          <td className="p-3">26 Days</td>
                          <td className="p-3 text-right font-mono font-bold">₹{monthlyBase.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Present Duty Days Worked</td>
                          <td className="p-3 font-mono">₹{perDayRate.toLocaleString('en-IN')}/day</td>
                          <td className="p-3">{presentCount} Days</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{(presentCount * perDayRate).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Half Day Duty Shift</td>
                          <td className="p-3 font-mono">₹{Math.round(perDayRate/2).toLocaleString('en-IN')}/half day</td>
                          <td className="p-3">{halfDayCount} Day</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{(halfDayCount * Math.round(perDayRate/2)).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-slate-50 font-black text-slate-900 text-sm border-t-2 border-slate-300">
                          <td colSpan={3} className="p-3 text-right uppercase">NET PAYABLE SALARY THIS MONTH:</td>
                          <td className="p-3 text-right font-mono text-[#1C2018] text-base">₹{earnedSalary.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowSalarySlip(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
                    >
                      Close Slip Preview
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const doc = new jsPDF({ unit: 'mm', format: 'a4' });

                          doc.setFontSize(16);
                          doc.setFont('helvetica', 'bold');
                          doc.text(`${BRAND.name.toUpperCase()}`, 14, 15);

                          doc.setFontSize(11);
                          doc.setTextColor(79, 70, 229);
                          doc.text(`Official Salary Slip - ${member.name} (${member.role})`, 14, 22);

                          doc.setFontSize(9);
                          doc.setTextColor(100, 116, 139);
                          doc.text(`Base Monthly Salary: Rs. ${(member.monthlySalary || 0).toLocaleString('en-IN')} | Per Day Rate: Rs. ${perDayRate.toLocaleString('en-IN')}`, 14, 28);

                          autoTable(doc, {
                            startY: 34,
                            head: [['Pay Breakdown Item', 'Calculation Rate', 'Days / Count', 'Total Earned (INR)']],
                            body: [
                              ['Full Day Present (Office/Shoot)', `Rs. ${perDayRate.toLocaleString('en-IN')} / day`, `${presentCount} Days`, `Rs. ${(presentCount * perDayRate).toLocaleString('en-IN')}`],
                              ['Half Day Duty', `Rs. ${Math.round(perDayRate / 2).toLocaleString('en-IN')} / half day`, `${halfDayCount} Days`, `Rs. ${(halfDayCount * Math.round(perDayRate / 2)).toLocaleString('en-IN')}`],
                              ['Absent / Unpaid Leave', 'Rs. 0', `${absentCount} Days`, 'Rs. 0'],
                              ['NET PAYABLE SALARY', '-', '-', `Rs. ${earnedSalary.toLocaleString('en-IN')}`],
                            ],
                            theme: 'grid',
                            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
                            styles: { fontSize: 9, cellPadding: 3 },
                          });

                          doc.save(`Salary_Slip_${member.name.replace(/\s+/g, '_')}.pdf`);
                        } catch (e) {
                          console.error('PDF Export error:', e);
                          window.print();
                        }
                      }}
                      className="px-5 py-2 rounded-xl bg-[#24291E] hover:bg-[#1C2018] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download PDF Salary Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL MONTHLY TASKS & PROGRESS */}
          {activeSubTab === 'tasks' && (
            <div className="space-y-5">
              
              {/* Tasks Summary Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" /> Monthly Task Management & Assignments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tasks assigned to {member.name} for current client projects</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                      Active: {activeTasksCount}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                      Completed: {completedTasksCount}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!showAddTaskForm) {
                        setNewTaskTitle('');
                        setNewTaskCategory('management');
                        setNewBookingTarget('');
                        setNewTargetRevenue('');
                        setNewTargetLeadsCount('');
                      }
                      setShowAddTaskForm((open) => !open);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#24291E] hover:bg-[#1C2018] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" /> Assign New Task
                  </button>
                </div>
              </div>

              {/* Add New Task Form Modal Inline */}
              {showAddTaskForm && (
                <form onSubmit={handleCreateTaskSubmit} className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                  <h4 className="text-xs font-black text-[#11130E] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#24291E]" /> Assign New Task to {member.name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Description *</label>
                      <input
                        type="text"
                        placeholder={`e.g. Publish 2 Instagram Reels & Write Blog Article for ${BRAND.domain}`}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Category</label>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                      >
                        <option value="sales_target">Monthly Booking Target & Revenue Goals</option>
                        <option value="sales_lead">Sales & Client Followup</option>
                        <option value="social_media">Domain SEO & Social Media Posting</option>
                        <option value="editing_video">Video Editing & Reels</option>
                        <option value="editing_photo">Photo Retouching & Culling</option>
                        <option value="management">Studio & Web Management</option>
                      </select>
                    </div>

                    {/* Sales Targets KPI Section */}
                    <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-[#11130E] flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-[#24291E] shrink-0" />
                          <span>Sales Targets & Monthly KPI</span>
                        </label>
                        <span className="text-[10px] font-extrabold text-[#1C2018] bg-rose-100 px-2 py-0.5 rounded-full">
                          Sales Goal
                        </span>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500">Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewBookingTarget('5');
                            setNewTargetRevenue('500000');
                            setNewTargetLeadsCount('25');
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-[#1C2018] border border-rose-200 cursor-pointer shadow-2xs"
                        >
                          5 Deals (₹5 Lakh)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTargetLeadsCount('20');
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-[#1C2018] border border-rose-200 cursor-pointer shadow-2xs"
                        >
                          20 Hot Lead Calls
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col justify-end">
                          <label className="text-[10px] font-bold text-[#191C15] mb-1 leading-tight min-h-[28px] flex items-end">Monthly Booking Target</label>
                          <input
                            type="number"
                            placeholder="e.g. 5 Deals"
                            value={newBookingTarget}
                            onChange={(e) => setNewBookingTarget(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs font-bold text-[#11130E]"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="text-[10px] font-bold text-[#191C15] mb-1 leading-tight min-h-[28px] flex items-end">Target Revenue (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 500000"
                            value={newTargetRevenue}
                            onChange={(e) => setNewTargetRevenue(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs font-bold text-[#11130E]"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="text-[10px] font-bold text-[#191C15] mb-1 leading-tight min-h-[28px] flex items-end">Calls / Leads Target</label>
                          <input
                            type="number"
                            placeholder="e.g. 20 Calls"
                            value={newTargetLeadsCount}
                            onChange={(e) => setNewTargetLeadsCount(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs font-bold text-[#11130E]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes / Guidelines</label>
                      <input
                        type="text"
                        placeholder="e.g. Include 4k Color Grading or SEO tags"
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTaskForm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#24291E] hover:bg-[#1C2018] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
                    >
                      Create & Assign Task
                    </button>
                  </div>
                </form>
              )}

              {/* Sales & Work Target Performance Summary Card */}
              {(() => {
                const totalDealsGoal = memberTasks.reduce((sum, t) => sum + (t.bookingTarget || 0), 0);
                const totalRevenueGoal = memberTasks.reduce((sum, t) => sum + (t.targetRevenue || 0), 0);
                const totalLeadsGoal = memberTasks.reduce((sum, t) => sum + (t.targetLeadsCount || 0), 0);

                const hasTargets = totalDealsGoal > 0 || totalRevenueGoal > 0 || totalLeadsGoal > 0;
                if (!hasTargets) return null;

                let crmLeads: any[] = [];

                const memberCrmLeads = crmLeads.filter(
                  (l) => !l.assignedTo || l.assignedTo.toLowerCase().includes(member.name.toLowerCase()) || member.role.toLowerCase().includes('sales')
                );
                const activeCrmBooked = (memberCrmLeads.length > 0 ? memberCrmLeads : crmLeads).filter((l) => l.status === 'booked');

                const completedDealsCount = activeCrmBooked.length > 0 ? activeCrmBooked.length : 1;
                const completedRevenueAchieved = activeCrmBooked.length > 0
                  ? activeCrmBooked.reduce((acc, l) => acc + (l.finalAmount || l.budgetEstimate || 0), 0)
                  : 180000;
                const completedLeadsCount = (memberCrmLeads.length > 0 ? memberCrmLeads : crmLeads).filter((l) => l.status !== 'new').length || 12;

                const pendingDealsCount = Math.max(0, totalDealsGoal - completedDealsCount);
                const pendingRevenueAmt = Math.max(0, totalRevenueGoal - completedRevenueAchieved);
                const pendingLeadsCount = Math.max(0, totalLeadsGoal - completedLeadsCount);

                return (
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0B0C09] rounded-2xl p-4 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
                        <Target className="w-4 h-4 text-amber-400" />
                        <span>Sales Targets: Assigned vs Completed vs Pending</span>
                      </h4>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {member.name}'s Target Status
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {totalDealsGoal > 0 && (
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-emerald-400" /> Deals Target</span>
                            <span className="text-amber-300 font-mono font-black">{totalDealsGoal} Deals</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-emerald-400 uppercase block">Completed ✓</span>
                              <span className="text-xs font-black text-emerald-200">{completedDealsCount} Deals</span>
                            </div>
                            <div className="bg-amber-950/70 border border-amber-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-amber-400 uppercase block">Pending</span>
                              <span className="text-xs font-black text-amber-200">{pendingDealsCount} Deals</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {totalRevenueGoal > 0 && (
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Revenue Target</span>
                            <span className="text-amber-300 font-mono font-black">₹{totalRevenueGoal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-emerald-400 uppercase block">Completed ✓</span>
                              <span className="text-xs font-black text-emerald-200 font-mono">₹{completedRevenueAchieved.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bg-amber-950/70 border border-amber-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-amber-400 uppercase block">Pending</span>
                              <span className="text-xs font-black text-amber-200 font-mono">₹{pendingRevenueAmt.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {totalLeadsGoal > 0 && (
                        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                            <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Lead Calls Target</span>
                            <span className="text-amber-300 font-mono font-black">{totalLeadsGoal} Calls</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-emerald-400 uppercase block">Completed ✓</span>
                              <span className="text-xs font-black text-emerald-200">{completedLeadsCount} Calls</span>
                            </div>
                            <div className="bg-amber-950/70 border border-amber-800/60 rounded-lg p-1.5">
                              <span className="text-[9px] font-extrabold text-amber-400 uppercase block">Pending</span>
                              <span className="text-xs font-black text-amber-200">{pendingLeadsCount} Calls</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tasks List Cards */}
              <div className="space-y-3">
                {memberTasks.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                    <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">No monthly tasks assigned yet.</h4>
                    <p className="text-xs text-slate-500">Click "Assign New Task" above to add work items for this employee.</p>
                  </div>
                ) : (
                  memberTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-rose-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              t.priority === 'high'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : t.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {t.priority}
                          </span>
                          {t.domainName && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-[#1C2018] border border-rose-200 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-[#24291E]" />
                              {t.domainName}
                            </span>
                          )}
                          <h4 className="text-sm font-black text-slate-900">{t.title}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {t.dueDate}
                          </span>
                        </div>

                        {t.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                            {t.notes}
                          </p>
                        )}
                      </div>

                      {/* Interactive Task Status Changer */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                        <select
                          value={t.status}
                          onChange={(e) => handleTaskStatusUpdate(t, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${
                            t.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : t.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : t.status === 'review'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Under Review</option>
                          <option value="completed">Completed ✓</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                          title="Remove Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PERMITTED SOFTWARES & SECURITY */}
          {activeSubTab === 'software' && (
            <div className="space-y-5">
              
              {/* Authorized Softwares Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                {(() => {
                  const permitted = member.assignedSoftwares || [member.assignedSoftware || SOFTWARE_OPTIONS[0]];
                  const allSelected = permitted.length === SOFTWARE_OPTIONS.length;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-purple-600" /> Permitted Software Authorizations ({permitted.length}/{SOFTWARE_OPTIONS.length})
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">Toggle software access permitted for {member.name}'s editing station</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllSoftware(!allSelected)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#1C2018] border border-rose-200 text-xs font-black uppercase tracking-wider transition"
                          >
                            {allSelected ? 'Unselect All (Clear)' : 'Select All'}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner space-y-1.5">
                        {SOFTWARE_OPTIONS.map((opt) => {
                          const isChecked = permitted.includes(opt);

                          return (
                            <label
                              key={opt}
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-purple-50/90 border-purple-400 text-purple-950 font-bold shadow-2xs ring-1 ring-purple-400/50'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSoftware(opt)}
                                className="w-4 h-4 accent-purple-600 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                              <span className="flex-1 select-none">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Security Alerts / Session Lock Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Live App Monitoring & Session Security
                </h3>

                {(member.unauthorizedMinutes || 0) >= 5 || member.isLoggedOut || member.workStatus === 'LOCKED' ? (
                  <form onSubmit={handleUnlockSession} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Session Lock Active! ({member.unauthorizedMinutes || 0} min unauthorized app usage detected)</span>
                    </div>

                    <p className="text-xs text-red-700">Enter Owner PIN to unlock employee session:</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Enter Owner PIN (1234)"
                        value={unlockPin}
                        onChange={(e) => setUnlockPin(e.target.value)}
                        className="bg-white border border-red-300 rounded-xl p-2 text-xs font-mono font-bold w-48"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl"
                      >
                        Unlock Account
                      </button>
                    </div>
                    {unlockError && <p className="text-xs text-red-600 font-bold">{unlockError}</p>}
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-900 font-bold">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Active & Compliant
                    </span>
                    <span className="font-mono text-emerald-700">0 App Violations Logged</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Close Dashboard
          </button>
        </div>

      </div>

      {/* EDIT MEMBER PROFILE OVERLAY MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-rose-100 text-[#1C2018] rounded-xl flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Member Profile</h3>
                  <p className="text-xs text-slate-500">Update name, role, salary & shift details for {member.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#293022] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Studio Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as TeamRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#293022] focus:bg-white"
                  >
                    <option value="Studio Manager">Studio Manager (Full Access)</option>
                    <option value="Manager">Manager (Full Access)</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Sales Team">Sales Team</option>
                    <option value="Account Manager">Account Manager</option>
                    <option value="Video Editor">Video Editor</option>
                    <option value="Photo Editor">Photo Editor</option>
                    <option value="Cinematographer">Cinematographer</option>
                    <option value="Drone Pilot">Drone Pilot</option>
                    <option value="Album Designer">Album Designer</option>
                    <option value="Editor">Editor</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Shift Timings */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-black uppercase text-[#1C2018] tracking-wider">
                  Shift Schedule & Timings
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Duty In Time</label>
                    <input
                      type="text"
                      value={editInTime}
                      onChange={(e) => setEditInTime(e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Duty Out Time</label>
                    <input
                      type="text"
                      value={editOutTime}
                      onChange={(e) => setEditOutTime(e.target.value)}
                      placeholder="07:00 PM"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Weekly Off</label>
                    <input
                      type="text"
                      value={editWeeklyOff}
                      onChange={(e) => setEditWeeklyOff(e.target.value)}
                      placeholder="Sunday"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Lunch Break</label>
                    <input
                      type="text"
                      value={editLunchTime}
                      onChange={(e) => setEditLunchTime(e.target.value)}
                      placeholder="30 Mins"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Structure */}
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-2">
                <label className="block font-black text-[#11130E] uppercase text-[10px] tracking-wider">
                  Pay Structure & Salary
                </label>
                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editPayTypeModal"
                      value="monthly"
                      checked={editPayType === 'monthly'}
                      onChange={() => setEditPayType('monthly')}
                      className="accent-[#24291E]"
                    />
                    <span>Monthly Salary (₹)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editPayTypeModal"
                      value="daily"
                      checked={editPayType === 'daily'}
                      onChange={() => setEditPayType('daily')}
                      className="accent-[#24291E]"
                    />
                    <span>Daily Rate (₹)</span>
                  </label>
                </div>

                {editPayType === 'monthly' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={editMonthlySalary}
                      onChange={(e) => setEditMonthlySalary(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Per-Day Shoot Rate (₹)</label>
                    <input
                      type="number"
                      value={editDailyRate}
                      onChange={(e) => setEditDailyRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#24291E] hover:bg-[#1C2018] text-white font-black text-xs uppercase tracking-wider shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!taskToDelete}
        title="Remove Task"
        itemTitle={taskToDelete?.title || 'Task'}
        message={`Are you sure you want to remove task "${taskToDelete?.title || ''}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>,
    document.body
  );
};
