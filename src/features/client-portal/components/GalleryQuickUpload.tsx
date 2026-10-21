'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Video } from 'lucide-react';
import { galleryApi } from '@/lib/api/gallery';

type UploadKind = 'photo' | 'video';

interface GalleryQuickUploadProps {
  projectId: string;
  kind: UploadKind;
  /** Ceremony the files land in; the API creates it on first use. */
  sectionName?: string;
  /** Refreshes the gallery so what was just uploaded appears. */
  onUploaded: () => void | Promise<void>;
}

/**
 * Upload straight from the Photos or Films tab. Each kind only accepts its own
 * file types, so a film can never be filed as a photograph — the API derives
 * mediaType and category from the MIME type it is given.
 */
const ACCEPT: Record<UploadKind, string> = {
  photo: 'image/jpeg,image/png,image/webp,image/avif',
  video: 'video/mp4,video/quicktime,video/webm',
};

const LABEL: Record<UploadKind, string> = { photo: 'Upload photos', video: 'Upload films' };

export const GalleryQuickUpload: React.FC<GalleryQuickUploadProps> = ({
  projectId,
  kind,
  sectionName,
  onUploaded,
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const chosen = Array.from(files);
    const failures: string[] = [];

    for (const [index, file] of chosen.entries()) {
      setProgress(`${index + 1} of ${chosen.length}`);
      try {
        await galleryApi.upload(projectId, file, sectionName);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      }
    }

    setProgress(null);
    if (input.current) input.current.value = '';
    if (failures.length) setError(failures.join(' '));
    // Refresh even after a partial failure, so whatever landed is visible.
    await onUploaded();
  };

  const Icon = kind === 'video' ? Video : ImagePlus;

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={Boolean(progress)}
        className="flex items-center gap-1.5 rounded-full border border-[#CCEB8E] bg-[#F4FBE6] px-3.5 py-1.5 text-xs font-semibold text-[#7a5a2e] shadow-xs transition-colors hover:bg-[#E9F6CF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
        <span>{progress ? `Uploading ${progress}…` : LABEL[kind]}</span>
      </button>
      {error && <p className="max-w-xs text-[11px] font-bold text-red-600">{error}</p>}
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
};
