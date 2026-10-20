'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Play, 
  Image as ImageIcon, 
  Video, 
  CreditCard, 
  Share2, 
  Camera, 
  FileText, 
  Download, 
  Search, 
  User, 
  LogOut, 
  Bell, 
  BookOpen, 
  Layers, 
  Flame, 
  Check, 
  Send,
  MessageSquare,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  Menu,
  X,
  FolderOpen,
  FolderPlus,
  SlidersHorizontal,
  Edit2,
  Trash2
} from 'lucide-react';

import { 
  ClientUser, 
  GalleryEvent, 
  GalleryMediaItem, 
  ClientComment, 
  SharedGalleryLink, 
  ClientRequestItem, 
  ClientNotification,
  GallerySubFolder 
} from '../clientPortalTypes';
import { Project } from '@/types';
import type { GallerySectionDto, StudioContactDto } from '@/lib/api/gallery';
import { buildDeliveryChecklist, buildRoadmap, deliveryProgress } from '../portalViewModel';

import { PhotoViewerModal } from './PhotoViewerModal';
import { FaceSearchSection } from './FaceSearchSection';
import { ClientPaymentsSection } from './ClientPaymentsSection';
import { ShareLinksSection } from './ShareLinksSection';
import { GalleryQuickUpload } from './GalleryQuickUpload';
import { SelectionWorkflow } from './SelectionWorkflow';
import { ClientRequestsSection } from './ClientRequestsSection';
import { SubFolderCreateModal } from './SubFolderCreateModal';
import { BRAND } from '@/config/brand';

const money = (amount: number) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

export type ClientNavTab = 
  | 'home'
  | 'events'
  | 'photos'
  | 'videos'
  | 'facesearch'
  | 'favorites'
  | 'selections'
  | 'payments'
  | 'documents'
  | 'requests'
  | 'shared'
  | 'delivery'
  | 'help';

interface ClientPortalDashboardProps {
  currentClient: ClientUser;
  project: Project;
  events: GalleryEvent[];
  mediaItems: GalleryMediaItem[];
  subFolders?: GallerySubFolder[];
  comments: ClientComment[];
  sharedLinks: SharedGalleryLink[];
  requests: ClientRequestItem[];
  notifications: ClientNotification[];
  /** Real studio contact details for the concierge panel. */
  studio?: StudioContactDto | null;
  /** Gallery sections, used when scoping a share link to one ceremony. */
  gallerySections?: GallerySectionDto[];
  /** Whether the viewer may add media. Studio only. */
  canUpload?: boolean;
  /** Reloads the gallery after an upload. */
  onGalleryChanged?: () => void | Promise<void>;
  /** How many photographs this couple must choose for their album. */
  albumTarget?: number;
  onLogoutClient: () => void;
  onUpdateMediaItem: (item: GalleryMediaItem) => void;
  onAddComment: (comment: Omit<ClientComment, 'id' | 'createdAt'>) => void;
  onCreateShareLink: (link: Omit<SharedGalleryLink, 'id' | 'viewsCount' | 'downloadsCount' | 'createdAt'>) => void;
  onRevokeShareLink: (linkId: string) => void;
  onCreateRequest: (request: Omit<ClientRequestItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onMakePayment: (amount: number, stageName: string) => void;
  onCreateSubFolder?: (subFolder: Omit<GallerySubFolder, 'id' | 'createdAt'>) => void;
  onUpdateSubFolder?: (subFolder: GallerySubFolder) => void;
  onDeleteSubFolder?: (subFolderId: string) => void;
  onMoveMediaToSubFolder?: (mediaId: string, subFolderId?: string, subFolderName?: string) => void;
}

export const ClientPortalDashboard: React.FC<ClientPortalDashboardProps> = ({
  currentClient,
  project,
  events,
  mediaItems,
  subFolders = [],
  comments,
  sharedLinks,
  requests,
  notifications,
  studio,
  gallerySections = [],
  canUpload = false,
  onGalleryChanged,
  albumTarget = 60,
  onLogoutClient,
  onUpdateMediaItem,
  onAddComment,
  onCreateShareLink,
  onRevokeShareLink,
  onCreateRequest,
  onMakePayment,
  onCreateSubFolder = () => {},
  onUpdateSubFolder = () => {},
  onDeleteSubFolder = () => {},
  onMoveMediaToSubFolder,
}) => {
  const [activeTab, setActiveTab] = useState<ClientNavTab>('home');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string | null>(null);
  const [selectedSubFolderFilter, setSelectedSubFolderFilter] = useState<string | null>(null);
  const [isSubFolderModalOpen, setIsSubFolderModalOpen] = useState<boolean>(false);
  const [editingSubFolder, setEditingSubFolder] = useState<GallerySubFolder | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Lightbox Modal state
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerCurrentIndex, setViewerCurrentIndex] = useState<number>(0);
  const [viewerItems, setViewerItems] = useState<GalleryMediaItem[]>([]);

