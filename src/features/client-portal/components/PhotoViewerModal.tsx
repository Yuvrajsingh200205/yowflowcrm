'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Download, 
  Share2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  Send, 
  AlertCircle,
  Film,
  Sparkles,
  Camera,
  FolderOpen,
  FolderPlus
} from 'lucide-react';
import { GalleryMediaItem, ClientComment, GallerySubFolder } from '../clientPortalTypes';

interface PhotoViewerModalProps {
  items: GalleryMediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite: (item: GalleryMediaItem) => void;
  onToggleAlbumSelect: (item: GalleryMediaItem) => void;
  onAddComment: (comment: Omit<ClientComment, 'id' | 'createdAt'>) => void;
  comments: ClientComment[];
  clientName: string;
  subFolders?: GallerySubFolder[];
  onMoveMediaToSubFolder?: (mediaId: string, subFolderId?: string, subFolderName?: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onToggleAlbumSelect,
  onAddComment,
  comments,
  clientName,
  subFolders = [],
  onMoveMediaToSubFolder,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showInfoSidebar, setShowInfoSidebar] = useState<boolean>(false);
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [commentType, setCommentType] = useState<ClientComment['type']>('general');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const itemComments = comments.filter((c) => c.mediaId === currentItem.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
    const newIdx = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    onNavigate(newIdx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
    const newIdx = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIdx);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.35, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.35, 1));

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = `${currentItem.eventName}_${currentItem.title.replace(/\s+/g, '_')}.${currentItem.mediaType === 'video' ? 'mp4' : 'jpg'}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.title,
          text: `Check out this wedding memory: ${currentItem.title}`,
          url: currentItem.url,
        });
      } catch (err) {
        // fallback
      }
    } else {
      navigator.clipboard.writeText(currentItem.url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment({
      projectId: currentItem.projectId,
      mediaId: currentItem.id,
      mediaTitle: currentItem.title,
      mediaThumbnail: currentItem.thumbnailUrl,
      eventId: currentItem.eventId,
      eventName: currentItem.eventName,
      authorName: clientName,
      authorRole: 'client',
      commentText: commentText.trim(),
      type: commentType,
    });

    setCommentText('');
    setShowCommentBox(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#111f1c]/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar Header */}
      <div 
        className="w-full h-16 bg-gradient-to-b from-slate-950/80 to-transparent px-4 sm:px-8 flex items-center justify-between text-white z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
            {currentItem.eventName}
          </span>
          <span className="text-sm font-light text-slate-300 hidden sm:inline-block">
            {currentIndex + 1} of {items.length}
          </span>
          <h3 className="min-w-0 flex-1 text-sm sm:text-base font-serif tracking-wide text-white truncate">
            {currentItem.title}
          </h3>
        </div>

        {/* Header Action Tools */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Zoom controls for images */}
          {currentItem.mediaType === 'image' && (
            <div className="hidden sm:flex items-center bg-[#254b42]/80 rounded-full border border-[#19332d] p-1 mr-2">
              <button 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 px-1 font-mono">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 2.5}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Favorite Toggle */}
          <button 
            onClick={() => onToggleFavorite(currentItem)}
            className={`p-2 rounded-full transition-all ${
              currentItem.isFavorite 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-[#254b42]/80 text-slate-300 hover:text-rose-400 hover:bg-[#2f5f54]'
            }`}
            title="Mark as Favorite"
          >
            <Heart className={`w-5 h-5 ${currentItem.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Add to Album Selection */}
          <button 
            onClick={() => onToggleAlbumSelect(currentItem)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              currentItem.isSelectedForAlbum 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'bg-[#254b42]/80 text-slate-300 hover:text-emerald-400 hover:bg-[#2f5f54] border border-[#19332d]'
            }`}
            title="Select for Luxury Album"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {currentItem.isSelectedForAlbum ? 'Selected in Album' : 'Add to Album'}
            </span>
          </button>

          {/* Download Button */}
          {currentItem.downloadAllowed && (
            <button 
              onClick={handleDownload}
              className="p-2 rounded-full bg-[#254b42]/80 text-slate-300 hover:text-[#ddc89c] hover:bg-[#2f5f54] transition-colors"
              title="Download High-Res"
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {/* Share */}
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-[#254b42]/80 text-slate-300 hover:text-[#ddc89c] hover:bg-[#2f5f54] transition-colors relative"
            title="Share Photo"
          >
            <Share2 className="w-5 h-5" />
            {copyFeedback && (
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-[#ddc89c] text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Link Copied!
              </span>
            )}
          </button>

          {/* Info toggle */}
          <button 
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className={`p-2 rounded-full transition-colors ${
              showInfoSidebar ? 'bg-amber-500 text-slate-950' : 'bg-[#254b42]/80 text-slate-300 hover:text-white'
            }`}
            title="Details & Retouch Requests"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Close Modal */}
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-[#254b42]/80 text-slate-400 hover:text-white hover:bg-[#2f5f54] transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Left */}
        <button 
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-[#254b42]/70 hover:bg-[#254b42] text-white/80 hover:text-white backdrop-blur border border-[#19332d] transition-all hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Center Media Item */}
        <div className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-200">
          {currentItem.mediaType === 'image' ? (
            <img 
              src={currentItem.url} 
              alt={currentItem.title}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[82vh] max-w-[92vw] md:max-w-[80vw] object-contain rounded-lg shadow-2xl transition-transform duration-150"
            />
          ) : (
            <div className="w-[90vw] md:w-[75vw] max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-[#19332d]">
              <video 
                src={currentItem.url} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation Right */}
        <button 
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-[#254b42]/70 hover:bg-[#254b42] text-white/80 hover:text-white backdrop-blur border border-[#19332d] transition-all hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Side Details & Comments Drawer */}
        {showInfoSidebar && (
          <div 
            className="absolute top-0 right-0 bottom-0 w-full max-w-sm sm:w-96 bg-[#254b42]/95 border-l border-[#19332d] text-slate-200 p-6 overflow-y-auto z-40 backdrop-blur-xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#19332d] pb-4 mb-4">
              <h4 className="font-serif text-lg text-amber-200">Memory Details</h4>
              <button 
                onClick={() => setShowInfoSidebar(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Event</span>
                <span className="font-medium text-slate-100">{currentItem.eventName}</span>
              </div>

              {/* Sub-Folder Categorization */}
              <div className="p-3 bg-[#254b42]/90 rounded-xl border border-[#19332d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                    <FolderOpen className="w-3.5 h-3.5 text-[#ddc89c]" />
                    Sub-Folder Category
                  </span>
                  {currentItem.subFolderName ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
                      {currentItem.subFolderName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                  )}
                </div>

                {onMoveMediaToSubFolder && (
                  <div className="pt-1">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Move / Assign to Sub-Folder:
                    </label>
                    <select
                      value={currentItem.subFolderId || ''}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        const targetFolder = subFolders.find((sf) => sf.id === targetId);
                        onMoveMediaToSubFolder(
                          currentItem.id, 
                          targetId || undefined, 
                          targetFolder?.name || undefined
                        );
                      }}
                      className="w-full bg-[#111f1c] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">📁 General (No Sub-Folder)</option>
                      {subFolders
                        .filter((sf) => sf.projectId === currentItem.projectId)
                        .map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            📁 {sf.name} ({sf.eventId})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-xs">File Specs</span>
                <span className="text-slate-300">{currentItem.fileSize || 'High Resolution RAW-JPG'} • {currentItem.orientation}</span>
              </div>
              {currentItem.photographerCredit && (
                <div>
                  <span className="text-slate-400 block text-xs">Captured By</span>
                  <span className="text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Camera className="w-3.5 h-3.5 text-[#ddc89c]" />
                    {currentItem.photographerCredit}
                  </span>
                </div>
              )}

              {/* Tags */}
              {currentItem.tags && currentItem.tags.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-xs mb-1.5">Tags & AI Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentItem.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-[#19332d] my-4" />

              {/* Comments & Requests Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#ddc89c]" />
                    Comments & Retouch ({itemComments.length})
                  </span>
                  <button 
                    onClick={() => setShowCommentBox(!showCommentBox)}
                    className="text-xs text-[#ddc89c] hover:text-amber-300 font-medium"
                  >
                    + Add Note
                  </button>
                </div>

                {showCommentBox && (
                  <form onSubmit={handleSubmitComment} className="bg-[#111f1c]/80 p-3 rounded-lg border border-[#19332d] space-y-2">
                    <div className="flex items-center gap-2">
                      <select 
                        value={commentType} 
                        onChange={(e) => setCommentType(e.target.value as ClientComment['type'])}
                        className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 w-full focus:outline-none"
                      >
                        <option value="general">💬 General Note</option>
                        <option value="retouch_request">🎨 Retouch / Edit Request</option>
                        <option value="album_cover">📖 Select for Album Cover</option>
                        <option value="remove_request">❌ Remove from Selection</option>
                      </select>
                    </div>
                    <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="e.g. Please soften the background light flare or retouch skin..."
                      rows={3}
                      className="w-full bg-[#254b42] text-slate-100 text-xs rounded p-2 border border-slate-700 focus:outline-none focus:border-amber-500 resize-none"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowCommentBox(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs rounded flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Send to Studio
                      </button>
                    </div>
                  </form>
                )}

                {/* Existing comments stream */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {itemComments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No retouch notes or comments yet. Click &quot;Add Note&quot; to request edits from the editor.
                    </p>
                  ) : (
                    itemComments.map((comm) => (
                      <div key={comm.id} className="p-2.5 rounded bg-[#111f1c]/60 border border-[#19332d]/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-amber-300">{comm.authorName}</span>
                          <span className="text-[10px] text-slate-500">{comm.createdAt}</span>
                        </div>
                        <p className="text-slate-200">{comm.commentText}</p>
                        {comm.adminReply && (
                          <div className="mt-1.5 pl-2 border-l-2 border-amber-500 text-amber-300/90 text-[11px] py-0.5">
                            <span className="font-semibold">Studio Response:</span> {comm.adminReply}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div 
        className="w-full h-20 bg-[#111f1c]/90 border-t border-[#254b42] px-4 flex items-center justify-center gap-2 overflow-x-auto z-20 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) => (
          <button 
            key={item.id}
            onClick={() => {
              setZoomLevel(1);
              onNavigate(idx);
            }}
            className={`h-14 w-20 rounded overflow-hidden flex-shrink-0 relative transition-all ${
              idx === currentIndex 
                ? 'ring-2 ring-amber-400 scale-105 opacity-100' 
                : 'opacity-40 hover:opacity-80'
            }`}
          >
            <img 
              src={item.thumbnailUrl} 
              alt={item.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
            {item.mediaType === 'video' && (
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <Film className="w-3.5 h-3.5" />
              </span>
            )}
            {item.isFavorite && (
              <span className="absolute top-1 right-1 text-rose-500">
                <Heart className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
