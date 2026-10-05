import React from 'react';
import {
  Shield,
  Trash2,
  Moon,
  Sun,
  Play,
  Key,
  CheckCircle2,
  FolderGit2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProjectStore } from '../../stores/useProjectStore';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isDarkMode,
    toggleTheme,
    setWipeDataModalOpen,
    showLockedFeature,
  } = useUIStore();

  const { isUnlocked, hasSavedKeys } = useAuthStore();
  const { activeProject, projects, selectProject } = useProjectStore();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveView('office')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                OpenScreens
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-mono font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Multi-Model Office
              </span>
            </div>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-800">
              <span className="text-xs text-slate-500 mr-2">Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-xs rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('office')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'office'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Office
          </button>
          <button
            onClick={() => setActiveView('bots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'bots'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Bots
          </button>
          <button
            onClick={() => setActiveView('compatibility')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeView === 'compatibility'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compatibility</span>
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeView === 'preview'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Preview</span>
          </button>

          {/* Locked "Coming Soon" Tabs */}
          <button
            onClick={() => showLockedFeature('Cloud Deploy')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-400 flex items-center gap-1 cursor-pointer"
            title="Deploy (Out of scope - coming soon)"
          >
            <span className="hidden lg:inline">Deploy</span>
            <span className="text-[9px] bg-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
          <button
            onClick={() => showLockedFeature('Skills & Artifacts Store')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-400 flex items-center gap-1 cursor-pointer"
            title="Skills & Artifacts Store (Out of scope - coming soon)"
          >
            <span className="hidden lg:inline">Store</span>
            <span className="text-[9px] bg-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
        </nav>

        {/* Security & Actions */}
        <div className="flex items-center gap-2">
          {/* Key Vault Button */}
          <button
            onClick={() => setActiveView('keys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isUnlocked || hasSavedKeys
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden md:inline">API Keys</span>
            {hasSavedKeys && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Wipe All Data Button */}
          <button
            onClick={() => setWipeDataModalOpen(true)}
            title="Wipe all local data and reset app"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
