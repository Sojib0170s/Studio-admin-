import React, { useEffect, useState } from 'react';
import { Menu, Plus, RefreshCw, CheckCircle, AlertTriangle, Shield, Sparkles } from 'lucide-react';
import { testFirestoreConnection, isFirebaseConfigured } from '../../lib/firebase';
import { NavTab } from './Sidebar';

interface TopBarProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onNewPromptClick: () => void;
  onRefreshData?: () => void;
  onOpenSetup?: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time metrics, prompt activity, and operational status' },
  prompts: { title: 'Prompt Library', subtitle: 'Manage AI photo-editing prompts, parameters, and visibility' },
  categories: { title: 'Taxonomy Categories', subtitle: 'Organize prompt styles and manage display sequences' },
  ads: { title: 'Start.io Ad Settings', subtitle: 'Remote advertising config, SDK format toggles, and test mode' },
  settings: { title: 'App Settings', subtitle: 'Branding, contact info, legal documents, and mobile cache' },
  users: { title: 'User Management', subtitle: 'Registered mobile app user accounts and security boundary' },
  activity: { title: 'Activity Audit Log', subtitle: 'Immutable administrative action history and audit trail' },
  setup: { title: 'Firebase & Security', subtitle: 'Connection diagnostics, security rules, and claim instructions' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onNewPromptClick,
  onRefreshData,
  onOpenSetup,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState('Checking Firestore...');

  const checkConnection = async () => {
    if (!isFirebaseConfigured()) {
      setConnectionStatus('error');
      setStatusMessage('Firebase unconfigured');
      return;
    }
    setConnectionStatus('checking');
    setStatusMessage('Connecting...');
    const res = await testFirestoreConnection();
    if (res.success) {
      setConnectionStatus('connected');
      setStatusMessage('Firestore Live');
    } else {
      setConnectionStatus('error');
      setStatusMessage('Connection Failed');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const tabInfo = TAB_TITLES[currentTab] || TAB_TITLES.dashboard;

  return (
    <header className="h-16 lg:h-20 bg-[#0E0F17]/80 backdrop-blur-md border-b border-[#222436] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1A1C29] lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {tabInfo.title}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            {tabInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Firestore Status Badge */}
        <button
          type="button"
          onClick={onOpenSetup}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
              : connectionStatus === 'checking'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-500/40'
          }`}
          title="Click to view Firebase setup & diagnostics"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'checking'
                ? 'bg-amber-400 animate-spin'
                : 'bg-rose-400'
            }`}
          />
          <span className="hidden md:inline font-mono text-[11px]">{statusMessage}</span>
        </button>

        {/* Refresh button */}
        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            className="p-2 rounded-xl bg-[#161824] hover:bg-[#1F2133] border border-[#272A3E] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Create Prompt CTA */}
        <button
          type="button"
          onClick={onNewPromptClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Prompt</span>
        </button>
      </div>
    </header>
  );
};
