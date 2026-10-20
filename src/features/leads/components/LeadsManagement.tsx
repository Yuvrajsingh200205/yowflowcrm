import React, { useState, useEffect, useMemo } from 'react';
import { OwnerLead, LeadStatus, TeamMember, LeadQuotationFile } from '@/types';
import { usePermission } from '@/features/access';
import { indianMobileError } from '@/lib/validation/indianMobile';
import { leadsApi, BackendLead, BackendLeadStatus, BackendProjectType } from '@/lib/api/leads';
import { useLeads } from '@/hooks/useLeads';
import { LeadFormModal } from './LeadFormModal';
import { LeadsFilterBar } from './LeadsFilterBar';
import { LeadsHeader } from './LeadsHeader';
import { LeadsKpiGrid } from './LeadsKpiGrid';
import { LeadQuotationModal } from './LeadQuotationModal';
import { LeadBookingModal, LeadHistoryModal, LeadNoteModal } from './LeadSecondaryModals';
import { LeadQuotationPreview } from './LeadQuotationPreview';
import { LeadTargetsModal } from './LeadTargetsModal';
import { LeadDeleteConfirmModal } from './LeadDeleteConfirmModal';
import { LeadAnalyticsDashboard } from './LeadAnalyticsDashboard';
import { 
  Target, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  Calendar, 
  IndianRupee, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Edit3,
  FileText,
  Upload,
  Paperclip,
  Eye,
  History,
  BarChart2,
  Users,
} from 'lucide-react';
import { BRAND } from '@/config/brand';

export interface LeadTargets {
  yearlyLeadTarget: number;
  monthlyLeadTarget: number;
  yearlyBookedTarget: number;
  monthlyBookedTarget: number;
  yearlyRevenueTarget: number;
  monthlyRevenueTarget: number;
  avgTicketSize?: number;
  targetYear: string | number;
}

const API_STATUS_TO_UI: Record<string, LeadStatus> = {
  NEW: 'new', CONTACTED: 'contacted', QUALIFIED: 'meeting_fixed',
  PROPOSAL_SENT: 'quotation_sent', NEGOTIATION: 'quotation_sent', WON: 'booked', LOST: 'lost',
};

const UI_STATUS_TO_API: Record<LeadStatus, BackendLeadStatus> = {
  new: 'NEW', contacted: 'CONTACTED', meeting_fixed: 'QUALIFIED',
  quotation_sent: 'PROPOSAL_SENT', booked: 'WON', lost: 'LOST',
};

function eventTypeForApi(eventType: string): BackendProjectType {
  const key = eventType.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const supported = new Set<BackendProjectType>(['ROKA', 'ENGAGEMENT', 'PRE_WEDDING', 'WEDDING', 'COMPLETE_WEDDING_SERVICES', 'HALDI_MEHENDI', 'SANGEET', 'RECEPTION', 'ANNIVERSARY', 'CORPORATE', 'OTHER']);
  if (supported.has(key as BackendProjectType)) return key as BackendProjectType;
  if (key.includes('COMPLETE') && key.includes('WEDDING')) return 'COMPLETE_WEDDING_SERVICES';
  if (key.includes('PRE') && key.includes('WEDDING')) return 'PRE_WEDDING';
  if (key.includes('HALDI') || key.includes('MEHENDI')) return 'HALDI_MEHENDI';
  if (key.includes('WEDDING')) return 'WEDDING';
  return 'OTHER';
}

function leadFromApi(lead: BackendLead): OwnerLead {
  const owner = lead.owner;
  const source = lead.source;
  const createdBy = lead.createdBy;
  return {
    id: lead.id,
    clientName: lead.name || 'Inquiry Client',
    mobile: lead.phone || '',
    email: lead.email || undefined,
    eventType: lead.eventType || 'General Photography Inquiry',
    eventDate: lead.eventDate?.slice(0, 10),
    budgetEstimate: Number(lead.estimatedValue || 0),
    status: API_STATUS_TO_UI[lead.status] || 'new',
    source: source?.name || 'Direct / Call',
    assignedTo: owner?.fullName,
    createdBy: createdBy?.fullName,
    notes: lead.notes || undefined,
    createdDate: lead.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    quotations: [],
    activityLogs: [],
  };
}

const DEFAULT_LEAD_TARGETS: LeadTargets = {
  yearlyLeadTarget: 120,
  monthlyLeadTarget: 10,
  yearlyBookedTarget: 24,
  monthlyBookedTarget: 2,
  yearlyRevenueTarget: 3000000,
  monthlyRevenueTarget: 250000,
  avgTicketSize: 125000,
  targetYear: '2026-2027',
};

interface LeadsManagementProps {
  currentUser?: TeamMember | { id?: string; name?: string; role?: string; email?: string } | null;
  team?: TeamMember[];
}

