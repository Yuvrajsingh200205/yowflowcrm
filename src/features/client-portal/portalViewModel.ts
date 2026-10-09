import type { EditingStatus, Project } from '@/types';

/**
 * Derives what the couple sees from the project the studio is actually working
 * on. Every value here used to be hardcoded in the portal, so a finished
 * wedding and a freshly booked one looked identical.
 */

export type StepState = 'done' | 'active' | 'pending';

export interface RoadmapStep {
  label: string;
  detail: string;
  status: StepState;
}

const DONE: EditingStatus[] = ['completed'];
const STARTED: EditingStatus[] = ['in_progress', 'client_review', 'revision', 'completed'];

const anyOf = (values: EditingStatus[], allowed: EditingStatus[]) => values.some((v) => allowed.includes(v));
const allOf = (values: EditingStatus[], allowed: EditingStatus[]) =>
  values.length > 0 && values.every((v) => allowed.includes(v));

/** `done` when everything finished, `active` once any of it has started. */
const stateFor = (values: EditingStatus[]): StepState =>
  allOf(values, DONE) ? 'done' : anyOf(values, STARTED) ? 'active' : 'pending';

export function buildRoadmap(project: Project): RoadmapStep[] {
  const shoots = project.shoots || [];
  const completedShoots = shoots.filter((s) => s.status === 'completed').length;
  const video = project.videoPipeline;
  const photo = project.photoPipeline;
  const delivery = project.deliveryStatus;

  const editing = stateFor([
    video.longVideo, video.teaser, video.highlights, video.reels,
    photo.colorGradingRetouching, photo.cullingSelection,
  ]);
  const album = stateFor([photo.albumDesigning]);
  const delivered =
    delivery.albumPrintedAndDelivered && delivery.highResPhotosSent && delivery.fullFilmSent;
  const partlyDelivered =
    delivery.rawHandoverDone || delivery.teaserLinkSent || delivery.fullFilmSent ||
    delivery.reelsSent || delivery.highResPhotosSent;

  return [
    {
      label: 'Booking',
      detail: project.advanceReceived > 0 ? 'Advance received' : 'Awaiting advance',
      status: project.advanceReceived > 0 ? 'done' : 'active',
    },
    {
      label: 'Planning',
      detail: shoots.length > 0 ? `${shoots.length} shoot${shoots.length === 1 ? '' : 's'} scheduled` : 'Being planned',
      status: shoots.length > 0 ? 'done' : 'active',
    },
    {
      label: 'Shoot',
      detail: shoots.length > 0 ? `${completedShoots} of ${shoots.length} complete` : 'Not scheduled',
      status: completedShoots === 0 ? 'pending' : completedShoots === shoots.length ? 'done' : 'active',
    },
    {
      label: 'Editing',
      detail: editing === 'done' ? 'Colour & cuts complete' : editing === 'active' ? 'Colour & cuts underway' : 'Not started',
      status: editing,
    },
    {
      label: 'Album Design',
      detail: album === 'done' ? 'Design approved' : album === 'active' ? 'In design' : 'Awaiting selection',
      status: album,
    },
    {
      label: 'Final Delivery',
      detail: delivered ? 'Delivered' : partlyDelivered ? 'Partly delivered' : 'Pending',
      status: delivered ? 'done' : partlyDelivered ? 'active' : 'pending',
    },
  ];
}

export interface DeliveryItem {
  label: string;
  description: string;
  done: boolean;
}

/** The studio's real delivery checklist, straight off the project. */
export function buildDeliveryChecklist(project: Project): DeliveryItem[] {
  const d = project.deliveryStatus;
  return [
    { label: 'Raw footage handover', description: 'Original camera files transferred', done: d.rawHandoverDone },
    { label: 'Teaser film', description: 'Short cinematic teaser shared', done: d.teaserLinkSent },
    { label: 'Full wedding film', description: 'Full-length film delivered', done: d.fullFilmSent },
    { label: 'Reels & shorts', description: 'Vertical cuts for social', done: d.reelsSent },
    { label: 'High-resolution photos', description: 'Edited photographs at full resolution', done: d.highResPhotosSent },
    { label: 'Printed album', description: 'Album printed and handed over', done: d.albumPrintedAndDelivered },
  ];
}

export const deliveryProgress = (items: DeliveryItem[]) =>
  items.length === 0 ? 0 : Math.round((items.filter((i) => i.done).length / items.length) * 100);
