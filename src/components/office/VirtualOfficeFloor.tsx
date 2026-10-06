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
  Tv,
  Gamepad2,
  Droplet,
  BookOpen,
  Hammer,
  Bomb,
  HardHat,
  Moon,
  Sun,
  Shield,
  Layers,
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

// 5 Leisure Activity Zones on the RIGHT SIDE
export type LeisureActivity = 'coffee' | 'arcade' | 'tv' | 'water_cooler' | 'library';

interface LeisureZone {
  id: LeisureActivity;
  name: string;
  icon: React.ReactNode;
  x: number; // percentage (60% to 94%)
  y: number; // percentage (15% to 80%)
  desc: string;
  emote: BotEmoteType;
}

const LEISURE_ZONES: Record<LeisureActivity, LeisureZone> = {
  coffee: {
    id: 'coffee',
    name: 'Coffee Barista Lounge',
    icon: <Coffee className="w-4 h-4 text-amber-500" />,
    x: 65,
    y: 22,
    desc: 'Sipping fresh espresso & recharging',
    emote: 'coffee',
  },
  arcade: {
    id: 'arcade',
    name: '8-Bit Arcade & Playground',
    icon: <Gamepad2 className="w-4 h-4 text-violet-400" />,
    x: 88,
    y: 22,
    desc: 'Playing retro games & testing reflexes',
    emote: 'stars',
  },
  tv: {
    id: 'tv',
    name: 'Chill TV & Media Lounge',
    icon: <Tv className="w-4 h-4 text-cyan-400" />,
    x: 88,
    y: 68,
    desc: 'Watching streams & relaxing on couch',
    emote: 'normal',
  },
  water_cooler: {
    id: 'water_cooler',
    name: 'Water Cooler Chat Hub',
    icon: <Droplet className="w-4 h-4 text-blue-400" />,
    x: 65,
    y: 70,
    desc: 'Gossiping & sharing multi-model notes',
    emote: 'normal',
  },
  library: {
    id: 'library',
    name: 'Reading Nook & Knowledge Vault',
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
    x: 76,
    y: 46,
    desc: 'Reading project specs & brand docs',
    emote: 'question',
  },
};

