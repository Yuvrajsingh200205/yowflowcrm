'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Eye, IndianRupee, Loader2, Mail, MapPin, Phone, Search, SlidersHorizontal, UserPlus, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { BackendCrewRole, BackendFreelancer, FreelancerAvailabilityRecord, FreelancerConnection, FreelancerPortfolioRecord, FreelancerSearchResult, freelancersApi } from '@/lib/api/freelancers';
import { Project } from '@/types';
import { BTN_GHOST, BTN_PRIMARY, CARD, FIELD, LABEL } from '@/features/team/components/TeamUiKit';
import { useToast } from '@/components/common';

const roles: BackendCrewRole[] = ['LEAD_PHOTOGRAPHER', 'CANDID_PHOTOGRAPHER', 'TRADITIONAL_PHOTOGRAPHER', 'CINEMATOGRAPHER', 'TRADITIONAL_VIDEOGRAPHER', 'DRONE_OPERATOR', 'ASSISTANT', 'LIGHT_ASSISTANT', 'LIVE_EDITOR', 'COORDINATOR', 'OTHER'];
type AvailabilityFilter = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
const roleLabel = (role?: string | null) => (role || 'OTHER').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
const connectionActionLabel = (status: FreelancerConnection['status']) => {
  if (status === 'ACCEPTED') return 'Connect';
  if (status === 'CONTACTED') return 'Request Sent';
  if (status === 'ASSIGNED') return 'Connected';
  if (status === 'DECLINED') return 'Declined';
  return 'Send Request';
};
const canOpenConnectionDialog = (status: FreelancerConnection['status']) => status === 'INTERESTED' || status === 'ACCEPTED';
const pipelineStatuses: FreelancerConnection['status'][] = ['INTERESTED', 'CONTACTED', 'ACCEPTED'];

type Mode = 'find' | 'interested';

interface Props {
  mode: Mode;
  projects: Project[];
}

interface Filters {
  q: string;
  location: string;
  specialization: string;
  skill: string;
  availabilityDate: string;
  availabilityStatus: '' | AvailabilityFilter;
}

