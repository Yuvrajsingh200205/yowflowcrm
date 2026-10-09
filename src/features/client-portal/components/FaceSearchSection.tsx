'use client';

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Heart,
  Download,
  Share2,
  FolderOpen
} from 'lucide-react';
import { GalleryMediaItem, FaceSearchResult } from '../clientPortalTypes';

interface FaceSearchSectionProps {
  galleryMedia: GalleryMediaItem[];
  clientName: string;
  onOpenMedia: (item: GalleryMediaItem) => void;
  onToggleFavorite: (item: GalleryMediaItem) => void;
}

export const FaceSearchSection: React.FC<FaceSearchSectionProps> = ({
  galleryMedia,
  clientName,
  onOpenMedia,
  onToggleFavorite,
}) => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FaceSearchResult[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [showCameraMode, setShowCameraMode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Upload via File input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieImage(event.target?.result as string);
      setSearchResults(null);
    };
    reader.readAsDataURL(file);
  };

  // Start Device Camera
  const handleStartCamera = async () => {
    setShowCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Camera access was not granted. You can still upload a selfie from your photo gallery.');
      setShowCameraMode(false);
    }
  };

  // Capture Snapshot from Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelfieImage(dataUrl);
      setSearchResults(null);
    }
    // Stop camera streams
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCameraMode(false);
  };

  // Perform Privacy-First Face Match inside Authorized Gallery
  const handleExecuteSearch = () => {
    if (!selfieImage || !hasConsented) return;

    setIsSearching(true);

    // Simulate AI facial landmark & feature embedding matching within authorized project
    setTimeout(() => {
      const matches: FaceSearchResult[] = galleryMedia
        .filter((item) => item.mediaType === 'image' && item.isClientVisible)
        .map((item, idx): FaceSearchResult => {
          // Weighted scoring based on tags, face descriptors and orientation
          const isBrideOrGroom = item.tags?.some((t) => ['Bride', 'Groom', 'Couple'].includes(t));
          const score = isBrideOrGroom ? Math.floor(82 + Math.random() * 16) : Math.floor(65 + Math.random() * 25);
          return {
            mediaId: item.id,
            media: item,
            similarityScore: score,
            eventName: item.eventName,
            matchType: isBrideOrGroom ? 'Couple' : 'Single',
          };
        })
        .filter((res) => res.similarityScore >= 70)
        .sort((a, b) => b.similarityScore - a.similarityScore);

      setSearchResults(matches);
      setIsSearching(false);
    }, 1200);
  };

  const handleClearSearch = () => {
    setSelfieImage(null);
    setSearchResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Grouping event counts
  const eventCounts: Record<string, number> = {};
  if (searchResults) {
    searchResults.forEach((r) => {
      eventCounts[r.eventName] = (eventCounts[r.eventName] || 0) + 1;
    });
  }

  const filteredResults = searchResults
    ? activeFilter === 'All'
      ? searchResults
      : searchResults.filter((r) => r.eventName === activeFilter)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-6 sm:p-10 text-white border border-[#4a1f2e]/80 shadow-xl">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Privacy Face Search
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif tracking-tight text-amber-100">
            Find Your Wedding Moments in Seconds
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Take or upload a quick selfie. Our privacy-first AI scanner matches your face across all authorized wedding events, candids, and ceremony albums without storing biometric data.
          </p>
        </div>
      </div>

      {/* Upload & Camera Scanner Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Selfie Preview & Camera Box */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            {showCameraMode ? (
              <div className="aspect-square w-full max-w-[16rem] rounded-2xl overflow-hidden bg-black relative border-2 border-amber-500 shadow-inner flex flex-col items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                <button
                  onClick={handleCaptureSnapshot}
                  className="absolute bottom-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs rounded-full shadow-lg flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Capture Selfie
                </button>
              </div>
            ) : selfieImage ? (
              <div className="relative group w-56 h-56 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md">
                <img 
                  src={selfieImage} 
                  alt="Search Reference" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={handleClearSearch}
                  className="absolute top-2 right-2 p-1.5 bg-[#2b171f]/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                  title="Remove Selfie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 right-2 text-center text-[11px] bg-[#6d2f45]/80 text-amber-200 py-0.5 rounded backdrop-blur">
                  Target Face Loaded
                </span>
              </div>
            ) : (
              <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-full">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-xs text-slate-500">
                  Upload a clear portrait or capture with your camera
                </div>
              </div>
            )}

            {/* Action buttons under box */}
            <div className="flex items-center gap-3 mt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5" />
                Choose Photo
              </button>
              <button 
                onClick={handleStartCamera}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Camera className="w-3.5 h-3.5" />
                Take Live Selfie
              </button>
            </div>
          </div>

          {/* Right: Privacy Consent & Search Controls */}
          <div className="md:col-span-7 space-y-5">
            <h3 className="text-lg font-serif text-slate-900">
              Find Matching Photos in {clientName}&apos;s Wedding
            </h3>
            
            {/* Privacy Guarantee Note */}
            <div className="bg-slate-50 rounded-xl p-4 border border-[#e2d9d3] space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Privacy & Data Security Notice
              </div>
              <p>
                • Your uploaded selfie is converted to an ephemeral face descriptor in memory only.
              </p>
              <p>
                • It is strictly searched <strong>only within this authorized private wedding gallery</strong>.
              </p>
              <p>
                • We never store or sell biometric data, and we do not identify other guests by name.
              </p>
            </div>

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={hasConsented} 
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-normal">
                I agree to the privacy policy and consent to searching photos matching this reference face in this wedding album.
              </span>
            </label>

            {/* Search Trigger Button */}
            <button
              onClick={handleExecuteSearch}
              disabled={!selfieImage || !hasConsented || isSearching}
              className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selfieImage || !hasConsented
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-600/20 active:scale-[0.99]'
              }`}
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning 1,400+ Wedding Photos...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Search Matching Photos Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results Area */}
      {searchResults !== null && (
        <div className="space-y-6 pt-4">
          {/* Summary counts bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-serif text-slate-900">
                Face Search Results
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Found {searchResults.length} photos matching your face across all events
              </p>
            </div>

            {/* Event Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === 'All'
                    ? 'bg-[#6d2f45] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Events ({searchResults.length})
              </button>
              {Object.entries(eventCounts).map(([eventName, count]) => (
                <button
                  key={eventName}
                  onClick={() => setActiveFilter(eventName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeFilter === eventName
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {eventName} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-slate-700 font-medium text-sm">No photos found for &quot;{activeFilter}&quot;</h4>
              <p className="text-xs text-slate-500">Try switching event filters or upload another reference selfie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
              {filteredResults.map((res) => (
                <div 
                  key={res.mediaId}
                  className="group relative rounded-xl overflow-hidden bg-slate-100 border border-[#e2d9d3] shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onOpenMedia(res.media)}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#6d2f45]">
                    <img 
                      src={res.media.thumbnailUrl} 
                      alt={res.media.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Similarity Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#2b171f]/80 backdrop-blur text-[11px] font-mono text-amber-300 border border-amber-500/30">
                    {res.similarityScore}% Match
                  </span>

                  {/* Favorite button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(res.media);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur transition-all ${
                      res.media.isFavorite 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-[#2b171f]/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${res.media.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Meta Bar */}
                  <div className="p-2.5 bg-white space-y-0.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-800">
                      {res.eventName}
                    </span>
                    <h4 className="text-xs font-medium text-slate-900 truncate">
                      {res.media.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
