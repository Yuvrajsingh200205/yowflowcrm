import React, { useEffect, useState } from 'react';
import { Freelancer, FreelancerAssignment, Project } from '@/types';
import { findDateConflicts } from '../freelancerDomain';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { 
  Film, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  X, 
  Check,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ShootAssignmentsViewProps {
  assignments: FreelancerAssignment[];
  freelancers: Freelancer[];
  projects: Project[];
  onSaveAssignment: (assignment: FreelancerAssignment[]) => void;
  onUpdateAssignmentStatus: (assignmentId: string, status: FreelancerAssignment['assignmentStatus']) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  initialFreelancerId?: string;
}

export const ShootAssignmentsView: React.FC<ShootAssignmentsViewProps> = ({
  assignments,
  freelancers,
  projects,
  onSaveAssignment,
  onUpdateAssignmentStatus,
  onDeleteAssignment,
  initialFreelancerId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [freelancerFilter, setFreelancerFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<FreelancerAssignment | null>(null);

  // Collapse and Hide state for project cards
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(new Set());
  const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set());
  const [showHiddenProjects, setShowHiddenProjects] = useState(false);

  // State for Edit Assignment Modal
  const [editingAssignment, setEditingAssignment] = useState<FreelancerAssignment | null>(null);
  const [editFreelancerId, setEditFreelancerId] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editShootDate, setEditShootDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00 AM');
  const [editEndTime, setEditEndTime] = useState('09:00 PM');
  const [editVenue, setEditVenue] = useState('');
  const [editShootLocation, setEditShootLocation] = useState('');
  const [editCharges, setEditCharges] = useState<number | ''>(0);
  const [editTravel, setEditTravel] = useState<number | ''>(0);
  const [editExtra, setEditExtra] = useState<number | ''>(0);
  const [editAdvance, setEditAdvance] = useState<number | ''>(0);
  const [editStatus, setEditStatus] = useState<FreelancerAssignment['assignmentStatus']>('assigned');
  const [editEventCategory, setEditEventCategory] = useState<'small_event' | 'half_day' | 'full_day' | 'custom'>('full_day');

  const getChargesForCategory = (fl: any, category: string): number => {
    if (!fl) return 5000;
    const baseRate = fl.perDayCharges || 6000;
    if (category === 'small_event') {
      return fl.eventCharges || Math.round(baseRate * 0.4) || 2500;
    }
    if (category === 'half_day') {
      return fl.halfDayCharges || Math.round(baseRate * 0.6) || 3500;
    }
    if (category === 'full_day') {
      return fl.perDayCharges || 6000;
    }
    return baseRate;
  };

  const handleOpenEditAssignment = (assignment: FreelancerAssignment) => {
    setEditingAssignment(assignment);
    const matchedFl = freelancers.find(
      (f) =>
        f.id === assignment.freelancerId ||
        f.name.toLowerCase().trim() === assignment.freelancerName.toLowerCase().trim()
    );
    setEditFreelancerId(matchedFl ? matchedFl.id : assignment.freelancerId || freelancers[0]?.id || '');
    setEditRole(assignment.role || assignment.subCategory || '');
    setEditEventName(assignment.eventName || '');
    setEditShootDate(assignment.shootDate || '');
    setEditStartTime(assignment.startTime || '09:00 AM');
    setEditEndTime(assignment.endTime || '09:00 PM');
    setEditVenue(assignment.venue || '');
    setEditShootLocation(assignment.shootLocation || assignment.venue || '');
    setEditCharges(assignment.freelancerCharges || assignment.totalAgreedAmount || 0);
    setEditTravel(assignment.travelCharges || 0);
    setEditExtra(assignment.extraCharges || 0);
    setEditAdvance(assignment.advancePaid || 0);
    setEditStatus(assignment.assignmentStatus || 'assigned');
    setEditEventCategory('full_day');
  };

  const handleEditCategoryChange = (cat: 'small_event' | 'half_day' | 'full_day' | 'custom') => {
    setEditEventCategory(cat);
    if (cat !== 'custom') {
      const fl = freelancers.find((f) => f.id === editFreelancerId);
      setEditCharges(getChargesForCategory(fl, cat));
    }
  };

  const handleSaveEditedAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    const fl = freelancers.find((f) => f.id === editFreelancerId) || freelancers[0];
    const chg = Number(editCharges) || 0;
    const trv = Number(editTravel) || 0;
    const ext = Number(editExtra) || 0;
    const totalAgreed = chg + trv + ext;
    const adv = Number(editAdvance) || 0;
    const pending = Math.max(0, totalAgreed - adv);

    const updatedAssignment: FreelancerAssignment = {
      ...editingAssignment,
      freelancerId: fl ? fl.id : editingAssignment.freelancerId,
      freelancerName: fl ? fl.name : editingAssignment.freelancerName,
      category: fl ? fl.mainCategory : editingAssignment.category,
      subCategory: fl ? fl.subCategory : editingAssignment.subCategory,
      role: editRole,
      eventName: editEventName,
      shootDate: editShootDate,
      startTime: editStartTime,
      endTime: editEndTime,
      venue: editVenue,
      shootLocation: editShootLocation,
      freelancerCharges: chg,
      travelCharges: trv,
      extraCharges: ext,
      totalAgreedAmount: totalAgreed,
      advancePaid: adv,
      pendingAmount: pending,
      paymentStatus: adv >= totalAgreed ? 'paid' : adv > 0 ? 'partially_paid' : 'unpaid',
      assignmentStatus: editStatus,
    };

    onSaveAssignment([updatedAssignment]);
    setEditingAssignment(null);
  };

  // State for modal inputs
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedShootEventId, setSelectedShootEventId] = useState<string>('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [clientName, setClientName] = useState(projects[0]?.clientWeddingTitle || '');
  const [eventName, setEventName] = useState('');
  const [shootDate, setShootDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('09:00 PM');
  const [venue, setVenue] = useState(projects[0]?.venueLocation || 'Jaipur Venue');
  const [shootLocation, setShootLocation] = useState('Jaipur');

  // Selected Freelancers Array for this Shoot
  interface AssignedFreelancerRow {
    freelancerId: string;
    role: string;
    category: string;
    subCategory: string;
    eventCategory?: 'small_event' | 'half_day' | 'full_day' | 'custom';
    charges: number;
    travel: number;
    extra: number;
    advance: number;
  }

  const [selectedFreelancerRows, setSelectedFreelancerRows] = useState<AssignedFreelancerRow[]>([
    {
      freelancerId: freelancers[0]?.id || '',
      role: 'Lead Candid Photographer',
      category: freelancers[0]?.mainCategory || 'Photographer',
      subCategory: freelancers[0]?.subCategory || 'Candid Photographer',
      eventCategory: 'full_day',
      charges: freelancers[0]?.perDayCharges || 10000,
      travel: freelancers[0]?.travelCharges || 1000,
      extra: 0,
      advance: 2000,
    },
  ]);

  useEffect(() => {
    if (!initialFreelancerId) return;
    const fl = freelancers.find((f) => f.id === initialFreelancerId);
    if (!fl) return;
    setSelectedFreelancerRows([
      {
        freelancerId: fl.id,
        role: fl.subCategory || fl.mainCategory,
        category: fl.mainCategory,
        subCategory: fl.subCategory,
        eventCategory: 'full_day',
        charges: fl.perDayCharges || 0,
        travel: fl.travelCharges || 0,
        extra: 0,
        advance: 0,
      },
    ]);
    setShowAddModal(true);
  }, [initialFreelancerId, freelancers]);

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (projId === 'CUSTOM') {
      setClientName('');
      setVenue('');
      setSelectedShootEventId('');
      setEventName('Wedding Function Shoot');
    } else {
      const proj = projects.find((p) => p.id === projId);
      if (proj) {
        setClientName(proj.clientWeddingTitle);
        setVenue(proj.venueLocation);
        setShootLocation(proj.venueLocation);

        if (proj.shoots && proj.shoots.length > 0) {
          const firstShoot = proj.shoots[0];
          setSelectedShootEventId(firstShoot.id);
          setEventName(firstShoot.title);
          setShootDate(firstShoot.date || new Date().toISOString().split('T')[0]);
          if (firstShoot.startTime) setStartTime(firstShoot.startTime);
          if (firstShoot.endTime) setEndTime(firstShoot.endTime);
          if (firstShoot.venue) setVenue(firstShoot.venue);
          if (firstShoot.location) setShootLocation(firstShoot.location || firstShoot.venue);
        } else {
          setSelectedShootEventId('');
          setEventName('Wedding Phere & Reception');
        }
      }
    }
  };

  const handleShootEventSelect = (shootId: string) => {
    setSelectedShootEventId(shootId);
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj) {
      const shoot = proj.shoots?.find((s) => s.id === shootId);
      if (shoot) {
        setEventName(shoot.title);
        setShootDate(shoot.date || new Date().toISOString().split('T')[0]);
        if (shoot.startTime) setStartTime(shoot.startTime);
        if (shoot.endTime) setEndTime(shoot.endTime);
        if (shoot.venue) setVenue(shoot.venue);
        if (shoot.location) setShootLocation(shoot.location || shoot.venue);
      }
    }
  };

  const handleOpenAddModalForShoot = (
    projId?: string,
    shootTitle?: string,
    dateStr?: string,
    venueStr?: string,
    startT?: string,
    endT?: string,
    roleToAssign?: string,
    plannedName?: string
  ) => {
    setShowAddModal(true);

    // Pre-select matching freelancer based on plannedName or roleToAssign if provided
    let defaultFl = freelancers.find(
      (f) => plannedName && f.name.toLowerCase().includes(plannedName.toLowerCase().trim())
    );
    if (!defaultFl && roleToAssign) {
      const roleLower = roleToAssign.toLowerCase();
      defaultFl = freelancers.find(
        (f) =>
          f.subCategory.toLowerCase().includes(roleLower) ||
          f.mainCategory.toLowerCase().includes(roleLower) ||
          roleLower.includes(f.subCategory.toLowerCase())
      );
    }
    if (!defaultFl) {
      defaultFl = freelancers[0];
    }

    if (defaultFl) {
      setSelectedFreelancerRows([
        {
          freelancerId: defaultFl.id,
          role: roleToAssign || `${defaultFl.subCategory} Role`,
          category: defaultFl.mainCategory,
          subCategory: defaultFl.subCategory,
          charges: defaultFl.perDayCharges || 5000,
          travel: defaultFl.travelCharges || 0,
          extra: 0,
          advance: 0,
        },
      ]);
    }

    if (projId && projId !== 'CUSTOM') {
      setSelectedProjectId(projId);
      const proj = projects.find((p) => p.id === projId);
      if (proj) {
        setClientName(proj.clientWeddingTitle);
        if (shootTitle) {
          const shootMatch = proj.shoots?.find((s) => s.title === shootTitle || s.id === shootTitle);
          if (shootMatch) {
            setSelectedShootEventId(shootMatch.id);
            setEventName(shootMatch.title);
            setShootDate(shootMatch.date || dateStr || new Date().toISOString().split('T')[0]);
            setStartTime(shootMatch.startTime || startT || '09:00 AM');
            setEndTime(shootMatch.endTime || endT || '09:00 PM');
            setVenue(shootMatch.venue || venueStr || proj.venueLocation);
            setShootLocation(shootMatch.location || shootMatch.venue || proj.venueLocation);
            return;
          }
        }
      }
    }

    if (shootTitle) setEventName(shootTitle);
    if (dateStr) setShootDate(dateStr);
    if (venueStr) setVenue(venueStr);
    if (startT) setStartTime(startT);
    if (endT) setEndTime(endT);
  };

  const handleAddFreelancerRow = () => {
    const defaultFl = freelancers.find((f) => !selectedFreelancerRows.some((r) => r.freelancerId === f.id)) || freelancers[0];
    if (defaultFl) {
      setSelectedFreelancerRows([
        ...selectedFreelancerRows,
        {
          freelancerId: defaultFl.id,
          role: `${defaultFl.subCategory} Role`,
          category: defaultFl.mainCategory,
          subCategory: defaultFl.subCategory,
          eventCategory: 'full_day',
          charges: defaultFl.perDayCharges || 6000,
          travel: defaultFl.travelCharges || 0,
          extra: 0,
          advance: 1000,
        },
      ]);
    }
  };

  const handleRemoveFreelancerRow = (index: number) => {
    if (selectedFreelancerRows.length > 1) {
      setSelectedFreelancerRows(selectedFreelancerRows.filter((_, i) => i !== index));
    }
  };

  const handleEventCategoryChange = (index: number, category: 'small_event' | 'half_day' | 'full_day' | 'custom') => {
    const updated = [...selectedFreelancerRows];
    const row = updated[index];
    const fl = freelancers.find((f) => f.id === row.freelancerId);
    let newCharge = row.charges;
    if (category !== 'custom') {
      newCharge = getChargesForCategory(fl, category);
    }
    updated[index] = {
      ...row,
      eventCategory: category,
      charges: newCharge,
    };
    setSelectedFreelancerRows(updated);
  };

  const handleFreelancerChange = (index: number, flId: string) => {
    const fl = freelancers.find((f) => f.id === flId);
    if (!fl) return;

    const updated = [...selectedFreelancerRows];
    const cat = updated[index].eventCategory || 'full_day';
    const newCharges = cat === 'custom' ? updated[index].charges : getChargesForCategory(fl, cat);

    updated[index] = {
      ...updated[index],
      freelancerId: fl.id,
      category: fl.mainCategory,
      subCategory: fl.subCategory,
      charges: newCharges,
      travel: fl.travelCharges || 0,
    };
    setSelectedFreelancerRows(updated);
  };

  const checkDoubleBooking = (freelancerId: string, date: string, ignoreId?: string, ignoreProjectId?: string) => {
    return findDateConflicts(freelancerId, date, assignments, ignoreId, ignoreProjectId)[0];
  };

  // Quick Assign a specific Role / Member from Shoot Management
  const handleQuickAssignRole = (
    projId: string | undefined,
    projName: string,
    clientName: string,
    eventName: string,
    shootDate: string,
    startTime: string,
    endTime: string,
    venue: string,
    shootLocation: string,
    roleToAssign: string,
    preferredName?: string
  ) => {
    let fl = freelancers.find(
      (f) => preferredName && f.name.toLowerCase().includes(preferredName.toLowerCase().trim())
    );

    if (!fl) {
      const roleLower = roleToAssign.toLowerCase();
      fl = freelancers.find((f) => {
        const catLower = (f.subCategory || f.mainCategory || '').toLowerCase();
        return roleLower.includes(catLower) || catLower.includes(roleLower);
      });
    }

    if (!fl) {
      fl = freelancers[0];
    }

    if (!fl) {
      alert('No freelancers available in system! Please add freelancers first.');
      return;
    }

    const conflict = checkDoubleBooking(fl.id, shootDate, undefined, projId);
    if (conflict) {
      alert(`Freelancer is already assigned to another shoot on this date.\n\n${fl.name} — ${conflict.projectName} (${conflict.eventName || conflict.role})`);
      return;
    }

    const assignedName =
      preferredName && preferredName.trim() !== ''
        ? preferredName.trim()
        : fl.name;

    const newAssignment: FreelancerAssignment = {
      id: `f-assign-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: projId && projId !== 'CUSTOM' ? projId : undefined,
      projectName: projName,
      clientName: clientName || projName,
      eventName: eventName,
      shootDate: shootDate,
      startTime: startTime || '09:00 AM',
      endTime: endTime || '09:00 PM',
      venue: venue || 'Venue TBD',
      shootLocation: shootLocation || venue || 'Location TBD',
      freelancerId: fl.id,
      freelancerName: assignedName,
      category: fl.mainCategory,
      subCategory: fl.subCategory,
      role: roleToAssign || fl.subCategory,
      freelancerCharges: fl.perDayCharges || 5000,
      travelCharges: fl.travelCharges || 0,
      extraCharges: 0,
      totalAgreedAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
      advancePaid: 0,
      pendingAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
      paymentStatus: 'unpaid',
      assignmentStatus: 'assigned',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveAssignment([newAssignment]);
  };

  // Quick Auto-Fill Recommended Team (4 standard roles)
  const handleQuickAddRecommendedTeam = (
    projId: string | undefined,
    projName: string,
    clientName: string,
    eventName: string,
    shootDate: string,
    startTime: string,
    endTime: string,
    venue: string,
    shootLocation: string
  ) => {
    const rolesToAllocate = [
      'Lead Photography',
      'Candid Photography',
      'Cinematography',
      'Traditional Videography',
    ];

    const newAssignments: FreelancerAssignment[] = [];
    rolesToAllocate.forEach((role, idx) => {
      const fl = freelancers[idx % freelancers.length] || freelancers[0];
      if (fl) {
        newAssignments.push({
          id: `f-assign-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          projectId: projId && projId !== 'CUSTOM' ? projId : undefined,
          projectName: projName,
          clientName: clientName || projName,
          eventName,
          shootDate,
          startTime: startTime || '09:00 AM',
          endTime: endTime || '09:00 PM',
          venue: venue || 'Venue TBD',
          shootLocation: shootLocation || venue || 'Location TBD',
          freelancerId: fl.id,
          freelancerName: fl.name,
          category: fl.mainCategory,
          subCategory: fl.subCategory,
          role,
          freelancerCharges: fl.perDayCharges || 5000,
          travelCharges: fl.travelCharges || 0,
          extraCharges: 0,
          totalAgreedAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
          advancePaid: 0,
          pendingAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
          paymentStatus: 'unpaid',
          assignmentStatus: 'assigned',
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
    });

    if (newAssignments.length > 0) {
      onSaveAssignment(newAssignments);
    }
  };

  // Auto-Assign all unassigned pending crew from Shoot Management requirements
  const handleAutoAssignAllPendingFromShootMgmt = (
    projId: string | undefined,
    projName: string,
    clientName: string,
    eventName: string,
    shootDate: string,
    startTime: string,
    endTime: string,
    venue: string,
    shootLocation: string,
    pendingReqs: { role: string; plannedName?: string }[]
  ) => {
    const newAssignments: FreelancerAssignment[] = [];
    const usedFlIds = new Set<string>();

    pendingReqs.forEach((req, idx) => {
      let fl = freelancers.find(
        (f) =>
          !usedFlIds.has(f.id) &&
          req.plannedName &&
          f.name.toLowerCase().includes(req.plannedName.toLowerCase().trim())
      );

      if (!fl) {
        const roleLower = req.role.toLowerCase();
        fl = freelancers.find(
          (f) =>
            !usedFlIds.has(f.id) &&
            ((f.subCategory || f.mainCategory || '').toLowerCase().includes(roleLower) ||
              roleLower.includes((f.subCategory || f.mainCategory || '').toLowerCase()))
        );
      }

      if (!fl) {
        fl = freelancers.find((f) => !usedFlIds.has(f.id)) || freelancers[idx % freelancers.length];
      }

      if (fl) {
        usedFlIds.add(fl.id);
        const assignedName =
          req.plannedName && req.plannedName.trim() !== ''
            ? req.plannedName.trim()
            : fl.name;

        newAssignments.push({
          id: `f-assign-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          projectId: projId && projId !== 'CUSTOM' ? projId : undefined,
          projectName: projName,
          clientName: clientName || projName,
          eventName,
          shootDate,
          startTime: startTime || '09:00 AM',
          endTime: endTime || '09:00 PM',
          venue: venue || 'Venue TBD',
          shootLocation: shootLocation || venue || 'Location TBD',
          freelancerId: fl.id,
          freelancerName: assignedName,
          category: fl.mainCategory,
          subCategory: fl.subCategory,
          role: req.role || fl.subCategory,
          freelancerCharges: fl.perDayCharges || 5000,
          travelCharges: fl.travelCharges || 0,
          extraCharges: 0,
          totalAgreedAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
          advancePaid: 0,
          pendingAmount: (fl.perDayCharges || 5000) + (fl.travelCharges || 0),
          paymentStatus: 'unpaid',
          assignmentStatus: 'assigned',
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
    });

    if (newAssignments.length > 0) {
      onSaveAssignment(newAssignments);
    }
  };

  const handleSaveShootAssignments = (e: React.FormEvent) => {
    e.preventDefault();

    const conflicts = selectedFreelancerRows
      .map((row) => ({ row, conflict: checkDoubleBooking(row.freelancerId, shootDate, undefined, selectedProjectId !== 'CUSTOM' ? selectedProjectId : undefined) }))
      .filter((item) => item.conflict);
    if (conflicts.length > 0) {
      const detail = conflicts
        .map((item) => {
          const fl = freelancers.find((f) => f.id === item.row.freelancerId);
          return `${fl?.name || 'Freelancer'} is already assigned to "${item.conflict?.projectName}" on ${shootDate}.`;
        })
        .join('\n');
      if (!window.confirm(`${detail}\n\nAssign anyway? This may create a double booking.`)) return;
    }

    const projName =
      selectedProjectId === 'CUSTOM'
        ? customProjectName || clientName
        : projects.find((p) => p.id === selectedProjectId)?.clientWeddingTitle || clientName;

    const newCreatedAssignments: FreelancerAssignment[] = selectedFreelancerRows.map((row) => {
      const fl = freelancers.find((f) => f.id === row.freelancerId);
      const totalAgreed = Number(row.charges) + Number(row.travel) + Number(row.extra);
      const adv = Number(row.advance) || 0;

      return {
        id: `f-assign-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        projectId: selectedProjectId !== 'CUSTOM' ? selectedProjectId : undefined,
        projectName: projName,
        clientName,
        eventName,
        shootDate,
        startTime,
        endTime,
        shootLocation,
        venue,
        freelancerId: row.freelancerId,
        freelancerName: fl?.name || 'Freelancer',
        category: row.category,
        subCategory: row.subCategory,
        role: row.role,
        freelancerCharges: Number(row.charges),
        travelCharges: Number(row.travel),
        extraCharges: Number(row.extra),
        totalAgreedAmount: totalAgreed,
        advancePaid: adv,
        pendingAmount: Math.max(0, totalAgreed - adv),
        paymentStatus: adv >= totalAgreed ? 'paid' : adv > 0 ? 'partially_paid' : 'unpaid',
        assignmentStatus: 'assigned',
        createdAt: new Date().toISOString().split('T')[0],
      };
    });

    onSaveAssignment(newCreatedAssignments);
    setShowAddModal(false);
  };

  // Helper to extract Shoot Management tracked crew slots
  const getShootMgmtCrewRequirements = (shoot: {
    eventName: string;
    shootDate: string;
    assignments: FreelancerAssignment[];
    rawShoot?: any;
  }) => {
    const reqs: {
      id: string;
      role: string;
      plannedName?: string;
      isAssigned: boolean;
      assignedTo?: FreelancerAssignment;
    }[] = [];

    const raw = shoot.rawShoot;
    const rawReqList: { id: string; role: string; plannedName?: string }[] = [];

    if (raw?.crewAssignments && raw.crewAssignments.length > 0) {
      raw.crewAssignments.forEach((c: any, idx: number) => {
        const plannedName =
          c.name && c.name.trim() !== '' && c.name.toLowerCase() !== 'unassigned' ? c.name.trim() : undefined;
        rawReqList.push({
          id: c.id || `sm-crew-${idx}`,
          role: c.role || 'Photographer',
          plannedName,
        });
      });
    } else if (raw) {
      const namedRoles: { role: string; name?: string }[] = [];
      if (raw.leadPhotographer) namedRoles.push({ role: 'Lead Photographer', name: raw.leadPhotographer });
      if (raw.cinematographer) namedRoles.push({ role: 'Cinematographer', name: raw.cinematographer });
      if (raw.droneOperator) namedRoles.push({ role: 'Drone Operator', name: raw.droneOperator });
      if (raw.assistant) namedRoles.push({ role: 'Assistant', name: raw.assistant });

      namedRoles.forEach((r, idx) => {
        const plannedName =
          r.name && r.name.trim() !== '' && r.name.toLowerCase() !== 'unassigned' ? r.name.trim() : undefined;
        rawReqList.push({
          id: `sm-field-${idx}`,
          role: r.role,
          plannedName,
        });
      });
    }

    const claimedAssignmentIds = new Set<string>();

    rawReqList.forEach((reqItem) => {
      let matched: FreelancerAssignment | undefined = undefined;

      // 1. Name Match first if plannedName is present
      if (reqItem.plannedName) {
        const pLower = reqItem.plannedName.toLowerCase();
        matched = shoot.assignments.find((a) => {
          if (claimedAssignmentIds.has(a.id)) return false;
          const flLower = a.freelancerName.toLowerCase();
          return flLower.includes(pLower) || pLower.includes(flLower);
        });
      }

      // 2. Role / Category match if no direct name match
      if (!matched) {
        const roleLower = reqItem.role.toLowerCase();
        matched = shoot.assignments.find((a) => {
          if (claimedAssignmentIds.has(a.id)) return false;
          const aRole = (a.role || '').toLowerCase();
          const aSub = (a.subCategory || '').toLowerCase();
          const aCat = (a.category || '').toLowerCase();

          return (
            aRole.includes(roleLower) ||
            roleLower.includes(aRole) ||
            aSub.includes(roleLower) ||
            roleLower.includes(aSub) ||
            aCat.includes(roleLower) ||
            roleLower.includes(aCat)
          );
        });
      }

      // 3. Fallback to any unclaimed assignment for this shoot
      if (!matched) {
        matched = shoot.assignments.find((a) => !claimedAssignmentIds.has(a.id));
      }

      if (matched) {
        claimedAssignmentIds.add(matched.id);

        reqs.push({
          ...reqItem,
          isAssigned: true,
          assignedTo: matched,
        });
      } else {
        reqs.push({
          ...reqItem,
          isAssigned: false,
          assignedTo: undefined,
        });
      }
    });

    return reqs;
  };

  // Group all shoots by Project (1 Card per Project containing full details & all function shoots)
  const projectGroupsMap = new Map<string, {
    id: string;
    projectId?: string;
    projectName: string;
    clientName: string;
    venueLocation: string;
    shoots: {
      id: string;
      eventName: string;
      shootDate: string;
      startTime: string;
      endTime: string;
      venue: string;
      shootLocation: string;
      assignments: FreelancerAssignment[];
      rawShoot?: any;
    }[];
  }>();

  // 1. Populate from registered Client Projects
  projects.forEach((proj) => {
    const projKey = proj.id;
    const projShoots = (proj.shoots || []).map((s) => {
      const matchedAssignments = assignments.filter((a) => {
        if (a.projectId && a.projectId === proj.id) {
          return (
            a.eventName.toLowerCase().trim() === s.title.toLowerCase().trim() ||
            a.shootDate === s.date
          );
        }
        return (
          a.projectName.toLowerCase().trim() === proj.clientWeddingTitle.toLowerCase().trim() &&
          (a.eventName.toLowerCase().trim() === s.title.toLowerCase().trim() || a.shootDate === s.date)
        );
      });

      return {
        id: `shoot-${proj.id}-${s.id}`,
        eventName: s.title,
        shootDate: s.date || 'TBD',
        startTime: s.startTime || (s.time ? s.time.split('-')[0]?.trim() : '09:00 AM'),
        endTime: s.endTime || (s.time ? s.time.split('-')[1]?.trim() : '09:00 PM'),
        venue: s.venue || proj.venueLocation || 'Venue TBD',
        shootLocation: s.location || s.venue || proj.venueLocation || 'Location TBD',
        assignments: matchedAssignments,
        rawShoot: s,
      };
    });

    // Check for assignments for this project that aren't matched with proj.shoots
    const knownKeys = new Set(projShoots.map((s) => `${s.eventName.toLowerCase().trim()}_${s.shootDate}`));
    const extraAssignments = assignments.filter((a) => {
      if (
        (a.projectId && a.projectId === proj.id) ||
        a.projectName.toLowerCase().trim() === proj.clientWeddingTitle.toLowerCase().trim()
      ) {
        const key = `${a.eventName.toLowerCase().trim()}_${a.shootDate}`;
        return !knownKeys.has(key);
      }
      return false;
    });

    const extraShootsMap = new Map<string, typeof projShoots[0]>();
    extraAssignments.forEach((a) => {
      const eKey = `${a.eventName}_${a.shootDate}`;
      if (!extraShootsMap.has(eKey)) {
        extraShootsMap.set(eKey, {
          id: `extra-${a.id}`,
          eventName: a.eventName,
          shootDate: a.shootDate,
          startTime: a.startTime || '09:00 AM',
          endTime: a.endTime || '09:00 PM',
          venue: a.venue || proj.venueLocation,
          shootLocation: a.shootLocation || a.venue || proj.venueLocation,
          assignments: [],
          rawShoot: {
            id: `extra-${a.id}`,
            title: a.eventName,
            date: a.shootDate,
            time: `${a.startTime || '09:00 AM'} - ${a.endTime || '09:00 PM'}`,
            venue: a.venue || proj.venueLocation,
            location: a.shootLocation || a.venue || proj.venueLocation,
            status: 'scheduled',
          },
        });
      }
      extraShootsMap.get(eKey)?.assignments.push(a);
    });

    const allProjShoots = [...projShoots, ...Array.from(extraShootsMap.values())];

    if (allProjShoots.length > 0) {
      projectGroupsMap.set(projKey, {
        id: proj.id,
        projectId: proj.id,
        projectName: proj.clientWeddingTitle,
        clientName: proj.clientWeddingTitle,
        venueLocation: proj.venueLocation,
        shoots: allProjShoots,
      });
    }
  });

  // 2. Handle standalone/orphan assignments (custom projects)
  assignments.forEach((a) => {
    let covered = false;
    for (const group of projectGroupsMap.values()) {
      if (group.shoots.some((s) => s.assignments.some((ca) => ca.id === a.id))) {
        covered = true;
        break;
      }
    }

    if (!covered) {
      const customKey = a.projectId || a.projectName || 'CUSTOM';
      if (!projectGroupsMap.has(customKey)) {
        projectGroupsMap.set(customKey, {
          id: customKey,
          projectId: a.projectId,
          projectName: a.projectName,
          clientName: a.clientName || a.projectName,
          venueLocation: a.venue || a.shootLocation || 'Location TBD',
          shoots: [],
        });
      }

      const group = projectGroupsMap.get(customKey)!;
      const existingShoot = group.shoots.find(
        (s) => s.eventName === a.eventName && s.shootDate === a.shootDate
      );
      if (existingShoot) {
        existingShoot.assignments.push(a);
      } else {
        group.shoots.push({
          id: `orphan-shoot-${a.id}`,
          eventName: a.eventName,
          shootDate: a.shootDate,
          startTime: a.startTime || '09:00 AM',
          endTime: a.endTime || '09:00 PM',
          venue: a.venue,
          shootLocation: a.shootLocation || a.venue,
          assignments: [a],
        });
      }
    }
  });

  const allProjectCards = Array.from(projectGroupsMap.values());

  // Filtered list
  const filteredProjectCards = allProjectCards.filter((projCard) => {
    const query = searchQuery.toLowerCase();

    const projMatch =
      projCard.projectName.toLowerCase().includes(query) ||
      projCard.clientName.toLowerCase().includes(query) ||
      projCard.venueLocation.toLowerCase().includes(query);

    const matchingShoots = projCard.shoots.filter((s) => {
      const shootMatch =
        s.eventName.toLowerCase().includes(query) ||
        s.venue.toLowerCase().includes(query) ||
        s.shootLocation.toLowerCase().includes(query) ||
        s.assignments.some(
          (a) =>
            a.freelancerName.toLowerCase().includes(query) ||
            a.role.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query)
        );

      const matchesFreelancer =
        freelancerFilter === 'all' ||
        s.assignments.some((a) => a.freelancerId === freelancerFilter);

      const matchesStatus =
        statusFilter === 'all' ||
        (s.assignments.length > 0
          ? s.assignments.some((a) => a.assignmentStatus === statusFilter)
          : statusFilter === 'assigned');

      return (projMatch || shootMatch) && matchesFreelancer && matchesStatus;
    });

    return matchingShoots.length > 0;
  });

  const visibleProjectCards = filteredProjectCards.filter((projCard) => {
    if (showHiddenProjects) return true;
    return !hiddenProjectIds.has(projCard.id);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2f5f54] flex items-center justify-center font-bold text-white shadow-xs">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Shoot Assignments</h2>
            <p className="text-xs text-slate-500">Assign photographers & cinematographers to client wedding shoots</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Assign Freelancer to Shoot</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search project, freelancer, client, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#366e61]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={freelancerFilter}
            onChange={(e) => setFreelancerFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800"
          >
            <option value="all">All Freelancers ({freelancers.length})</option>
            {freelancers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.subCategory})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="confirmed">Confirmed</option>
            <option value="on_shoot">On Shoot</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {hiddenProjectIds.size > 0 && (
            <button
              onClick={() => setShowHiddenProjects(!showHiddenProjects)}
              className={`px-3 py-2 text-xs font-extrabold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                showHiddenProjects 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {showHiddenProjects ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showHiddenProjects ? 'Showing Hidden Cards' : `Show ${hiddenProjectIds.size} Hidden Card${hiddenProjectIds.size > 1 ? 's' : ''}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignments Cards List - 1 Card per Project */}
      {visibleProjectCards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Film className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-bold">No shoot assignments match your search filter.</p>
          <p className="text-[11px] text-slate-400 mt-1">Add shoot details in client projects or click "+ Assign Freelancer to Shoot".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleProjectCards.map((projCard) => {
            const totalProjectShoots = projCard.shoots.length;
            const allAssignmentsInProject = projCard.shoots.flatMap((s) => s.assignments);
            const totalProjectAssignments = allAssignmentsInProject.length;
            const totalProjectPending = allAssignmentsInProject.reduce(
              (sum, a) => sum + (a.pendingAmount || 0),
              0
            );
            const totalProjectAgreed = allAssignmentsInProject.reduce(
              (sum, a) => sum + (a.totalAgreedAmount || 0),
              0
            );
            const totalProjectPendingSlots = projCard.shoots.reduce((sum, s) => {
              const reqs = getShootMgmtCrewRequirements(s);
              return sum + reqs.filter((r) => !r.isAssigned).length;
            }, 0);
            const isCollapsed = collapsedProjectIds.has(projCard.id);
            const isHidden = hiddenProjectIds.has(projCard.id);

            return (
              <div
                key={projCard.id}
                className={`bg-white rounded-2xl border ${isHidden ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'} p-5 shadow-xs space-y-5`}
              >
                {/* Full Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {projCard.projectName}
                      </h3>
                      <span className="px-2 py-0.5 bg-rose-50 text-[#254b42] border border-rose-200/60 text-[10px] font-extrabold rounded-md uppercase">
                        {totalProjectShoots} {totalProjectShoots === 1 ? 'Shoot Event' : 'Shoot Events'}
                      </span>
                      {isHidden && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-md">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>Client: <strong className="text-slate-800">{projCard.clientName}</strong></span>
                      {projCard.venueLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#366e61]" />
                          <strong className="text-slate-700">{projCard.venueLocation}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {totalProjectAssignments > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl uppercase tracking-wider">
                          {totalProjectAssignments} Crew Assigned
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black rounded-xl uppercase tracking-wider">
                          ⚠️ 0 Crew Allocated
                        </span>
                      )}

                      {totalProjectPendingSlots > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl uppercase tracking-wider">
                          ⚠️ {totalProjectPendingSlots} Crew Pending
                        </span>
                      )}

                      {totalProjectPending > 0 ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-black rounded-xl uppercase tracking-wider font-mono">
                          ⚠️ ₹{totalProjectPending.toLocaleString('en-IN')} Total Pending
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-xl uppercase tracking-wider font-mono">
                          ✓ All Dues Paid
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const firstShoot = projCard.shoots[0];
                        handleOpenAddModalForShoot(
                          projCard.projectId,
                          firstShoot?.eventName || '',
                          firstShoot?.shootDate || '',
                          firstShoot?.venue || projCard.venueLocation || '',
                          firstShoot?.startTime || '',
                          firstShoot?.endTime || ''
                        );
                      }}
                      className="px-3 py-1.5 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Crew</span>
                    </button>

                    {/* Hide / Show Collapse Toggle Button */}
                    <button
                      onClick={() => {
                        setCollapsedProjectIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(projCard.id)) {
                            next.delete(projCard.id);
                          } else {
                            next.add(projCard.id);
                          }
                          return next;
                        });
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer border ${
                        isCollapsed
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title={isCollapsed ? "Show Shoot Details" : "Hide Shoot Details"}
                    >
                      {isCollapsed ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Show</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>

                    {/* Completely Hide Card Option */}
                    <button
                      onClick={() => {
                        setHiddenProjectIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(projCard.id)) {
                            next.delete(projCard.id);
                          } else {
                            next.add(projCard.id);
                          }
                          return next;
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title={isHidden ? "Unhide Card" : "Hide Entire Card"}
                    >
                      {isHidden ? <Eye className="w-4 h-4 text-amber-600" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Function Shoots inside 1 Project Card */}
                {!isCollapsed ? (
                  <div className="grid grid-cols-1 gap-4">
                  {projCard.shoots.map((shoot) => {
                    const shootMgmtCrew = getShootMgmtCrewRequirements(shoot);
                    const autoAssignedCrew = shootMgmtCrew
                      .filter((r) => r.isAssigned && r.assignedTo)
                      .map((r) => r.assignedTo!);

                    const existingIds = new Set(shoot.assignments.map((a) => a.id));
                    const combinedAssignments = [...shoot.assignments];

                    autoAssignedCrew.forEach((a) => {
                      if (!existingIds.has(a.id)) {
                        combinedAssignments.push(a);
                        existingIds.add(a.id);
                      }
                    });

                    const hasCrew = combinedAssignments.length > 0;

                    // Role breakdown calculation from Project Shoot Requirements & Freelancer Assignments
                    const roleMap = new Map<string, number>();

                    if (shootMgmtCrew.length > 0) {
                      shootMgmtCrew.forEach((req) => {
                        const r = req.role || 'Photographer';
                        roleMap.set(r, (roleMap.get(r) || 0) + 1);
                      });
                    } else {
                      combinedAssignments.forEach((a) => {
                        const r = a.subCategory || a.category || a.role || 'Photographer';
                        roleMap.set(r, (roleMap.get(r) || 0) + 1);
                      });
                    }

                    const roleBadges = Array.from(roleMap.entries());

                    return (
                      <div
                        key={shoot.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 space-y-3"
                      >
                        {/* Function Shoot Title & Details Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#2f5f54] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-2xs">
                              {shoot.eventName}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              Function Shoot
                            </span>

                            {/* Role Count Pills */}
                            {roleBadges.map(([roleName, count]) => (
                              <span
                                key={roleName}
                                className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-md"
                              >
                                {count} {roleName}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-[#2f5f54]" />
                              {shoot.shootDate}
                            </span>
                            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#2f5f54]" />
                              {shoot.startTime} - {shoot.endTime}
                            </span>
                            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium truncate max-w-[200px]" title={shoot.venue}>
                              <MapPin className="w-3.5 h-3.5 text-[#2f5f54]" />
                              {shoot.venue}
                            </span>
                          </div>
                        </div>

                        {/* Shoot Management Tracking Status Panel */}
                        {(() => {
                          const shootMgmtCrew = getShootMgmtCrewRequirements(shoot);
                          const pendingReqs = shootMgmtCrew.filter((r) => !r.isAssigned);
                          const assignedReqs = shootMgmtCrew.filter((r) => r.isAssigned);

                          return (
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#2f5f54]"></span>
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                    📋 Tracked Shoot Management Requirements ({shootMgmtCrew.length} Slots)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px]">
                                  {shootMgmtCrew.length > 0 && (
                                    <>
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md">
                                        ✓ {assignedReqs.length} Assigned
                                      </span>
                                      {pendingReqs.length > 0 ? (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded-md">
                                          ⚠️ {pendingReqs.length} Pending Allocation
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                                          ✓ All Slots Allocated
                                        </span>
                                      )}
                                    </>
                                  )}

                                  {pendingReqs.length > 0 && (
                                    <button
                                      onClick={() =>
                                        handleAutoAssignAllPendingFromShootMgmt(
                                          projCard.projectId,
                                          projCard.projectName,
                                          projCard.clientName,
                                          shoot.eventName,
                                          shoot.shootDate,
                                          shoot.startTime,
                                          shoot.endTime,
                                          shoot.venue,
                                          shoot.shootLocation,
                                          pendingReqs
                                        )
                                      }
                                      className="px-2.5 py-1 bg-[#2f5f54] hover:bg-[#254b42] text-white font-extrabold text-[10px] rounded-lg shadow-2xs cursor-pointer transition flex items-center gap-1"
                                    >
                                      <span>⚡ Auto-Assign All {pendingReqs.length} Pending</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {shootMgmtCrew.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {shootMgmtCrew.map((req) => (
                                    <div
                                      key={req.id}
                                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                                        req.isAssigned
                                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                                          : 'bg-amber-50/80 border-amber-200 text-amber-900'
                                      }`}
                                    >
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500 block truncate">
                                          {req.role}
                                        </span>
                                        {req.isAssigned && req.assignedTo ? (
                                          <>
                                            <span className="font-bold text-slate-900 truncate block">
                                              {req.assignedTo.freelancerName}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-emerald-700 block truncate">
                                              ✓ Assigned: {req.assignedTo.freelancerName}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="font-bold text-slate-400 italic truncate block">
                                              Not Assigned
                                            </span>
                                            <span className="text-[10px] font-bold text-amber-700 block">
                                              ⚠️ Pending Allocation
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      <div className="flex-shrink-0">
                                        {!req.isAssigned ? (
                                          <button
                                            onClick={() =>
                                              handleOpenAddModalForShoot(
                                                projCard.projectId,
                                                shoot.eventName,
                                                shoot.shootDate,
                                                shoot.venue,
                                                shoot.startTime,
                                                shoot.endTime,
                                                req.role,
                                                req.plannedName
                                              )
                                            }
                                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold rounded-lg shadow-2xs whitespace-nowrap transition cursor-pointer"
                                          >
                                            Assign
                                          </button>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                                              Allocated
                                            </span>
                                            {req.assignedTo && (
                                              <button
                                                onClick={() => handleOpenEditAssignment(req.assignedTo!)}
                                                className="p-1 bg-rose-50 hover:bg-rose-50 text-[#2f5f54] rounded-lg transition cursor-pointer"
                                                title="Edit Assignment Details"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-800 block">
                                      0 crew slots pre-configured in Shoot Management for "{shoot.eventName}".
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      Easily assign your team or auto-fill standard photography/videography crew.
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() =>
                                        handleQuickAddRecommendedTeam(
                                          projCard.projectId,
                                          projCard.projectName,
                                          projCard.clientName,
                                          shoot.eventName,
                                          shoot.shootDate,
                                          shoot.startTime,
                                          shoot.endTime,
                                          shoot.venue,
                                          shoot.shootLocation
                                        )
                                      }
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-50 text-[#254b42] border border-rose-200 text-xs font-extrabold rounded-xl transition cursor-pointer"
                                    >
                                      ⚡ Auto-Fill Team (4 Crew)
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleOpenAddModalForShoot(
                                          projCard.projectId,
                                          shoot.eventName,
                                          shoot.shootDate,
                                          shoot.venue,
                                          shoot.startTime,
                                          shoot.endTime
                                        )
                                      }
                                      className="px-3 py-1.5 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                                    >
                                      Assign Custom
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Crew List for this Function Shoot */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              Detailed Crew Breakdown ({combinedAssignments.length}):
                            </span>
                            {hasCrew && (
                              <button
                                onClick={() =>
                                  handleOpenAddModalForShoot(
                                    projCard.projectId,
                                    shoot.eventName,
                                    shoot.shootDate,
                                    shoot.venue,
                                    shoot.startTime,
                                    shoot.endTime
                                  )
                                }
                                className="text-[11px] font-black text-[#2f5f54] hover:text-[#253d37] flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Crew Member</span>
                              </button>
                            )}
                          </div>

                          {!hasCrew ? (
                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                              <p className="text-xs text-amber-800 font-bold">
                                No freelancer assigned to "{shoot.eventName}" yet.
                              </p>
                              <button
                                onClick={() =>
                                  handleOpenAddModalForShoot(
                                    projCard.projectId,
                                    shoot.eventName,
                                    shoot.shootDate,
                                    shoot.venue,
                                    shoot.startTime,
                                    shoot.endTime
                                  )
                                }
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg transition shadow-2xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Assign Freelancer Now</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {combinedAssignments.map((assignment) => {
                                const isDoubleBooked = checkDoubleBooking(assignment.freelancerId, assignment.shootDate, assignment.id, assignment.projectId);
                                const matchingReq = shootMgmtCrew.find((r) => r.assignedTo?.id === assignment.id);
                                const displayName = assignment.freelancerName;

                                return (
                                  <div
                                    key={assignment.id}
                                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                                  >


                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#2f5f54] text-white font-bold text-xs flex items-center justify-center font-mono">
                                          {displayName[0]}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-900 block">{displayName}</span>
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                                              {assignment.subCategory || assignment.category}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-slate-500 font-medium">
                                            Role: <strong className="text-slate-800">{assignment.role}</strong>
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                        {/* Financial Breakdown Pills */}
                                        <div className="flex items-center gap-2 text-xs">
                                          <div className="text-right">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Agreed</span>
                                            <span className="text-xs font-black text-slate-900 font-mono">₹{assignment.totalAgreedAmount.toLocaleString('en-IN')}</span>
                                          </div>
                                          <div className="text-right border-l border-slate-200 pl-2">
                                            <span className="text-[10px] text-emerald-600 font-bold block uppercase">Paid</span>
                                            <span className="text-xs font-black text-emerald-700 font-mono">₹{assignment.advancePaid.toLocaleString('en-IN')}</span>
                                          </div>
                                          <div className="pl-1">
                                            {assignment.pendingAmount > 0 ? (
                                              <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 text-xs font-black rounded-lg font-mono block">
                                                Due: ₹{assignment.pendingAmount.toLocaleString('en-IN')}
                                              </span>
                                            ) : (
                                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-lg font-mono block">
                                                ✓ Fully Paid
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <select
                                          value={assignment.assignmentStatus}
                                          onChange={(e) =>
                                            onUpdateAssignmentStatus(assignment.id, e.target.value as FreelancerAssignment['assignmentStatus'])
                                          }
                                          className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border text-center transition ${
                                            assignment.assignmentStatus === 'completed'
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                              : assignment.assignmentStatus === 'on_shoot'
                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                              : assignment.assignmentStatus === 'cancelled'
                                              ? 'bg-red-100 text-red-800 border-red-200'
                                              : 'bg-rose-50 text-[#253d37] border-rose-200'
                                          }`}
                                        >
                                          <option value="assigned">Assigned</option>
                                          <option value="confirmed">Confirmed</option>
                                          <option value="on_shoot">On Shoot</option>
                                          <option value="completed">Completed</option>
                                          <option value="cancelled">Cancelled</option>
                                        </select>

                                        <button
                                          onClick={() => handleOpenEditAssignment(assignment)}
                                          className="p-1 bg-rose-50 hover:bg-rose-50 text-[#2f5f54] rounded-lg transition cursor-pointer"
                                          title="Edit Assignment Details"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        {onDeleteAssignment && (
                                          <button
                                            onClick={() => setDeletingAssignment(assignment)}
                                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                                            title="Remove Assignment"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 font-bold text-slate-600">
                      <EyeOff className="w-4 h-4 text-slate-400" />
                      Shoot details & assigned crew list hidden
                    </span>
                    <button
                      onClick={() => {
                        setCollapsedProjectIds((prev) => {
                          const next = new Set(prev);
                          next.delete(projCard.id);
                          return next;
                        });
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-[#2f5f54] font-bold text-xs rounded-lg shadow-2xs transition cursor-pointer"
                    >
                      Show Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NEW SHOOT ASSIGNMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2f5f54] flex items-center justify-center font-bold text-white shadow-sm">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Assign Freelancers to Shoot</h2>
                  <p className="text-xs text-[#dfeae7]">Select project & assign single or multiple freelancers</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShootAssignments} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Project & Event Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Project & Event Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Active Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.clientWeddingTitle}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Custom Other Project</option>
                    </select>
                  </div>

                  {selectedProjectId !== 'CUSTOM' && (() => {
                    const selectedProj = projects.find((p) => p.id === selectedProjectId);
                    if (selectedProj?.shoots && selectedProj.shoots.length > 0) {
                      return (
                        <div className="col-span-1 sm:col-span-2 bg-rose-50/80 p-3 rounded-xl border border-rose-200 space-y-1">
                          <label className="text-[11px] font-black text-[#1b2825] block flex items-center gap-1">
                            <Film className="w-3.5 h-3.5 text-[#2f5f54]" />
                            Select Planned Shoot Event from Client Project:
                          </label>
                          <select
                            value={selectedShootEventId}
                            onChange={(e) => handleShootEventSelect(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfeae7] bg-white font-extrabold text-[#1b2825] shadow-2xs"
                          >
                            {selectedProj.shoots.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title} — {s.date || 'Date TBD'} ({s.venue || 'Venue TBD'})
                              </option>
                            ))}
                            <option value="">+ Custom / Other Function Event</option>
                          </select>
                          <p className="text-[10px] text-[#254b42] font-medium">
                            Auto-populates event title, shoot date, venue, and timings from client project details.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {selectedProjectId === 'CUSTOM' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Custom Project Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Morgan Wedding Destination"
                        value={customProjectName}
                        onChange={(e) => setCustomProjectName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Event Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Wedding Phere & Reception, Sangeet"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Shoot Date</label>
                    <input
                      type="date"
                      value={shootDate}
                      onChange={(e) => setShootDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Start & End Time</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="09:00 AM"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="09:00 PM"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Venue & Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Taj Rambagh Palace, Jaipur"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Assign Freelancers */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Select Freelancers for this Shoot ({selectedFreelancerRows.length})
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddFreelancerRow}
                    className="px-3 py-1 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Freelancer</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedFreelancerRows.map((row, index) => {
                    const isBooked = checkDoubleBooking(row.freelancerId, shootDate, undefined, selectedProjectId !== 'CUSTOM' ? selectedProjectId : undefined);

                    return (
                      <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        {isBooked && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
                            <span>
                              <strong>Warning:</strong> Freelancer is already assigned to another shoot ("{isBooked.projectName}") on {shootDate}.
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Freelancer</label>
                            <select
                              value={row.freelancerId}
                              onChange={(e) => handleFreelancerChange(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-bold bg-white"
                            >
                              {freelancers.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name} ({f.mainCategory} - {f.subCategory})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Role Title</label>
                            <input
                              type="text"
                              value={row.role}
                              onChange={(e) => {
                                const updated = [...selectedFreelancerRows];
                                updated[index].role = e.target.value;
                                setSelectedFreelancerRows(updated);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                            />
                          </div>

                          <div className="flex items-end justify-end">
                            {selectedFreelancerRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFreelancerRow(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                title="Remove Freelancer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Charges breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Event Category</label>
                            <select
                              value={row.eventCategory || 'full_day'}
                              onChange={(e) => handleEventCategoryChange(index, e.target.value as any)}
                              className="w-full px-1.5 py-1 text-xs rounded border border-slate-300 font-bold bg-white focus:ring-1 focus:ring-[#366e61]"
                            >
                              <option value="small_event">Small Event</option>
                              <option value="half_day">Half Day</option>
                              <option value="full_day">Full Day</option>
                              <option value="custom">Custom Rate</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Shoot Charge (₹)</label>
                            <input
                              type="number"
                              value={row.charges}
                              onChange={(e) => {
                                const updated = [...selectedFreelancerRows];
                                updated[index].charges = Number(e.target.value);
                                updated[index].eventCategory = 'custom';
                                setSelectedFreelancerRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Travel (₹)</label>
                            <input
                              type="number"
                              value={row.travel}
                              onChange={(e) => {
                                const updated = [...selectedFreelancerRows];
                                updated[index].travel = Number(e.target.value);
                                setSelectedFreelancerRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Extra (₹)</label>
                            <input
                              type="number"
                              value={row.extra}
                              onChange={(e) => {
                                const updated = [...selectedFreelancerRows];
                                updated[index].extra = Number(e.target.value);
                                setSelectedFreelancerRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Advance (₹)</label>
                            <input
                              type="number"
                              value={row.advance}
                              onChange={(e) => {
                                const updated = [...selectedFreelancerRows];
                                updated[index].advance = Number(e.target.value);
                                setSelectedFreelancerRows(updated);
                              }}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-mono text-emerald-700 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Shoot Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ASSIGNMENT MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#2f5f54] flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Shoot Assignment</h3>
                  <p className="text-xs text-slate-500 font-medium">Modify rate, charges, timing & crew details</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Assigned Freelancer</label>
                <select
                  value={editFreelancerId}
                  onChange={(e) => setEditFreelancerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-slate-50 focus:bg-white"
                >
                  {freelancers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.subCategory} • ₹{f.perDayCharges}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Role / Sub-category</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="e.g. Lead Cinematographer"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Function / Event Name</label>
                  <input
                    type="text"
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="e.g. HALDI / RING"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Shoot Date</label>
                  <input
                    type="date"
                    value={editShootDate}
                    onChange={(e) => setEditShootDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="09:00 AM"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="09:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Venue</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                    placeholder="Venue Location"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Assignment Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FreelancerAssignment['assignmentStatus'])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold uppercase"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="on_shoot">On Shoot</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Rate & Payment breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Payment & Charges Breakdown
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Event Category</label>
                    <select
                      value={editEventCategory}
                      onChange={(e) => handleEditCategoryChange(e.target.value as any)}
                      className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                    >
                      <option value="small_event">Small Event</option>
                      <option value="half_day">Half Day</option>
                      <option value="full_day">Full Day</option>
                      <option value="custom">Custom Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      value={editCharges}
                      onChange={(e) => {
                        setEditCharges(e.target.value === '' ? '' : Number(e.target.value));
                        setEditEventCategory('custom');
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Travel (₹)</label>
                    <input
                      type="number"
                      value={editTravel}
                      onChange={(e) => setEditTravel(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Extra (₹)</label>
                    <input
                      type="number"
                      value={editExtra}
                      onChange={(e) => setEditExtra(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Advance (₹)</label>
                    <input
                      type="number"
                      value={editAdvance}
                      onChange={(e) => setEditAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-bold font-mono text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
                  <span className="text-slate-600 font-medium">
                    Total Agreed: <strong className="font-mono text-[#254b42]">₹{((Number(editCharges)||0)+(Number(editTravel)||0)+(Number(editExtra)||0)).toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-slate-600 font-medium">
                    Pending Due: <strong className="font-mono text-red-600">₹{Math.max(0, ((Number(editCharges)||0)+(Number(editTravel)||0)+(Number(editExtra)||0)) - (Number(editAdvance)||0)).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingAssignment}
        title="Remove Freelancer Assignment"
        itemTitle={deletingAssignment ? `${deletingAssignment.freelancerName} (${deletingAssignment.eventName})` : ''}
        message={deletingAssignment ? `Are you sure you want to remove assignment for ${deletingAssignment.freelancerName} on event "${deletingAssignment.eventName}" (${deletingAssignment.shootDate})?` : ''}
        onConfirm={() => {
          if (deletingAssignment && onDeleteAssignment) {
            onDeleteAssignment(deletingAssignment.id);
          }
          setDeletingAssignment(null);
        }}
        onCancel={() => setDeletingAssignment(null)}
      />
    </div>
  );
};
