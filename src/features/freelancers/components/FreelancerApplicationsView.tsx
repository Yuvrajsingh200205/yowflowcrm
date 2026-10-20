import React, { useState } from 'react';
import { Freelancer, FreelancerApplicationStatus } from '@/types';
import { ClipboardList, UserPlus } from 'lucide-react';
import { Badge, BTN_DANGER, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState } from '@/features/team/components/TeamUiKit';
import { APPLICATION_LABELS, getApplicationStatus, isPendingApplication } from '../freelancerDomain';

interface FreelancerApplicationsViewProps {
  freelancers: Freelancer[];
  onOpenProfile: (freelancer: Freelancer) => void;
  onSaveFreelancer: (freelancer: Freelancer) => void;
  onAddFreelancerClick: () => void;
}

const PIPELINE: FreelancerApplicationStatus[] = ['applied', 'under_review', 'shortlisted', 'verification', 'changes_requested'];

export const FreelancerApplicationsView: React.FC<FreelancerApplicationsViewProps> = ({
  freelancers,
  onOpenProfile,
  onSaveFreelancer,
  onAddFreelancerClick,
}) => {
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState<Freelancer | null>(null);
  const apps = freelancers.filter((f) => isPendingApplication(f) || getApplicationStatus(f) === 'rejected');

  const setStatus = (freelancer: Freelancer, applicationStatus: FreelancerApplicationStatus) => {
    const workingStatus = applicationStatus === 'approved' ? 'active' : freelancer.workingStatus;
    onSaveFreelancer({
      ...freelancer,
      applicationStatus,
      workingStatus,
      status: applicationStatus === 'approved' ? 'active' : freelancer.status,
      preferredTier: applicationStatus === 'approved' ? freelancer.preferredTier || 'new' : freelancer.preferredTier,
      internalNotes: note.trim() ? `${freelancer.internalNotes || ''}\n${new Date().toLocaleDateString()}: ${note.trim()}`.trim() : freelancer.internalNotes,
    });
    setNote('');
    setRejecting(null);
  };

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-4`}>
        <h2 className="text-base font-black text-slate-900">Applications</h2>
        <p className="text-xs font-medium text-slate-500">Review registrations before they join the active roster. Approved talent becomes an active freelancer.</p>
      </div>

      {apps.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={ClipboardList}
            title="No applications in review"
            message="New freelancer registrations will appear here. You can also add someone manually and mark them as Applied."
            action={
              <button type="button" onClick={onAddFreelancerClick} className={BTN_PRIMARY}>
                <UserPlus className="size-3.5" /> Add Freelancer
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((f) => {
            const status = getApplicationStatus(f);
            return (
              <article key={f.id} className={`${CARD} p-5`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button type="button" onClick={() => onOpenProfile(f)} className="text-left">
                    <p className="text-sm font-black text-slate-900">{f.name}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {f.freelancerId} · {f.subCategory || f.mainCategory} · {f.city || 'Location pending'}
                    </p>
                    {f.bio && <p className="mt-2 max-w-2xl text-xs text-slate-600">{f.bio}</p>}
                  </button>
                  <Badge className={status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}>
                    {APPLICATION_LABELS[status]}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onOpenProfile(f)} className={BTN_GHOST}>Review Profile</button>
                  {PIPELINE.filter((s) => s !== status).slice(0, 3).map((s) => (
                    <button key={s} type="button" onClick={() => setStatus(f, s)} className={BTN_GHOST}>
                      {APPLICATION_LABELS[s]}
                    </button>
                  ))}
                  <button type="button" onClick={() => setStatus(f, 'changes_requested')} className={BTN_GHOST}>Request Changes</button>
                  <button type="button" onClick={() => setStatus(f, 'approved')} className={BTN_PRIMARY}>Approve</button>
                  <button type="button" onClick={() => setRejecting(f)} className={BTN_DANGER}>Reject</button>
                </div>
                {rejecting?.id === f.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="w-full rounded-xl border border-[#ded5cf] bg-[#FBFDF6] p-3 text-sm"
                      placeholder="Internal rejection note (admin only)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button type="button" onClick={() => setStatus(f, 'rejected')} className={BTN_DANGER}>Confirm reject</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