export const LeadsManagement: React.FC<LeadsManagementProps> = ({ currentUser, team = [] }) => {
  const { can, role } = usePermission();

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<OwnerLead | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState<number | ''>('');
  const [advanceReceived, setAdvanceReceived] = useState<number | ''>('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [source, setSource] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Quotation Upload Modal State
  const [quotationModalLead, setQuotationModalLead] = useState<OwnerLead | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<{ file: LeadQuotationFile; lead: OwnerLead } | null>(null);
  const [newQuoteFileName, setNewQuoteFileName] = useState('');
  const [newQuoteFileType, setNewQuoteFileType] = useState('pdf');
  const [newQuoteFileSize, setNewQuoteFileSize] = useState('');
  const [newQuoteNotes, setNewQuoteNotes] = useState('');
  const [newQuoteDataUrl, setNewQuoteDataUrl] = useState<string | undefined>(undefined);

  // History Modal State
  const [historyModalLead, setHistoryModalLead] = useState<OwnerLead | null>(null);

  // Quick Note Modal State
  const [noteModalLead, setNoteModalLead] = useState<OwnerLead | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Delete Confirmation Modal State
  const [leadToDelete, setLeadToDelete] = useState<OwnerLead | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<{ leadId: string; quoteId: string; fileName: string } | null>(null);

  // Booking Deal Amount Modal State
  const [bookingAmountModalLead, setBookingAmountModalLead] = useState<OwnerLead | null>(null);
  const [modalFinalAmount, setModalFinalAmount] = useState<string>('');
  const [modalAdvanceAmount, setModalAdvanceAmount] = useState<string>('');

  // Lead Targets & Goals State
  const [targets, setTargets] = useState<LeadTargets>(() => {
    const saved = localStorage.getItem(`${BRAND.cookiePrefix}_owner_lead_targets`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_LEAD_TARGETS;
      }
    }
    return DEFAULT_LEAD_TARGETS;
  });

  // Remove the legacy demo cache now that the roster is server-owned.
  useEffect(() => {
    localStorage.removeItem(`${BRAND.cookiePrefix}_owner_crm_leads`);
  }, []);

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState<LeadTargets>(targets);

  useEffect(() => {
    localStorage.setItem(`${BRAND.cookiePrefix}_owner_lead_targets`, JSON.stringify(targets));
  }, [targets]);

  const handleOpenTargetModal = () => {
    setTargetForm(targets);
    setShowTargetModal(true);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    setTargets(targetForm);
    setShowTargetModal(false);
  };

  // User details & Role Determination
  const userName = currentUser?.name || 'Studio Owner';
  const userRole = currentUser?.role || 'Owner';
  const isStudioOwner = /^(admin|owner|studio owner)$/i.test(userRole.trim());
  const teamOptions = useMemo(() => {
    const members = isStudioOwner ? team.filter((member) => member.id !== currentUser?.id) : team;
    return [...new Set(members.map((member) => `${member.name} (${member.role})`))];
  }, [team, currentUser?.id, isStudioOwner]);
  const assigneeIdByLabel = useMemo(
    () => new Map(team.filter((member) => !isStudioOwner || member.id !== currentUser?.id).map((member) => [`${member.name} (${member.role})`, member.id])),
    [team, currentUser?.id, isStudioOwner]
  );
  const usingBackend = Array.isArray((currentUser as { permissions?: string[] } | null)?.permissions);
  const canCreateLead = can('leads.create');
  const canEditLead = can('leads.edit');
  const canDeleteLead = can('leads.delete');
  const canAssignLead = can('leads.assign');
  const canChangeLeadStatus = can('leads.change_status') || can('leads.edit');
  const seeAllLeads = usingBackend
    ? can('leads.view')
    : can('leads.view') && role?.grants['leads.view']?.scope === 'all';
  const isOwner = seeAllLeads || can('reports.view_sales');
  const leadQuery = useLeads(
    { limit: 100, search: searchQuery || undefined, status: statusFilter === 'all' ? undefined : UI_STATUS_TO_API[statusFilter as LeadStatus] },
    usingBackend && can('leads.view'),
  );
  const leads = useMemo(() => leadQuery.data.map(leadFromApi), [leadQuery.data]);

  const refreshLeads = async () => {
    if (!usingBackend) return;
    await leadQuery.retry();
  };

  const handleOpenAddModal = () => {
    if (!canCreateLead) return;
    setEditingLead(null);
    setClientName('');
    setMobile('');
    setEmail('');
    setEventType('');
    setEventDate('');
    setBudgetEstimate('');
    setAdvanceReceived('');
    setStatus('new');
    setSource('');
    setAssignedTo('');
    setNotes('');
    setShowAddLeadModal(true);
  };

  const handleOpenEditModal = (lead: OwnerLead) => {
    if (!canEditLead) return;
    setEditingLead(lead);
    setClientName(lead.clientName || '');
    setMobile(lead.mobile || '');
    setEmail(lead.email || '');
    setEventType(lead.eventType || '');
    setEventDate(lead.eventDate || '');
    setBudgetEstimate(lead.budgetEstimate || '');
    setAdvanceReceived(lead.advanceReceived !== undefined ? lead.advanceReceived : '');
    setStatus(lead.status);
    setSource(lead.source || '');
    setAssignedTo(lead.assignedTo || '');
    setNotes(lead.notes || '');
    setShowAddLeadModal(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead ? !canEditLead : !canCreateLead) return;
    const mobileError = indianMobileError(mobile, true);
    if (mobileError) {
      alert(mobileError);
      return;
    }

    const finalClientName = clientName.trim() || 'Inquiry Client';
    const finalEventType = eventType.trim() || 'General Photography Inquiry';
    const finalSource = source.trim() || 'Direct / Call';
    const finalAssignee = assignedTo.trim();
    const numBudget = Number(budgetEstimate) || 0;
    try {
      let sourceId: string | undefined;
      if (finalSource) {
        // Source setup is administered separately by the backend. A free-text
        // source must never prevent a lead itself from being saved.
        try {
          const { data: sources } = await leadsApi.sources();
          const existing = sources.find((item) => item.name.toLowerCase() === finalSource.toLowerCase());
          sourceId = existing?.id;
        } catch {
          sourceId = undefined;
        }
      }
      const payload = {
        name: finalClientName,
        phone: mobile.trim(),
        email: email.trim() || undefined,
        eventType: eventTypeForApi(finalEventType),
        eventDate: eventDate || undefined,
        estimatedValue: numBudget,
        ownerId: finalAssignee ? assigneeIdByLabel.get(finalAssignee) : undefined,
        sourceId,
        notes: notes.trim() || undefined,
        ...(editingLead ? { status: UI_STATUS_TO_API[status], ...(status === 'lost' ? { lostReason: 'Marked as lost' } : {}) } : {}),
      };
      if (editingLead) {
        await leadsApi.update(editingLead.id, payload);
      } else {
        const created = await leadsApi.create(payload);
        if (status !== 'new') {
          await leadsApi.update(created.id, {
            status: UI_STATUS_TO_API[status],
            ...(status === 'lost' ? { lostReason: 'Marked as lost' } : {}),
          });
        }
      }
      await refreshLeads();
      setShowAddLeadModal(false);
      setEditingLead(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save the lead. Please try again.');
    }
  };

  const handleUpdateStatus = (id: string, newStatus: LeadStatus, finalAmt?: number, advAmt?: number) => {
    if (!canChangeLeadStatus) return;
    void leadsApi.update(id, {
      status: UI_STATUS_TO_API[newStatus],
      ...(newStatus === 'lost' ? { lostReason: 'Marked as lost' } : {}),
      ...(finalAmt !== undefined ? { estimatedValue: finalAmt } : {}),
    }).then(refreshLeads).catch((error) => {
      window.alert(error instanceof Error ? error.message : 'Unable to update lead status.');
    });
    void advAmt;
  };

  const handleConfirmBookingAmount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingAmountModalLead) return;
    const numFinalAmt = Number(modalFinalAmount) || bookingAmountModalLead.budgetEstimate || 0;
    const numAdvAmt = Number(modalAdvanceAmount) || 0;
    handleUpdateStatus(bookingAmountModalLead.id, 'booked', numFinalAmt, numAdvAmt);
    setBookingAmountModalLead(null);
    setModalFinalAmount('');
    setModalAdvanceAmount('');
  };

  const handleUpdateAssignedTo = (id: string, newAssignedTo: string) => {
    if (!canAssignLead) return;
    const ownerId = assigneeIdByLabel.get(newAssignedTo);
    if (!ownerId) return;
    void leadsApi.update(id, { ownerId }).then(refreshLeads).catch((error) => {
      window.alert(error instanceof Error ? error.message : 'Unable to reassign this lead.');
    });
    void newAssignedTo;
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditLead || !noteModalLead) return;

    const trimmed = quickNoteText.trim();
    void leadsApi.update(noteModalLead.id, { notes: trimmed || undefined }).then(refreshLeads).catch((error) => {
      window.alert(error instanceof Error ? error.message : 'Unable to save the note.');
    });

    setNoteModalLead(null);
    setQuickNoteText('');
  };

  const handleDeleteLead = (leadOrId: string | OwnerLead) => {
    if (!canDeleteLead) return;
    if (typeof leadOrId === 'object') {
      setLeadToDelete(leadOrId);
    } else {
      const found = leads.find((l) => l.id === leadOrId);
      if (found) {
        setLeadToDelete(found);
      } else {
        void leadOrId;
      }
    }
  };

  const handleConfirmDeleteLead = async () => {
    if (!canDeleteLead || !leadToDelete) return;

    try {
      // Do not only hide the row locally: a successful API deletion is what
      // keeps it gone after refresh or the next visit to this page.
      if (usingBackend) await leadsApi.remove(leadToDelete.id);
      await refreshLeads();
      setLeadToDelete(null);
    } catch {
      window.alert('Unable to delete this lead. Please try again.');
    }
  };

  // Quotation Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewQuoteFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setNewQuoteFileSize(`${sizeMb} MB`);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setNewQuoteFileType('pdf');
      else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') setNewQuoteFileType('excel');
      else if (ext === 'doc' || ext === 'docx') setNewQuoteFileType('word');
      else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) setNewQuoteFileType('image');

      const reader = new FileReader();
      reader.onload = () => {
        setNewQuoteDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditLead || !quotationModalLead || !newQuoteFileName.trim()) return;

    window.alert('Quotation uploads are not connected because the backend does not expose a lead quotation/file API yet.');

    // Reset quote form
    setNewQuoteFileName('');
    setNewQuoteFileSize('');
    setNewQuoteNotes('');
    setNewQuoteDataUrl(undefined);
  };

  const handleDeleteQuotation = (leadId: string, quoteId: string, fileName?: string) => {
    setQuoteToDelete({
      leadId,
      quoteId,
      fileName: fileName || 'Quotation Document',
    });
  };

  // PRIVACY FILTER:
  // If user is Owner/Studio Manager, they see ALL leads.
  // If user is a normal team member, they see ONLY leads where createdBy or assignedTo matches their name!
  const isUserAssignedOrCreator = (lead: OwnerLead) => {
    if (seeAllLeads) return true;
    if (!userName) return false;

    const lowerUser = userName.toLowerCase();
    const assignedMatch = lead.assignedTo ? lead.assignedTo.toLowerCase().includes(lowerUser) || lowerUser.includes(lead.assignedTo.toLowerCase()) : false;
    const createdMatch = lead.createdBy ? lead.createdBy.toLowerCase().includes(lowerUser) || lowerUser.includes(lead.createdBy.toLowerCase()) : false;

    return assignedMatch || createdMatch;
  };

  // Base Accessible Leads (Privacy Enforced)
  const accessibleLeads = leads.filter(isUserAssignedOrCreator);

  // Filtered Leads based on Search & UI Selectors
  const filteredLeads = accessibleLeads.filter((l) => {
    const matchesSearch =
      (l.clientName && l.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.mobile.includes(searchQuery) ||
      l.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.assignedTo && l.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    const matchesAssignee = assigneeFilter === 'all' || (l.assignedTo && l.assignedTo.includes(assigneeFilter));

    return matchesSearch && matchesStatus && matchesSource && matchesAssignee;
  });

  // KPI Calculations (based on accessible leads for accuracy)
  const totalLeadsCount = accessibleLeads.length;
  const bookedCount = accessibleLeads.filter((l) => l.status === 'booked').length;
  const activeCount = accessibleLeads.filter((l) => l.status !== 'booked' && l.status !== 'lost').length;
  const totalPipelineRevenue = accessibleLeads.reduce((acc, l) => acc + (l.budgetEstimate || 0), 0);
  const bookedRevenue = accessibleLeads.filter((l) => l.status === 'booked').reduce((acc, l) => acc + (l.budgetEstimate || 0), 0);
  const totalQuotationsCount = accessibleLeads.reduce((acc, l) => acc + (l.quotations?.length || 0), 0);

  // Target Performance Calculations
  const now = new Date();
  const targetYearStr = String(targets.targetYear || '2026-2027');
  
  // Extract 4-digit years from targetYear (e.g. "2026-2027" -> ["2026", "2027"])
  const matchedYears = targetYearStr.match(/\d{4}/g) || [String(now.getFullYear())];
  const primaryYear = matchedYears[0] || String(now.getFullYear());

  const currentMonthNum = now.getMonth() + 1;
  const currentMonthStr = `${primaryYear}-${String(currentMonthNum).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('en-IN', { month: 'long' });

  // Helper to test if lead date belongs to the target year / FY range
  const belongsToTargetYear = (createdDateStr?: string) => {
    if (!createdDateStr) return true;
    return matchedYears.some((yr) => createdDateStr.startsWith(yr));
  };

  // Yearly actuals
  const yearlyLeadsCount = accessibleLeads.filter((l) => belongsToTargetYear(l.createdDate)).length;
  const yearlyBookedLeads = accessibleLeads.filter(
    (l) => l.status === 'booked' && belongsToTargetYear(l.createdDate)
  );
  const yearlyBookedCount = yearlyBookedLeads.length;
  const yearlyBookedRevenue = yearlyBookedLeads.reduce((acc, l) => acc + (l.finalAmount || l.budgetEstimate || 0), 0);

  // Monthly actuals
  const monthlyLeadsList = accessibleLeads.filter((l) => l.createdDate && l.createdDate.startsWith(currentMonthStr));
  const monthlyLeadsCount = monthlyLeadsList.length > 0 ? monthlyLeadsList.length : yearlyLeadsCount;

  const monthlyBookedList = accessibleLeads.filter((l) => l.status === 'booked' && l.createdDate && l.createdDate.startsWith(currentMonthStr));
  const monthlyBookedCount = monthlyBookedList.length > 0 ? monthlyBookedList.length : yearlyBookedCount;
  const monthlyBookedRevenue = monthlyBookedList.length > 0
    ? monthlyBookedList.reduce((acc, l) => acc + (l.finalAmount || l.budgetEstimate || 0), 0)
    : yearlyBookedRevenue;

  const calcPct = (actual: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const yearlyLeadsPct = calcPct(yearlyLeadsCount, targets.yearlyLeadTarget);
  const yearlyBookedPct = calcPct(yearlyBookedCount, targets.yearlyBookedTarget);
  const yearlyRevPct = calcPct(yearlyBookedRevenue, targets.yearlyRevenueTarget);

  const monthlyLeadsPct = calcPct(monthlyLeadsCount, targets.monthlyLeadTarget);
  const monthlyBookedPct = calcPct(monthlyBookedCount, targets.monthlyBookedTarget);
  const monthlyRevPct = calcPct(monthlyBookedRevenue, targets.monthlyRevenueTarget);

  // All audit logs for Owner Stream
  const allGlobalLogs = leads
    .flatMap((l) =>
      (l.activityLogs || []).map((log) => ({
        ...log,
        leadClientName: l.clientName,
        leadId: l.id
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const leadStatusClass = (leadStatus: LeadStatus) =>
    leadStatus === 'booked'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : leadStatus === 'quotation_sent'
      ? 'bg-blue-100 text-blue-900 border-blue-300'
      : leadStatus === 'meeting_fixed'
      ? 'bg-purple-100 text-purple-900 border-purple-300'
      : leadStatus === 'contacted'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : leadStatus === 'lost'
      ? 'bg-rose-100 text-rose-900 border-rose-300'
      : 'bg-slate-100 text-slate-800 border-slate-300';

  const openBookingAmountModal = (lead: OwnerLead) => {
    setBookingAmountModalLead(lead);
    setModalFinalAmount(
      lead.finalAmount ? String(lead.finalAmount) : lead.budgetEstimate ? String(lead.budgetEstimate) : ''
    );
    setModalAdvanceAmount(
      lead.advanceReceived !== undefined && lead.advanceReceived !== null ? String(lead.advanceReceived) : ''
    );
  };

  return (
    <div className="h-fit space-y-6 animate-in fade-in duration-300">
      <LeadsHeader userName={userName} userRole={userRole} isOwner={isOwner} canAddLead={canCreateLead} activeView={activeSubTab} onViewChange={setActiveSubTab} onAddLead={handleOpenAddModal} />

      {usingBackend && leadQuery.loading && (
        <p className="px-1 text-xs font-semibold text-slate-500">Updating lead pipeline…</p>
      )}

      {usingBackend && leadQuery.error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{leadQuery.error.message}</span>
          <button type="button" onClick={() => void leadQuery.retry()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-rose-700 shadow-sm">
            Retry
          </button>
        </div>
      )}

      {/* YEARLY & MONTHLY TARGETING & GOALS WIDGET (Visible to Owner & Managers only) */}
      {isOwner && activeSubTab === 'list' && (
        <div className="space-y-4 rounded-3xl border border-[#ddc89c]/30 bg-[linear-gradient(135deg,#1e302b,#302329_55%,#131a18)] p-5 text-white shadow-xl md:p-6">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-rose-300/15 pb-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="rounded-2xl border border-[#efd9b0]/25 bg-[#efd9b0]/10 p-2.5 text-[#efd9b0]">
                <Target className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    <span>Lead Goals & Target Performance</span>
                    <span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-2.5 py-1 text-xs font-extrabold uppercase text-rose-200">
                      Target Tracking
                    </span>
                  </h3>
                </div>
                <p className="mt-0.5 text-sm font-medium text-[#cdd9d6]">
                  Owner defined yearly ({targets.targetYear}) and monthly ({currentMonthName}) inquiry & conversion goals.
                </p>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={handleOpenTargetModal}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#efd9b0]/50 bg-[#f3dfc8] px-4 py-2.5 text-sm font-extrabold text-[#25473F] shadow-md transition hover:-translate-y-0.5 hover:bg-white"
              >
                <Edit3 className="size-4" />
                <span>Set / Edit Targets</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* YEARLY TARGET CARD */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-200">
                    Yearly Target ({targets.targetYear})
                  </h4>
                </div>
                <span className="rounded border border-slate-700 bg-slate-900/80 px-2 py-1 font-mono text-xs font-bold text-slate-300">
                  Year {targets.targetYear}
                </span>
              </div>

              <div className="space-y-3">
                {/* Metric 1: Yearly Leads */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Users className="size-4 text-rose-300" /> Inquiry Leads Volume:
                    </span>
                    <span className="text-white font-black font-mono">
                      {yearlyLeadsCount} / {targets.yearlyLeadTarget} Leads
                      <span className={`ml-2 rounded px-2 py-0.5 text-xs ${yearlyLeadsPct >= 100 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-200'}`}>
                        {yearlyLeadsPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-500 ${yearlyLeadsPct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-700 to-rose-400'}`}
                      style={{ width: `${Math.min(100, yearlyLeadsPct)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Yearly Bookings */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Booked Weddings / Deals:
                    </span>
                    <span className="text-white font-black font-mono">
                      {yearlyBookedCount} / {targets.yearlyBookedTarget} Deals
                      <span className={`ml-2 px-1.5 py-0.2 rounded text-[10px] ${yearlyBookedPct >= 100 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-emerald-500/30 text-emerald-300'}`}>
                        {yearlyBookedPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, yearlyBookedPct)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3: Yearly Revenue */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-400" /> Revenue Target (Booked Sum):
                    </span>
                    <span className="text-white font-black font-mono">
                      ₹{yearlyBookedRevenue.toLocaleString('en-IN')} / ₹{targets.yearlyRevenueTarget.toLocaleString('en-IN')}
                      <span className={`ml-2 px-1.5 py-0.2 rounded text-[10px] ${yearlyRevPct >= 100 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-500/30 text-amber-300'}`}>
                        {yearlyRevPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, yearlyRevPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MONTHLY TARGET CARD */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                    Monthly Target ({currentMonthName} {primaryYear})
                  </h4>
                </div>
                <span className="rounded border border-emerald-700/60 bg-emerald-950/80 px-2 py-1 font-mono text-xs font-bold text-emerald-300">
                  Current Month
                </span>
              </div>

              <div className="space-y-3">
                {/* Metric 1: Monthly Leads */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Users className="size-4 text-rose-300" /> Monthly Inquiry Target:
                    </span>
                    <span className="text-white font-black font-mono">
                      {monthlyLeadsCount} / {targets.monthlyLeadTarget} Leads
                      <span className={`ml-2 rounded px-2 py-0.5 text-xs ${monthlyLeadsPct >= 100 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-200'}`}>
                        {monthlyLeadsPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-500 ${monthlyLeadsPct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-700 to-rose-400'}`}
                      style={{ width: `${Math.min(100, monthlyLeadsPct)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Monthly Bookings */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Monthly Deals Target:
                    </span>
                    <span className="text-white font-black font-mono">
                      {monthlyBookedCount} / {targets.monthlyBookedTarget} Deals
                      <span className={`ml-2 px-1.5 py-0.2 rounded text-[10px] ${monthlyBookedPct >= 100 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-emerald-500/30 text-emerald-300'}`}>
                        {monthlyBookedPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, monthlyBookedPct)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3: Monthly Revenue */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-400" /> Monthly Revenue Target:
                    </span>
                    <span className="text-white font-black font-mono">
                      ₹{monthlyBookedRevenue.toLocaleString('en-IN')} / ₹{targets.monthlyRevenueTarget.toLocaleString('en-IN')}
                      <span className={`ml-2 px-1.5 py-0.2 rounded text-[10px] ${monthlyRevPct >= 100 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-500/30 text-amber-300'}`}>
                        {monthlyRevPct}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, monthlyRevPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'list' && <LeadsKpiGrid totalLeads={totalLeadsCount} activeLeads={activeCount} bookedDeals={bookedCount} bookedRevenue={bookedRevenue} quotations={totalQuotationsCount} pipelineValue={totalPipelineRevenue} isOwner={isOwner} />}

      {/* SUB TAB VIEW SWITCH: LIST VS OWNER ANALYTICS */}
      {activeSubTab === 'analytics' && isOwner ? (
        <div className="space-y-6">
          <LeadAnalyticsDashboard leads={accessibleLeads} targets={targets} />
          {/* OWNER REPORTING SECTION */}
          <div className="hidden bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" /> Studio Lead Analytics & Team Performance
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete overview of assigned leads, staff conversion rates, quotations uploaded, and transfer history.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('list')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition cursor-pointer"
              >
                Back to Leads Table
              </button>
            </div>

            {/* Team Breakdown Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Lead Distribution Per Staff Member
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teamOptions.map((staffName) => {
                  const staffLeads = leads.filter((l) => l.assignedTo && l.assignedTo.includes(staffName.split(' ')[0]));
                  const staffBooked = staffLeads.filter((l) => l.status === 'booked').length;
                  const staffActive = staffLeads.filter((l) => l.status !== 'booked' && l.status !== 'lost').length;
                  const staffValue = staffLeads.reduce((acc, l) => acc + (l.budgetEstimate || 0), 0);
                  const staffQuotes = staffLeads.reduce((acc, l) => acc + (l.quotations?.length || 0), 0);

                  return (
                    <div key={staffName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{staffName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-black text-[10px]">
                          {staffLeads.length} Leads
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Active</p>
                          <p className="font-black text-amber-600">{staffActive}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Booked</p>
                          <p className="font-black text-emerald-600">{staffBooked}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Quotes</p>
                          <p className="font-black text-indigo-600">{staffQuotes}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-medium">
                        <span>Est. Value:</span>
                        <strong className="text-slate-900">₹{staffValue.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Lead Audit & Transfer Stream */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" /> Recent Reassignments, Transfers & Activity History Log
              </h4>

              <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 font-mono text-xs max-h-80 overflow-y-auto space-y-2.5 border border-slate-800">
                {allGlobalLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-6 italic">No lead transfer or activity logs recorded yet.</p>
                ) : (
                  allGlobalLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 border-b border-slate-800/80 pb-2 text-[11px] last:border-0 last:pb-0">
                      <span className="text-indigo-400 font-bold shrink-0">[{log.timestamp}]</span>
                      <span className="text-emerald-300 font-extrabold shrink-0">[{log.leadClientName}]</span>
                      <span className="text-slate-200">{log.description}</span>
                      <span className="ml-auto text-slate-400 text-[10px] shrink-0">by {log.performedBy}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <LeadsFilterBar search={searchQuery} status={statusFilter} source={sourceFilter} assignee={assigneeFilter} teamOptions={teamOptions} onSearchChange={setSearchQuery} onStatusChange={setStatusFilter} onSourceChange={setSourceFilter} onAssigneeChange={setAssigneeFilter} />

          {/* Leads Data Table */}
          <div className="h-fit">
            {filteredLeads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8ccc5] bg-white p-8 text-center text-sm italic text-slate-400 xl:hidden">
                {isOwner
                  ? 'No lead records found matching your current filter criteria.'
                  : canCreateLead
                    ? 'No leads found assigned to or created by you. Use "+ Add Lead" to add your new inquiries!'
                    : 'No leads found assigned to or created by you.'}
              </div>
            ) : (
              <div className="space-y-3 xl:hidden">
                {filteredLeads.map((lead, index) => {
                  const whatsappLink = `https://wa.me/91${lead.mobile.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                    lead.clientName
                  )},%20thank%20you%20for%20inquiring%20with%20our%20Wedding%20Photography%20Studio!`;
                  const quoteCount = lead.quotations?.length || 0;

                  return (
                    <article key={lead.id} className="overflow-hidden rounded-2xl border border-[#e1d9d4] bg-white shadow-sm">
                      <div className="flex items-start gap-3 border-b border-[#eee8e4] p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm font-extrabold text-rose-800">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-base font-black leading-snug text-slate-900">{lead.clientName || 'Anonymous Client'}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">ID: #{lead.id.slice(-4)}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{lead.source}</span>
                          </div>
                          <p className="mt-1 text-[10px] font-mono text-slate-400">{lead.createdBy || 'Studio Owner'} · {lead.createdDate}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact</p>
                          <a href={`tel:${lead.mobile}`} className="flex items-center gap-1.5 text-sm font-extrabold text-slate-800 hover:text-emerald-700">
                            <Phone className="size-4 shrink-0 text-emerald-600" />
                            {lead.mobile}
                          </a>
                          <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100">
                            <MessageSquare className="size-3.5 shrink-0 text-emerald-600" />
                            WhatsApp Chat
                          </a>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Requirement</p>
                          <p className="break-words text-sm font-extrabold text-slate-900">{lead.eventType}</p>
                          {!lead.notes && canEditLead && (
                            <button
                              onClick={() => {
                                setNoteModalLead(lead);
                                setQuickNoteText('');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200/80 bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100"
                            >
                              <Plus className="size-3.5" />
                              <span>Add Note</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned To</p>
                          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-xs font-extrabold text-indigo-950">
                            <UserCheck className="size-4 shrink-0 text-indigo-600" />
                            <select
                              value={lead.assignedTo || ''}
                              disabled={!canAssignLead}
                              onChange={(e) => handleUpdateAssignedTo(lead.id, e.target.value)}
                              className="min-w-0 flex-1 bg-transparent p-0 text-xs font-extrabold text-indigo-900 outline-none disabled:cursor-not-allowed"
                            >
                              <option value="">-- Unassigned --</option>
                              {teamOptions.map((member) => (
                                <option key={member} value={member}>
                                  {member}
                                </option>
                              ))}
                              {lead.assignedTo && !teamOptions.includes(lead.assignedTo) && (
                                <option value={lead.assignedTo}>{lead.assignedTo}</option>
                              )}
                            </select>
                          </div>
                          {lead.assignedDate && <p className="font-mono text-[10px] text-slate-400">Assigned: {lead.assignedDate}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quotation</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setQuotationModalLead(lead)}
                              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                                quoteCount > 0
                                  ? 'border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                              title="Manage & Attach Quotation Files"
                            >
                              <Paperclip className="size-4 text-indigo-600" />
                              <span>Quote ({quoteCount})</span>
                              {quoteCount > 0 && <span className="size-2 rounded-full bg-emerald-500" />}
                            </button>
                            <button
                              onClick={() => {
                                const firstQuote = lead.quotations?.[0];
                                if (firstQuote) setPreviewQuotation({ file: firstQuote, lead });
                                else setQuotationModalLead(lead);
                              }}
                              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-200"
                              title="View / Preview Quotation Document"
                            >
                              <Eye className="size-4 text-emerald-700" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
                          <select
                            value={lead.status}
                            disabled={!canChangeLeadStatus}
                            onChange={(e) => {
                              const newSt = e.target.value as LeadStatus;
                              if (newSt === 'booked') openBookingAmountModal(lead);
                              else handleUpdateStatus(lead.id, newSt);
                            }}
                            className={`min-h-10 w-full rounded-xl border px-3 py-2 text-xs font-black shadow-2xs ${leadStatusClass(lead.status)}`}
                          >
                            <option value="new">New Inquiry</option>
                            <option value="contacted">Contacted / Followup</option>
                            <option value="meeting_fixed">Meeting Fixed</option>
                            <option value="quotation_sent">Quotation Sent</option>
                            <option value="booked">Booked Deal</option>
                            <option value="lost">Lost / Unconverted</option>
                          </select>
                        </div>

                        {lead.status === 'booked' && (
                          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-extrabold text-emerald-900 sm:col-span-2">
                            <button type="button" onClick={() => openBookingAmountModal(lead)} className="flex w-full items-center justify-between gap-2 text-left">
                              <span className="text-emerald-700">Final Amount</span>
                              <span className="flex items-center gap-1 font-mono text-sm font-black text-emerald-950">
                                ₹{(lead.finalAmount || lead.budgetEstimate || 0).toLocaleString('en-IN')}
                                <Edit3 className="size-3.5 text-emerald-700" />
                              </span>
                            </button>
                            <button type="button" onClick={() => openBookingAmountModal(lead)} className="mt-2 flex w-full items-center justify-between gap-2 border-t border-emerald-200 pt-2 text-left">
                              <span className="text-indigo-700">Advance Recd</span>
                              <span className="flex items-center gap-1 font-mono text-sm font-black text-indigo-950">
                                ₹{(lead.advanceReceived || 0).toLocaleString('en-IN')}
                                <Edit3 className="size-3.5 text-indigo-700" />
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="border-t border-amber-200/80 bg-amber-50/70 p-3">
                          <div className="rounded-xl border border-amber-300 bg-amber-100/90 p-3 text-amber-950">
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 size-4 shrink-0 text-amber-800" />
                              <div className="min-w-0 flex-1">
                                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Lead Note / Reminder:</span>
                                <p className="mt-1 whitespace-pre-wrap break-words text-xs font-bold leading-relaxed text-slate-900">"{lead.notes}"</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setNoteModalLead(lead);
                                setQuickNoteText(lead.notes || '');
                              }}
                              className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-amber-200 px-3 py-2 text-xs font-black text-amber-950 hover:bg-amber-300"
                              title="Edit Note"
                            >
                              <Edit3 className="size-4" />
                              <span>Edit Note</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 border-t border-[#eee8e4] bg-[#fbfaf8] px-4 py-3">
                        <button onClick={() => setHistoryModalLead(lead)} title="View Lead History & Audit Logs" className="grid size-10 place-items-center rounded-lg text-indigo-700 hover:bg-indigo-100"><History className="size-5" /></button>
                        {canEditLead && <button onClick={() => handleOpenEditModal(lead)} title="Edit Lead Details" className="grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-200"><Edit3 className="size-5" /></button>}
                        {canDeleteLead && <button onClick={() => handleDeleteLead(lead)} title="Delete Lead" className="grid size-10 place-items-center rounded-lg text-red-600 hover:bg-red-100"><Trash2 className="size-5" /></button>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="hidden h-fit overflow-hidden border-y border-[#d8ccc5] bg-white xl:block">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#3c5b53] bg-[#233631] text-xs font-extrabold uppercase tracking-wider text-[#eaf2f0]">
                    <th className="w-[23%] border-r border-white/15 px-3 py-3">Client & Inquiry</th>
                    <th className="w-[15%] border-r border-white/15 px-3 py-3">Contact Details</th>
                    <th className="w-[19%] border-r border-white/15 px-3 py-3">Event Type / Requirement</th>
                    <th className="w-[20%] border-r border-white/15 px-3 py-3">Assigned To</th>
                    <th className="w-[12%] border-r border-white/15 px-3 py-3">Quotation</th>
                    <th className="w-[11%] px-3 py-3">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white align-top">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                        {isOwner
                          ? 'No lead records found matching your current filter criteria.'
                          : canCreateLead
                            ? 'No leads found assigned to or created by you. Use "+ Add Lead" to add your new inquiries!'
                            : 'No leads found assigned to or created by you.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead, index) => {
                      const whatsappLink = `https://wa.me/91${lead.mobile.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                        lead.clientName
                      )},%20thank%20you%20for%20inquiring%20with%20our%20Wedding%20Photography%20Studio!`;

                      const quoteCount = lead.quotations?.length || 0;

                      return (
                        <React.Fragment key={lead.id}>
                          <tr className="group align-top border-b border-[#e1d9d4] transition hover:bg-[#fbfdfc]">
                            {/* Client Name & ID */}
                            <td className="border-r border-[#eee8e4] p-3.5 font-black text-slate-900 align-top">
                              <div className="flex items-center gap-2 py-0.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm font-extrabold text-rose-800">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900 text-sm leading-snug">{lead.clientName || 'Anonymous Client'}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-mono">ID: #{lead.id.slice(-4)}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                      {lead.source}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[9px] font-mono text-slate-400">{lead.createdBy || 'Studio Owner'} · {lead.createdDate}</p>
                                </div>
                              </div>
                            </td>

                            {/* Contact Details */}
                            <td className="border-r border-[#eee8e4] p-2.5 align-top sm:p-3.5">
                              <div className="space-y-1 py-0.5">
                                <a
                                  href={`tel:${lead.mobile}`}
                                  className="flex items-center gap-1 text-slate-800 font-extrabold hover:text-emerald-600 text-xs"
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  {lead.mobile}
                                </a>
                                <a
                                  href={whatsappLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                                  WhatsApp Chat
                                </a>
                              </div>
                            </td>

                            {/* Requirement / Event Type */}
                            <td className="border-r border-[#eee8e4] p-3.5 font-bold text-slate-800 align-top">
                              <div className="py-0.5">
                                <p className="text-slate-900 font-extrabold text-xs">{lead.eventType}</p>
                                {!lead.notes && canEditLead && (
                                  <button
                                    onClick={() => {
                                      setNoteModalLead(lead);
                                      setQuickNoteText('');
                                    }}
                                    className="mt-1 text-[10px] text-indigo-700 hover:text-indigo-900 font-extrabold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200/80 transition cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>+ Add Note</span>
                                  </button>
                                )}
                              </div>
                            </td>

                          {/* Assigned To (Drop-down for reassigning) */}
                          <td className="p-2.5 align-top sm:p-3.5">
                            <div className="py-0.5">
                              <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-indigo-950 font-extrabold text-xs w-full">
                                <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <select
                                  value={lead.assignedTo || ''}
                                  disabled={!canAssignLead}
                                  onChange={(e) => handleUpdateAssignedTo(lead.id, e.target.value)}
                                  className="bg-transparent border-none p-0 focus:outline-none font-extrabold text-indigo-900 text-xs cursor-pointer w-full disabled:cursor-not-allowed truncate"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {teamOptions.map((member) => (
                                    <option key={member} value={member}>
                                      {member}
                                    </option>
                                  ))}
                                  {lead.assignedTo && !teamOptions.includes(lead.assignedTo) && (
                                    <option value={lead.assignedTo}>{lead.assignedTo}</option>
                                  )}
                                </select>
                              </div>
                              {lead.assignedDate && (
                                <p className="text-[9px] text-slate-400 mt-1 font-mono leading-none">Assigned: {lead.assignedDate}</p>
                              )}
                            </div>
                          </td>

                          {/* Quotation Documents */}
                          <td className="border-r border-[#eee8e4] p-2.5 align-top sm:p-3.5">
                            <div className="flex flex-wrap gap-1.5 py-0.5">
                              <button
                                onClick={() => setQuotationModalLead(lead)}
                                className={`px-2.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition border cursor-pointer ${
                                  quoteCount > 0
                                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Manage & Attach Quotation Files"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Quote ({quoteCount})</span>
                                {quoteCount > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  const firstQuote = lead.quotations?.[0];
                                  if (firstQuote) {
                                    setPreviewQuotation({ file: firstQuote, lead });
                                  } else {
                                    setQuotationModalLead(lead);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl font-extrabold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="View / Preview Quotation Document"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>

                          {/* Lead Status Switcher */}
                          <td className="border-r border-[#eee8e4] p-2.5 align-top sm:p-3.5">
                            <div className="py-0.5">
                              <select
                                value={lead.status}
                                disabled={!canChangeLeadStatus}
                                onChange={(e) => {
                                  const newSt = e.target.value as LeadStatus;
                                  if (newSt === 'booked') {
                                    openBookingAmountModal(lead);
                                  } else {
                                    handleUpdateStatus(lead.id, newSt);
                                  }
                                }}
                                className={`w-full font-black text-xs rounded-xl px-2 py-1.5 border shadow-2xs cursor-pointer ${leadStatusClass(lead.status)}`}
                              >
                                <option value="new">New Inquiry</option>
                                <option value="contacted">Contacted / Followup</option>
                                <option value="meeting_fixed">Meeting Fixed</option>
                                <option value="quotation_sent">Quotation Sent</option>
                                <option value="booked">Booked Deal</option>
                                <option value="lost">Lost / Unconverted</option>
                              </select>

                              {lead.status === 'booked' && (
                                <div className="mt-1 space-y-1 bg-emerald-50 border border-emerald-300 rounded-lg p-1.5 text-[11px] font-extrabold text-emerald-900 shadow-2xs">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight">Final Amount:</span>
                                    <button
                                      type="button"
                                      onClick={() => openBookingAmountModal(lead)}
                                      className="font-mono text-xs font-black text-emerald-950 underline hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                                      title="Click to edit finalized deal & advance amount"
                                    >
                                      ₹{(lead.finalAmount || lead.budgetEstimate || 0).toLocaleString('en-IN')}
                                      <Edit3 className="w-3 h-3 text-emerald-700" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-emerald-200">
                                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-tight">Advance Recd:</span>
                                    <button
                                      type="button"
                                      onClick={() => openBookingAmountModal(lead)}
                                      className="font-mono text-xs font-black text-indigo-950 underline hover:text-indigo-700 cursor-pointer flex items-center gap-0.5"
                                      title="Click to edit advance amount"
                                    >
                                      ₹{(lead.advanceReceived || 0).toLocaleString('en-IN')}
                                      <Edit3 className="w-3 h-3 text-indigo-700" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-1 border-t border-slate-200 pt-2">
                                <button onClick={() => setHistoryModalLead(lead)} title="View Lead History & Audit Logs" className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100"><History className="w-4 h-4" /></button>
                                {canEditLead && <button onClick={() => handleOpenEditModal(lead)} title="Edit Lead Details" className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-200"><Edit3 className="w-4 h-4" /></button>}
                                {canDeleteLead && <button onClick={() => handleDeleteLead(lead)} title="Delete Lead" className="rounded-lg p-1.5 text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Note Sub-Row (Notepad placed cleanly below lead row) */}
                        {lead.notes && (
                          <tr className="bg-amber-50/70 border-b border-amber-200/80">
                            <td colSpan={6} className="px-4 py-2.5">
                              <div className="flex items-start justify-between gap-3 bg-amber-100/90 border border-amber-300 rounded-xl p-3 text-amber-950 shadow-2xs">
                                <div className="flex items-start gap-2.5">
                                  <FileText className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-900 block">
                                      Lead Note / Reminder:
                                    </span>
                                    <p className="text-xs font-bold text-slate-900 mt-1 leading-relaxed whitespace-pre-wrap break-words max-w-4xl">
                                      "{lead.notes}"
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setNoteModalLead(lead);
                                    setQuickNoteText(lead.notes || '');
                                  }}
                                  className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black rounded-lg text-xs border border-amber-400 transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                                  title="Edit Note"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Note</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <LeadFormModal
        open={showAddLeadModal}
        editingLead={editingLead}
        clientName={clientName}
        mobile={mobile}
        email={email}
        eventType={eventType}
        eventDate={eventDate}
        budgetEstimate={budgetEstimate}
        advanceReceived={advanceReceived}
        status={status}
        source={source}
        assignedTo={assignedTo}
        notes={notes}
        teamOptions={teamOptions}
        onClientNameChange={setClientName}
        onMobileChange={setMobile}
        onEmailChange={setEmail}
        onEventTypeChange={setEventType}
        onEventDateChange={setEventDate}
        onBudgetChange={setBudgetEstimate}
        onAdvanceChange={setAdvanceReceived}
        onStatusChange={setStatus}
        onSourceChange={setSource}
        onAssignedToChange={setAssignedTo}
        onNotesChange={setNotes}
        onClose={() => setShowAddLeadModal(false)}
        onSubmit={handleSaveLead}
      />
      <LeadQuotationModal
        lead={quotationModalLead}
        fileName={newQuoteFileName}
        fileType={newQuoteFileType}
        notes={newQuoteNotes}
        isOwner={isOwner}
        userName={userName}
        onClose={() => setQuotationModalLead(null)}
        onPreview={(file, lead) => setPreviewQuotation({ file, lead })}
        onDelete={handleDeleteQuotation}
        onFileChange={handleFileChange}
        onFileNameChange={setNewQuoteFileName}
        onFileTypeChange={setNewQuoteFileType}
        onNotesChange={setNewQuoteNotes}
        onSubmit={handleSaveQuotation}
      />
      <LeadHistoryModal
        lead={historyModalLead}
        onClose={() => setHistoryModalLead(null)}
      />
      <LeadNoteModal
        lead={noteModalLead}
        value={quickNoteText}
        onValueChange={setQuickNoteText}
        onClose={() => setNoteModalLead(null)}
        onSubmit={handleSaveQuickNote}
      />
      <LeadQuotationPreview
        preview={previewQuotation}
        onClose={() => setPreviewQuotation(null)}
      />
      <LeadBookingModal
        lead={bookingAmountModalLead}
        finalAmount={modalFinalAmount}
        advanceAmount={modalAdvanceAmount}
        onFinalAmountChange={setModalFinalAmount}
        onAdvanceAmountChange={setModalAdvanceAmount}
        onClose={() => {
          setBookingAmountModalLead(null);
          setModalFinalAmount('');
          setModalAdvanceAmount('');
        }}
        onSubmit={handleConfirmBookingAmount}
      />
      {/* 6. CONFIRMATION MODALS FOR DELETION */}
      <LeadDeleteConfirmModal
        open={!!leadToDelete}
        title="Delete Lead Record"
        itemTitle={leadToDelete?.clientName || 'Inquiry Record'}
        message={`Are you sure you want to delete lead "${leadToDelete?.clientName || 'Inquiry Record'}"? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteLead}
        onCancel={() => setLeadToDelete(null)}
      />

      <LeadDeleteConfirmModal
        open={!!quoteToDelete}
        title="Delete Quotation File"
        itemTitle={quoteToDelete?.fileName || 'Quotation Document'}
        message={`Are you sure you want to delete quotation document "${quoteToDelete?.fileName || ''}"?`}
        onConfirm={() => {
          if (quoteToDelete) {
            window.alert('Quotation deletion is not connected because the backend does not expose a lead quotation/file API yet.');
            setQuoteToDelete(null);
          }
        }}
        onCancel={() => setQuoteToDelete(null)}
      />

      <LeadTargetsModal
        open={showTargetModal}
        value={targetForm}
        onChange={setTargetForm}
        onClose={() => setShowTargetModal(false)}
        onSubmit={handleSaveTargets}
      />
    </div>
  );
};
