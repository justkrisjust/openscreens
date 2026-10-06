import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { T40GuideModal } from './T40GuideModal';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [t40Open, setT40Open] = useState(false);

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

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
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
            <span>Compatibility</span>
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

        {/* Desktop Security & Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Ask T-40 Guide Button */}
          <button
            onClick={() => setT40Open(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
            title="Ask T-40 (Guide & FAQ)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Guide (T-40)</span>
          </button>

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
            <span>API Keys</span>
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

        {/* Mobile Header Controls: Theme toggle + 3-lines menu button */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] border border-[var(--border-subtle)] transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mobile 3-Lines Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-center"
            aria-label="Toggle navigation menu"
            title="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-500" />
            ) : (
              <Menu className="w-5 h-5 text-[var(--text-main)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2.5 pt-3 pb-2 border-t border-[var(--border-subtle)] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Active project selector for mobile */}
          {projects.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] mb-1">
              <span className="text-xs text-[var(--text-muted)] font-mono">Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  selectProject(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="bg-transparent text-xs font-semibold text-[var(--text-main)] focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setActiveView('office');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'office'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>🏢 Office Floor & Workspace</span>
            {activeView === 'office' && <span className="text-emerald-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('bots');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'bots'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>🤖 Bots Roster & Customizer</span>
            {activeView === 'bots' && <span className="text-emerald-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('projects');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'projects'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>📁 Projects & Knowledge Base</span>
            {activeView === 'projects' && <span className="text-emerald-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('tokens');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'tokens'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Tokens & Cost Ledger</span>
            </div>
            {activeView === 'tokens' && <span className="text-emerald-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('compatibility');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'compatibility'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compatibility Test Suite</span>
            </div>
            {activeView === 'compatibility' && <span className="text-emerald-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('keys');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              isUnlocked || hasSavedKeys
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              <span>API Key Vault (Encrypted)</span>
            </div>
            {hasSavedKeys && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setT40Open(true);
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ask T-40 (Guide Companion)</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono font-bold">
              FAQ
            </span>
          </button>

          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)] mt-1">
            <button
              onClick={() => {
                showLockedFeature('Cloud Deploy');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs text-[var(--text-faint)] bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] font-medium"
            >
              Deploy (Soon)
            </button>
            <button
              onClick={() => {
                showLockedFeature('Skills & Artifacts Store');
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs text-[var(--text-faint)] bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] font-medium"
            >
              Store (Soon)
            </button>
            <button
              onClick={() => {
                setWipeDataModalOpen(true);
                setMobileMenuOpen(false);
              }}
              title="Wipe data"
              className="p-2 text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Out-of-the-Box T-40 Guide Companion Modal */}
      <T40GuideModal isOpen={t40Open} onClose={() => setT40Open(false)} />
    </header>
  );
};
