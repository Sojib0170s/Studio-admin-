import React, { useState, useEffect } from 'react';
import { Settings2, Save, Loader2, Sparkles, Mail, Shield, FileText, Globe } from 'lucide-react';
import { AppConfig, Prompt } from '../../types';
import { getAppConfig, saveAppConfig, DEFAULT_APP_CONFIG } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ImageUploader } from '../common/ImageUploader';

import { formatFirestoreError } from '../../lib/firebase';

interface AppSettingsViewProps {
  prompts: Prompt[];
}

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({ prompts }) => {
  const { adminUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getAppConfig();
      setConfig(data);
    } catch (err: any) {
      console.error('Failed to load app config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!config.appName.trim()) {
      errors.appName = 'App Name is required.';
    }

    if (!config.supportEmail.trim() || !config.supportEmail.includes('@')) {
      errors.supportEmail = 'Please provide a valid support email address.';
    }

    if (config.privacyPolicyUrl && !config.privacyPolicyUrl.startsWith('http')) {
      errors.privacyPolicyUrl = 'Privacy Policy URL must begin with http:// or https://';
    }

    if (config.termsUrl && !config.termsUrl.startsWith('http')) {
      errors.termsUrl = 'Terms of Service URL must begin with http:// or https://';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';

      await saveAppConfig(config, actorEmail, actorUid);
      success('Settings Saved', 'App branding and preferences saved to Firestore.');
    } catch (err: any) {
      console.error('Failed to save general app settings:', err);
      const formatted = formatFirestoreError(err);
      error(formatted.isPermissionDenied ? 'Permission Denied' : 'Save Failed', formatted.userFriendlyMessage, formatted.rawError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-8 animate-pulse space-y-4">
        <div className="h-6 bg-[#1F2133] rounded w-1/4" />
        <div className="h-40 bg-[#1F2133] rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#12131C] border border-[#222436] p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white">General Application Settings</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          These settings configure the branding, customer support links, and mobile display defaults for Prompt Studio.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Info */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#222436] pb-3">
            <Globe className="w-4 h-4 text-purple-400" /> App Identity & Branding
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Application Name *
              </label>
              <input
                type="text"
                required
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                placeholder="Prompt Studio"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
              {validationErrors.appName && (
                <p className="mt-1 text-xs text-rose-400">{validationErrors.appName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                placeholder="AI Photo-Editing Prompt Library"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              App Description
            </label>
            <textarea
              rows={2}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Curated high-resolution studio photo prompts for Midjourney, Flux.1, and Stable Diffusion..."
              className="w-full px-3.5 py-2 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Logo Uploader */}
          <ImageUploader
            currentUrl={config.logoUrl}
            folder="branding"
            onImageSelected={(url) => setConfig({ ...config, logoUrl: url })}
          />
        </div>

        {/* Contact & Legal Documents */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#222436] pb-3">
            <Mail className="w-4 h-4 text-purple-400" /> Support & Legal Policies
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                placeholder="support@promptstudio.ai"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
              {validationErrors.supportEmail && (
                <p className="mt-1 text-xs text-rose-400">{validationErrors.supportEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={config.privacyPolicyUrl}
                onChange={(e) => setConfig({ ...config, privacyPolicyUrl: e.target.value })}
                placeholder="https://promptstudio.ai/privacy"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
              {validationErrors.privacyPolicyUrl && (
                <p className="mt-1 text-xs text-rose-400">{validationErrors.privacyPolicyUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Terms of Service URL
              </label>
              <input
                type="url"
                value={config.termsUrl}
                onChange={(e) => setConfig({ ...config, termsUrl: e.target.value })}
                placeholder="https://promptstudio.ai/terms"
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
              {validationErrors.termsUrl && (
                <p className="mt-1 text-xs text-rose-400">{validationErrors.termsUrl}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Display Defaults */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#222436] pb-3">
            <Sparkles className="w-4 h-4 text-purple-400" /> Mobile Catalogue Preferences
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Default Sort Order
              </label>
              <select
                value={config.defaultSort}
                onChange={(e) => setConfig({ ...config, defaultSort: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Copied (Popular)</option>
                <option value="featured">Featured First</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Hero Featured Prompt
              </label>
              <select
                value={config.heroPromptId || ''}
                onChange={(e) => setConfig({ ...config, heroPromptId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">Auto-select newest featured</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Client Cache TTL (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={config.cacheTtlMinutes}
                onChange={(e) => setConfig({ ...config, cacheTtlMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save App Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
