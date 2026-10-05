import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { Bot, BotGesture } from '../../services/storage';
import { BotFace, type BotEmoteType } from './BotFace';
import { useProjectStore } from '../../stores/useProjectStore';

interface VirtualOfficeFloorProps {
  bots: Bot[];
  activeLocks: Record<string, { botId: string; botName: string }>;
  isExecutingTurn: boolean;
}

// Station coordinate presets on the office floor (percentage coordinates)
const STATIONS = {
  memoryVault: { x: 50, y: 52, label: 'Memory Box Vault' },
  leadDesk: { x: 18, y: 65, label: 'Lead Station' },
  devDesk: { x: 82, y: 65, label: 'Dev Station' },
  designDesk: { x: 78, y: 26, label: 'Design Studio' },
  coffeeLounge: { x: 20, y: 24, label: 'Coffee Lounge' },
  wallMonitor: { x: 50, y: 16, label: 'Project Whiteboard' },
};

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  const { files, selectFile, selectedFileId } = useProjectStore();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);

  // Compile mini preview HTML for the office whiteboard screen
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

  // Compute roaming target positions for each bot
  const getBotPosition = (bot: Bot, index: number) => {
    // If bot is currently working, it roams toward the Memory Box Vault or their workstation
    if (bot.status === 'working') {
      // 50% chance roaming at the Memory Box inspecting files
      return { x: 44 + index * 6, y: 46 };
    }
    // If blocked or needs help, stepped back with frustrated emote
    if (bot.status === 'blocked' || bot.status === 'needs_help') {
      return index === 0 ? { x: 26, y: 55 } : { x: 72, y: 55 };
    }
    // If waiting or on break, roaming at the Coffee Lounge
    if (bot.status === 'waiting') {
      return { x: 16 + index * 7, y: 30 };
    }
    // Default home station based on role/index
    if (bot.role === 'leader') return STATIONS.leadDesk;
    if (bot.role === 'designer') return STATIONS.designDesk;
    if (index === 1) return STATIONS.devDesk;
    return { x: 30 + index * 14, y: 72 };
  };

  // Determine specific emote expression
  const getBotEmote = (bot: Bot): BotEmoteType => {
    if (bot.status === 'blocked') return 'frustrated';
    if (bot.status === 'needs_help') return 'steam';
    if (bot.status === 'thinking') return 'question';
    if (bot.status === 'done') return 'stars';
    if (bot.status === 'waiting') return 'coffee';
    return 'lightbulb';
  };

  const lockedFilesList = Object.keys(activeLocks);

  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-4 overflow-hidden shadow-2xl min-h-[380px] select-none transition-colors duration-200">
      {/* Subtle Office Floor Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#10b981 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Office Floor Perimeter Header */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-[var(--text-main)] tracking-wider uppercase font-mono">
            OpenScreens Live Office Floor
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            ({bots.length} bots roaming & collaborating)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lockedFilesList.length > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
              <Lock className="w-3 h-3" />
              Locked: {lockedFilesList.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* The Interactive Floor Stage */}
      <div className="relative w-full h-[320px] rounded-2xl bg-gradient-to-b from-[var(--bg-panel)] via-[var(--bg-card)] to-[var(--bg-app)] border border-[var(--border-subtle)] overflow-hidden shadow-inner">
        {/* Station 1: Top Wall Monitor (Live Whiteboard Preview) */}
        <div
          onClick={() => setShowWallMonitorModal(true)}
          className="absolute left-1/2 -translate-x-1/2 top-3 w-52 h-24 bg-[var(--bg-elevated)] border-2 border-emerald-500/40 rounded-xl p-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer group hover:border-emerald-400 transition-all z-10"
        >
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[10px] font-mono text-emerald-500 dark:text-emerald-400">
            <span className="flex items-center gap-1 font-bold">
              <Monitor className="w-3 h-3" /> Project Whiteboard
            </span>
            <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform text-[var(--text-muted)]" />
          </div>
          <div className="w-full h-[58px] bg-white rounded-lg overflow-hidden mt-1 relative pointer-events-none">
            <iframe
              title="Mini Wall Monitor"
              srcDoc={bundledHtml}
              sandbox="allow-scripts"
              className="w-[200%] h-[200%] transform scale-50 origin-top-left border-0"
            />
            <div className="absolute inset-0 bg-transparent" />
          </div>
        </div>

        {/* Station 2: Coffee & Break Lounge (Top Left) */}
        <div className="absolute left-6 top-6 p-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-2 shadow-md">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[var(--text-main)] font-mono">Coffee Lounge</div>
            <div className="text-[9px] text-[var(--text-muted)]">Rest & Refresh Station</div>
          </div>
        </div>

        {/* Station 3: Design Studio (Top Right) */}
        <div className="absolute right-6 top-6 p-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-2 shadow-md">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 dark:text-pink-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[var(--text-main)] font-mono">Design Studio</div>
            <div className="text-[9px] text-[var(--text-muted)]">Styles & Wireframes</div>
          </div>
        </div>

        {/* Station 4: Lead Station (Bottom Left) */}
        <div className="absolute left-8 bottom-6 p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-md flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500/60" />
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            <strong>Desk A:</strong> Lead Architect
          </div>
        </div>

        {/* Station 5: Dev Station (Bottom Right) */}
        <div className="absolute right-8 bottom-6 p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-md flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            <strong>Desk B:</strong> Dev Workstation
          </div>
        </div>

        {/* Center: The Shared Memory Box Vault Pedestal */}
        <div
          onClick={() => {
            if (files.length > 0) selectFile(files[0].id);
          }}
          className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-24 rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${
            lockedFilesList.length > 0
              ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-[var(--bg-elevated)] border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5'
          }`}
        >
          <div className="relative mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Folder className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            {lockedFilesList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center animate-bounce">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <div className="text-[10px] font-bold text-[var(--text-main)] font-mono tracking-tight text-center">
            Memory Box Vault
          </div>
          <div className="text-[9px] text-emerald-600 dark:text-emerald-400/80 font-mono">
            {files.length} Virtual Files
          </div>
        </div>

        {/* Animated Roaming Bots */}
        <AnimatePresence>
          {bots.map((bot, index) => {
            const pos = getBotPosition(bot, index);
            const emote = getBotEmote(bot);
            const isSelected = selectedBotId === bot.id;
            const isWorking = bot.status === 'working';
            const isTroubled = bot.status === 'blocked' || bot.status === 'needs_help';

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
                  stiffness: 70,
                  damping: 14,
                  mass: 1,
                }}
                onClick={() => setSelectedBotId(isSelected ? null : bot.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group ${
                  isTroubled ? 'animate-frustrated' : ''
                }`}
              >
                {/* Bot Character Representation with Animated Face */}
                <div className="flex flex-col items-center">
                  <BotFace
                    status={bot.status}
                    emote={emote}
                    color={bot.avatarColor}
                    size={46}
                    isWalking={isExecutingTurn}
                  />

                  {/* Name tag pill under bot */}
                  <div
                    className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shadow-sm transition-all flex items-center gap-1 ${
                      isWorking
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : isTroubled
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-strong)]'
                    }`}
                  >
                    <span>{bot.name}</span>
                    <span className="text-[9px] opacity-75 font-normal">({bot.role})</span>
                  </div>
                </div>

                {/* Popover Bubble on Click or when actively speaking */}
                {isSelected && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl p-2.5 shadow-2xl text-[11px] text-[var(--text-main)] z-30 pointer-events-auto">
                    <div className="font-bold text-emerald-500 dark:text-emerald-400 mb-0.5">{bot.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] italic mb-1.5 leading-snug">
                      "{bot.personality}"
                    </div>
                    <div className="text-[9px] text-[var(--text-faint)] border-t border-[var(--border-subtle)] pt-1 flex justify-between font-mono">
                      <span>Status: {bot.status}</span>
                      <span>Tokens: {bot.tokenUsage}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expanded Wall Monitor Modal */}
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
