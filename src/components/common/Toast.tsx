import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useUIStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    warn: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    info: <Info className="w-4 h-4 text-indigo-400" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-800 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-800 text-rose-200',
    warn: 'bg-amber-950/90 border-amber-800 text-amber-200',
    info: 'bg-slate-900/90 border-slate-700 text-slate-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium ${
          bgStyles[toast.type]
        }`}
      >
        {icons[toast.type]}
        <span>{toast.message}</span>
        <button
          onClick={hideToast}
          className="ml-2 text-slate-400 hover:text-white p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
