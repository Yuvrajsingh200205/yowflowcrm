import React, { useEffect, useRef, useState } from 'react';
import { Project, ServiceType, ProjectStatus, VideoPipeline, PhotoPipeline, ShootEvent, ProjectTask, EditingStatus, TeamMember, CrewMemberAssignment } from '@/types';
import { computeAutoProjectStatus } from '@/utils/projectStatusCalculator';
import { RoleColumnCrewManager } from './RoleColumnCrewManager';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useToast } from '@/components/common';
import { mergeAssignees, FREELANCER_ASSIGNEE, UNASSIGNED_ASSIGNEE, assigneeSelectValue } from '@/features/projects/assigneeOptions';
import { useTeam } from '@/hooks/useTeam';
import { CLIENT_ASSET_ACCEPT, CLIENT_ASSET_MAX_BYTES, clientAssetsApi, type ProjectClientAsset, uploadProjectClientAsset } from '@/lib/api/clientAssets';
import { PAYMENT_MODE_OPTIONS, paymentsApi, toPaymentMethod, type PaymentMethod } from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';
import { indianMobileError, nextIndianMobileValue } from '@/lib/validation/indianMobile';
import { getTodayDateString } from '@/utils/shootTracking';

const SCHEDULE_DATE_MIN = `${new Date().getFullYear() - 1}-01-01`;
const SCHEDULE_DATE_MAX = `${new Date().getFullYear() + 10}-12-31`;
import { normalizeTeamMember } from '@/features/team/teamViewModel';
import { ArrowLeft, ArrowRight, X, Save, IndianRupee, Phone, MapPin, Music, Link2, Calendar, Sparkles, Plus, Trash2, Camera, CheckSquare, UserCheck, Folder, Upload, FileText, Eye, Paperclip, Users, UserPlus, Clock3 } from 'lucide-react';
import { isPersistedProjectId } from '@/features/projects/projectViewModel';
import { loadProjectTasks } from '@/features/projects/persistProjectTasks';
import { shootsApi } from '@/lib/api/shoots';
import { projectsApi } from '@/lib/api/projects';
import { toShootEvent } from '@/features/shoots/persistShoots';

function projectSaveErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail = error.details?.find(
      (item): item is { message?: string } => typeof item === 'object' && item !== null && 'message' in item,
    );
    if (detail?.message) return detail.message;
  }
  return error instanceof Error && error.message ? error.message : 'Project could not be saved. Please try again.';
}

