import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Copy, Check } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string, details?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string, details?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, details?: string, duration = 5000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, message, details, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const error = useCallback((title: string, message?: string, details?: string) => {
    showToast('error', title, message, details, 8000);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  const handleCopyDetails = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
                isSuccess
                  ? 'bg-[#121B16]/95 border-[#10B981]/40 text-emerald-100'
                  : isError
                  ? 'bg-[#1F1216]/95 border-[#EF4444]/40 text-rose-100'
                  : isWarning
                  ? 'bg-[#1F1912]/95 border-[#F59E0B]/40 text-amber-100'
                  : 'bg-[#151726]/95 border-[#8B5CF6]/40 text-slate-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {toast.type === 'info' && <Info className="w-5 h-5 text-purple-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white tracking-tight">{toast.title}</h4>
                  {toast.message && (
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
                  )}
                  {toast.details && (
                    <div className="mt-2 text-[11px] font-mono bg-black/40 p-2 rounded border border-white/10 max-h-32 overflow-y-auto">
                      <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                        <span>Details:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDetails(toast.id, toast.details!)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedId === toast.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-slate-300">{toast.details}</pre>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
