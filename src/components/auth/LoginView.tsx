import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Settings2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onOpenSetup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenSetup }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    isLoading,
    authError,
    isConfigured,
    user,
    adminUser,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch {
      // Auth error is captured in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      // Auth error captured in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is authenticated but not an admin:
  if (user && !adminUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#13141F] border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <span className="font-mono text-purple-300 font-semibold">{user.email}</span>, but this account lacks verified Administrator privileges for Prompt Studio.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1C29] border border-[#272A3E] text-left space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Administrative Security Rule:
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ordinary accounts are restricted from accessing admin routes. To access this dashboard, sign in with the verified project owner address (<code className="text-lime-400 font-mono">ssssssgggs2@gmail.com</code>) or have a super admin grant custom claims via the Firebase Admin SDK.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-[#1F2133] hover:bg-[#272A3E] text-white transition-colors cursor-pointer"
            >
              Sign Out &amp; Switch Account
            </button>
            <button
              type="button"
              onClick={onOpenSetup}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              View Firebase Configuration &amp; Allowlist &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-lime-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#13141F]/90 backdrop-blur-xl border border-[#272A3E] rounded-3xl p-8 shadow-2xl text-slate-100 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-lime-400 p-0.5 shadow-xl shadow-purple-600/20 mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-[#13141F] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">Prompt Studio</h2>
          <p className="text-xs text-slate-400">
            Secure Admin Panel for AI Photo-Editing Prompt Library
          </p>
        </div>

        {/* Missing Firebase Config Notice */}
        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Firebase Configuration Required</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-300/90">
              Please connect your Firebase project credentials to enable authentication, Firestore storage, and image uploads.
            </p>
            <button
              type="button"
              onClick={onOpenSetup}
              className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Configure Firebase Credentials</span>
            </button>
          </div>
        )}

        {/* Error Notification */}
        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        {/* Google One-Click Login */}
        <button
          type="button"
          disabled={isSubmitting || isLoading || !isConfigured}
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-white hover:bg-slate-100 text-slate-900 shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#272A3E] w-full" />
          <span className="bg-[#13141F] px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 absolute">
            Or with email
          </span>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@promptstudio.ai"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#1A1C29] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !isConfigured}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In as Admin' : 'Create Admin Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between login and registration */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#222436]">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="hover:text-purple-400 transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>

          <button
            type="button"
            onClick={onOpenSetup}
            className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-mono text-[11px]"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Setup</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-6 text-xs text-slate-400 text-center font-mono">
        Prompt Studio Admin • Zero-Trust Firebase Firestore &amp; Auth
      </p>
    </div>
  );
};
