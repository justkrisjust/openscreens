import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { wipeAllData } from '../../services/storage';
import { useAuthStore } from '../../stores/useAuthStore';
import { lockManager } from '../../services/lockManager';

export const WipeDataModal: React.FC = () => {
  const { isWipeDataModalOpen, setWipeDataModalOpen, showToast } = useUIStore();
  const { wipeAllKeys } = useAuthStore();
  const [isWiping, setIsWiping] = useState(false);

  if (!isWipeDataModalOpen) return null;

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      lockManager.clearAll();
      await wipeAllKeys();
      await wipeAllData();
      showToast('All local data, encrypted keys, and project files successfully wiped.', 'success');
      setWipeDataModalOpen(false);
      // Reload page to reset state completely
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast('Failed to wipe data cleanly.', 'error');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative transition-colors duration-200">
        <button
          onClick={() => setWipeDataModalOpen(false)}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
          Wipe All Local Data?
        </h3>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
          This will permanently purge all IndexedDB storage, encrypted API keys, virtual memory
          files, and custom bots from this browser. This action is irreversible.
        </p>

        <div className="p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Purges IndexedDB (<code className="text-[var(--text-main)] font-semibold">openscreens_db</code>)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Clears WebCrypto keys and session tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Wipes local & session storage</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setWipeDataModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-panel)] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmWipe}
            disabled={isWiping}
            className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isWiping ? 'Wiping Data...' : 'Wipe Everything'}
          </button>
        </div>
      </div>
    </div>
  );
};
