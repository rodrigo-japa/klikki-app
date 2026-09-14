import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAuth();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      id="auth-toast-notification"
      role="alert"
      aria-live="assertive"
      className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10'
            : 'bg-red-50/95 border-red-300 text-red-950 shadow-red-900/10'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        )}

        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">
            {isSuccess ? 'Sucesso!' : 'Atenção'}
          </p>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={hideToast}
          aria-label="Fechar notificação"
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 -mt-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
