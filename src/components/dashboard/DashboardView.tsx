import React from 'react';
import {
  Sparkles,
  FolderTree,
  CheckCircle2,
  FileEdit,
  Radio,
  Plus,
  ArrowUpRight,
  Clock,
  Layers,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Prompt, Category, AdminActivityLog, StartIoAdSettings } from '../../types';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  prompts: Prompt[];
  categories: Category[];
  activityLogs: AdminActivityLog[];
  adSettings: StartIoAdSettings;
  isLoading: boolean;
  onNavigate: (tab: NavTab) => void;
  onNewPrompt: () => void;
  onNewCategory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  prompts,
  categories,
  activityLogs,
  adSettings,
  isLoading,
  onNavigate,
  onNewPrompt,
  onNewCategory,
}) => {
  // Real Firestore metrics calculations
  const totalPrompts = prompts.length;
  const publishedPrompts = prompts.filter((p) => p.status === 'published').length;
  const draftPrompts = prompts.filter((p) => p.status === 'draft').length;
  const featuredPrompts = prompts.filter((p) => p.featured).length;
  const totalCopies = prompts.reduce((acc, p) => acc + (p.copyCount || 0), 0);
  const totalCategories = categories.length;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#12131C] border border-[#222436] rounded-2xl p-5 h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#12131C] border border-[#222436] rounded-2xl h-80" />
          <div className="bg-[#12131C] border border-[#222436] rounded-2xl h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prompts */}
        <div
          onClick={() => onNavigate('prompts')}
          className="bg-[#13141F] hover:bg-[#161826] border border-[#222436] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Prompts</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{totalPrompts}</span>
            <span className="text-xs text-purple-400 font-medium">in library</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{publishedPrompts} published</span>
            <span>•</span>
            <span className="text-amber-400">{draftPrompts} drafts</span>
          </div>
        </div>

        {/* Categories */}
        <div
          onClick={() => onNavigate('categories')}
          className="bg-[#13141F] hover:bg-[#161826] border border-[#222436] hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{totalCategories}</span>
            <span className="text-xs text-indigo-400 font-medium">genres active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {categories.filter((c) => c.isActive).length} visible on mobile app
          </div>
        </div>

        {/* Featured Prompts */}
        <div
          onClick={() => onNavigate('prompts')}
          className="bg-[#13141F] hover:bg-[#161826] border border-[#222436] hover:border-lime-500/40 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Featured In Hero</span>
            <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400 group-hover:bg-lime-400 group-hover:text-black transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{featuredPrompts}</span>
            <span className="text-xs text-lime-400 font-medium">prompts</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Top carousel highlights
          </div>
        </div>

        {/* Start.io Status */}
        <div
          onClick={() => onNavigate('ads')}
          className="bg-[#13141F] hover:bg-[#161826] border border-[#222436] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Start.io Ads</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-lg lg:text-xl font-extrabold tracking-tight ${
                adSettings.masterEnabled ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {adSettings.masterEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1F2133] text-slate-300">
              {adSettings.testMode ? 'Test Mode' : 'Live'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            Android ID: {adSettings.appIdAndroid || 'Not configured'}
          </div>
        </div>
      </div>

      {/* Center Layout: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt Studio Quick Actions & Top Categories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4">Quick Studio Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onNewPrompt}
                className="p-4 rounded-xl bg-[#161824] hover:bg-purple-600/20 border border-[#272A3E] hover:border-purple-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Create Prompt</h4>
                <p className="text-[11px] text-slate-400 mt-1">Publish new AI photo template</p>
              </button>

              <button
                type="button"
                onClick={onNewCategory}
                className="p-4 rounded-xl bg-[#161824] hover:bg-indigo-600/20 border border-[#272A3E] hover:border-indigo-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-2 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Add Category</h4>
                <p className="text-[11px] text-slate-400 mt-1">Create taxonomy grouping</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ads')}
                className="p-4 rounded-xl bg-[#161824] hover:bg-lime-600/20 border border-[#272A3E] hover:border-lime-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400 w-fit mb-2 group-hover:bg-lime-400 group-hover:text-black transition-colors">
                  <Radio className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Configure Ads</h4>
                <p className="text-[11px] text-slate-400 mt-1">Start.io mobile settings</p>
              </button>
            </div>
          </div>

          {/* Active Categories Preview */}
          <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Category Distribution</h3>
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                View all ({categories.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No categories created yet.</p>
            ) : (
              <div className="space-y-2.5">
                {categories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#161824] border border-[#222436]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span className="text-xs font-semibold text-white">{cat.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">/{cat.slug}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#1F2133] text-purple-300">
                      {cat.promptCount || 0} prompts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Real Recent Activity Log */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Full Log
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-300">No activity logged yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Create a prompt or update settings to generate confirmed audit logs.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 max-h-[380px] pr-1">
              {activityLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#161824] border border-[#222436] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase text-purple-400">
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{log.targetTitle}</p>
                  <p className="text-[11px] text-slate-400 truncate">{log.actorEmail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