export function FreelancerMarketplaceView({ mode, projects }: Props) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<Filters>({ q: '', location: '', specialization: '', skill: '', availabilityDate: '', availabilityStatus: '' });
  const [results, setResults] = useState<FreelancerSearchResult[]>([]);
  const [connections, setConnections] = useState<FreelancerConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<FreelancerSearchResult | null>(null);
  const [connecting, setConnecting] = useState<FreelancerConnection | null>(null);

  const loadSearch = async () => {
    setLoading(true);
    try {
      const response = await freelancersApi.search({
        q: filters.q || undefined,
        location: filters.location || undefined,
        specialization: filters.specialization as BackendCrewRole || undefined,
        skill: filters.skill || undefined,
        availabilityDate: filters.availabilityDate || undefined,
        availabilityStatus: filters.availabilityStatus || undefined,
        pageSize: 20,
      });
      setResults(response.data);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to search freelancers.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadInterested = async () => {
    setLoading(true);
    try {
      const response = await freelancersApi.listConnections({ limit: 100 });
      setConnections(response.data.filter((item) => pipelineStatuses.includes(item.status)));
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to load interested freelancers.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'find') void loadSearch();
    else void loadInterested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const interestedIds = useMemo(() => new Set(connections.map((item) => item.freelancerId)), [connections]);

  const markInterested = async (freelancer: FreelancerSearchResult) => {
    if (mutatingId) return;
    setMutatingId(freelancer.id);
    try {
      const created = await freelancersApi.createConnection({ freelancerId: freelancer.id, status: 'INTERESTED' });
      setConnections((current) => [created, ...current]);
      setResults((current) => current.map((item) => item.id === freelancer.id ? { ...item, connection: created } : item));
      showToast('Added to Interested');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to mark interested.', { variant: 'error' });
    } finally {
      setMutatingId(null);
    }
  };

  const clear = () => {
    setFilters({ q: '', location: '', specialization: '', skill: '', availabilityDate: '', availabilityStatus: '' });
  };

  return (
    <div className="space-y-5">
      {mode === 'find' ? (
        <>
          <section className={`${CARD} p-4`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">Find Freelancer</h2>
                <p className="text-xs font-medium text-slate-500">Search active freelancer profiles from the production network.</p>
              </div>
              <button type="button" className={BTN_GHOST} onClick={clear}><SlidersHorizontal className="size-3.5" /> Clear</button>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
              <label className="xl:col-span-2"><span className={LABEL}>Search</span><input className={FIELD} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Name, city, skill" /></label>
              <label><span className={LABEL}>Date</span><input type="date" className={FIELD} value={filters.availabilityDate} onChange={(e) => setFilters({ ...filters, availabilityDate: e.target.value })} /></label>
              <label><span className={LABEL}>Specialization</span><select className={FIELD} value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}><option value="">All</option>{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
              <label><span className={LABEL}>Location</span><input className={FIELD} value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Jaipur" /></label>
              <label><span className={LABEL}>Availability</span><select className={FIELD} value={filters.availabilityStatus} onChange={(e) => setFilters({ ...filters, availabilityStatus: e.target.value as Filters['availabilityStatus'] })}><option value="">Available or partial</option><option value="AVAILABLE">Available</option><option value="PARTIALLY_AVAILABLE">Partial</option><option value="UNAVAILABLE">Unavailable</option></select></label>
            </div>
            <div className="mt-3 flex justify-end"><button type="button" onClick={loadSearch} className={BTN_PRIMARY}><Search className="size-4" /> Search</button></div>
          </section>
          {loading ? <Skeleton /> : results.length === 0 ? <Empty title="No freelancers match these filters." action={loadSearch} /> : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {results.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  freelancer={freelancer}
                  interested={Boolean(freelancer.connection) || interestedIds.has(freelancer.id)}
                  busy={mutatingId === freelancer.id}
                  onView={() => setSelected(freelancer)}
                  onInterested={() => markInterested(freelancer)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <section className={`${CARD} p-4`}>
            <h2 className="text-base font-black uppercase tracking-wide text-slate-900">Approval Pipeline</h2>
            <p className="text-xs font-medium text-slate-500">Interested, requested and accepted freelancers stay here until they are connected or removed.</p>
          </section>
          {loading ? <Skeleton /> : connections.length === 0 ? <Empty title="No freelancers waiting in the approval pipeline." /> : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <article key={connection.id} className={`${CARD} flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between`}>
                  <div>
                    <p className="font-black text-slate-900">{connection.freelancer?.fullName || 'Freelancer'}</p>
                    <p className="text-xs font-bold text-[#292F22]">{roleLabel(connection.freelancer?.primarySkill)} · {connection.freelancer?.city || 'Location not set'}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{connection.project?.name ? `Project: ${connection.project.name}` : 'No project selected yet'} · {connection.status}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Interested on {new Date(connection.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {connection.freelancer ? <button type="button" className={BTN_GHOST} onClick={() => setSelected({
                      id: connection.freelancer!.id,
                      code: connection.freelancer!.code,
                      displayName: connection.freelancer!.fullName,
                      city: connection.freelancer!.city,
                      specialization: connection.freelancer!.primarySkill,
                      experienceYears: null,
                      skills: [],
                      searchable: true,
                      availability: null,
                      portfolioCount: 0,
                      portfolioPreview: [],
                      connection,
                    })}><Eye className="size-3.5" /> View Profile</button> : null}
                    <button type="button" className={BTN_GHOST} disabled={!canOpenConnectionDialog(connection.status)} onClick={() => setConnecting(connection)}><BriefcaseBusiness className="size-3.5" /> {connectionActionLabel(connection.status)}</button>
                    <button type="button" className={BTN_GHOST} onClick={async () => { await freelancersApi.updateConnection(connection.id, { status: 'EXPIRED' }); setConnections((items) => items.filter((item) => item.id !== connection.id)); }}><X className="size-3.5" /> Remove</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {selected && <ProfileDrawer freelancer={selected} onClose={() => setSelected(null)} onInterested={() => markInterested(selected)} busy={mutatingId === selected.id} />}
      {connecting && <ConnectDialog connection={connecting} projects={projects} onClose={() => setConnecting(null)} onConnected={(updated) => { setConnections((items) => items.map((item) => item.id === updated.id ? updated : item)); setConnecting(null); showToast(updated.status === 'CONTACTED' ? 'Approval request sent to freelancer' : 'Freelancer connected to project'); }} />}
    </div>
  );
}

function FreelancerCard({ freelancer, interested, busy, onView, onInterested }: { freelancer: FreelancerSearchResult; interested: boolean; busy: boolean; onView: () => void; onInterested: () => void }) {
  return (
    <article className={`${CARD} p-4`}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#E6E8E4] text-sm font-black text-[#1C2018]">{freelancer.displayName.slice(0, 2).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-slate-900">{freelancer.displayName}</p>
          <p className="text-xs font-bold text-[#292F22]">{roleLabel(freelancer.specialization)}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500"><MapPin className="size-3" />{freelancer.city || 'Location not set'}<span>{freelancer.experienceYears ?? 0} years</span></p>
          <div className="mt-2 flex flex-wrap gap-1">{freelancer.skills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full border border-[#e8ded8] bg-[#FBFDF6] px-2 py-1 text-[11px] font-bold text-slate-600">{skill}</span>)}</div>
          <p className="mt-2 text-xs font-bold text-slate-600"><CalendarDays className="mr-1 inline size-3.5 text-[#292F22]" />{freelancer.availability ? `${freelancer.availability.status.replaceAll('_', ' ')} · ${new Date(freelancer.availability.date).toLocaleDateString()}` : 'No upcoming availability record'}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className={BTN_GHOST} onClick={onView}><Eye className="size-3.5" /> View Profile</button>
        <button type="button" className={BTN_PRIMARY} disabled={interested || busy} onClick={onInterested}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}{interested ? 'Interested' : 'Interested'}</button>
      </div>
    </article>
  );
}

function ProfileDrawer({ freelancer, busy, onClose, onInterested }: { freelancer: FreelancerSearchResult; busy: boolean; onClose: () => void; onInterested: () => void }) {
  const { showToast } = useToast();
  const [details, setDetails] = useState<BackendFreelancer | null>(null);
  const [availability, setAvailability] = useState<FreelancerAvailabilityRecord[]>([]);
  const [portfolio, setPortfolio] = useState<FreelancerPortfolioRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      freelancersApi.get(freelancer.id),
      freelancersApi.availability(freelancer.id, { limit: 10 }),
      freelancersApi.portfolio(freelancer.id),
    ])
      .then(([profile, availabilityResponse, portfolioItems]) => {
        if (cancelled) return;
        setDetails(profile);
        setAvailability(availabilityResponse.data);
        setPortfolio(portfolioItems);
      })
      .catch((error) => {
        if (!cancelled) showToast(error instanceof ApiError ? error.message : 'Unable to load freelancer profile.', { variant: 'error' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [freelancer.id, showToast]);

  const profile = details;
  const name = profile?.fullName ?? freelancer.displayName;
  const skill = profile?.primarySkill ?? freelancer.specialization;
  const city = profile?.city ?? freelancer.city;
  const publishedPortfolio = portfolio.filter((item) => item.isPublished);
  const rate = Number(profile?.rate ?? 0);
  const availabilityRows = availability.length ? availability : freelancer.availability ? [freelancer.availability as FreelancerAvailabilityRecord] : [];

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-[#0B0C09]/60 p-3 backdrop-blur-sm">
      <aside className="h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="text-2xl font-black text-slate-900">{name}</h3><p className="text-sm font-bold text-[#292F22]">{roleLabel(skill)} · {city || 'Location not set'}</p></div>
          <button className={BTN_GHOST} onClick={onClose} aria-label="Close profile"><X className="size-4" /></button>
        </div>
        {loading ? <div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading full profile...</div> : (
          <div className="mt-5 grid gap-4">
            <section className="grid gap-3 rounded-2xl border border-[#eee7e2] bg-[#FBFDF6] p-4 sm:grid-cols-2">
              <InfoLine icon={<Phone className="size-4" />} label="Phone" value={profile?.phone || 'Not provided'} />
              <InfoLine icon={<Mail className="size-4" />} label="Email" value={profile?.email || 'Not provided'} />
              <InfoLine icon={<MapPin className="size-4" />} label="City" value={city || 'Not provided'} />
              <InfoLine icon={<IndianRupee className="size-4" />} label="Rate" value={rate ? `₹${rate.toLocaleString('en-IN')} · ${profile?.rateType?.replaceAll('_', ' ')}` : 'Not provided'} />
            </section>
            <section><h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Professional</h4><p className="mt-2 text-sm font-medium leading-6 text-slate-700">{profile?.experienceYears ?? freelancer.experienceYears ?? 0} years experience. Skills: {(profile?.skills?.length ? profile.skills : freelancer.skills).join(', ') || 'Not provided'}.</p>{profile?.equipmentNotes ? <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{profile.equipmentNotes}</p> : null}{profile?.notes ? <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#FBFDF6] p-3 text-sm font-medium leading-6 text-slate-700">{profile.notes}</p> : null}</section>
            <section><h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Portfolio</h4><div className="mt-2 grid gap-2">{publishedPortfolio.length ? publishedPortfolio.map((item) => <div key={item.id} className="rounded-xl border border-[#eee7e2] p-3 text-sm font-bold text-slate-700">{item.title}<span className="ml-2 text-xs font-medium text-slate-400">{item.category || item.fileObject?.originalName}</span>{item.description ? <p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p> : null}</div>) : <p className="text-sm font-medium text-slate-500">No published portfolio preview.</p>}</div></section>
            <section><h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Availability</h4><div className="mt-2 grid gap-2">{availabilityRows.length ? availabilityRows.map((item) => <div key={item.id} className="rounded-xl border border-[#eee7e2] p-3 text-sm font-bold text-slate-700">{item.status.replaceAll('_', ' ')} · {new Date(item.date).toLocaleDateString()} {item.notes ? <span className="font-medium text-slate-500">· {item.notes}</span> : null}</div>) : <p className="text-sm font-medium text-slate-500">No relevant availability record.</p>}</div></section>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2"><button className={BTN_PRIMARY} disabled={busy || Boolean(freelancer.connection)} onClick={onInterested}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} {freelancer.connection ? 'Interested' : 'Mark Interested'}</button></div>
      </aside>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-[#292F22]">{icon}</span><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="font-bold text-slate-800">{value}</p></div></div>;
}

function ConnectDialog({ connection, projects, onClose, onConnected }: { connection: FreelancerConnection; projects: Project[]; onClose: () => void; onConnected: (connection: FreelancerConnection) => void }) {
  const { showToast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [shootId, setShootId] = useState('');
  const [role, setRole] = useState<BackendCrewRole>('LEAD_PHOTOGRAPHER');
  const [saving, setSaving] = useState(false);
  const project = projects.find((item) => item.id === projectId);
  const shoots = project?.shoots || [];
  const requestingApproval = connection.status !== 'ACCEPTED';
  const submit = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const result = await freelancersApi.connect(connection.id, { projectId, shootId: shootId || undefined, role, notes: 'Connected from Find Freelancer workspace.' });
      onConnected(result.connection);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to connect freelancer.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-[#0B0C09]/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-slate-900">{requestingApproval ? 'Send Approval Request' : 'Connect Freelancer'}</h3>
        <p className="text-sm font-medium text-slate-500">{connection.freelancer?.fullName}</p>
        <p className="mt-2 rounded-xl bg-[#FBFDF6] px-3 py-2 text-xs font-bold text-slate-600">
          {requestingApproval ? 'This will appear in the freelancer panel for approval. Assignment will be locked until they accept.' : 'Freelancer has accepted. You can now connect them to this project or shoot.'}
        </p>
        <div className="mt-4 grid gap-3">
          <label><span className={LABEL}>Project</span><select className={FIELD} value={projectId} onChange={(event) => { setProjectId(event.target.value); setShootId(''); }}><option value="">Select project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.projectName || item.name || item.clientWeddingTitle}</option>)}</select></label>
          <label><span className={LABEL}>Shoot</span><select className={FIELD} value={shootId} onChange={(event) => setShootId(event.target.value)} disabled={!projectId}><option value="">Project connection only</option>{shoots.map((shoot) => <option key={shoot.id} value={shoot.id}>{shoot.title} · {shoot.date}</option>)}</select></label>
          <label><span className={LABEL}>Role</span><select className={FIELD} value={role} onChange={(event) => setRole(event.target.value as BackendCrewRole)}>{roles.map((item) => <option key={item} value={item}>{roleLabel(item)}</option>)}</select></label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className={BTN_GHOST} onClick={onClose}>Cancel</button><button className={BTN_PRIMARY} disabled={!projectId || saving} onClick={submit}>{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} {requestingApproval ? 'Send Request' : 'Confirm Connect'}</button></div>
      </section>
    </div>
  );
}

function Skeleton() {
  return <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className={`${CARD} h-36 animate-pulse bg-white p-4`} />)}</div>;
}

function Empty({ title, action }: { title: string; action?: () => void }) {
  return <section className={`${CARD} p-8 text-center`}><p className="font-black text-slate-900">{title}</p>{action ? <button className={`${BTN_GHOST} mt-3`} onClick={action}>Reset search</button> : null}</section>;
}
