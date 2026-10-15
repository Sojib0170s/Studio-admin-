import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderTree, AlertCircle } from 'lucide-react';
import { Category, CategoryFormData } from '../../types';
import { createCategory, updateCategory, slugify } from '../../services/categoryService';
import { ImageUploader } from '../common/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFirestoreError } from '../../lib/firebase';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categoryToEdit?: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  categoryToEdit,
}) => {
  const { adminUser } = useAuth();
  const { success, error } = useToast();

  const isEditing = Boolean(categoryToEdit);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    thumbnailUrl: '',
    displayOrder: 0,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name,
        slug: categoryToEdit.slug,
        description: categoryToEdit.description || '',
        thumbnailUrl: categoryToEdit.thumbnailUrl || '',
        displayOrder: categoryToEdit.displayOrder || 0,
        isActive: categoryToEdit.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        thumbnailUrl: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setValidationError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: !isEditing ? slugify(val) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setValidationError('Category name must be at least 2 characters long.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';

      if (isEditing && categoryToEdit) {
        await updateCategory(categoryToEdit.id, formData, actorEmail, actorUid);
        success('Category Updated', `Category "${formData.name}" saved successfully.`);
      } else {
        await createCategory(formData, actorEmail, actorUid);
        success('Category Created', `Category "${formData.name}" created successfully.`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      const formatted = formatFirestoreError(err);
      setValidationError(formatted.userFriendlyMessage);
      error(formatted.isPermissionDenied ? 'Permission Denied' : 'Category Save Error', formatted.userFriendlyMessage, formatted.rawError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#13141F] border border-[#272A3E] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#272A3E] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEditing ? `Edit Category: ${categoryToEdit?.name}` : 'New Category'}
              </h3>
              <p className="text-xs text-slate-400">Organize and group prompts for mobile display</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Cinematic Portraits, Neon Cyberpunk"
              className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                placeholder="cinematic-portraits"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Styles focusing on dramatic film lighting and expressive characters..."
              className="w-full px-3.5 py-2 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Thumbnail image */}
          <ImageUploader
            currentUrl={formData.thumbnailUrl}
            folder="categories"
            onImageSelected={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl: url }))}
          />

          {/* Active status */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#161824] border border-[#272A3E] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded text-purple-600 accent-purple-600 bg-[#1A1C29] border-[#272A3E]"
            />
            <div>
              <span className="text-xs font-semibold text-white">Active in Mobile Catalogue</span>
              <p className="text-[11px] text-slate-400">
                Visible to users in the app category selector.
              </p>
            </div>
          </label>

          {/* Actions */}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
