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
  Coins,
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
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveView('office')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[var(--bg-card)] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[var(--text-main)]">
                OpenScreens
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Multi-Model Office
              </span>
            </div>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)] mr-2">Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-lg px-2.5 py-1 text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'office'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Office
          </button>
          <button
            onClick={() => setActiveView('bots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'bots'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Bots
          </button>
          <button
            onClick={() => setActiveView('projects')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'projects'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveView('tokens')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'tokens'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Tokens</span>
          </button>
          <button
            onClick={() => setActiveView('compatibility')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'compatibility'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compatibility</span>
          </button>

          {/* Locked "Coming Soon" Tabs */}
          <button
            onClick={() => showLockedFeature('Cloud Deploy')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-muted)] flex items-center gap-1 cursor-pointer"
            title="Deploy (Out of scope - coming soon)"
          >
            <span className="hidden lg:inline">Deploy</span>
            <span className="text-[9px] bg-[var(--bg-panel)] text-[var(--text-faint)] border border-[var(--border-subtle)] px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
          <button
            onClick={() => showLockedFeature('Skills & Artifacts Store')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-muted)] flex items-center gap-1 cursor-pointer"
            title="Skills & Artifacts Store (Out of scope - coming soon)"
          >
            <span className="hidden lg:inline">Store</span>
            <span className="text-[9px] bg-[var(--bg-panel)] text-[var(--text-faint)] border border-[var(--border-subtle)] px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
        </nav>

        {/* Security & Actions */}
        <div className="flex items-center gap-2">
          {/* Key Vault Button */}
          <button
            onClick={() => setActiveView('keys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isUnlocked || hasSavedKeys
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">API Keys</span>
            {hasSavedKeys && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Wipe All Data Button */}
          <button
            onClick={() => setWipeDataModalOpen(true)}
            title="Wipe all local data and reset app"
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] border border-[var(--border-subtle)] transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
