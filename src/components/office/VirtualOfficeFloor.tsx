import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Lock,
  Sparkles,
  Monitor,
  Folder,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Laptop,
  Tv,
  Gamepad2,
  Droplet,
  BookOpen,
  Hammer,
  Bomb,
  HardHat,
  Compass,
} from 'lucide-react';
import type { Bot, VirtualFile } from '../../services/storage';
import { BotFace, type BotEmoteType } from './BotFace';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatFileSize } from '../../services/knowledgeService';

interface VirtualOfficeFloorProps {
  bots: Bot[];
  activeLocks: Record<string, { botId: string; botName: string }>;
  isExecutingTurn: boolean;
}

// 5 Leisure Activity Zones on the Right Side
export type LeisureActivity = 'coffee' | 'arcade' | 'tv' | 'water_cooler' | 'library';

interface LeisureZone {
  id: LeisureActivity;
  name: string;
  icon: React.ReactNode;
  x: number; // percentage in canvas
  y: number; // percentage in canvas
  desc: string;
  emote: BotEmoteType;
  stationName: string;
}

const LEISURE_ZONES: Record<LeisureActivity, LeisureZone> = {
  coffee: {
    id: 'coffee',
    name: 'Coffee Barista Lounge',
    icon: <Coffee className="w-4 h-4 text-amber-500" />,
    x: 72,
    y: 22,
    desc: 'Sipping espresso & recharging energy',
    emote: 'coffee',
    stationName: '☕ Coffee Station',
  },
  arcade: {
    id: 'arcade',
    name: '8-Bit Arcade Playground',
    icon: <Gamepad2 className="w-4 h-4 text-violet-400" />,
    x: 90,
    y: 22,
    desc: 'Testing reflexes with retro games',
    emote: 'stars',
    stationName: '🕹️ Arcade Depot',
  },
  library: {
    id: 'library',
    name: 'Knowledge Vault & Library',
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    x: 81,
    y: 52,
    desc: 'Reading project specs & documentation',
    emote: 'lightbulb',
    stationName: '📚 Vault Terminal',
  },
  tv: {
    id: 'tv',
    name: 'Chill TV & Media Lounge',
    icon: <Tv className="w-4 h-4 text-cyan-400" />,
    x: 72,
    y: 82,
    desc: 'Watching tech talks & relaxing on sofa',
    emote: 'normal',
    stationName: '📺 Media Station',
  },
  water_cooler: {
    id: 'water_cooler',
    name: 'Water Cooler Chat Hub',
    icon: <Droplet className="w-4 h-4 text-blue-400" />,
    x: 90,
    y: 82,
    desc: 'Gossiping & sharing multi-model notes',
    emote: 'normal',
    stationName: '💧 Cooler Branch',
  },
};

// 6 Spacious Cabin Workstation Slots on the Left Side
interface CabinSlot {
  id: number;
  name: string;
  x: number; // percentage in canvas
  y: number; // percentage in canvas
}

