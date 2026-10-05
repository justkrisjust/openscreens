import React from 'react';
import { Lock, X, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const LockedFeatureModal: React.FC = () => {
  const { lockedFeatureNotice, hideLockedFeature } = useUIStore();

  if (!lockedFeatureNotice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={hideLockedFeature}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          {lockedFeatureNotice} (Coming Soon)
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          This feature is intentionally designated as out of scope for the client-side prototype.
          In OpenScreens 2.0, you will be able to export your multi-model teams to cloud runtimes
          and trade community skills directly.
        </p>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Currently in Prototype Mode: Focus on local multi-bot coordination and the Memory Box!</span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={hideLockedFeature}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
