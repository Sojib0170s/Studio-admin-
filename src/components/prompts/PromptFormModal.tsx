import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Plus, AlertCircle, Info } from 'lucide-react';
import { Prompt, PromptFormData, Category, PromptStatus } from '../../types';
import { createPrompt, updatePrompt } from '../../services/promptService';
import { slugify } from '../../services/categoryService';
import { ImageUploader } from '../common/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFirestoreError } from '../../lib/firebase';

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  promptToEdit?: Prompt | null;
}

const ENGINE_MODELS = [
  'Midjourney v6.1',
  'Midjourney v6.0',
  'Flux.1 Schnell',
  'Flux.1 Dev',
  'Stable Diffusion XL (SDXL)',
  'SD 1.5 Turbo',
  'DALL-E 3',
];

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5', '3:2', '2:3', '21:9'] as const;

export const PromptFormModal: React.FC<PromptFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  categories,
  promptToEdit,
}) => {
  const { adminUser } = useAuth();
  const { success, error } = useToast();

  const isEditing = Boolean(promptToEdit);

  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    slug: '',
    description: '',
    promptText: '',
    negativePrompt: '',
    categoryId: '',
    thumbnailUrl: '',
    tags: [],
    featured: false,
    status: 'draft',
    parameters: {
      aspectRatio: '1:1',
      modelEngine: 'Midjourney v6.1',
      stylize: 250,
      cfgScale: 7.0,
    },
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (promptToEdit) {
      setFormData({
        title: promptToEdit.title,
        slug: promptToEdit.slug,
        description: promptToEdit.description || '',
        promptText: promptToEdit.promptText,
        negativePrompt: promptToEdit.negativePrompt || '',
        categoryId: promptToEdit.categoryId,
        thumbnailUrl: promptToEdit.thumbnailUrl || '',
        tags: promptToEdit.tags || [],
        featured: promptToEdit.featured || false,
        status: promptToEdit.status,
        parameters: {
          aspectRatio: promptToEdit.parameters?.aspectRatio || '1:1',
          modelEngine: promptToEdit.parameters?.modelEngine || 'Midjourney v6.1',
          stylize: promptToEdit.parameters?.stylize ?? 250,
          cfgScale: promptToEdit.parameters?.cfgScale ?? 7.0,
        },
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        promptText: '',
        negativePrompt: '',
        categoryId: categories[0]?.id || '',
        thumbnailUrl: '',
        tags: ['portrait', 'cinematic'],
        featured: false,
        status: 'published',
        parameters: {
          aspectRatio: '1:1',
          modelEngine: 'Midjourney v6.1',
          stylize: 250,
          cfgScale: 7.0,
        },
      });
    }
    setValidationErrors({});
  }, [promptToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      // Auto-generate slug only when creating new prompt or if slug was untouched
      slug: !isEditing ? slugify(val) : prev.slug,
    }));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (formData.tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, trimmed],
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long.';
    } else if (formData.title.length > 120) {
      errors.title = 'Title cannot exceed 120 characters.';
    }

    if (!formData.slug || !formData.slug.trim()) {
      errors.slug = 'Slug is required.';
    }

    if (!formData.promptText || formData.promptText.trim().length < 10) {
      errors.promptText = 'Prompt instructions must be at least 10 characters long.';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true);

    try {
      const selectedCategory = categories.find((c) => c.id === formData.categoryId);
      const catName = selectedCategory ? selectedCategory.name : '';

      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';

      if (isEditing && promptToEdit) {
        await updatePrompt(promptToEdit.id, formData, catName, actorEmail, actorUid);
        success('Prompt Updated', `Changes to "${formData.title}" saved successfully.`);
      } else {
        await createPrompt(formData, catName, actorEmail, actorUid);
        success('Prompt Created', `Prompt "${formData.title}" published successfully.`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save prompt:', err);
      const formatted = formatFirestoreError(err);
      error(
        formatted.isPermissionDenied ? 'Permission Denied' : 'Save Failed',
        formatted.userFriendlyMessage,
        formatted.rawError
      );
      // Preserves form data in state for user to fix and retry!
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl bg-[#13141F] border border-[#272A3E] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#272A3E] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEditing ? `Edit Prompt: ${promptToEdit?.title}` : 'Create New AI Photo Prompt'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update prompt parameters and preview' : 'Add high-grade prompt template to studio library'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info & Prompt instructions */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Prompt Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Cinematic Moody Portrait with Golden Hour Backlight"
                  className={`w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors ${
                    validationErrors.title ? 'border-rose-500' : 'border-[#272A3E]'
                  }`}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Slug & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    placeholder="cinematic-moody-portrait"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-300 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Atmospheric studio lighting photo shoot with shallow depth of field..."
                  className="w-full px-3.5 py-2 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Full Prompt Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Full AI Prompt Text *
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formData.promptText.length} chars
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={formData.promptText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promptText: e.target.value }))}
                  placeholder="high-end editorial fashion photography, 35mm portrait, Kodak Portra 400 film grain, dramatic chiaroscuro lighting, soft rim highlights, 8k resolution --ar 16:9 --v 6.1"
                  className={`w-full p-3 font-mono text-xs bg-black/50 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed resize-y ${
                    validationErrors.promptText ? 'border-rose-500' : 'border-[#272A3E]'
                  }`}
                />
                {validationErrors.promptText && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.promptText}
                  </p>
                )}
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1.5">
                  Negative Prompt (Artifacts to Avoid)
                </label>
                <textarea
                  rows={2}
                  value={formData.negativePrompt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, negativePrompt: e.target.value }))}
                  placeholder="deformed hands, oversaturated, blurry, bad anatomy, plastic skin, CGI render"
                  className="w-full px-3 py-2 font-mono text-xs bg-black/40 border border-rose-500/20 rounded-xl text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            {/* Right Column: Parameters, Image Uploader, Tags, Status */}
            <div className="space-y-4">
              {/* Image Uploader */}
              <ImageUploader
                currentUrl={formData.thumbnailUrl}
                folder="prompts"
                onImageSelected={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl: url }))}
              />

              {/* Model & Aspect Ratio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Engine / Model
                  </label>
                  <select
                    value={formData.parameters?.modelEngine || 'Midjourney v6.1'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parameters: { ...prev.parameters, modelEngine: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {ENGINE_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.parameters?.aspectRatio || '1:1'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          aspectRatio: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {ASPECT_RATIOS.map((ar) => (
                      <option key={ar} value={ar}>
                        {ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stylize & CFG Sliders */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#161824] border border-[#272A3E]">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Stylize</span>
                    <span className="font-mono text-purple-400">{formData.parameters?.stylize ?? 250}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="25"
                    value={formData.parameters?.stylize ?? 250}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parameters: { ...prev.parameters, stylize: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>CFG Scale</span>
                    <span className="font-mono text-purple-400">{formData.parameters?.cfgScale ?? 7.0}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={formData.parameters?.cfgScale ?? 7.0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parameters: { ...prev.parameters, cfgScale: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tags (Press Enter or Add)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="e.g. portrait, moody, neon"
                    className="flex-1 px-3 py-2 text-xs bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 text-xs font-medium bg-[#1F2133] hover:bg-[#272A3E] text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#1F2133] text-purple-300 border border-purple-500/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Publication Status & Featured Toggle */}
              <div className="p-3.5 rounded-xl bg-[#161824] border border-[#272A3E] space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Publication Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['published', 'draft', 'archived'] as PromptStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, status }))}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          formData.status === status
                            ? status === 'published'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : status === 'draft'
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                              : 'bg-slate-600 text-white shadow-md shadow-slate-600/20'
                            : 'bg-[#1A1C29] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-2 border-t border-[#222436] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600 bg-[#1A1C29] border-[#272A3E]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Feature in Hero Carousel</span>
                    <p className="text-[11px] text-slate-400">
                      Highlighted prominently at the top of the mobile Prompt Studio app.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#272A3E] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-[#1F2133] hover:bg-[#272A3E] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create & Publish Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
