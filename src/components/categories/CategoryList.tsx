import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderTree, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Category } from '../../types';
import { deleteCategory } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
  onNewCategory: () => void;
  onEditCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  onRefresh,
  onNewCategory,
  onEditCategory,
}) => {
  const { adminUser } = useAuth();
  const { success, error, warning } = useToast();

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (cat: Category) => {
    if ((cat.promptCount || 0) > 0) {
      warning(
        'Deletion Prevented',
        `Category "${cat.name}" contains ${cat.promptCount} prompts. To prevent orphaned prompts, please reassign or remove those prompts before deleting this category.`
      );
      return;
    }
    setCategoryToDelete(cat);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';

      await deleteCategory(categoryToDelete.id, categoryToDelete.name, actorEmail, actorUid);
      success('Category Deleted', `Category "${categoryToDelete.name}" was removed.`);
      setCategoryToDelete(null);
      onRefresh();
    } catch (err: any) {
      error('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-[#12131C] border border-[#222436] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Prompt Categories</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Categories organize prompts into structured genres for browsing and filtering in Prompt Studio.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewCategory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-6 bg-[#1F2133] rounded w-1/4" />
          <div className="h-10 bg-[#1F2133] rounded" />
          <div className="h-10 bg-[#1F2133] rounded" />
          <div className="h-10 bg-[#1F2133] rounded" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <FolderTree className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Categories Created</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first prompt category (e.g., Cinematic Portraits, Anime & Manga, Studio Lighting).
            </p>
          </div>
          <button
            type="button"
            onClick={onNewCategory}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-[#161826] border-b border-[#222436] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5 text-center">Order</th>
                  <th className="px-4 py-3.5 text-center">Prompts Count</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222436]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#181A28] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cat.thumbnailUrl ? (
                          <img
                            src={cat.thumbnailUrl}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover bg-black/40 border border-[#272A3E]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <FolderTree className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      /{cat.slug}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-300">
                      {cat.displayOrder}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          (cat.promptCount || 0) > 0
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                            : 'bg-slate-700/20 text-slate-400'
                        }`}
                      >
                        {cat.promptCount || 0} prompts
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222436] transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={
                            (cat.promptCount || 0) > 0
                              ? 'Cannot delete category containing prompts'
                              : 'Delete Category'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category?"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Category"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