// 4 Cabin Workstation Slots on the LEFT SIDE
const CABIN_SLOTS = [
  { id: 0, x: 16, y: 24, name: 'Studio Pod Alpha' },
  { id: 1, x: 33, y: 24, name: 'Studio Pod Beta' },
  { id: 2, x: 16, y: 64, name: 'Studio Pod Gamma' },
  { id: 3, x: 33, y: 64, name: 'Studio Pod Delta' },
];

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  const {
    files,
    activeProject,
    selectFile,
    assignFileToBot,
    unassignFile,
  } = useProjectStore();
  const { showToast, setActiveView } = useUIStore();

  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  // Canvas Pan & Zoom
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // Passive Ambient Movement: Map of botId -> LeisureActivity
  const [botLeisureSpots, setBotLeisureSpots] = useState<Record<string, LeisureActivity>>({});

  // Dynamic Office Cabins: Map of botId -> { cabinSlotIndex: number, file: VirtualFile }
  const [builtCabins, setBuiltCabins] = useState<Record<string, { slot: number; file: VirtualFile }>>({});

  // Animation States for Bob (Creator Bot) and Rex (Destroyer Bot)
  const [creatorBotState, setCreatorBotState] = useState<{ active: boolean; targetBotName: string; targetSlot: number } | null>(null);
  const [destroyerBotState, setDestroyerBotState] = useState<{ active: boolean; targetBotName: string; targetSlot: number } | null>(null);

  // Is project stopped / asleep?
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

  // Passive ambient wandering: every 6 seconds, pick a free untasked bot and wander to a new zone
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
    }, 6000);

    return () => clearInterval(interval);
  }, [bots, builtCabins, isProjectStopped]);

  // Trigger Creator Bot ("Bob") Animation
  const triggerCreatorBot = (targetBot: Bot, slotIndex: number) => {
    setCreatorBotState({ active: true, targetBotName: targetBot.name, targetSlot: slotIndex });
    setTimeout(() => {
      setCreatorBotState(null);
    }, 2400);
  };

  // Trigger Destroyer Bot ("Rex") Animation
  const triggerDestroyerBot = (targetBotName: string, slotIndex: number) => {
    setDestroyerBotState({ active: true, targetBotName, targetSlot: slotIndex });
    setTimeout(() => {
      setDestroyerBotState(null);
    }, 2400);
  };

  // User handles assigning a file to a bot from the office canvas
  const handleAssignTask = async (fileId: string, botId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    const slotIndex = Object.keys(builtCabins).length % CABIN_SLOTS.length;
    triggerCreatorBot(targetBot, slotIndex);

    const success = await assignFileToBot(fileId, targetBot.id, targetBot.name);
    if (success) {
      showToast(`👷 Bob built a studio for ${targetBot.name} to work on file!`, 'success');
    }
  };

  // User handles relieving / unassigning a file
  const handleUnassignTask = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || !file.lockedBy) return;

    const botId = file.lockedBy;
    const targetBot = bots.find((b) => b.id === botId);
    const botName = targetBot?.name || 'Bot';
    const slotIndex = builtCabins[botId]?.slot ?? 0;

    triggerDestroyerBot(botName, slotIndex);
    await unassignFile(fileId);
    showToast(`🚜 Rex demolished the studio! ${botName} is free to relax in lounge.`, 'info');
  };

  // Compute position for each bot on the floor
  const getBotPosition = (bot: Bot, index: number) => {
    const cabin = builtCabins[bot.id];

    // If bot has an assigned cabin on the LEFT SIDE
    if (cabin) {
      const slot = CABIN_SLOTS[cabin.slot] || CABIN_SLOTS[0];
      return { x: slot.x + 3, y: slot.y + 2 };
    }

    // Untasked free bots hang out on the RIGHT SIDE
    const currentActivity = botLeisureSpots[bot.id] || (
      index % 5 === 0 ? 'coffee' :
      index % 5 === 1 ? 'arcade' :
      index % 5 === 2 ? 'tv' :
      index % 5 === 3 ? 'water_cooler' : 'library'
    );

    const zone = LEISURE_ZONES[currentActivity];
    // Slightly offset bots so they don't overlap in the same activity zone
    const offsetX = ((index % 3) - 1) * 3.5;
    const offsetY = Math.floor(index / 3) * 3;

    return { x: zone.x + offsetX, y: zone.y + offsetY };
  };

  // Mini preview HTML for the whiteboard monitor
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

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg mb-6 select-none transition-colors duration-200">
      {/* Top Floor Header & Canvas Toolbar */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[var(--text-main)]">Virtual Simulation Floor</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
            (Left: Work Cabins • Center: Vault • Right: 5 Leisure Activities)
          </span>
        </div>

        {/* Action & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {activeProject?.knowledgeBase && activeProject.knowledgeBase.length > 0 && (
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
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
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm font-semibold"
            title="Simulate Bob building a cabin & assigning a file"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Build Cabin (Bob)</span>
          </button>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-1" />

          <button
            onClick={() => setCanvasScale((s) => Math.min(1.4, s + 0.1))}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCanvasScale((s) => Math.max(0.7, s - 0.1))}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setCanvasScale(1);
              setCanvasPan({ x: 0, y: 0 });
            }}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Draggable & Pannable Interactive Canvas Viewport */}
      <div className="relative w-full h-[580px] overflow-hidden cursor-grab active:cursor-grabbing bg-[var(--bg-app)]">
        <motion.div
          drag
          dragElastic={0.08}
          dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
          style={{ scale: canvasScale, x: canvasPan.x, y: canvasPan.y }}
          className="relative w-[1200px] h-[680px] mx-auto origin-center transition-transform"
        >
          {/* Floor Isometric Grid Blueprint */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Center Dividing Walkway */}
          <div className="absolute top-0 bottom-0 left-[48%] w-12 border-x border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-faint)] rotate-90 whitespace-nowrap">
              Central Office Concourse
            </span>
          </div>

          {/* ============================================================ */}
          {/* LEFT SIDE: DYNAMIC WORK CABINS & PRODUCTION STUDIOS          */}
          {/* ============================================================ */}
          <div className="absolute top-4 left-4 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-emerald-500" />
            <span>WORK STUDIOS & CABINS (DYNAMICALLY BUILT)</span>
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
                className={`absolute w-44 h-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition-all duration-500 flex flex-col justify-between p-3 ${
                  assignedBot
                    ? 'bg-[var(--bg-card)] border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/20'
                }`}
              >
                {/* Cabin Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-main)] truncate">
                    {slot.name}
                  </span>
                  {assignedBot ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="text-[9px] font-mono text-[var(--text-faint)]">Empty Lot</span>
                  )}
                </div>

                {/* Cabin Furniture or Desk Representation */}
                {assignedBot && assignedFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center my-1 bg-[var(--bg-panel)] rounded-xl p-2 border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold font-mono text-[var(--text-main)] truncate max-w-[100px]">
                        {assignedFile.path}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                      🔒 File Locked at Desk
                    </span>
                    <button
                      onClick={() => handleUnassignTask(assignedFile.id)}
                      className="mt-1 text-[9px] text-rose-500 hover:underline font-mono"
                    >
                      (Relieve Bot / Demolish)
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[10px] text-[var(--text-faint)] font-mono">
                    Awaiting Assignment
                  </div>
                )}

                <div className="text-[9px] text-[var(--text-muted)] font-mono truncate">
                  {assignedBot ? `Occupant: ${assignedBot.name}` : 'Call Bob to Build'}
                </div>
              </div>
            );
          })}

          {/* ============================================================ */}
          {/* CENTER: SHARED MEMORY BOX VAULT & WALL MONITOR                */}
          {/* ============================================================ */}
          {/* Wall Whiteboard Monitor (Top Center) */}
          <div
            onClick={() => setShowWallMonitorModal(true)}
            className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-24 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2 shadow-md hover:border-emerald-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3 text-emerald-500" /> Live App Monitor
              </span>
              <Maximize2 className="w-3 h-3 group-hover:scale-110 text-emerald-500 transition-transform" />
            </div>
            <div className="w-full h-14 bg-black rounded-lg overflow-hidden border border-[var(--border-subtle)] pointer-events-none">
              <iframe
                title="Mini Preview"
                srcDoc={bundledHtml}
                className="w-[200%] h-[200%] scale-50 origin-top-left border-0"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Central Memory Box Code Vault */}
          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 p-3.5 rounded-2xl bg-[var(--bg-card)] border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex flex-col gap-2 z-20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[var(--text-main)] flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-500" /> Memory Box Vault
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {files.length} Files
              </span>
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {files.map((f) => {
                const isLocked = Boolean(f.lockedBy);
                const lockerBot = bots.find((b) => b.id === f.lockedBy);

                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-panel)] text-[10px] font-mono border border-[var(--border-subtle)]"
                  >
                    <span className={`truncate max-w-[110px] ${isLocked ? 'line-through opacity-70' : 'text-[var(--text-main)]'}`}>
                      {f.path}
                    </span>

                    {isLocked ? (
                      <span className="text-amber-500 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        {lockerBot?.name || 'Locked'}
                      </span>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignTask(f.id, e.target.value);
                        }}
                        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[9px] rounded px-1 py-0.5 text-[var(--text-main)]"
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
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: 5 RECREATION & LEISURE ACTIVITY ZONES            */}
          {/* ============================================================ */}
          <div className="absolute top-4 right-4 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>LEISURE & UNTASKED CAMPUS (5 ACTIVITIES)</span>
          </div>

          {/* Zone 1: Coffee Barista Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.coffee.x}%`, top: `${LEISURE_ZONES.coffee.y}%` }}
            className="absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-panel)]/40 border border-[var(--border-subtle)] p-3 flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[var(--text-main)]">
              {LEISURE_ZONES.coffee.icon}
              <span>Coffee Lounge</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl opacity-60">
              ☕ 🥐
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">
              {LEISURE_ZONES.coffee.desc}
            </div>
          </div>

          {/* Zone 2: 8-Bit Arcade & Playground */}
          <div
            style={{ left: `${LEISURE_ZONES.arcade.x}%`, top: `${LEISURE_ZONES.arcade.y}%` }}
            className="absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-panel)]/40 border border-[var(--border-subtle)] p-3 flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[var(--text-main)]">
              {LEISURE_ZONES.arcade.icon}
              <span>Arcade Playground</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl opacity-60">
              🕹️ 👾
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">
              {LEISURE_ZONES.arcade.desc}
            </div>
          </div>

          {/* Zone 3: Chill TV Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.tv.x}%`, top: `${LEISURE_ZONES.tv.y}%` }}
            className="absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-panel)]/40 border border-[var(--border-subtle)] p-3 flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[var(--text-main)]">
              {LEISURE_ZONES.tv.icon}
              <span>TV & Media Lounge</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl opacity-60">
              📺 🛋️
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">
              {LEISURE_ZONES.tv.desc}
            </div>
          </div>

          {/* Zone 4: Water Cooler Chat Hub */}
          <div
            style={{ left: `${LEISURE_ZONES.water_cooler.x}%`, top: `${LEISURE_ZONES.water_cooler.y}%` }}
            className="absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-panel)]/40 border border-[var(--border-subtle)] p-3 flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[var(--text-main)]">
              {LEISURE_ZONES.water_cooler.icon}
              <span>Water Cooler Chat</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl opacity-60">
              💧 💬
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">
              {LEISURE_ZONES.water_cooler.desc}
            </div>
          </div>

          {/* Zone 5: Reading Nook & Knowledge Vault */}
          <div
            onClick={() => setShowKnowledgeModal(true)}
            style={{ left: `${LEISURE_ZONES.library.x}%`, top: `${LEISURE_ZONES.library.y}%` }}
            className="absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-panel)]/40 border border-[var(--border-subtle)] p-3 flex flex-col justify-between cursor-pointer hover:border-emerald-500 transition-colors group"
          >
            <div className="flex items-center justify-between text-[10px] font-bold font-mono text-[var(--text-main)]">
              <span className="flex items-center gap-1.5">
                {LEISURE_ZONES.library.icon} Knowledge Vault
              </span>
              <BookOpen className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl opacity-60">
              📚 📖
            </div>
            <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
              {activeProject?.knowledgeBase?.length ? `${activeProject.knowledgeBase.length} docs loaded` : 'Click to add docs'}
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOB THE BUILDER (CREATOR BOT) ANIMATION                      */}
          {/* ============================================================ */}
          <AnimatePresence>
            {creatorBotState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 200, y: 300 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: CABIN_SLOTS[creatorBotState.targetSlot]?.x * 12 || 200,
                  y: CABIN_SLOTS[creatorBotState.targetSlot]?.y * 6.8 || 200,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.6 }}
                className="absolute z-50 flex flex-col items-center pointer-events-none"
              >
                <div className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold font-mono text-[11px] rounded-full shadow-lg flex items-center gap-1 mb-1 animate-bounce">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>🔨 Bob: Building Studio for {creatorBotState.targetBotName}!</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500 border-2 border-white text-white flex items-center justify-center text-xl shadow-xl animate-pulse">
                  👷
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* REX THE WRECK-IT (DESTROYER BOT) ANIMATION                   */}
          {/* ============================================================ */}
          <AnimatePresence>
            {destroyerBotState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 50, y: 100 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: CABIN_SLOTS[destroyerBotState.targetSlot]?.x * 12 || 200,
                  y: CABIN_SLOTS[destroyerBotState.targetSlot]?.y * 6.8 || 200,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.6 }}
                className="absolute z-50 flex flex-col items-center pointer-events-none"
              >
                <div className="px-2.5 py-1 bg-rose-500 text-white font-bold font-mono text-[11px] rounded-full shadow-lg flex items-center gap-1 mb-1 animate-bounce">
                  <Bomb className="w-3.5 h-3.5" />
                  <span>💥 Rex: Demolished Studio! Work done!</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xl shadow-xl animate-pulse">
                  🚜
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* RENDER ALL BOTS ON THE CANVAS FLOOR                          */}
          {/* ============================================================ */}
          {bots.map((bot, index) => {
            const pos = getBotPosition(bot, index);
            const isAssigned = Boolean(builtCabins[bot.id]);
            const isWorking = bot.status === 'working';
            const isTroubled = bot.status === 'blocked';

            // Determine appropriate facial emote
            let emote: BotEmoteType = 'normal';
            if (isProjectStopped) {
              emote = 'coffee'; // Sleeping / relaxed
            } else if (isTroubled) {
              emote = 'frustrated';
            } else if (isWorking) {
              emote = 'lightbulb';
            } else if (isAssigned) {
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
                  stiffness: 45,
                  damping: 14,
                }}
                onClick={() => setSelectedBotId(bot.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group flex flex-col items-center"
              >
                {/* Sleeping ZZZ bubble when project is stopped */}
                {isProjectStopped && (
                  <div className="absolute -top-12 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shadow-md animate-bounce whitespace-nowrap">
                    💤 zzz (Sleeping)
                  </div>
                )}

                {/* File chip if bot is currently carrying file in cabin */}
                {isAssigned && builtCabins[bot.id]?.file && (
                  <div className="absolute -top-12 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 shadow-md whitespace-nowrap flex items-center gap-1 border border-emerald-400">
                    <FileCode className="w-3 h-3" />
                    <span>{builtCabins[bot.id].file.path}</span>
                    <Lock className="w-2.5 h-2.5 ml-0.5" />
                  </div>
                )}

                {/* Animated Bot Face in custom shape */}
                <BotFace
                  shape={bot.avatarShape || 'squircle'}
                  color={bot.avatarColor}
                  status={isProjectStopped ? 'waiting' : bot.status}
                  emote={emote}
                  size={46}
                  showEmoteBadge={!isProjectStopped}
                />

                {/* Name Tag */}
                <div
                  className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shadow-sm transition-all flex items-center gap-1 ${
                    isAssigned
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                      : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-subtle)]'
                  }`}
                >
                  <span>{bot.name}</span>
                  <span className="text-[9px] opacity-75 font-normal">({bot.role})</span>
                </div>

                {/* Interactive Details Popover */}
                {selectedBotId === bot.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-16 w-52 p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-strong)] shadow-2xl z-50 text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-[var(--text-main)]">{bot.name}</span>
                      <button
                        onClick={() => setSelectedBotId(null)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] italic mb-2 leading-snug">
                      "{bot.personality}"
                    </p>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] space-y-0.5 border-t border-[var(--border-subtle)] pt-1.5">
                      <div>Status: <strong className="text-[var(--text-main)] capitalize">{isAssigned ? 'Assigned to Cabin' : 'Free in Lounge'}</strong></div>
                      <div>Tokens: <strong className="text-[var(--text-main)]">{bot.tokenUsage.toLocaleString()}</strong></div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Wall Monitor Expand Modal */}
      {showWallMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]">
              <span className="text-xs font-bold font-mono text-[var(--text-main)] flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-emerald-500" />
                Live Project Whiteboard App Preview
              </span>
              <button
                onClick={() => setShowWallMonitorModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 bg-black">
              <iframe
                title="Full Preview"
                srcDoc={bundledHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-modals"
              />
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-main)] font-mono">
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
              Bots consult these local files and reference documents on every turn to ensure brand consistency, architecture standards, and specifications are respected.
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
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
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