function normalizeMeridiemTime(value: string) {
  const input = value.trim().toUpperCase().replace(/\./g, '');
  if (!input) return '';

  // Accept both conventional "5:00 PM" and the space-separated value users
  // commonly enter in this free-text field: "5 00 PM".
  const twelveHour = input.match(/^(\d{1,2})(?:(?::|\s+)([0-5]\d))?\s*(AM|PM)$/);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    if (hour >= 1 && hour <= 12) {
      return `${String(hour).padStart(2, '0')}:${twelveHour[2] || '00'} ${twelveHour[3]}`;
    }
  }

  const twentyFourHour = input.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${twentyFourHour[2]} ${suffix}`;
  }

  return value;
}

const MeridiemTimeInput: React.FC<{ value?: string; onChange: (value: string) => void; label: string }> = ({ value, onChange, label }) => {
  const [draft, setDraft] = useState(() => normalizeMeridiemTime(value || ''));

  useEffect(() => {
    setDraft(normalizeMeridiemTime(value || ''));
  }, [value]);

  const commit = () => {
    const normalized = normalizeMeridiemTime(draft);
    setDraft(normalized);
    onChange(normalized);
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="text"
        aria-label={label}
        placeholder="e.g. 06:30 PM"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        className="w-full bg-white border border-slate-200 rounded px-2 py-1 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Clock3 aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
};

interface ProjectFormModalProps {
  isOpen: boolean;
  variant?: 'modal' | 'page';
  onClose: () => void;
  onSave: (project: Project) => Project | void | Promise<Project | void>;
  existingProject?: Project | null;
  team?: TeamMember[];
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  variant = 'modal',
  onClose,
  onSave,
  existingProject,
  team = [],
}) => {
  const { showToast } = useToast();
  const teamQuery = useTeam({ page: 1, limit: 100 }, isOpen);
  const loadedTeam = teamQuery.data.map(normalizeTeamMember);
  const activeTeamMembers = mergeAssignees(team, loadedTeam);

  if (!isOpen) return null;

  // Form State initialized with defaults or existing values
  const [clientWeddingTitle, setClientWeddingTitle] = useState(existingProject?.clientWeddingTitle || '');
  const [clientContactMobile, setClientContactMobile] = useState(existingProject?.clientContactMobile || '');
  const [venueLocation, setVenueLocation] = useState(existingProject?.venueLocation || '');

  const STANDARD_SERVICES = [
    'Complete Wedding Services',
    'Wedding',
    'Pre Wedding',
    'Engagement',
    'Roka',
    'Haldi & Mehendi',
    'Sangeet',
    'Reception',
  ];

  const initialService = existingProject?.primaryServiceType || 'Complete Wedding Services';
  const isStandardService = STANDARD_SERVICES.includes(initialService);

  const [selectedService, setSelectedService] = useState<string>(
    isStandardService ? initialService : 'Other'
  );
  const [customServiceType, setCustomServiceType] = useState<string>(
    existingProject?.customServiceType || (isStandardService ? '' : (initialService === 'Other' ? '' : initialService))
  );
  const [otherClientDetails, setOtherClientDetails] = useState(existingProject?.otherClientDetails || '');

  const [weddingFunctionDates, setWeddingFunctionDates] = useState(existingProject?.weddingFunctionDates || '');
  const [finalDeliveryDeadline, setFinalDeliveryDeadline] = useState(existingProject?.finalDeliveryDeadline || '');
  const [totalBudget, setTotalBudget] = useState<number | ''>(existingProject?.totalBudget ? existingProject.totalBudget : '');
  const [advanceReceived, setAdvanceReceived] = useState<number | ''>(existingProject?.advanceReceived ? existingProject.advanceReceived : '');
  const [advancePaymentDate, setAdvancePaymentDate] = useState<string>(() => getTodayDateString());
  // How the advance actually arrived — it is recorded as a real payment, so
  // defaulting every booking to UPI would write the wrong method to the ledger.
  const [advanceMode, setAdvanceMode] = useState<string>('UPI / GPay');
  const [quotationLink, setQuotationLink] = useState(existingProject?.quotationLink || '');
  const [specialNotesMusicPreferences, setSpecialNotesMusicPreferences] = useState(existingProject?.specialNotesMusicPreferences || '');
  const [status, setStatus] = useState<ProjectStatus>(existingProject?.status || 'new_project');
  const [activeStep, setActiveStep] = useState(1);
  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  type PendingClientAsset = { id: string; file: File; previewUrl?: string; category: string; status: 'ready' | 'uploading' | 'error'; error?: string };
  const [clientAssets, setClientAssets] = useState<PendingClientAsset[]>([]);
  const [savedClientAssets, setSavedClientAssets] = useState<ProjectClientAsset[]>([]);
  const [clientAssetsLoading, setClientAssetsLoading] = useState(false);
  const [assetCategory, setAssetCategory] = useState('Client reference');
  // If project creation succeeds but a later asset upload fails, retry only
  // the failed assets; never create a duplicate project on a second click.
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);

  const addClientAssets = (files: FileList | File[]) => {
    const accepted: PendingClientAsset[] = [];
    Array.from(files).forEach((file) => {
      if (!CLIENT_ASSET_ACCEPT.includes((file.type || '').toLowerCase() as typeof CLIENT_ASSET_ACCEPT[number])) {
        showToast(`${file.name}: JPG, PNG, WEBP, PDF, DOC, and DOCX files are supported.`, { variant: 'error' }); return;
      }
      if (!file.size || file.size > CLIENT_ASSET_MAX_BYTES) { showToast(`${file.name}: file must be under 10MB.`, { variant: 'error' }); return; }
      accepted.push({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, category: assetCategory, status: 'ready', previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined });
    });
    if (accepted.length) setClientAssets((current) => [...current, ...accepted]);
  };

  const removeClientAsset = (id: string) => setClientAssets((current) => {
    const asset = current.find((item) => item.id === id); if (asset?.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    return current.filter((item) => item.id !== id);
  });

  const previewPendingClientAsset = (asset: PendingClientAsset) => {
    const url = asset.previewUrl || URL.createObjectURL(asset.file);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (!asset.previewUrl) window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const formatFileSize = (bytes: number) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  const openSavedClientAsset = async (asset: ProjectClientAsset) => {
    try {
      const url = await clientAssetsApi.getProjectClientAssetDownloadUrl(existingProject!.id, asset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to open this document.', { variant: 'error' });
    }
  };

  const removeSavedClientAsset = async (asset: ProjectClientAsset) => {
    if (!existingProject || !window.confirm(`Remove ${asset.originalName}?`)) return;
    try {
      await clientAssetsApi.deleteProjectClientAsset(existingProject.id, asset.id);
      setSavedClientAssets((items) => items.filter((item) => item.id !== asset.id));
      showToast('Document removed.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to remove this document.', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (!isOpen || !existingProject || !isPersistedProjectId(existingProject.id)) {
      setSavedClientAssets([]);
      return;
    }
    let cancelled = false;
    setClientAssetsLoading(true);
    void clientAssetsApi.getProjectClientAssets(existingProject.id)
      .then((assets) => { if (!cancelled) setSavedClientAssets(assets); })
      .catch((error) => { if (!cancelled) showToast(error instanceof Error ? error.message : 'Unable to load saved documents.', { variant: 'error' }); })
      .finally(() => { if (!cancelled) setClientAssetsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, existingProject?.id, showToast]);

  // Shoots State (Dynamic Add & Remove)
  const [shoots, setShoots] = useState<ShootEvent[]>(
    existingProject?.shoots && existingProject.shoots.length > 0 
      ? existingProject.shoots 
      : []
  );

  const handleAddShoot = () => {
    setShoots([
      ...shoots,
      {
        id: `shoot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: '',
        date: weddingFunctionDates || new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        venue: venueLocation || '',
        location: '',
        leadPhotographer: '',
        cinematographer: '',
        droneOperator: '',
        assistant: '',
        crewAssignments: [
          { id: `c-${Date.now()}-1`, name: '', role: 'Photographer', mobile: '' },
          { id: `c-${Date.now()}-2`, name: '', role: 'Videographer', mobile: '' },
          { id: `c-${Date.now()}-3`, name: '', role: 'Assistant', mobile: '' }
        ],
        equipmentChecklist: [],
        status: 'scheduled',
      }
    ]);
  };

  const [deleteShootModalConfig, setDeleteShootModalConfig] = useState<{
    isOpen: boolean;
    itemTitle: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemTitle: '',
    onConfirm: () => {},
  });

  const handleRemoveShoot = (index: number) => {
    const shoot = shoots[index];
    setDeleteShootModalConfig({
      isOpen: true,
      itemTitle: shoot?.title || `Shoot Event #${index + 1}`,
      onConfirm: () => {
        setShoots((prev) => prev.filter((_, i) => i !== index));
        setDeleteShootModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const syncShootCrewRoles = (shoot: ShootEvent): ShootEvent => {
    const crew = shoot.crewAssignments || [];
    const photo = crew.find((c) => c.role?.toLowerCase().includes('photo') && c.name?.trim());
    const video = crew.find((c) => (c.role?.toLowerCase().includes('video') || c.role?.toLowerCase().includes('cinema')) && c.name?.trim());
    const drone = crew.find((c) => c.role?.toLowerCase().includes('drone') && c.name?.trim());
    const assist = crew.find((c) => c.role?.toLowerCase().includes('assist') && c.name?.trim());

    return {
      ...shoot,
      leadPhotographer: photo?.name || shoot.leadPhotographer || '',
      cinematographer: video?.name || shoot.cinematographer || '',
      droneOperator: drone?.name || shoot.droneOperator || '',
      assistant: assist?.name || shoot.assistant || '',
    };
  };

  const handleShootChange = (index: number, field: keyof ShootEvent, value: any) => {
    const updated = [...shoots];
    updated[index] = syncShootCrewRoles({ ...updated[index], [field]: value });
    setShoots(updated);
  };

  const handleAddRoleQuantityToFormShoot = (shootIndex: number, role: string, quantity: number) => {
    if (quantity <= 0) return;
    const newItems: CrewMemberAssignment[] = Array.from({ length: quantity }).map((_, i) => ({
      id: `crew-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`,
      name: '',
      role: role as any,
      mobile: '',
    }));
    const updated = [...shoots];
    const currentCrew = updated[shootIndex].crewAssignments || [];
    updated[shootIndex] = syncShootCrewRoles({
      ...updated[shootIndex],
      crewAssignments: [...currentCrew, ...newItems]
    });
    setShoots(updated);
  };

  const handleRemoveRoleFromFormShoot = (shootIndex: number, role: string) => {
    const updated = [...shoots];
    const currentCrew = updated[shootIndex].crewAssignments || [];
    updated[shootIndex] = syncShootCrewRoles({
      ...updated[shootIndex],
      crewAssignments: currentCrew.filter((c) => c.role !== role)
    });
    setShoots(updated);
  };

  const handleUpdateCrewByCrewId = (shootIndex: number, crewId: string, updates: Partial<CrewMemberAssignment>) => {
    setShoots((current) => current.map((shoot, index) => {
      if (index !== shootIndex) return shoot;
      const crewAssignments = (shoot.crewAssignments || []).map((crew) =>
        crew.id === crewId ? { ...crew, ...updates } : crew,
      );
      return syncShootCrewRoles({ ...shoot, crewAssignments });
    }));
  };

  const handleRemoveCrewByCrewId = (shootIndex: number, crewId: string) => {
    const updated = [...shoots];
    const currentCrew = updated[shootIndex].crewAssignments || [];
    updated[shootIndex] = syncShootCrewRoles({
      ...updated[shootIndex],
      crewAssignments: currentCrew.filter((c) => c.id !== crewId)
    });
    setShoots(updated);
  };

  const handleAddCrewToShoot = (shootIndex: number) => {
    const updated = [...shoots];
    const currentCrew = updated[shootIndex].crewAssignments || [];
    updated[shootIndex] = {
      ...updated[shootIndex],
      crewAssignments: [
        ...currentCrew,
        {
          id: `crew-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: '',
          role: 'Photographer',
          mobile: '',
        }
      ]
    };
    setShoots(updated);
  };

  const handleRemoveCrewFromShoot = (shootIndex: number, crewIndex: number) => {
    const updated = [...shoots];
    const currentCrew = updated[shootIndex].crewAssignments || [];
    updated[shootIndex] = {
      ...updated[shootIndex],
      crewAssignments: currentCrew.filter((_, i) => i !== crewIndex)
    };
    setShoots(updated);
  };

  const handleCrewChange = (shootIndex: number, crewIndex: number, field: string, value: string) => {
    const updated = [...shoots];
    const currentCrew = [...(updated[shootIndex].crewAssignments || [])];
    currentCrew[crewIndex] = { ...currentCrew[crewIndex], [field]: value };
    updated[shootIndex] = { ...updated[shootIndex], crewAssignments: currentCrew };
    setShoots(updated);
  };

  // Tasks & Deliverables State (har task mai kitne bane aur kon Assigned hai)
  const [tasks, setTasks] = useState<ProjectTask[]>(
    existingProject?.tasks && existingProject.tasks.length > 0
      ? existingProject.tasks
      : [
          {
            id: `task-${Date.now()}-1`,
            taskName: 'Cinematic Teaser Video (1-2 Min)',
            quantity: 1,
            unit: '',
            assignedTo: 'Unassigned',
            status: 'not_started',
          },
          {
            id: `task-${Date.now()}-2`,
            taskName: 'Instagram Reels / Shorts',
            quantity: 5,
            unit: '',
            assignedTo: 'Unassigned',
            status: 'not_started',
          },
          {
            id: `task-${Date.now()}-3`,
            taskName: 'Wedding Film / Long Video',
            quantity: 1,
            unit: '',
            assignedTo: 'Unassigned',
            status: 'not_started',
          },
          {
            id: `task-${Date.now()}-4`,
            taskName: 'Photo Selection & Retouching',
            quantity: 100,
            unit: '',
            assignedTo: 'Unassigned',
            status: 'not_started',
          },
          {
            id: `task-${Date.now()}-5`,
            taskName: 'Wedding Albums (12x36)',
            quantity: 2,
            unit: '',
            assignedTo: 'Unassigned',
            status: 'not_started',
          }
        ]
  );

  // The project list intentionally stays lightweight. When editing, hydrate
  // resource-owned rows from their APIs so the wizard never treats a partial
  // list response as an empty shoot or task plan.
  useEffect(() => {
    if (!isOpen || !existingProject || !isPersistedProjectId(existingProject.id)) return;
    let cancelled = false;
    void Promise.all([
      loadProjectTasks(existingProject.id),
      shootsApi.list({ projectId: existingProject.id, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' }),
    ]).then(([storedTasks, storedShoots]) => {
      if (cancelled) return;
      setTasks(storedTasks);
      setShoots(storedShoots.items.map(toShootEvent));
    }).catch((error) => {
      if (!cancelled) showToast(error instanceof Error ? error.message : 'Unable to load the saved project plan.', { variant: 'error' });
    });
    return () => { cancelled = true; };
  }, [isOpen, existingProject?.id, showToast]);

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        taskName: '',
        quantity: 0,
        unit: '',
        assignedTo: 'Unassigned',
        status: 'not_started',
      }
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: keyof ProjectTask, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  // Video Pipeline state
  const [videoPipeline, setVideoPipeline] = useState<VideoPipeline>(existingProject?.videoPipeline || {
    preWeddingVideo: 'not_started',
    longVideo: 'not_started',
    teaser: 'not_started',
    highlights: 'not_started',
    reels: 'not_started',
    otherVideo: '',
    assignedEditor: 'Vikram Sharma',
    notes: '',
  });

  // Photo Pipeline state
  const [photoPipeline, setPhotoPipeline] = useState<PhotoPipeline>(existingProject?.photoPipeline || {
    preWeddingPhotos: 'not_started',
    cullingSelection: 'not_started',
    colorGradingRetouching: 'not_started',
    albumDesigning: 'not_started',
    albumPrinting: 'not_sent',
    otherPhoto: '',
    assignedEditor: 'Sam Rivera',
    notes: '',
  });

  // Balance due calculation
  const balanceDue = Math.max(0, Number(totalBudget || 0) - Number(advanceReceived || 0));
  const hasFinancialAmount = totalBudget !== '' || advanceReceived !== '';
  const [saving, setSaving] = useState(false);
  const submitInFlight = useRef(false);
  // Stable for the life of this form: retrying a failed submit must replay the
  // same advance rather than record it twice.
  const advanceIdempotencyKey = useRef(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `advance-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (saving || submitInFlight.current) return;

    if (!clientWeddingTitle.trim()) {
      showToast('Please enter the Client / Wedding Title.', { variant: 'error' });
      setActiveStep(1);
      return;
    }

    const mobileError = indianMobileError(clientContactMobile, true);
    if (mobileError) {
      showToast(mobileError, { variant: 'error' });
      setActiveStep(1);
      return;
    }

    if (selectedService === 'Other' && !customServiceType.trim()) {
      showToast('Please enter the custom service name.', { variant: 'error' });
      setActiveStep(1);
      return;
    }

    const advanceAmount = Number(advanceReceived) || 0;
    const parsedAdvancePaymentDate = new Date(`${advancePaymentDate}T00:00:00`);
    const normalizedAdvancePaymentDate = `${parsedAdvancePaymentDate.getFullYear()}-${String(parsedAdvancePaymentDate.getMonth() + 1).padStart(2, '0')}-${String(parsedAdvancePaymentDate.getDate()).padStart(2, '0')}`;
    if (advanceAmount > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(advancePaymentDate) || Number.isNaN(parsedAdvancePaymentDate.getTime()) || normalizedAdvancePaymentDate !== advancePaymentDate)) {
      showToast('Please select a valid payment date.', { variant: 'error' });
      setActiveStep(2);
      return;
    }

    const resolvedServiceType = selectedService === 'Other' ? 'Other' : selectedService;

    const computedWeddingDates = shoots.map(s => s.date).filter(Boolean).join(', ') || weddingFunctionDates || '';

    const newProject: Project = {
      id: existingProject ? existingProject.id : `proj-${Date.now()}`,
      clientWeddingTitle,
      clientContactMobile,
      venueLocation,
      primaryServiceType: resolvedServiceType as ServiceType,
      customServiceType: selectedService === 'Other' ? customServiceType.trim() : undefined,
      otherClientDetails: selectedService === 'Other' ? otherClientDetails.trim() || undefined : undefined,
      weddingFunctionDates: computedWeddingDates,
      finalDeliveryDeadline,
      totalBudget: Number(totalBudget),
      advanceReceived: Number(advanceReceived),
      balanceDue,
      quotationLink,
      // Files are persisted through the project client-assets API after this
      // project receives its database id; never persist browser data URLs here.
      clientVaultDocuments: existingProject?.clientVaultDocuments || [],
      specialNotesMusicPreferences,
      status,
      createdAt: existingProject ? existingProject.createdAt : new Date().toISOString().split('T')[0],
      tasks,
      videoPipeline,
      photoPipeline,
      shoots: shoots,
      dataBackup: existingProject ? existingProject.dataBackup : {
        offloadedFromCards: false,
        hardDrive1: 'Pending Shoot',
        hardDrive1Done: false,
        hardDrive2: 'Pending Shoot',
        hardDrive2Done: false,
        cloudBackupDone: false,
        totalDataSizeGB: 0,
        rawCleanupStatus: 'raw_kept',
      },
      payments: existingProject
        ? existingProject.payments
        : Number(advanceReceived) > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                date: advancePaymentDate,
                amount: Number(advanceReceived),
                type: 'advance',
                paymentMode: advanceMode as Project['payments'][number]['paymentMode'],
                receiptNumber: '',
                notes: 'Advance booking amount',
              },
            ]
          : [],
      deliveryStatus: existingProject ? existingProject.deliveryStatus : {
        rawHandoverDone: false,
        teaserLinkSent: false,
        fullFilmSent: false,
        reelsSent: false,
        highResPhotosSent: false,
        albumPrintedAndDelivered: false,
      },
    };

    if (existingProject) {
      const autoWork = computeAutoProjectStatus(newProject);
      newProject.status = autoWork.autoStatus;
    }

    submitInFlight.current = true;
    setSaving(true);
    let rollbackProjectId: string | undefined;
    try {
      const persistedProject = createdProjectId ? undefined : await onSave(newProject);
      const projectId = createdProjectId || (persistedProject && typeof persistedProject === 'object' && 'id' in persistedProject
        ? persistedProject.id
        : (existingProject?.id && !existingProject.id.startsWith('proj-') ? existingProject.id : undefined));
      if (!existingProject && !createdProjectId) rollbackProjectId = projectId;

      // "Advance Received" is not a column on Project — every screen derives it
      // from the project's COMPLETED payments (see `normalizeProject` and the
      // dashboard's `received` aggregate). Recording it as a real payment is
      // what makes the number, and the computed Balance Due, survive a refresh.
      if (!existingProject && !createdProjectId && advanceAmount > 0) {
        if (!projectId) {
          throw new Error('The project was saved but returned no database id, so the advance could not be recorded.');
        }
        const advanceClientId =
          persistedProject && typeof persistedProject === 'object' && 'clientId' in persistedProject
            ? (persistedProject as Project).clientId
            : undefined;
        if (!advanceClientId) {
          throw new Error('The project was saved but returned no client id, so the advance could not be recorded.');
        }
        setCreatedProjectId(projectId);
        await paymentsApi.createProjectPayment(
          {
            clientId: advanceClientId,
            projectId,
            amount: advanceAmount,
            paymentDate: advancePaymentDate,
            paymentMethod: toPaymentMethod(advanceMode) as PaymentMethod,
            notes: 'Advance booking amount',
          },
          advanceIdempotencyKey.current,
        );
      }
      if (clientAssets.length) {
        if (!projectId) throw new Error('The project was saved, but did not return a database id for client asset upload.');
        setCreatedProjectId(projectId);
        const assetsToUpload = [...clientAssets];
        setClientAssets((items) => items.map((item) => ({ ...item, status: 'uploading' })));
        const results = await Promise.allSettled(assetsToUpload.map((asset) => uploadProjectClientAsset(projectId, asset.file, { category: asset.category, title: asset.file.name })));
        const failed = results.filter((result) => result.status === 'rejected').length;
        if (failed) {
          setClientAssets(() => assetsToUpload.flatMap((asset, index) => {
            if (results[index].status === 'fulfilled') { if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl); return []; }
            return [{ ...asset, status: 'error' as const, error: 'Upload failed' }];
          }));
          throw new Error(`${failed} client asset${failed === 1 ? '' : 's'} failed to upload.`);
        }
      }
    const assigned = [...new Set(tasks.map((row) => row.assignedTo?.trim()).filter((name) => name && name !== 'Unassigned'))];
    const extra = assigned.length ? ` Assigned to ${assigned.join(', ')}.` : '';
      showToast((existingProject ? 'Project saved to the studio records.' : 'Project created and saved.') + extra);
      onClose();
    } catch (error) {
      if (!existingProject && rollbackProjectId) {
        try {
          await projectsApi.remove(rollbackProjectId);
          setCreatedProjectId(null);
        } catch {
          showToast('Project save failed, but the partially-created project could not be rolled back automatically. Please delete it manually.', { variant: 'error' });
        }
      }
      // Surface what actually failed. A generic message here is how a lost
      // advance looked like "the budget did not save".
      showToast(projectSaveErrorMessage(error), { variant: 'error' });
      return;
    } finally {
      submitInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <div className={variant === 'page' ? 'w-full' : 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0B0C09]/75 p-3 backdrop-blur-sm sm:p-6'}>
      <div className={`project-form-shell ${variant === 'page' ? 'mx-auto flex h-[calc(100vh-9rem)] min-h-[720px] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-[#dfd9d2] bg-white shadow-[0_18px_50px_rgba(14,17,12,.1)]' : 'my-4 flex h-[90vh] min-h-[680px] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(7,8,6,.42)]'}`}>
        
        {/* Modal Header */}
        <div className="relative sticky top-0 z-20 flex items-center justify-between overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(214,236,169,.24),transparent_32%),linear-gradient(125deg,#21261C,#191C15_52%,#11130E)] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
          <div className="relative flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner"><Folder className="size-7 text-[#E7F6CA]" /></span>
            <div><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]"><Sparkles className="size-3.5"/>Project Journey Intake</p><h3 className="mt-1 text-xl font-black sm:text-2xl">{existingProject ? 'Edit Client Wedding Project' : 'Add New Client Project'}</h3><p className="mt-1 text-sm text-[#dfeae7]">Follow the sections below: client → budget → documents → shoots → tasks.</p></div>
          </div>
          <button type="button" onClick={onClose} className="relative flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-black/15 px-3 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/15 hover:text-white">
            {variant === 'page' ? <><ArrowLeft className="size-5"/><span className="hidden sm:inline">Back to Projects</span></> : <X className="size-5"/>}
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="project-guided-form flex min-h-0 flex-1 flex-col overflow-hidden p-5 pb-0 text-xs sm:p-7 sm:pb-0">
          <div ref={stepContentRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-8 pr-2">
          <div className="grid gap-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-3 sm:grid-cols-5">
            {['Client info','Budget','Documents','Shoot plan','Tasks'].map((step, index) => <button type="button" key={step} onClick={() => setActiveStep(index + 1)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide transition ${activeStep === index + 1 ? 'bg-[#1C2018] text-white shadow-md' : index + 1 < activeStep ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'bg-white text-[#1C2018] shadow-sm hover:bg-rose-50'}`}><span className={`grid size-6 place-items-center rounded-full text-[10px] ${activeStep === index + 1 ? 'bg-white/15' : 'bg-current/10'}`}>{index + 1}</span><span className="hidden lg:inline">{step}</span></button>)}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#eadfd9] bg-[#FBFDF6] px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#293022]">Step {activeStep} of 5</p><h4 className="mt-1 !text-base !normal-case !tracking-normal">{['Client & project basics','Budget & payment plan','Client files & preferences','Shoot schedule & crew','Tasks & deliverables'][activeStep - 1]}</h4></div><span className="text-xs font-bold text-slate-500">{Math.round(activeStep / 5 * 100)}% setup</span></div>
          
          {/* Section 1: Core Client Project Information (Required fields 01, 02, 03) */}
          <div className="space-y-3">
            <h4 className={`${activeStep === 1 ? 'flex' : 'hidden'} text-xs font-bold text-indigo-600 uppercase tracking-wider items-center gap-1.5`}>
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              01 · Client Project Info
            </h4>

            <div className={`${activeStep === 1 ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-3 gap-4`}>
              
              {/* 01 Client / Wedding Title */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  01 Client / Wedding Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram & Meera Royal Wedding"
                  value={clientWeddingTitle}
                  onChange={(e) => setClientWeddingTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* 02 Client Contact / Mobile */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-indigo-600" />
                  02 Contact / Mobile
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  pattern="[+0-9\(\) \-]{7,20}"
                  placeholder="+1 415 555 0132"
                  value={clientContactMobile}
                  onChange={(e) => setClientContactMobile(nextIndianMobileValue(e.target.value, clientContactMobile))}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

            </div>

            <div className={`${activeStep === 1 ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 gap-4`}>
              
              {/* 03 Venue / Location */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  03 Venue / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Taj Palace, New Delhi"
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Primary Service Type */}
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                  Primary Service Type
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    if (e.target.value !== 'Other') {
                      setCustomServiceType('');
                      setOtherClientDetails('');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                >
                  <option value="Complete Wedding Services">Complete Wedding Services</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Pre Wedding">Pre Wedding</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Roka">Roka</option>
                  <option value="Haldi & Mehendi">Haldi & Mehendi</option>
                  <option value="Sangeet">Sangeet</option>
                  <option value="Reception">Reception</option>
                  <option value="Other">Other — add a custom service</option>
                </select>
              </div>

              {selectedService === 'Other' && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    Custom Service / Function Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={customServiceType}
                    onChange={(event) => setCustomServiceType(event.target.value)}
                    placeholder="e.g. Anniversary, Corporate Event, Birthday, Baby Shower"
                    className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Enter the exact service or function name for this project.</p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                  Project Notes <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add important project requirements, client preferences, or internal notes..."
                  value={specialNotesMusicPreferences}
                  onChange={(event) => setSpecialNotesMusicPreferences(event.target.value)}
                  className="w-full resize-y rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>


            </div>

            <div className="space-y-3">
              
              {/* Dynamic Shoot Details Section (Before Final Delivery Deadline) */}
              <div className={`${activeStep === 4 ? 'block' : 'hidden'} p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    02 · Shoot Plan & Crew
                  </label>
                  <button
                    type="button"
                    onClick={handleAddShoot}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Shoot</span>
                  </button>
                </div>

                {shoots.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No shoot details added. Click "+ Add Shoot" to add function shoots.</p>
                ) : (
                  <div className="space-y-2.5">
                    {shoots.map((shoot, index) => (
                      <div key={shoot.id || index} className="p-2.5 bg-white border border-slate-200 rounded-md space-y-2 relative shadow-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            Shoot #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveShoot(index)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition flex items-center gap-1 text-[10px] font-bold"
                            title="Remove Shoot"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>- Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Shoot Title / Function</label>
                            <input
                              type="text"
                              placeholder="e.g. Ring Ceremony & Sangeet"
                              value={shoot.title}
                              onChange={(e) => handleShootChange(index, 'title', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Function Date</label>
                            <input
                              type="date"
                              min={SCHEDULE_DATE_MIN}
                              max={SCHEDULE_DATE_MAX}
                              value={shoot.date}
                              onChange={(e) => handleShootChange(index, 'date', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Start Time</label>
                            <MeridiemTimeInput
                              value={shoot.startTime || ''}
                              onChange={(value) => handleShootChange(index, 'startTime', value)}
                              label={`Start time for shoot ${index + 1}`}
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Venue / Location</label>
                            <input
                              type="text"
                              placeholder="e.g. Grand Ballroom, Udaivilas"
                              value={shoot.venue}
                              onChange={(e) => handleShootChange(index, 'venue', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Event Crew / Team Assignment with Role Columns */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <RoleColumnCrewManager
                            crewAssignments={shoot.crewAssignments || []}
                            activeTeamMembers={activeTeamMembers}
                            onAddRoleQuantity={(role, qty) => handleAddRoleQuantityToFormShoot(index, role, qty)}
                            onRemoveRoleColumn={(role) => handleRemoveRoleFromFormShoot(index, role)}
                            onUpdateMember={(crewId, updates) => handleUpdateCrewByCrewId(index, crewId, updates)}
                            onRemoveMember={(crewId) => handleRemoveCrewByCrewId(index, crewId)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Delivery Deadline */}
              <div className={activeStep === 4 ? 'block' : 'hidden'}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-600" />
                  Final Delivery Deadline
                </label>
                <input
                  type="date"
                  min={SCHEDULE_DATE_MIN}
                  max={SCHEDULE_DATE_MAX}
                  value={finalDeliveryDeadline}
                  onChange={(e) => setFinalDeliveryDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

            </div>
          </div>

          {/* Section 2: Financials & Budget (Total Budget, Advance Received, Balance Due) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className={`${activeStep === 2 ? 'flex' : 'hidden'} text-xs font-bold text-indigo-600 uppercase tracking-wider items-center gap-1.5`}>
              <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
              03 · Budget & Payments
            </h4>

            <div className={`${activeStep === 2 ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
              
              {/* Total Budget */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 350000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Advance Received */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Advance Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 100000"
                  value={advanceReceived}
                  onChange={(e) => setAdvanceReceived(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Mode
                </label>
                <select
                  value={advanceMode}
                  onChange={(e) => setAdvanceMode(e.target.value)}
                  aria-label="Payment mode"
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                >
                  {PAYMENT_MODE_OPTIONS.map((mode) => (
                    <option key={mode.paymentMethod} value={mode.value}>{mode.value}</option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  PAYMENT DATE
                </label>
                <input
                  type="date"
                  min={SCHEDULE_DATE_MIN}
                  max={SCHEDULE_DATE_MAX}
                  value={advancePaymentDate}
                  onChange={(e) => setAdvancePaymentDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  required={Number(advanceReceived) > 0}
                />
              </div>

              {/* Balance Due (auto) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Balance Due (₹) <span className="text-slate-400 font-normal">(Auto)</span>
                </label>
                <div className="flex min-h-10 w-full items-center rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-bold text-red-600">
                  {hasFinancialAmount ? `₹${balanceDue.toLocaleString('en-IN')}` : <span className="text-xs font-medium text-slate-400">Calculated automatically</span>}
                </div>
              </div>

            </div>

            {/* New files stay in wizard state until the project receives a database id,
                then use the existing signed-upload and FileObject flow on save. */}
            <div className={`${activeStep === 3 ? 'block' : 'hidden'} p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-600" />
                  Client Documents
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  {savedClientAssets.length + clientAssets.length} File(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Category</label>
                  <input
                    type="text"
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    placeholder="e.g. Venue reference"
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Upload documents</label>
                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); addClientAssets(event.dataTransfer.files); }}
                    className="flex items-center gap-2 rounded border border-dashed border-indigo-300 bg-white p-1 hover:border-indigo-500"
                  >
                    <label className="cursor-pointer flex-1 rounded px-3 py-1.5 text-center text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 font-bold text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload documents or drop files here</span>
                      <input
                        ref={assetInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                        multiple
                        onChange={(event) => { if (event.target.files) addClientAssets(event.target.files); event.currentTarget.value = ''; }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">JPG, PNG, WEBP, PDF, DOC, DOCX · max 10MB each</p>
                </div>
              </div>

              {clientAssetsLoading && <p className="text-[11px] text-slate-500">Loading saved documents…</p>}

              {savedClientAssets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Saved documents:</span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {savedClientAssets.map((asset) => (
                      <div key={asset.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 text-xs truncate block">{asset.metadata?.title || asset.originalName}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span>{asset.mimeType}</span><span>•</span><span>{formatFileSize(asset.sizeBytes)}</span><span>•</span><span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => void openSavedClientAsset(asset)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="View document"><Eye className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => void removeSavedClientAsset(asset)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove document"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clientAssets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Ready to upload when saved:</span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {clientAssets.map((asset) => (
                      <div key={asset.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {asset.previewUrl ? <img src={asset.previewUrl} alt="" className="size-8 rounded object-cover shrink-0" /> : <FileText className="w-4 h-4 text-indigo-600 shrink-0" />}
                          <div className="truncate">
                            <span className="font-bold text-slate-800 text-xs truncate block">{asset.file.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">{asset.category}</span>
                              <span>• {asset.file.type || 'Unknown type'}</span>
                              <span>• {formatFileSize(asset.file.size)}</span>
                              {asset.status === 'uploading' && <span>• Uploading…</span>}
                              {asset.status === 'error' && <span className="text-red-600">• {asset.error}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => previewPendingClientAsset(asset)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Preview selected document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeClientAsset(asset.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove before saving"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Special Client Notes / Music Preferences */}
            <div className={activeStep === 3 ? 'block' : 'hidden'}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Music className="w-3 h-3 text-indigo-600" />
                Special Client Notes / Music Preferences
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Romantic Lofi Bollywood for teaser, energetic Punjabi beats for Reels, couple wants no flash during rituals."
                value={specialNotesMusicPreferences}
                onChange={(e) => setSpecialNotesMusicPreferences(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Section 3: Tasks & Deliverables Assignment */}
          <div className={`${activeStep === 5 ? 'block' : 'hidden'} space-y-4 pt-3 border-t border-slate-200`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                05 · Tasks & Deliverables
              </h4>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Task</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No tasks added. Click "+ Add Task" to add task items.</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task, index) => (
                  <div key={task.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-indigo-600" />
                        Task #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition flex items-center gap-1 text-[10px] font-bold"
                        title="Remove Task"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>- Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {/* Task Name */}
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Task / Deliverable Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Teaser / Reels / Album Design"
                          value={task.taskName}
                          onChange={(e) => handleTaskChange(index, 'taskName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                        />
                      </div>

                      {/* Quantity (Kitne bane) */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Quantity</label>
                        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[#293022] focus-within:ring-4 focus-within:ring-rose-100">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => handleTaskChange(index, 'quantity', Math.max(0, Number(task.quantity || 0) - 1))}
                            disabled={!task.quantity}
                            className="grid h-10 w-10 shrink-0 place-items-center border-r border-slate-200 text-lg font-bold text-[#20251A] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            value={task.quantity || ''}
                            onChange={(e) => handleTaskChange(index, 'quantity', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                            className="h-10 min-w-0 flex-1 appearance-none border-0 bg-white px-2 text-center text-sm font-bold text-slate-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => handleTaskChange(index, 'quantity', Number(task.quantity || 0) + 1)}
                            className="grid h-10 w-10 shrink-0 place-items-center border-l border-slate-200 text-lg font-bold text-[#20251A] transition hover:bg-rose-50"
                          >
                            +
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={160}
                          placeholder="Unit: Pcs / Reels"
                          value={task.unit || ''}
                          onChange={(e) => handleTaskChange(index, 'unit', e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600"
                        />
                      </div>

                      {/* Assigned To (Kon Assigned hai) */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5 flex items-center gap-0.5">
                          <UserCheck className="w-2.5 h-2.5 text-indigo-600" />
                          Assigned To
                        </label>
                        {(() => {
                          const selectValue = assigneeSelectValue(task.assignedTo, activeTeamMembers);
                          const isFreelancer = selectValue === FREELANCER_ASSIGNEE;
                          return (
                            <>
                              <select
                                value={selectValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const member = activeTeamMembers.find((row) => row.name === val);
                                  setTasks((current) =>
                                    current.map((row, i) =>
                                      i === index
                                        ? { ...row, assignedTo: val, assignedToId: member?.id || '' }
                                        : row,
                                    ),
                                  );
                                }}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold mb-1"
                              >
                                <option value={UNASSIGNED_ASSIGNEE}>Unassigned</option>
                                {activeTeamMembers.map((m) => (
                                  <option key={m.id || m.name} value={m.name}>
                                    {m.name}{m.role ? ` (${m.role})` : ''}
                                  </option>
                                ))}
                                <option value={FREELANCER_ASSIGNEE}>Freelancer</option>
                              </select>

                              {isFreelancer && (
                                <input
                                  type="text"
                                  placeholder="Freelancer name (optional)"
                                  value={task.assignedTo === FREELANCER_ASSIGNEE ? '' : task.assignedTo}
                                  onChange={(e) => handleTaskChange(index, 'assignedTo', e.target.value.trim() || FREELANCER_ASSIGNEE)}
                                  className="w-full bg-amber-50 border border-amber-300 rounded px-2 py-1 text-xs text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          </div>
          <div className="z-20 -mx-5 mt-0 flex shrink-0 flex-col-reverse items-stretch justify-between gap-2 border-t border-[#eee7e2] bg-white px-5 py-4 sm:-mx-7 sm:flex-row sm:items-center sm:px-7">
            <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveStep((step) => Math.max(1, step - 1))}
              disabled={activeStep === 1}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2"><ArrowLeft className="size-4"/>Previous</span>
            </button>
            </div>
            {activeStep < 5 ? <button key="wizard-next" type="button" onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (activeStep === 1 && !clientWeddingTitle.trim()) { showToast('Please enter the Client / Wedding Title before continuing.', { variant: 'error' }); return; }
              setActiveStep((step) => Math.min(5, step + 1));
            }} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#24291E] to-[#1C2018] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(28,32,24,.25)] transition hover:-translate-y-0.5 hover:shadow-lg"><span>{`Save & Next: ${['Budget','Documents','Shoot Plan','Tasks'][activeStep - 1]}`}</span><ArrowRight className="size-4"/></button> :
            <button
              key="wizard-submit"
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#24291E] to-[#1C2018] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(28,32,24,.25)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            >
              <Save className="size-4" />
              <span>{saving ? 'Saving…' : existingProject ? 'Save Project Changes' : 'Save & Create Project'}</span>
            </button>
            }
          </div>

        </form>

        <ConfirmDeleteModal
          isOpen={deleteShootModalConfig.isOpen}
          title="Delete Shoot Event"
          itemTitle={deleteShootModalConfig.itemTitle}
          onConfirm={deleteShootModalConfig.onConfirm}
          onCancel={() => setDeleteShootModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />

      </div>
    </div>
  );
};
