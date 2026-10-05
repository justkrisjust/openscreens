import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Lock,
  Sparkles,
  Monitor,
  Flame,
  CheckCircle,
  AlertTriangle,
  Folder,
  Eye,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  FileCode,
  FileText,
  Laptop,
  Palette,
  Terminal,
} from 'lucide-react';
import type { Bot } from '../../services/storage';
import { BotFace, type BotEmoteType } from './BotFace';
import { useProjectStore } from '../../stores/useProjectStore';

interface VirtualOfficeFloorProps {
  bots: Bot[];
  activeLocks: Record<string, { botId: string; botName: string }>;
  isExecutingTurn: boolean;
}

// Fixed Station Coordinates (percentages relative to the 1200x700 virtual canvas)
const STATIONS = {
  coffeeLounge: { x: 18, y: 24, name: 'Coffee Lounge', desc: 'Break & Refresh Station' },
  wallWhiteboard: { x: 50, y: 15, name: 'Project Whiteboard', desc: 'Live Built App Monitor' },
  designStudio: { x: 82, y: 24, name: 'Design Studio', desc: 'UI & Styling Station' },
  memoryVault: { x: 50, y: 50, name: 'Memory Box Vault', desc: 'Shared Virtual File Repository' },
  leadDesk: { x: 22, y: 76, name: 'Desk A: Lead Architect', desc: 'Project Leadership & Architecture' },
  devDesk: { x: 78, y: 76, name: 'Desk B: Dev Station', desc: 'Engineering & Logic' },
};

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  const { files, selectFile } = useProjectStore();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);

  // Canvas Pan & Zoom Controls
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [walkPhase, setWalkPhase] = useState<'idle' | 'to_box' | 'to_desk'>('idle');

  // Trigger choreographed file pickup when turn is executing or simulated
  useEffect(() => {
    if (isExecutingTurn || isSimulatingWalk) {
      // Phase 1: Walk to vault to claim file
      setWalkPhase('to_box');
      const timer1 = setTimeout(() => {
        // Phase 2: Walk with file to desk
        setWalkPhase('to_desk');
      }, 1600);
      return () => clearTimeout(timer1);
    } else {
      setWalkPhase('idle');
    }
  }, [isExecutingTurn, isSimulatingWalk]);

  // Compile mini preview HTML for the whiteboard monitor
  const bundledHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.path.toLowerCase().endsWith('.html')) || files.find((f) => f.path.toLowerCase() === 'index.html');
    const cssFile = files.find((f) => f.path.toLowerCase().endsWith('.css'));
    const jsFile = files.find((f) => f.path.toLowerCase().endsWith('.js'));

    let htmlContent = htmlFile?.content || `<!DOCTYPE html><html><body><h3 style="color:#64748b;font-family:sans-serif;text-align:center;margin-top:2rem">Waiting for code...</h3></body></html>`;

    if (cssFile && cssFile.content) {
      htmlContent = `<style>${cssFile.content}</style>\n${htmlContent}`;
    }
    if (jsFile && jsFile.content) {
      htmlContent = `${htmlContent}\n<script>${jsFile.content}</script>`;
    }
    return htmlContent;
  }, [files]);

  // Compute position for each bot based on physical workflow
  const getBotPosition = (bot: Bot, index: number) => {
    const isWorking = bot.status === 'working';
    const isTroubled = bot.status === 'blocked' || bot.status === 'needs_help';
    const isWaiting = bot.status === 'waiting';

    // When actively walking to fetch file from vault
    if ((isWorking || isSimulatingWalk) && walkPhase === 'to_box') {
      return { x: 44 + (index % 3) * 6, y: 44 };
    }

    // When working or carrying file at desk
    if (isWorking || ((isWorking || isSimulatingWalk) && walkPhase === 'to_desk')) {
      if (bot.role === 'leader') return { x: STATIONS.leadDesk.x, y: STATIONS.leadDesk.y - 4 };
      if (bot.role === 'designer') return { x: STATIONS.designStudio.x, y: STATIONS.designStudio.y + 4 };
      return { x: STATIONS.devDesk.x, y: STATIONS.devDesk.y - 4 };
    }

    // If blocked because file is locked, standing near vault looking troubled
    if (isTroubled) {
      return index === 0 ? { x: 38, y: 50 } : { x: 62, y: 50 };
    }

    // If waiting or on break, relaxing at Coffee Lounge
    if (isWaiting) {
      return { x: STATIONS.coffeeLounge.x - 3 + index * 6, y: STATIONS.coffeeLounge.y + 5 };
    }

    // Default home stations
    if (bot.role === 'leader') return STATIONS.leadDesk;
    if (bot.role === 'designer') return STATIONS.designStudio;
    if (index === 1) return STATIONS.devDesk;
    return { x: 34 + index * 12, y: 76 };
  };

  // Find file carried by this bot
  const getCarriedFileForBot = (botId: string, botStatus: string) => {
    // Check if active locks has this bot
    for (const [filePath, lock] of Object.entries(activeLocks)) {
      if (lock.botId === botId) {
        return filePath;
      }
    }
    // If bot is currently working, carry the first virtual file as visual simulation
    if (botStatus === 'working' && files.length > 0) {
      return files[0].path;
    }
    if (isSimulatingWalk && walkPhase === 'to_desk' && files.length > 0) {
      return files[0].path;
    }
    return null;
  };

  // Emote expression calculation
  const getBotEmote = (bot: Bot): BotEmoteType => {
    if (bot.status === 'blocked') return 'frustrated';
    if (bot.status === 'needs_help') return 'steam';
    if (bot.status === 'thinking') return 'question';
    if (bot.status === 'done') return 'stars';
    if (bot.status === 'waiting') return 'coffee';
    return 'lightbulb';
  };

  const lockedFilesList = Object.keys(activeLocks);

  const resetView = () => {
    setCanvasPan({ x: 0, y: 0 });
    setCanvasScale(1);
  };

  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-4 overflow-hidden shadow-sm min-h-[460px] select-none transition-colors duration-200 flex flex-col">
      {/* Office Floor Perimeter Top Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
              OpenScreens Interactive Office Floor
            </span>
            <span className="text-[11px] text-[var(--text-muted)] ml-2 hidden sm:inline">
              (Interactive Canvas: Drag to pan • Watch bots fetch & carry files)
            </span>
          </div>
        </div>

        {/* Canvas Navigation Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Simulated File Action button */}
          <button
            onClick={() => {
              setIsSimulatingWalk(true);
              setTimeout(() => setIsSimulatingWalk(false), 4000);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Trigger bot walking animation to vault & carrying file to desk"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate File Fetch</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setCanvasScale((s) => Math.min(1.4, s + 0.1))}
            className="p-1.5 rounded-xl bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setCanvasScale((s) => Math.max(0.75, s - 0.1))}
            className="p-1.5 rounded-xl bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Pan/Zoom */}
          <button
            onClick={resetView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium transition-colors"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline text-[11px]">Center</span>
          </button>

          {/* Lock status pill */}
          {lockedFilesList.length > 0 && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
              <Lock className="w-3 h-3" />
              Locked: {lockedFilesList.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* The Draggable Office Canvas Viewport */}
      <div className="relative flex-1 w-full h-[400px] rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner">
        {/* Helper Hint Badge */}
        <div className="absolute bottom-2 left-3 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)]/90 border border-[var(--border-subtle)] shadow-sm text-[10px] font-mono text-[var(--text-muted)] backdrop-blur-sm">
          <Move className="w-3 h-3 text-emerald-500" />
          <span>Click & Drag to pan canvas</span>
        </div>

        {/* Inner Draggable Stage */}
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.08}
          animate={{ scale: canvasScale }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={{ x: canvasPan.x, y: canvasPan.y }}
          className="relative w-full h-full min-w-[900px] min-h-[400px] origin-center"
        >
          {/* Minimalist Floor Grid Texture */}
          <div
            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#10b981 1.2px, transparent 1.2px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Visual Office Floor Zones / Floorplan Outlines */}

          {/* 1. TOP CENTER: Wall Whiteboard Monitor (Live Built Code Preview) */}
          <div
            onClick={() => setShowWallMonitorModal(true)}
            className="absolute left-1/2 -translate-x-1/2 top-4 w-60 h-28 bg-[var(--bg-card)] border-2 border-emerald-500/40 rounded-2xl p-2 shadow-lg shadow-emerald-500/10 cursor-pointer group hover:border-emerald-500 transition-all z-10"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)] text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1 font-bold">
                <Monitor className="w-3 h-3" /> Project Whiteboard Monitor
              </span>
              <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform text-[var(--text-muted)]" />
            </div>
            <div className="w-full h-[62px] bg-white rounded-xl overflow-hidden mt-1.5 relative pointer-events-none shadow-inner border border-slate-200">
              <iframe
                title="Mini Wall Monitor"
                srcDoc={bundledHtml}
                sandbox="allow-scripts"
                className="w-[200%] h-[200%] transform scale-50 origin-top-left border-0"
              />
              <div className="absolute inset-0 bg-transparent" />
            </div>
          </div>

          {/* 2. TOP LEFT: Coffee Lounge (Break & Refresh) */}
          <div className="absolute left-6 top-6 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-3 shadow-sm min-w-[190px]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-main)] font-mono flex items-center gap-1">
                Coffee Lounge <span className="text-[9px] text-amber-500 font-normal">☕</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Idle bots rest & recharge</div>
            </div>
          </div>

          {/* 3. TOP RIGHT: Design Studio (Styles & Wireframes) */}
          <div className="absolute right-6 top-6 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-3 shadow-sm min-w-[190px]">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-main)] font-mono flex items-center gap-1">
                Design Studio <span className="text-[9px] text-pink-500 font-normal">🎨</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">CSS Variables & Tokens</div>
            </div>
          </div>

          {/* 4. CENTER: Shared Memory Box Vault Pedestal */}
          <div
            onClick={() => {
              if (files.length > 0) selectFile(files[0].id);
            }}
            className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-48 h-32 rounded-3xl border-2 flex flex-col items-center justify-center p-3 cursor-pointer transition-all z-10 ${
              lockedFilesList.length > 0
                ? 'bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-[var(--bg-card)] border-emerald-500/30 hover:border-emerald-500 shadow-md shadow-emerald-500/5'
            }`}
          >
            <div className="relative mb-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <Folder className="w-5 h-5" />
              </div>
              {lockedFilesList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center animate-bounce shadow-md">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-[var(--text-main)] font-mono tracking-tight text-center">
              Memory Box Vault
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {files.length} Virtual Files
            </div>

            {/* List of files with lock status pills */}
            <div className="mt-1 flex items-center gap-1 flex-wrap justify-center max-w-[170px]">
              {files.slice(0, 3).map((f) => {
                const isLocked = !!activeLocks[f.path.toLowerCase()];
                return (
                  <span
                    key={f.id}
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      isLocked
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 line-through'
                        : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {f.path}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 5. BOTTOM LEFT: Desk A (Lead Architect) */}
          <div className="absolute left-8 bottom-6 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-3 min-w-[210px]">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-main)] font-mono">
                Desk A: Lead Architect
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Plans, Review, Specs</div>
            </div>
          </div>

          {/* 6. BOTTOM RIGHT: Desk B (Dev Workstation) */}
          <div className="absolute right-8 bottom-6 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-3 min-w-[210px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-main)] font-mono">
                Desk B: Dev Station
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Code, Logic, Tests</div>
            </div>
          </div>

          {/* Autonomous Animated Roaming Bots with Carried File Packets */}
          <AnimatePresence>
            {bots.map((bot, index) => {
              const pos = getBotPosition(bot, index);
              const emote = getBotEmote(bot);
              const isSelected = selectedBotId === bot.id;
              const isWorking = bot.status === 'working';
              const isTroubled = bot.status === 'blocked' || bot.status === 'needs_help';
              const carriedFile = getCarriedFileForBot(bot.id, bot.status);

              return (
                <motion.div
                  key={bot.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 60,
                    damping: 15,
                    mass: 0.9,
                  }}
                  onClick={() => setSelectedBotId(isSelected ? null : bot.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group ${
                    isTroubled ? 'animate-frustrated' : ''
                  }`}
                >
                  {/* Carried File Pill floating above the bot if they're carrying/working on a file */}
                  {carriedFile && (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500 text-slate-950 shadow-md border border-emerald-400 whitespace-nowrap flex items-center gap-1 z-30 animate-bounce"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Carrying: {carriedFile}</span>
                    </motion.div>
                  )}

                  {/* Frustrated Blocked Speech Bubble */}
                  {isTroubled && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-2 py-1 rounded-xl text-[10px] font-mono bg-rose-500 text-white shadow-lg whitespace-nowrap flex items-center gap-1 z-30 animate-pulse">
                      <span>💢 File is locked! Waiting...</span>
                    </div>
                  )}

                  {/* Bot Robot Avatar */}
                  <div className="flex flex-col items-center">
                    <BotFace
                      status={bot.status}
                      emote={emote}
                      color={bot.avatarColor}
                      size={48}
                      isWalking={isExecutingTurn || isSimulatingWalk}
                    />

                    {/* Bot Name Tag Pill */}
                    <div
                      className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border shadow-sm transition-all flex items-center gap-1 ${
                        isWorking
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                          : isTroubled
                          ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                          : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-subtle)]'
                      }`}
                    >
                      <span>{bot.name}</span>
                      <span className="text-[9px] opacity-75 font-normal">({bot.role})</span>
                    </div>
                  </div>

                  {/* Interactive Popover Card on Click */}
                  {isSelected && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl p-3 shadow-2xl text-[11px] text-[var(--text-main)] z-40 pointer-events-auto">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {bot.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                          {bot.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] italic mb-2 leading-snug">
                        "{bot.personality}"
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-1.5 space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-semibold capitalize text-[var(--text-main)]">{bot.status}</span>
                        </div>
                        {carriedFile && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>File Locked:</span>
                            <span className="font-bold">{carriedFile}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Tokens:</span>
                          <span>{bot.tokenUsage}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Expanded Wall Monitor Modal (Full Screen Live Preview) */}
      {showWallMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-3xl max-w-4xl w-full h-[85vh] p-4 flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--text-main)] font-mono">
                  Project Whiteboard Screen (Live Built Code)
                </h3>
              </div>
              <button
                onClick={() => setShowWallMonitorModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl overflow-hidden mt-3 shadow-inner">
              <iframe
                title="Expanded Whiteboard View"
                srcDoc={bundledHtml}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
