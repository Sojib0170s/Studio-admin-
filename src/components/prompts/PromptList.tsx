import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Prompt, Category, PromptStatus } from '../../types';
import { togglePublishPrompt, toggleFeaturedPrompt, deletePrompt, incrementPromptCopyCount } from '../../services/promptService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PromptListProps {
  prompts: Prompt[];
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
  onNewPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onPreviewPrompt: (prompt: Prompt) => void;
}

const ITEMS_PER_PAGE = 9;

export const PromptList: React.FC<PromptListProps> = ({
  prompts,
  categories,
  isLoading,
  onRefresh,
  onNewPrompt,
  onEditPrompt,
  onPreviewPrompt,
}) => {
  const { adminUser } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PromptStatus | 'all'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion confirm state
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }
      if (featuredOnly && !p.featured) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchPrompt = p.promptText.toLowerCase().includes(q);
        const matchTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchPrompt || matchTags;
      }
      return true;
    });
  }, [prompts, selectedCategory, selectedStatus, featuredOnly, searchQuery]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE));
  const paginatedPrompts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPrompts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPrompts, currentPage]);

  const handleCopyPrompt = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopiedId(prompt.id);
      success('Copied Prompt', `Copied prompt instructions to clipboard.`);
      await incrementPromptCopyCount(prompt.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleTogglePublish = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';
      const nextStatus = await togglePublishPrompt(prompt.id, prompt.status, prompt.title, actorEmail, actorUid);
      success(
        nextStatus === 'published' ? 'Prompt Published' : 'Prompt Moved to Drafts',
        `"${prompt.title}" is now ${nextStatus}.`
      );
      onRefresh();
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  const handleToggleFeatured = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';
      const nextFeatured = await toggleFeaturedPrompt(prompt.id, prompt.featured, prompt.title, actorEmail, actorUid);
      success(
        nextFeatured ? 'Featured in Hero' : 'Removed from Featured',
        `"${prompt.title}" updated.`
      );
      onRefresh();
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!promptToDelete) return;
    setIsDeleting(true);
    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';
      await deletePrompt(promptToDelete.id, promptToDelete.title, actorEmail, actorUid);
      success('Prompt Deleted', `"${promptToDelete.title}" has been removed from library.`);
      setPromptToDelete(null);
      onRefresh();
    } catch (err: any) {
      error('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search & Filter Toolbar */}
      <div className="bg-[#12131C] border border-[#222436] p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search prompts by title, keywords, tags, or prompt text..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#181A26] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#181A26] border border-[#272A3E] rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#181A26] border border-[#272A3E] rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Featured Toggle button */}
          <button
            type="button"
            onClick={() => {
              setFeaturedOnly(!featuredOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              featuredOnly
                ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                : 'bg-[#181A26] text-slate-400 border-[#272A3E] hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${featuredOnly ? 'fill-lime-400 text-lime-400' : ''}`} />
            <span>Featured</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-[#181A26] p-1 rounded-xl border border-[#272A3E]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Empty, or Prompts */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#12131C] border border-[#222436] rounded-2xl p-4 animate-pulse space-y-4"
            >
              <div className="aspect-[4/3] bg-[#1F2133] rounded-xl" />
              <div className="h-4 bg-[#1F2133] rounded w-3/4" />
              <div className="h-3 bg-[#1F2133] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Prompts Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || featuredOnly
                ? 'No prompts match the applied filters or search criteria. Try resetting filters.'
                : 'Your prompt library is empty. Create your first studio prompt to populate the catalogue.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewPrompt}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Prompt</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPrompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => onPreviewPrompt(prompt)}
              className="group bg-[#13141F] hover:bg-[#161826] border border-[#222436] hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-200 shadow-lg flex flex-col cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div className="aspect-[16/10] relative bg-black/50 overflow-hidden">
                <img
                  src={
                    prompt.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                      prompt.status === 'published'
                        ? 'bg-emerald-500/90 text-white'
                        : prompt.status === 'draft'
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-slate-700/90 text-slate-200'
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

                {/* Copy prompt quick button */}
                <button
                  type="button"
                  onClick={(e) => handleCopyPrompt(prompt, e)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-purple-600 backdrop-blur-md text-slate-200 hover:text-white transition-all cursor-pointer shadow-md"
                  title="Copy Prompt Instructions"
                >
                  {copiedId === prompt.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-400 font-medium mb-1">
                    <span className="truncate">{prompt.categoryName || 'General'}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {prompt.parameters?.aspectRatio || '1:1'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {prompt.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {prompt.description || prompt.promptText}
                  </p>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="pt-3 border-t border-[#222436] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                    <span>{prompt.copyCount} copies</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle publish */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePublish(prompt, e)}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        prompt.status === 'published'
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-slate-400 hover:bg-slate-700/20'
                      }`}
                      title={prompt.status === 'published' ? 'Unpublish to draft' : 'Publish to live app'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Toggle feature */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFeatured(prompt, e)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        prompt.featured
                          ? 'text-lime-400 hover:bg-lime-400/10'
                          : 'text-slate-400 hover:bg-slate-700/20'
                      }`}
                      title="Toggle Featured"
                    >
                      <Star className={`w-4 h-4 ${prompt.featured ? 'fill-lime-400' : ''}`} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPrompt(prompt);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPromptToDelete(prompt);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-[#161826] border-b border-[#222436] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Prompt</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Engine / AR</th>
                  <th className="px-4 py-3.5 text-center">Copies</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222436]">
                {paginatedPrompts.map((prompt) => (
                  <tr
                    key={prompt.id}
                    onClick={() => onPreviewPrompt(prompt)}
                    className="hover:bg-[#181A28] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            prompt.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'
                          }
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-black/40 border border-[#272A3E]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-xs">{prompt.title}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{prompt.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-purple-300 whitespace-nowrap">
                      {prompt.categoryName || 'Unassigned'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            prompt.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : prompt.status === 'draft'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}
                        >
                          {prompt.status}
                        </span>
                        {prompt.featured && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-lime-400/20 text-lime-400 border border-lime-400/30">
                            ★
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400 whitespace-nowrap">
                      <div>{prompt.parameters?.modelEngine || 'Midjourney'}</div>
                      <div className="text-[11px] text-slate-500">{prompt.parameters?.aspectRatio || '1:1'}</div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-center font-mono text-slate-300">
                      {prompt.copyCount}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPrompt(prompt, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222436] transition-colors"
                          title="Copy prompt"
                        >
                          {copiedId === prompt.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPrompt(prompt);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222436] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPromptToDelete(prompt);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPrompts.length)} of {filteredPrompts.length} prompts
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-[#12131C] border border-[#222436] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-3 py-1 bg-[#12131C] rounded-lg border border-[#222436] text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-[#12131C] border border-[#222436] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(promptToDelete)}
        title="Delete Prompt?"
        message={`Are you sure you want to permanently delete "${promptToDelete?.title}"? This action removes the prompt from Firestore and cannot be undone.`}
        confirmLabel="Delete Prompt"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPromptToDelete(null)}
      />
    </div>
  );
};
