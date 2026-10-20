import React, { useEffect, useMemo, useState } from 'react';
import { Freelancer, FreelancerCategory, FreelancerAssignment, FreelancerPayment } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { CheckCircle, LayoutGrid, List, MapPin, Search, Star, UserCheck, UserPlus } from 'lucide-react';
import { Badge, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState, FIELD, LABEL, TD, TH } from '@/features/team/components/TeamUiKit';
import {
  formatInr,
  freelancerLedger,
  freelancerPerformance,
  getWorkingStatus,
  isPreferredFreelancer,
  matchesTalentSearch,
  WORKING_LABELS,
} from '../freelancerDomain';

interface AllFreelancersViewProps {
  freelancers: Freelancer[];
  categories: FreelancerCategory[];
  assignments?: FreelancerAssignment[];
  payments?: FreelancerPayment[];
  onOpenProfile: (freelancer: Freelancer) => void;
  onEditFreelancer?: (freelancer: Freelancer) => void;
  onAddFreelancerClick?: () => void;
  onAssignShootClick?: (freelancerId: string) => void;
  onRecordPaymentClick?: (freelancerId: string) => void;
  onDeleteFreelancer?: (freelancerId: string) => void;
  onManageCategoriesClick?: () => void;
  onMarkInterested?: (freelancer: Freelancer) => void;
  onApproveFreelancer?: (freelancer: Freelancer) => void;
  initialCategory?: string;
  mode?: 'find' | 'interested';
}

