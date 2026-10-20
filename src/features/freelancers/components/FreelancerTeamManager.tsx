'use client';

import React, { useState } from 'react';
import {
  Freelancer,
  FreelancerAssignment,
  FreelancerPayment,
  FreelancerAttendance,
  FreelancerDataReceived,
  FreelancerCategory,
  FreelancerActivityLog,
  Project,
  FreelancerDocument,
} from '@/types';
import { FreelancerDashboardView } from './FreelancerDashboardView';
import { AllFreelancersView } from './AllFreelancersView';
import { FreelancerMarketplaceView } from './FreelancerMarketplaceView';
import { AssignShootModal } from './AssignShootModal';
import { ShootCalendarView } from './ShootCalendarView';
import { FreelancerPaymentsView } from './FreelancerPaymentsView';
import { FreelancerReportsView } from './FreelancerReportsView';
import { CategoriesManagerModal } from './CategoriesManagerModal';
import { FreelancerFormModal } from './FreelancerFormModal';
import { FreelancerProfileModal } from './FreelancerProfileModal';
import { FreelancerApplicationsView } from './FreelancerApplicationsView';
import {
  BarChart3,
  Calendar,
  CreditCard,
  ClipboardList,
  LayoutDashboard,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react';
import { BTN_CREAM, BTN_GHOST, CARD, TOGGLE_ACTIVE, TOGGLE_IDLE } from '@/features/team/components/TeamUiKit';
import { usePermission } from '@/features/access';
import { useToast } from '@/components/common';
import { BRAND } from '@/config/brand';

type FreelancerTab = 'dashboard' | 'all_freelancers' | 'interested' | 'applications' | 'calendar' | 'payments' | 'reports';

interface FreelancerTeamManagerProps {
  freelancers: Freelancer[];
  categories: FreelancerCategory[];
  assignments: FreelancerAssignment[];
  payments: FreelancerPayment[];
  attendanceRecords: FreelancerAttendance[];
  dataReceivedList: FreelancerDataReceived[];
  activityLogs: FreelancerActivityLog[];
  projects: Project[];
  onSaveFreelancer: (freelancer: Freelancer) => void;
  onSaveCategories: (categories: FreelancerCategory[]) => void;
  onSaveAssignments: (assignments: FreelancerAssignment[]) => void;
  onUpdateAssignmentStatus: (assignmentId: string, status: FreelancerAssignment['assignmentStatus']) => void;
  onSavePayment: (payment: FreelancerPayment) => void;
  onSaveAttendance: (record: FreelancerAttendance) => void;
  onUpdateAvailability: (freelancerId: string, status: Freelancer['availabilityStatus']) => void;
  onSaveDataReceived: (record: FreelancerDataReceived) => void;
  onUpdateDataStatus: (dataId: string, status: FreelancerDataReceived['dataStatus']) => void;
  onUpdateDocument?: (freelancerId: string, doc: FreelancerDocument) => void;
  onDeleteFreelancer?: (freelancerId: string) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  focusDate?: string;
  focusProjectId?: string;
  focusShootId?: string;
}

const TABS: Array<{ id: FreelancerTab; label: string; icon: typeof Users }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'all_freelancers', label: 'Find Freelancer', icon: Users },
  { id: 'interested', label: 'Interested', icon: UserPlus },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
  { id: 'calendar', label: 'Shoot Calendar', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export const FreelancerTeamManager: React.FC<FreelancerTeamManagerProps> = (props) => {
  const {
    freelancers,
    categories,
    assignments,
    payments,
    attendanceRecords,
    dataReceivedList,
    activityLogs,
    projects,
    onSaveFreelancer,
    onSaveCategories,
    onSaveAssignments,
    onUpdateAssignmentStatus,
    onSavePayment,
    onSaveAttendance,
    onUpdateAvailability,
    onSaveDataReceived,
    onUpdateDataStatus,
    onUpdateDocument,
    onDeleteFreelancer,
    onDeleteAssignment,
    focusDate,
    focusProjectId,
    focusShootId,
  } = props;

  const { can } = usePermission();
  const { showToast } = useToast();
  const canCreate = can('freelancers.create');
  const canEdit = can('freelancers.edit');
  const canDelete = can('freelancers.delete');
  const canAssign = can('freelancers.edit');
  const canPay = can('freelancers.manage_payments');

  const [activeSubTab, setActiveSubTab] = useState<FreelancerTab>(focusDate ? 'calendar' : 'dashboard');
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showFreelancerFormModal, setShowFreelancerFormModal] = useState(false);
  const [showAssignView, setShowAssignView] = useState(false);
  const [assignFreelancerId, setAssignFreelancerId] = useState<string | undefined>();
  const [assignProjectId, setAssignProjectId] = useState<string | undefined>(focusProjectId);
  const [assignShootId, setAssignShootId] = useState<string | undefined>(focusShootId);
  const [assignRole, setAssignRole] = useState<string | undefined>();
  const [editingFreelancer, setEditingFreelancer] = useState<Freelancer | null>(null);
  const [selectedProfileFreelancer, setSelectedProfileFreelancer] = useState<Freelancer | null>(null);
  const [listCategory, setListCategory] = useState('all');
  const [calendarDate, setCalendarDate] = useState(focusDate || '');

  React.useEffect(() => {
    if (focusDate) {
      setCalendarDate(focusDate);
      setActiveSubTab('calendar');
    }
  }, [focusDate]);

  const openAssign = (freelancerId?: string) => {
    if (!canAssign) return;
    setAssignFreelancerId(freelancerId);
    setAssignProjectId(focusProjectId);
    setAssignShootId(focusShootId);
    setAssignRole(undefined);
    setShowAssignView(true);
  };

  const openPendingShootAssign = (projectId: string, shootId: string, role?: string) => {
    if (!canAssign) return;
    setAssignFreelancerId(undefined);
    setAssignProjectId(projectId);
    setAssignShootId(shootId);
    setAssignRole(role);
    setShowAssignView(true);
  };

  const handleOpenAddForm = () => {
    if (!canCreate) return;
    setEditingFreelancer(null);
    setShowFreelancerFormModal(true);
  };

  const handleOpenEditForm = (freelancer: Freelancer) => {
    if (!canEdit) return;
    setEditingFreelancer(freelancer);
    setShowFreelancerFormModal(true);
  };

  const handleSaveFreelancerHandler = (saved: Freelancer) => {
    onSaveFreelancer(saved);
    setShowFreelancerFormModal(false);
    setEditingFreelancer(null);
  };

  const handleMarkInterested = (freelancer: Freelancer) => {
    if (!canEdit) return;
    if (freelancer.preferredTier === 'under_review') {
      showToast('Freelancer is already in Interested.');
      return;
    }
    if (freelancer.applicationStatus === 'approved' && freelancer.workingStatus === 'active') {
      showToast('Freelancer is already approved.', { variant: 'error' });
      return;
    }
    onSaveFreelancer({
      ...freelancer,
      preferredTier: 'under_review',
      applicationStatus: freelancer.applicationStatus || 'under_review',
      workingStatus: freelancer.workingStatus || 'inactive',
      status: freelancer.status || 'inactive',
    });
    showToast('Freelancer added to Interested.');
  };

  const handleApproveFreelancer = (freelancer: Freelancer) => {
    if (!canEdit) return;
    onSaveFreelancer({
      ...freelancer,
      applicationStatus: 'approved',
      workingStatus: 'active',
      status: 'active',
      preferredTier: freelancer.preferredTier === 'under_review' ? 'new' : freelancer.preferredTier,
    });
    showToast('Freelancer approved successfully.');
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(221,200,156,.2),transparent_30%),linear-gradient(125deg,#33514A,#55333f_50%,#1b2825)] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#e0ece9]">
              Studio Production Network
            </span>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <UserPlus className="size-6 text-[#d5e4e1]" />
              </span>
              Freelancer Team
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
              Talent directory, shoot invitations, availability and freelancer payouts — one production desk for {BRAND.name}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
            <button type="button" onClick={() => setShowCategoriesModal(true)} className={BTN_GHOST + ' !border-white/20 !bg-white/10 !text-white hover:!bg-white/15'}>
              <Tag className="size-3.5" /> Categories
            </button>
            )}
            {canCreate && (
            <button type="button" onClick={handleOpenAddForm} className={BTN_CREAM}>
              <UserPlus className="size-4" />
              Add Freelancer
            </button>
            )}
          </div>
        </div>
      </section>

      <section className={`${CARD} p-3 sm:p-4`}>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-[#e2d9d3] bg-[#f6f1ee] p-1.5" aria-label="Freelancer sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSubTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-xs font-extrabold transition sm:flex-none ${
                activeSubTab === id ? TOGGLE_ACTIVE : TOGGLE_IDLE
              }`}
              aria-current={activeSubTab === id ? 'page' : undefined}
            >
              <Icon className="size-3.5" />
              {label}
              {id === 'all_freelancers' && <span className="text-[10px] font-black opacity-60">({freelancers.length})</span>}
            </button>
          ))}
        </nav>
      </section>

      {activeSubTab === 'dashboard' && (
        <FreelancerDashboardView
          freelancers={freelancers}
          assignments={assignments}
          payments={payments}
          dataReceivedList={dataReceivedList}
          categories={categories}
          projects={projects}
          onTabChange={(tab) => {
            if (tab === 'assignments') {
              openAssign();
              return;
            }
            setActiveSubTab(tab as FreelancerTab);
          }}
          onAddFreelancerClick={canCreate ? handleOpenAddForm : undefined}
          onAssignShootClick={canAssign ? () => openAssign() : undefined}
          onRecordPaymentClick={canPay ? () => setActiveSubTab('payments') : undefined}
          onManageCategoriesClick={canEdit ? () => setShowCategoriesModal(true) : undefined}
          onOpenProfile={(f) => setSelectedProfileFreelancer(f)}
          onFilterCategory={(name) => {
            setListCategory(name);
            setActiveSubTab('all_freelancers');
          }}
          onAssignPendingShootClick={canAssign ? openPendingShootAssign : undefined}
        />
      )}

      {activeSubTab === 'all_freelancers' && (
        <FreelancerMarketplaceView mode="find" projects={projects} />
      )}

      {activeSubTab === 'interested' && (
        <FreelancerMarketplaceView mode="interested" projects={projects} />
      )}

      {activeSubTab === 'applications' && (
        <FreelancerApplicationsView
          freelancers={freelancers}
          onOpenProfile={(freelancer) => setSelectedProfileFreelancer(freelancer)}
          onSaveFreelancer={onSaveFreelancer}
          onAddFreelancerClick={handleOpenAddForm}
        />
      )}

      {activeSubTab === 'calendar' && (
        <ShootCalendarView
          assignments={assignments}
          freelancers={freelancers}
          projects={projects}
          focusDate={calendarDate}
          onAssignShoot={canAssign ? () => openAssign() : undefined}
        />
      )}

      {activeSubTab === 'payments' && (
        <FreelancerPaymentsView payments={payments} assignments={assignments} freelancers={freelancers} onSavePayment={canPay ? onSavePayment : undefined} />
      )}

      {activeSubTab === 'reports' && (
        <FreelancerReportsView
          freelancers={freelancers}
          assignments={assignments}
          payments={payments}
          dataReceivedList={dataReceivedList}
          categories={categories}
        />
      )}

      {canEdit && showCategoriesModal && (
        <CategoriesManagerModal
          categories={categories}
          onSaveCategories={onSaveCategories}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}

      {(canCreate || canEdit) && showFreelancerFormModal && (
        <FreelancerFormModal
          existingFreelancer={editingFreelancer}
          categories={categories}
          onSave={handleSaveFreelancerHandler}
          onClose={() => {
            setShowFreelancerFormModal(false);
            setEditingFreelancer(null);
          }}
        />
      )}

      {selectedProfileFreelancer && (
        <FreelancerProfileModal
          freelancer={freelancers.find((f) => f.id === selectedProfileFreelancer.id) || selectedProfileFreelancer}
          assignments={assignments}
          payments={payments}
          attendanceRecords={attendanceRecords}
          dataReceivedList={dataReceivedList}
          activityLogs={activityLogs}
          onEdit={canEdit ? (f) => {
            setSelectedProfileFreelancer(null);
            handleOpenEditForm(f);
          } : undefined}
          onClose={() => setSelectedProfileFreelancer(null)}
          onAddPaymentClick={canPay ? () => {
            setSelectedProfileFreelancer(null);
            setActiveSubTab('payments');
          } : undefined}
          onAssignShootClick={canAssign ? (id) => {
            setSelectedProfileFreelancer(null);
            openAssign(id);
          } : undefined}
          onUpdateDocument={canEdit ? onUpdateDocument : undefined}
          onDeleteFreelancer={canDelete ? onDeleteFreelancer : undefined}
          onSaveFreelancer={canEdit ? onSaveFreelancer : undefined}
        />
      )}

      {canAssign && showAssignView && (
        <AssignShootModal
          freelancers={freelancers}
          projects={projects}
          assignments={assignments}
          initialFreelancerId={assignFreelancerId}
          initialProjectId={assignProjectId}
          initialShootId={assignShootId}
          initialDate={calendarDate}
          initialRole={assignRole}
          onSave={(item) => {
            onSaveAssignments([item]);
            setShowAssignView(false);
            setAssignFreelancerId(undefined);
            setAssignProjectId(undefined);
            setAssignShootId(undefined);
            setAssignRole(undefined);
          }}
          onClose={() => {
            setShowAssignView(false);
            setAssignFreelancerId(undefined);
            setAssignProjectId(undefined);
            setAssignShootId(undefined);
            setAssignRole(undefined);
          }}
        />
      )}
    </div>
  );
};
