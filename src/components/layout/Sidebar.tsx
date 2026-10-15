import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FolderTree,
  Radio,
  Settings2,
  Users,
  ScrollText,
  ShieldCheck,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'prompts'
  | 'categories'
  | 'ads'
  | 'settings'
  | 'users'
  | 'activity'
  | 'setup';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { adminUser, logout } = useAuth();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'prompts',
      label: 'Prompt Library',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <FolderTree className="w-5 h-5" />,
    },
    {
      id: 'ads',
      label: 'Start.io Ads',
      icon: <Radio className="w-5 h-5" />,
      badge: 'SDK',
    },
    {
      id: 'settings',
      label: 'App Settings',
      icon: <Settings2 className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: <ScrollText className="w-5 h-5" />,
    },
    {
      id: 'setup',
      label: 'Firebase & Security',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Rules',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0E0F17] border-r border-[#222436] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#222436]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-lime-400 p-0.5 shadow-lg shadow-purple-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0E0F17] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-white text-base tracking-tight">Prompt Studio</h1>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-lime-400 font-semibold font-mono">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161824]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-purple-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#1F2133] text-slate-300 border border-[#2B2F44]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#222436] bg-[#0A0B10]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-lime-500 p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-[#12131C] flex items-center justify-center text-xs font-bold text-white">
                {adminUser?.displayName?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminUser?.displayName || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {adminUser?.email || 'admin@promptstudio.ai'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                Verified Admin
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
