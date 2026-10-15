import React, { useState, useEffect } from 'react';
import { ScrollText, Search, RefreshCw, Sparkles, FolderTree, Radio, Settings2, Shield, Clock } from 'lucide-react';
import { AdminActivityLog } from '../../types';
import { fetchRecentActivityLogs } from '../../services/activityService';

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRecentActivityLogs(100);
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'prompt':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'category':
        return <FolderTree className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ads':
        return <Radio className="w-3.5 h-3.5 text-lime-400" />;
      case 'settings':
        return <Settings2 className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.startsWith('CREATE')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    }
    if (action.startsWith('DELETE')) {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
    }
    if (action.startsWith('PUBLISH')) {
      return 'bg-lime-400/15 text-lime-400 border-lime-400/20';
    }
    return 'bg-purple-500/15 text-purple-300 border-purple-500/20';
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        log.targetTitle.toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-[#12131C] border border-[#222436] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-purple-400" /> Administrative Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real Firestore-persisted audit trail (<code className="text-purple-300 font-mono">adminActivityLogs</code>). Logs are append-only and cannot be mutated or deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#181A26] hover:bg-[#222436] border border-[#272A3E] text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#12131C] border border-[#222436] p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by admin email, item name, or description..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#181A26] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 text-xs bg-[#181A26] border border-[#272A3E] rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="all">All Action Types</option>
          <option value="CREATE_PROMPT">Create Prompt</option>
          <option value="UPDATE_PROMPT">Update Prompt</option>
          <option value="DELETE_PROMPT">Delete Prompt</option>
          <option value="PUBLISH_PROMPT">Publish Prompt</option>
          <option value="UNPUBLISH_PROMPT">Unpublish Prompt</option>
          <option value="CREATE_CATEGORY">Create Category</option>
          <option value="UPDATE_CATEGORY">Update Category</option>
          <option value="DELETE_CATEGORY">Delete Category</option>
          <option value="UPDATE_ADS_CONFIG">Update Ads Config</option>
          <option value="UPDATE_APP_SETTINGS">Update App Settings</option>
        </select>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-6 bg-[#1F2133] rounded w-1/4" />
          <div className="h-10 bg-[#1F2133] rounded" />
          <div className="h-10 bg-[#1F2133] rounded" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <ScrollText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Activity Recorded Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Administrative operations such as creating or editing prompts, updating categories, and changing ad settings will be logged here.
          </p>
        </div>
      ) : (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-[#161826] border-b border-[#222436] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Admin Actor</th>
                  <th className="px-4 py-3.5">Details</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222436]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#181A28] transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(log.targetType)}
                        <span className="font-semibold text-white truncate max-w-xs">{log.targetTitle}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {log.actorEmail}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400 max-w-md truncate">
                      {log.details || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
