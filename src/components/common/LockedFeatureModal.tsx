import React from 'react';
import { Lock, X, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const LockedFeatureModal: React.FC = () => {
  const { lockedFeatureNotice, hideLockedFeature } = useUIStore();

  if (!lockedFeatureNotice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative transition-colors duration-200">
        <button
          onClick={hideLockedFeature}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
          {lockedFeatureNotice} (Coming Soon)
        </h3>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
          This feature is intentionally designated as out of scope for the client-side prototype.
          In OpenScreens 2.0, you will be able to export your multi-model teams to cloud runtimes
          and trade community skills directly.
        </p>

        <div className="p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Currently in Prototype Mode: Focus on local multi-bot coordination and the Memory Box!</span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={hideLockedFeature}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
