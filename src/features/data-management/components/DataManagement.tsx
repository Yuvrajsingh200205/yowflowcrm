import React, { useMemo, useState } from 'react';
import { Project } from '@/types';
import { HardDrive, Cloud, ChevronDown, ChevronRight, CheckCircle2, Clock, Database, Search, SlidersHorizontal, Upload, ShieldCheck, AlertTriangle, MapPin, CalendarDays, BarChart3 } from 'lucide-react';

interface DataManagementProps {
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
}

type StorageUnit = 'MB' | 'GB' | 'TB';
const storageUnitFactor: Record<StorageUnit, number> = { MB: 1 / 1_000, GB: 1, TB: 1_000 };
const storageValue = (gb: number | undefined, unit: StorageUnit) => {
  if (gb === undefined || gb === null || Number.isNaN(Number(gb))) return '';
  return Number((Number(gb) / storageUnitFactor[unit]).toFixed(6)).toString();
};
const storageToGB = (value: string, unit: StorageUnit) => Number(value || 0) * storageUnitFactor[unit];
const DEFAULT_PROJECT_STORAGE_GB = 5000;
const formatStorage = (gb: number) => gb >= 1000 ? `${parseFloat((gb / 1000).toFixed(2))} TB` : `${parseFloat(gb.toFixed(2))} GB`;

