import React, { useCallback, useEffect, useState } from 'react';
import { Freelancer } from '@/types';
import { CheckCircle2, ClipboardList, Copy, ExternalLink, UserPlus } from 'lucide-react';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { apiRequest, ApiError } from '@/lib/api/client';
import { Badge, BTN_DANGER, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState } from '@/features/team/components/TeamUiKit';

interface FreelancerApplicationsViewProps {
  freelancers?: Freelancer[];
  onOpenProfile?: (freelancer: Freelancer) => void;
  onSaveFreelancer?: (freelancer: Freelancer) => void;
  onAddFreelancerClick: () => void;
}

type Status = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'DRAFT';
interface Application {
  id: string; fullName: string; phone: string; email: string | null; city: string | null; primarySkill: string; experienceYears: number | null;
  expectedRate: string | null; portfolioUrl: string | null; notes: string | null; status: Status; submittedAt: string | null; rejectionReason: string | null; freelancerId: string | null;
}

const FILTERS: Array<{ id: Status | 'ALL'; label: string }> = [
  { id: 'SUBMITTED', label: 'New' }, { id: 'UNDER_REVIEW', label: 'In review' }, { id: 'APPROVED', label: 'Approved' }, { id: 'REJECTED', label: 'Rejected' },
];
const STATUS_LABEL: Record<Status, string> = { DRAFT: 'Draft', SUBMITTED: 'New', UNDER_REVIEW: 'In review', APPROVED: 'Approved', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' };
const STATUS_STYLE: Partial<Record<Status, string>> = {
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800', REJECTED: 'border-red-200 bg-red-50 text-red-700',
};
const skill = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

export const FreelancerApplicationsView: React.FC<FreelancerApplicationsViewProps> = ({ onAddFreelancerClick }) => {
  const { currentUser: user } = useAuthSession();
  const [copied, setCopied] = useState(false);
  const joinLink = user?.organization?.slug && typeof window !== 'undefined' ? `${window.location.origin}/freelancer/join?studio=${encodeURIComponent(user.organization.slug)}` : '';
  const copyJoinLink = async () => {
    try { await navigator.clipboard.writeText(joinLink); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt('Copy your join link:', joinLink); }
  };

  const [filter, setFilter] = useState<Status | 'ALL'>('SUBMITTED');
  const [items, setItems] = useState<Application[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [flash, setFlash] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const q = filter === 'ALL' ? '' : `&status=${filter}`;
      const res = await apiRequest<Application[]>(`/freelancers/applications?limit=100${q}`, { fresh: true });
      setItems(res.data);
    } catch (e) { setError(msg(e)); }
  }, [filter]);
  useEffect(() => { setItems(null); void load(); }, [load]);

  const review = async (a: Application, status: Status, extra: { rejectionReason?: string } = {}) => {
    setBusy(a.id); setFlash(null);
    try {
      await apiRequest(`/freelancers/applications/${a.id}/review`, { method: 'POST', body: JSON.stringify({ status, ...extra }) });
      setFlash({ tone: 'ok', text: status === 'APPROVED' ? `${a.fullName} is approved. They can now buy a plan and be found by your team.` : status === 'REJECTED' ? `${a.fullName}'s application was rejected.` : `${a.fullName} is now in review.` });
      setRejecting(null); setReason('');
      await load();
    } catch (e) { setFlash({ tone: 'bad', text: msg(e) }); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-4`}>
        <h2 className="text-base font-black text-slate-900">Applications</h2>
        <p className="text-xs font-medium text-slate-500">Review registrations before they join the active roster. Approved talent can buy a listing plan and appear in your freelancer search.</p>
        {joinLink && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
            <div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-[#1C2018]">Your freelancer join link</p><p className="truncate text-xs text-slate-600" data-testid="join-link">{joinLink}</p></div>
            <button type="button" onClick={copyJoinLink} className={BTN_GHOST}><Copy className="size-3.5" /> {copied ? 'Copied' : 'Copy link'}</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter applications">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`${BTN_GHOST} ${filter === f.id ? '!bg-[#1C2018] !text-white' : ''}`}>{f.label}</button>
        ))}
      </div>

      {flash && <p role={flash.tone === 'bad' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm font-bold ${flash.tone === 'bad' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{flash.text}</p>}
      {error && <div role="alert" className={`${CARD} p-4 text-sm font-bold text-red-700`}>{error} <button type="button" className="ml-2 underline" onClick={() => void load()}>Try again</button></div>}
      {!error && !items && <p className="text-sm font-bold text-slate-500" role="status">Loading applications…</p>}

      {items?.length === 0 && (
        <div className={CARD}>
          <EmptyState
            icon={ClipboardList}
            title={filter === 'SUBMITTED' ? 'No new applications' : 'Nothing here'}
            message="Share your join link with freelancers, or add someone yourself."
            action={<button type="button" onClick={onAddFreelancerClick} className={BTN_PRIMARY}><UserPlus className="size-3.5" /> Add Freelancer</button>}
          />
        </div>
      )}

      <div className="space-y-3">
        {items?.map((a) => (
          <article key={a.id} className={`${CARD} p-5`} aria-label={`Application from ${a.fullName}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900">{a.fullName}</p>
                <p className="text-xs font-medium text-slate-500">{skill(a.primarySkill)} · {a.city || 'City not given'}{a.experienceYears != null ? ` · ${a.experienceYears} yr` : ''}{a.expectedRate ? ` · ₹${Number(a.expectedRate).toLocaleString('en-IN')}/day` : ''}</p>
                <p className="text-xs font-medium text-slate-500">{a.phone}{a.email ? ` · ${a.email}` : ''}{a.submittedAt ? ` · applied ${new Date(a.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
                {a.portfolioUrl && <a href={a.portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#1C2018] underline">Portfolio <ExternalLink className="size-3" aria-hidden="true" /></a>}
                {a.notes && <p className="mt-2 max-w-2xl whitespace-pre-line text-xs text-slate-600">{a.notes}</p>}
                {a.status === 'REJECTED' && a.rejectionReason && <p className="mt-2 text-xs font-bold text-red-700">Reason: {a.rejectionReason}</p>}
              </div>
              <Badge className={STATUS_STYLE[a.status] ?? 'border-amber-200 bg-amber-50 text-amber-800'}>{a.status === 'APPROVED' && <CheckCircle2 className="size-3" aria-hidden="true" />}{STATUS_LABEL[a.status]}</Badge>
            </div>
            {(a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW') && (
              <div className="mt-4 flex flex-wrap gap-2">
                {a.status === 'SUBMITTED' && <button type="button" disabled={busy === a.id} onClick={() => review(a, 'UNDER_REVIEW')} className={BTN_GHOST}>Start review</button>}
                <button type="button" disabled={busy === a.id} onClick={() => review(a, 'APPROVED')} className={BTN_PRIMARY}>Approve</button>
                <button type="button" disabled={busy === a.id} onClick={() => setRejecting(rejecting === a.id ? null : a.id)} className={BTN_DANGER}>Reject</button>
              </div>
            )}
            {rejecting === a.id && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-bold text-slate-700" htmlFor={`rej-${a.id}`}>Reason (shown to the applicant)</label>
                <textarea id={`rej-${a.id}`} maxLength={500} className="w-full rounded-xl border border-[#ded5cf] bg-[#FBFDF6] p-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button type="button" disabled={busy === a.id || !reason.trim()} onClick={() => review(a, 'REJECTED', { rejectionReason: reason.trim() })} className={BTN_DANGER}>Confirm reject</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
