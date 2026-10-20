'use client';

import React, { useState } from 'react';
import { 
  FileEdit, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Sparkles,
  Camera,
  Film,
  Music,
  Truck,
  HelpCircle,
  X
} from 'lucide-react';
import { ClientRequestItem } from '../clientPortalTypes';

interface ClientRequestsSectionProps {
  requests: ClientRequestItem[];
  /** The wedding this request belongs to. */
  projectId: string;
  clientName: string;
  onCreateRequest: (request: Omit<ClientRequestItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const ClientRequestsSection: React.FC<ClientRequestsSectionProps> = ({
  requests,
  projectId,
  clientName,
  onCreateRequest,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [requestType, setRequestType] = useState<ClientRequestItem['type']>('Photo Retouch');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [relatedMediaTitle, setRelatedMediaTitle] = useState<string>('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onCreateRequest({
      projectId,
      type: requestType,
      title: title.trim(),
      description: description.trim(),
      status: 'Open',
      relatedMediaTitle: relatedMediaTitle.trim() || undefined,
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setRelatedMediaTitle('');
  };

  const getTypeIcon = (type: ClientRequestItem['type']) => {
    switch (type) {
      case 'Photo Retouch': return <Camera className="w-4 h-4 text-amber-600" />;
      case 'Video Change': return <Film className="w-4 h-4 text-purple-600" />;
      case 'Song Change': return <Music className="w-4 h-4 text-rose-600" />;
      case 'Delivery Request': return <Truck className="w-4 h-4 text-blue-600" />;
      default: return <FileEdit className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#e2d9d3] shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
            <MessageSquare className="w-3.5 h-3.5" />
            Studio Request Center
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-slate-900">
            Retouching, Video Edits & Custom Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Directly communicate change requests, song replacements, spelling edits, or expedited album deliveries with our editing and management team.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-xl bg-[#373B35] hover:bg-[#464B43] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Submit New Request
        </button>
      </div>

      {/* Requests Stream */}
      <div className="space-y-4">
        {requests.map((req) => {
          const isCompleted = req.status === 'Completed' || req.status === 'Closed';
          return (
            <div 
              key={req.id}
              className="bg-white rounded-2xl p-6 border border-[#e2d9d3] shadow-sm space-y-4 hover:border-amber-400 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 mt-0.5">
                    {getTypeIcon(req.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                        {req.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : req.status === 'In Progress' 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">#{req.id}</span>
                    </div>

                    <h3 className="text-base font-serif font-medium text-slate-900 mt-1">
                      {req.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Created: {req.createdAt}</span>
                </div>
              </div>

              {/* Related Media Preview if present */}
              {req.relatedMediaTitle && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
                  {req.relatedMediaThumbnail && (
                    <img 
                      src={req.relatedMediaThumbnail} 
                      alt="Media Thumbnail" 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200" 
                    />
                  )}
                  <div>
                    <span className="text-slate-400 block text-[11px]">Referenced Memory</span>
                    <span className="font-medium text-slate-900">{req.relatedMediaTitle}</span>
                  </div>
                </div>
              )}

              {/* Studio Response Section */}
              {req.adminResponse ? (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-amber-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Studio Team Response ({req.assignedTeamMember || 'Production Lead'})
                    </span>
                    <span className="text-[10px] text-amber-700">{req.updatedAt}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{req.adminResponse}</p>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Assigned to Senior Editor. Response typically provided within 24 hours.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-serif text-slate-900">Submit Change / Retouch Request</h3>
                <p className="text-xs text-slate-500">Provide clear instructions for our editing artists</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Request Category
                </label>
                <select 
                  value={requestType} 
                  onChange={(e) => setRequestType(e.target.value as ClientRequestItem['type'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs bg-white"
                >
                  <option value="Photo Retouch">🎨 Photo Retouch / Color Correction</option>
                  <option value="Video Change">🎬 Video Cut / Timeline Change</option>
                  <option value="Song Change">🎵 Background Music / Audio Track Replacement</option>
                  <option value="Album Change">📖 Photobook Layout / Cover Change</option>
                  <option value="Name Correction">✏️ Name / Date Spelling Correction</option>
                  <option value="Delivery Request">🚚 Expedited Courier / Drive Dispatch</option>
                  <option value="Other">💬 Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Short Title
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Skin tone retouch on Mandap Couple close-up"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referenced Photo / Video Name or Link (Optional)
                </label>
                <input 
                  type="text" 
                  value={relatedMediaTitle}
                  onChange={(e) => setRelatedMediaTitle(e.target.value)}
                  placeholder="e.g. Photo #042 in Haldi or Sangeet Reel 2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Notes & Instructions
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exactly what you'd like our studio editors to adjust..."
                  rows={4}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#373B35] hover:bg-[#464B43] text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