export const DataManagement: React.FC<DataManagementProps> = ({ projects = [], onUpdateProject }) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [backupFilter, setBackupFilter] = useState<'all' | 'data_received' | 'pending_data' | 'backup_pending' | 'cloud_synced'>('all');
  const [storageUnits, setStorageUnits] = useState<Record<string, StorageUnit>>({});
  const [draftProjects, setDraftProjects] = useState<Record<string, Project>>({});
  const unitFor = (key: string): StorageUnit => storageUnits[key] || 'GB';
  const setUnitFor = (key: string, unit: StorageUnit) => setStorageUnits((current) => ({ ...current, [key]: unit }));
  const projectCapacityGB = (project: Project) => {
    const value = Number(project.totalStorageCapacityGB ?? DEFAULT_PROJECT_STORAGE_GB);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_PROJECT_STORAGE_GB;
  };

  const totalGB = (projects || []).reduce((acc, p) => {
    const backup: Partial<Project['dataBackup']> = p.dataBackup || {};
    const projectShootsGB = (p.shoots || []).reduce((sAcc, s) => {
      const mainCrew = (s.crewAssignments || []).filter((c) => !c?.role?.toLowerCase().includes('assistant'));
      return sAcc + mainCrew.reduce((cAcc, c) => cAcc + (c?.dataSizeGB || 0), 0);
    }, 0);
    return acc + (backup.totalDataSizeGB || projectShootsGB);
  }, 0);
  const totalTB = (totalGB / 1000).toFixed(2);
  const totalProjectCapacityGB = (projects || []).reduce((acc, project) => acc + projectCapacityGB(project), 0);
  const availableStorageGb = Math.max(0, totalProjectCapacityGB - totalGB);

  // Logical workflow statistics
  const dataReceivedCount = (projects || []).filter(p => p.dataBackup?.offloadedFromCards || p.dataBackup?.hardDrive1Done).length;
  const pendingDataCount = (projects || []).filter(p => !p.dataBackup?.offloadedFromCards && !p.dataBackup?.hardDrive1Done).length;
  const backupPendingCount = (projects || []).filter(p => (p.dataBackup?.offloadedFromCards || p.dataBackup?.hardDrive1Done) && !p.dataBackup?.hardDrive2Done).length;
  const cloudDoneCount = (projects || []).filter(p => p.dataBackup?.cloudBackupDone).length;

  const visibleProjects = useMemo(() => projects.filter((project) => {
    const backup = project.dataBackup;
    const isDataReceived = Boolean(backup?.offloadedFromCards || backup?.hardDrive1Done);
    const isBackupDone = Boolean(backup?.hardDrive2Done);
    const isCloudDone = Boolean(backup?.cloudBackupDone);
    
    const text = `${project.clientWeddingTitle} ${project.name} ${project.primaryServiceType}`.toLowerCase();
    if (searchQuery.trim() && !text.includes(searchQuery.trim().toLowerCase())) return false;
    
    if (backupFilter === 'data_received') return isDataReceived;
    if (backupFilter === 'pending_data') return !isDataReceived;
    if (backupFilter === 'backup_pending') return isDataReceived && !isBackupDone;
    if (backupFilter === 'cloud_synced') return isCloudDone;
    return true;
  }), [projects, searchQuery, backupFilter]);

  const handleUpdateCrewData = (projectId: string, shootId: string, crewId: string, field: string, value: any) => {
    const project = draftProjects[projectId] || projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedShoots = (project.shoots || []).map((s) => {
      if (s.id !== shootId) return s;
      const updatedCrew = (s.crewAssignments || []).map((c) => {
        if (c.id !== crewId) return c;
        return { ...c, [field]: value };
      });
      return { ...s, crewAssignments: updatedCrew };
    });

    const allCrew = updatedShoots.flatMap((s) => s.crewAssignments || []);
    const crewCopyHDs = Array.from(
      new Set(
        allCrew
          .map((c) => (c.copyInHD || c.hardDriveName || '').trim())
          .filter(Boolean)
      )
    ).join(', ');

    const crewBackupHDs = Array.from(
      new Set(
        allCrew
          .map((c) => (c.backupInHD || '').trim())
          .filter(Boolean)
      )
    ).join(', ');

    const backup = project.dataBackup || {
      offloadedFromCards: false,
      hardDrive1: 'HD-1',
      hardDrive1Done: false,
      hardDrive2: 'HD-2',
      hardDrive2Done: false,
      cloudBackupDone: false,
      totalDataSizeGB: 0,
      rawCleanupStatus: 'not_cleaned',
    };

    let updatedHD1 = backup.hardDrive1;
    if (!updatedHD1 || updatedHD1 === 'Pending Shoot' || updatedHD1 === 'HD-1' || field === 'copyInHD') {
      if (crewCopyHDs) updatedHD1 = crewCopyHDs;
    }

    let updatedHD2 = backup.hardDrive2;
    if (!updatedHD2 || updatedHD2 === 'Pending Shoot' || updatedHD2 === 'HD-2' || field === 'backupInHD') {
      if (crewBackupHDs) updatedHD2 = crewBackupHDs;
    }

    setDraftProjects((current) => ({ ...current, [projectId]: {
      ...project,
      shoots: updatedShoots,
      dataBackup: {
        ...backup,
        hardDrive1: updatedHD1,
        hardDrive2: updatedHD2,
      },
    }}));
  };

  const handleUpdateBackup = (projectId: string, updates: Partial<Project['dataBackup']>) => {
    const project = draftProjects[projectId] || projects.find((item) => item.id === projectId);
    if (!project) return;
    const fallback = { offloadedFromCards: false, hardDrive1: 'Primary drive', hardDrive1Done: false, hardDrive2: 'Mirror drive', hardDrive2Done: false, cloudBackupDone: false, totalDataSizeGB: 0, rawCleanupStatus: 'not_cleaned' as const };
    const received = Boolean(updates.hardDrive1Done || updates.offloadedFromCards);
    const shoots = received
      ? (project.shoots || []).map((shoot) => ({
          ...shoot,
          crewAssignments: (shoot.crewAssignments || []).map((crew) => ({ ...crew, dataReceived: true })),
        }))
      : project.shoots;
    setDraftProjects((current) => ({ ...current, [projectId]: { ...project, shoots, dataBackup: { ...(project.dataBackup || fallback), ...updates } } }));
  };

  const handleUpdateProjectCapacity = (projectId: string, value: string, unit: StorageUnit) => {
    const capacityGb = storageToGB(value, unit);
    if (!Number.isFinite(capacityGb) || capacityGb < 0) return;
    const project = draftProjects[projectId] || projects.find((item) => item.id === projectId);
    if (!project) return;
    setDraftProjects((current) => ({ ...current, [projectId]: { ...project, totalStorageCapacityGB: capacityGb } }));
  };

  const handleUpdateProjectUsedStorage = (projectId: string, value: string, unit: StorageUnit) => {
    const usedGb = storageToGB(value, unit);
    if (!Number.isFinite(usedGb) || usedGb < 0) return;
    const project = draftProjects[projectId] || projects.find((item) => item.id === projectId);
    if (!project) return;
    const fallback = { offloadedFromCards: false, hardDrive1: 'Primary drive', hardDrive1Done: false, hardDrive2: 'Mirror drive', hardDrive2Done: false, cloudBackupDone: false, totalDataSizeGB: 0, rawCleanupStatus: 'not_cleaned' as const };
    setDraftProjects((current) => ({
      ...current,
      [projectId]: {
        ...project,
        dataBackup: { ...(project.dataBackup || fallback), totalDataSizeGB: usedGb },
      },
    }));
  };

  const saveDraftChanges = (projectId?: string) => {
    const entries = projectId
      ? (draftProjects[projectId] ? [[projectId, draftProjects[projectId]] as const] : [])
      : Object.entries(draftProjects);
    entries.forEach(([, project]) => {
      const crewDataByShoot = Object.fromEntries((project.shoots || []).map((shoot) => [
        shoot.id,
        Object.fromEntries((shoot.crewAssignments || []).map((crew) => [crew.id, {
          dataReceived: !!crew.dataReceived,
          dataSizeGB: crew.dataSizeGB || 0,
          backupDataSizeGB: crew.backupDataSizeGB || 0,
          copyInHD: crew.copyInHD || '',
          backupInHD: crew.backupInHD || '',
          hardDriveName: crew.hardDriveName || '',
        }])),
      ]));
      onUpdateProject({ ...project, dataBackup: { ...project.dataBackup, crewDataByShoot } });
    });
    setDraftProjects((current) => {
      if (!projectId) return {};
      const next = { ...current };
      delete next[projectId];
      return next;
    });
  };

  return (
    <div className="space-y-5 pb-8 w-full">
      
      <section className="relative overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(204,235,142,.2),transparent_30%),linear-gradient(125deg,#41463E,#55333f_50%,#21241F)] p-5 text-white shadow-xl sm:p-7"><div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" /><div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div className="max-w-3xl"><span className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#E6E8E4]"><ShieldCheck className="size-4 text-emerald-300" />Storage control centre</span><h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Database className="size-6 text-[#DCDFDA]" /></span>Data Management</h1><p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">Track every RAW-data handover from memory card to primary drive, mirror drive, and cloud backup.</p></div><div className="rounded-2xl border border-white/20 bg-black/10 px-4 py-3 text-sm"><p className="text-[10px] font-black uppercase tracking-[.14em] text-rose-200">Project storage used</p><p className="mt-1 flex items-baseline gap-1 text-2xl font-black">{totalTB}<span className="text-sm text-[#dfeae7]">TB</span></p><p className="text-xs font-medium text-[#dfeae7]">{formatStorage(totalProjectCapacityGB)} total across projects</p></div></div></section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-6">{[
        { label: 'All Shoots / Projects', value: `${projects.length}`, hint: `${totalTB} TB (${totalGB.toLocaleString()} GB)`, icon: Database, tone: 'text-slate-700 bg-white border-[#e2d9d3]', key: 'all' },
        { label: 'Data Received', value: `${dataReceivedCount}`, hint: 'Cards offloaded & HD-1', icon: Upload, tone: 'text-indigo-800 bg-indigo-50 border-indigo-200', key: 'data_received' },
        { label: 'Pending Data', value: `${pendingDataCount}`, hint: 'Awaiting card offload', icon: AlertTriangle, tone: 'text-[#464B43] bg-rose-50 border-rose-200', key: 'pending_data' },
        { label: 'Backup Pending', value: `${backupPendingCount}`, hint: 'Needs HD-2 mirror copy', icon: Clock, tone: 'text-amber-800 bg-amber-50 border-amber-200', key: 'backup_pending' },
        { label: 'Cloud Synced', value: `${cloudDoneCount}`, hint: 'Off-site backup complete', icon: Cloud, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200', key: 'cloud_synced' },
        { label: 'Available Space', value: formatStorage(availableStorageGb), hint: `${availableStorageGb.toLocaleString()} GB remaining across projects`, icon: HardDrive, tone: 'text-cyan-800 bg-cyan-50 border-cyan-200', key: 'available_space' },
      ].map(({ label, value, hint, icon: Icon, tone, key }) => (
        <button
          key={label}
          type="button"
          onClick={() => setBackupFilter(key as typeof backupFilter)}
          className={`rounded-2xl border p-3.5 text-left transition shadow-[0_8px_24px_rgba(48,44,46,.04)] cursor-pointer hover:opacity-90 ${tone} ${
            backupFilter === key ? 'ring-2 ring-[#464B43] shadow-md' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">{label}</p>
              <p className="mt-1 text-2xl font-black">{value}</p>
              <p className="text-[11px] font-semibold opacity-75">{hint}</p>
            </div>
            <Icon className="size-5 opacity-70 shrink-0" />
          </div>
        </button>
      ))}</section>

      <section className="rounded-2xl border border-[#e2d9d3] bg-white p-4 shadow-[0_8px_24px_rgba(48,44,46,.05)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-800">
              <ShieldCheck className="size-5 text-[#464B43]" />
              Wedding shoot data workflow
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every shoot should follow this simple 4-step safety process before editing starts.
            </p>
          </div>
          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#464B43]">
            Click a project below to update it
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Database, title: '1. All Shoot / Projects', text: 'All scheduled shoot events and total RAW data storage logged.' },
            { icon: Upload, title: '2. Data Received', text: 'Receive data cards from shooters and offload to primary HD-1.' },
            { icon: AlertTriangle, title: '3. Pending Data', text: 'Shoots pending data offload or uncollected memory cards.' },
            { icon: HardDrive, title: '4. Backup Pending', text: 'Verify and create secondary mirror drive copy (HD-2) for safety.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-[#464B43]">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-800">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e2d9d3] bg-white p-3 shadow-[0_8px_24px_rgba(48,44,46,.05)] sm:p-4"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700"><SlidersHorizontal className="size-4 text-[#464B43]" />Find project data</div><p className="mb-3 text-xs font-medium text-slate-500">Edits are kept locally. Use the Save Changes button in each project log to send them to the server.</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="relative"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#50574D]" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search client or project…" className="w-full rounded-xl border border-[#ded5cf] bg-[#FBFDF6] py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#50574D] focus:ring-4 focus:ring-rose-100" /></label><label className="relative"><ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#50574D]" /><select value={backupFilter} onChange={(event) => setBackupFilter(event.target.value as typeof backupFilter)} className="w-full appearance-none rounded-xl border border-[#ded5cf] bg-[#FBFDF6] py-2.5 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-[#50574D] focus:ring-4 focus:ring-rose-100"><option value="all">All Shoots / Projects ({projects.length})</option><option value="data_received">Data Received ({dataReceivedCount})</option><option value="pending_data">Pending Data ({pendingDataCount})</option><option value="backup_pending">Backup Pending ({backupPendingCount})</option><option value="cloud_synced">Cloud Synced ({cloudDoneCount})</option></select></label></div></section>

      {/* Projects Storage Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee7e2] bg-[#FBFDF6] p-4">
          <div><p className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><HardDrive className="size-4 text-[#464B43]" />Project data ledger</p><p className="mt-0.5 text-xs text-slate-500">Open a project to update each event’s crew-data handover.</p></div>
          <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-[#464B43]">{visibleProjects.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm text-slate-700">
            <thead className="bg-[#f7f3f1] text-slate-600 font-extrabold uppercase tracking-[.08em] text-xs border-b border-[#e2d9d3]">
              <tr>
                <th className="px-5 py-4">Client project</th>
                <th className="px-5 py-4">Primary copy drive</th>
                <th className="px-5 py-4">Mirror backup drive</th>
                <th className="px-5 py-4">Total storage</th>
                <th className="px-5 py-4">Used</th>
                <th className="px-5 py-4">Available</th>
                <th className="px-5 py-4">Crew handover status</th>
                <th className="px-5 py-4">Handover progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProjects.map((sourceProject) => {
                const p = draftProjects[sourceProject.id] || sourceProject;
                const isExpanded = expandedProjectId === p.id;
                const backup = p.dataBackup || {
                  offloadedFromCards: false,
                  hardDrive1: 'HD-1',
                  hardDrive1Done: false,
                  hardDrive2: 'HD-2',
                  hardDrive2Done: false,
                  cloudBackupLink: '',
                  cloudBackupDone: false,
                  totalDataSizeGB: 0,
                  rawCleanupStatus: 'not_cleaned',
                };

                const allCrew = (p.shoots || []).flatMap((s) => s.crewAssignments || []);
                const crewCopyHDs = Array.from(
                  new Set(
                    allCrew
                      .map((c) => (c.copyInHD || c.hardDriveName || '').trim())
                      .filter(Boolean)
                  )
                ).join(', ');

                const crewBackupHDs = Array.from(
                  new Set(
                    allCrew
                      .map((c) => (c.backupInHD || '').trim())
                      .filter(Boolean)
                  )
                ).join(', ');

                const effectiveHD1 = (backup.hardDrive1 && backup.hardDrive1 !== 'Pending Shoot' && backup.hardDrive1 !== 'HD-1')
                  ? backup.hardDrive1
                  : (crewCopyHDs || backup.hardDrive1 || '');

                const effectiveHD2 = (backup.hardDrive2 && backup.hardDrive2 !== 'Pending Shoot' && backup.hardDrive2 !== 'HD-2')
                  ? backup.hardDrive2
                  : (crewBackupHDs || backup.hardDrive2 || '');

                const totalCrewSlots = (p.shoots || []).reduce((acc, s) => {
                  const mainCrew = (s.crewAssignments || []).filter((c) => !c?.role?.toLowerCase().includes('assistant'));
                  return acc + mainCrew.length;
                }, 0);
                const receivedCrewSlots = (p.shoots || []).reduce((acc, s) => {
                  const mainCrew = (s.crewAssignments || []).filter((c) => !c?.role?.toLowerCase().includes('assistant'));
                  return acc + mainCrew.filter((c) => c?.dataReceived).length;
                }, 0);
                const projectShootsGB = (p.shoots || []).reduce((sum, shoot) =>
                  sum + (shoot.crewAssignments || [])
                    .filter((crew) => !crew?.role?.toLowerCase().includes('assistant'))
                    .reduce((crewSum, crew) => crewSum + (crew?.dataSizeGB || 0), 0), 0);
                const projectUsedGB = backup.totalDataSizeGB || projectShootsGB;
                const projectTotalStorageGB = projectCapacityGB(p);
                const projectAvailableGB = Math.max(0, projectTotalStorageGB - projectUsedGB);

                return (
                  <React.Fragment key={p.id}>
                    <tr className="cursor-pointer border-b border-[#f0ebe8] transition hover:bg-[#fffafa]" onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <span className="flex items-center gap-1 text-base font-extrabold text-slate-900">
                              <span>{p.clientWeddingTitle}</span>
                            </span>
                            <span className="mt-0.5 block text-xs font-medium text-slate-500">{p.primaryServiceType}</span>
                          </div>
                        </div>
                      </td>

                      {/* HDD 1 */}
                      <td className="px-5 py-4">
                        <span className="inline-block max-w-[200px] truncate rounded-xl border border-[#ded5cf] bg-[#FBFDF6] px-3 py-2 font-mono text-xs font-semibold text-slate-800" title={effectiveHD1 || 'Pending Shoot'}>
                          {effectiveHD1 || 'Pending Shoot'}
                        </span>
                      </td>

                      {/* HDD 2 */}
                      <td className="px-5 py-4">
                        <span className="inline-block max-w-[200px] truncate rounded-xl border border-[#ded5cf] bg-[#FBFDF6] px-3 py-2 font-mono text-xs font-semibold text-slate-800" title={effectiveHD2 || 'Pending Shoot'}>
                          {effectiveHD2 || 'Pending Shoot'}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-base font-black text-[#464B43]">
                        <div>{formatStorage(projectTotalStorageGB)}</div>
                      </td>

                      <td className="px-5 py-4 font-mono text-base font-black text-[#464B43]">
                        <div>{formatStorage(projectUsedGB)}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-mono text-base font-black text-cyan-700">{formatStorage(projectAvailableGB)}<span className="ml-1 text-[10px] font-bold text-slate-500">free</span></div>
                      </td>

                      {/* Team Data Received Summary */}
                      <td className="px-5 py-4">
                        {totalCrewSlots > 0 ? (
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ${
                            receivedCrewSlots === totalCrewSlots
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {receivedCrewSlots} / {totalCrewSlots} Crew Data Recd
                          </span>
                        ) : (
                          <span className="text-xs font-medium italic text-slate-400">No crew assigned</span>
                        )}
                      </td>

                      {/* Done Rate Progress Bar Line */}
                      <td className="px-5 py-4">
                        {(() => {
                          const crewDoneRate = totalCrewSlots > 0 ? Math.round((receivedCrewSlots / totalCrewSlots) * 100) : 0;
                          return (
                            <div className="w-40 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Received</span>
                                <span className="font-extrabold text-[#464B43]">{crewDoneRate}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${crewDoneRate}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* EXPANDED EVENT-WISE TEAM MEMBER DATA LEDGER */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="p-4">
                          <div className="space-y-5 rounded-2xl border border-[#e2d9d3] bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[.08em] text-slate-900">
                                <HardDrive className="size-5 text-[#464B43]" />
                                <span>Events & Shooter Data Received Log — {p.clientWeddingTitle}</span>
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-800">Available: {formatStorage(projectAvailableGB)}</span>
                                <span className="text-xs font-bold text-slate-500">{p.shoots?.length || 0} Event(s) Configured</span>
                                <button type="button" disabled={!draftProjects[p.id]} onClick={() => saveDraftChanges(p.id)} className="rounded-lg bg-[#464B43] px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-[#393D37] disabled:cursor-not-allowed disabled:opacity-45">Save Changes</button>
                              </div>
                            </div>

                            <div className="grid gap-3 rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-3 sm:grid-cols-2 xl:grid-cols-4">
                              <label className="text-xs font-extrabold text-slate-700">Total Storage Capacity
                                <div className="mt-1 flex gap-1">
                                  <input
                                    type="number"
                                    min="0.001"
                                    step="any"
                                    value={storageValue(projectTotalStorageGB, unitFor(`capacity-${p.id}`))}
                                    onChange={(event) => handleUpdateProjectCapacity(p.id, event.target.value, unitFor(`capacity-${p.id}`))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold text-slate-900 outline-none focus:border-[#464B43]"
                                  />
                                  <select
                                    aria-label={`${p.clientWeddingTitle} capacity unit`}
                                    value={unitFor(`capacity-${p.id}`)}
                                    onChange={(event) => setUnitFor(`capacity-${p.id}`, event.target.value as StorageUnit)}
                                    className="w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="MB">MB</option><option value="GB">GB</option><option value="TB">TB</option>
                                  </select>
                                </div>
                              </label>
                              <label className="text-xs font-extrabold text-slate-700">Used Storage / RAW Data Size
                                <div className="mt-1 flex gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={storageValue(projectUsedGB, unitFor(`used-${p.id}`))}
                                    onChange={(event) => handleUpdateProjectUsedStorage(p.id, event.target.value, unitFor(`used-${p.id}`))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold text-slate-900 outline-none focus:border-[#464B43]"
                                  />
                                  <select
                                    aria-label={`${p.clientWeddingTitle} used storage unit`}
                                    value={unitFor(`used-${p.id}`)}
                                    onChange={(event) => setUnitFor(`used-${p.id}`, event.target.value as StorageUnit)}
                                    className="w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="MB">MB</option><option value="GB">GB</option><option value="TB">TB</option>
                                  </select>
                                </div>
                              </label>
                              {[
                                ['Available Storage', formatStorage(projectAvailableGB)],
                                ['Primary Copy Drive', effectiveHD1 || 'Pending Shoot'],
                                ['Mirror Backup Drive', effectiveHD2 || 'Pending Shoot'],
                                ['Crew Data Handover', totalCrewSlots > 0 ? `${receivedCrewSlots} / ${totalCrewSlots} received` : 'No crew assigned'],
                                ['Handover Progress', `${totalCrewSlots > 0 ? Math.round((receivedCrewSlots / totalCrewSlots) * 100) : 0}%`],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-[#e2d9d3] bg-white p-3">
                                  <p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p>
                                  <p className="mt-1 break-words text-sm font-black text-slate-800">{value}</p>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {[
                                { key: 'offloadedFromCards' as const, label: '1. All Shoot / Projects', hint: `${p.shoots?.length || 0} events logged`, icon: Database, done: Boolean(p.shoots && p.shoots.length > 0) },
                                { key: 'hardDrive1Done' as const, label: '2. Data Received', hint: backup.hardDrive1 || 'Cards offloaded & HD-1', icon: Upload, done: backup.offloadedFromCards || backup.hardDrive1Done },
                                { key: 'offloadedFromCards' as const, label: '3. Pending Data', hint: (backup.offloadedFromCards || backup.hardDrive1Done) ? 'Data Received' : 'Awaiting card offload', icon: AlertTriangle, done: backup.offloadedFromCards || backup.hardDrive1Done, isPendingFlag: true },
                                { key: 'hardDrive2Done' as const, label: '4. Backup Pending', hint: backup.hardDrive2 || 'HD-2 Mirror Copy', icon: HardDrive, done: backup.hardDrive2Done },
                              ].map(({ key, label, hint, icon: Icon, done, isPendingFlag }) => {
                                const isCompleted = isPendingFlag ? done : done;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => !isPendingFlag && handleUpdateBackup(p.id, { [key]: !done })}
                                    className={`rounded-2xl border p-3 text-left transition ${
                                      isCompleted
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                        : 'border-[#e2d9d3] bg-[#FBFDF6] text-slate-700 hover:border-rose-300 hover:bg-rose-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <Icon className={`size-5 ${isCompleted ? 'text-emerald-700' : 'text-[#464B43]'}`} />
                                      {isCompleted ? <CheckCircle2 className="size-4 text-emerald-700" /> : <Clock className="size-4 text-amber-600" />}
                                    </div>
                                    <p className="mt-2 text-sm font-extrabold">{label}</p>
                                    <p className="mt-0.5 text-xs leading-snug opacity-75">{isCompleted ? 'Completed' : hint}</p>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="-mt-2 text-xs text-slate-500">Tap any step to mark it complete or update backup status. This is your project’s safety checklist.</p>

                            {(!p.shoots || p.shoots.length === 0) ? (
                              <div className="text-slate-400 text-xs italic text-center p-4 bg-slate-50 rounded border border-dashed border-slate-200">
                                No shoot events added for this project yet.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {(p.shoots || []).map((s) => {
                                  const mainCrew = (s.crewAssignments || []).filter((c) => !c?.role?.toLowerCase().includes('assistant'));
                                  const eventTotalGB = mainCrew.reduce((acc, c) => acc + (c?.dataSizeGB || 0), 0);
                                  return (
                                    <div key={s.id} className="space-y-3 rounded-2xl border border-[#e2d9d3] bg-[#FBFDF6] p-4">
                                      <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                                        <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-[#464B43]" />{s.title || 'Wedding Event'} ({s.date})</span>
                                        <div className="flex items-center gap-2">
                                          <span className="rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-900">
                                            Event total: {eventTotalGB >= 1000 ? `${parseFloat((eventTotalGB / 1000).toFixed(2))} TB` : `${eventTotalGB} GB`}
                                          </span>
                                          <span className="flex items-center gap-1 text-xs font-semibold text-[#464B43]"><MapPin className="size-3.5" />{s.venue}</span>
                                        </div>
                                      </div>

                                      {(mainCrew.length === 0) ? (
                                        <div className="text-[10px] text-slate-400 italic p-2 bg-white rounded border border-slate-200">
                                          No main shooting team members assigned to this shoot event.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left text-sm bg-white rounded-xl border border-[#e2d9d3] overflow-hidden">
                                            <thead className="bg-[#f7f3f1] text-slate-600 font-bold text-xs uppercase">
                                              <tr>
                                                <th className="p-2">Role & Team Member</th>
                                                <th className="p-2 text-center">Data Received</th>
                                                <th className="p-2 min-w-[140px]">Primary copy drive</th>
                                                <th className="p-2 w-40">Data Size</th>
                                                <th className="p-2 min-w-[140px]">Mirror backup drive</th>
                                                <th className="p-2 w-40">Mirror Size</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {mainCrew.map((c, idx) => (
                                                <tr key={c.id || idx}>
                                                  <td className="p-2 font-bold text-slate-800">
                                                    <span className="text-[10px] text-slate-500 font-normal mr-1">[{c.role}]</span>
                                                    {c.name || 'Unassigned'}
                                                  </td>
                                                  <td className="p-2 text-center">
                                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                                      <input
                                                        type="checkbox"
                                                        checked={!!c.dataReceived}
                                                        onChange={(e) => handleUpdateCrewData(p.id, s.id, c.id, 'dataReceived', e.target.checked)}
                                                        className="rounded text-indigo-600"
                                                      />
                                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        c.dataReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                      }`}>
                                                        {c.dataReceived ? 'Received' : 'Pending'}
                                                      </span>
                                                    </label>
                                                  </td>
                                                  <td className="p-2">
                                                    <input
                                                      type="text"
                                                      placeholder="Copy HD Name"
                                                      value={c.copyInHD ?? c.hardDriveName ?? ''}
                                                      onChange={(e) => handleUpdateCrewData(p.id, s.id, c.id, 'copyInHD', e.target.value)}
                                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-medium focus:bg-white outline-none"
                                                    />
                                                  </td>
                                                  <td className="p-2">
                                                    <div className="flex items-center gap-1">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        placeholder="e.g. 250"
                                                        value={storageValue(c.dataSizeGB, unitFor(`data-${p.id}-${s.id}-${c.id}`))}
                                                        onChange={(e) => handleUpdateCrewData(p.id, s.id, c.id, 'dataSizeGB', storageToGB(e.target.value, unitFor(`data-${p.id}-${s.id}-${c.id}`)))}
                                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:bg-white outline-none"
                                                      />
                                                      <select
                                                        aria-label={`${c.name || 'Team member'} data size unit`}
                                                        value={unitFor(`data-${p.id}-${s.id}-${c.id}`)}
                                                        onChange={(e) => setUnitFor(`data-${p.id}-${s.id}-${c.id}`, e.target.value as StorageUnit)}
                                                        className="w-[64px] shrink-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-bold text-slate-600 outline-none"
                                                      >
                                                        <option value="MB">MB</option><option value="GB">GB</option><option value="TB">TB</option>
                                                      </select>
                                                    </div>
                                                  </td>
                                                  <td className="p-2">
                                                    <input
                                                      type="text"
                                                      placeholder="Backup HD Name"
                                                      value={c.backupInHD || ''}
                                                      onChange={(e) => handleUpdateCrewData(p.id, s.id, c.id, 'backupInHD', e.target.value)}
                                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-medium focus:bg-white outline-none"
                                                    />
                                                  </td>
                                                  <td className="p-2">
                                                    <div className="flex items-center gap-1">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        placeholder="e.g. 250"
                                                        value={storageValue(c.backupDataSizeGB ?? c.dataSizeGB, unitFor(`backup-${p.id}-${s.id}-${c.id}`))}
                                                        onChange={(e) => handleUpdateCrewData(p.id, s.id, c.id, 'backupDataSizeGB', storageToGB(e.target.value, unitFor(`backup-${p.id}-${s.id}-${c.id}`)))}
                                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold focus:bg-white outline-none"
                                                      />
                                                      <select
                                                        aria-label={`${c.name || 'Team member'} mirror size unit`}
                                                        value={unitFor(`backup-${p.id}-${s.id}-${c.id}`)}
                                                        onChange={(e) => setUnitFor(`backup-${p.id}-${s.id}-${c.id}`, e.target.value as StorageUnit)}
                                                        className="w-[64px] shrink-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-bold text-slate-600 outline-none"
                                                      >
                                                        <option value="MB">MB</option><option value="GB">GB</option><option value="TB">TB</option>
                                                      </select>
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                            <tfoot className="bg-slate-100/90 border-t-2 border-slate-200 font-bold text-slate-800">
                                              <tr>
                                                <td className="p-2 text-right text-slate-700 font-black text-[10px] uppercase tracking-tight" colSpan={2}>
                                                  Total event data size:
                                                </td>
                                                <td className="p-2" colSpan={3}>
                                                  <div className="flex items-center gap-2">
                                                    <span className="bg-indigo-600 text-white font-black text-xs px-2 py-0.5 rounded shadow-2xs">
                                                      {eventTotalGB} GB
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                                                      (Event RAW Storage)
                                                    </span>
                                                  </div>
                                                </td>
                                              </tr>
                                            </tfoot>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* GRAND TOTAL ALL EVENTS DATA SIZE BANNER */}
                            {(() => {
                              const grandTotalGB = (p.shoots || [])
                                .flatMap((s) => (s.crewAssignments || []).filter((c) => !c?.role?.toLowerCase().includes('assistant')))
                                .reduce((acc, c) => acc + (c?.dataSizeGB || 0), 0);
                              return (
                                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-lg p-3 flex items-center justify-between shadow-xs border border-indigo-800">
                                  <div className="flex items-center gap-2.5">
                                    <HardDrive className="w-4 h-4 text-indigo-300" />
                                    <span className="text-xs font-black uppercase text-indigo-200 tracking-wider">
                                      All events grand total data size
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-amber-300 font-mono">
                                      {grandTotalGB >= 1000 ? `${parseFloat((grandTotalGB / 1000).toFixed(2))} TB` : `${grandTotalGB} GB`}
                                    </span>
                                    <span className="text-[10px] text-indigo-200 font-bold bg-white/10 px-2 py-0.5 rounded">
                                      ({grandTotalGB} GB Raw)
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
