'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import type { Project } from '@/types';
import { galleryApi, GALLERY_ACCEPT, type GalleryMediaDto } from '@/lib/api/gallery';
import { BTN_GHOST, BTN_PRIMARY, FIELD, LABEL } from '@/features/team/components/TeamUiKit';

interface GalleryUploadModalProps {
  project: Project;
  onClose: () => void;
}

/**
 * Studio-side photo management for one wedding. Every upload is recorded
 * against this project alone, which is what keeps one couple's gallery from
 * showing another couple's photographs.
 */
export const GalleryUploadModal: React.FC<GalleryUploadModalProps> = ({ project, onClose }) => {
  const [media, setMedia] = useState<GalleryMediaDto[]>([]);
  const [sectionName, setSectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMedia((await galleryApi.get(project.id)).media);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load this gallery.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const chosen = Array.from(files);
    const failures: string[] = [];

    for (const [index, file] of chosen.entries()) {
      setBusy(`Uploading ${index + 1} of ${chosen.length}…`);
      try {
        // Sequential rather than parallel: a wedding batch is large, and this
        // keeps the progress count honest and the connection from thrashing.
        const created = await galleryApi.upload(project.id, file, sectionName.trim() || undefined);
        setMedia((previous) => [...previous, created]);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      }
    }

    setBusy(null);
    if (fileInput.current) fileInput.current.value = '';
    if (failures.length) setError(failures.join(' '));
  };

  const handleRemove = async (mediaId: string) => {
    setBusy('Removing…');
    setError(null);
    try {
      await galleryApi.remove(project.id, mediaId);
      setMedia((previous) => previous.filter((m) => m.id !== mediaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove that file.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 backdrop-blur-xs sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#e2d9d3] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#eee7e2] bg-[#fbfaf8] px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-[#162421]">Gallery photos</h2>
            <p className="truncate text-xs font-bold text-slate-500">{project.clientWeddingTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className={LABEL} htmlFor="gallery-section">
                Ceremony / folder (optional)
              </label>
              <input
                id="gallery-section"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Haldi, Sangeet, Reception"
                className={FIELD}
              />
            </div>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(busy)} className={BTN_PRIMARY}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {busy ?? 'Choose photos'}
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={GALLERY_ACCEPT.join(',')}
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm font-bold text-slate-500">Loading gallery…</p>
          ) : media.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e2d9d3] px-6 py-12 text-center">
              <p className="text-sm font-extrabold text-[#162421]">No photos uploaded yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-slate-500">
                Photos you add here appear in this couple&apos;s portal only.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((item) => (
                <figure key={item.id} className="group relative overflow-hidden rounded-xl border border-[#e2d9d3] bg-slate-50">
                  {item.mediaType === 'VIDEO' ? (
                    <video src={item.url} className="aspect-square w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title} className="aspect-square w-full object-cover" />
                  )}
                  <figcaption className="truncate px-2 py-1.5 text-[10px] font-bold text-slate-600">
                    {item.sectionName}
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.id)}
                    disabled={Boolean(busy)}
                    title="Remove from gallery"
                    className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-red-600 opacity-0 shadow transition group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </figure>
              ))}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#eee7e2] bg-[#fbfaf8] px-6 py-3">
          <span className="text-xs font-bold text-slate-500">
            {media.length} {media.length === 1 ? 'file' : 'files'} in this gallery
          </span>
          <button type="button" onClick={onClose} className={BTN_GHOST}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};
