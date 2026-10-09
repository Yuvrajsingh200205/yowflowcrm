import { apiRequest } from './client';

export const GALLERY_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

/** Matches the ceiling the API enforces on a single gallery upload. */
export const GALLERY_MAX_BYTES = 50 * 1024 * 1024;

export interface GallerySectionDto {
  id: string;
  name: string;
  orderIndex: number;
  isVisibleToClient: boolean;
  isDownloadAllowed: boolean;
  hasWatermark: boolean;
}

export interface GalleryMediaDto {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  category: string;
  orderIndex: number;
  isClientVisible: boolean;
  isDownloadAllowed: boolean;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  /** Short-lived signed URL — refetch the gallery rather than caching it. */
  url: string;
  createdAt: string;
}

export interface StudioContactDto {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface ProjectGalleryDto {
  /** Real studio contact details, so the concierge panel is not hardcoded. */
  studio: StudioContactDto | null;
  gallery: { id: string; title: string; status: string; albumSelectionTarget: number } | null;
  sections: GallerySectionDto[];
  media: GalleryMediaDto[];
}

interface UploadIntent {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
}

const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/gallery`;

function mimeTypeFromName(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase();
  return (
    ({
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      webm: 'video/webm',
    } as Record<string, string>)[extension || ''] || ''
  );
}

export const galleryApi = {
  async get(projectId: string): Promise<ProjectGalleryDto> {
    return (await apiRequest<ProjectGalleryDto>(path(projectId), { fresh: true })).data;
  },

  async remove(projectId: string, mediaId: string): Promise<void> {
    await apiRequest(`${path(projectId)}/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
  },

  /**
   * Uploads one photograph or film: ask for a signed URL, PUT the bytes straight
   * to storage, then record it against this wedding's gallery. The API process
   * never carries the file content.
   */
  async upload(projectId: string, file: File, sectionName?: string): Promise<GalleryMediaDto> {
    const mimeType = file.type || mimeTypeFromName(file.name);
    if (!GALLERY_ACCEPT.includes(mimeType as (typeof GALLERY_ACCEPT)[number])) {
      throw new Error(`${file.name}: only JPG, PNG, WEBP, AVIF, MP4, MOV and WEBM files are supported.`);
    }
    if (file.size <= 0 || file.size > GALLERY_MAX_BYTES) {
      throw new Error(`${file.name}: each file must be under 50MB.`);
    }

    const intent = (
      await apiRequest<UploadIntent>(`${path(projectId)}/upload-intent`, {
        method: 'POST',
        body: JSON.stringify({ originalName: file.name, mimeType }),
      })
    ).data;

    const response = await fetch(intent.uploadUrl, {
      method: 'PUT',
      headers: intent.requiredHeaders,
      body: file,
    });
    if (!response.ok) throw new Error(`${file.name}: upload failed. Please try again.`);

    return (
      await apiRequest<GalleryMediaDto>(`${path(projectId)}/media`, {
        method: 'POST',
        body: JSON.stringify({
          bucket: intent.bucket,
          objectKey: intent.objectKey,
          originalName: file.name,
          mimeType,
          sizeBytes: file.size,
          ...(sectionName ? { sectionName } : {}),
        }),
      })
    ).data;
  },
};

export interface ShareLinkDto {
  id: string;
  token: string;
  title: string;
  accessType: 'VIEW_ONLY' | 'VIEW_DOWNLOAD' | 'SELECTED_ONLY' | 'SECTION_ONLY' | 'FULL_GALLERY';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  watermarkEnabled: boolean;
  expiresAt: string | null;
  viewsCount: number;
  downloadsCount: number;
  passwordProtected: boolean;
  sectionId: string | null;
  selectedMediaIds: string[];
  createdAt: string;
}

export interface CreateShareLinkInput {
  title: string;
  accessType: ShareLinkDto['accessType'];
  sectionId?: string;
  mediaIds?: string[];
  password?: string;
  expiresAt?: string;
  watermarkEnabled?: boolean;
}

export interface SharedGalleryDto {
  title: string;
  galleryTitle: string;
  projectName: string;
  studioName: string;
  accessType: string;
  watermarkEnabled: boolean;
  downloadAllowed: boolean;
  media: GalleryMediaDto[];
}

/** The page a share token opens. Same origin, so the link is shareable as-is. */
export const sharedGalleryPath = (token: string) => `/share/${encodeURIComponent(token)}`;

export const shareLinksApi = {
  async list(projectId: string): Promise<ShareLinkDto[]> {
    return (await apiRequest<ShareLinkDto[]>(`${path(projectId)}/share-links`, { fresh: true })).data;
  },
  async create(projectId: string, input: CreateShareLinkInput): Promise<ShareLinkDto> {
    return (await apiRequest<ShareLinkDto>(`${path(projectId)}/share-links`, { method: 'POST', body: JSON.stringify(input) })).data;
  },
  async revoke(projectId: string, linkId: string): Promise<void> {
    await apiRequest(`${path(projectId)}/share-links/${encodeURIComponent(linkId)}`, { method: 'DELETE' });
  },
  /** Anonymous: the token in the URL is the credential. */
  async open(token: string, password?: string): Promise<SharedGalleryDto> {
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    return (await apiRequest<SharedGalleryDto>(`/shared-galleries/${encodeURIComponent(token)}${query}`, { fresh: true })).data;
  },
};
