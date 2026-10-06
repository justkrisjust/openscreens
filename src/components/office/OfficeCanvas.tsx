import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Users,
  MessageSquare,
  Layers,
  Box,
  Activity,
  Sparkles,
  X,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { MemoryBox } from '../memory/MemoryBox';
import { EventFeed } from './EventFeed';
import { DirectorChat } from '../chat/DirectorChat';
import { VirtualOfficeFloor } from './VirtualOfficeFloor';
import { T40GuideModal } from '../common/T40GuideModal';

export const OfficeCanvas: React.FC = () => {
  const [mobileSection, setMobileSection] = useState<'floor' | 'chat' | 'memory' | 'feed'>('floor');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isT40Open, setIsT40Open] = useState(false);

  const {
    activeProject,
    startProjectExecution,
    pauseProjectExecution,
    stopProjectExecution,
    activeLocks,
    isExecutingTurn,
    events,
    addTurns,
  } = useProjectStore();

  const { bots } = useBotStore();
  const { setActiveView } = useUIStore();

  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-200">No Active Project</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Select or create a project to launch the multi-model office.
        </p>
        <button
          onClick={() => setActiveView('projects')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
        >
          View Projects
        </button>
      </div>
    );
  }

  // Find bots belonging to this project
  const projectBots = bots.filter((b) => activeProject.botIds.includes(b.id));

  const isRunning = activeProject.status === 'running';
  const isCompleted = activeProject.status === 'completed';
  const isPaused = activeProject.status === 'paused';

  return (
    <div className="max-w-[1600px] mx-auto p-4 flex flex-col gap-4 min-h-[calc(100vh-65px)]">
      {/* Top Project Dashboard Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[var(--text-main)] m-0 tracking-tight">
              {activeProject.name}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 animate-pulse'
                  : isCompleted
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : isPaused
                  ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-strong)]'
              }`}
            >
              {activeProject.status.toUpperCase()}
            </span>
            {projectBots.some((b) => b.provider !== 'mock') ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Real AI Mode
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                Demo Mode (Zero Cost)
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl line-clamp-1">
            <strong>Goal:</strong> {activeProject.goal}
          </p>
        </div>

        {/* Turn Meter & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Turn counter meter with +10 Turns extension and explanation tooltip */}
          <div className="bg-[var(--bg-panel)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs font-mono flex items-center gap-2 shadow-sm">
            <span
              className="text-[var(--text-muted)] cursor-help flex items-center gap-1"
              title="A 'Turn' is one round where a bot reads files, writes code, or reviews. Turn limit prevents infinite loops and protects your API budget."
            >
              Turns:
            </span>
            <span className="font-bold text-[var(--text-main)]">
              {activeProject.currentTurn} / {activeProject.maxTurns}
            </span>
            <button
              onClick={() => addTurns(10)}
              className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md transition-colors"
              title="Add 10 more turns to milestone limit"
            >
              +10
            </button>
          </div>

          {/* Start / Pause / Stop buttons */}
          <div className="flex items-center gap-1.5">
            {isRunning ? (
              <button
                onClick={pauseProjectExecution}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold shadow-md transition-colors"
                title="Pause office turn execution"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={startProjectExecution}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
                title="Wake up bots and resume project execution"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{activeProject.currentTurn > 0 ? 'Resume' : 'Start'}</span>
              </button>
            )}

            <button
              onClick={stopProjectExecution}
              className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-[var(--border-subtle)] hover:border-rose-500/30"
              title="Stop project & put all bots to sleep"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Ask T-40 Guide button */}
            <button
              onClick={() => setIsT40Open(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
              title="Ask T-40 (Guide & FAQ)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ask T-40</span>
            </button>

            {/* Quick Chat Shortcut Button (Opens Drawer on Desktop & Mobile) */}
            <button
              onClick={() => {
                setIsChatDrawerOpen(true);
                setMobileSection('chat');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isChatDrawerOpen || mobileSection === 'chat'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
              }`}
              title="Open Director Chat with bots"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Chat</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">
                {events.filter((e) => e.type === 'chat_message').length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View Switcher Tabs (Phones & Small Tablets) */}
      <div className="flex lg:hidden items-center justify-between bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-1 gap-1 shadow-sm">
        <button
          onClick={() => setMobileSection('floor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            mobileSection === 'floor'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm border border-emerald-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Office</span>
        </button>
        <button
          onClick={() => setMobileSection('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            mobileSection === 'chat'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm border border-emerald-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          <span className="text-[9px] font-mono px-1 rounded-full bg-emerald-500/10 text-emerald-500">
            {events.filter((e) => e.type === 'chat_message').length}
          </span>
        </button>
        <button
          onClick={() => setMobileSection('memory')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            mobileSection === 'memory'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm border border-emerald-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setMobileSection('feed')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            mobileSection === 'feed'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm border border-emerald-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Feed</span>
        </button>
      </div>

      {/* Mobile Content Display based on selected tab */}
      <div className="block lg:hidden flex-1">
        {mobileSection === 'floor' && (
          <VirtualOfficeFloor
            bots={bots}
            activeLocks={activeLocks}
            isExecutingTurn={isExecutingTurn}
          />
        )}
        {mobileSection === 'chat' && <DirectorChat />}
        {mobileSection === 'memory' && <MemoryBox />}
        {mobileSection === 'feed' && <EventFeed />}
      </div>

      {/* Desktop Panoramic Full View (Large Screens) */}
      <div className="hidden lg:flex flex-col gap-4">
        {/* Visual Representation: Animated Virtual Office Floor with ALL bots visible */}
        <VirtualOfficeFloor
          bots={bots}
          activeLocks={activeLocks}
          isExecutingTurn={isExecutingTurn}
        />

        {/* Lower Workspace: Event Feed (Left) - Shared Memory Box (Center) - Director Chat (Right) */}
        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Compact Event Feed */}
          <div className="col-span-12 xl:col-span-3 lg:col-span-3 min-h-[460px] flex flex-col">
            <EventFeed />
          </div>

          {/* Center Column: Shared Memory Box (Virtual File Tree + Editor) */}
          <div className="col-span-12 xl:col-span-6 lg:col-span-6 min-h-[460px] flex flex-col">
            <MemoryBox />
          </div>

          {/* Right Column: Director Chat */}
          <div className="col-span-12 xl:col-span-3 lg:col-span-3 min-h-[460px] flex flex-col">
            <DirectorChat />
          </div>
        </div>
      </div>

      {/* Slide-out Director Chat Drawer (Accessible anywhere) */}
      {isChatDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-[var(--bg-card)] border-l border-[var(--border-subtle)] shadow-2xl p-4 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm text-[var(--text-main)] font-heading">
                  Director Chat Drawer
                </span>
              </div>
              <button
                onClick={() => setIsChatDrawerOpen(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
                title="Close chat drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DirectorChat />
            </div>
          </div>
        </div>
      )}

      {/* T-40 Guide Companion Modal */}
      <T40GuideModal isOpen={isT40Open} onClose={() => setIsT40Open(false)} />
    </div>
  );
};
