import React, { useState, useEffect, useMemo } from 'react';
import { TeamMember, Project, AttendanceRecord, TeamTask, TeamRole, EditingStatus, ProjectTask, OwnerLead } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { PersonalTodoPanel } from '@/features/tasks/PersonalTodoPanel';
import { OwnerNotepad } from '@/features/owner/components/OwnerNotepad';
import { usePersonalJsonNote } from '@/hooks/usePersonalJsonNote';
import { usePermission } from '@/features/access';
import { SocialMediaCalendarWidget } from './SocialMediaCalendarWidget';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Share2, 
  Video, 
  Image as ImageIcon, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Plus, 
  IndianRupee, 
  Sparkles, 
  Send, 
  Calendar, 
  Check, 
  Play, 
  X, 
  FileText, 
  Download, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Edit3, 
  CheckSquare, 
  Layers, 
  PhoneCall, 
  ExternalLink,
  Target,
  Award,
  Coffee,
  DollarSign,
  CheckCircle,
  Filter,
  Trash2,
  Receipt,
  PieChart,
  CreditCard,
  Building2,
  Globe,
  Wallet,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Pin,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { SOFTWARE_OPTIONS } from '@/features/team/components/TeamAttendance';
import { BRAND } from '@/config/brand';

// Office Expense Interface for Account Manager & Studio Accounting
export interface OfficeExpense {
  id: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Electricity & Water' | 'Studio Equipment & Repair' | 'Food & Tea/Chai' | 'Travel & Fuel' | 'Software & Subscriptions' | 'Marketing & Ads' | 'Exposing & Operating' | 'Albums Print' | 'Photo & Video Edit' | 'Miscellaneous' | 'Other' | string;
  expenseDate: string; // YYYY-MM-DD
  spentBy: 'Owner' | 'Studio Manager' | 'Account Manager' | 'Other Staff' | string;
  paidVia: 'UPI / GPay' | 'Cash' | 'Bank Transfer' | 'Credit Card';
  notes?: string;
  monthYear: string; // YYYY-MM
}

