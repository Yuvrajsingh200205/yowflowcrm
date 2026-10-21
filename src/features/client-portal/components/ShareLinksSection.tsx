'use client';

import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Link2, Loader2, Lock, QrCode, Share2, Trash2, X } from 'lucide-react';
import {
  shareLinksApi,
  sharedGalleryPath,
  type CreateShareLinkInput,
  type GallerySectionDto,
  type ShareLinkDto,
} from '@/lib/api/gallery';
import { BTN_GHOST, BTN_PRIMARY, CARD, FIELD, LABEL } from '@/features/team/components/TeamUiKit';

interface ShareLinksSectionProps {
  projectId: string;
  sections: GallerySectionDto[];
}

const ACCESS_LABELS: Record<ShareLinkDto['accessType'], string> = {
  VIEW_ONLY: 'View only',
  VIEW_DOWNLOAD: 'View & download',
  SELECTED_ONLY: 'Selected photos',
  SECTION_ONLY: 'One ceremony',
  FULL_GALLERY: 'Full gallery',
};

/** Same origin as the portal, so the link works wherever this is deployed. */
const fullUrl = (token: string) =>
  typeof window === 'undefined' ? sharedGalleryPath(token) : `${window.location.origin}${sharedGalleryPath(token)}`;

export const ShareLinksSection: React.FC<ShareLinksSectionProps> = ({ projectId, sections }) => {
  const [links, setLinks] = useState<ShareLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qrFor, setQrFor] = useState<{ link: ShareLinkDto; dataUrl: string } | null>(null);

  const [form, setForm] = useState<CreateShareLinkInput & { expiresInDays: number; usePassword: boolean }>({
    title: 'Family & Friends',
    accessType: 'VIEW_ONLY',
    watermarkEnabled: true,
    expiresInDays: 30,
    usePassword: false,
    password: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLinks(await shareLinksApi.list(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load share links.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCopy = async (link: ShareLinkDto) => {
    try {
      await navigator.clipboard.writeText(fullUrl(link.token));
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setError('Could not copy the link. Select and copy it manually.');
    }
  };

  /** Rendered in the browser — the gallery URL never goes to a QR service. */
  const handleShowQr = async (link: ShareLinkDto) => {
    try {
      const dataUrl = await QRCode.toDataURL(fullUrl(link.token), {
        width: 480,
        margin: 2,
        color: { dark: '#1C2018', light: '#ffffff' },
      });
      setQrFor({ link, dataUrl });
    } catch {
      setError('Could not generate the QR code.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const expiresAt =
        form.expiresInDays > 0
          ? new Date(Date.now() + form.expiresInDays * 86_400_000).toISOString()
          : undefined;
      const created = await shareLinksApi.create(projectId, {
        title: form.title.trim(),
        accessType: form.accessType,
        sectionId: form.accessType === 'SECTION_ONLY' ? form.sectionId : undefined,
        password: form.usePassword && form.password ? form.password : undefined,
        watermarkEnabled: form.watermarkEnabled,
        expiresAt,
      });
      setLinks((previous) => [created, ...previous]);
      setShowCreate(false);
      setForm((f) => ({ ...f, title: 'Family & Friends', password: '', usePassword: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the link.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (link: ShareLinkDto) => {
    if (!window.confirm(`Revoke "${link.title}"? Anyone holding this link will lose access immediately.`)) return;
    setBusy(true);
    try {
      await shareLinksApi.revoke(projectId, link.id);
      setLinks((previous) => previous.map((l) => (l.id === link.id ? { ...l, status: 'REVOKED' } : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revoke the link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-serif text-slate-900">Shared Links &amp; QR</h2>
          <p className="text-xs text-slate-500">Share your gallery with family — revoke any link at any time</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className={BTN_PRIMARY}>
          <Share2 className="size-3.5" /> Create share link
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm font-bold text-slate-500">Loading share links…</p>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e2d9d3] bg-white px-6 py-12 text-center">
          <Link2 className="mx-auto size-6 text-slate-300" />
          <p className="mt-2 text-sm font-extrabold text-[#0F110C]">No share links yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-slate-500">
            Create one to let family view your photographs without signing in.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {links.map((link) => {
            const revoked = link.status !== 'ACTIVE';
            return (
              <article key={link.id} className={`${CARD} p-4 sm:p-5 space-y-3 ${revoked ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-[#0F110C]">{link.title}</h3>
                    <p className="text-[11px] font-bold text-slate-500">
                      {ACCESS_LABELS[link.accessType]}
                      {link.passwordProtected && ' • Password protected'}
                      {link.watermarkEnabled && ' • Watermarked'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      revoked ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {link.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[#e2d9d3] bg-[#FBFDF6] px-3 py-2">
                  {link.passwordProtected && <Lock className="size-3 shrink-0 text-slate-400" />}
                  <code className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{fullUrl(link.token)}</code>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    {link.viewsCount} view{link.viewsCount === 1 ? '' : 's'}
                    {link.expiresAt && ` • expires ${new Date(link.expiresAt).toLocaleDateString('en-IN')}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => void handleCopy(link)} disabled={revoked} className={BTN_GHOST}>
                      {copiedId === link.id ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      {copiedId === link.id ? 'Copied' : 'Copy'}
                    </button>
                    <button type="button" onClick={() => void handleShowQr(link)} disabled={revoked} className={BTN_GHOST}>
                      <QrCode className="size-3.5" /> QR
                    </button>
                    {!revoked && (
                      <button
                        type="button"
                        onClick={() => void handleRevoke(link)}
                        disabled={busy}
                        title="Revoke this link"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 backdrop-blur-xs sm:p-6" onClick={() => setShowCreate(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] space-y-4 overflow-y-auto rounded-3xl border border-[#e2d9d3] bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-extrabold text-[#0F110C]">Create share link</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>

            <div>
              <label className={LABEL} htmlFor="share-title">Link name</label>
              <input id="share-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={FIELD} />
            </div>

            <div>
              <label className={LABEL} htmlFor="share-access">Who can see what</label>
              <select
                id="share-access"
                value={form.accessType}
                onChange={(e) => setForm({ ...form, accessType: e.target.value as ShareLinkDto['accessType'] })}
                className={FIELD}
              >
                <option value="VIEW_ONLY">View only</option>
                <option value="VIEW_DOWNLOAD">View &amp; download</option>
                <option value="SECTION_ONLY">One ceremony only</option>
                <option value="FULL_GALLERY">Full gallery</option>
              </select>
            </div>

            {form.accessType === 'SECTION_ONLY' && (
              <div>
                <label className={LABEL} htmlFor="share-section">Ceremony</label>
                <select
                  id="share-section"
                  required
                  value={form.sectionId || ''}
                  onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  className={FIELD}
                >
                  <option value="">Choose a ceremony…</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={LABEL} htmlFor="share-expiry">Expires after (days, 0 = never)</label>
              <input
                id="share-expiry" type="number" min={0} max={365} value={form.expiresInDays}
                onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
                className={FIELD}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={form.usePassword} onChange={(e) => setForm({ ...form, usePassword: e.target.checked })} />
              Protect with a password
            </label>
            {form.usePassword && (
              <input
                type="text" required minLength={4} value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 4 characters" className={FIELD}
              />
            )}

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={form.watermarkEnabled} onChange={(e) => setForm({ ...form, watermarkEnabled: e.target.checked })} />
              Watermark shared photographs
            </label>

            <button type="submit" disabled={busy} className={`${BTN_PRIMARY} w-full`}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
              {busy ? 'Creating…' : 'Create link'}
            </button>
          </form>
        </div>
      )}

      {qrFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur-xs sm:p-6" onClick={() => setQrFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs space-y-4 rounded-3xl border border-[#e2d9d3] bg-white p-6 text-center shadow-2xl">
            <h3 className="truncate text-sm font-extrabold text-[#0F110C]">{qrFor.link.title}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrFor.dataUrl} alt={`QR code for ${qrFor.link.title}`} className="mx-auto w-full max-w-[14rem] rounded-xl border border-[#e2d9d3]" />
            <p className="break-all text-[10px] text-slate-500">{fullUrl(qrFor.link.token)}</p>
            <div className="flex gap-2">
              <a href={qrFor.dataUrl} download={`${qrFor.link.title.replace(/[^a-z0-9]+/gi, '-')}-qr.png`} className={`${BTN_PRIMARY} flex-1`}>
                Download PNG
              </a>
              <button type="button" onClick={() => setQrFor(null)} className={BTN_GHOST}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
