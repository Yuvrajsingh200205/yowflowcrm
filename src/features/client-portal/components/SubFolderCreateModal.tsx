'use client';

import React, { useState } from 'react';
import { 
  FolderPlus, 
  X, 
  Sparkles, 
  Check, 
  Layers, 
  Image as ImageIcon,
  FolderOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { GalleryEvent, GallerySubFolder } from '../clientPortalTypes';

interface SubFolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: GalleryEvent[];
  defaultEventId?: string;
  projectId: string;
  onCreateSubFolder: (subFolder: Omit<GallerySubFolder, 'id' | 'createdAt'>) => void;
  editingSubFolder?: GallerySubFolder | null;
  onUpdateSubFolder?: (subFolder: GallerySubFolder) => void;
}

const PRESET_SUGGESTIONS = [
  'Bridal Getting Ready',
  'Groom Baraat & Entry',
  'Varmala & Pheras',
  'Candid Moments',
  'Couple Solo Portraits',
  'Family & Stage Groups',
  'Decor & Ambient Details',
  'Haldi Flower Splash',
  'Henna & Jewelry Details',
  'Sangeet Dance Acts',
  'Drone & Aerial Highlights',
  'Reception & Cake Cutting',
  'Best 60 for Photobook',
  'Instagram Reel Clips'
];

const COLOR_OPTIONS = [
  { id: 'amber', name: 'Royal Amber', bg: 'bg-amber-100 text-amber-900 border-amber-300 ring-amber-400' },
  { id: 'rose', name: 'Blush Rose', bg: 'bg-rose-100 text-rose-900 border-rose-300 ring-rose-400' },
  { id: 'emerald', name: 'Emerald Green', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-emerald-400' },
  { id: 'sky', name: 'Ocean Sky', bg: 'bg-sky-100 text-sky-900 border-sky-300 ring-sky-400' },
  { id: 'purple', name: 'Imperial Violet', bg: 'bg-purple-100 text-purple-900 border-purple-300 ring-purple-400' },
  { id: 'yellow', name: 'Haldi Yellow', bg: 'bg-yellow-100 text-yellow-900 border-yellow-300 ring-yellow-400' },
  { id: 'stone', name: 'Warm Charcoal', bg: 'bg-slate-100 text-slate-900 border-slate-300 ring-slate-400' },
];

export const SubFolderCreateModal: React.FC<SubFolderCreateModalProps> = ({
  isOpen,
  onClose,
  events,
  defaultEventId,
  projectId,
  onCreateSubFolder,
  editingSubFolder,
  onUpdateSubFolder,
}) => {
  const [name, setName] = useState<string>(editingSubFolder?.name || '');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    editingSubFolder?.eventId || defaultEventId || events[0]?.id || 'general'
  );
  const [description, setDescription] = useState<string>(editingSubFolder?.description || '');
  const [coverImage, setCoverImage] = useState<string>(
    editingSubFolder?.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
  );
  const [color, setColor] = useState<string>(editingSubFolder?.color || 'amber');
  const [isClientVisible, setIsClientVisible] = useState<boolean>(
    editingSubFolder?.isClientVisible !== false
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a name for the sub-folder.');
      return;
    }

    if (editingSubFolder && onUpdateSubFolder) {
      onUpdateSubFolder({
        ...editingSubFolder,
        name: name.trim(),
        eventId: selectedEventId,
        description: description.trim(),
        coverImage,
        color,
        isClientVisible,
      });
    } else {
      onCreateSubFolder({
        projectId,
        eventId: selectedEventId,
        name: name.trim(),
        description: description.trim(),
        coverImage,
        color,
        itemCount: 0,
        isClientVisible,
      });
    }

    onClose();
  };

  const handleApplyPreset = (preset: string) => {
    setName(preset);
    if (!description) {
      setDescription(`Categorized selection for ${preset}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-[#e2d9d3] space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {editingSubFolder ? 'Edit Sub-Folder' : 'Create Photo Gallery Sub-Folder'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a sub-folder to organize ceremony portraits &amp; candid shots
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Event Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Parent Wedding Event / Function:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.eventDate || 'Ceremony'})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Folder Name Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Sub-Folder Name (what are you grouping?):
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bridal Getting Ready, Varmala & Pheras, Candid Candids..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 font-medium"
            />
          </div>

          {/* Quick Suggestions / Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Quick Suggestions (one click to use a name):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/80 rounded-xl border border-[#e8ddd7]">
              {PRESET_SUGGESTIONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    name === preset 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:text-amber-900'
                  }`}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Description / Notes (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Detailed jewelry closeups, lehenga flares & aesthetic portraits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900"
            />
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Folder Color Theme:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((col) => (
                <button
                  type="button"
                  key={col.id}
                  onClick={() => setColor(col.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${col.bg} ${
                    color === col.id ? 'ring-2 ring-offset-1 font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === col.id && <Check className="w-3 h-3" />}
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Client Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                {isClientVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                <span>Client Portal Visibility</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isClientVisible ? 'Visible to couple and guests in live gallery' : 'Hidden / Studio Internal Only'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsClientVisible(!isClientVisible)}
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                isClientVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isClientVisible ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#373B35] hover:bg-[#464B43] text-white font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{editingSubFolder ? 'Save Changes' : 'Create Sub-Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
