'use client';

import React, { useMemo, useState } from 'react';
import { Freelancer, FreelancerAssignment, Project } from '@/types';
import { Film } from 'lucide-react';
import { BTN_GHOST, BTN_PRIMARY, FIELD, LABEL, Modal, ModalHero } from '@/features/team/components/TeamUiKit';
import { findDateConflicts, formatInr } from '../freelancerDomain';

const ROLES = [
  'Photographer',
  'Cinematographer',
  'Drone Operator',
  'Assistant',
  'Editor',
  'Album Designer',
  'Other',
];

interface AssignShootModalProps {
  freelancers: Freelancer[];
  projects: Project[];
  assignments: FreelancerAssignment[];
  initialFreelancerId?: string;
  initialProjectId?: string;
  initialShootId?: string;
  initialDate?: string;
  initialRole?: string;
  onSave: (assignment: FreelancerAssignment) => void;
  onClose: () => void;
}

export const AssignShootModal: React.FC<AssignShootModalProps> = ({
  freelancers,
  projects,
  assignments,
  initialFreelancerId,
  initialProjectId,
  initialShootId,
  initialDate,
  initialRole,
  onSave,
  onClose,
}) => {
  const shoots = useMemo(
    () =>
      projects.flatMap((project) =>
        (project.shoots || [])
          .filter((shoot) => shoot.status !== 'cancelled')
          .map((shoot) => ({
            key: `${project.id}:${shoot.id}`,
            projectId: project.id,
            shootId: shoot.id,
            clientName: project.clientWeddingTitle,
            eventName: shoot.title,
            date: shoot.date,
            startTime: shoot.startTime || shoot.time || '09:00 AM',
            endTime: shoot.endTime || '',
            venue: shoot.venue || project.venueLocation,
            location: shoot.location || shoot.venue || project.venueLocation,
          }))
      ),
    [projects]
  );

  const defaultKey =
    (initialProjectId && initialShootId && `${initialProjectId}:${initialShootId}`) ||
    shoots.find((s) => s.date === initialDate)?.key ||
    shoots[0]?.key ||
    '';

  const [shootKey, setShootKey] = useState(defaultKey);
  const [role, setRole] = useState(initialRole || ROLES[0]);
  const [freelancerId, setFreelancerId] = useState(initialFreelancerId || freelancers.find((f) => f.status === 'active')?.id || freelancers[0]?.id || '');
  const [amount, setAmount] = useState(() => {
    const fl = freelancers.find((f) => f.id === (initialFreelancerId || freelancers[0]?.id));
    return fl?.perDayCharges || 0;
  });
  const [override, setOverride] = useState(false);

  const shoot = shoots.find((s) => s.key === shootKey);
  const freelancer = freelancers.find((f) => f.id === freelancerId);
  const conflicts = shoot && freelancerId ? findDateConflicts(freelancerId, shoot.date, assignments, undefined, shoot.projectId) : [];
  const blocked = conflicts.length > 0 && !override;

  const handleFreelancerChange = (id: string) => {
    setFreelancerId(id);
    const fl = freelancers.find((f) => f.id === id);
    if (fl) setAmount(fl.perDayCharges || 0);
    setOverride(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoot || !freelancer || blocked) return;
    onSave({
      id: `f-assign-${Date.now()}`,
      projectId: shoot.projectId,
      projectName: shoot.clientName,
      clientName: shoot.clientName,
      eventName: shoot.eventName,
      shootDate: shoot.date,
      startTime: shoot.startTime,
      endTime: shoot.endTime,
      shootLocation: shoot.location,
      venue: shoot.venue,
      freelancerId: freelancer.id,
      freelancerName: freelancer.name,
      category: freelancer.mainCategory,
      subCategory: freelancer.subCategory,
      role,
      freelancerCharges: Number(amount) || 0,
      travelCharges: freelancer.travelCharges || 0,
      extraCharges: 0,
      totalAgreedAmount: Number(amount) || 0,
      advancePaid: 0,
      pendingAmount: Number(amount) || 0,
      paymentStatus: 'unpaid',
      assignmentStatus: 'confirmed',
      invitationStatus: 'accepted',
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Modal isOpen onClose={onClose} labelledBy="assign-shoot-title" widthClass="max-w-lg">
      <ModalHero
        icon={Film}
        eyebrow="Crew booking"
        title="Assign Shoot"
        description="Pick the client shoot, role and freelancer. Conflicts are checked before confirm."
        onClose={onClose}
        labelledBy="assign-shoot-title"
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {shoots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#ded5cf] bg-[#FBFDF6] p-4 text-sm text-slate-600">
            No existing shoots found. Add a shoot on the client project first.
          </p>
        ) : (
          <>
            <label>
              <span className={LABEL}>Client shoot</span>
              <select className={FIELD} value={shootKey} onChange={(e) => setShootKey(e.target.value)}>
                {shoots.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.clientName} · {s.eventName} · {s.date}
                  </option>
                ))}
              </select>
            </label>
            {shoot && (
              <p className="text-xs font-medium text-slate-500">
                {shoot.location} · {shoot.startTime}
                {shoot.endTime ? ` – ${shoot.endTime}` : ''}
              </p>
            )}
            <label>
              <span className={LABEL}>Role on this shoot</span>
              <select className={FIELD} value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={LABEL}>Freelancer</span>
              <select className={FIELD} value={freelancerId} onChange={(e) => handleFreelancerChange(e.target.value)}>
                {freelancers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.preferredTier === 'preferred' ? 'Preferred · ' : ''}
                    {f.name} · {f.subCategory || f.mainCategory}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={LABEL}>Agreed amount</span>
              <input type="number" min={0} className={FIELD} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </label>
            {conflicts[0] && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-extrabold">Freelancer already assigned</p>
                <p className="mt-1">
                  Existing: {conflicts[0].clientName || conflicts[0].projectName} · {conflicts[0].shootDate} · {conflicts[0].shootLocation || conflicts[0].venue} · {conflicts[0].role}
                </p>
                {shoot && (
                  <p className="mt-1">
                    New: {shoot.clientName} · {shoot.date} · {shoot.location}
                  </p>
                )}
                <label className="mt-2 flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                  Assign anyway
                </label>
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-[#eee7e2] pt-4">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY} disabled={!shoot || !freelancer || blocked}>
            Confirm assignment {amount ? `· ${formatInr(amount)}` : ''}
          </button>
        </div>
      </form>
    </Modal>
  );
};