  // Filtered media by active event
  const visibleMedia = mediaItems.filter((m) => m.isClientVisible);
  const photosList = visibleMedia.filter((m) => m.mediaType === 'image');
  const videosList = visibleMedia.filter((m) => m.mediaType === 'video');

  const selectedForAlbumCount = visibleMedia.filter((m) => m.isSelectedForAlbum).length;
  const favoritesCount = visibleMedia.filter((m) => m.isFavorite).length;

  const openViewerForItems = (items: GalleryMediaItem[], initialIndex: number) => {
    setViewerItems(items);
    setViewerCurrentIndex(initialIndex);
    setIsViewerOpen(true);
  };

  const handleToggleFavorite = (item: GalleryMediaItem) => {
    const updated = { ...item, isFavorite: !item.isFavorite };
    onUpdateMediaItem(updated);
  };

  const handleToggleAlbumSelect = (item: GalleryMediaItem) => {
    const updated = { ...item, isSelectedForAlbum: !item.isSelectedForAlbum };
    onUpdateMediaItem(updated);
  };

  const handleSelectEventFolder = (eventId: string) => {
    setSelectedEventFilter(eventId);
    setActiveTab('events');
  };

  const totalPhotosCount = photosList.length;
  const totalVideosCount = videosList.length;

  const roadmap = buildRoadmap(project);
  const deliveryItems = buildDeliveryChecklist(project);
  const deliveredPercent = deliveryProgress(deliveryItems);