const CABIN_SLOTS: CabinSlot[] = [
  { id: 0, name: 'Studio Pod Alpha', x: 12, y: 22 },
  { id: 1, name: 'Studio Pod Beta', x: 28, y: 22 },
  { id: 2, name: 'Studio Pod Gamma', x: 12, y: 52 },
  { id: 3, name: 'Studio Pod Delta', x: 28, y: 52 },
  { id: 4, name: 'Studio Pod Epsilon', x: 12, y: 82 },
  { id: 5, name: 'Studio Pod Zeta', x: 28, y: 82 },
];

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  const {
    files,
    activeProject,
    assignFileToBot,
    unassignFile,
  } = useProjectStore();
  const { showToast, setActiveView } = useUIStore();

  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  // Canvas Pan & Zoom (Free Look)
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // Passive ambient wandering spots for untasked bots
  const [botLeisureSpots, setBotLeisureSpots] = useState<Record<string, LeisureActivity>>({});

  // Dynamic Office Cabins: botId -> { slotIndex: number, file: VirtualFile }
  const [builtCabins, setBuiltCabins] = useState<Record<string, { slot: number; file: VirtualFile }>>({});

  // Animations for Bob (Creator) & Rex (Destroyer)
  const [creatorBotState, setCreatorBotState] = useState<{ active: boolean; targetBotName: string; targetSlot: number } | null>(null);
  const [destroyerBotState, setDestroyerBotState] = useState<{ active: boolean; targetBotName: string; targetSlot: number } | null>(null);

  const isProjectStopped = activeProject?.status === 'idle';

  // Synchronize cabins with currently locked/assigned files
  useEffect(() => {
    const lockedFiles = files.filter((f) => Boolean(f.lockedBy));
    const nextCabins: Record<string, { slot: number; file: VirtualFile }> = {};

    lockedFiles.forEach((file, index) => {
      if (file.lockedBy) {
        nextCabins[file.lockedBy] = {
          slot: index % CABIN_SLOTS.length,
          file,
        };
      }
    });

    setBuiltCabins(nextCabins);
  }, [files]);

  // Ambient wandering: every 5.5 seconds, pick an untasked bot to wander to another leisure zone
  useEffect(() => {
    if (isProjectStopped) return;

    const interval = setInterval(() => {
      const untaskedBots = bots.filter((b) => !builtCabins[b.id] && b.status !== 'working');
      if (untaskedBots.length === 0) return;

      const randomBot = untaskedBots[Math.floor(Math.random() * untaskedBots.length)];
      const activities: LeisureActivity[] = ['coffee', 'arcade', 'tv', 'water_cooler', 'library'];
      const nextActivity = activities[Math.floor(Math.random() * activities.length)];

      setBotLeisureSpots((prev) => ({
        ...prev,
        [randomBot.id]: nextActivity,
      }));
    }, 5500);

    return () => clearInterval(interval);
  }, [bots, builtCabins, isProjectStopped]);

  // Trigger Bob the Builder
  const triggerCreatorBot = (targetBot: Bot, slotIndex: number) => {
    setCreatorBotState({ active: true, targetBotName: targetBot.name, targetSlot: slotIndex });
    setTimeout(() => {
      setCreatorBotState(null);
    }, 2200);
  };

  // Trigger Rex the Destroyer
  const triggerDestroyerBot = (targetBotName: string, slotIndex: number) => {
    setDestroyerBotState({ active: true, targetBotName, targetSlot: slotIndex });
    setTimeout(() => {
      setDestroyerBotState(null);
    }, 2200);
  };

  // User assigns file to bot
  const handleAssignTask = async (fileId: string, botId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    // Pick first open slot
    const usedSlots = Object.values(builtCabins).map((c) => c.slot);
    const openSlot = CABIN_SLOTS.find((s) => !usedSlots.includes(s.id)) || CABIN_SLOTS[0];

    triggerCreatorBot(targetBot, openSlot.id);

    const success = await assignFileToBot(fileId, targetBot.id, targetBot.name);
    if (success) {
      showToast(`👷 Bob built a custom studio for ${targetBot.name}!`, 'success');
    }
  };

  // User relieves bot / unassigns file
  const handleUnassignTask = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || !file.lockedBy) return;

    const botId = file.lockedBy;
    const targetBot = bots.find((b) => b.id === botId);
    const botName = targetBot?.name || 'Bot';
    const slotIndex = builtCabins[botId]?.slot ?? 0;

    triggerDestroyerBot(botName, slotIndex);
    await unassignFile(fileId);
    showToast(`🚜 Rex demolished the studio! ${botName} is relieved to leisure campus.`, 'info');
  };

  // Calculate bot coordinates on the floor
  const getBotPosition = (bot: Bot, index: number) => {
    const cabin = builtCabins[bot.id];

    // If bot has a cabin on the left
    if (cabin) {
      const slot = CABIN_SLOTS[cabin.slot] || CABIN_SLOTS[0];
      return { x: slot.x + 2.5, y: slot.y + 1.5 };
    }

    // Untasked bots wander in the 5 leisure spots on the right
    const currentActivity = botLeisureSpots[bot.id] || (
      index % 5 === 0 ? 'coffee' :
      index % 5 === 1 ? 'arcade' :
      index % 5 === 2 ? 'tv' :
      index % 5 === 3 ? 'water_cooler' : 'library'
    );

    const zone = LEISURE_ZONES[currentActivity];
    const offsetX = ((index % 3) - 1) * 3.5;
    const offsetY = Math.floor(index / 3) * 2.8;

    return { x: zone.x + offsetX, y: zone.y + offsetY };
  };

  // Live bundled preview HTML
  const bundledHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.path.toLowerCase().endsWith('.html')) || files.find((f) => f.path.toLowerCase() === 'index.html');
    const cssFile = files.find((f) => f.path.toLowerCase().endsWith('.css'));
    const jsFile = files.find((f) => f.path.toLowerCase().endsWith('.js'));

    let htmlContent = htmlFile?.content || `<!DOCTYPE html><html><body style="background:#0b0c10;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:90vh"><div style="text-align:center"><h3>Building Live App...</h3><p style="font-size:12px;opacity:0.6">Waiting for bot index.html and styles.</p></div></body></html>`;

    if (cssFile && cssFile.content) {
      htmlContent = `<style>${cssFile.content}</style>\n${htmlContent}`;
    }
    if (jsFile && jsFile.content) {
      htmlContent = `${htmlContent}\n<script>${jsFile.content}</script>`;
    }
    return htmlContent;
  }, [files]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl mb-6 select-none transition-colors duration-200">
      {/* Top Floor Header & Canvas Toolbar */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sm text-[var(--text-main)] font-heading">
            Colony Virtual Office Floor
          </span>
          <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
            • Free Look Canvas • Connected Railway Transit Line Network
          </span>
        </div>

        {/* Action Controls & Zoom */}
        <div className="flex items-center gap-2">
          {activeProject?.knowledgeBase && activeProject.knowledgeBase.length > 0 && (
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors font-semibold"
              title="Inspect Project Knowledge Base"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge ({activeProject.knowledgeBase.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              const freeBot = bots.find((b) => !builtCabins[b.id]);
              const unassignedFile = files.find((f) => !f.lockedBy) || files[0];
              if (freeBot && unassignedFile) {
                handleAssignTask(unassignedFile.id, freeBot.id);
              } else {
                showToast('All bots already have cabins or no files available!', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-600/20 font-semibold"
            title="Call Bob to build a cabin for an available bot"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Build Cabin (Bob)</span>
          </button>

          {/* Pan & Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-2">
            <button
              onClick={() => setCanvasScale((s) => Math.min(1.4, s + 0.1))}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCanvasScale((s) => Math.max(0.65, s - 0.1))}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCanvasScale(1);
                setCanvasPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Draggable & Pannable Interactive Free-Look Canvas Viewport */}
      <div className="relative w-full h-[660px] overflow-hidden cursor-grab active:cursor-grabbing bg-[var(--bg-app)]">
        <motion.div
          drag
          dragElastic={0.08}
          dragConstraints={{ left: -400, right: 400, top: -240, bottom: 240 }}
          style={{ scale: canvasScale, x: canvasPan.x, y: canvasPan.y }}
          className="relative w-[1440px] h-[740px] mx-auto origin-center transition-transform"
        >
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* ============================================================ */}
          {/* ROAD & RAILWAY TRANSIT LINE SYSTEM (SVG OVERLAY)             */}
          {/* ============================================================ */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              {/* Glowing filter for neon railway tracks */}
              <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="railGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* --- UNDERBED HIGHWAY ROADWAYS --- */}
            {/* Artery 1: West Cabins Terminal (x: 540) to Central Vault (x: 720) */}
            <path
              d="M 288 414 L 720 414"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="32"
              strokeLinecap="round"
              fill="none"
            />
            {/* Artery 2: Central Vault (x: 720) to East Campus Depot (x: 900) */}
            <path
              d="M 720 414 L 920 414"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="32"
              strokeLinecap="round"
              fill="none"
            />
            {/* North Branch: East Campus Depot up to Coffee & Arcade */}
            <path
              d="M 920 414 L 920 200 L 1300 200"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* South Branch: East Campus Depot down to TV & Water Cooler */}
            <path
              d="M 920 414 L 920 620 L 1300 620"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Mid Branch: East Campus Depot into Library / Knowledge Vault */}
            <path
              d="M 920 414 L 1166 414"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cabins North Feeder (Pods 0, 1) */}
            <path
              d="M 288 200 L 288 414"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cabins South Feeder (Pods 4, 5) */}
            <path
              d="M 288 620 L 288 414"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth="28"
              strokeLinecap="round"
              fill="none"
            />

            {/* --- RAILWAY SLEEPER TIES (CROSS-TIES) --- */}
            <path
              d="M 172 414 L 720 414 M 720 414 L 920 414 M 920 414 L 920 200 L 1300 200 M 920 414 L 920 620 L 1300 620 M 920 414 L 1166 414 M 288 200 L 288 620"
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth="14"
              strokeDasharray="2 12"
              fill="none"
            />

            {/* --- TWIN RAILWAY TRACK RAILS --- */}
            <path
              d="M 172 411 L 720 411 M 720 411 L 920 411 M 920 411 L 920 197 L 1300 197 M 920 411 L 920 617 L 1300 617 M 920 411 L 1166 411 M 285 200 L 285 620"
              stroke="rgba(16, 185, 129, 0.45)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 172 417 L 720 417 M 720 417 L 920 417 M 920 417 L 920 203 L 1300 203 M 920 417 L 920 623 L 1300 623 M 920 417 L 1166 417 M 291 200 L 291 620"
              stroke="rgba(16, 185, 129, 0.45)"
              strokeWidth="2"
              fill="none"
            />

            {/* --- ANIMATED CENTER PULSE ENERGY LINE --- */}
            <path
              d="M 172 414 L 720 414 M 720 414 L 920 414 M 920 414 L 920 200 L 1300 200 M 920 414 L 920 620 L 1300 620 M 920 414 L 1166 414 M 288 200 L 288 620"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeDasharray="8 16"
              strokeLinecap="round"
              filter="url(#trackGlow)"
              className="animate-pulse"
              fill="none"
            />

            {/* Station Junction Nodes */}
            <circle cx="288" cy="414" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="720" cy="414" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
            <circle cx="920" cy="414" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="1036" cy="200" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <circle cx="1296" cy="200" r="5" fill="#a78bfa" stroke="#ffffff" strokeWidth="2" />
            <circle cx="1166" cy="414" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <circle cx="1036" cy="620" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            <circle cx="1296" cy="620" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Central Colony Concourse Label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--bg-panel)]/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] z-10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-[var(--text-main)]">Colony Transit Network</span>
            <span>(Cabins ↔ Vault ↔ Recreation Campus)</span>
          </div>

          {/* ============================================================ */}
          {/* LEFT SIDE: 6 WORK CABIN SLOTS (SPACIOUS & EXPANDED)          */}
          {/* ============================================================ */}
          <div className="absolute top-6 left-8 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-2 z-10">
            <Laptop className="w-4 h-4 text-emerald-500" />
            <span>WORK STUDIOS & CABINS DISTRICT</span>
          </div>

          {CABIN_SLOTS.map((slot) => {
            const assignedBotEntry = Object.entries(builtCabins).find(
              ([_, val]) => val.slot === slot.id
            );
            const assignedBotId = assignedBotEntry?.[0];
            const assignedFile = assignedBotEntry?.[1]?.file;
            const assignedBot = bots.find((b) => b.id === assignedBotId);

            return (
              <div
                key={slot.id}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className={`absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition-all duration-300 flex flex-col justify-between p-3.5 z-10 ${
                  assignedBot
                    ? 'bg-[var(--bg-card)] border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 hover:border-emerald-500/30'
                }`}
              >
                {/* Cabin Header */}
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[11px] font-mono font-bold text-[var(--text-main)] truncate">
                    {slot.name}
                  </span>
                  {assignedBot ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">Empty Lot</span>
                  )}
                </div>

                {/* Desk Furniture or File Task */}
                {assignedBot && assignedFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center my-1 bg-[var(--bg-panel)] rounded-xl p-2 border border-[var(--border-subtle)] shadow-inner">
                    <div className="flex items-center gap-1.5 mb-1 max-w-full">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-bold font-mono text-[var(--text-main)] truncate">
                        {assignedFile.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <BotFace
                        shape={assignedBot.avatarShape || 'squircle'}
                        color={assignedBot.avatarColor || '#10b981'}
                        status={assignedBot.status}
                        emote="lightbulb"
                        size={28}
                        showEmoteBadge={false}
                      />
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {assignedBot.name}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] capitalize">
                          {assignedBot.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnassignTask(assignedFile.id)}
                      className="mt-2 text-[10px] text-rose-500 hover:text-rose-400 font-bold underline font-mono transition-colors"
                      title="Demolish cabin with Rex and relieve bot"
                    >
                      (Relieve Bot / Demolish)
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-xl opacity-40 mb-1">🏗️</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      Ready for Bob to build
                    </span>
                  </div>
                )}

                {/* Cabin Footer Waypoint */}
                <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                  <span>Track Station #{slot.id + 1}</span>
                  {assignedBot && <span className="text-emerald-500 font-semibold">Locked</span>}
                </div>
              </div>
            );
          })}

          {/* ============================================================ */}
          {/* CENTER: WALL MONITOR BILLBOARD & SHARED MEMORY VAULT         */}
          {/* ============================================================ */}
          {/* Live App Monitor Billboard (Top Center) */}
          <div
            onClick={() => setShowWallMonitorModal(true)}
            style={{ left: '50%', top: '16%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-80 h-28 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2.5 shadow-xl hover:border-emerald-500 cursor-pointer transition-all group z-20"
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
                <Monitor className="w-3.5 h-3.5 text-emerald-500" /> Live Built App Monitor
              </span>
              <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 text-emerald-500 transition-transform" />
            </div>
            <div className="w-full h-16 bg-slate-950 rounded-xl overflow-hidden border border-[var(--border-subtle)] pointer-events-none shadow-inner">
              <iframe
                title="Mini Preview"
                srcDoc={bundledHtml}
                className="w-[200%] h-[200%] scale-50 origin-top-left border-0"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Central Memory Box Code Vault (Center Spine) */}
          <div
            style={{ left: '50%', top: '56%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-76 p-4 rounded-3xl bg-[var(--bg-card)] border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/15 flex flex-col gap-2.5 z-20"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-bold font-mono text-[var(--text-main)] flex items-center gap-2">
                <Folder className="w-4 h-4 text-emerald-500" />
                <span>Central Memory Vault</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {files.length} Files
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {files.map((f) => {
                const isLocked = Boolean(f.lockedBy);
                const lockerBot = bots.find((b) => b.id === f.lockedBy);

                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-panel)] text-[10px] font-mono border border-[var(--border-subtle)]"
                  >
                    <span className={`truncate max-w-[120px] font-semibold ${isLocked ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>
                      {f.path}
                    </span>

                    {isLocked ? (
                      <span className="text-amber-500 flex items-center gap-1 font-bold text-[9px]">
                        <Lock className="w-3 h-3" />
                        {lockerBot?.name || 'Locked'}
                      </span>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignTask(f.id, e.target.value);
                        }}
                        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] rounded-lg px-2 py-1 text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Assign...</option>
                        {bots.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>Station: 🏛️ Central Vault Depot</span>
              <span className="text-emerald-500 font-bold">AES-256</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: 5 RECREATION & LEISURE ACTIVITY ZONES            */}
          {/* ============================================================ */}
          <div className="absolute top-6 right-8 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-2 z-10">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>RECREATION & LEISURE CAMPUS (5 SPOTS)</span>
          </div>

          {/* Zone 1: Coffee Barista Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.coffee.x}%`, top: `${LEISURE_ZONES.coffee.y}%` }}
            className="absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3.5 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.coffee.icon}
                <span>Coffee Lounge</span>
              </div>
              <span className="text-[9px] font-mono text-amber-500">Espresso</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              ☕ 🥐
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.coffee.desc}</span>
              <span className="text-amber-500 shrink-0 font-bold">☕ Stop</span>
            </div>
          </div>

          {/* Zone 2: 8-Bit Arcade Playground */}
          <div
            style={{ left: `${LEISURE_ZONES.arcade.x}%`, top: `${LEISURE_ZONES.arcade.y}%` }}
            className="absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3.5 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.arcade.icon}
                <span>Arcade Playground</span>
              </div>
              <span className="text-[9px] font-mono text-violet-400">8-Bit</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              🕹️ 👾
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.arcade.desc}</span>
              <span className="text-violet-400 shrink-0 font-bold">🎮 Stop</span>
            </div>
          </div>

          {/* Zone 3: Knowledge Vault & Library */}
          <div
            onClick={() => setShowKnowledgeModal(true)}
            style={{ left: `${LEISURE_ZONES.library.x}%`, top: `${LEISURE_ZONES.library.y}%` }}
            className="absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border-2 border-emerald-500/40 p-3.5 flex flex-col justify-between shadow-xl cursor-pointer hover:border-emerald-500 transition-colors group z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.library.icon}
                <span>Knowledge Vault</span>
              </div>
              <BookOpen className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              📚 📖
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
              <span className="truncate">
                {activeProject?.knowledgeBase?.length ? `${activeProject.knowledgeBase.length} docs loaded` : 'Click to inspect docs'}
              </span>
              <span className="font-bold shrink-0">📚 Terminal</span>
            </div>
          </div>

          {/* Zone 4: Chill TV Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.tv.x}%`, top: `${LEISURE_ZONES.tv.y}%` }}
            className="absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3.5 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.tv.icon}
                <span>TV & Media Lounge</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400">Stream</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              📺 🛋️
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.tv.desc}</span>
              <span className="text-cyan-400 shrink-0 font-bold">📺 Stop</span>
            </div>
          </div>

          {/* Zone 5: Water Cooler Chat Hub */}
          <div
            style={{ left: `${LEISURE_ZONES.water_cooler.x}%`, top: `${LEISURE_ZONES.water_cooler.y}%` }}
            className="absolute w-52 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3.5 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.water_cooler.icon}
                <span>Water Cooler Chat</span>
              </div>
              <span className="text-[9px] font-mono text-blue-400">Social</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              💧 💬
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.water_cooler.desc}</span>
              <span className="text-blue-400 shrink-0 font-bold">💧 Branch</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOB THE BUILDER (CREATOR BOT) FLYING ANIMATION               */}
          {/* ============================================================ */}
          <AnimatePresence>
            {creatorBotState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 200, y: 300 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: (CABIN_SLOTS[creatorBotState.targetSlot]?.x || 20) * 14.4,
                  y: (CABIN_SLOTS[creatorBotState.targetSlot]?.y || 30) * 7.4,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.7 }}
                className="absolute z-50 flex flex-col items-center pointer-events-none"
              >
                <div className="px-3 py-1 bg-amber-500 text-slate-950 font-bold font-mono text-[11px] rounded-full shadow-xl flex items-center gap-1.5 mb-1.5 animate-bounce">
                  <HardHat className="w-4 h-4" />
                  <span>🔨 Bob: Constructing Studio for {creatorBotState.targetBotName}!</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500 border-2 border-white text-white flex items-center justify-center text-2xl shadow-2xl animate-pulse">
                  👷
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* REX THE WRECK-IT (DESTROYER BOT) FLYING ANIMATION            */}
          {/* ============================================================ */}
          <AnimatePresence>
            {destroyerBotState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 100, y: 150 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: (CABIN_SLOTS[destroyerBotState.targetSlot]?.x || 20) * 14.4,
                  y: (CABIN_SLOTS[destroyerBotState.targetSlot]?.y || 30) * 7.4,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.7 }}
                className="absolute z-50 flex flex-col items-center pointer-events-none"
              >
                <div className="px-3 py-1 bg-rose-500 text-white font-bold font-mono text-[11px] rounded-full shadow-xl flex items-center gap-1.5 mb-1.5 animate-bounce">
                  <Bomb className="w-4 h-4" />
                  <span>💥 Rex: Demolished Studio! Bot is free!</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-rose-600 border-2 border-white text-white flex items-center justify-center text-2xl shadow-2xl animate-pulse">
                  🚜
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* ALL BOTS LIVING & MOVING ON THE CANVAS FLOOR                 */}
          {/* ============================================================ */}
          {bots.map((bot, index) => {
            const pos = getBotPosition(bot, index);
            const isAssigned = Boolean(builtCabins[bot.id]);
            const isWorking = bot.status === 'working';
            const isTroubled = bot.status === 'blocked';

            // Determine appropriate facial emote
            let emote: BotEmoteType = 'normal';
            if (isProjectStopped) {
              emote = 'coffee'; // Relaxed / sleeping
            } else if (isTroubled) {
              emote = 'frustrated';
            } else if (isWorking || isAssigned) {
              emote = 'lightbulb';
            } else {
              const currentAct = botLeisureSpots[bot.id];
              emote = currentAct ? LEISURE_ZONES[currentAct].emote : 'normal';
            }

            return (
              <motion.div
                key={bot.id}
                animate={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
                transition={{
                  type: 'spring',
                  damping: 24,
                  stiffness: 70,
                }}
                onClick={() => setSelectedBotId(bot.id === selectedBotId ? null : bot.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-30 transition-transform ${
                  selectedBotId === bot.id ? 'scale-115' : 'hover:scale-110'
                }`}
              >
                {/* Floating Activity Bubble / Bot Name Pill */}
                <div className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-md flex items-center gap-1 mb-1 whitespace-nowrap">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: bot.avatarColor || '#10b981' }}
                  />
                  <span>{bot.name}</span>
                </div>

                {/* Animated Interactive Bot Face with Emotes */}
                <div className="relative">
                  <BotFace
                    shape={bot.avatarShape || 'squircle'}
                    color={bot.avatarColor || '#10b981'}
                    status={bot.status}
                    emote={emote}
                    size={36}
                    showEmoteBadge={true}
                  />

                  {/* Soft floor shadow */}
                  <div className="w-8 h-2 rounded-full bg-black/25 dark:bg-black/50 blur-[2px] mx-auto mt-0.5" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Fullscreen Sandbox Live App Modal */}
      {showWallMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl max-w-5xl w-full h-[85vh] p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-main)] font-heading">
                  Fullscreen Sandboxed Output Monitor
                </h3>
              </div>
              <button
                onClick={() => setShowWallMonitorModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-black">
              <iframe
                title="Fullscreen Output Monitor"
                srcDoc={bundledHtml}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-main)] font-heading">
                  Project Knowledge Base & Reference Docs
                </h3>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Close ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
              Bots consult these local files and reference documents on every turn to ensure requirements, standards, and specifications are respected.
            </p>

            {activeProject?.localFolderPath && (
              <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Folder className="w-4 h-4 shrink-0" />
                <span>Linked PC Directory: <strong>{activeProject.localFolderPath}</strong> (No 100MB limit)</span>
              </div>
            )}

            {activeProject?.knowledgeBase && activeProject.knowledgeBase.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeProject.knowledgeBase.map((k) => (
                  <div
                    key={k.id}
                    className="p-2.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        {k.type}
                      </span>
                      <span className="text-[var(--text-main)] font-semibold truncate">{k.name}</span>
                      <span className="text-[var(--text-faint)] text-[10px]">({formatFileSize(k.size)})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[var(--bg-panel)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)]">No knowledge files attached to this project yet.</p>
                <button
                  onClick={() => {
                    setShowKnowledgeModal(false);
                    setActiveView('projects');
                  }}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Go to Projects to Add Docs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