// Editor & Staff Attendance Log Table with From Date, To Date, Shift Status filters and Total Payout Calculation
const EditorAttendanceLogTable: React.FC<{
  attendanceHistory: AttendanceRecord[];
  activeMember: TeamMember | null;
}> = ({ attendanceHistory, activeMember }) => {
  const [fromDate, setFromDate] = useState<string>('2026-07-01');
  const [toDate, setToDate] = useState<string>('2026-07-31');
  const [shiftStatus, setShiftStatus] = useState<string>('all');

  const filteredLogs = attendanceHistory.filter((att) => {
    if (fromDate && att.date < fromDate) return false;
    if (toDate && att.date > toDate) return false;
    if (shiftStatus !== 'all') {
      if (shiftStatus === 'present' && !(att.status === 'present' || att.status === 'present_office' || att.status === 'present_shoot')) return false;
      if (shiftStatus !== 'present' && att.status !== shiftStatus) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setShiftStatus('all');
  };

  const isFiltered = fromDate !== '' || toDate !== '' || shiftStatus !== 'all';

  // Calculate Daily Rate & Effective Log Payouts
  const memberDailyRate = activeMember?.dailyRate || (activeMember?.monthlySalary ? Math.round(activeMember.monthlySalary / 26) : 1730);

  const getLogPayout = (att: AttendanceRecord) => {
    if (att.payAmount !== undefined && att.payAmount > 0) {
      return att.payAmount;
    }
    const st = String(att.status);
    if (st === 'present_office' || st === 'present_shoot' || st === 'present') {
      return memberDailyRate;
    }
    if (st === 'half_day') {
      return Math.round(memberDailyRate * 0.5);
    }
    return 0;
  };

  const totalPayout = filteredLogs.reduce((sum, att) => sum + getLogPayout(att), 0);
  const totalPaid = filteredLogs.filter((att) => att.paidStatus === 'paid').reduce((sum, att) => sum + getLogPayout(att), 0);
  const totalPending = totalPayout - totalPaid;

  const fullDaysCount = filteredLogs.filter((att) => {
    const st = String(att.status);
    return st === 'present' || st === 'present_office' || st === 'present_shoot';
  }).length;
  const halfDaysCount = filteredLogs.filter((att) => String(att.status) === 'half_day').length;
  const absentDaysCount = filteredLogs.filter((att) => String(att.status) === 'absent').length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Monthly Shift Attendance Log & Payout Calculation</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Shift logs with automatic payout calculation for {activeMember?.name || 'Editor'} ({filteredLogs.length} Records)
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start lg:self-auto">
          Lunch Break: 30 Mins Daily
        </span>
      </div>

      {/* Payout Overview Cards & Kaise Hoga Calculation Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* Total Calculated Payout */}
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
            💵 Total Calculated Payout
          </span>
          <span className="text-lg font-black text-indigo-950 font-mono block">
            ₹{totalPayout.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-indigo-600 font-bold block">
            {fullDaysCount} Full Days + {halfDaysCount} Half Days
          </span>
        </div>

        {/* Paid Amount */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
            ✅ Paid Payout Amount
          </span>
          <span className="text-lg font-black text-emerald-950 font-mono block">
            ₹{totalPaid.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block">
            Disbursed to Bank / Cash
          </span>
        </div>

        {/* Pending Balance */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
            ⏳ Pending Payout Balance
          </span>
          <span className="text-lg font-black text-amber-950 font-mono block">
            ₹{totalPending.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-800 font-bold block">
            Due for Next Salary Cycle
          </span>
        </div>

        {/* How Payout is Calculated (Kaise Hoga Explanation) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Payout Kaise Hoga? (Rule)</span>
          </span>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Daily Rate = <strong className="text-slate-900">₹{memberDailyRate.toLocaleString('en-IN')}</strong>/day.
            Full Day = 100%, Half Day = 50%, Absent = ₹0.
          </p>
          <span className="text-[10px] text-indigo-600 font-bold block pt-0.5">
            Auto-calculated on Clock-In logs
          </span>
        </div>
      </div>

      {/* From Date, To Date & Shift Status Filters Header */}
      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Month Presets */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => { setFromDate('2026-07-01'); setToDate('2026-07-31'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${
                fromDate === '2026-07-01' && toDate === '2026-07-31'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              July 2026 (1 Month)
            </button>
            <button
              type="button"
              onClick={() => { setFromDate('2026-08-01'); setToDate('2026-08-31'); }}
              className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition cursor-pointer ${
                fromDate === '2026-08-01' && toDate === '2026-08-31'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              August 2026 (1 Month)
            </button>
          </div>

          {/* From Date Column */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="font-extrabold text-slate-600 uppercase text-[10px]">From Date:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* To Date Column */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="font-extrabold text-slate-600 uppercase text-[10px]">To Date:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Shift Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="font-extrabold text-slate-600 uppercase text-[10px]">Shift Status:</span>
            <select
              value={shiftStatus}
              onChange={(e) => setShiftStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Shift Statuses</option>
              <option value="present">All Present (Office & Shoot)</option>
              <option value="present_office">Present (Office)</option>
              <option value="present_shoot">Present (Shoot / Field)</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold rounded-lg text-xs transition border border-rose-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table displaying Date, Check-In, Lunch, Check-Out, Shift Status & Payout */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] bg-slate-100/80">
              <th className="p-3">Date</th>
              <th className="p-3">Check-In Time (From)</th>
              <th className="p-3">Lunch Time</th>
              <th className="p-3">Check-Out Time (To)</th>
              <th className="p-3">Shift Status</th>
              <th className="p-3 text-right">Calculated Pay (₹)</th>
              <th className="p-3 text-right">Payout Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-5 text-center text-slate-400 italic font-medium">
                  {isFiltered
                    ? 'No attendance records matching the selected date range and shift status.'
                    : 'No attendance records for this month yet. Use Clock In above.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((att) => {
                const pay = getLogPayout(att);
                return (
                  <tr key={att.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-extrabold text-slate-900">{att.date}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{att.inTime || '09:30 AM'}</td>
                    <td className="p-3 font-mono text-slate-600">{att.lunchTime || '30 Mins'}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{att.outTime || '07:30 PM'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-block ${
                        att.status === 'present_office' || att.status === 'present_shoot' || att.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : att.status === 'half_day'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {(att.status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900">
                      ₹{pay.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        att.paidStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {att.paidStatus === 'paid' ? 'Paid ✅' : 'Pending ⏳'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredLogs.length > 0 && (
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs border-t border-slate-800">
                <td colSpan={5} className="p-3 uppercase tracking-wider">
                  TOTAL FILTERED ATTENDANCE PAYOUT ({filteredLogs.length} DAYS)
                </td>
                <td className="p-3 text-right font-mono text-emerald-400 font-black text-sm">
                  ₹{totalPayout.toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-mono text-[11px]">
                  <span className="text-emerald-400">Paid: ₹{totalPaid.toLocaleString('en-IN')}</span>
                  <span className="text-amber-400 block text-[10px]">Pending: ₹{totalPending.toLocaleString('en-IN')}</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

// Manager Personal Daily To-Do Task Notebook Component
const ManagerPersonalTodoWidget: React.FC<{ activeMember: TeamMember | null }> = () => {
  const { can } = usePermission();
  if (!can('dashboard.view_todos')) return null;
  return <PersonalTodoPanel />;
};

// Role-wise Private Notepad & Scratchpad Component
interface RoleNoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned?: boolean;
}

const RoleNotepadWidget: React.FC<{ activeMember: TeamMember | null }> = ({ activeMember }) => {
  return <OwnerNotepad />;
  const memberKey = `${BRAND.cookiePrefix}_private_notes_${activeMember?.id || activeMember?.role || 'default'}`;

  const [notes, setNotes] = useState<RoleNoteItem[]>(() => {
    try {
      const saved = null;
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: `note-1`,
        title: `${activeMember?.name || activeMember?.role || 'Role'} Private Scratchpad`,
        content: `1. Write down daily priorities, client call memos, and task notes.\n2. Key deliverables and schedule reminders.\n3. Equipment & software setup notes.`,
        updatedAt: new Date().toISOString(),
        pinned: true,
      },
    ];
  });

  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return false;
    } catch {
      return false;
    }
  });

  const toggleHide = () => {
    const next = !isHidden;
    setIsHidden(next);
    try {
      void next;
    } catch (e) {
      console.error(e);
    }
  };

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => notes[0]?.id || null);
  const [noteTitleInput, setNoteTitleInput] = useState(() => notes[0]?.title || '');
  const [noteContentInput, setNoteContentInput] = useState(() => notes[0]?.content || '');
  const [noteSavedStatus, setNoteSavedStatus] = useState<string>('Saved');

  useEffect(() => {
    try {
      const saved = null;
      let loaded: RoleNoteItem[] = [];
      if (saved) {
        loaded = JSON.parse(saved);
      }
      if (!loaded || loaded.length === 0) {
        loaded = [
          {
            id: `note-${Date.now()}-1`,
            title: `${activeMember?.name || activeMember?.role || 'Role'} Private Scratchpad`,
            content: `1. Write down daily priorities, client call memos, and task notes.\n2. Key deliverables and schedule reminders.\n3. Equipment & software setup notes.`,
            updatedAt: new Date().toISOString(),
            pinned: true,
          },
        ];
      }
      setNotes(loaded);
      const first = loaded[0];
      setActiveNoteId(first ? first.id : null);
      setNoteTitleInput(first ? first.title : '');
      setNoteContentInput(first ? first.content : '');
    } catch (e) {
      console.error(e);
    }
  }, [memberKey]);

  useEffect(() => {
    try {
      void notes;
    } catch (e) {
      console.error(e);
    }
  }, [notes, memberKey]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  useEffect(() => {
    if (activeNote) {
      setNoteTitleInput(activeNote.title);
      setNoteContentInput(activeNote.content);
    }
  }, [activeNoteId]);

  const handleSaveActiveNote = () => {
    if (!activeNoteId) return;
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              title: noteTitleInput.trim() || 'Untitled Note',
              content: noteContentInput,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    setNoteSavedStatus('Auto-saved just now');
    setTimeout(() => setNoteSavedStatus('Saved'), 2500);
  };

  const handleCreateNewNote = () => {
    const newNote: RoleNoteItem = {
      id: `note-${Date.now()}`,
      title: 'New Private Note',
      content: '',
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setNoteTitleInput(newNote.title);
    setNoteContentInput(newNote.content);
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeNoteId === id) {
      const remaining = filtered[0];
      setActiveNoteId(remaining ? remaining.id : null);
      setNoteTitleInput(remaining ? remaining.title : '');
      setNoteContentInput(remaining ? remaining.content : '');
    }
  };

  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);

  const handleReorderNotes = (fromIndex: number, toIndex: number) => {
    setNotes((prevNotes) => {
      const updated = [...prevNotes];
      const [movedNote] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedNote);
      return updated;
    });
  };

  const handleTogglePinNote = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  if (isHidden) {
    return (
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span>{activeMember?.name || activeMember?.role || 'Role'} Private Notepad & Studio Scratchpad</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                {notes.length} {notes.length === 1 ? 'Note' : 'Notes'} Hidden
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleHide}
          className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
        >
          <Eye className="w-4 h-4" /> Show Notepad
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>{activeMember?.name || activeMember?.role || 'Role'} Private Notepad & Studio Scratchpad</span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {noteSavedStatus}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Write down private workspace thoughts, vendor pricing notes, client ideas, and meeting scratchpad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={toggleHide}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Hide Notepad"
          >
            <EyeOff className="w-4 h-4 text-slate-500" />
            <span>Hide</span>
          </button>
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + New Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[320px]">
        {/* Note List Sidebar */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 max-h-[420px] overflow-y-auto">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Saved Private Notes ({notes.length})
            </span>
            <span className="text-[9px] font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
              Drag ⋮⋮ to reorder
            </span>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No notes saved. Click + New Note above.</p>
          ) : (
            notes.map((n, idx) => (
              <div
                key={n.id}
                draggable
                onDragStart={(e) => {
                  setDraggedNoteIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedNoteIndex !== null && draggedNoteIndex !== idx) {
                    handleReorderNotes(draggedNoteIndex, idx);
                  }
                  setDraggedNoteIndex(null);
                }}
                onDragEnd={() => setDraggedNoteIndex(null)}
                onClick={() => setActiveNoteId(n.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                  draggedNoteIndex === idx ? 'opacity-40 border-dashed border-purple-400 bg-purple-50' : ''
                } ${
                  activeNoteId === n.id
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                }`}
              >
                <div
                  className={`cursor-grab active:cursor-grabbing p-0.5 shrink-0 self-center ${
                    activeNoteId === n.id ? 'text-purple-200 hover:text-white' : 'text-slate-400 hover:text-purple-600'
                  }`}
                  title="Click and drag to reorder note"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {n.pinned && <Pin className={`w-3 h-3 ${activeNoteId === n.id ? 'text-amber-300' : 'text-amber-500'}`} />}
                    <h5 className="font-extrabold text-xs truncate">{n.title || 'Untitled Note'}</h5>
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 ${activeNoteId === n.id ? 'text-purple-100' : 'text-slate-500'}`}>
                    {n.content || 'Empty note content...'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePinNote(n.id);
                    }}
                    className={`p-1 rounded ${activeNoteId === n.id ? 'hover:bg-purple-700 text-purple-200' : 'hover:bg-slate-200 text-slate-400'}`}
                    title="Pin Note"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                    className={`p-1 rounded ${activeNoteId === n.id ? 'hover:bg-purple-700 text-purple-200' : 'hover:bg-slate-200 text-slate-400'}`}
                    title="Delete Note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Editor Area */}
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col space-y-3">
          {activeNoteId ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteTitleInput}
                  onChange={(e) => setNoteTitleInput(e.target.value)}
                  onBlur={handleSaveActiveNote}
                  placeholder="Note Title..."
                  className="w-full text-base font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleSaveActiveNote}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-2xs cursor-pointer"
                >
                  Save
                </button>
              </div>

              <textarea
                value={noteContentInput}
                onChange={(e) => setNoteContentInput(e.target.value)}
                onBlur={handleSaveActiveNote}
                placeholder="Write down studio strategy, vendor pricing notes, ideas, meeting scratchpad..."
                className="w-full flex-1 min-h-[220px] bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-mono"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 text-xs">
              <FileText className="w-8 h-8 mb-2 text-slate-300" />
              <p>Select a note from left or click "+ New Note" to start writing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Manager Self Attendance Tracking & Shift Punching Component
const ManagerSelfAttendanceWidget: React.FC<{
  activeMember: TeamMember;
  attendance: AttendanceRecord[];
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  handleLoginClockIn: () => void;
  handleLogoutClockOut: () => void;
}> = ({
  activeMember,
  attendance,
  onRecordAttendance,
  onUpdateAttendance,
  handleLoginClockIn,
  handleLogoutClockOut,
}) => {
  return null;
  const todayStr = new Date().toISOString().split('T')[0];

  const todaysRecord = attendance.find(
    (a) => a.teamMemberId === activeMember.id && a.date === todayStr
  );

  const [attDate, setAttDate] = useState(todayStr);
  const [attStatus, setAttStatus] = useState<AttendanceRecord['status']>(
    todaysRecord ? todaysRecord.status : 'present_office'
  );
  const [attInTime, setAttInTime] = useState(
    todaysRecord?.inTime || activeMember.inTime || '09:30 AM'
  );
  const [attOutTime, setAttOutTime] = useState(
    todaysRecord?.outTime || activeMember.outTime || '07:30 PM'
  );
  const [attNotes, setAttNotes] = useState(
    todaysRecord?.notes || 'Studio Management, Project Supervision & Operations'
  );

  useEffect(() => {
    if (todaysRecord) {
      setAttStatus(todaysRecord.status);
      if (todaysRecord.inTime) setAttInTime(todaysRecord.inTime);
      if (todaysRecord.outTime) setAttOutTime(todaysRecord.outTime);
      if (todaysRecord.notes) setAttNotes(todaysRecord.notes);
    }
  }, [todaysRecord]);

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const rateBasis = activeMember.payType === 'monthly' && activeMember.monthlySalary 
      ? Math.round(activeMember.monthlySalary / 26) 
      : (activeMember.dailyRate || 2500);

    let calculatedPay = rateBasis;
    if (attStatus === 'half_day') calculatedPay = Math.round(rateBasis * 0.5);
    if (attStatus === 'absent') calculatedPay = 0;

    const existingIndex = attendance.findIndex(
      (a) => a.teamMemberId === activeMember.id && a.date === attDate
    );

    if (existingIndex >= 0) {
      const updatedList = attendance.map((a, idx) => {
        if (idx === existingIndex) {
          return {
            ...a,
            status: attStatus,
            inTime: attInTime,
            outTime: attOutTime,
            payAmount: calculatedPay,
            notes: attNotes,
          };
        }
        return a;
      });
      onUpdateAttendance(updatedList);
      alert(`✅ Attendance log updated for ${activeMember.name} on ${attDate}!`);
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: attDate,
        teamMemberId: activeMember.id,
        teamMemberName: activeMember.name,
        role: activeMember.role,
        status: attStatus,
        inTime: attInTime,
        outTime: attOutTime,
        payAmount: calculatedPay,
        paidStatus: 'pending',
        notes: attNotes,
      };
      onRecordAttendance(newRec);
      alert(`✅ New attendance record logged for ${activeMember.name} on ${attDate}!`);
    }
  };

  const myHistory = attendance.filter((a) => a.teamMemberId === activeMember.id);
  const officeDays = myHistory.filter((a) => a.status === 'present_office' || a.status === 'present').length;
  const shootDays = myHistory.filter((a) => a.status === 'present_shoot').length;
  const halfDays = myHistory.filter((a) => a.status === 'half_day').length;
  const absents = myHistory.filter((a) => a.status === 'absent').length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
            <span>Manager Self-Attendance & Duty Punching System</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Log your daily manager attendance, clock-in/out hours, outdoor shoot duties, and track personal payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMember.workStatus === 'CLOCKED_OUT' ? (
            <button
              type="button"
              onClick={handleLoginClockIn}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Clock In Now</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogoutClockOut}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Logout Duty</span>
            </button>
          )}
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
            Total Logged Days
          </span>
          <span className="text-xl font-black text-indigo-900 font-mono">
            {myHistory.length} Days
          </span>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Office Duty Days
          </span>
          <span className="text-xl font-black text-emerald-900 font-mono">
            {officeDays} Days
          </span>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            Outdoor Shoot Duties
          </span>
          <span className="text-xl font-black text-purple-900 font-mono">
            {shootDays} Days
          </span>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Half Days / Absents
          </span>
          <span className="text-xl font-black text-amber-900 font-mono">
            {halfDays} HD | {absents} Off
          </span>
        </div>
      </div>

      {/* Mark / Log Attendance Form */}
      <form onSubmit={handleSaveAttendance} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Mark / Edit My Duty Attendance Record</span>
          </h4>
          {todaysRecord && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ✓ Today's Record Active ({(todaysRecord.status || '').replace('_', ' ')})
            </span>
          )}
        </div>

        {/* Status Pills */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
            Select Duty Shift Status:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setAttStatus('present_office')}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                attStatus === 'present_office'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🏢 Office Duty
            </button>

            <button
              type="button"
              onClick={() => setAttStatus('present_shoot')}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                attStatus === 'present_shoot'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🎥 Outdoor Shoot
            </button>

            <button
              type="button"
              onClick={() => setAttStatus('half_day')}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                attStatus === 'half_day'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⏳ Half Day
            </button>

            <button
              type="button"
              onClick={() => setAttStatus('absent')}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                attStatus === 'absent'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ❌ Leave / Off
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Log Date:
            </label>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Clock-In Time:
            </label>
            <input
              type="text"
              value={attInTime}
              onChange={(e) => setAttInTime(e.target.value)}
              placeholder="e.g. 09:30 AM"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Clock-Out Time:
            </label>
            <input
              type="text"
              value={attOutTime}
              onChange={(e) => setAttOutTime(e.target.value)}
              placeholder="e.g. 07:30 PM"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Manager Duty Notes / Location:
          </label>
          <input
            type="text"
            value={attNotes}
            onChange={(e) => setAttNotes(e.target.value)}
            placeholder="e.g. Office Studio Operations & Outdoor Venue Inspection"
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Save / Update Manager Attendance</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Video Editor Monthly Deliverables Target Board with Columns & Auto-Tracking
const VideoEditorMonthlyTargetBoard: React.FC<{
  projects: Project[];
  activeMember: TeamMember | null;
  tasks: TeamTask[];
}> = ({ projects, activeMember, tasks }) => {
  const memberKey = `${BRAND.cookiePrefix}_editor_targets_${activeMember?.id || 'default'}`;
  const defaultTargets = useMemo(() => ({
    reels: 10,
    teaser: 5,
    longVideo: 3,
    highlights: 4,
  }), []);
  const { value: persistedTargets, save: savePersistedTargets } = usePersonalJsonNote(memberKey, defaultTargets);

  // Default target goals per deliverable type
  const [targets, setTargets] = useState(defaultTargets);

  useEffect(() => {
    setTargets(persistedTargets);
  }, [persistedTargets]);

  const [isEditingTargets, setIsEditingTargets] = useState(false);

  const handleSaveTargets = () => {
    void savePersistedTargets(targets).then(() => setIsEditingTargets(false));
  };

  const memberName = activeMember?.name || '';
  const memberId = activeMember?.id || '';

  // Filter projects specifically assigned to this editor by Owner & Manager
  const assignedProjects = projects.filter((p) => {
    if (!activeMember) return true;
    const mName = memberName.toLowerCase();
    const mId = memberId;

    const vpEditor = p.videoPipeline?.assignedEditor?.toLowerCase() || '';
    if (vpEditor && (vpEditor.includes(mName) || mName.includes(vpEditor))) return true;

    const rootEditor = (p as any).assignedEditor?.toLowerCase() || '';
    if (rootEditor && (rootEditor.includes(mName) || mName.includes(rootEditor))) return true;

    if (p.tasks && p.tasks.some((pt) => pt.assignedTo && (pt.assignedTo === mId || pt.assignedTo.toLowerCase().trim() === mName))) {
      return true;
    }

    if (
      tasks &&
      tasks.some(
        (t) =>
          (t.projectId === p.id || (t.projectTitle && p.clientWeddingTitle.toLowerCase().includes(t.projectTitle.toLowerCase()))) &&
          (t.assignedToId === mId || (t.assignedToName && t.assignedToName.toLowerCase().trim() === mName))
      )
    ) {
      return true;
    }

    return false;
  });

  // Grab direct TeamTask items assigned to this member by Owner / Manager
  const assignedTeamTasks = tasks.filter((t) => {
    if (!activeMember) return true;
    const mName = memberName.toLowerCase().trim();
    const mId = memberId;
    if (t.assignedToId) {
      return t.assignedToId === mId;
    }
    return t.assignedToName && t.assignedToName.toLowerCase().trim() === mName;
  });

  // Compute auto-tracked metrics live ONLY from assigned projects & assigned tasks
  const computeTrackedCounts = () => {
    let reelsDone = 0;
    let reelsInProgress = 0;

    let teaserDone = 0;
    let teaserInProgress = 0;

    let longVideoDone = 0;
    let longVideoInProgress = 0;

    let highlightsDone = 0;
    let highlightsInProgress = 0;

    // Use assigned projects if available, otherwise if no assignments exist fall back to projects where editor is assigned
    const targetProjectsList = assignedProjects;

    targetProjectsList.forEach((p) => {
      const vp = p.videoPipeline;
      if (!vp) return;

      // Reels
      if (vp.reels === 'completed') reelsDone++;
      else if (vp.reels === 'in_progress' || vp.reels === 'client_review' || vp.reels === 'revision') reelsInProgress++;

      // Teaser
      if (vp.teaser === 'completed') teaserDone++;
      else if (vp.teaser === 'in_progress' || vp.teaser === 'client_review' || vp.teaser === 'revision') teaserInProgress++;

      // Long Video
      if (vp.longVideo === 'completed') longVideoDone++;
      else if (vp.longVideo === 'in_progress' || vp.longVideo === 'client_review' || vp.longVideo === 'revision') longVideoInProgress++;

      // Highlights / Pre-Wedding
      if (vp.highlights === 'completed' || vp.preWeddingVideo === 'completed') highlightsDone++;
      else if (
        vp.highlights === 'in_progress' ||
        vp.preWeddingVideo === 'in_progress' ||
        vp.highlights === 'client_review' ||
        vp.preWeddingVideo === 'client_review'
      )
        highlightsInProgress++;
    });

    // Also include direct TeamTask items assigned by Owner & Manager
    assignedTeamTasks.forEach((t) => {
      const titleLower = (t.title || '').toLowerCase();
      const isCompleted = t.status === 'completed';
      const isInProgress = t.status === 'in_progress' || t.status === 'review';

      if (titleLower.includes('reel') || titleLower.includes('short')) {
        if (isCompleted) reelsDone++;
        else if (isInProgress) reelsInProgress++;
      } else if (titleLower.includes('teaser') || titleLower.includes('trailer')) {
        if (isCompleted) teaserDone++;
        else if (isInProgress) teaserInProgress++;
      } else if (titleLower.includes('long') || titleLower.includes('full') || titleLower.includes('film') || titleLower.includes('wedding video')) {
        if (isCompleted) longVideoDone++;
        else if (isInProgress) longVideoInProgress++;
      } else if (titleLower.includes('highlight') || titleLower.includes('pre-wed')) {
        if (isCompleted) highlightsDone++;
        else if (isInProgress) highlightsInProgress++;
      }
    });

    return {
      reels: { done: reelsDone, inProgress: reelsInProgress, target: targets.reels || 10 },
      teaser: { done: teaserDone, inProgress: teaserInProgress, target: targets.teaser || 5 },
      longVideo: { done: longVideoDone, inProgress: longVideoInProgress, target: targets.longVideo || 3 },
      highlights: { done: highlightsDone, inProgress: highlightsInProgress, target: targets.highlights || 4 },
    };
  };

  const counts = computeTrackedCounts();

  const totalTarget = counts.reels.target + counts.teaser.target + counts.longVideo.target + counts.highlights.target;
  const totalDone = counts.reels.done + counts.teaser.done + counts.longVideo.done + counts.highlights.done;
  const totalInProgress = counts.reels.inProgress + counts.teaser.inProgress + counts.longVideo.inProgress + counts.highlights.inProgress;
  const overallPct = Math.min(100, Math.round((totalDone / (totalTarget || 1)) * 100));

  const columns = [
    {
      id: 'reels',
      title: 'Instagram Reels (9:16)',
      icon: '📱',
      data: counts.reels,
      badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
      barColor: 'bg-pink-600',
      description: 'Vertical 4K Short Video Reels',
    },
    {
      id: 'teaser',
      title: 'Cinematic Teaser',
      icon: '🎬',
      data: counts.teaser,
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      barColor: 'bg-amber-600',
      description: '1-2 Min Trailer / Teaser Edit',
    },
    {
      id: 'longVideo',
      title: 'Full Length Film',
      icon: '📹',
      data: counts.longVideo,
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      barColor: 'bg-indigo-600',
      description: 'Traditional Full Wedding Video',
    },
    {
      id: 'highlights',
      title: 'Highlights & Pre-Wedding',
      icon: '✨',
      data: counts.highlights,
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-600',
      description: '3-5 Min Highlights / Pre-Wed Edit',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Target className="w-4.5 h-4.5 text-indigo-600" />
            <span>Editor Monthly Deliverables Target & Live Assigned Tracking</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Auto-tracking completed Reels, Teasers, Full Films & Highlights assigned to <strong className="text-slate-800">{memberName || 'Editor'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingTargets(!isEditingTargets)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingTargets ? 'Close Settings' : 'Edit Target Goals'}</span>
          </button>
        </div>
      </div>

      {/* Edit Target Goals Inline Controls */}
      {isEditingTargets && (
        <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wide">
              ⚙️ Customize Monthly Target Goals (Deliverable Counts)
            </span>
            <span className="text-[11px] text-indigo-700 font-medium">Auto-saves to Editor Profile</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">📱 Reels Target</label>
              <input
                type="number"
                min="0"
                value={targets.reels}
                onChange={(e) => setTargets({ ...targets, reels: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">🎬 Teaser Target</label>
              <input
                type="number"
                min="0"
                value={targets.teaser}
                onChange={(e) => setTargets({ ...targets, teaser: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">📹 Long Video Target</label>
              <input
                type="number"
                min="0"
                value={targets.longVideo}
                onChange={(e) => setTargets({ ...targets, longVideo: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">✨ Highlights Target</label>
              <input
                type="number"
                min="0"
                value={targets.highlights}
                onChange={(e) => setTargets({ ...targets, highlights: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveTargets}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition shadow-xs"
          >
            Save Target Goals
          </button>
        </div>
      )}

      {/* Main Deliverables Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const pct = Math.min(100, Math.round((col.data.done / (col.data.target || 1)) * 100));
          const remaining = Math.max(0, col.data.target - col.data.done);

          return (
            <div key={col.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{col.icon}</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{col.title}</h4>
                    <span className="text-[10px] text-slate-500">{col.description}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${col.badgeBg}`}>
                  {pct >= 100 ? '🎉 Goal Met' : pct >= 50 ? '⚡ On Track' : '⏳ Pending'}
                </span>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Target</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">{col.data.target}</span>
                </div>
                <div className="border-x border-slate-100">
                  <span className="text-[9px] text-emerald-600 font-bold uppercase block">Done</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">{col.data.done}</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold uppercase block">In Edit</span>
                  <span className="font-mono font-bold text-amber-600 text-sm">{col.data.inProgress}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-extrabold text-slate-700">
                  <span>Completion</span>
                  <span className="font-mono text-indigo-700">{pct}% ({col.data.done}/{col.data.target})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${col.barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                {remaining > 0 && (
                  <span className="text-[10px] text-slate-500 font-medium block text-right pt-0.5">
                    {remaining} more needed for monthly target
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deliverable Columns Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] bg-slate-100/80">
              <th className="p-3">Deliverable Column</th>
              <th className="p-3 text-center">Monthly Target</th>
              <th className="p-3 text-center">Completed (Assigned)</th>
              <th className="p-3 text-center">In Edit / Review</th>
              <th className="p-3 text-center">Remaining Target</th>
              <th className="p-3 text-right">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {columns.map((col) => {
              const pct = Math.min(100, Math.round((col.data.done / (col.data.target || 1)) * 100));
              const remaining = Math.max(0, col.data.target - col.data.done);

              return (
                <tr key={col.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{col.icon}</span>
                    <span>{col.title}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900">{col.data.target}</td>
                  <td className="p-3 text-center font-mono font-extrabold text-emerald-600 bg-emerald-50/50">{col.data.done}</td>
                  <td className="p-3 text-center font-mono font-bold text-amber-600">{col.data.inProgress}</td>
                  <td className="p-3 text-center font-mono text-slate-600">{remaining}</td>
                  <td className="p-3 text-right font-mono font-extrabold text-indigo-700">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-extrabold text-xs border-t border-slate-800">
              <td className="p-3">TOTAL ASSIGNED DELIVERABLES TRACKED</td>
              <td className="p-3 text-center font-mono">{totalTarget}</td>
              <td className="p-3 text-center font-mono text-emerald-400">{totalDone}</td>
              <td className="p-3 text-center font-mono text-amber-400">{totalInProgress}</td>
              <td className="p-3 text-center font-mono text-slate-300">{Math.max(0, totalTarget - totalDone)}</td>
              <td className="p-3 text-right font-mono text-emerald-400">{overallPct}% Overall</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const getTaskQtyLabel = (p: Project, keywords: string[], fallbackQty: number, fallbackUnit?: string) => {
  if (p.tasks && p.tasks.length > 0) {
    const task = p.tasks.find(t => 
      keywords.some(kw => t.taskName.toLowerCase().includes(kw.toLowerCase()))
    );
    if (task && task.quantity !== undefined && task.quantity !== null && task.quantity > 0) {
      const u = task.unit ? ` ${task.unit}` : (fallbackUnit ? ` ${fallbackUnit}` : '');
      return `${task.quantity}${u}`.trim();
    }
  }
  const u = fallbackUnit ? ` ${fallbackUnit}` : '';
  return `${fallbackQty}${u}`.trim();
};

interface RoleDashboardsProps {
  team: TeamMember[];
  projects: Project[];
  attendance: AttendanceRecord[];
  tasks: TeamTask[];
  onUpdateTeamMember: (member: TeamMember) => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onAddTask: (task: TeamTask) => void;
  onUpdateTask: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onSelectProject?: (project: Project, roleContext?: string) => void;
  onOpenNewProjectModal?: () => void;
  onSaveProject?: (project: Project) => void;
  onOpenAllPaymentsModal?: () => void;
  setActiveTab?: (tab: string) => void;
  currentUser?: TeamMember | { id: string; name: string; role: string; email: string } | null;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  team,
  projects,
  attendance,
  tasks,
  onUpdateTeamMember,
  onRecordAttendance,
  onUpdateAttendance,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectProject,
  onOpenNewProjectModal,
  onSaveProject,
  onOpenAllPaymentsModal,
  setActiveTab,
  currentUser,
}) => {
  // Determine whether current user is Owner
  const isOwner = currentUser?.role === 'Owner';

  // Build the list of team members to display in the selector tabs
  const selectorTeam = useMemo<TeamMember[]>(() => {
    if (isOwner) {
      return team;
    }
    if (currentUser) {
      const match = team.find(
        (t) => t.id === currentUser.id || t.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (match) {
        return [match];
      }
      return [{
        id: currentUser.id || 'current-user-id',
        name: currentUser.name,
        role: (currentUser.role as TeamRole) || 'Staff',
        email: currentUser.email || '',
        phone: 'phone' in currentUser ? (currentUser as any).phone : '',
        assignedSoftwares: [],
        inTime: '09:30 AM',
        outTime: '07:30 PM',
        weeklyOff: 'Sunday',
        lunchTime: '30 Mins',
        payType: 'monthly',
        monthlySalary: 50000,
        unauthorizedMinutes: 0,
        isLoggedOut: false,
      }];
    }
    return team;
  }, [team, currentUser, isOwner]);

  // Currently active profile / role selected
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    if (currentUser) {
      const match = selectorTeam.find(
        (t) => t.id === currentUser.id || t.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (match) return match.id;
    }
    return selectorTeam[0]?.id || team[0]?.id || '';
  });

  useEffect(() => {
    if (!isOwner && currentUser) {
      const match = selectorTeam.find(
        (t) => t.id === currentUser.id || t.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (match) {
        setActiveMemberId(match.id);
      } else if (selectorTeam.length > 0) {
        setActiveMemberId(selectorTeam[0].id);
      }
    } else if (currentUser) {
      const match = team.find((t) => t.id === currentUser.id);
      if (match && !activeMemberId) {
        setActiveMemberId(match.id);
      }
    }
  }, [currentUser, selectorTeam, isOwner, team]);

  const activeMember = team.find((t) => t.id === activeMemberId) || selectorTeam[0] || team[0];

  // Keep newTaskAssignedToId updated whenever activeMember changes
  useEffect(() => {
    if (activeMember?.id) {
      setNewTaskAssignedToId(activeMember.id);
    }
  }, [activeMemberId, activeMember?.id]);

  // Task creation and edit modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDomainSelect, setNewTaskDomainSelect] = useState(`${BRAND.domain}`);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [newTaskAssignedToId, setNewTaskAssignedToId] = useState(activeMemberId);
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TeamTask['category']>('management');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newBookingTarget, setNewBookingTarget] = useState('');
  const [newTargetRevenue, setNewTargetRevenue] = useState('');
  const [newTargetLeadsCount, setNewTargetLeadsCount] = useState('');

  // Salary Slip Modal
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);
  const [salaryMember, setSalaryMember] = useState<TeamMember | null>(null);

  // Sales Deal Conversion Modal State
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [saleClientTitle, setSaleClientTitle] = useState('');
  const [saleContactMobile, setSaleContactMobile] = useState('');
  const [saleWeddingDate, setSaleWeddingDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleTotalBudget, setSaleTotalBudget] = useState<number>(180000);
  const [saleAdvanceReceived, setSaleAdvanceReceived] = useState<number>(50000);
  const [saleVenue, setSaleVenue] = useState('Taj Palace, New Delhi');
  const [saleServiceType, setSaleServiceType] = useState('Traditional + Cinematic + Pre-Wedding');

  // Account Manager Financial Editing & Suite State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accTotalBudget, setAccTotalBudget] = useState<number>(0);
  const [accAdvance, setAccAdvance] = useState<number>(0);

  // Account Manager Dashboard Sub-Tab Selection
  const [acManagerSubTab, setAcManagerSubTab] = useState<'clients' | 'tasks' | 'payments' | 'expenses' | 'salaries' | 'pnl' | 'attendance'>('clients');

  // Dynamic Sales Target Calculation from Owner/Manager Assigned Tasks
  const activeSalesTargetTask = useMemo(() => {
    const memberTargetTasks = tasks.filter(
      (t) =>
        (t.assignedToId === activeMember?.id ||
          t.assignedToName?.toLowerCase() === activeMember?.name?.toLowerCase()) &&
        (t.targetRevenue || t.bookingTarget || t.category === 'sales_target')
    );
    if (memberTargetTasks.length > 0) {
      return memberTargetTasks[memberTargetTasks.length - 1];
    }
    const globalTargetTasks = tasks.filter(
      (t) => (t.category === 'sales_target' || t.targetRevenue || t.bookingTarget)
    );
    return globalTargetTasks[globalTargetTasks.length - 1] || null;
  }, [tasks, activeMember]);

  const assignedSalesRevenueGoal = useMemo(() => {
    const memberRevTasks = tasks.filter(
      (t) =>
        (t.assignedToId === activeMember?.id ||
          t.assignedToName?.toLowerCase() === activeMember?.name?.toLowerCase()) &&
        t.targetRevenue !== undefined &&
        t.targetRevenue > 0
    );
    if (memberRevTasks.length > 0) {
      return memberRevTasks.reduce((sum, t) => sum + (t.targetRevenue || 0), 0);
    }
    const globalRevTasks = tasks.filter(
      (t) => t.targetRevenue !== undefined && t.targetRevenue > 0
    );
    if (globalRevTasks.length > 0) {
      return globalRevTasks.reduce((sum, t) => sum + (t.targetRevenue || 0), 0);
    }
    return 500000;
  }, [tasks, activeMember]);

  const assignedSalesDealsGoal = useMemo(() => {
    const memberDealsTasks = tasks.filter(
      (t) =>
        (t.assignedToId === activeMember?.id ||
          t.assignedToName?.toLowerCase() === activeMember?.name?.toLowerCase()) &&
        t.bookingTarget !== undefined &&
        t.bookingTarget > 0
    );
    if (memberDealsTasks.length > 0) {
      return memberDealsTasks.reduce((sum, t) => sum + (t.bookingTarget || 0), 0);
    }
    const globalDealsTasks = tasks.filter(
      (t) => t.bookingTarget !== undefined && t.bookingTarget > 0
    );
    if (globalDealsTasks.length > 0) {
      return globalDealsTasks.reduce((sum, t) => sum + (t.bookingTarget || 0), 0);
    }
    return 5;
  }, [tasks, activeMember]);
  const [acTaskSearch, setAcTaskSearch] = useState<string>('');
  const [acTaskStatusFilter, setAcTaskStatusFilter] = useState<string>('all');
  const [acTaskTypeFilter, setAcTaskTypeFilter] = useState<string>('all');

  // Helper to get project tasks or fallback default tasks
  const getProjectTasks = (project: Project): ProjectTask[] => {
    if (project.tasks && project.tasks.length > 0) return project.tasks;
    return [
      {
        id: `${project.id}-t1`,
        taskName: 'Cinematic Teaser Video',
        quantity: 1,
        unit: 'Video',
        assignedTo: 'Vikram Sharma',
        status: 'not_started',
      },
      {
        id: `${project.id}-t2`,
        taskName: 'Instagram Reels / Shorts',
        quantity: 5,
        unit: 'Reels',
        assignedTo: 'Rahul Editor',
        status: 'not_started',
      },
      {
        id: `${project.id}-t3`,
        taskName: 'Wedding Film / Long Video',
        quantity: 1,
        unit: 'Video',
        assignedTo: 'Amit Editor',
        status: 'not_started',
      },
      {
        id: `${project.id}-t4`,
        taskName: 'Photo Selection & Retouching',
        quantity: 100,
        unit: 'Photos',
        assignedTo: 'Sam Rivera',
        status: 'not_started',
      },
      {
        id: `${project.id}-t5`,
        taskName: 'Wedding Albums (12x36)',
        quantity: 2,
        unit: 'Albums',
        assignedTo: 'Alex Morgan',
        status: 'not_started',
      },
    ];
  };

  // Helper to update task status or assigned staff for a project
  const handleUpdateProjectTaskStatus = (
    project: Project,
    taskId: string | undefined,
    taskIndex: number,
    newStatus: EditingStatus,
    newAssignedTo?: string
  ) => {
    const currentTasks = getProjectTasks(project);
    const updatedTasks: ProjectTask[] = currentTasks.map((t, idx) => {
      if ((taskId && t.id === taskId) || idx === taskIndex) {
        return {
          ...t,
          status: newStatus,
          assignedTo: newAssignedTo !== undefined ? newAssignedTo : t.assignedTo,
        };
      }
      return t;
    });
    const updatedProject: Project = {
      ...project,
      tasks: updatedTasks,
    };
    onSaveProject?.(updatedProject);
  };

  // Selected Month & Date Range Filter for Financials, Expenses & Salaries
  const [selectedFinancialMonth, setSelectedFinancialMonth] = useState<string>('All Time');
  const [finFromDate, setFinFromDate] = useState<string>('');
  const [finToDate, setFinToDate] = useState<string>('');

  // Date Formatting Helper: YYYY-MM-DD -> DD-MM-YYYY
  const formatDateDash = (dateStr: string) => {
    if (!dateStr) return 'ALL';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  const isDateInRange = (dateStr: string, startDate: string, endDate: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr || dateStr === 'N/A') return false;

    let norm = dateStr.trim().replace(/\//g, '-');
    const parts = norm.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        norm = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        norm = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }

    if (startDate && norm < startDate) return false;
    if (endDate && norm > endDate) return false;
    return true;
  };

  const isExpenseInSelectedPeriod = (e: OfficeExpense) => {
    if (finFromDate || finToDate) {
      return isDateInRange(e.expenseDate, finFromDate, finToDate);
    }
    if (!selectedFinancialMonth || selectedFinancialMonth === 'All Time') {
      return true;
    }
    return e.monthYear === selectedFinancialMonth || e.expenseDate.startsWith(selectedFinancialMonth);
  };

  const acMonthlyPayments = useMemo(() => {
    return projects.flatMap((p) => {
      const pPayments = (p.payments && p.payments.length > 0)
        ? p.payments
        : (p.advanceReceived && p.advanceReceived > 0)
          ? [{
              id: `pay-auto-${p.id}`,
              date: p.createdAt || '2026-08-01',
              amount: p.advanceReceived,
              type: 'advance' as const,
              paymentMode: 'UPI / Bank Transfer',
              receiptNumber: `REC-${p.id.slice(-4).toUpperCase()}`,
              notes: 'Booking advance received',
            }]
          : [];

      return pPayments.map((pay) => ({
        ...pay,
        projectTitle: p.clientWeddingTitle,
        clientContact: p.clientContactMobile,
        projectId: p.id,
      }));
    }).filter((pay) => isDateInRange(pay.date, finFromDate, finToDate));
  }, [projects, finFromDate, finToDate]);

  const acTotalMonthIncome = useMemo(() => {
    return acMonthlyPayments.reduce((acc, pay) => acc + pay.amount, 0);
  }, [acMonthlyPayments]);

  const memberAssignedShoots = useMemo(() => {
    return projects.flatMap((p) =>
      (p.shoots || [])
        .filter((s) => {
          if (!activeMember?.name) return false;
          const lowerMemberName = activeMember.name.trim().toLowerCase();
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
  }, [projects, activeMember?.name]);

  const defaultOfficeExpenses = useMemo<OfficeExpense[]>(() => [
      {
        id: 'exp-1',
        title: 'Studio Main Office Rent (July 2026)',
        amount: 25000,
        category: 'Rent',
        expenseDate: '2026-07-02',
        spentBy: 'Owner',
        paidVia: 'Bank Transfer',
        notes: 'Monthly rental paid to building landlord',
        monthYear: '2026-07'
      },
      {
        id: 'exp-2',
        title: 'Studio AC & High-Power Electricity Bill',
        amount: 7450,
        category: 'Electricity & Water',
        expenseDate: '2026-07-08',
        spentBy: 'Studio Manager',
        paidVia: 'UPI / GPay',
        notes: 'Commercial meter power bill for editing suites',
        monthYear: '2026-07'
      },
      {
        id: 'exp-3',
        title: 'Sony FX3 & Lens Sensor Cleaning & Servicing',
        amount: 8500,
        category: 'Studio Equipment & Repair',
        expenseDate: '2026-07-12',
        spentBy: 'Owner',
        paidVia: 'Cash',
        notes: 'Servicing at official Sony Service Center',
        monthYear: '2026-07'
      },
      {
        id: 'exp-4',
        title: 'Staff Monthly Tea, Coffee, Snacks & Refreshments',
        amount: 4200,
        category: 'Food & Tea/Chai',
        expenseDate: '2026-07-20',
        spentBy: 'Account Manager',
        paidVia: 'UPI / GPay',
        notes: 'Chai & snacks bill for editors & studio crew',
        monthYear: '2026-07'
      },
      {
        id: 'exp-5',
        title: 'Field Travel, Petrol & Taxi for Outdoor Shoots',
        amount: 9800,
        category: 'Travel & Fuel',
        expenseDate: '2026-07-24',
        spentBy: 'Studio Manager',
        paidVia: 'UPI / GPay',
        notes: 'Fuel reimbursement for Goa & Udaipur shoot crew travel',
        monthYear: '2026-07'
      },
      {
        id: 'exp-6',
        title: 'Adobe Creative Cloud + Google One Cloud Storage',
        amount: 4600,
        category: 'Software & Subscriptions',
        expenseDate: '2026-07-05',
        spentBy: 'Owner',
        paidVia: 'Credit Card',
        notes: 'Premiere Pro, Lightroom, After Effects licenses',
        monthYear: '2026-07'
      },
      {
        id: 'exp-7',
        title: 'Instagram & Facebook Ads for Wedding Enquiries',
        amount: 12000,
        category: 'Marketing & Ads',
        expenseDate: '2026-07-15',
        spentBy: 'Account Manager',
        paidVia: 'UPI / GPay',
        notes: 'Targeted reel ads for 2026-27 wedding season',
        monthYear: '2026-07'
      },
      {
        id: 'exp-8',
        title: 'Fiber High-Speed Internet 300Mbps Dual Line',
        amount: 2100,
        category: 'Miscellaneous',
        expenseDate: '2026-07-10',
        spentBy: 'Studio Manager',
        paidVia: 'UPI / GPay',
        notes: 'Airtel Black & Jio Fiber backup lines',
        monthYear: '2026-07'
      },
      {
        id: 'exp-9',
        title: 'Studio Main Office Rent (August 2026)',
        amount: 25000,
        category: 'Rent',
        expenseDate: '2026-08-01',
        spentBy: 'Owner',
        paidVia: 'Bank Transfer',
        notes: 'August month landlord rent',
        monthYear: '2026-08'
      },
      {
        id: 'exp-10',
        title: 'New Sandisk 2TB Extreme Portable SSDs for Editors',
        amount: 18500,
        category: 'Studio Equipment & Repair',
        expenseDate: '2026-08-03',
        spentBy: 'Owner',
        paidVia: 'UPI / GPay',
        notes: 'High-speed scratch disk SSDs for 4K video editing',
        monthYear: '2026-08'
      }
    ], []);
  const { value: persistedOfficeExpenses, save: savePersistedOfficeExpenses } = usePersonalJsonNote(`${BRAND.cookiePrefix}_studio_office_expenses`, defaultOfficeExpenses);

  // Office Expenses State & Initial Pre-populated records
  const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>(defaultOfficeExpenses);

  useEffect(() => {
    setOfficeExpenses(persistedOfficeExpenses);
  }, [persistedOfficeExpenses]);

  const updateOfficeExpenses = (next: OfficeExpense[] | ((current: OfficeExpense[]) => OfficeExpense[])) => {
    setOfficeExpenses((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      void savePersistedOfficeExpenses(resolved);
      return resolved;
    });
  };

  // Expense Filtering State
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseSpentByFilter, setExpenseSpentByFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');

  // Modal State for Adding New Expense
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number>(0);
  const [newExpCategory, setNewExpCategory] = useState<string>('Rent');
  const [customExpCategory, setCustomExpCategory] = useState<string>('');
  const [newExpSpentBy, setNewExpSpentBy] = useState<string>('Owner');
  const [customExpSpentBy, setCustomExpSpentBy] = useState<string>('');
  const [newExpPaidVia, setNewExpPaidVia] = useState<OfficeExpense['paidVia']>('UPI / GPay');
  const [newExpDate, setNewExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newExpNotes, setNewExpNotes] = useState('');

  // Modal State for Recording Client Payment Receipt
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<Project | null>(null);
  const [clientPaymentAmount, setClientPaymentAmount] = useState<number>(0);
  const [clientPaymentMode, setClientPaymentMode] = useState<'UPI / GPay' | 'Bank Transfer' | 'Cash' | 'Cheque'>('UPI / GPay');
  const [clientPaymentDate, setClientPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clientPaymentType, setClientPaymentType] = useState<'advance' | 'installment' | 'final' | 'other'>('installment');
  const [clientPaymentNotes, setClientPaymentNotes] = useState('');
  const [customOtherClientName, setCustomOtherClientName] = useState('');

  // Modal State for Staff Salary Disbursement
  const [salaryDisburseMember, setSalaryDisburseMember] = useState<TeamMember | null>(null);
  const [salaryDisburseAmount, setSalaryDisburseAmount] = useState<number>(0);
  const [salaryDisburseMode, setSalaryDisburseMode] = useState<'UPI / GPay' | 'Cash' | 'Bank Transfer'>('UPI / GPay');
  const [salaryDisburseNotes, setSalaryDisburseNotes] = useState('');

  // Live Timer State (Stopwatch for current shift)
  const [shiftSeconds, setShiftSeconds] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (activeMember && activeMember.workStatus !== 'CLOCKED_OUT' && !activeMember.isLoggedOut) {
      timer = setInterval(() => {
        setShiftSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeMember?.id, activeMember?.workStatus, activeMember?.isLoggedOut]);

  // Format shift seconds to HH:MM:SS
  const formatShiftTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Login (Clock-In) Handler
  const handleLoginClockIn = () => {
    if (!activeMember) return;
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toISOString().split('T')[0];

    const updatedMember: TeamMember = {
      ...activeMember,
      workStatus: 'EDITING',
      isLoggedOut: false,
      inTime: nowStr,
    };
    onUpdateTeamMember(updatedMember);

    // Create attendance entry if not logged today
    const existingAtt = attendance.find(
      (a) => a.teamMemberId === activeMember.id && a.date === todayDate
    );

    if (!existingAtt) {
      const rateBasis = activeMember.payType === 'monthly' && activeMember.monthlySalary 
        ? Math.round(activeMember.monthlySalary / 26) 
        : (activeMember.dailyRate || 2500);

      const newAtt: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: todayDate,
        teamMemberId: activeMember.id,
        teamMemberName: activeMember.name,
        role: activeMember.role,
        status: 'present_office',
        inTime: nowStr,
        outTime: '07:30 PM',
        payAmount: rateBasis,
        paidStatus: 'pending',
        notes: `Auto Login Clock-In recorded at ${nowStr}`,
      };
      onRecordAttendance(newAtt);
    }

    setShiftSeconds(0);
    alert(`${activeMember.name} logged in · Clock-in ${nowStr}`);
  };

  // Logout (Clock-Out) Handler
  const handleLogoutClockOut = () => {
    if (!activeMember) return;
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const todayDate = new Date().toISOString().split('T')[0];

    const updatedMember: TeamMember = {
      ...activeMember,
      workStatus: 'CLOCKED_OUT',
      outTime: nowStr,
    };
    onUpdateTeamMember(updatedMember);

    // Update today's attendance record with Out Time
    const updatedAttendance = attendance.map((a) => {
      if (a.teamMemberId === activeMember.id && a.date === todayDate) {
        return {
          ...a,
          outTime: nowStr,
          notes: `Logged out at ${nowStr}. Shift completed.`,
        };
      }
      return a;
    });
    onUpdateAttendance(updatedAttendance);

    alert(`${activeMember.name} logged out · Clock-out ${nowStr}`);
  };

  const myAttendanceHistory = attendance.filter((a) => a.teamMemberId === activeMember?.id);

  // Finalize Sales Deal & Add directly to New Project
  const handleFinalizeSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (!saleClientTitle) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      clientWeddingTitle: saleClientTitle,
      clientContactMobile: saleContactMobile || '+91 98765 00000',
      venueLocation: saleVenue || 'Delhi Studio Venue',
      primaryServiceType: saleServiceType,
      weddingFunctionDates: saleWeddingDate,
      finalDeliveryDeadline: saleWeddingDate,
      totalBudget: Number(saleTotalBudget) || 180000,
      advanceReceived: Number(saleAdvanceReceived) || 50000,
      balanceDue: Math.max(0, (Number(saleTotalBudget) || 180000) - (Number(saleAdvanceReceived) || 50000)),
      specialNotesMusicPreferences: 'Sales deal converted project',
      status: 'running',
      createdAt: new Date().toISOString().split('T')[0],
      shoots: [
        {
          id: `shoot-${Date.now()}`,
          title: 'Main Wedding Ceremony',
          date: saleWeddingDate,
          time: '10:00 AM - 10:00 PM',
          venue: saleVenue || 'Delhi Studio Venue',
          location: saleVenue || 'Delhi Studio Venue',
          status: 'scheduled',
          leadPhotographer: 'Lead Photographer',
          cinematographer: 'Cinematographer',
          crewAssignments: [
            { id: 'c1', role: 'Lead Photographer', name: 'Lead Photographer' },
            { id: 'c2', role: 'Cinematographer', name: 'Cinematographer' }
          ]
        }
      ],
      videoPipeline: {
        preWeddingVideo: 'not_started',
        longVideo: 'not_started',
        teaser: 'in_progress',
        highlights: 'not_started',
        reels: 'in_progress',
        otherVideo: ''
      },
      photoPipeline: {
        preWeddingPhotos: 'not_started',
        cullingSelection: 'completed',
        colorGradingRetouching: 'in_progress',
        albumDesigning: 'not_started',
        albumPrinting: 'not_sent',
        otherPhoto: ''
      },
      dataBackup: {
        offloadedFromCards: false,
        hardDrive1: '',
        hardDrive1Done: false,
        hardDrive2: '',
        hardDrive2Done: false,
        cloudBackupDone: false,
        totalDataSizeGB: 0,
        rawCleanupStatus: 'raw_kept'
      },
      deliveryStatus: {
        rawHandoverDone: false,
        teaserLinkSent: false,
        fullFilmSent: false,
        reelsSent: false,
        highResPhotosSent: false,
        albumPrintedAndDelivered: false
      },
      payments: [
        {
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: Number(saleAdvanceReceived) || 50000,
          type: 'advance',
          paymentMode: 'UPI / GPay',
          receiptNumber: `REC-${Date.now()}`,
          notes: 'Booking advance received by Sales Team member',
        }
      ],
    };

    if (onSaveProject) {
      onSaveProject(newProject);
    }
    setShowSalesModal(false);
    setSaleClientTitle('');
    setSaleContactMobile('');
    alert(`🎉 Success! Deal for "${newProject.clientWeddingTitle}" finalized & converted directly into Studio Active Project!`);
  };

  // Save Account Manager Financial Update
  const handleSaveAccountFinancials = (projectId: string) => {
    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return;

    const updatedProj: Project = {
      ...targetProj,
      totalBudget: Number(accTotalBudget),
      advanceReceived: Number(accAdvance),
      balanceDue: Math.max(0, Number(accTotalBudget) - Number(accAdvance)),
    };

    if (onSaveProject) {
      onSaveProject(updatedProj);
    }
    setEditingAccountId(null);
    alert(`✅ Financial Account for "${updatedProj.clientWeddingTitle}" updated! Balance Due: ₹${updatedProj.balanceDue.toLocaleString('en-IN')}`);
  };

  // Handler to Add New Office Expense
  const handleAddOfficeExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount || newExpAmount <= 0) {
      alert('Please enter a valid expense title and amount!');
      return;
    }
    const m = newExpDate.substring(0, 7);
    const finalCategory = newExpCategory || 'Miscellaneous';
    const finalSpentBy = newExpSpentBy.trim() || 'Owner';

    const newExp: OfficeExpense = {
      id: `exp-${Date.now()}`,
      title: newExpTitle,
      amount: Number(newExpAmount),
      category: finalCategory,
      expenseDate: newExpDate,
      spentBy: finalSpentBy,
      paidVia: newExpPaidVia,
      notes: newExpNotes,
      monthYear: m,
    };
    updateOfficeExpenses((prev) => [newExp, ...prev]);
    setShowAddExpenseModal(false);
    setNewExpTitle('');
    setNewExpAmount(0);
    setNewExpNotes('');
    setCustomExpCategory('');
    setCustomExpSpentBy('');
    alert(`✅ Office Expense "${newExpTitle}" of ₹${newExpAmount.toLocaleString('en-IN')} logged successfully!`);
  };

  // Undo Toast state & Confirm Delete Modal state
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<OfficeExpense | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ projectId: string; paymentId: string; title: string; amount: number } | null>(null);

  // Handler to Delete Office Expense
  const confirmDeleteOfficeExpense = (deletedItem: OfficeExpense) => {
    const idx = officeExpenses.findIndex((e) => e.id === deletedItem.id);
    if (idx === -1) return;

    updateOfficeExpenses((prev) => prev.filter((e) => e.id !== deletedItem.id));
    setUndoToast({
      message: `Expense "${deletedItem.title}" (₹${deletedItem.amount.toLocaleString('en-IN')}) deleted`,
      onUndo: () => {
        updateOfficeExpenses((prev) => {
          const copy = [...prev];
          copy.splice(idx >= 0 && idx <= copy.length ? idx : 0, 0, deletedItem);
          return copy;
        });
        setUndoToast(null);
      },
    });
  };

  // Handler to Record Client Payment Receipt
  const handleRecordClientPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForPayment || !clientPaymentAmount || clientPaymentAmount <= 0) {
      alert('Please enter a valid payment amount!');
      return;
    }

    const payDate = clientPaymentDate || new Date().toISOString().split('T')[0];
    const newPayment = {
      id: `pay-${Date.now()}`,
      date: payDate,
      amount: Number(clientPaymentAmount),
      type: clientPaymentType || 'installment',
      paymentMode: clientPaymentMode,
      receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: clientPaymentNotes || 'Client payment recorded',
    };

    if (selectedProjectForPayment.id === 'OTHER_CUSTOM') {
      const title = customOtherClientName.trim() || 'Other Client / Direct Income';
      const existingOther = projects.find(
        (p) => p.clientWeddingTitle.toLowerCase() === title.toLowerCase() || p.id === 'proj-other-income'
      );

      let targetProj: Project;
      if (existingOther) {
        const newAdvance = (existingOther.advanceReceived || 0) + Number(clientPaymentAmount);
        targetProj = {
          ...existingOther,
          advanceReceived: newAdvance,
          totalBudget: Math.max(existingOther.totalBudget || 0, newAdvance),
          balanceDue: Math.max(0, (existingOther.totalBudget || newAdvance) - newAdvance),
          payments: [...(existingOther.payments || []), newPayment],
        };
      } else {
        const amt = Number(clientPaymentAmount);
        targetProj = {
          id: `proj-other-${Date.now()}`,
          clientWeddingTitle: title,
          clientContactMobile: 'Direct Payment',
          venueLocation: 'Studio / Direct',
          primaryServiceType: 'Other',
          weddingFunctionDates: payDate,
          finalDeliveryDeadline: payDate,
          totalBudget: amt,
          advanceReceived: amt,
          balanceDue: 0,
          specialNotesMusicPreferences: 'Other client / direct revenue payment',
          status: 'completed',
          createdAt: payDate,
          payments: [newPayment],
          videoPipeline: {
            preWeddingVideo: 'completed',
            longVideo: 'completed',
            teaser: 'completed',
            highlights: 'completed',
            reels: 'completed',
            otherVideo: '',
          },
          photoPipeline: {
            preWeddingPhotos: 'completed',
            cullingSelection: 'completed',
            colorGradingRetouching: 'completed',
            albumDesigning: 'completed',
            albumPrinting: 'delivered',
            otherPhoto: '',
          },
          shoots: [],
          dataBackup: {
            offloadedFromCards: true,
            hardDrive1: 'N/A',
            hardDrive1Done: true,
            hardDrive2: 'N/A',
            hardDrive2Done: true,
            cloudBackupDone: true,
            totalDataSizeGB: 0,
            rawCleanupStatus: 'archived',
          },
          deliveryStatus: {
            rawHandoverDone: true,
            teaserLinkSent: true,
            fullFilmSent: true,
            reelsSent: true,
            highResPhotosSent: true,
            albumPrintedAndDelivered: true,
          },
        };
      }

      if (onSaveProject) {
        onSaveProject(targetProj);
      }
      setSelectedProjectForPayment(null);
      setClientPaymentAmount(0);
      setClientPaymentNotes('');
      setCustomOtherClientName('');
      alert(`💰 Payment recorded! ₹${clientPaymentAmount.toLocaleString('en-IN')} added under "${title}".`);
      return;
    }

    const targetProj = selectedProjectForPayment;
    const newAdvance = (targetProj.advanceReceived || 0) + Number(clientPaymentAmount);
    const updatedProj: Project = {
      ...targetProj,
      advanceReceived: newAdvance,
      balanceDue: Math.max(0, (targetProj.totalBudget || 0) - newAdvance),
      payments: [...(targetProj.payments || []), newPayment],
    };

    if (onSaveProject) {
      onSaveProject(updatedProj);
    }
    setSelectedProjectForPayment(null);
    setClientPaymentAmount(0);
    setClientPaymentNotes('');
    alert(`💰 Payment recorded! ₹${clientPaymentAmount.toLocaleString('en-IN')} added to "${targetProj.clientWeddingTitle}". Remaining Balance: ₹${updatedProj.balanceDue.toLocaleString('en-IN')}`);
  };

  // Handler to Delete Client Payment Receipt Entry
  const confirmDeleteClientPayment = (projectId: string, paymentId: string) => {
    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return;

    const payments = targetProj.payments || [];
    const pIdx = payments.findIndex((p) => p.id === paymentId);
    if (pIdx === -1) return;
    const deletedPay = payments[pIdx];

    const updatedPayments = payments.filter((pay) => pay.id !== paymentId);
    const newAdvance = updatedPayments.reduce((acc, pay) => acc + pay.amount, 0);

    const updatedProj: Project = {
      ...targetProj,
      advanceReceived: newAdvance,
      balanceDue: Math.max(0, (targetProj.totalBudget || 0) - newAdvance),
      payments: updatedPayments,
    };

    if (onSaveProject) {
      onSaveProject(updatedProj);
    }

    setUndoToast({
      message: `Payment entry ₹${deletedPay.amount.toLocaleString('en-IN')} deleted`,
      onUndo: () => {
        const restoredPayments = [...(targetProj.payments || [])];
        restoredPayments.splice(pIdx >= 0 && pIdx <= restoredPayments.length ? pIdx : 0, 0, deletedPay);
        const restoredAdv = restoredPayments.reduce((acc, pay) => acc + pay.amount, 0);
        const restoredProj: Project = {
          ...targetProj,
          advanceReceived: restoredAdv,
          balanceDue: Math.max(0, (targetProj.totalBudget || 0) - restoredAdv),
          payments: restoredPayments,
        };
        if (onSaveProject) {
          onSaveProject(restoredProj);
        }
        setUndoToast(null);
      },
    });
  };

  // Handler to Record Staff Salary Disbursement
  const handleStaffSalaryDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryDisburseMember || !salaryDisburseAmount || salaryDisburseAmount <= 0) {
      alert('Please enter a valid salary payout amount!');
      return;
    }
    alert(`🎉 Salary payment of ₹${salaryDisburseAmount.toLocaleString('en-IN')} disbursed to ${salaryDisburseMember.name} via ${salaryDisburseMode}! Receipt recorded.`);
    setSalaryDisburseMember(null);
    setSalaryDisburseAmount(0);
    setSalaryDisburseNotes('');
  };

  // Open Task for Editing
  const handleOpenEditTask = (task: TeamTask) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskAssignedToId(task.assignedToId || activeMemberId);
    setNewTaskProjectId(task.projectId || '');
    setNewTaskCategory(task.category || 'social_media');
    setNewTaskDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setNewTaskPriority(task.priority || 'high');
    setNewTaskNotes(task.notes || '');

    const standardDomains = [BRAND.domain];
    if (task.domainName) {
      if (standardDomains.includes(task.domainName)) {
        setNewTaskDomainSelect(task.domainName);
        setCustomDomainInput('');
      } else {
        setNewTaskDomainSelect('custom');
        setCustomDomainInput(task.domainName);
      }
    } else {
      setNewTaskDomainSelect(`${BRAND.domain}`);
      setCustomDomainInput('');
    }
    setShowAddTaskModal(true);
  };

  // Delete Task Confirmation
  const handleDeleteTaskClick = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete task "${taskTitle}"?`)) {
      if (onDeleteTask) {
        onDeleteTask(taskId);
      }
    }
  };

  // Handle Add / Edit Task Submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const assignedMem = team.find((t) => t.id === newTaskAssignedToId) || activeMember;
    const proj = projects.find((p) => p.id === newTaskProjectId);
    const selectedDomainName = newTaskDomainSelect === 'custom' ? customDomainInput.trim() : newTaskDomainSelect;

    const bTarget = newBookingTarget ? Number(newBookingTarget) : undefined;
    const tRevenue = newTargetRevenue ? Number(newTargetRevenue) : undefined;
    const tLeads = newTargetLeadsCount ? Number(newTargetLeadsCount) : undefined;

    if (editingTask) {
      const updated: TeamTask = {
        ...editingTask,
        title: newTaskTitle,
        assignedToId: assignedMem.id,
        assignedToName: assignedMem.name,
        assignedRole: assignedMem.role,
        domainName: selectedDomainName || undefined,
        projectId: proj?.id,
        projectTitle: proj?.clientWeddingTitle,
        category: newTaskCategory,
        dueDate: newTaskDueDate,
        priority: newTaskPriority,
        notes: newTaskNotes,
        bookingTarget: bTarget,
        targetRevenue: tRevenue,
        targetLeadsCount: tLeads,
      };
      onUpdateTask(updated);
      setEditingTask(null);
      setShowAddTaskModal(false);
      setNewTaskTitle('');
      setCustomDomainInput('');
      setNewTaskNotes('');
      setNewBookingTarget('');
      setNewTargetRevenue('');
      setNewTargetLeadsCount('');
      alert(`Task "${updated.title}" updated successfully!`);
      return;
    }

    const task: TeamTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      assignedToId: assignedMem.id,
      assignedToName: assignedMem.name,
      assignedRole: assignedMem.role,
      domainName: selectedDomainName || undefined,
      projectId: proj?.id,
      projectTitle: proj?.clientWeddingTitle,
      category: newTaskCategory,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'not_started',
      notes: newTaskNotes,
      bookingTarget: bTarget,
      targetRevenue: tRevenue,
      targetLeadsCount: tLeads,
    };

    onAddTask(task);
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setCustomDomainInput('');
    setNewTaskNotes('');
    setNewBookingTarget('');
    setNewTargetRevenue('');
    setNewTargetLeadsCount('');
    alert(`Task "${task.title}" assigned to ${assignedMem.name} (${assignedMem.role})${selectedDomainName ? ` for domain ${selectedDomainName}` : ''}!`);
  };

  // Filter tasks strictly for active member
  const myAssignedTasks = tasks.filter((t) => {
    if (!activeMember) return false;
    const mName = activeMember.name.toLowerCase().trim();
    const mId = activeMember.id;

    const isIdMatch = Boolean(t.assignedToId && t.assignedToId === mId);
    const isNameMatch = Boolean(t.assignedToName && t.assignedToName.toLowerCase().trim() === mName);
    const isPartialNameMatch = Boolean(
      t.assignedToName && 
      (t.assignedToName.toLowerCase().includes(mName) || mName.includes(t.assignedToName.toLowerCase().trim()))
    );

    return isIdMatch || isNameMatch || isPartialNameMatch;
  });

  // Software options assigned to member
  const permittedSoftwares = activeMember?.assignedSoftwares || [activeMember?.assignedSoftware || SOFTWARE_OPTIONS[0]];

  // Monthly Salary Calculation Helper
  const calculateSalaryMetrics = (member: TeamMember) => {
    const monthlyBase = member.monthlySalary || (member.dailyRate ? member.dailyRate * 26 : 45000);
    const perDayRate = Math.round(monthlyBase / 26);
    
    // Member's attendance records
    const memberLogs = attendance.filter((a) => a.teamMemberId === member.id);
    const presentCount = memberLogs.filter((a) => a.status === 'present_office' || a.status === 'present_shoot').length || 24;
    const halfDayCount = memberLogs.filter((a) => a.status === 'half_day').length || 1;
    const absentCount = memberLogs.filter((a) => a.status === 'absent').length || 1;

    const earnedSalary = (presentCount * perDayRate) + (halfDayCount * Math.round(perDayRate / 2));
    const paidAmount = memberLogs.filter((a) => a.paidStatus === 'paid').reduce((acc, curr) => acc + curr.payAmount, 0);
    const pendingAmount = earnedSalary - paidAmount > 0 ? earnedSalary - paidAmount : 0;

    return {
      monthlyBase,
      perDayRate,
      presentCount,
      halfDayCount,
      absentCount,
      earnedSalary,
      paidAmount,
      pendingAmount,
    };
  };

  const activeSalary = activeMember ? calculateSalaryMetrics(activeMember) : null;

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER BANNER WITH ROLE SELECTOR */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg border border-slate-800 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h2 className="text-xl font-black text-white tracking-tight">
                Role Workspaces
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Select any role profile below to access their customized workspace, live shift attendance, software security & assigned tasks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('leads')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Target className="w-4 h-4 stroke-[2.5]" />
                <span>Leads & Inquiries</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeMember?.id) {
                  setNewTaskAssignedToId(activeMember.id);
                }
                setNewTaskTitle('');
                setNewTaskCategory('management');
                setNewBookingTarget('');
                setNewTargetRevenue('');
                setNewTargetLeadsCount('');
                setShowAddTaskModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Assign New Task</span>
            </button>
          </div>
        </div>

        {/* TEAM MEMBER / ROLE SELECTOR TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex-shrink-0">
            Select Active Role:
          </span>

          {selectorTeam.map((mem) => {
            const isSelected = mem.id === activeMemberId;
            let roleIcon = Users;
            if (mem.role === 'Studio Manager' || mem.role === 'Manager') roleIcon = Briefcase;
            if (mem.role === 'Sales Manager' || mem.role === 'Sales Executive' || mem.role === 'Sales Team') roleIcon = TrendingUp;
            if (mem.role === 'Social Media Handler') roleIcon = Share2;
            if (mem.role === 'Account Manager') roleIcon = PhoneCall;
            if (mem.role === 'Video Editor' || mem.role === 'Cinematographer') roleIcon = Video;
            if (mem.role === 'Photo Editor' || mem.role === 'Lead Photographer') roleIcon = ImageIcon;
            if (mem.role === 'Drone Operator') roleIcon = Sparkles;
            if (mem.role === 'Assistant' || mem.role === 'Other') roleIcon = Users;

            const Icon = roleIcon;

            return (
              <button
                key={mem.id}
                onClick={() => setActiveMemberId(mem.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                <span>{mem.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isSelected ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-900 text-slate-400'
                }`}>
                  {mem.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE EMPLOYEE LIVE DUTY PUNCH CARD & TIMER */}
      {activeMember && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Member Profile info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-indigo-300">
              {activeMember.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {activeMember.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {activeMember.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  In: <strong className="text-slate-900">{activeMember.inTime || '09:30 AM'}</strong> | Out: <strong className="text-slate-900">{activeMember.outTime || '07:30 PM'}</strong>
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700 font-mono">
                  Salary: ₹{(activeMember.monthlySalary || 45000).toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Timer Stopwatch */}
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Duty Session Clock
              </span>
              <span className="font-mono text-base font-black text-emerald-400">
                {formatShiftTime(shiftSeconds)}
              </span>
            </div>
          </div>

          {/* Right: Login & Logout Buttons */}
          <div className="flex items-center gap-3">
            {activeMember.workStatus === 'CLOCKED_OUT' ? (
              <button
                onClick={handleLoginClockIn}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition"
              >
                <UserCheck className="w-4 h-4 stroke-[3]" />
                <span>Clock In (Login Duty)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    alert(`✅ Logged in session active for ${activeMember.name}. Attendance recorded.`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 cursor-default"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Logged In (Active Duty)</span>
                </button>

                <button
                  onClick={handleLogoutClockOut}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Logout (Off Duty)</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSalaryMember(activeMember);
                setShowSalarySlipModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Salary Slip</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <RoleNotepadWidget key={`notepad-${activeMember?.id || activeMember?.role || 'default'}`} activeMember={activeMember} />
        <ManagerPersonalTodoWidget key={`todo-${activeMember?.id || activeMember?.role || 'default'}`} activeMember={activeMember} />
      </div>

      {/* ROLE DASHBOARD CONTENT (5 DISTINCT ROLE MODULES) */}
      
      {/* ------------------------------------------------------------- */}
      {/* ROLE 1: STUDIO MANAGER / GENERAL MANAGER DASHBOARD            */}
      {/* ------------------------------------------------------------- */}
      {(activeMember?.role === 'Studio Manager' || activeMember?.role === 'Manager') && (
        <div className="space-y-6">
          
          {/* Manager Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Manager Personal Attendance Log & Payout Table */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 2: SALES MANAGER & SALES EXECUTIVE DASHBOARD             */}
      {/* ------------------------------------------------------------- */}
      {(activeMember?.role === 'Sales Manager' || activeMember?.role === 'Sales Executive' || activeMember?.role === 'Sales Team') && (() => {
        const currentBookedLeads: OwnerLead[] = [];

        const salesClosedDealsCount = currentBookedLeads.length;
        const salesRevenueAchieved = currentBookedLeads.reduce((acc, l) => acc + (l.finalAmount || l.budgetEstimate || 0), 0);
        const salesAdvanceCollected = currentBookedLeads.reduce((acc, l) => acc + (l.advanceReceived !== undefined ? l.advanceReceived : 25000), 0);
        const salesBalancePending = Math.max(0, salesRevenueAchieved - salesAdvanceCollected);
        const salesProgressPercent = Math.min(100, Math.round((salesRevenueAchieved / (assignedSalesRevenueGoal || 1)) * 100));

        return (
          <div className="space-y-6">
            
            {/* Sales Target & Revenue Banner */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Sales Targets & Revenue Pipeline Tracker</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                    <span>
                      Monthly Sales Revenue Goal: <strong className="text-slate-800 font-mono">₹{assignedSalesRevenueGoal.toLocaleString('en-IN')}</strong> | Closed Deals Goal: <strong className="text-slate-800">{assignedSalesDealsGoal} Clients</strong>
                    </span>
                    {activeSalesTargetTask && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                        🎯 Assigned KPI: {activeSalesTargetTask.title}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowSalesModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Finalize Sale & Create Project</span>
                </button>
              </div>

              {/* Target Progress Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Monthly Target Progress ({salesProgressPercent}% Achieved)
                  </span>
                  <span className="font-mono text-emerald-700 text-sm">
                    ₹{salesRevenueAchieved.toLocaleString('en-IN')} / ₹{assignedSalesRevenueGoal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${salesProgressPercent}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                  <span>{salesClosedDealsCount} / {assignedSalesDealsGoal} Total Closed Deals</span>
                  <span>Advance Collected: <strong className="text-indigo-600 font-mono">₹{salesAdvanceCollected.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>

            {/* Sales KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Client Revenue Booked
                </span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  ₹{salesRevenueAchieved.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {salesClosedDealsCount} Active Booked Deals
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Advance Collections Received
                </span>
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  ₹{salesAdvanceCollected.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] font-bold text-indigo-700">
                  Secured Advance Payments
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Pending Balance Due
                </span>
                <div className="text-2xl font-black text-red-600 font-mono">
                  ₹{salesBalancePending.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] font-bold text-red-700">
                  Follow-up required
                </span>
              </div>
            </div>

          {/* Sales Actions & Client Followups */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Sales Lead Followups & Payment Collections
              </span>
              <button
                onClick={() => setShowSalesModal(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Convert Deal to Project
              </button>
            </h3>

            <div className="space-y-3">
              {projects.filter(p => p.balanceDue > 0).map((proj) => (
                <div key={proj.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{proj.clientWeddingTitle}</h4>
                    <p className="text-slate-500 font-medium">Phone: <strong className="text-slate-800 font-mono">{proj.clientContactMobile}</strong> • Venue: {proj.venueLocation}</p>
                    <p className="text-indigo-600 font-bold mt-0.5">Deadline: {proj.finalDeliveryDeadline}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance Due</span>
                      <span className="text-sm font-black text-red-600 font-mono">₹{proj.balanceDue.toLocaleString('en-IN')}</span>
                    </div>

                    <button
                      onClick={() => {
                        const msg = `Hello! Payment reminder for ${proj.clientWeddingTitle}. Balance Due: ₹${proj.balanceDue}. Thank you!`;
                        window.open(`https://wa.me/${(proj.clientContactMobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Payment Link</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Monthly Attendance Log Table */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 3: ACCOUNT MANAGER (AC MANAGER) DASHBOARD                 */}
      {/* ------------------------------------------------------------- */}
      {activeMember?.role === 'Account Manager' && (
        <div className="space-y-6">
          
          {/* Account Manager High Level KPI Command Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Client Accounts / Portfolio Value */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                Managed Client Portfolio Value
              </span>
              <div className="text-2xl font-black text-indigo-600 font-mono">
                ₹{projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {projects.length} Active Client Accounts
              </span>
            </div>

            {/* Total Client Collections Received */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                Total Client Income Collected
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ₹{projects.reduce((acc, p) => acc + (p.advanceReceived || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-bold text-emerald-700">
                Advances & Installments Recd.
              </span>
            </div>

            {/* Total Pending Client Balances */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pending Client Balances
              </span>
              <div className="text-2xl font-black text-amber-600 font-mono">
                ₹{projects.reduce((acc, p) => acc + (p.balanceDue || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-bold text-amber-700">
                Pending Billing Follow-ups
              </span>
            </div>

            {/* Selected Month Office Expenses */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-red-600" />
                Monthly Office Expenses ({selectedFinancialMonth})
              </span>
              <div className="text-2xl font-black text-red-600 font-mono">
                ₹{officeExpenses.filter(isExpenseInSelectedPeriod).reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Rent, Bills, Fuel & Maintenance
              </span>
            </div>
          </div>

          {/* Account Manager Sub-Navigation Bar */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAcManagerSubTab('clients')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'clients'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Client AC Management ({projects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('tasks')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'tasks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>All Tasks & Deliverables ({projects.reduce((acc, p) => acc + getProjectTasks(p).length, 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('payments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'payments'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Monthly Payment Received</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('expenses')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'expenses'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Monthly Office Expenses</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('salaries')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'salaries'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Staff Salary Ledger ({team.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('pnl')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'pnl'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Studio P&L & Cash Flow</span>
              </button>

              <button
                type="button"
                onClick={() => setAcManagerSubTab('attendance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  acManagerSubTab === 'attendance'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>My Attendance & Shift</span>
              </button>
            </div>

            {/* Financial Month & Date Range Switcher Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-100/90 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Date Range:</span>
                </span>

                {/* Quick Month Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFinancialMonth('All Time');
                      setFinFromDate('');
                      setFinToDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition cursor-pointer ${
                      !finFromDate && !finToDate
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    🌐 All Time
                  </button>
                </div>
              </div>

              {/* Custom Date Range Picker Inputs */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 ml-auto">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">From:</span>
                <input
                  type="date"
                  value={finFromDate}
                  onChange={(e) => {
                    setFinFromDate(e.target.value);
                    if (e.target.value) setSelectedFinancialMonth(e.target.value.substring(0, 7));
                  }}
                  className="text-[11px] font-mono font-bold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-indigo-600"
                />
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">To:</span>
                <input
                  type="date"
                  value={finToDate}
                  onChange={(e) => setFinToDate(e.target.value)}
                  className="text-[11px] font-mono font-bold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-indigo-600"
                />
                {(finFromDate || finToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFinFromDate('');
                      setFinToDate('');
                      setSelectedFinancialMonth('All Time');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-extrabold px-1.5 py-0.5 rounded cursor-pointer ml-1"
                    title="Clear date filter to show All Time"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SUB-TAB 1: CLIENT ACCOUNTS & BILLING */}
          {acManagerSubTab === 'clients' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-indigo-600" />
                    <span>Client Accounts & Billing Tracker ({projects.length} Active Accounts)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Manage client contract budgets, track advance collections, and record monthly payment receipts
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (projects.length > 0) {
                      setSelectedProjectForPayment(projects[0]);
                      setClientPaymentAmount(projects[0].balanceDue > 0 ? projects[0].balanceDue : 25000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Monthly Client Payment</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => {
                  const isEditing = editingAccountId === p.id;
                  const totalPaidPct = p.totalBudget ? Math.min(100, Math.round(((p.advanceReceived || 0) / p.totalBudget) * 100)) : 0;

                  return (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 
                            onClick={() => onSelectProject?.(p, 'Account Manager')}
                            className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition flex items-center gap-1.5"
                            title="Click to view full project details, vault & payments"
                          >
                            <span>{p.clientWeddingTitle}</span>
                            <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">Contact: <strong className="text-slate-800 font-mono">{p.clientContactMobile}</strong></p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Venue: {p.venueLocation || 'Delhi NCR'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                            {p.primaryServiceType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            p.balanceDue === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.balanceDue === 0 ? 'Paid in Full' : 'Partial Payment'}
                          </span>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Collection Progress</span>
                          <span className="font-mono text-indigo-600">{totalPaidPct}% Collected</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${totalPaidPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${totalPaidPct}%` }}
                          />
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 text-xs">
                          <div className="font-extrabold text-indigo-900 border-b border-indigo-100 pb-1">
                            Update Financial Account Details
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Total Contract Budget (₹)</label>
                            <input
                              type="number"
                              value={accTotalBudget}
                              onChange={(e) => setAccTotalBudget(Number(e.target.value))}
                              className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Advance Received (₹)</label>
                            <input
                              type="number"
                              value={accAdvance}
                              onChange={(e) => setAccAdvance(Number(e.target.value))}
                              className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 font-bold text-slate-700">
                            <span>Calculated Balance Due:</span>
                            <span className="font-mono text-red-600 text-sm">₹{Math.max(0, accTotalBudget - accAdvance).toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveAccountFinancials(p.id)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                            >
                              Save Account
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAccountId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Contract Budget:</span>
                            <span className="font-mono font-bold text-slate-900">₹{p.totalBudget?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Advance Paid:</span>
                            <span className="font-mono font-bold text-emerald-600">₹{p.advanceReceived?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Balance Due:</span>
                            <span className="font-mono font-bold text-red-600">₹{p.balanceDue?.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Receipts History Log */}
                          {p.payments && p.payments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Recent Receipts Log:</span>
                              {p.payments.slice(-2).map((pay) => (
                                <div key={pay.id} className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                  <span>{pay.date} ({pay.paymentMode}):</span>
                                  <span className="font-mono font-bold text-emerald-700">+₹{pay.amount.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Client Deliverables & Tasks Quick Summary Box */}
                      <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-indigo-100/80 pb-1 text-[11px] font-extrabold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Client Deliverables & Tasks</span>
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                            {getProjectTasks(p).length} Tasks
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                          {getProjectTasks(p).map((task, tidx) => (
                            <div key={task.id || tidx} className="bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between text-[10px]">
                              <div className="truncate pr-1">
                                <span className="font-bold text-slate-800 block truncate">{task.taskName}</span>
                                <span className="text-slate-400 font-medium">{task.assignedTo || 'Unassigned'}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 text-[9px] ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                (task.status === 'client_review' || task.status === 'revision') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.status ? task.status.replace(/_/g, ' ') : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProject?.(p, 'Account Manager')}
                          className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectProject?.(p, 'Account Manager')}
                          className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1 transition"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>All Client Tasks</span>
                        </button>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccountId(p.id);
                              setAccTotalBudget(p.totalBudget || 0);
                              setAccAdvance(p.advanceReceived || 0);
                            }}
                            className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Budget</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectForPayment(p);
                            setClientPaymentAmount(p.balanceDue > 0 ? p.balanceDue : 25000);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Hello ${p.clientWeddingTitle}, this is ${activeMember.name} (Account Manager). Checking in regarding your wedding project deliverables and billing status. Balance Due: ₹${p.balanceDue}. Thank you!`;
                            window.open(`https://wa.me/${(p.clientContactMobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp Billing</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly Client Payment Receipts Ledger Table */}
              <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>Monthly Client Payments Received Ledger ({formatDateDash(finFromDate)} To {formatDateDash(finToDate)})</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      All client advance bookings, installments & final payments logged in {selectedFinancialMonth}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Month Income</span>
                      <span className="text-lg font-black font-mono text-emerald-700">₹{acTotalMonthIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (projects.length > 0) {
                          setSelectedProjectForPayment(projects[0]);
                          setClientPaymentAmount(projects[0].balanceDue > 0 ? projects[0].balanceDue : 25000);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log New Payment Entry</span>
                    </button>
                  </div>
                </div>

                {acMonthlyPayments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-500">No client payment receipts logged for {selectedFinancialMonth} yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (projects.length > 0) {
                          setSelectedProjectForPayment(projects[0]);
                          setClientPaymentAmount(projects[0].balanceDue > 0 ? projects[0].balanceDue : 25000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Payment Receipt</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-extrabold">
                          <th className="p-3">Receipt Ref & Date</th>
                          <th className="p-3">Client / Wedding Account</th>
                          <th className="p-3">Category & Mode</th>
                          <th className="p-3 text-right">Amount Received</th>
                          <th className="p-3">Notes</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {acMonthlyPayments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 font-mono">{pay.receiptNumber || 'REC-INCOME'}</div>
                              <div className="text-[11px] text-slate-500">{pay.date}</div>
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              <div>{pay.projectTitle}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{pay.clientContact}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 mr-1.5">
                                {pay.type || 'installment'}
                              </span>
                              <span className="text-slate-600 text-[11px] font-semibold">{pay.paymentMode}</span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                              +₹{pay.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs truncate text-[11px]">
                              {pay.notes || 'Monthly client collection'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const msg = `🧾 *OFFICIAL PAYMENT RECEIPT*\nRef: ${pay.receiptNumber || 'REC-INCOME'}\nDate: ${pay.date}\nClient: ${pay.projectTitle}\nAmount Received: ₹${pay.amount.toLocaleString('en-IN')}\nPayment Mode: ${pay.paymentMode}\nNotes: ${pay.notes || 'Thank you!'}\n\n- ${BRAND.name} Accounting Portal`;
                                    window.open(`https://wa.me/${(pay.clientContact || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                  title="Share Receipt on WhatsApp"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Receipt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentToDelete({ projectId: pay.projectId, paymentId: pay.id, title: pay.projectTitle || 'Payment Entry', amount: pay.amount })}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                                  title="Delete Payment Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB: ALL STUDIO TASKS & DELIVERABLES */}
          {acManagerSubTab === 'tasks' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* Header Banner & Summary */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                    <span>All Studio Tasks & Client Deliverables Tracker</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Monitor, reassign staff & update delivery statuses for Teasers, Reels, Wedding Films, Photo Retouching & Albums across all active client projects
                  </p>
                </div>

                {/* KPI Pill Summary */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Deliverables</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {projects.reduce((acc, p) => acc + getProjectTasks(p).length, 0)}
                    </span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-blue-500 uppercase block">In Progress</span>
                    <span className="text-sm font-black text-blue-700 font-mono">
                      {projects.reduce((acc, p) => acc + getProjectTasks(p).filter(t => t.status === 'in_progress').length, 0)}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-amber-500 uppercase block">Under Review</span>
                    <span className="text-sm font-black text-amber-700 font-mono">
                      {projects.reduce((acc, p) => acc + getProjectTasks(p).filter(t => t.status === 'client_review' || t.status === 'revision').length, 0)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase block">Completed</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {projects.reduce((acc, p) => acc + getProjectTasks(p).filter(t => t.status === 'completed').length, 0)}
                    </span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase block">Total Package</span>
                    <span className="text-sm font-black text-purple-900 font-mono">
                      ₹{projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-extrabold text-rose-500 uppercase block">Pending Due</span>
                    <span className="text-sm font-black text-rose-700 font-mono">
                      ₹{Math.max(0, projects.reduce((acc, p) => {
                        const paid = p.payments && p.payments.length > 0 ? p.payments.reduce((sum, x) => sum + x.amount, 0) : (p.advanceReceived || 0);
                        return acc + ((p.totalBudget || 0) - paid);
                      }, 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters Bar: Search & Status Dropdown */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search by client, task name, staff..."
                    value={acTaskSearch}
                    onChange={(e) => setAcTaskSearch(e.target.value)}
                    className="w-full pl-3 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-indigo-600 shadow-2xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">Type:</span>
                    <select
                      value={acTaskTypeFilter}
                      onChange={(e) => setAcTaskTypeFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-indigo-600 shadow-2xs"
                    >
                      <option value="all">All Deliverables</option>
                      <option value="teaser">Teasers & Highlights</option>
                      <option value="reels">Instagram Reels / Shorts</option>
                      <option value="film">Wedding Films / Long Videos</option>
                      <option value="photo">Photo Retouching</option>
                      <option value="album">Wedding Albums (Print)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">Status:</span>
                    <select
                      value={acTaskStatusFilter}
                      onChange={(e) => setAcTaskStatusFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-indigo-600 shadow-2xs"
                    >
                      <option value="all">All Statuses</option>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="client_review">Under Review</option>
                      <option value="revision">Revision Required</option>
                      <option value="completed">Completed / Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Projects Task List Cards */}
              <div className="space-y-4">
                {projects.map((p) => {
                  const tasksForProject = getProjectTasks(p).filter((t) => {
                    const searchLower = acTaskSearch.toLowerCase();
                    const matchesSearch =
                      !acTaskSearch ||
                      p.clientWeddingTitle.toLowerCase().includes(searchLower) ||
                      (t.taskName && t.taskName.toLowerCase().includes(searchLower)) ||
                      (t.assignedTo && t.assignedTo.toLowerCase().includes(searchLower));

                    const matchesStatus =
                      acTaskStatusFilter === 'all' || t.status === acTaskStatusFilter;

                    const matchesType =
                      acTaskTypeFilter === 'all' ||
                      (acTaskTypeFilter === 'teaser' && t.taskName.toLowerCase().includes('teaser')) ||
                      (acTaskTypeFilter === 'reels' && (t.taskName.toLowerCase().includes('reel') || t.taskName.toLowerCase().includes('short'))) ||
                      (acTaskTypeFilter === 'film' && (t.taskName.toLowerCase().includes('film') || t.taskName.toLowerCase().includes('long'))) ||
                      (acTaskTypeFilter === 'photo' && (t.taskName.toLowerCase().includes('photo') || t.taskName.toLowerCase().includes('retouch'))) ||
                      (acTaskTypeFilter === 'album' && t.taskName.toLowerCase().includes('album'));

                    return matchesSearch && matchesStatus && matchesType;
                  });

                  if (tasksForProject.length === 0) return null;

                  const pTotal = p.totalBudget || 0;
                  const pPaid = p.payments && p.payments.length > 0
                    ? p.payments.reduce((acc, x) => acc + x.amount, 0)
                    : (p.advanceReceived || 0);
                  const pBalance = Math.max(0, pTotal - pPaid);
                  const isFullyPaid = pBalance === 0;

                  return (
                    <div key={p.id} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                      {/* Project Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">{p.clientWeddingTitle}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 uppercase">
                              {p.primaryServiceType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Contact: <strong className="text-slate-800 font-mono">{p.clientContactMobile}</strong> • Deadline: <strong className="text-indigo-700 font-mono">{p.finalDeliveryDeadline || 'On Schedule'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `Hello ${p.clientWeddingTitle}, checking in regarding your project deliverables and editing progress. Thank you!`;
                              window.open(`https://wa.me/${(p.clientContactMobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp Client</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectProject?.(p, 'Account Manager')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Project Hub & Tasks</span>
                          </button>
                        </div>
                      </div>

                      {/* Client Payment Details Strip */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Wallet className="w-4 h-4 text-indigo-600" />
                            <span className="font-black text-slate-600 uppercase text-[10px] tracking-tight">Payment Status:</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total Package</span>
                              <span className="font-black text-slate-900 font-mono">₹{pTotal.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[9px] font-extrabold text-emerald-600 uppercase block">Received</span>
                              <span className="font-black text-emerald-700 font-mono">₹{pPaid.toLocaleString('en-IN')}</span>
                            </div>

                            <div className={`px-2.5 py-1 rounded-lg border ${
                              isFullyPaid
                                ? 'bg-slate-50 border-slate-200 text-slate-600'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}>
                              <span className="text-[9px] font-extrabold uppercase block">Balance Due</span>
                              <span className="font-black font-mono">₹{pBalance.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isFullyPaid ? 'Fully Paid ✓' : `Balance Due: ₹${pBalance.toLocaleString('en-IN')}`}
                          </span>

                          {!isFullyPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `Hello ${p.clientWeddingTitle}, this is ${activeMember.name} (Account Manager). Friendly reminder regarding your pending project balance of ₹${pBalance.toLocaleString('en-IN')}. Total Budget: ₹${pTotal.toLocaleString('en-IN')}, Paid: ₹${pPaid.toLocaleString('en-IN')}. Thank you!`;
                                window.open(`https://wa.me/${(p.clientContactMobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Payment Reminder</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tasks Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {tasksForProject.map((task, tIdx) => (
                          <div key={task.id || tIdx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs hover:border-indigo-200 transition">
                            <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs block leading-tight">{task.taskName}</span>
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                                  Quantity: {task.quantity || 1} {task.unit || 'Pcs'}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                (task.status === 'client_review' || task.status === 'revision') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.status ? task.status.replace(/_/g, ' ') : 'Not Started'}
                              </span>
                            </div>

                            {/* Reassign Staff & Update Status Controls */}
                            <div className="space-y-1.5 pt-0.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase">Assignee:</span>
                                <select
                                  value={task.assignedTo || ''}
                                  onChange={(e) => handleUpdateProjectTaskStatus(p, task.id, tIdx, task.status, e.target.value)}
                                  className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 text-right focus:outline-indigo-600 cursor-pointer"
                                >
                                  <option value="">Unassigned</option>
                                  {team.map((m) => (
                                    <option key={m.id} value={m.name}>
                                      {m.name} ({m.role})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase">Status:</span>
                                <select
                                  value={task.status || 'not_started'}
                                  onChange={(e) => handleUpdateProjectTaskStatus(p, task.id, tIdx, e.target.value as EditingStatus)}
                                  className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 text-right focus:outline-indigo-600 cursor-pointer"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="client_review">Under Review</option>
                                  <option value="revision">Revision Required</option>
                                  <option value="completed">Completed / Delivered</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB: MONTHLY CLIENT PAYMENTS RECEIVED */}
          {acManagerSubTab === 'payments' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
              {/* Header & Quick Record Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    <span>Monthly Client Payments Received Ledger ({selectedFinancialMonth})</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Record, track & issue receipts for client booking advances, mid-shoot installments, and final project settlements
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (projects.length > 0) {
                      setSelectedProjectForPayment(projects[0]);
                      setClientPaymentAmount(projects[0].balanceDue > 0 ? projects[0].balanceDue : 25000);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Record New Client Payment</span>
                </button>
              </div>

              {/* Monthly KPI Metrics Cards */}
              {(() => {
                const monthlyPayments = projects.flatMap((p) => {
                  const pPayments = (p.payments && p.payments.length > 0)
                    ? p.payments
                    : (p.advanceReceived && p.advanceReceived > 0)
                      ? [{
                          id: `pay-auto-${p.id}`,
                          date: p.createdAt || '2026-08-01',
                          amount: p.advanceReceived,
                          type: 'advance' as const,
                          paymentMode: 'UPI / Bank Transfer',
                          receiptNumber: `REC-${p.id.slice(-4).toUpperCase()}`,
                          notes: 'Booking advance received',
                        }]
                      : [];

                  return pPayments.map((pay) => ({
                    ...pay,
                    projectTitle: p.clientWeddingTitle,
                    clientContact: p.clientContactMobile,
                    projectId: p.id,
                  }));
                }).filter((pay) => isDateInRange(pay.date, finFromDate, finToDate));

                const totalMonthIncome = monthlyPayments.reduce((acc, pay) => acc + pay.amount, 0);
                const advancePayments = monthlyPayments.filter((p) => p.type === 'advance');
                const installmentPayments = monthlyPayments.filter((p) => p.type === 'installment' || (!p.type && p.type !== 'advance' && p.type !== 'final' && p.type !== 'other'));
                const finalPayments = monthlyPayments.filter((p) => p.type === 'final');
                const otherPayments = monthlyPayments.filter((p) => p.type === 'other');

                const totalAdvances = advancePayments.reduce((acc, p) => acc + p.amount, 0);
                const totalInstallments = installmentPayments.reduce((acc, p) => acc + p.amount, 0);
                const totalFinals = finalPayments.reduce((acc, p) => acc + p.amount, 0);
                const totalOthers = otherPayments.reduce((acc, p) => acc + p.amount, 0);

                const filteredPayments = monthlyPayments.filter((pay) => {
                  if (paymentTypeFilter === 'all') return true;
                  if (paymentTypeFilter === 'installment') return pay.type === 'installment' || (!pay.type && pay.type !== 'advance' && pay.type !== 'final' && pay.type !== 'other');
                  return pay.type === paymentTypeFilter;
                });

                return (
                  <div className="space-y-6">
                    {/* Interactive Tracking & Category Breakdown Summary Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📊 Category Tracking & Ledger Breakdown</span>
                          {paymentTypeFilter !== 'all' && (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              Tracking: {paymentTypeFilter.toUpperCase()}
                            </span>
                          )}
                        </span>
                        {paymentTypeFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setPaymentTypeFilter('all')}
                            className="text-[11px] text-slate-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                          >
                            Reset Filter (Show All)
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Total Received */}
                        <div
                          onClick={() => setPaymentTypeFilter('all')}
                          className={`p-3.5 rounded-xl transition cursor-pointer transform hover:-translate-y-0.5 ${
                            paymentTypeFilter === 'all'
                              ? 'bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300'
                              : 'bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block">Total Received</span>
                            {paymentTypeFilter === 'all' && <span className="text-[9px] font-black bg-emerald-700 text-white px-1.5 py-0.2 rounded-full">Active</span>}
                          </div>
                          <div className="text-xl font-black text-emerald-800 font-mono mt-1">₹{totalMonthIncome.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] font-extrabold text-emerald-700 mt-1 flex justify-between">
                            <span>{monthlyPayments.length} Total Receipts</span>
                            <span>100%</span>
                          </div>
                          <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full w-full"></div>
                          </div>
                        </div>

                        {/* Booking Advances */}
                        <div
                          onClick={() => setPaymentTypeFilter('advance')}
                          className={`p-3.5 rounded-xl transition cursor-pointer transform hover:-translate-y-0.5 ${
                            paymentTypeFilter === 'advance'
                              ? 'bg-blue-100/90 border-2 border-blue-500 shadow-md ring-2 ring-blue-300'
                              : 'bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Booking Advances</span>
                            {paymentTypeFilter === 'advance' && <span className="text-[9px] font-black bg-blue-700 text-white px-1.5 py-0.2 rounded-full">Active</span>}
                          </div>
                          <div className="text-lg font-black text-slate-900 font-mono mt-1">₹{totalAdvances.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] font-bold text-slate-600 mt-1 flex justify-between">
                            <span>{advancePayments.length} Receipts</span>
                            <span>{totalMonthIncome > 0 ? Math.round((totalAdvances / totalMonthIncome) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${totalMonthIncome > 0 ? (totalAdvances / totalMonthIncome) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Installments Received */}
                        <div
                          onClick={() => setPaymentTypeFilter('installment')}
                          className={`p-3.5 rounded-xl transition cursor-pointer transform hover:-translate-y-0.5 ${
                            paymentTypeFilter === 'installment'
                              ? 'bg-amber-100/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-300'
                              : 'bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Installments</span>
                            {paymentTypeFilter === 'installment' && <span className="text-[9px] font-black bg-amber-700 text-white px-1.5 py-0.2 rounded-full">Active</span>}
                          </div>
                          <div className="text-lg font-black text-slate-900 font-mono mt-1">₹{totalInstallments.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] font-bold text-slate-600 mt-1 flex justify-between">
                            <span>{installmentPayments.length} Receipts</span>
                            <span>{totalMonthIncome > 0 ? Math.round((totalInstallments / totalMonthIncome) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-amber-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${totalMonthIncome > 0 ? (totalInstallments / totalMonthIncome) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Final Settlements */}
                        <div
                          onClick={() => setPaymentTypeFilter('final')}
                          className={`p-3.5 rounded-xl transition cursor-pointer transform hover:-translate-y-0.5 ${
                            paymentTypeFilter === 'final'
                              ? 'bg-purple-100/90 border-2 border-purple-500 shadow-md ring-2 ring-purple-300'
                              : 'bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Final Settlements</span>
                            {paymentTypeFilter === 'final' && <span className="text-[9px] font-black bg-purple-700 text-white px-1.5 py-0.2 rounded-full">Active</span>}
                          </div>
                          <div className="text-lg font-black text-slate-900 font-mono mt-1">₹{totalFinals.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] font-bold text-slate-600 mt-1 flex justify-between">
                            <span>{finalPayments.length} Receipts</span>
                            <span>{totalMonthIncome > 0 ? Math.round((totalFinals / totalMonthIncome) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${totalMonthIncome > 0 ? (totalFinals / totalMonthIncome) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Client Balances Quick-Action Section */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Quick Record Payment for Clients with Balance Due</span>
                        </h4>
                        <span className="text-[11px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          {projects.filter(p => p.balanceDue > 0).length} Clients Balance Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projects.map((p) => {
                          const hasDue = p.balanceDue > 0;
                          return (
                            <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-extrabold text-slate-900 text-xs">{p.clientWeddingTitle}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{p.clientContactMobile}</div>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hasDue ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {hasDue ? `Due: ₹${p.balanceDue.toLocaleString('en-IN')}` : 'Fully Paid'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1.5 font-bold">
                                <span>Budget: ₹{p.totalBudget.toLocaleString('en-IN')}</span>
                                <span>Received: ₹{(p.advanceReceived || 0).toLocaleString('en-IN')}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProjectForPayment(p);
                                  setClientPaymentAmount(p.balanceDue > 0 ? p.balanceDue : 10000);
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-extrabold text-xs transition border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Record Payment Entry</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Monthly Payments Receipts Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-600" />
                          <span>
                            {paymentTypeFilter === 'all'
                              ? `All Monthly Payment Receipts Ledger (${selectedFinancialMonth})`
                              : `${paymentTypeFilter.toUpperCase()} Payment Receipts (${selectedFinancialMonth})`}
                          </span>
                        </h4>
                        <div className="flex items-center gap-2">
                          {paymentTypeFilter !== 'all' && (
                            <button
                              type="button"
                              onClick={() => setPaymentTypeFilter('all')}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold cursor-pointer"
                            >
                              ✕ Reset Filter
                            </button>
                          )}
                          <span className="text-[11px] font-bold text-slate-500">
                            Showing {filteredPayments.length} of {monthlyPayments.length} Receipts
                          </span>
                        </div>
                      </div>

                      {filteredPayments.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-slate-500">
                            {paymentTypeFilter === 'all'
                              ? `No client payment receipts logged for ${selectedFinancialMonth} yet.`
                              : `No "${paymentTypeFilter.toUpperCase()}" receipts found for ${selectedFinancialMonth}.`}
                          </p>
                          {paymentTypeFilter !== 'all' ? (
                            <button
                              type="button"
                              onClick={() => setPaymentTypeFilter('all')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              Show All Receipts
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (projects.length > 0) {
                                  setSelectedProjectForPayment(projects[0]);
                                  setClientPaymentAmount(projects[0].balanceDue > 0 ? projects[0].balanceDue : 25000);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Record First Payment Receipt</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-extrabold">
                                <th className="p-3">Receipt Ref & Date</th>
                                <th className="p-3">Client / Wedding Account</th>
                                <th className="p-3">Category & Payment Mode</th>
                                <th className="p-3 text-right">Amount Received</th>
                                <th className="p-3">Notes</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {filteredPayments.map((pay) => (
                                <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                                  <td className="p-3 font-mono font-bold">
                                    <div className="font-extrabold text-slate-900 font-mono">{pay.receiptNumber || 'REC-INCOME'}</div>
                                    <div className="text-[11px] text-slate-500">{pay.date}</div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-900">
                                    <div>{pay.projectTitle}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{pay.clientContact}</div>
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5 ${
                                        pay.type === 'advance'
                                          ? 'bg-blue-100 text-blue-800'
                                          : pay.type === 'final'
                                          ? 'bg-purple-100 text-purple-800'
                                          : pay.type === 'other'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {pay.type || 'installment'}
                                    </span>
                                    <span className="text-slate-600 text-[11px] font-semibold">{pay.paymentMode}</span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                                    +₹{pay.amount.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3 text-slate-600 max-w-xs truncate text-[11px]">
                                    {pay.notes || 'Monthly client collection'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const msg = `🧾 *OFFICIAL PAYMENT RECEIPT*\nRef: ${pay.receiptNumber || 'REC-INCOME'}\nDate: ${pay.date}\nClient: ${pay.projectTitle}\nAmount Received: ₹${pay.amount.toLocaleString('en-IN')}\nPayment Mode: ${pay.paymentMode}\nNotes: ${pay.notes || 'Thank you!'}\n\n- ${BRAND.name} Accounting Portal`;
                                          window.open(`https://wa.me/${(pay.clientContact || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                        title="Share Receipt on WhatsApp"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>Receipt</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPaymentToDelete({ projectId: pay.projectId, paymentId: pay.id, title: pay.projectTitle || 'Payment Entry', amount: pay.amount })}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                                        title="Delete Payment Entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 2: MONTHLY OFFICE EXPENSES */}
          {acManagerSubTab === 'expenses' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>Monthly Office & Studio Expenses Ledger ({selectedFinancialMonth})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Owner, Manager & Account Manager Monthly Office Bills, Rent, Fuel, Equipment & Tea/Snacks Expenses
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Log New Office Expense</span>
                </button>
              </div>

              {/* Category Wise Expense Breakdown View (Exact Format Requested) */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>Monthly Expense Breakdown ({selectedFinancialMonth})</span>
                  </h4>
                  <span className="text-xs font-extrabold font-mono text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    Total: <span className="text-red-600 font-bold">₹{officeExpenses.filter(isExpenseInSelectedPeriod).reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-xs">
                  {[
                    'Rent',
                    'Electricity & Water',
                    'Studio Equipment & Repair',
                    'Food & Tea/Chai',
                    'Travel & Fuel',
                    'Software & Subscriptions',
                    'Marketing & Ads',
                    'Exposing & Operating'
                  ].map((cat) => {
                    const amt = officeExpenses
                      .filter(e => isExpenseInSelectedPeriod(e) && e.category === cat)
                      .reduce((a, e) => a + e.amount, 0);
                    return (
                      <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-200/50 text-slate-800">
                        <span className="text-slate-700 font-semibold">{cat}:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹{amt.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters for Expenses */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-500 text-[11px]">Category:</span>
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold text-xs"
                  >
                    <option value="all">All Categories</option>
                    <option value="Rent">Rent</option>
                    <option value="Electricity & Water">Electricity & Water</option>
                    <option value="Studio Equipment & Repair">Equipment & Repair</option>
                    <option value="Food & Tea/Chai">Food & Tea/Chai</option>
                    <option value="Travel & Fuel">Travel & Fuel</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Exposing & Operating">Exposing & Operating</option>
                    <option value="Albums Print">Albums Print</option>
                    <option value="Photo & Video Edit">Photo & Video Edit</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                    <option value="Other">Other</option>
                    {Array.from(new Set<string>(officeExpenses.map(e => String(e.category))))
                      .filter((c: string) => !['Rent', 'Electricity & Water', 'Studio Equipment & Repair', 'Food & Tea/Chai', 'Travel & Fuel', 'Software & Subscriptions', 'Marketing & Ads', 'Exposing & Operating', 'Albums Print', 'Photo & Video Edit', 'Miscellaneous', 'Other'].includes(c))
                      .map(customCat => (
                        <option key={customCat} value={customCat}>{customCat}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-500 text-[11px]">Spent By:</span>
                  <select
                    value={expenseSpentByFilter}
                    onChange={(e) => setExpenseSpentByFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold text-xs"
                  >
                    <option value="all">All Persons / Roles</option>
                    <option value="Owner">Spent by Owner</option>
                    <option value="Studio Manager">Spent by Studio Manager</option>
                    <option value="Account Manager">Spent by Account Manager</option>
                    <option value="Other Staff">Spent by Other Staff</option>
                    {Array.from(new Set<string>(officeExpenses.map(e => String(e.spentBy))))
                      .filter((sb: string) => !['Owner', 'Studio Manager', 'Account Manager', 'Other Staff'].includes(sb))
                      .map(customSb => (
                        <option key={customSb} value={customSb}>{customSb}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="font-mono font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  Total Month Expense: <span className="text-red-600">₹{officeExpenses
                    .filter(isExpenseInSelectedPeriod)
                    .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                    .filter(e => expenseSpentByFilter === 'all' || e.spentBy === expenseSpentByFilter)
                    .reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Office Expense Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Expense Date</th>
                      <th className="p-3">Expense Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Spent By</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {officeExpenses
                      .filter(isExpenseInSelectedPeriod)
                      .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                      .filter(e => expenseSpentByFilter === 'all' || e.spentBy === expenseSpentByFilter)
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap">{exp.expenseDate}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{exp.title}</div>
                            {exp.notes && <div className="text-[11px] text-slate-500">{exp.notes}</div>}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-md">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[11px] rounded-md">
                              {exp.spentBy}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-red-600 text-sm whitespace-nowrap">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {officeExpenses
                      .filter(isExpenseInSelectedPeriod)
                      .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                      .filter(e => expenseSpentByFilter === 'all' || e.spentBy === expenseSpentByFilter)
                      .length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                          No office expenses logged for {selectedFinancialMonth}. Click "Log New Office Expense" above to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: ALL STAFF SALARY LEDGER */}
          {acManagerSubTab === 'salaries' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>All Staff Salary & Payout Hisab Ledger ({selectedFinancialMonth})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Calculated Earned Pay based on Attendance Days Worked, Base Monthly Salary, Advances & Payouts
                  </p>
                </div>
              </div>

              {/* Staff Salary Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Base Pay Rate</th>
                      <th className="p-3">Days Worked</th>
                      <th className="p-3">Calculated Earned Pay</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {team.map((mem) => {
                      // Filter attendance for selected month
                      const memAtt = attendance.filter(
                        a => a.teamMemberId === mem.id && a.date.startsWith(selectedFinancialMonth)
                      );
                      const fullDays = memAtt.filter(a => a.status === 'present_office' || a.status === 'present_shoot').length;
                      const halfDays = memAtt.filter(a => a.status === 'half_day').length;

                      // Base calculation
                      const baseMonthly = mem.monthlySalary || (mem.dailyRate ? mem.dailyRate * 26 : 40000);
                      const perDayRate = Math.round(baseMonthly / 26);
                      const earnedSalary = Math.round((fullDays * perDayRate) + (halfDays * (perDayRate / 2)));

                      return (
                        <tr key={mem.id} className="hover:bg-slate-50 transition">
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900 text-sm">{mem.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{mem.phone}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {mem.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-slate-800">₹{baseMonthly.toLocaleString('en-IN')}/mo</div>
                            <div className="text-[10px] text-slate-400">₹{perDayRate}/day</div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-700">{fullDays} Full Days</span>
                            {halfDays > 0 && <span className="text-amber-700 font-bold ml-1">+ {halfDays} Half</span>}
                          </td>
                          <td className="p-3 font-mono font-black text-emerald-700 text-sm">
                            ₹{(earnedSalary > 0 ? earnedSalary : baseMonthly).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                              Processed
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSalaryDisburseMember(mem);
                                setSalaryDisburseAmount(earnedSalary > 0 ? earnedSalary : baseMonthly);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 mx-auto"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay Salary</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: STUDIO FINANCIAL P&L STATEMENT */}
          {acManagerSubTab === 'pnl' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Studio Overall Financial Profit & Loss (P&L) Statement ({formatDateDash(finFromDate)} To {formatDateDash(finToDate)})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Total Client Collections vs Total Monthly Office Expenses & Staff Salary Disbursements
                  </p>
                </div>
              </div>

              {(() => {
                const monthlyIncomeCollected = projects
                  .flatMap((p) => p.payments || [])
                  .filter((pay) => isDateInRange(pay.date, finFromDate, finToDate))
                  .reduce((acc, pay) => acc + pay.amount, 0);
                const totalIncome = monthlyIncomeCollected > 0 ? monthlyIncomeCollected : projects.reduce((acc, p) => acc + (p.advanceReceived || 0), 0);
                const monthExpenses = officeExpenses.filter(e => isDateInRange(e.expenseDate, finFromDate, finToDate)).reduce((acc, e) => acc + e.amount, 0);
                const totalBaseSalaries = team.reduce((acc, m) => acc + (m.monthlySalary || (m.dailyRate ? m.dailyRate * 26 : 40000)), 0);
                const netProfit = totalIncome - (monthExpenses + totalBaseSalaries);
                const isProfitable = netProfit >= 0;

                return (
                  <div className="space-y-5">
                    {/* Visual Profit Command Banner */}
                    <div className={`p-5 rounded-2xl border ${isProfitable ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'} space-y-3`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            Studio Net Cash Flow / Operating Profit
                          </span>
                          <div className={`text-3xl font-black font-mono ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
                            ₹{netProfit.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          isProfitable ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                        }`}>
                          {isProfitable ? '🔥 Cash Flow Positive / Profitable' : '⚠️ Deficit / Collection Follow-up Needed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-extrabold">
                        <div className="p-3 bg-white/90 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase">Gross Client Income Collected:</span>
                          <span className="font-mono text-emerald-700 text-lg">₹{totalIncome.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3 bg-white/90 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase">Less: Monthly Office Expenses:</span>
                          <span className="font-mono text-red-600 text-lg">₹{monthExpenses.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3 bg-white/90 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase">Less: Total Staff Salaries:</span>
                          <span className="font-mono text-purple-700 text-lg">₹{totalBaseSalaries.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Chart/Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">
                          Office Expenses Category Breakdown
                        </h4>
                        {['Rent', 'Electricity & Water', 'Studio Equipment & Repair', 'Food & Tea/Chai', 'Travel & Fuel', 'Software & Subscriptions', 'Marketing & Ads', 'Exposing & Operating', 'Albums Print', 'Photo & Video Edit'].map((cat) => {
                          const amt = officeExpenses.filter(e => isExpenseInSelectedPeriod(e) && e.category === cat).reduce((a, e) => a + e.amount, 0);
                          return (
                            <div key={cat} className="flex justify-between items-center text-slate-700 py-0.5">
                              <span className="font-semibold text-slate-800">{cat}:</span>
                              <span className="font-mono font-bold text-slate-900 text-sm">₹{amt.toLocaleString('en-IN')}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                          Account Collections Summary
                        </h4>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Total Contracted Deals:</span>
                          <span className="font-mono font-bold text-slate-900">₹{projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Total Collected Cash:</span>
                          <span className="font-mono font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Outstanding Client Balances:</span>
                          <span className="font-mono font-bold text-red-600">₹{projects.reduce((acc, p) => acc + (p.balanceDue || 0), 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 5: MY ATTENDANCE & SHIFT */}
          {acManagerSubTab === 'attendance' && (
            <div className="space-y-6">
              <ManagerSelfAttendanceWidget
                activeMember={activeMember}
                attendance={attendance}
                onRecordAttendance={onRecordAttendance}
                onUpdateAttendance={onUpdateAttendance}
                handleLoginClockIn={handleLoginClockIn}
                handleLogoutClockOut={handleLogoutClockOut}
              />

              <EditorAttendanceLogTable 
                attendanceHistory={myAttendanceHistory} 
                activeMember={activeMember} 
              />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 4: SOCIAL MEDIA HANDLER DASHBOARD                        */}
      {/* ------------------------------------------------------------- */}
      {activeMember?.role === 'Social Media Handler' && (
        <div className="space-y-6">
          
          {/* Social Media Deliverables Header */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                Instagram Reels & Social Media Delivery Hub
              </span>
              <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
                9:16 Vertical 4K Reels
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{p.clientWeddingTitle}</h4>
                      <p className="text-xs text-slate-500 font-medium">{p.primaryServiceType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Reels Active
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Reels Delivery:</span>
                      <span className={`font-bold ${p.deliveryStatus?.reelsSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.deliveryStatus?.reelsSent ? '✓ Sent to Client' : 'Pending Upload'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Teaser Reel:</span>
                      <span className={`font-bold ${p.deliveryStatus?.teaserLinkSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {p.deliveryStatus?.teaserLinkSent ? '✓ Teaser Ready' : 'In Edit'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Social Media Share Link generated for ${p.clientWeddingTitle}! Ready for Instagram & Google Drive delivery.`);
                    }}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Share Reels Drive Link</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ASSIGNED TASKS & TO-DO MANAGEMENT CARD FOR SOCIAL MEDIA HANDLER */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Assigned Tasks & Website/Social Assignments</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tasks assigned to {activeMember?.name} ({activeMember?.role})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                  {myAssignedTasks.length} Tasks Active
                </span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(null);
                      setNewTaskTitle('');
                      setNewTaskNotes('');
                      setNewTaskAssignedToId(activeMember?.id || '');
                      setShowAddTaskModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task to {activeMember?.name}</span>
                  </button>
                )}
              </div>
            </div>

            {myAssignedTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No active tasks currently assigned to {activeMember?.name}. Click "Assign Task" to allocate tasks for websites or social media.
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignedTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{t.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.priority} Priority
                        </span>
                        {t.domainName && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-indigo-600" />
                            {t.domainName}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-500 font-bold text-xs">
                        Due: <span className="font-mono text-slate-800">{t.dueDate}</span>
                      </p>
                      {t.notes && <p className="text-slate-500 italic">"{t.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={t.status}
                        onChange={(e) => {
                          const updated: TeamTask = { ...t, status: e.target.value as any };
                          onUpdateTask(updated);
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs cursor-pointer"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Client Review</option>
                        <option value="completed">✓ Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleOpenEditTask(t)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition cursor-pointer shadow-2xs flex items-center gap-1 font-bold text-xs"
                        title="Edit Task Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {onDeleteTask && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTaskClick(t.id, t.title)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer shadow-2xs flex items-center gap-1 font-bold text-xs"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Media Client Accounts & Monthly Calendar System */}
          <SocialMediaCalendarWidget
            assignedTasks={myAssignedTasks}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onEditTask={handleOpenEditTask}
            activeMemberName={activeMember?.name}
          />

          {/* Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Monthly Attendance Log Table */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 5: VIDEO EDITOR & CINEMATOGRAPHER DASHBOARD               */}
      {/* ------------------------------------------------------------- */}
      {(activeMember?.role === 'Video Editor' || activeMember?.role === 'Cinematographer') && (
        <div className="space-y-6">
          
          {/* Monthly Targets Column Board for Video Editor */}
          <VideoEditorMonthlyTargetBoard projects={projects} activeMember={activeMember} tasks={tasks} />

          {/* Video Projects Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-600" />
                Assigned Video Timeline & Teasers Workspace
              </span>
              <span className="text-xs font-bold text-indigo-600">
                Permitted Softwares: {permittedSoftwares.join(' | ')}
              </span>
            </h3>

            {(() => {
              const myEditorProjects = projects.filter((p) => {
                if (!activeMember) return true;
                const mName = activeMember.name.toLowerCase();
                const mId = activeMember.id;

                const vpEditor = p.videoPipeline?.assignedEditor?.toLowerCase() || '';
                if (vpEditor && (vpEditor.includes(mName) || mName.includes(vpEditor))) return true;

                const rootEditor = (p as any).assignedEditor?.toLowerCase() || '';
                if (rootEditor && (rootEditor.includes(mName) || mName.includes(rootEditor))) return true;

                if (p.tasks && p.tasks.some((pt) => pt.assignedTo && (pt.assignedTo === mId || pt.assignedTo.toLowerCase().trim() === mName))) {
                  return true;
                }

                if (
                  tasks &&
                  tasks.some(
                    (t) =>
                      (t.projectId === p.id || (t.projectTitle && p.clientWeddingTitle.toLowerCase().includes(t.projectTitle.toLowerCase()))) &&
                      (t.assignedToId === mId || (t.assignedToName && t.assignedToName.toLowerCase().trim() === mName))
                  )
                ) {
                  return true;
                }

                return false;
              });

              const displayList = myEditorProjects.length > 0 ? myEditorProjects : projects;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayList.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 
                            onClick={() => onSelectProject?.(p, activeMember?.role || 'Video Editor')}
                            className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition"
                          >
                            {p.clientWeddingTitle}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs mt-1">
                            <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              📅 Function: <strong className="text-slate-900">{p.weddingFunctionDates || 'N/A'}</strong>
                            </span>
                            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              🎯 Deadline: {p.finalDeliveryDeadline}
                            </span>
                          </div>
                        </div>
                      </div>

                  {/* Video Pipeline Status List */}
                  <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    {/* Row 1: Cinematic Teaser */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">Cinematic Teaser (1-2 Min)</span>
                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['teaser', 'cinematic'], 1, 'Video')}
                        </span>
                      </div>
                      <select
                        value={p.videoPipeline?.teaser || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              videoPipeline: {
                                ...(p.videoPipeline || {
                                  preWeddingVideo: 'not_started',
                                  longVideo: 'not_started',
                                  teaser: 'not_started',
                                  highlights: 'not_started',
                                  reels: 'not_started',
                                  otherVideo: ''
                                }),
                                teaser: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.videoPipeline?.teaser || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.videoPipeline?.teaser || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : (p.videoPipeline?.teaser || 'not_started') === 'client_review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : (p.videoPipeline?.teaser || 'not_started') === 'revision'
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>

                    {/* Row 2: Full Length Film */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">Full Length Film (Traditional)</span>
                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['wedding film', 'long video', 'traditional', 'full length', 'film'], 1, 'Video')}
                        </span>
                      </div>
                      <select
                        value={p.videoPipeline?.longVideo || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              videoPipeline: {
                                ...(p.videoPipeline || {
                                  preWeddingVideo: 'not_started',
                                  longVideo: 'not_started',
                                  teaser: 'not_started',
                                  highlights: 'not_started',
                                  reels: 'not_started',
                                  otherVideo: ''
                                }),
                                longVideo: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.videoPipeline?.longVideo || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.videoPipeline?.longVideo || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : (p.videoPipeline?.longVideo || 'not_started') === 'client_review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : (p.videoPipeline?.longVideo || 'not_started') === 'revision'
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>

                    {/* Row 3: Instagram Reels */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">Instagram Reels</span>
                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['reels', 'shorts', 'instagram'], 5, 'Reels')}
                        </span>
                      </div>
                      <select
                        value={p.videoPipeline?.reels || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              videoPipeline: {
                                ...(p.videoPipeline || {
                                  preWeddingVideo: 'not_started',
                                  longVideo: 'not_started',
                                  teaser: 'not_started',
                                  highlights: 'not_started',
                                  reels: 'not_started',
                                  otherVideo: ''
                                }),
                                reels: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.videoPipeline?.reels || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.videoPipeline?.reels || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : (p.videoPipeline?.reels || 'not_started') === 'client_review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : (p.videoPipeline?.reels || 'not_started') === 'revision'
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

          {/* Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Monthly Attendance Log Table for Video Editor */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 6: PHOTO EDITOR & LEAD PHOTOGRAPHER DASHBOARD            */}
      {/* ------------------------------------------------------------- */}
      {(activeMember?.role === 'Photo Editor' || activeMember?.role === 'Lead Photographer') && (
        <div className="space-y-6">
          
          {/* Monthly Targets Banner for Photo Editor */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <Target className="w-4 h-4 text-pink-600" />
                  <span>Monthly Photo Editing & 12x36 Album Targets</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Monthly Target: <strong className="text-slate-800">10 Wedding Albums (350 Sheets)</strong></p>
              </div>
              <span className="text-xs font-bold bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full">
                {myAssignedTasks.filter(t => t.status === 'completed').length} / 10 Finished
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-700">Monthly Target Completion</span>
                <span className="font-mono text-pink-600">
                  {Math.min(100, Math.round((myAssignedTasks.filter(t => t.status === 'completed').length / 10) * 100))}% Completed ({myAssignedTasks.filter(t => t.status === 'completed').length} / 10)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((myAssignedTasks.filter(t => t.status === 'completed').length / 10) * 100))}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Photo Projects Panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Photo Retouching & 12x36 Canvera Album Workspace
              </span>
              <span className="text-xs font-bold text-indigo-600">
                Permitted Softwares: {permittedSoftwares.join(' | ')}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 
                        onClick={() => onSelectProject?.(p, activeMember?.role || 'Photo Editor')}
                        className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition"
                      >
                        {p.clientWeddingTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs mt-1">
                        <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          📅 Function: <strong className="text-slate-900">{p.weddingFunctionDates || 'N/A'}</strong>
                        </span>
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          🎯 Deadline: {p.finalDeliveryDeadline}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-100 text-pink-700">
                      Photo & Album
                    </span>
                  </div>

                  {/* Photo Pipeline Status List */}
                  <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    {/* Row 1: Raw Culling & Selection */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">Raw Culling & Selection</span>
                        <span className="text-[10px] font-extrabold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['culling', 'selection', 'photo'], 100, 'Photos')}
                        </span>
                      </div>
                      <select
                        value={p.photoPipeline?.cullingSelection || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              photoPipeline: {
                                ...(p.photoPipeline || {
                                  preWeddingPhotos: 'not_started',
                                  cullingSelection: 'not_started',
                                  colorGradingRetouching: 'not_started',
                                  albumDesigning: 'not_started',
                                  albumPrinting: 'not_sent',
                                  otherPhoto: ''
                                }),
                                cullingSelection: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.photoPipeline?.cullingSelection || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.photoPipeline?.cullingSelection || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>

                    {/* Row 2: Skin Retouching & Grading */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">Skin Retouching & Grading</span>
                        <span className="text-[10px] font-extrabold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['retouching', 'grading', 'photo'], 100, 'Photos')}
                        </span>
                      </div>
                      <select
                        value={p.photoPipeline?.colorGradingRetouching || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              photoPipeline: {
                                ...(p.photoPipeline || {
                                  preWeddingPhotos: 'not_started',
                                  cullingSelection: 'not_started',
                                  colorGradingRetouching: 'not_started',
                                  albumDesigning: 'not_started',
                                  albumPrinting: 'not_sent',
                                  otherPhoto: ''
                                }),
                                colorGradingRetouching: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.photoPipeline?.colorGradingRetouching || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.photoPipeline?.colorGradingRetouching || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>

                    {/* Row 3: 12x36 Album Design */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-semibold text-slate-700">
                        <span className="truncate">12x36 Album Design (Sheets)</span>
                        <span className="text-[10px] font-extrabold bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-100 shrink-0">
                          Qty: {getTaskQtyLabel(p, ['album', '12x36', 'sheets'], 2, 'Albums')}
                        </span>
                      </div>
                      <select
                        value={p.photoPipeline?.albumDesigning || 'not_started'}
                        onChange={(e) => {
                          if (onSaveProject) {
                            onSaveProject({
                              ...p,
                              photoPipeline: {
                                ...(p.photoPipeline || {
                                  preWeddingPhotos: 'not_started',
                                  cullingSelection: 'not_started',
                                  colorGradingRetouching: 'not_started',
                                  albumDesigning: 'not_started',
                                  albumPrinting: 'not_sent',
                                  otherPhoto: ''
                                }),
                                albumDesigning: e.target.value as EditingStatus
                              }
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                          (p.photoPipeline?.albumDesigning || 'not_started') === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : (p.photoPipeline?.albumDesigning || 'not_started') === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="not_started">NOT_STARTED</option>
                        <option value="in_progress">IN_PROGRESS</option>
                        <option value="client_review">CLIENT_REVIEW</option>
                        <option value="revision">REVISION</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Monthly Attendance Log Table for Photo Editor */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ROLE 7: OTHER / ASSISTANT / SUPPORT STAFF DASHBOARD           */}
      {/* ------------------------------------------------------------- */}
      {(activeMember?.role === 'Other' || activeMember?.role === 'Assistant' || activeMember?.role === 'Drone Operator') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {activeMember.role} Workspace - Studio Support & Equipment Management
              </span>
              <span className="text-xs font-bold text-indigo-600">
                Permitted Softwares: {permittedSoftwares.join(' | ')}
              </span>
            </h3>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-indigo-950 text-sm">{activeMember.name} ({activeMember.role})</h4>
                <p className="text-xs text-indigo-700 font-medium">Daily Operations, Equipment Setup & Support Duty</p>
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-lg uppercase">
                Active Staff
              </span>
            </div>
          </div>

          {/* Self Attendance Tracking & Shift Punching System */}
          <ManagerSelfAttendanceWidget
            activeMember={activeMember}
            attendance={attendance}
            onRecordAttendance={onRecordAttendance}
            onUpdateAttendance={onUpdateAttendance}
            handleLoginClockIn={handleLoginClockIn}
            handleLogoutClockOut={handleLogoutClockOut}
          />

          {/* Monthly Attendance Log Table */}
          <EditorAttendanceLogTable 
            attendanceHistory={myAttendanceHistory} 
            activeMember={activeMember} 
          />
        </div>
      )}

      {/* ASSIGNED WEDDING SHOOTS & EVENTS DUTY CARD LIST (FOR GROUND CREW & OTHER ROLES) */}
      {!(activeMember?.role === 'Studio Manager' || activeMember?.role === 'Manager') && (
        <>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Assigned Wedding Events & Shoot Duty</span>
              </h3>
              <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                {memberAssignedShoots.length} Events Assigned to {activeMember?.name}
              </span>
            </div>

            {memberAssignedShoots.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No wedding events currently assigned to {activeMember?.name}. When you allocate team members to shoot events, event names & assigned team names automatically appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberAssignedShoots.map((s) => {
                  const myCrewSlot = (s.crewAssignments || []).find(
                    (c) => c.name && c.name.trim().toLowerCase() === activeMember?.name?.trim().toLowerCase()
                  );

                  return (
                    <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                            {s.clientWeddingTitle}
                          </span>
                          <h4 className="text-base font-black text-slate-900">{s.title || 'Wedding Event'}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {myCrewSlot?.role || 'Assigned Crew'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Date & Time</span>
                          <span className="font-bold text-slate-900">{s.date}</span>
                          <span className="text-[10px] text-slate-600 font-mono block">
                            {s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : s.time}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Venue / Location</span>
                          <span className="font-bold text-slate-900 truncate block">{s.venue || s.venueLocation}</span>
                        </div>
                      </div>

                      {/* Co-Crew Assigned on this Event */}
                      {s.crewAssignments && s.crewAssignments.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Co-Team Assigned on this Event:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {s.crewAssignments.map((c, idx) => (
                              <span
                                key={c.id || idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  c.name?.trim().toLowerCase() === activeMember?.name?.trim().toLowerCase()
                                    ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                                    : 'bg-white text-slate-800 border-slate-200'
                                }`}
                              >
                                {c.role}: {c.name || 'Slot Empty'}
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

          {/* ASSIGNED TASKS DETAILS TABLE (COMMON TO OTHER ROLES) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Assigned Tasks Details & One-Click Status Updates</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {myAssignedTasks.length} Tasks Assigned to {activeMember?.name}
              </span>
            </div>

            {myAssignedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No active tasks currently assigned to {activeMember?.name}. Click "Assign New Task" above to add work items.
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignedTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{t.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.priority} Priority
                        </span>
                        {t.domainName && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-indigo-600" />
                            {t.domainName}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-500 font-bold text-xs">
                        Due: <span className="font-mono text-slate-800">{t.dueDate}</span>
                      </p>
                      {t.notes && <p className="text-slate-500 italic">"{t.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={t.status}
                        onChange={(e) => {
                          const updated: TeamTask = { ...t, status: e.target.value as any };
                          onUpdateTask(updated);
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs cursor-pointer"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Client Review</option>
                        <option value="completed">✓ Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleOpenEditTask(t)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition cursor-pointer shadow-2xs flex items-center gap-1 font-bold text-xs"
                        title="Edit Task Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {onDeleteTask && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTaskClick(t.id, t.title)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer shadow-2xs flex items-center gap-1 font-bold text-xs"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL 1: ASSIGN NEW TASK */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {editingTask ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                <span>{editingTask ? 'Edit Work Task' : 'Assign New Work Task'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setEditingTask(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title / Description *</label>
                <input
                  type="text"
                  placeholder={`e.g. Write Blog Article & Post 2 Reels for ${BRAND.domain}`}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign To Team Member *</label>
                  <select
                    value={newTaskAssignedToId}
                    onChange={(e) => setNewTaskAssignedToId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                  >
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Category</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  <option value="sales_target">🎯 Monthly Booking Target & Sales Goals</option>
                  <option value="sales_lead">💼 Sales & Client Followup</option>
                  <option value="social_media">🌐 Domain SEO & Social Media Posting</option>
                  <option value="editing_video">🎬 Video Editing & Reels</option>
                  <option value="editing_photo">📸 Photo Retouching & Culling</option>
                  <option value="management">⚙️ Studio & Web Management</option>
                </select>
              </div>

              {/* Sales Target Block */}
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Sales Targets & Monthly KPI</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Sales Goal
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBookingTarget('5');
                      setNewTargetRevenue('500000');
                      setNewTargetLeadsCount('25');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 cursor-pointer shadow-2xs"
                  >
                    🎯 5 Deals (₹5 Lakh)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTargetLeadsCount('20');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 cursor-pointer shadow-2xs"
                  >
                    📞 20 Hot Lead Calls
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-indigo-900 mb-1 leading-tight min-h-[28px] flex items-end">Monthly Booking Target</label>
                    <input
                      type="number"
                      placeholder="e.g. 5 Deals"
                      value={newBookingTarget}
                      onChange={(e) => setNewBookingTarget(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-indigo-900 mb-1 leading-tight min-h-[28px] flex items-end">Target Revenue (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={newTargetRevenue}
                      onChange={(e) => setNewTargetRevenue(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-indigo-900 mb-1 leading-tight min-h-[28px] flex items-end">Calls / Leads Target</label>
                    <input
                      type="number"
                      placeholder="e.g. 20 Calls"
                      value={newTargetLeadsCount}
                      onChange={(e) => setNewTargetLeadsCount(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                  >
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">☕ Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add specific guidelines or asset details..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm mt-2 cursor-pointer"
              >
                {editingTask ? 'Save Changes' : 'Create & Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE MONTHLY SALARY SLIP */}
      {showSalarySlipModal && salaryMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Monthly Salary Slip
                </h3>
              </div>
              <button
                onClick={() => setShowSalarySlipModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Salary Slip Layout */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="font-black text-indigo-600 text-base tracking-tight">{BRAND.name.toUpperCase()}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Salary Advice Statement - August 2026</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name:</span>
                  <strong className="text-slate-900 font-bold">{salaryMember.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Role:</span>
                  <strong className="text-indigo-600 font-bold">{salaryMember.role}</strong>
                </div>
              </div>

              {/* Attendance & Calculation breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Base Monthly Salary:</span>
                  <span className="font-mono font-bold text-slate-900">₹{(salaryMember.monthlySalary || 45000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard Days in Month:</span>
                  <span className="font-mono font-bold">26 Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Per Day Rate:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Math.round((salaryMember.monthlySalary || 45000) / 26).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-2">
                  <span>Days Present Worked (Full Days):</span>
                  <span className="font-mono">24 Days</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Half Days Worked:</span>
                  <span className="font-mono">1 Day</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold border-t border-slate-200 pt-2 text-sm">
                  <span>NET PAYABLE SALARY:</span>
                  <span className="font-mono font-black text-indigo-600">
                    ₹{(activeSalary?.earnedSalary || salaryMember.monthlySalary || 45000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT SALES DEAL TO PROJECT */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Finalize Sale & Create Studio Active Project</span>
              </h3>
              <button
                onClick={() => setShowSalesModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeSale} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Wedding Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul & Pooja Wedding 2026"
                  value={saleClientTitle}
                  onChange={(e) => setSaleClientTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={saleContactMobile}
                    onChange={(e) => setSaleContactMobile(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wedding Event Date</label>
                  <input
                    type="date"
                    value={saleWeddingDate}
                    onChange={(e) => setSaleWeddingDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wedding Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Taj Hotel, Delhi"
                  value={saleVenue}
                  onChange={(e) => setSaleVenue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Package Type</label>
                <select
                  value={saleServiceType}
                  onChange={(e) => setSaleServiceType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                >
                  <option value="Traditional + Cinematic + Pre-Wedding">Traditional + Cinematic + Pre-Wedding</option>
                  <option value="Cinematic Video + Candid Photography">Cinematic Video + Candid Photography</option>
                  <option value="Full Destination Wedding Coverage">Full Destination Wedding Coverage</option>
                  <option value="Pre-Wedding Shoot Only">Pre-Wedding Shoot Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Agreed Budget (₹)</label>
                  <input
                    type="number"
                    value={saleTotalBudget}
                    onChange={(e) => setSaleTotalBudget(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Received (₹)</label>
                  <input
                    type="number"
                    value={saleAdvanceReceived}
                    onChange={(e) => setSaleAdvanceReceived(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-700 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>Calculated Balance Due:</span>
                <span className="font-mono text-red-600 text-sm">₹{Math.max(0, saleTotalBudget - saleAdvanceReceived).toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finalize Booking & Create Active Project</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LOG NEW OFFICE EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Log New Monthly Office Expense</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOfficeExpenseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title / Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Studio AC Electricity Bill / Camera Sensor Cleaning"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Electricity & Water">Electricity & Water</option>
                    <option value="Studio Equipment & Repair">Studio Equipment & Repair</option>
                    <option value="Food & Tea/Chai">Food & Tea/Chai</option>
                    <option value="Travel & Fuel">Travel & Fuel</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Exposing & Operating">Exposing & Operating</option>
                    <option value="Albums Print">Albums Print</option>
                    <option value="Photo & Video Edit">Photo & Video Edit</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spent By (Person / Staff Name)</label>
                  <input
                    type="text"
                    placeholder="Enter person name / role (e.g. Owner, Studio Manager, Ramesh)"
                    value={newExpSpentBy}
                    onChange={(e) => setNewExpSpentBy(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={newExpPaidVia}
                  onChange={(e) => setNewExpPaidVia(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                >
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bill / Receipt Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional expense details, bill reference..."
                  value={newExpNotes}
                  onChange={(e) => setNewExpNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Office Expense Entry</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD CLIENT PAYMENT RECEIPT */}
      {selectedProjectForPayment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Record Monthly Client Payment Receipt</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProjectForPayment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordClientPaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Client Account</label>
                <select
                  value={selectedProjectForPayment.id}
                  onChange={(e) => {
                    if (e.target.value === 'OTHER_CUSTOM') {
                      const dummyOther: Project = {
                        id: 'OTHER_CUSTOM',
                        clientWeddingTitle: customOtherClientName || 'Other Income / Direct Client',
                        clientContactMobile: 'Direct Payment',
                        venueLocation: 'Studio Direct',
                        primaryServiceType: 'Other',
                        weddingFunctionDates: new Date().toISOString().split('T')[0],
                        finalDeliveryDeadline: new Date().toISOString().split('T')[0],
                        totalBudget: 0,
                        advanceReceived: 0,
                        balanceDue: 0,
                        specialNotesMusicPreferences: '',
                        status: 'completed',
                        createdAt: new Date().toISOString().split('T')[0],
                        payments: [],
                        videoPipeline: {
                          preWeddingVideo: 'completed',
                          longVideo: 'completed',
                          teaser: 'completed',
                          highlights: 'completed',
                          reels: 'completed',
                          otherVideo: '',
                        },
                        photoPipeline: {
                          preWeddingPhotos: 'completed',
                          cullingSelection: 'completed',
                          colorGradingRetouching: 'completed',
                          albumDesigning: 'completed',
                          albumPrinting: 'delivered',
                          otherPhoto: '',
                        },
                        shoots: [],
                        dataBackup: {
                          offloadedFromCards: true,
                          hardDrive1: 'N/A',
                          hardDrive1Done: true,
                          hardDrive2: 'N/A',
                          hardDrive2Done: true,
                          cloudBackupDone: true,
                          totalDataSizeGB: 0,
                          rawCleanupStatus: 'archived',
                        },
                        deliveryStatus: {
                          rawHandoverDone: true,
                          teaserLinkSent: true,
                          fullFilmSent: true,
                          reelsSent: true,
                          highResPhotosSent: true,
                          albumPrintedAndDelivered: true,
                        },
                      };
                      setSelectedProjectForPayment(dummyOther);
                      if (!customOtherClientName) setCustomOtherClientName('Other Client Income');
                      setClientPaymentAmount(10000);
                    } else {
                      const found = projects.find((p) => p.id === e.target.value);
                      if (found) {
                        setSelectedProjectForPayment(found);
                        setClientPaymentAmount(found.balanceDue > 0 ? found.balanceDue : 25000);
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-xs"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientWeddingTitle} (Balance Due: ₹{p.balanceDue.toLocaleString('en-IN')})
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM" className="font-bold text-indigo-700 bg-indigo-50">
                    ➕ Other / Custom Client Account (Other Revenue)
                  </option>
                </select>
              </div>

              {selectedProjectForPayment.id === 'OTHER_CUSTOM' ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <label className="block font-extrabold text-indigo-900 text-xs">
                    Client Name / Payment Source Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate Shoot / Studio Rental / Other Client Name"
                    value={customOtherClientName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomOtherClientName(val);
                      if (selectedProjectForPayment) {
                        setSelectedProjectForPayment({
                          ...selectedProjectForPayment,
                          clientWeddingTitle: val || 'Other Client Income',
                        });
                      }
                    }}
                    className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-indigo-600 font-medium">
                    This payment will be logged under this custom client/source name in your collections ledger.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                  <div className="font-extrabold text-slate-900 text-sm">{selectedProjectForPayment.clientWeddingTitle}</div>
                  <div className="flex justify-between text-[11px] text-slate-700 font-bold">
                    <span>Current Contract Budget: <span className="font-mono text-slate-900">₹{selectedProjectForPayment.totalBudget.toLocaleString('en-IN')}</span></span>
                    <span>Balance Due: <strong className="text-red-600 font-mono">₹{selectedProjectForPayment.balanceDue.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Received Date</label>
                  <input
                    type="date"
                    value={clientPaymentDate}
                    onChange={(e) => setClientPaymentDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Category</label>
                  <select
                    value={clientPaymentType}
                    onChange={(e) => setClientPaymentType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-bold"
                  >
                    <option value="installment">Installment / Mid Payment</option>
                    <option value="advance">Booking Advance</option>
                    <option value="final">Final Settlement</option>
                    <option value="other">Album/Reel Add-on</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={clientPaymentAmount}
                    onChange={(e) => setClientPaymentAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={clientPaymentMode}
                    onChange={(e) => setClientPaymentMode(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-bold"
                  >
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Notes / Receipt Ref</label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Installment received via PhonePe / GPay Ref #98721"
                  value={clientPaymentNotes}
                  onChange={(e) => setClientPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Log Monthly Payment Receipt</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DISBURSE STAFF SALARY */}
      {salaryDisburseMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span>Disburse Staff Salary</span>
              </h3>
              <button
                type="button"
                onClick={() => setSalaryDisburseMember(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStaffSalaryDisburseSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{salaryDisburseMember.name}</div>
                <div className="text-indigo-600 font-bold text-[11px]">{salaryDisburseMember.role}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Salary Payout Amount (₹)</label>
                <input
                  type="number"
                  value={salaryDisburseAmount}
                  onChange={(e) => setSalaryDisburseAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={salaryDisburseMode}
                  onChange={(e) => setSalaryDisburseMode(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-bold"
                >
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Salary transfer for July 2026"
                  value={salaryDisburseNotes}
                  onChange={(e) => setSalaryDisburseNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Disburse Payout</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Office Expense Modal */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title="Delete Office Expense"
        itemTitle={expenseToDelete ? `${expenseToDelete.title} (₹${expenseToDelete.amount.toLocaleString('en-IN')})` : ''}
        message={expenseToDelete ? `Are you sure you want to delete expense "${expenseToDelete.title}" (₹${expenseToDelete.amount.toLocaleString('en-IN')})?` : ''}
        onConfirm={() => {
          if (expenseToDelete) {
            confirmDeleteOfficeExpense(expenseToDelete);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />

      {/* Confirm Delete Payment Entry Modal */}
      <ConfirmDeleteModal
        isOpen={!!paymentToDelete}
        title="Delete Payment Receipt"
        itemTitle={paymentToDelete ? `${paymentToDelete.title} - ₹${paymentToDelete.amount.toLocaleString('en-IN')}` : ''}
        message={paymentToDelete ? `Are you sure you want to delete payment entry of ₹${paymentToDelete.amount.toLocaleString('en-IN')}?` : ''}
        onConfirm={() => {
          if (paymentToDelete) {
            confirmDeleteClientPayment(paymentToDelete.projectId, paymentToDelete.paymentId);
            setPaymentToDelete(null);
          }
        }}
        onCancel={() => setPaymentToDelete(null)}
      />

      {/* Floating Undo Notification */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
          <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-sm">🗑️</span>
          <div className="text-xs">
            <span className="font-bold">{undoToast.message}</span>
          </div>
          <button
            onClick={undoToast.onUndo}
            className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo / Restore
          </button>
          <button
            onClick={() => setUndoToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-1 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
};