  // Shared by the desktop sidebar and the mobile drawer so the two can never
  // drift apart again.
  const navItems: Array<{ id: ClientNavTab; label: string; icon: typeof Sparkles; highlight?: boolean }> = [
              { id: 'home' as ClientNavTab, label: 'Journey Home', icon: Sparkles },
              { id: 'events' as ClientNavTab, label: 'Wedding Events', icon: Calendar },
              { id: 'photos' as ClientNavTab, label: 'Photo Gallery', icon: ImageIcon },
              { id: 'videos' as ClientNavTab, label: 'Films & Reels', icon: Video },
              { id: 'facesearch' as ClientNavTab, label: 'Face Finder', icon: Camera, highlight: true },
              { id: 'favorites' as ClientNavTab, label: `My Favorites (${favoritesCount})`, icon: Heart },
              { id: 'selections' as ClientNavTab, label: `Album Selection (${selectedForAlbumCount}/${albumTarget})`, icon: BookOpen },
              { id: 'payments' as ClientNavTab, label: 'Payments & Invoices', icon: CreditCard },
              { id: 'shared' as ClientNavTab, label: 'Shared Links & QR', icon: Share2 },
              { id: 'requests' as ClientNavTab, label: 'Request Center', icon: MessageSquare },
              { id: 'delivery' as ClientNavTab, label: 'Final Delivery', icon: Truck },
              { id: 'help' as ClientNavTab, label: 'Studio Concierge', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#fffdfb] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Luxury Client Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2d9d3] shadow-xs">
        <div className="h-1 bg-[linear-gradient(90deg,#ddc89c_0%,#8f3655_48%,#6d2f45_100%)]" />
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6 xl:px-10 py-3 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-8 h-8 shrink-0 rounded-full bg-[linear-gradient(145deg,#2f5f54,#254b42)] flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm">
              W
            </div>
            <div className="min-w-0">
              <span className="font-serif text-base sm:text-lg tracking-wide text-slate-900 block truncate leading-tight font-medium">
                {BRAND.name}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-800 block truncate">
                Luxury Client Gallery
              </span>
            </div>
          </div>
        </div>

        {/* Right side shortcuts & User Profile */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.some((n) => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e2d9d3] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h4 className="font-serif text-sm text-slate-900 font-semibold">Updates & Timeline</h4>
                  <span className="text-[11px] text-slate-400">{notifications.length} recent</span>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-[#e8ddd7] transition-colors text-xs space-y-1 cursor-pointer"
                      onClick={() => {
                        setShowNotificationsDropdown(false);
                        if (notif.actionUrl === '#events') setActiveTab('events');
                        if (notif.actionUrl === '#videos') setActiveTab('videos');
                        if (notif.actionUrl === '#selections') setActiveTab('selections');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                      </div>
                      <p className="text-slate-600 leading-snug">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client badge */}
          <div className="hidden min-w-0 sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="min-w-0 text-left">
              <span className="text-xs font-semibold text-slate-900 block truncate leading-tight">
                {currentClient.clientNames}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {currentClient.weddingDate}
              </span>
            </div>
          </div>

          {/* Logout / Switch back button */}
          <button
            onClick={onLogoutClient}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center gap-1.5"
            title="Log out or Return to Studio CRM"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Exit Portal</span>
          </button>
        </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-10 py-4 sm:py-6 gap-4 lg:gap-6 xl:gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 space-y-6">
          {/* Main Navigation links */}
          <nav className="bg-white rounded-2xl p-3 border border-[#e2d9d3] shadow-xs space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'events') setSelectedEventFilter(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-[#254b42] text-white font-semibold shadow-xs' 
                      : item.highlight 
                        ? 'text-amber-800 hover:bg-amber-50/80 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ddc89c]' : item.highlight ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Relationship Manager Card */}
          <div className="bg-gradient-to-br from-[#254b42] to-[#19332d] rounded-2xl p-4 text-white space-y-3 shadow-sm border border-[#2f5f54]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold">
                {(studio?.name || 'Studio').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-amber-200 block truncate">{studio?.name || 'Your studio'}</span>
                <span className="text-[10px] text-slate-400 block">Your wedding team</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-light">
              Need immediate assistance or live shoot updates? Connect on WhatsApp.
            </p>
            {/* Hidden rather than linking nowhere when no number is published. */}
            {studio?.phone && (
              <a
                href={`https://wa.me/${studio.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-center rounded-xl text-xs font-medium text-white transition-colors shadow-xs"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex">
            <div className="w-[min(18rem,85vw)] bg-white h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="font-serif text-lg font-bold text-slate-900">Navigation</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                        activeTab === item.id ? 'bg-[#254b42] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={onLogoutClient}
                className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Exit Client Portal
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* ======================================================== */}
          {/* TAB 1: HOME DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Cinematic Hero Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl text-white bg-[#111f1c] min-h-[360px] flex flex-col justify-end p-6 sm:p-10 border border-[#19332d]">
                <img 
                  src={currentClient.coverPhotoUrl} 
                  alt="Wedding Cover" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111f1c] via-[#111f1c]/40 to-transparent" />

                <div className="relative z-10 space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Your Wedding Journey
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-white">
                    Welcome, {currentClient.clientNames}
                  </h1>
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#ddc89c]" />
                      {currentClient.weddingDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#ddc89c]" />
                      {currentClient.venue}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                      Editing & Preview Phase
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Project Progress Timeline */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-xs space-y-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-serif text-slate-900">Project Production Roadmap</h3>
                  <span className="text-xs text-slate-500">
                    Expected Master Delivery: <strong>{project.finalDeliveryDeadline || 'To be confirmed'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {roadmap.map((step, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-xl border text-center space-y-1.5 transition-all ${
                        step.status === 'done' 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                          : step.status === 'active'
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {step.status === 'done' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : step.status === 'active' ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold animate-pulse">
                            ●
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-xs text-slate-900">{step.label}</div>
                      <div className="text-[10px] text-slate-500">{step.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Interactive Feature Highlights Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Event Gallery card */}
                <div 
                  onClick={() => setActiveTab('events')}
                  className="bg-white rounded-2xl p-5 border border-[#e2d9d3] shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-xl bg-amber-50 text-amber-800">
                      <ImageIcon className="w-5 h-5" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-base text-slate-900">Your Memories</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{events.length} Events • {totalPhotosCount} Photos • {totalVideosCount} Films</p>
                  </div>
                </div>

                {/* Face Finder AI card */}
                <div 
                  onClick={() => setActiveTab('facesearch')}
                  className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-xl bg-amber-500/40 text-amber-100">
                      <Camera className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      Find Photos
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-base text-white">Face Search AI</h4>
                    <p className="text-xs text-amber-100 mt-0.5">Upload a selfie to find all your candid moments</p>
                  </div>
                </div>

                {/* Album Selection card */}
                <div 
                  onClick={() => setActiveTab('selections')}
                  className="bg-white rounded-2xl p-5 border border-[#e2d9d3] shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      {selectedForAlbumCount} / {albumTarget}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-base text-slate-900">Album Selection</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Pick {albumTarget} photos for your album</p>
                  </div>
                </div>

                {/* Payments Overview Card */}
                <div 
                  onClick={() => setActiveTab('payments')}
                  className="bg-white rounded-2xl p-5 border border-[#e2d9d3] shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                      <CreditCard className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">{money(project.advanceReceived)} Paid</span>
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-base text-slate-900">Payment Status</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.balanceDue > 0
                        ? `${money(project.balanceDue)} remaining on shoot & delivery`
                        : 'Fully settled — thank you!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Wise Gallery Overview Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-serif text-slate-900">Wedding Functions & Events</h3>
                    <p className="text-xs text-slate-500">Explore ceremony photo folders and high-definition cinematic films</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('events')}
                    className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1"
                  >
                    View All Events <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      onClick={() => handleSelectEventFolder(event.id)}
                      className="group bg-white rounded-2xl overflow-hidden border border-[#e2d9d3] shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden bg-[#254b42] relative">
                        <img 
                          src={event.coverImage} 
                          alt={event.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#111f1c]/80 backdrop-blur text-white text-[11px] font-medium border border-white/20">
                          {event.status}
                        </span>
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#111f1c]/80 backdrop-blur text-amber-300 text-[11px] font-medium">
                          {event.photosCount} Photos • {event.videosCount} Films
                        </span>
                      </div>

                      <div className="p-4 pt-1 space-y-1">
                        <h4 className="font-serif text-lg text-slate-900 font-medium group-hover:text-amber-800 transition-colors">
                          {event.name} Ceremony
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{event.eventDate}</span>
                          <span>•</span>
                          <span className="truncate">{event.venue}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: WEDDING EVENTS GALLERY */}
          {/* ======================================================== */}
          {activeTab === 'events' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-serif text-slate-900">Event-Wise Gallery</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Switch between individual wedding ceremonies and function folders
                  </p>
                </div>

                {/* Event folder pills & Add SubFolder action */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedEventFilter(null);
                      setSelectedSubFolderFilter(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedEventFilter === null ? 'bg-[#254b42] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Events ({visibleMedia.length})
                  </button>
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedEventFilter(ev.id);
                        setSelectedSubFolderFilter(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedEventFilter === ev.id ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {ev.name}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setEditingSubFolder(null);
                      setIsSubFolderModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>+ New Sub-Folder</span>
                  </button>
                </div>
              </div>

              {/* Sub-Folders Section for Active Event */}
              {(() => {
                const currentSubFolders = subFolders.filter(
                  (sf) => sf.projectId === currentClient.projectId && 
                  (!selectedEventFilter || sf.eventId === selectedEventFilter)
                );

                if (currentSubFolders.length === 0) return null;

                return (
                  <div className="bg-slate-50/90 rounded-2xl p-4 border border-[#e2d9d3] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <FolderOpen className="w-4 h-4 text-amber-700" />
                        <span>Ceremony Sub-Folders ({currentSubFolders.length})</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Click on any folder to view only that category
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3">
                      {/* All Photos pill */}
                      <button
                        onClick={() => setSelectedSubFolderFilter(null)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          selectedSubFolderFilter === null
                            ? 'bg-[#254b42] text-white border-[#254b42] shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <FolderOpen className="w-4 h-4" />
                          <span className="text-[10px] font-mono opacity-80">
                            {visibleMedia.filter(m => !selectedEventFilter || m.eventId === selectedEventFilter).length}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-xs truncate">All Media</div>
                          <div className="text-[10px] opacity-70">Complete Feed</div>
                        </div>
                      </button>

                      {/* Sub-Folder Cards */}
                      {currentSubFolders.map((sf) => {
                        const count = visibleMedia.filter((m) => m.subFolderId === sf.id).length;
                        const isSelected = selectedSubFolderFilter === sf.id;
                        return (
                          <div
                            key={sf.id}
                            onClick={() => setSelectedSubFolderFilter(isSelected ? null : sf.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="p-1 rounded bg-slate-100/30 text-xs">📁</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/50">
                                {count || sf.itemCount || 0}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="font-semibold text-xs truncate" title={sf.name}>
                                {sf.name}
                              </div>
                              <div className="text-[10px] opacity-75 truncate">
                                {sf.description || 'Ceremony folder'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Event media grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
                {(visibleMedia.filter((m) => {
                  if (selectedEventFilter && m.eventId !== selectedEventFilter) return false;
                  if (selectedSubFolderFilter && m.subFolderId !== selectedSubFolderFilter) return false;
                  return true;
                })).map((item, idx, arr) => (
                  <div 
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-[#e2d9d3] shadow-xs hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openViewerForItems(arr, idx)}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#254b42] relative">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.mediaType === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                          <div className="p-3 rounded-full bg-[#111f1c]/70 backdrop-blur">
                            <Play className="w-5 h-5 fill-current text-[#ddc89c]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top Action Icons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur transition-all ${
                          item.isFavorite ? 'bg-rose-500 text-white' : 'bg-[#111f1c]/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAlbumSelect(item);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur transition-all ${
                          item.isSelectedForAlbum ? 'bg-emerald-600 text-white' : 'bg-[#111f1c]/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                        title="Add to Album"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-800 truncate">
                          {item.eventName}
                        </span>
                        {item.subFolderName && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 truncate max-w-[110px]">
                            {item.subFolderName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-slate-900 truncate">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PHOTOS */}
          {/* ======================================================== */}
          {activeTab === 'photos' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-serif text-slate-900">High-Resolution Photos</h2>
                  <p className="text-xs text-slate-500">
                    {photosList.length} photos categorized across {events.length} events and sub-folders
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {canUpload && onGalleryChanged && (
                    <GalleryQuickUpload
                      projectId={currentClient.projectId}
                      kind="photo"
                      sectionName={selectedEventFilter ? events.find((e) => e.id === selectedEventFilter)?.name : undefined}
                      onUploaded={onGalleryChanged}
                    />
                  )}
                  <button
                    onClick={() => {
                      setEditingSubFolder(null);
                      setIsSubFolderModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>+ New Sub-Folder</span>
                  </button>
                </div>
              </div>

              {/* Sub-Folders Carousel / Bar in Photos Tab */}
              {(() => {
                const currentSubFolders = subFolders.filter(
                  (sf) => sf.projectId === currentClient.projectId
                );

                if (currentSubFolders.length === 0) return null;

                return (
                  <div className="bg-slate-50/90 rounded-2xl p-4 border border-[#e2d9d3] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <FolderOpen className="w-4 h-4 text-amber-700" />
                        <span>Filter by Sub-Folder Category ({currentSubFolders.length})</span>
                      </div>
                      {selectedSubFolderFilter && (
                        <button
                          onClick={() => setSelectedSubFolderFilter(null)}
                          className="text-[11px] font-semibold text-amber-800 hover:underline"
                        >
                          Clear Folder Filter (Show All)
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3">
                      <button
                        onClick={() => setSelectedSubFolderFilter(null)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          selectedSubFolderFilter === null
                            ? 'bg-[#254b42] text-white border-[#254b42] shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <FolderOpen className="w-4 h-4" />
                          <span className="text-[10px] font-mono opacity-80">{photosList.length}</span>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-xs truncate">All Photos</div>
                          <div className="text-[10px] opacity-70">Entire Gallery</div>
                        </div>
                      </button>

                      {currentSubFolders.map((sf) => {
                        const count = photosList.filter((m) => m.subFolderId === sf.id).length;
                        const isSelected = selectedSubFolderFilter === sf.id;
                        return (
                          <div
                            key={sf.id}
                            onClick={() => setSelectedSubFolderFilter(isSelected ? null : sf.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs">📁</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/50">
                                {count || sf.itemCount || 0}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="font-semibold text-xs truncate" title={sf.name}>
                                {sf.name}
                              </div>
                              <div className="text-[10px] opacity-75 truncate">
                                {sf.eventId.replace('event-', '').toUpperCase()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
                {(selectedSubFolderFilter 
                  ? photosList.filter((m) => m.subFolderId === selectedSubFolderFilter)
                  : photosList
                ).map((item, idx, arr) => (
                  <div 
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-[#e2d9d3] shadow-xs hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openViewerForItems(arr, idx)}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#254b42]">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Top Action Icons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur transition-all ${
                          item.isFavorite ? 'bg-rose-500 text-white' : 'bg-[#111f1c]/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAlbumSelect(item);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur transition-all ${
                          item.isSelectedForAlbum ? 'bg-emerald-600 text-white' : 'bg-[#111f1c]/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                        title="Add to Album"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 truncate">
                          {item.eventName}
                        </span>
                        {item.subFolderName && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 truncate max-w-[110px]">
                            {item.subFolderName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-slate-900 truncate">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FILMS & REELS */}
          {/* ======================================================== */}
          {activeTab === 'videos' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-serif text-slate-900">Cinematic Films &amp; Instagram Reels</h2>
                  <p className="text-xs text-slate-500">
                    {videosList.length} film{videosList.length === 1 ? '' : 's'} — master cuts, teasers, highlights and reels
                  </p>
                </div>
                {canUpload && onGalleryChanged && (
                  <GalleryQuickUpload projectId={currentClient.projectId} kind="video" onUploaded={onGalleryChanged} />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {videosList.map((vid, idx) => (
                  <div 
                    key={vid.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#e2d9d3] shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    onClick={() => openViewerForItems(videosList, idx)}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-[#111f1c] relative">
                      <img 
                        src={vid.thumbnailUrl} 
                        alt={vid.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-4 rounded-full bg-amber-500 text-slate-950 shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                      <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-[#111f1c]/80 text-white font-mono text-xs">
                        {vid.duration || '03:45'}
                      </span>
                    </div>

                    <div className="p-4 pt-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                          {vid.eventName} • {vid.category}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{vid.fileSize}</span>
                      </div>
                      <h4 className="font-serif text-base text-slate-900 font-medium group-hover:text-amber-800 transition-colors">
                        {vid.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: FACE SEARCH */}
          {/* ======================================================== */}
          {activeTab === 'facesearch' && (
            <FaceSearchSection 
              galleryMedia={visibleMedia}
              clientName={currentClient.clientNames}
              onOpenMedia={(item) => {
                const idx = visibleMedia.findIndex((m) => m.id === item.id);
                openViewerForItems(visibleMedia, idx >= 0 ? idx : 0);
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 6 & 7: FAVORITES & SELECTIONS */}
          {/* ======================================================== */}
          {(activeTab === 'favorites' || activeTab === 'selections') && (
            <SelectionWorkflow 
              mediaItems={visibleMedia}
              maxAlbumPhotos={60}
              onOpenMedia={(item) => {
                const idx = visibleMedia.findIndex((m) => m.id === item.id);
                openViewerForItems(visibleMedia, idx >= 0 ? idx : 0);
              }}
              onToggleAlbumSelect={handleToggleAlbumSelect}
              onToggleFavorite={handleToggleFavorite}
              onSubmitSelection={(count) => {
                // Submit selection to CRM
                alert(`Selection of ${count} photos successfully sent to Studio Album Team!`);
              }}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 8: PAYMENTS */}
          {/* ======================================================== */}
          {activeTab === 'payments' && (
            <ClientPaymentsSection 
              project={project}
              onMakePayment={onMakePayment}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 9: SHARED GALLERIES & QR */}
          {/* ======================================================== */}
          {activeTab === 'shared' && (
            <ShareLinksSection projectId={currentClient.projectId} sections={gallerySections} />
          )}

          {/* ======================================================== */}
          {/* TAB 10: REQUEST CENTER */}
          {/* ======================================================== */}
          {activeTab === 'requests' && (
            <ClientRequestsSection 
              requests={requests}
              projectId={currentClient.projectId}
              clientName={currentClient.clientNames}
              onCreateRequest={onCreateRequest}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 11: FINAL DELIVERY */}
          {/* ======================================================== */}
          {activeTab === 'delivery' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#e2d9d3] shadow-xs space-y-6 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                  <Truck className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif text-slate-900">
                    Your Final Wedding Delivery Hub
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Once all editing and proof approvals are finalized, your master cloud vault link and physical wooden USB drive tracking will appear here.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>{deliveredPercent}% delivered</span>
                    <span className="text-slate-500">
                      {deliveryItems.filter((i) => i.done).length} of {deliveryItems.length} items
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${deliveredPercent}%` }} />
                  </div>
                </div>

                {/* Each row reflects what the studio has actually handed over. */}
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-left">
                  {deliveryItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3.5">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${
                          item.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {item.done ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-slate-900">{item.label}</span>
                        <span className="block truncate text-[11px] text-slate-500">{item.description}</span>
                      </span>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${item.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {item.done ? 'Delivered' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 font-medium text-slate-800">
                    <span>Expected delivery</span>
                    <span className="text-amber-800 font-semibold">
                      {project.deliveryStatus.finalDeliveryDate || project.finalDeliveryDeadline || 'To be confirmed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-medium text-slate-800">
                    <span>Photographs ready</span>
                    <span className="text-slate-600">{totalPhotosCount} photos • {totalVideosCount} films</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('photos')}
                  disabled={totalPhotosCount === 0}
                  className="px-6 py-3 bg-[#254b42] hover:bg-[#2f5f54] disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {totalPhotosCount === 0 ? 'Nothing to download yet' : 'Open your photographs'}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 12: STUDIO CONCIERGE & HELP */}
          {/* ======================================================== */}
          {activeTab === 'help' && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-xs space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif text-slate-900">Studio Support & Concierge</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Have questions about songs, album sizes, or delivery schedules? Our team is always here for you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <a
                    href={studio?.phone ? `https://wa.me/${studio.phone.replace(/[^0-9]/g, '')}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 transition-colors flex items-center gap-4 ${
                      studio?.phone ? 'hover:bg-emerald-50' : 'pointer-events-none opacity-60'
                    }`}
                  >
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">WhatsApp &amp; Direct Call</h4>
                      <p className="truncate text-xs text-slate-500">{studio?.phone || 'Contact number not published yet'}</p>
                    </div>
                  </a>

                  <a
                    href={studio?.email ? `mailto:${studio.email}` : undefined}
                    className={`p-5 rounded-2xl border border-slate-200 bg-slate-50/50 transition-colors flex items-center gap-4 ${
                      studio?.email ? 'hover:bg-slate-100' : 'pointer-events-none opacity-60'
                    }`}
                  >
                    <div className="p-3 bg-[#254b42] text-white rounded-xl shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">Email {studio?.name || 'Studio Support'}</h4>
                      <p className="truncate text-xs text-slate-500">{studio?.email || 'Email not published yet'}</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lightbox / Cinematic Photo Viewer Modal */}
      <PhotoViewerModal 
        isOpen={isViewerOpen}
        items={viewerItems}
        currentIndex={viewerCurrentIndex}
        onClose={() => setIsViewerOpen(false)}
        onNavigate={(idx) => setViewerCurrentIndex(idx)}
        onToggleFavorite={handleToggleFavorite}
        onToggleAlbumSelect={handleToggleAlbumSelect}
        onAddComment={onAddComment}
        comments={comments}
        clientName={currentClient.clientNames}
        subFolders={subFolders}
        onMoveMediaToSubFolder={onMoveMediaToSubFolder}
      />

      {/* Sub-Folder Creation / Editing Modal */}
      {isSubFolderModalOpen && (
        <SubFolderCreateModal
          isOpen
          onClose={() => {
            setIsSubFolderModalOpen(false);
            setEditingSubFolder(null);
          }}
          events={events}
          projectId={currentClient.projectId}
          defaultEventId={selectedEventFilter ?? undefined}
          editingSubFolder={editingSubFolder}
          onCreateSubFolder={onCreateSubFolder}
          onUpdateSubFolder={onUpdateSubFolder}
        />
      )}
    </div>
  );
};
