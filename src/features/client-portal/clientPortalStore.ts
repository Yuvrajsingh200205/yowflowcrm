'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PaymentRecord, Project } from '@/types';
import { projectToClientUser } from './clientPortalSync';
import type {
  ClientComment,
  ClientNotification,
  ClientRequestItem,
  SharedGalleryLink,
} from './clientPortalTypes';

/**
 * Portal state for the real CRM projects. There are no demo couples here — a
 * gallery exists for a wedding because that wedding exists in the Client
 * Directory, and it is addressed by that project's id.
 *
 * The gallery has no backend tables wired up yet, so this record is the holding
 * place: the CRM tab and the gallery tab (a separate browser tab) read and write
 * it, and stay in step through the `storage` event. It is the single module that
 * swaps for the galleries API once that lands.
 */
const STORAGE_KEY = 'wpp_client_portal_v3';

/** What a couple has marked on a photograph, keyed by its gallery media id. */
export interface MediaFlags {
  isFavorite?: boolean;
  isSelectedForAlbum?: boolean;
}

export interface ClientPortalState {
  /**
   * Photographs themselves live in the galleries API — only the couple's own
   * marks are held here, because there is no endpoint for them yet.
   */
  mediaFlags: Record<string, MediaFlags>;
  comments: ClientComment[];
  sharedLinks: SharedGalleryLink[];
  requests: ClientRequestItem[];
  notifications: ClientNotification[];
  /**
   * Portal-safe copies of the CRM projects. The gallery tab renders payments and
   * delivery from these, so it needs no CRM API session of its own.
   */
  projects: Project[];
}

const EMPTY_STATE: ClientPortalState = {
  mediaFlags: {},
  comments: [],
  sharedLinks: [],
  requests: [],
  notifications: [],
  projects: [],
};

/**
 * Strips the base64-heavy fields before a project is persisted. Vault documents
 * and payment receipt scans can each be megabytes, which would blow the
 * localStorage quota, and the client portal never reads them.
 */
function toPortalProject(project: Project): Project {
  const { clientVaultDocuments: _vault, ...rest } = project;
  return {
    ...rest,
    payments: (project.payments || []).map(({ receiptScreenshot: _slip, ...payment }) => payment),
  };
}

function readState(): ClientPortalState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<ClientPortalState>) };
  } catch {
    // Corrupt or quota-blocked storage must not take the portal down.
    return null;
  }
}

function writeState(state: ClientPortalState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Over quota or storage disabled — the session stays usable in memory.
  }
}

/**
 * Refreshes the project snapshots the gallery tab reads, keeping everything the
 * couple has already marked. Photographs are not seeded — a gallery holds what
 * the studio uploaded for that wedding and nothing else.
 */
export function seedPortalState(projects: Project[], current: ClientPortalState | null): ClientPortalState {
  const base = current ?? EMPTY_STATE;
  return { ...base, projects: projects.map(toPortalProject) };
}

type Updater = (previous: ClientPortalState) => ClientPortalState;

/**
 * Shared portal state with cross-tab sync. `hydrated` stays false until the
 * first client-side read, so nothing renders from storage during SSR.
 */
