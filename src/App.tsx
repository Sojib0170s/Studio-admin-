import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PromptList } from './components/prompts/PromptList';
import { PromptFormModal } from './components/prompts/PromptFormModal';
import { PromptPreviewModal } from './components/prompts/PromptPreviewModal';
import { CategoryList } from './components/categories/CategoryList';
import { CategoryFormModal } from './components/categories/CategoryFormModal';
import { StartIoAdsSettings } from './components/ads/StartIoAdsSettings';
import { AppSettingsView } from './components/settings/AppSettingsView';
import { UserManagementView } from './components/users/UserManagementView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { FirebaseSetupModal } from './components/setup/FirebaseSetupModal';
import { LoginView } from './components/auth/LoginView';
import { Prompt, Category, AdminActivityLog, StartIoAdSettings } from './types';
import { getPrompts } from './services/promptService';
import { getCategories } from './services/categoryService';
import { fetchRecentActivityLogs } from './services/activityService';
import { getStartIoSettings, DEFAULT_ADS_CONFIG } from './services/settingsService';
import { Sparkles, Loader2 } from 'lucide-react';

const AdminPanelApp: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { error: toastError } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [adSettings, setAdSettings] = useState<StartIoAdSettings>(DEFAULT_ADS_CONFIG);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Modal States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [previewingPrompt, setPreviewingPrompt] = useState<Prompt | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Load live data from Firestore
  const loadAllData = useCallback(async () => {
    if (!user || !isAdmin) return;

    setIsDataLoading(true);
    try {
      const [promptsData, categoriesData, logsData, adsData] = await Promise.allSettled([
        getPrompts(),
        getCategories(),
        fetchRecentActivityLogs(20),
        getStartIoSettings(),
      ]);

      if (promptsData.status === 'fulfilled') setPrompts(promptsData.value);
      if (categoriesData.status === 'fulfilled') setCategories(categoriesData.value);
      if (logsData.status === 'fulfilled') setActivityLogs(logsData.value);
      if (adsData.status === 'fulfilled') setAdSettings(adsData.value);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      toastError('Data Fetch Error', err.message);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, isAdmin, toastError]);

  useEffect(() => {
    if (user && isAdmin) {
      loadAllData();
    }
  }, [user, isAdmin, loadAllData]);

  // Loading state while verifying auth session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-slate-400 animate-pulse">
          Verifying Prompt Studio security claims...
        </p>
      </div>
    );
  }

  // Intercept unauthenticated or unauthorized users
  if (!user || !isAdmin) {
    return (
      <>
        <LoginView onOpenSetup={() => setIsSetupModalOpen(true)} />
        <FirebaseSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
        />
      </>
    );
  }

  // Admin user is verified -> render full Admin Panel
  return (
    <div className="min-h-screen bg-[#0A0B10] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'setup') {
            setIsSetupModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewPromptClick={() => {
            setEditingPrompt(null);
            setIsPromptModalOpen(true);
          }}
          onRefreshData={loadAllData}
          onOpenSetup={() => setIsSetupModalOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              prompts={prompts}
              categories={categories}
              activityLogs={activityLogs}
              adSettings={adSettings}
              isLoading={isDataLoading}
              onNavigate={(tab) => {
                if (tab === 'setup') setIsSetupModalOpen(true);
                else setCurrentTab(tab);
              }}
              onNewPrompt={() => {
                setEditingPrompt(null);
                setIsPromptModalOpen(true);
              }}
              onNewCategory={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
            />
          )}

          {currentTab === 'prompts' && (
            <PromptList
              prompts={prompts}
              categories={categories}
              isLoading={isDataLoading}
              onRefresh={loadAllData}
              onNewPrompt={() => {
                setEditingPrompt(null);
                setIsPromptModalOpen(true);
              }}
              onEditPrompt={(prompt) => {
                setEditingPrompt(prompt);
                setIsPromptModalOpen(true);
              }}
              onPreviewPrompt={(prompt) => {
                setPreviewingPrompt(prompt);
              }}
            />
          )}

          {currentTab === 'categories' && (
            <CategoryList
              categories={categories}
              isLoading={isDataLoading}
              onRefresh={loadAllData}
              onNewCategory={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setEditingCategory(cat);
                setIsCategoryModalOpen(true);
              }}
            />
          )}

          {currentTab === 'ads' && <StartIoAdsSettings />}

          {currentTab === 'settings' && <AppSettingsView prompts={prompts} />}

          {currentTab === 'users' && <UserManagementView />}

          {currentTab === 'activity' && <ActivityLogView />}
        </main>
      </div>

      {/* Prompt Create/Edit Modal */}
      <PromptFormModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
        }}
        onSaved={loadAllData}
        categories={categories}
        promptToEdit={editingPrompt}
      />

      {/* Prompt Full Preview Modal */}
      <PromptPreviewModal
        prompt={previewingPrompt}
        onClose={() => setPreviewingPrompt(null)}
        onEdit={(prompt) => {
          setEditingPrompt(prompt);
          setIsPromptModalOpen(true);
        }}
      />

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSaved={loadAllData}
        categoryToEdit={editingCategory}
      />

      {/* Firebase Diagnostics & Setup Modal */}
      <FirebaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminPanelApp />
      </AuthProvider>
    </ToastProvider>
  );
}
