import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Tag, Eye, Heart, Layers, ExternalLink } from 'lucide-react';
import { Prompt } from '../../types';
import { incrementPromptCopyCount } from '../../services/promptService';
import { useToast } from '../../context/ToastContext';

interface PromptPreviewModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onEdit?: (prompt: Prompt) => void;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  prompt,
  onClose,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  if (!prompt) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      success('Prompt Copied', 'Prompt instructions copied to clipboard');
      await incrementPromptCopyCount(prompt.id);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl bg-[#13141E] border border-[#272A3E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#272A3E] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{prompt.title}</h3>
              <p className="text-xs text-slate-400 font-mono">/{prompt.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(prompt);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1F2133] hover:bg-[#2B2F44] text-slate-200 transition-colors cursor-pointer"
              >
                Edit Prompt
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-1">
              <div className="rounded-xl overflow-hidden border border-[#272A3E] bg-black/40 aspect-[4/5] relative group">
                <img
                  src={
                    prompt.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={prompt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      prompt.status === 'published'
                        ? 'bg-emerald-500/90 text-white'
                        : prompt.status === 'draft'
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-slate-500/90 text-white'
                    }`}
                  >
                    {prompt.status}
                  </span>
                  {prompt.featured && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-lime-400 text-black">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta details */}
            <div className="md:col-span-2 space-y-4">
              {prompt.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Style Description
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed">{prompt.description}</p>
                </div>
              )}

              {/* Grid of parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                  <span className="text-xs font-semibold text-purple-300 mt-0.5 block truncate">
                    {prompt.categoryName || 'Unassigned'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Aspect Ratio</span>
                  <span className="text-xs font-mono font-semibold text-white mt-0.5 block">
                    {prompt.parameters?.aspectRatio || '1:1'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Engine Model</span>
                  <span className="text-xs font-mono text-lime-400 mt-0.5 block truncate">
                    {prompt.parameters?.modelEngine || 'Midjourney v6.1'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Stylize (S)</span>
                  <span className="text-xs font-mono text-white mt-0.5 block">
                    {prompt.parameters?.stylize ?? 250}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">CFG Scale</span>
                  <span className="text-xs font-mono text-white mt-0.5 block">
                    {prompt.parameters?.cfgScale ?? 7.0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#161824] border border-[#222436]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Copies Count</span>
                  <span className="text-xs font-mono text-slate-300 mt-0.5 block">
                    {prompt.copyCount} copies
                  </span>
                </div>
              </div>

              {/* Tags list */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Search Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs bg-[#1F2133] text-slate-300 border border-[#272A3E]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Prompt Text Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Full AI Prompt Text
              </label>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#1F2133] hover:bg-purple-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Prompt
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-[#272A3E] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
              {prompt.promptText}
            </div>
          </div>

          {/* Negative Prompt Block */}
          {prompt.negativePrompt && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Negative Prompt (Excluded Elements)
              </label>
              <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 font-mono text-xs text-rose-300 leading-relaxed whitespace-pre-wrap">
                {prompt.negativePrompt}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#272A3E] bg-[#161826] flex items-center justify-between text-xs text-slate-400">
          <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
          <span>Last modified: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
