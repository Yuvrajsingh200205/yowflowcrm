import { describe, expect, it } from 'vitest';
import type { Project } from '@/types';
import { seedPortalState } from './clientPortalStore';

const project = (over: Partial<Project> & { id: string }): Project => ({
  clientWeddingTitle: 'Rohan & Ananya Royal Wedding',
  clientContactMobile: '+91 98112 34567',
  venueLocation: 'Oberoi Udaivilas, Udaipur',
  primaryServiceType: 'Complete Wedding Services',
  weddingFunctionDates: '2026-10-15 to 2026-10-18',
  finalDeliveryDeadline: '2026-12-05',
  totalBudget: 450000,
  advanceReceived: 250000,
  balanceDue: 200000,
  specialNotesMusicPreferences: '',
  status: 'running',
  createdAt: '2026-07-10',
  videoPipeline: {
    preWeddingVideo: 'not_started',
    longVideo: 'not_started',
    teaser: 'not_started',
    highlights: 'not_started',
    reels: 'not_started',
    otherVideo: '',
  },
  photoPipeline: {
    preWeddingPhotos: 'not_started',
    cullingSelection: 'not_started',
    colorGradingRetouching: 'not_started',
    albumDesigning: 'not_started',
    albumPrinting: 'not_sent',
    otherPhoto: '',
  },
  shoots: [],
  dataBackup: {
    offloadedFromCards: false,
    hardDrive1: '',
    hardDrive1Done: false,
    hardDrive2: '',
    hardDrive2Done: false,
    cloudBackupDone: false,
    totalDataSizeGB: 0,
    rawCleanupStatus: 'not_cleaned',
  },
  payments: [],
  deliveryStatus: {
    rawHandoverDone: false,
    teaserLinkSent: false,
    fullFilmSent: false,
    reelsSent: false,
    highResPhotosSent: false,
    albumPrintedAndDelivered: false,
  },
  ...over,
});

describe('seedPortalState', () => {
  it('keeps a portal snapshot for every project in the directory', () => {
    const projects = [project({ id: 'p-1' }), project({ id: 'p-2' }), project({ id: 'p-3' })];

    const state = seedPortalState(projects, null);

    expect(state.projects.map((p) => p.id).sort()).toEqual(['p-1', 'p-2', 'p-3']);
  });

  it('does not invent photographs for a project', () => {
    // Galleries hold what the studio uploaded for that wedding and nothing
    // else — seeding demo media is what made every couple look identical.
    const state = seedPortalState([project({ id: 'p-1' })], null);

    expect(state).not.toHaveProperty('media');
    expect(state.mediaFlags).toEqual({});
  });

  it("keeps the couple's favourites across a re-seed", () => {
    const first = seedPortalState([project({ id: 'p-1' })], null);
    const edited = { ...first, mediaFlags: { 'media-1': { isFavorite: true } } };

    const second = seedPortalState([project({ id: 'p-1' })], edited);

    expect(second.mediaFlags['media-1']).toEqual({ isFavorite: true });
  });

  it('drops a project that is no longer in the directory', () => {
    const before = seedPortalState([project({ id: 'p-1' }), project({ id: 'p-2' })], null);

    const after = seedPortalState([project({ id: 'p-1' })], before);

    expect(after.projects.map((p) => p.id)).toEqual(['p-1']);
  });

  it('strips vault documents and receipt scans from the persisted project snapshot', () => {
    // These fields hold base64 blobs that would blow the localStorage quota,
    // and the client portal never reads them.
    const heavy = project({
      id: 'p-1',
      clientVaultDocuments: [
        {
          id: 'doc-1',
          name: 'Agreement.pdf',
          category: 'Contract / Agreement',
          fileUrl: 'data:application/pdf;base64,AAAA',
          fileType: 'pdf',
          uploadDate: '2026-07-11',
        },
      ],
      payments: [
        {
          id: 'pay-1',
          date: '2026-07-12',
          amount: 250000,
          type: 'advance',
          paymentMode: 'UPI / GPay',
          receiptNumber: 'RC-1',
          receiptScreenshot: 'data:image/png;base64,BBBB',
        },
      ],
    });

    const snapshot = seedPortalState([heavy], null).projects[0];

    expect(snapshot.clientVaultDocuments).toBeUndefined();
    expect(snapshot.payments[0].receiptScreenshot).toBeUndefined();
    expect(snapshot.payments[0].amount).toBe(250000);
  });
});