export const AllFreelancersView: React.FC<AllFreelancersViewProps> = ({
  freelancers,
  categories,
  assignments = [],
  payments = [],
  onOpenProfile,
  onEditFreelancer,
  onAddFreelancerClick,
  onAssignShootClick,
  onRecordPaymentClick,
  onDeleteFreelancer,
  onManageCategoriesClick,
  onMarkInterested,
  onApproveFreelancer,
  initialCategory = 'all',
  mode = 'find',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deletingFreelancer, setDeletingFreelancer] = useState<Freelancer | null>(null);

  useEffect(() => {
    if (initialCategory) setCategoryFilter(initialCategory);
  }, [initialCategory]);

  const sourceFreelancers = useMemo(
    () => (mode === 'interested' ? freelancers.filter((f) => f.preferredTier === 'under_review') : freelancers),
    [freelancers, mode]
  );

  const filtered = useMemo(() => {
    const list = sourceFreelancers.filter((f) =>
      matchesTalentSearch(
        f,
        {
          text: searchQuery,
          category: categoryFilter,
          subCategory: subCategoryFilter,
          city: cityFilter,
          dateKey: dateFilter || undefined,
        },
        assignments
      )
    );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [sourceFreelancers, searchQuery, categoryFilter, subCategoryFilter, cityFilter, dateFilter, assignments]);

  const activeFilterCount = [
    categoryFilter !== 'all',
    subCategoryFilter !== 'all',
    !!cityFilter,
    !!dateFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setCityFilter('');
    setDateFilter('');
  };

  const selectedCategory = categories.find((category) => category.name === categoryFilter);
  const subCategoryOptions = selectedCategory?.subCategories || [];

  const isInterested = (freelancer: Freelancer) => freelancer.preferredTier === 'under_review';
  const isApproved = (freelancer: Freelancer) => freelancer.applicationStatus === 'approved' && freelancer.workingStatus === 'active' && freelancer.status === 'active';
  const heading = mode === 'interested' ? 'Interested Freelancers' : 'Find Freelancer';
  const subtitle = mode === 'interested'
    ? 'Freelancers selected for further review and potential assignment.'
    : 'Discover photographers, cinematographers, editors and other freelance talent.';
  const emptyTitle = mode === 'interested'
    ? 'No interested freelancers'
    : sourceFreelancers.length === 0 ? 'No freelancers yet' : 'No freelancers found';
  const emptyMessage = mode === 'interested'
    ? 'Freelancers you mark as interested will appear here for review.'
    : sourceFreelancers.length === 0
      ? 'Build your production team by adding photographers, cinematographers, drone operators, editors and assistants.'
      : 'Try another name, category, city or skill. Double-booked talent is hidden when a shoot date is selected.';

  return (
    <div className="space-y-5">
      <div className={`${CARD} space-y-4 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-black uppercase tracking-wide text-slate-900">{heading}</h2>
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onManageCategoriesClick && (
              <button type="button" onClick={onManageCategoriesClick} className={BTN_GHOST}>Manage Categories</button>
            )}
            {mode === 'find' && onAddFreelancerClick && (
            <button type="button" onClick={onAddFreelancerClick} className={BTN_PRIMARY}>
              <UserPlus className="size-3.5" /> Add Freelancer
            </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, phone, WhatsApp, email, city, skills or equipment"
            className={`${FIELD} pl-10`}
            aria-label="Search freelancers"
          />
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className={`grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 ${categoryFilter === 'all' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
            <label>
              <span className={LABEL}>Category</span>
              <select
                className={FIELD}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter('all');
                }}
              >
                <option value="all">All</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            {categoryFilter !== 'all' && (
            <label>
              <span className={LABEL}>Sub Category</span>
              <select className={FIELD} value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)}>
                <option value="all">All</option>
                {subCategoryOptions.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </label>
            )}
            <label>
              <span className={LABEL}>City</span>
              <input className={FIELD} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Jaipur" />
            </label>
            <label>
              <span className={LABEL}>Available on</span>
              <input type="date" className={FIELD} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </label>
          </div>
          <div className="flex shrink-0 items-end justify-end gap-1">
            {activeFilterCount > 0 && (
              <button type="button" className={BTN_GHOST} onClick={clearFilters}>Clear ({activeFilterCount})</button>
            )}
            <button type="button" onClick={() => setViewMode('grid')} className={`${BTN_GHOST} ${viewMode === 'grid' ? 'border-rose-300 bg-[#fbfaf8]' : ''}`} aria-pressed={viewMode === 'grid'} aria-label="Card view">
              <LayoutGrid className="size-3.5" /> Cards
            </button>
            <button type="button" onClick={() => setViewMode('table')} className={`${BTN_GHOST} ${viewMode === 'table' ? 'border-rose-300 bg-[#fbfaf8]' : ''}`} aria-pressed={viewMode === 'table'} aria-label="Table view">
              <List className="size-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={UserPlus}
            title={emptyTitle}
            message={emptyMessage}
            action={
              mode === 'find' && (onAddFreelancerClick || onManageCategoriesClick) ? (
              <div className="flex flex-wrap justify-center gap-2">
                {onAddFreelancerClick && (
                <button type="button" onClick={onAddFreelancerClick} className={BTN_PRIMARY}>
                  <UserPlus className="size-3.5" /> Add Freelancer
                </button>
                )}
                {onManageCategoriesClick && (
                  <button type="button" onClick={onManageCategoriesClick} className={BTN_GHOST}>Manage Categories</button>
                )}
              </div>
              ) : undefined
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((freelancer) => {
            const stats = freelancerPerformance(freelancer, assignments, payments);
            const lastShoot = [...assignments.filter((a) => a.freelancerId === freelancer.id)].sort((a, b) => (b.shootDate || '').localeCompare(a.shootDate || ''))[0];
            return (
              <article key={freelancer.id} className={`${CARD} flex flex-col p-5`}>
                <button type="button" onClick={() => onOpenProfile(freelancer)} className="flex items-start gap-3 text-left">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e0ece9] text-sm font-black text-[#254b42]">
                    {freelancer.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={freelancer.profilePhoto} alt="" className="size-14 object-cover" />
                    ) : (
                      freelancer.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-900">{freelancer.name}</span>
                      {isPreferredFreelancer(freelancer) && <Badge className="border-amber-200 bg-amber-50 text-amber-800">Preferred</Badge>}
                      {isInterested(freelancer) && <Badge className="border-sky-200 bg-sky-50 text-sky-800">Interested</Badge>}
                      {isApproved(freelancer) && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Approved</Badge>}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{freelancer.freelancerId}</span>
                    <span className="mt-0.5 block text-xs font-bold text-[#2f5f54]">{freelancer.subCategory || freelancer.mainCategory}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{freelancer.city || '—'}</span>
                      <span>{freelancer.experienceYears || 0} yrs</span>
                      {(freelancer.rating || 0) > 0 && (
                        <span className="inline-flex items-center gap-1"><Star className="size-3 text-amber-500" />{freelancer.rating}</span>
                      )}
                    </span>
                  </span>
                </button>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(freelancer.skills || []).slice(0, 3).map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#fbfaf8] p-2 text-center text-[10px]">
                  <div>
                    <p className="font-bold uppercase text-slate-400">Availability</p>
                    <p className="font-extrabold text-slate-800">{freelancer.availabilityStatus || 'Available'}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-slate-400">Shoots</p>
                    <p className="font-extrabold text-slate-800">{stats.completed}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-slate-400">Rate</p>
                    <p className="font-extrabold text-slate-800">{formatInr(freelancer.perDayCharges)}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">Last shoot: {lastShoot?.projectName || 'None yet'}</p>
                <Badge className="mt-2 w-fit border-[#ded5cf] bg-white text-slate-700">{WORKING_LABELS[getWorkingStatus(freelancer)]}</Badge>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eee7e2] pt-3">
                  <button type="button" onClick={() => onOpenProfile(freelancer)} className={BTN_PRIMARY}>View Profile</button>
                  {onMarkInterested && !isInterested(freelancer) && !isApproved(freelancer) && (
                  <button type="button" onClick={() => onMarkInterested(freelancer)} className={BTN_GHOST}>
                    <UserCheck className="size-3.5" /> Interested
                  </button>
                  )}
                  {onApproveFreelancer && isInterested(freelancer) && (
                  <button type="button" onClick={() => onApproveFreelancer(freelancer)} className={BTN_GHOST}>
                    <CheckCircle className="size-3.5" /> Approve
                  </button>
                  )}
                  {onAssignShootClick && isApproved(freelancer) && (
                  <button type="button" onClick={() => onAssignShootClick(freelancer.id)} className={BTN_GHOST}>Assign Freelancer</button>
                  )}
                  <button type="button" onClick={() => onOpenProfile(freelancer)} className={BTN_GHOST}>Check Availability</button>
                  {onRecordPaymentClick && (
                  <button type="button" onClick={() => onRecordPaymentClick(freelancer.id)} className={BTN_GHOST}>Record Payment</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-[#f6f1ee]">
              <tr>
                <TH>Freelancer</TH>
                <TH>Role</TH>
                <TH>City</TH>
                <TH>Availability</TH>
                <TH>Rate</TH>
                <TH>Shoots</TH>
                <TH>Status</TH>
                {mode === 'interested' && <TH>Interest</TH>}
                <TH>Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const stats = freelancerPerformance(f, assignments, payments);
                return (
                  <tr key={f.id} className="border-t border-[#eee7e2]">
                    <TD>
                      <button type="button" onClick={() => onOpenProfile(f)} className="font-extrabold text-slate-900">
                        {f.name}
                      </button>
                      <p className="text-[10px] font-bold text-slate-400">{f.freelancerId}</p>
                    </TD>
                    <TD>{f.subCategory}</TD>
                    <TD>{f.city || '—'}</TD>
                    <TD>{f.availabilityStatus || 'Available'}</TD>
                    <TD className="font-mono font-bold">{formatInr(f.perDayCharges)}</TD>
                    <TD>{stats.totalShoots}</TD>
                    <TD>{WORKING_LABELS[getWorkingStatus(f)]}</TD>
                    {mode === 'interested' && <TD><Badge className="border-sky-200 bg-sky-50 text-sky-800">Interested</Badge></TD>}
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => onOpenProfile(f)} className={BTN_GHOST}>View</button>
                        {onMarkInterested && !isInterested(f) && !isApproved(f) && (
                        <button type="button" onClick={() => onMarkInterested(f)} className={BTN_GHOST}>Interested</button>
                        )}
                        {onApproveFreelancer && isInterested(f) && (
                        <button type="button" onClick={() => onApproveFreelancer(f)} className={BTN_GHOST}>Approve</button>
                        )}
                        {onAssignShootClick && isApproved(f) && (
                        <button type="button" onClick={() => onAssignShootClick(f.id)} className={BTN_GHOST}>Assign</button>
                        )}
                        {onEditFreelancer && (
                        <button type="button" onClick={() => onEditFreelancer(f)} className={BTN_GHOST}>Edit</button>
                        )}
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingFreelancer}
        title="Delete Freelancer Profile"
        itemTitle={deletingFreelancer?.name}
        message={deletingFreelancer ? `Delete "${deletingFreelancer.name}" (${deletingFreelancer.freelancerId})? Assignments for this freelancer will also be removed.` : ''}
        onConfirm={() => {
          if (deletingFreelancer && onDeleteFreelancer) onDeleteFreelancer(deletingFreelancer.id);
          setDeletingFreelancer(null);
        }}
        onCancel={() => setDeletingFreelancer(null)}
      />
    </div>
  );
};
