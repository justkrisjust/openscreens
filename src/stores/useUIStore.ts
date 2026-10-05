import { create } from 'zustand';

export type ActiveView = 'office' | 'bots' | 'projects' | 'keys' | 'compatibility' | 'preview';

interface UIState {
  activeView: ActiveView;
  isDarkMode: boolean;
  isWipeDataModalOpen: boolean;
  isNewBotModalOpen: boolean;
  isNewProjectModalOpen: boolean;
  lockedFeatureNotice: string | null;
  toast: { message: string; type: 'success' | 'info' | 'warn' | 'error' } | null;

  // Actions
  setActiveView: (view: ActiveView) => void;
  toggleTheme: () => void;
  setWipeDataModalOpen: (open: boolean) => void;
  setNewBotModalOpen: (open: boolean) => void;
  setNewProjectModalOpen: (open: boolean) => void;
  showLockedFeature: (featureName: string) => void;
  hideLockedFeature: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warn' | 'error') => void;
  hideToast: () => void;
}

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('openscreens_theme');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    return false;
  }
  document.documentElement.classList.add('dark');
  return true;
};

export const useUIStore = create<UIState>((set) => ({
  activeView: 'office',
  isDarkMode: getInitialDarkMode(),
  isWipeDataModalOpen: false,
  isNewBotModalOpen: false,
  isNewProjectModalOpen: false,
  lockedFeatureNotice: null,
  toast: null,

  setActiveView: (view) => set({ activeView: view }),

  toggleTheme: () => {
    set((state) => {
      const next = !state.isDarkMode;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('openscreens_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('openscreens_theme', 'light');
      }
      return { isDarkMode: next };
    });
  },

  setWipeDataModalOpen: (open) => set({ isWipeDataModalOpen: open }),
  setNewBotModalOpen: (open) => set({ isNewBotModalOpen: open }),
  setNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

  showLockedFeature: (featureName) => set({ lockedFeatureNotice: featureName }),
  hideLockedFeature: () => set({ lockedFeatureNotice: null }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((s) => (s.toast?.message === message ? { toast: null } : {}));
    }, 3500);
  },
  hideToast: () => set({ toast: null }),
}));
