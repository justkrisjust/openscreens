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
  BookOpen,
  User,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { UserGuideModal } from './UserGuideModal';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const {
    activeView,
    setActiveView,
    isDarkMode,
    toggleTheme,
    setWipeDataModalOpen,
    showLockedFeature,
  } = useUIStore();

  const { isUnlocked, hasSavedKeys, isAuthenticated, currentUser, logout } = useAuthStore();
  const { activeProject, projects, selectProject } = useProjectStore();

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => setActiveView('office')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Reworked Geometric Autonomous Colony Logo Emblem */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[var(--bg-card)] rounded-[10px] flex items-center justify-center p-1">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  className="w-full h-full text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                >
                  <polygon
                    points="18,3 32,10.5 32,25.5 18,33 4,25.5 4,10.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="rgba(56, 189, 248, 0.12)"
                  />
                  <line x1="18" y1="3" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                  <line x1="32" y1="25.5" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                  <line x1="4" y1="25.5" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                  <circle cx="18" cy="18" r="3" fill="#38bdf8" />
                  <circle cx="18" cy="3" r="1.8" fill="#7dd3fc" />
                  <circle cx="32" cy="10.5" r="1.8" fill="#7dd3fc" />
                  <circle cx="32" cy="25.5" r="1.8" fill="#7dd3fc" />
                  <circle cx="18" cy="33" r="1.8" fill="#7dd3fc" />
                  <circle cx="4" cy="25.5" r="1.8" fill="#7dd3fc" />
                  <circle cx="4" cy="10.5" r="1.8" fill="#7dd3fc" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--text-main)] font-heading">
                  OpenScreens
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] uppercase font-mono font-bold rounded-md bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/25">
                  PROD v1.0
                </span>
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-sky-600 dark:text-sky-400 font-mono tracking-wider font-semibold uppercase -mt-0.5">
                Autonomous Multi-Model AI Colony
              </div>
            </div>
          </div>

          {/* Project selector */}
          {projects.length > 0 && (
            <div className="hidden lg:flex items-center ml-3 pl-3 border-l border-[var(--border-subtle)] shrink-0">
              <span className="text-xs text-[var(--text-muted)] mr-1.5">Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => selectProject(e.target.value)}
                className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-lg px-2 py-1 text-[var(--text-main)] focus:outline-none focus:border-sky-500 max-w-[140px] truncate"
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
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveView('office')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'office'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Office
          </button>
          <button
            onClick={() => setActiveView('bots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'bots'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Bots
          </button>
          <button
            onClick={() => setActiveView('projects')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'projects'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveView('tokens')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'tokens'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Tokens</span>
          </button>
          <button
            onClick={() => setActiveView('compatibility')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'compatibility'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Compatibility</span>
          </button>

          {/* Locked "Coming Soon" Tabs (visible on 2xl only to save space) */}
          <button
            onClick={() => showLockedFeature('Cloud Deploy')}
            className="hidden 2xl:flex px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-muted)] items-center gap-1 cursor-pointer"
            title="Deploy (Out of scope - coming soon)"
          >
            <span>Deploy</span>
            <span className="text-[9px] bg-[var(--bg-panel)] text-[var(--text-faint)] border border-[var(--border-subtle)] px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
          <button
            onClick={() => showLockedFeature('Skills & Artifacts Store')}
            className="hidden 2xl:flex px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-muted)] items-center gap-1 cursor-pointer"
            title="Skills & Artifacts Store (Out of scope - coming soon)"
          >
            <span>Store</span>
            <span className="text-[9px] bg-[var(--bg-panel)] text-[var(--text-faint)] border border-[var(--border-subtle)] px-1 py-0.2 rounded font-mono">SOON</span>
          </button>
        </nav>

        {/* Desktop Security & Actions - shrink-0 to prevent jammed layout */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Documentation & Guide Button */}
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-all shadow-sm shrink-0"
            title="Documentation & Production Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden lg:inline">Docs & Guide</span>
            <span className="lg:hidden">Docs</span>
          </button>

          {/* Key Vault Button */}
          <button
            onClick={() => setActiveView('keys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              isUnlocked || hasSavedKeys
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden lg:inline">API Keys</span>
            <span className="lg:hidden">Keys</span>
            {hasSavedKeys && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </button>

          {/* User Profile Pill & Sign Out */}
          {isAuthenticated && currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[var(--border-subtle)] shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] shadow-sm shrink-0">
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[80px]">{currentUser.name}</span>
              </div>
              <button
                onClick={logout}
                title="Sign out of OpenScreens"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Logout</span>
              </button>
            </div>
          )}

          {/* Wipe All Data Button */}
          <button
            onClick={() => setWipeDataModalOpen(true)}
            title="Wipe all local data and reset app"
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Permanent Desktop Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-sky-400 bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-sky-500/40 transition-all shrink-0 cursor-pointer shadow-sm"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle light/dark theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" />
            )}
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
              <X className="w-5 h-5 text-sky-500" />
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
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>🏢 Office Floor & Workspace</span>
            {activeView === 'office' && <span className="text-sky-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('bots');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'bots'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>🤖 Bots Roster & Customizer</span>
            {activeView === 'bots' && <span className="text-sky-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('projects');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'projects'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <span>📁 Projects & Knowledge Base</span>
            {activeView === 'projects' && <span className="text-sky-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('tokens');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'tokens'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Tokens & Cost Ledger</span>
            </div>
            {activeView === 'tokens' && <span className="text-sky-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('compatibility');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'compatibility'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Compatibility Test Suite</span>
            </div>
            {activeView === 'compatibility' && <span className="text-sky-500 text-[10px]">Active</span>}
          </button>

          <button
            onClick={() => {
              setActiveView('keys');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              isUnlocked || hasSavedKeys
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-sky-500" />
              <span>API Key Vault (Encrypted)</span>
            </div>
            {hasSavedKeys && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setGuideOpen(true);
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              <span>Docs & Production Guide</span>
            </div>
            <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.2 rounded-full font-mono font-bold">
              Guide
            </span>
          </button>

          {isAuthenticated && currentUser && (
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[var(--text-main)] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{currentUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 text-xs text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 font-medium"
              >
                Sign Out
              </button>
            </div>
          )}

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

      {/* Production User Guide & Documentation Modal */}
      <UserGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </header>
  );
};
