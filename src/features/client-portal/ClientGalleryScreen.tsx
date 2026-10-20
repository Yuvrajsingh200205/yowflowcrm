'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { galleryApi, type ProjectGalleryDto } from '@/lib/api/gallery';
import { ClientPortalDashboard } from './components/ClientPortalDashboard';
import { useClientPortalGallery } from './clientPortalStore';
import type { GalleryEvent, GalleryMediaItem } from './clientPortalTypes';

interface ClientGalleryScreenProps {
  projectId: string;
}

const Notice: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <main className="grid min-h-screen place-items-center bg-[#fffdfb] px-6">
    <div className="max-w-md space-y-3 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[linear-gradient(145deg,#2f5f54,#254b42)] font-serif text-lg font-bold text-white">
        W
      </span>
      <h1 className="font-serif text-2xl text-[#162421]">{title}</h1>
      <div className="text-sm font-medium text-slate-500">{children}</div>
    </div>
  </main>
);

/**
 * The Luxury Client Gallery for one wedding. Photographs come from that
 * project's gallery in the API, so a couple only ever sees what the studio
 * uploaded for them.
 */
export const ClientGalleryScreen: React.FC<ClientGalleryScreenProps> = ({ projectId }) => {
  const { client, project, hydrated, mediaFlags, comments, sharedLinks, requests, notifications, actions } =
    useClientPortalGallery(projectId);

  const [gallery, setGallery] = useState<ProjectGalleryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /**
   * Refetches the gallery. Deliberately leaves `loading` alone so an upload
   * refreshes the grid in place instead of blanking the whole portal.
   */
  const reload = useCallback(async () => {
    try {
      setGallery(await galleryApi.get(projectId));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [projectId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    galleryApi
      .get(projectId)
      .then((result) => active && setGallery(result))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [projectId]);

  // The portal's own shapes, built from the gallery the studio uploaded. A
  // section is a ceremony folder; the couple's favourites and album picks are
  // layered on from local state, since they have no endpoint yet.
  const events = useMemo<GalleryEvent[]>(() => {
    if (!gallery) return [];
    return gallery.sections
      .filter((section) => section.isVisibleToClient)
      .map((section) => {
        const inSection = gallery.media.filter((m) => m.sectionId === section.id);
        return {
          id: section.id,
          projectId,
          name: section.name,
          eventDate: project?.weddingFunctionDates || '',
          venue: project?.venueLocation || '',
          coverImage: inSection.find((m) => m.mediaType === 'IMAGE')?.url || '',
          status: 'Gallery Ready',
          photosCount: inSection.filter((m) => m.mediaType === 'IMAGE').length,
          videosCount: inSection.filter((m) => m.mediaType === 'VIDEO').length,
          reelsCount: 0,
          isVisibleToClient: section.isVisibleToClient,
          isDownloadAllowed: section.isDownloadAllowed,
          isShareAllowed: section.isDownloadAllowed,
          isFaceSearchAllowed: true,
          hasWatermark: section.hasWatermark,
        };
      });
  }, [gallery, project, projectId]);

  const media = useMemo<GalleryMediaItem[]>(() => {
    if (!gallery) return [];
    const visibleSections = new Set(events.map((e) => e.id));
    return gallery.media
      .filter((item) => item.isClientVisible && visibleSections.has(item.sectionId))
      .map((item) => ({
        id: item.id,
        projectId,
        eventId: item.sectionId,
        eventName: item.sectionName,
        title: item.title,
        mediaType: item.mediaType === 'VIDEO' ? 'video' : 'image',
        category: item.mediaType === 'VIDEO' ? 'Videos' : 'Photos',
        url: item.url,
        thumbnailUrl: item.url,
        uploadDate: item.createdAt.slice(0, 10),
        orientation: 'landscape',
        isClientVisible: item.isClientVisible,
        downloadAllowed: item.isDownloadAllowed,
        isFavorite: mediaFlags[item.id]?.isFavorite ?? false,
        isSelectedForAlbum: mediaFlags[item.id]?.isSelectedForAlbum ?? false,
      }));
  }, [gallery, events, mediaFlags, projectId]);

  // Closing is best-effort: a tab the studio opened from the CRM can close
  // itself, one reached by URL cannot, so fall back to the directory.
  const handleExit = useCallback(() => {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) window.location.href = '/clients';
    }, 150);
  }, []);

  const handleUpdateMedia = useCallback(
    (item: GalleryMediaItem) =>
      actions.setMediaFlags(item.id, {
        isFavorite: item.isFavorite,
        isSelectedForAlbum: item.isSelectedForAlbum,
      }),
    [actions],
  );

  if (!hydrated || loading) {
    return <Notice title="Opening your gallery…">One moment while we unlock your wedding collection.</Notice>;
  }

  if (!client || !project) {
    return (
      <Notice title="Gallery not available">
        <p>
          This gallery has not been prepared yet. Ask the studio to open it again from the{' '}
          <Link href="/clients" className="font-bold text-[#2f5f54] underline">
            Client Directory
          </Link>
          .
        </p>
      </Notice>
    );
  }

  if (failed) {
    return <Notice title="Gallery unavailable">We could not load this wedding&apos;s photographs. Please try again.</Notice>;
  }

  if (media.length === 0) {
    return (
      <Notice title="Your gallery is being prepared">
        <p>
          The studio has not published photographs for {client.clientNames} yet. They will appear here as soon as they
          are uploaded.
        </p>
      </Notice>
    );
  }

  // The hero uses this couple's own first photograph rather than stock art, so
  // no two galleries open on the same image.
  const currentClient = { ...client, coverPhotoUrl: media[0]?.url || client.coverPhotoUrl };

  return (
    <ClientPortalDashboard
      currentClient={currentClient}
      project={project}
      studio={gallery?.studio ?? null}
      gallerySections={gallery?.sections ?? []}
      albumTarget={gallery?.gallery?.albumSelectionTarget ?? 60}
      canUpload
      onGalleryChanged={reload}
      events={events}
      mediaItems={media}
      subFolders={[]}
      comments={comments}
      sharedLinks={sharedLinks}
      requests={requests}
      notifications={notifications}
      onLogoutClient={handleExit}
      onUpdateMediaItem={handleUpdateMedia}
      onAddComment={actions.addComment}
      onCreateShareLink={actions.createShareLink}
      onRevokeShareLink={actions.revokeShareLink}
      onCreateRequest={actions.createRequest}
      onMakePayment={actions.makePayment}
    />
  );
};