function usePortalState() {
  const [state, setState] = useState<ClientPortalState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState() ?? EMPTY_STATE);
    setHydrated(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      setState(readState() ?? EMPTY_STATE);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const update = useCallback((updater: Updater) => {
    setState((previous) => {
      const next = updater(previous);
      writeState(next);
      return next;
    });
  }, []);

  const replace = useCallback((next: ClientPortalState) => {
    setState(next);
    writeState(next);
  }, []);

  return { state, hydrated, update, replace };
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Keeps the portal's galleries in step with the Client Directory. Mounted by the
 * directory itself, so opening a portal always finds the wedding prepared.
 */
export function useClientPortalSync(projects: Project[]) {
  const { hydrated, replace } = usePortalState();
  const projectsKey = useMemo(() => projects.map((p) => p.id).join('|'), [projects]);

  useEffect(() => {
    if (!hydrated || projects.length === 0) return;
    replace(seedPortalState(projects, readState()));
    // Seeding is keyed on the project set, not on each project object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, projectsKey, replace]);

  /**
   * Opens a wedding's gallery in a new tab, seeding from the projects held
   * right now rather than from React state. `hydrated` turns true a render
   * before the effect above runs, so a click in that gap used to hand the new
   * tab an empty state — and persist it, emptying galleries that already had
   * content. Building it here makes the click correct whenever it lands.
   */
  const openPortal = useCallback(
    (projectId: string) => {
      const next = seedPortalState(projects, readState());
      replace(next);
      window.open(clientGalleryPath(projectId), '_blank', 'noopener,noreferrer');
    },
    // Rebuilt when the project set changes, matching the seeding effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectsKey, replace],
  );

  return { hydrated, openPortal };
}

/**
 * One wedding's portal, addressed by its CRM project id. Returns the client view
 * of that project's gallery plus the actions the couple can take.
 */
export function useClientPortalGallery(projectId: string) {
  const { state, hydrated, update } = usePortalState();

  const project = state.projects.find((p) => p.id === projectId) ?? null;
  const client = useMemo(() => (project ? projectToClientUser(project) : null), [project]);

  const slice = useMemo(() => {
    const forProject = <T extends { projectId: string }>(rows: T[]) => rows.filter((r) => r.projectId === projectId);
    return {
      mediaFlags: state.mediaFlags,
      comments: forProject(state.comments),
      sharedLinks: forProject(state.sharedLinks),
      requests: forProject(state.requests),
      notifications: forProject(state.notifications),
    };
  }, [state, projectId]);

  const actions = useMemo(
    () => ({
      /** Persists a favourite or album pick for one photograph. */
      setMediaFlags: (mediaId: string, flags: MediaFlags) =>
        update((s) => ({ ...s, mediaFlags: { ...s.mediaFlags, [mediaId]: { ...s.mediaFlags[mediaId], ...flags } } })),

      addComment: (comment: Omit<ClientComment, 'id' | 'createdAt'>) =>
        update((s) => ({
          ...s,
          comments: [...s.comments, { ...comment, id: `comment-${Date.now()}`, createdAt: today() }],
        })),

      createShareLink: (link: Omit<SharedGalleryLink, 'id' | 'viewsCount' | 'downloadsCount' | 'createdAt'>) =>
        update((s) => ({
          ...s,
          sharedLinks: [
            ...s.sharedLinks,
            { ...link, id: `share-${Date.now()}`, viewsCount: 0, downloadsCount: 0, createdAt: today() },
          ],
        })),

      revokeShareLink: (linkId: string) =>
        update((s) => ({
          ...s,
          sharedLinks: s.sharedLinks.map((l) => (l.id === linkId ? { ...l, status: 'revoked' as const } : l)),
        })),

      createRequest: (request: Omit<ClientRequestItem, 'id' | 'createdAt' | 'updatedAt'>) =>
        update((s) => ({
          ...s,
          requests: [
            ...s.requests,
            { ...request, id: `request-${Date.now()}`, createdAt: today(), updatedAt: today() },
          ],
        })),

      /**
       * Records a client-side payment against the portal's project snapshot
       * only. Studio books are the CRM's source of truth, so this deliberately
       * does not post to the payments API — an accountant still confirms it.
       */
      makePayment: (amount: number, stageName: string) =>
        update((s) => ({
          ...s,
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            const advanceReceived = (p.advanceReceived || 0) + amount;
            const record: PaymentRecord = {
              id: `payment-${Date.now()}`,
              date: today(),
              amount,
              type: 'installment',
              paymentMode: 'UPI / GPay',
              receiptNumber: `PORTAL-${Date.now().toString().slice(-6)}`,
              notes: `Client portal payment — ${stageName}`,
            };
            return {
              ...p,
              advanceReceived,
              balanceDue: Math.max(0, (p.totalBudget || 0) - advanceReceived),
              payments: [...(p.payments || []), record],
              paymentSchedule: (p.paymentSchedule || []).map((stage) =>
                stage.stageName === stageName ? { ...stage, status: 'received' as const } : stage,
              ),
            };
          }),
        })),
    }),
    [update, projectId],
  );

  return { client, project, hydrated, ...slice, actions };
}

/** Route for one wedding's Luxury Client Gallery. */
export const clientGalleryPath = (projectId: string) => `/client-gallery/${encodeURIComponent(projectId)}`;

