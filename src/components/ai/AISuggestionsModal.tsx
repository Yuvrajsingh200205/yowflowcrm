import React, { useState } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [weddingType, setWeddingType] = useState('Punjabi / North Indian Destination Wedding');
  const [vibe, setVibe] = useState('Cinematic Romantic & High-Energy Sangeet');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setOutput(`Creative direction for ${weddingType}
Target vibe: ${vibe}

🎵 Recommended Music Tracks:
1. Teaser Track 1: "Kesariya" (Acoustic / Lofi Mix) - Perfect for Couple Portrait sequence
2. Teaser Track 2: "Ranja" (Violin Instrumental) - Soft romantic Varmala entry
3. Sangeet Reels: "Kala Chashma" / "Sauda Khara Khara" - High energy Punjabi dhol beat
4. Haldi Reel: "Rangisari" (Folk Fusion) - Vibrant yellow petal splash
5. Reception Film: cinematic instrumental with a restrained orchestral build

🎥 Essential Wedding Shot List for Alex Morgan's Crew:
• Pre-Wedding: Sunrise golden hour silhouette, wide drone orbit at venue, close-up ring reflection
• Varmala: Slow-mo 120fps rose petal shower shot from FX3, 360-degree gimbal wrap around couple
• Phere: Flame bokeh background, emotional candid father-daughter moment, close up mangalsutra tying
• Sangeet: Locked wide master, reaction cutaways, low-angle dance entries, and crowd energy inserts

💡 Color Grading Advice:
• Warm, rich Indian skin tones with slight golden tint in Lightroom/DaVinci Resolve. Avoid over-desaturating yellows.`);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Wedding Song & Shot List Generator
            </h3>
            <p className="text-[11px] text-slate-500">
              Generate trending music recommendations and cinematic shot lists for Alex Morgan's team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Wedding Type / Theme</label>
              <input
                type="text"
                value={weddingType}
                onChange={(e) => setWeddingType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 text-xs"
                placeholder="e.g. Royal Rajasthani Destination"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Target Vibe</label>
              <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 text-xs"
                placeholder="e.g. Romantic Lofi + Energetic Sangeet"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'AI Generating Ideas...' : 'Generate AI Songs & Shot List'}</span>
          </button>

          {output && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 relative space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-indigo-700 uppercase text-[10px] tracking-wider">AI Generated Creative Brief</span>
                <button
                  onClick={handleCopy}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 hover:bg-slate-100"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{copied ? 'Copied!' : 'Copy Brief'}</span>
                </button>
              </div>

              <div className="text-slate-800 font-sans whitespace-pre-wrap leading-relaxed text-xs">
                {output}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
