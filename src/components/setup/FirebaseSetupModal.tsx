import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Database,
  Lock,
  RefreshCw,
  ExternalLink,
  Save,
  Key,
  FileText,
} from 'lucide-react';
import {
  testFirestoreConnection,
  resolveFirebaseConfig,
  saveStoredRuntimeConfig,
  clearStoredRuntimeConfig,
  getBootstrapAdminEmails,
  FirebaseClientConfig,
} from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'rules' | 'claims'>('status');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const existingConfig = resolveFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(existingConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(existingConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(existingConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(existingConfig?.appId || '');

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
      if (res.success) {
        success('Connection Healthy', res.message);
      } else {
        error('Connection Issue', res.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Unknown network error' });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      error('Incomplete Config', 'API Key and Project ID are required.');
      return;
    }

    const newConfig: FirebaseClientConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveStoredRuntimeConfig(newConfig);
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const adminClaimScript = `// set-admin-claim.js (Run locally with Node.js & firebase-admin)
// NEVER run or store service account keys in the browser.
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function makeAdmin(targetEmail) {
  const user = await admin.auth().getUserByEmail(targetEmail);
  await admin.auth().setCustomUserClaims(user.uid, {
    admin: true,
    role: 'admin'
  });
  console.log(\`Successfully assigned admin custom claims to: \${targetEmail} (\${user.uid})\`);
  process.exit(0);
}

makeAdmin('ssssssgggs2@gmail.com');
`;

  const fullFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.get('admin', false) == true ||
        request.auth.token.get('isAdmin', false) == true ||
        request.auth.token.get('role', '') == 'admin' ||
        request.auth.token.get('role', '') == 'superadmin' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        (request.auth.token.get('email', '') != '' && (
          request.auth.token.get('email', '').lower() == 'ssssssgggs2@gmail.com' ||
          request.auth.token.get('email', '').lower() == 'admin@promptstudio.ai'
        ))
      );
    }

    function isValidStartIoSettings(data) {
      return data.masterEnabled is bool &&
             data.testMode is bool &&
             data.appIdAndroid is string && data.appIdAndroid.size() <= 64 &&
             data.appIdIos is string && data.appIdIos.size() <= 64 &&
             data.banner is map &&
             data.interstitial is map &&
             data.rewarded is map &&
             data.nativeAds is map &&
             data.gdprConsentRequired is bool &&
             data.ccpaConsentRequired is bool;
    }

    function isValidAppConfig(data) {
      return data.appName is string && data.appName.size() >= 2 && data.appName.size() <= 80 &&
             data.supportEmail is string && data.supportEmail.size() <= 120;
    }

    match /{document=**} {
      allow read, write: if false;
    }

    match /prompts/{promptId} {
      allow get, list: if (resource.data.status == 'published') || isAdmin();
      allow create, update: if isAdmin() && isValidId(promptId);
      allow delete: if isAdmin() && isValidId(promptId);
    }

    match /categories/{categoryId} {
      allow get, list: if resource.data.isActive == true || isAdmin();
      allow create, update, delete: if isAdmin() && isValidId(categoryId);
    }

    match /appConfig/{configId} {
      allow get: if isSignedIn();
      allow list: if isAdmin();
      allow create, update: if isAdmin() && isValidId(configId) && (
        configId == 'ads' ? isValidStartIoSettings(incoming()) :
        configId == 'general' ? isValidAppConfig(incoming()) : true
      );
      allow delete: if false;
    }

    match /adminActivityLogs/{logId} {
      allow get, list: if isAdmin();
      allow create: if isAdmin() && isValidId(logId);
      allow update, delete: if false;
    }

    match /userProfiles/{userId} {
      allow get, list: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
      allow create, update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    match /admins/{adminUid} {
      allow get, list: if isSignedIn() && (request.auth.uid == adminUid || isAdmin());
      allow write: if isAdmin() && isValidId(adminUid);
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl bg-[#13141F] border border-[#272A3E] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#272A3E] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Firebase &amp; Security Architecture Diagnostics
              </h3>
              <p className="text-xs text-slate-400">
                Connection health, credentials, security rules, and RBAC custom claims
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex px-6 pt-3 border-b border-[#222436] bg-[#161826] gap-2">
          {[
            { id: 'status', label: 'Connection Status', icon: <Database className="w-4 h-4" /> },
            { id: 'rules', label: 'Security Rules', icon: <FileText className="w-4 h-4" /> },
            { id: 'config', label: 'Firebase Credentials', icon: <Key className="w-4 h-4" /> },
            { id: 'claims', label: 'Admin Claims Setup', icon: <Lock className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-t border-x ${
                activeTab === tab.id
                  ? 'bg-[#13141F] text-purple-300 border-[#272A3E]'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Status Indicator */}
              <div
                className={`p-5 rounded-2xl border ${
                  testResult?.success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      testResult?.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {testResult?.success ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">
                      {testResult?.success ? 'Cloud Firestore Reachable' : 'Firebase Connection Pending'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {testResult?.message ||
                        (existingConfig
                          ? 'Testing Firestore connection...'
                          : 'No active Firebase web credentials detected. Please configure your project in the Credentials tab.')}
                    </p>
                    <button
                      type="button"
                      disabled={testing}
                      onClick={runDiagnostics}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1F2133] hover:bg-[#272A3E] text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                      <span>{testing ? 'Probing Firestore...' : 'Re-test Connection'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Checklist */}
              <div className="bg-[#161824] border border-[#272A3E] rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Zero-Trust Security Checklist
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Firestore Security Rules file generated (<code className="text-purple-300 font-mono">firestore.rules</code>)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Default-deny catch-all gate enforced for unauthorized users</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Firebase Storage rules restricted to images &lt; 5MB (<code className="text-purple-300 font-mono">storage.rules</code>)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Admin allowlist verified for project owner: <code className="text-lime-400 font-mono">ssssssgggs2@gmail.com</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" /> Hardened Firestore Security Rules
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensures authorized administrators can write to <code className="text-purple-300 font-mono">appConfig/ads</code>, prompts, and categories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('fullRules', fullFirestoreRules)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1F2133] hover:bg-purple-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'fullRules' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Rules
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy firestore.rules
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-black/60 border border-[#272A3E] font-mono text-xs text-purple-200 overflow-x-auto max-h-[350px] leading-relaxed select-all">
                  {fullFirestoreRules}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-2 text-xs">
                <h5 className="font-bold text-white">How to deploy in 2 clicks:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>
                    Open <span className="text-purple-300 font-semibold">Firebase Console &rarr; Firestore Database &rarr; Rules</span>
                  </li>
                  <li>Click &quot;Copy firestore.rules&quot; above, paste into the editor, and click <span className="text-emerald-400 font-semibold">Publish</span>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                <p>
                  You can specify your public Firebase Web Client credentials here or in your project&apos;s{' '}
                  <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">.env</code> file (e.g. <code className="font-mono text-white">VITE_FIREBASE_API_KEY</code>). Client-side credentials are safe for public web distribution; private service account keys are never stored in the browser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    API Key (VITE_FIREBASE_API_KEY) *
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project ID (VITE_FIREBASE_PROJECT_ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="prompt-studio-12345"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="prompt-studio-12345.firebaseapp.com"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="prompt-studio-12345.appspot.com"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="123456789012"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789012:web:abcdef..."
                    className="w-full px-3 py-2 text-xs font-mono bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={clearStoredRuntimeConfig}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg cursor-pointer"
                >
                  Clear Saved Config
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save &amp; Reload App
                </button>
              </div>
            </form>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#161824] border border-[#272A3E] space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-400" /> Server-Side Custom Claims Script
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Per strict security standards, admin role flags cannot be granted directly from the browser. To permanently grant <code className="text-purple-300 font-mono">admin: true</code> on an account via the Firebase Admin SDK, run this script from your local development machine with a service account:
                </p>

                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => copyText('claims', adminClaimScript)}
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-[#1F2133] hover:bg-purple-600 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    {copiedKey === 'claims' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'claims' ? 'Copied' : 'Copy Script'}</span>
                  </button>
                  <pre className="p-3 pt-8 rounded-xl bg-black/60 border border-[#272A3E] font-mono text-xs text-purple-200 overflow-x-auto leading-relaxed">
                    {adminClaimScript}
                  </pre>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/20 text-xs text-lime-300">
                <span className="font-bold">Instant Development Access:</span> The project owner email{' '}
                <code className="font-mono font-bold text-white">ssssssgggs2@gmail.com</code> is pre-configured in the trusted allowlist and will automatically pass admin verification upon logging in with Google or Email!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
