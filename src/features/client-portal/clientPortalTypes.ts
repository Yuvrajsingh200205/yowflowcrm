// ----------------------------------------------------
// CLIENT PORTAL & WEDDING GALLERY TYPES
// ----------------------------------------------------

export type ClientAuthMode = 'password' | 'otp' | 'magic_link' | 'google';

export interface ClientUser {
  id: string;
  projectId: string; // Connected directly to CRM Project
  clientNames: string; // e.g. "Rohan & Ananya" or "Rahul & Priya"
  primaryEmail: string;
  mobile: string;
  weddingDate: string;
  venue: string;
  coverPhotoUrl: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  isActive: boolean;
}

export type WeddingEventName = 
  | 'Engagement'
  | 'Haldi'
  | 'Mehndi'
  | 'Sangeet'
  | 'Cocktail'
  | 'Wedding'
  | 'Reception'
  | 'Pre-Wedding'
  | 'Couple Portraits'
  | 'Bride'
  | 'Groom'
  | 'Family'
  | 'Candid'
  | 'Traditional'
  | (string & {});

export type EventProductionStatus = 'Upcoming' | 'Shoot Completed' | 'Editing in Progress' | 'Preview Ready' | 'Gallery Ready' | 'Delivered';

export interface GalleryEvent {
  id: string;
  projectId: string;
  name: WeddingEventName;
  eventDate: string;
  venue: string;
  coverImage: string;
  status: EventProductionStatus;
  leadPhotographer?: string;
  cinematographer?: string;
  photosCount: number;
  videosCount: number;
  reelsCount: number;
  isVisibleToClient: boolean;
  isDownloadAllowed: boolean;
  isShareAllowed: boolean;
  isFaceSearchAllowed: boolean;
  hasWatermark: boolean;
  expectedDeliveryDate?: string;
  description?: string;
}

export interface GallerySubFolder {
  id: string;
  projectId: string;
  eventId: string; // Parent event ID e.g. 'event-wedding' or 'all'
  name: string; // e.g. "Bridal Getting Ready", "Candid Moments", "Varmala & Pheras"
  description?: string;
  coverImage?: string;
  itemCount?: number;
  createdAt: string;
  color?: string; // Optional accent color class or hex
  isClientVisible?: boolean;
  orderIndex?: number;
}

export type MediaCategory = 'Photos' | 'Videos' | 'Reels' | 'Highlights' | 'Documents';
export type MediaType = 'image' | 'video' | 'document';

export interface GalleryMediaItem {
  id: string;
  projectId: string;
  eventId: string;
  eventName: WeddingEventName;
  subFolderId?: string;
  subFolderName?: string;
  title: string;
  mediaType: MediaType;
  category: MediaCategory;
  url: string;
  thumbnailUrl: string;
  previewUrl?: string;
  highResUrl?: string;
  duration?: string; // for videos e.g. "3:45"
  fileSize?: string;
  width?: number;
  height?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  uploadDate: string;
  tags?: string[]; // e.g. ['Bride', 'Couple', 'Decor', 'Candid', 'Family']
  faceEmbeddings?: string[]; // simulated face descriptors for search
  isFavorite?: boolean;
  isSelectedForAlbum?: boolean;
  isClientVisible: boolean;
  downloadAllowed: boolean;
  photographerCredit?: string;
  viewCount?: number;
  downloadCount?: number;
  commentsCount?: number;
}

export interface ClientComment {
  id: string;
  projectId: string;
  mediaId: string;
  mediaTitle: string;
  mediaThumbnail: string;
  eventId: string;
  eventName: string;
  authorName: string;
  authorRole: 'client' | 'admin' | 'editor';
  commentText: string;
  type: 'general' | 'retouch_request' | 'album_cover' | 'remove_request';
  createdAt: string;
  isResolved?: boolean;
  adminReply?: string;
}

export interface SharedGalleryLink {
  id: string;
  projectId: string;
  token: string;
  title: string; // e.g. "Best Wedding Moments", "Family & Relatives"
  accessType: 'view_only' | 'view_download' | 'selected_only' | 'event_only' | 'full_gallery';
  selectedMediaIds?: string[];
  targetEventId?: string;
  targetEventName?: string;
  passwordProtected: boolean;
  password?: string;
  expiresAt?: string;
  watermarkEnabled: boolean;
  viewsCount: number;
  downloadsCount: number;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'expired' | 'revoked';
  qrCodeDataUrl?: string;
}

export interface ClientRequestItem {
  id: string;
  projectId: string;
  type: 'Photo Retouch' | 'Video Change' | 'Album Change' | 'Song Change' | 'Name Correction' | 'Delivery Request' | 'Other';
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Waiting for Client' | 'Completed' | 'Closed';
  relatedMediaTitle?: string;
  relatedMediaThumbnail?: string;
  assignedTeamMember?: string;
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
}

export interface ClientNotification {
  id: string;
  projectId: string;
  type: 'gallery_ready' | 'event_uploaded' | 'video_ready' | 'payment_due' | 'payment_received' | 'album_action' | 'request_update' | 'document_new' | 'general';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface FaceSearchResult {
  mediaId: string;
  media: GalleryMediaItem;
  similarityScore: number; // 0 to 100%
  eventName: string;
  matchType: 'Single' | 'Couple' | 'Group';
}
