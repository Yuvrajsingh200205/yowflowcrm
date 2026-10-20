'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Share2, 
  Send, 
  BookOpen, 
  FolderCheck,
  AlertCircle,
  FileCheck,
  Trash2
} from 'lucide-react';
import { GalleryMediaItem } from '../clientPortalTypes';

interface SelectionWorkflowProps {
  mediaItems: GalleryMediaItem[];
  maxAlbumPhotos?: number;
  onOpenMedia: (item: GalleryMediaItem) => void;
  onToggleAlbumSelect: (item: GalleryMediaItem) => void;
  onToggleFavorite: (item: GalleryMediaItem) => void;
  onSubmitSelection: (selectedCount: number) => void;
}

export const SelectionWorkflow: React.FC<SelectionWorkflowProps> = ({
  mediaItems,
  maxAlbumPhotos = 60,
  onOpenMedia,
  onToggleAlbumSelect,
  onToggleFavorite,
  onSubmitSelection,
}) => {
  const [activeTab, setActiveTab] = useState<'album' | 'favorites'>('album');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const albumSelectedItems = mediaItems.filter((m) => m.isSelectedForAlbum);
  const favoriteItems = mediaItems.filter((m) => m.isFavorite);

  const selectedCount = albumSelectedItems.length;
  const remainingCount = Math.max(0, maxAlbumPhotos - selectedCount);
  const progressPercent = Math.min(100, Math.round((selectedCount / maxAlbumPhotos) * 100));

  const handleSubmit = () => {
    if (selectedCount === 0) {
      alert('Please select at least 1 photo for your album.');
      return;
    }
    onSubmitSelection(selectedCount);
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Progress Tracker */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
              <BookOpen className="w-4 h-4" />
              Luxury Album Selection Workflow
            </div>
            <h2 className="text-xl sm:text-3xl font-serif text-slate-900">
              Select {maxAlbumPhotos} Photos for Your Wedding Photobook
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pick your absolute favorite emotional moments, portrait spreads, and family groups.
            </p>
          </div>

          {/* Submission Button */}
          <div>
            {isSubmitted ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Album Selection Submitted to Studio!
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#373B35] hover:bg-[#464B43] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                Submit Selection ({selectedCount}/{maxAlbumPhotos})
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Counters */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-700">
              Selected: <strong className="text-amber-800 text-sm font-semibold">{selectedCount}</strong> / {maxAlbumPhotos} Photos
            </span>
            <span className="text-slate-500">
              {remainingCount === 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Target Reached!
                </span>
              ) : (
                `${remainingCount} More Needed`
              )}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                selectedCount >= maxAlbumPhotos ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs for Album Selection vs Favorites */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('album')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === 'album'
              ? 'bg-[#373B35] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Album Selections ({albumSelectedItems.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === 'favorites'
              ? 'bg-[#373B35] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-current" />
          My Loved Favorites ({favoriteItems.length})
        </button>
      </div>

      {/* Grid of Selected Items */}
      {activeTab === 'album' ? (
        albumSelectedItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-slate-700 font-medium text-sm">No photos added to your album yet</h4>
            <p className="text-xs text-slate-500">
              Browse through your event galleries and click &quot;Add to Album&quot; to pick your top 60 photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
            {albumSelectedItems.map((item, idx) => (
              <div 
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-slate-100 border border-[#e2d9d3] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => onOpenMedia(item)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#373B35]">
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Index badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#181917]/80 backdrop-blur text-[11px] font-mono text-amber-300 border border-amber-500/30">
                  #{idx + 1}
                </span>

                {/* Remove from Album Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAlbumSelect(item);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-[#181917]/70 hover:bg-rose-600 text-white backdrop-blur transition-all"
                  title="Remove from Album"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="p-2.5 bg-white space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    {item.eventName}
                  </span>
                  <h4 className="text-xs font-medium text-slate-900 truncate">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        favoriteItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Heart className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-slate-700 font-medium text-sm">No favorites marked yet</h4>
            <p className="text-xs text-slate-500">
              Click the heart icon on any photo or video in the gallery to curate your personal favorites list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
            {favoriteItems.map((item) => (
              <div 
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-slate-100 border border-[#e2d9d3] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => onOpenMedia(item)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#373B35]">
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Favorite filled heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500 text-white backdrop-blur transition-all"
                  title="Remove from Favorites"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </button>

                <div className="p-2.5 bg-white space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    {item.eventName}
                  </span>
                  <h4 className="text-xs font-medium text-slate-900 truncate">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
