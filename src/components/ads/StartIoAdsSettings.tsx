import React, { useState, useEffect } from 'react';
import {
  Radio,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code2,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { StartIoAdSettings } from '../../types';
import { getStartIoSettings, saveStartIoSettings, DEFAULT_ADS_CONFIG } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFirestoreError, FormattedFirestoreError } from '../../lib/firebase';

export const StartIoAdsSettings: React.FC = () => {
  const { adminUser } = useAuth();
  const { success, error } = useToast();

  const [settings, setSettings] = useState<StartIoAdSettings>(DEFAULT_ADS_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [permissionAlert, setPermissionAlert] = useState<FormattedFirestoreError | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getStartIoSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load Start.io settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setPermissionAlert(null);

    try {
      const actorEmail = adminUser?.email || 'admin@promptstudio.ai';
      const actorUid = adminUser?.uid || 'system';

      await saveStartIoSettings(settings, actorEmail, actorUid);
      success('Settings Saved', 'Start.io remote configuration saved to Firestore.');
    } catch (err: any) {
      console.error('Failed to save Start.io settings:', err);
      const formatted = formatFirestoreError(err);
      if (formatted.isPermissionDenied) {
        setPermissionAlert(formatted);
        error('Permission Denied', formatted.userFriendlyMessage, formatted.rawError);
      } else {
        error('Save Failed', formatted.userFriendlyMessage, formatted.rawError);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyCodeSnippet = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const gradleSnippet = `// In app/build.gradle (Android Prompt Studio)
dependencies {
    implementation("com.startapp:inapp-sdk:5.1.0")
}`;

  const initSnippet = `// In Application.kt or MainActivity.kt
import com.startapp.sdk.adsbase.StartAppSDK
import com.startapp.sdk.adsbase.StartAppAd

// Initialize with Start.io App ID remote config:
val appId = "${settings.appIdAndroid || 'YOUR_STARTIO_APP_ID'}"
val returnAds = ${settings.masterEnabled ? 'true' : 'false'}

StartAppSDK.init(this, appId, returnAds)
${settings.testMode ? 'StartAppSDK.setTestAds(true)' : '// Production live ads'}
`;

  if (isLoading) {
    return (
      <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-8 animate-pulse space-y-4">
        <div className="h-6 bg-[#1F2133] rounded w-1/3" />
        <div className="h-32 bg-[#1F2133] rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Important Disclaimer Banner as mandated by rules */}
      <div className="bg-[#181A28] border border-purple-500/30 rounded-2xl p-5 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Start.io Mobile Ad Network Remote Configuration
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-lime-400/10 text-lime-400 border border-lime-400/20">
                Official SDK
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This panel manages the remote ad configuration document (
              <code className="text-purple-300 font-mono">appConfig/ads</code>) ingested by the Prompt Studio Android mobile app. Saving these settings configures your remote parameters. Real in-app ads require compiling the official Start.io Android SDK (<code className="font-mono text-purple-300">com.startapp:inapp-sdk</code>) into your native Android APK/AAB build, initializing it with your Start.io Portal App ID, and ensuring GDPR/CCPA privacy compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Permission Denied Troubleshooting Alert */}
      {permissionAlert && (
        <div className="bg-[#1F1216] border border-rose-500/50 rounded-2xl p-5 text-slate-200 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Firestore Permission Denied on <code className="text-rose-300 font-mono text-xs bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">appConfig/ads</code>
                </h4>
                <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  Rules Verification Required
                </span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Your authenticated account (<span className="font-mono font-semibold text-white">{permissionAlert.actorEmail || adminUser?.email || 'unauthenticated'}</span>) was rejected by the security rules deployed in your Firebase project.
              </p>
            </div>
          </div>

          <div className="bg-black/60 border border-rose-500/20 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Required Firestore Security Rule:</span>
              <button
                type="button"
                onClick={() =>
                  copyCodeSnippet(
                    'rule',
                    `match /appConfig/{configId} {\n  allow get: if request.auth != null;\n  allow create, update: if request.auth != null && (\n    request.auth.token.admin == true ||\n    request.auth.token.role == 'admin' ||\n    request.auth.token.email.lower() in ['ssssssgggs2@gmail.com', 'admin@promptstudio.ai']\n  );\n}`
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#272A3E] hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                {copiedCode === 'rule' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied Rule
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Rule Snippet
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-purple-200 overflow-x-auto p-2.5 bg-black/40 rounded-lg border border-[#272A3E]">
{`match /appConfig/{configId} {
  allow get: if request.auth != null;
  allow create, update: if request.auth != null && (
    request.auth.token.admin == true ||
    request.auth.token.role == 'admin' ||
    request.auth.token.email.lower() in ['ssssssgggs2@gmail.com', 'admin@promptstudio.ai']
  );
}`}
            </pre>
            <p className="text-[11px] text-slate-400">
              <strong className="text-slate-200">How to fix in Firebase Console:</strong> Open <span className="text-purple-300 font-semibold">Firebase Console &rarr; Firestore Database &rarr; Rules</span>, ensure this rule block is present, and click <span className="text-emerald-400 font-semibold">Publish</span>.
            </p>
          </div>
        </div>
      )}

      {/* Admin Authorization Status Card */}
      <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <span className="text-slate-400 font-medium">Signed-in Admin:</span>{' '}
            <span className="font-semibold text-white font-mono">{adminUser?.email || 'Not authenticated'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[10px] font-semibold">
            {adminUser?.adminSource ? `Verified via ${adminUser.adminSource}` : 'Allowlist Verified'}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Target Path: <span className="text-purple-400 font-semibold">appConfig/ads</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Master Switches Card */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-6 shadow-lg">
          <div className="border-b border-[#222436] pb-4">
            <h4 className="text-sm font-bold text-white">Master Switches & Network Control</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Control whether mobile devices show ads and toggle developer test mode.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Master Switch */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                settings.masterEnabled
                  ? 'bg-purple-600/10 border-purple-500/40 text-white'
                  : 'bg-[#161824] border-[#272A3E] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold block text-white">Master Ads Switch</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {settings.masterEnabled ? 'Ads Enabled on mobile clients' : 'All mobile ads suspended'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.masterEnabled}
                    onChange={(e) => setSettings({ ...settings, masterEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#272A3E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            </div>

            {/* Test Mode */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                settings.testMode
                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                  : 'bg-[#161824] border-[#272A3E] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">SDK Test Mode</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-400 text-black rounded uppercase">
                      Recommended for Dev
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {settings.testMode
                      ? 'Test ads served without invalid clicks risk'
                      : 'Live revenue ads (Google Play release only)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.testMode}
                    onChange={(e) => setSettings({ ...settings, testMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#272A3E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Identifiers Card */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-[#222436] pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" /> Platform Start.io App IDs
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Obtained from your official Start.io Developer Portal account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Android Start.io App ID *
              </label>
              <input
                type="text"
                value={settings.appIdAndroid}
                onChange={(e) => setSettings({ ...settings, appIdAndroid: e.target.value })}
                placeholder="e.g. 208765432"
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Found in Start.io Publisher Dashboard under &quot;My Apps&quot; &rarr; Android.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                iOS Start.io App ID (Optional)
              </label>
              <input
                type="text"
                value={settings.appIdIos}
                onChange={(e) => setSettings({ ...settings, appIdIos: e.target.value })}
                placeholder="e.g. 108765432"
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Used if Prompt Studio expands to iOS.
              </p>
            </div>
          </div>
        </div>

        {/* Official Supported Ad Formats */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-[#222436] pb-3">
            <h4 className="text-sm font-bold text-white">Supported Start.io Ad Formats</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure parameters for official formats supported by StartApp SDK: Banner, Interstitial, and Rewarded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Banner Ads */}
            <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Standard Banner</span>
                <input
                  type="checkbox"
                  checked={settings.banner.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      banner: { ...settings.banner, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
              </div>
              <p className="text-xs text-slate-400">
                Persistent banner rendered at bottom of prompt detail screen.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Refresh Rate (seconds)
                </label>
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={settings.banner.refreshRateSeconds || 30}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      banner: {
                        ...settings.banner,
                        refreshRateSeconds: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-lg text-white"
                />
              </div>
            </div>

            {/* Interstitial Ads */}
            <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Interstitial Ads</span>
                <input
                  type="checkbox"
                  checked={settings.interstitial.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      interstitial: { ...settings.interstitial, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
              </div>
              <p className="text-xs text-slate-400">
                Full-screen interstitial shown during user prompt transitions.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Display Frequency (per N copies)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.interstitial.frequencyInterval || 3}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      interstitial: {
                        ...settings.interstitial,
                        frequencyInterval: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-lg text-white"
                />
              </div>
            </div>

            {/* Rewarded Video */}
            <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Rewarded Video</span>
                <input
                  type="checkbox"
                  checked={settings.rewarded.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rewarded: { ...settings.rewarded, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                />
              </div>
              <p className="text-xs text-slate-400">
                User watches video ad to unlock premium VIP photo prompts.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Reward Item Description
                </label>
                <input
                  type="text"
                  value={settings.rewarded.rewardItem || 'Unlock 5 VIP Prompts'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rewarded: {
                        ...settings.rewarded,
                        rewardItem: e.target.value,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1A1C29] border border-[#272A3E] rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Legal Consent Switches */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-3 shadow-lg">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-lime-400" /> Privacy & Consent Compliance
          </h4>
          <p className="text-xs text-slate-400">
            Start.io SDK requires explicit user consent management in EEA and California regions to comply with Google Play Policies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#161824] border border-[#272A3E] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.gdprConsentRequired}
                onChange={(e) => setSettings({ ...settings, gdprConsentRequired: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 accent-purple-600"
              />
              <span className="text-xs font-semibold text-slate-200">Enforce European GDPR Consent Dialog</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#161824] border border-[#272A3E] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ccpaConsentRequired}
                onChange={(e) => setSettings({ ...settings, ccpaConsentRequired: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 accent-purple-600"
              />
              <span className="text-xs font-semibold text-slate-200">Enforce California CCPA Compliance</span>
            </label>
          </div>
        </div>

        {/* Integration Code Guidance for Native Android Developers */}
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" /> Android Kotlin Integration Snippet
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy this code directly into your native Android app project to consume these Firestore remote settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyCodeSnippet('init', initSnippet)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F2133] hover:bg-purple-600 text-slate-200 transition-colors cursor-pointer"
            >
              {copiedCode === 'init' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Kotlin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-black/60 border border-[#272A3E] font-mono text-xs text-purple-200 overflow-x-auto leading-relaxed">
            {initSnippet}
          </pre>
        </div>

        {/* Save Bar */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Start.io Ad Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
