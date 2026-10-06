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
  RotateCcw,
  ZoomIn,
  ZoomOut,
  FileCode,
  FileText,
  Laptop,
  Palette,
  Tv,
  Gamepad2,
  Droplet,
  BookOpen,
  Hammer,
  Bomb,
  HardHat,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
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

// 5 Leisure Activity Zones
export type LeisureActivity = 'coffee' | 'arcade' | 'tv' | 'water_cooler' | 'library';

interface LeisureZone {
  id: LeisureActivity;
  name: string;
  icon: React.ReactNode;
  desc: string;
  emote: BotEmoteType;
}

const LEISURE_ZONES: Record<LeisureActivity, LeisureZone> = {
  coffee: {
    id: 'coffee',
    name: 'Coffee Barista Lounge',
    icon: <Coffee className="w-5 h-5 text-amber-500" />,
    desc: 'Sipping fresh espresso & recharging energy',
    emote: 'coffee',
  },
  arcade: {
    id: 'arcade',
    name: '8-Bit Arcade Playground',
    icon: <Gamepad2 className="w-5 h-5 text-violet-400" />,
    desc: 'Playing retro arcade games & testing reflexes',
    emote: 'stars',
  },
  tv: {
    id: 'tv',
    name: 'Chill TV & Media Lounge',
    icon: <Tv className="w-5 h-5 text-cyan-400" />,
    desc: 'Watching tech talks & relaxing on plush sofa',
    emote: 'normal',
  },
  water_cooler: {
    id: 'water_cooler',
    name: 'Water Cooler Chat Hub',
    icon: <Droplet className="w-5 h-5 text-blue-400" />,
    desc: 'Gossiping & sharing multi-model project notes',
    emote: 'normal',
  },
  library: {
    id: 'library',
    name: 'Knowledge Vault & Library',
    icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
    desc: 'Reading project specifications & documentation',
    emote: 'lightbulb',
  },
};

// 6 Work Cabin Slots arranged in a zig-zag city street
interface CabinSlot {
  id: string;
  name: string;
  streetSide: 'north' | 'south';
}

const CABIN_SLOTS: CabinSlot[] = [
  { id: 'pod-1', name: 'Studio Pod Alpha', streetSide: 'north' },
  { id: 'pod-2', name: 'Studio Pod Beta', streetSide: 'south' },
  { id: 'pod-3', name: 'Studio Pod Gamma', streetSide: 'north' },
  { id: 'pod-4', name: 'Studio Pod Delta', streetSide: 'south' },
  { id: 'pod-5', name: 'Studio Pod Epsilon', streetSide: 'north' },
  { id: 'pod-6', name: 'Studio Pod Zeta', streetSide: 'south' },
];

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  // Street Navigator Tab State: 'cabins' | 'vault' | 'campus' | 'all'
  const [activeStreet, setActiveStreet] = useState<'cabins' | 'vault' | 'campus' | 'all'>('cabins');

  // Canvas zoom & pan state (for Free Look mode)
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // State for Bob the Builder and Rex the Destroyer animations
  const [bobAnimation, setBobAnimation] = useState<{ active: boolean; targetSlot: string | null; botName: string }>({
    active: false,
    targetSlot: null,
    botName: '',
  });

  const [rexAnimation, setRexAnimation] = useState<{ active: boolean; targetSlot: string | null; botName: string }>({
    active: false,
    targetSlot: null,
    botName: '',
  });

  // Track built cabins per bot
  const [builtCabins, setBuiltCabins] = useState<Record<string, { slot: string; file: VirtualFile }>>({});

  // Passive ambient bot wandering between leisure zones
  const [ambientBotZone, setAmbientBotZone] = useState<Record<string, LeisureActivity>>({});

  // Modals
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  const { activeProject, files, assignFileToBot, unassignFile } = useProjectStore();
  const { showToast, setActiveView } = useUIStore();

  // Sync cabins with active file locks
  useEffect(() => {
    const newCabins: Record<string, { slot: string; file: VirtualFile }> = {};
    const lockedFiles = files.filter((f) => f.lockedBy);

    lockedFiles.forEach((file, idx) => {
      if (file.lockedBy) {
        const slot = CABIN_SLOTS[idx % CABIN_SLOTS.length].id;
        newCabins[file.lockedBy] = { slot, file };
      }
    });

    setBuiltCabins(newCabins);
  }, [files]);

  // Ambient wandering timer for free untasked bots
  useEffect(() => {
    const activities: LeisureActivity[] = ['coffee', 'arcade', 'tv', 'water_cooler', 'library'];
    const interval = setInterval(() => {
      const freeBots = bots.filter((b) => !builtCabins[b.id]);
      if (freeBots.length === 0) return;

      const randomBot = freeBots[Math.floor(Math.random() * freeBots.length)];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];

      setAmbientBotZone((prev) => ({
        ...prev,
        [randomBot.id]: randomActivity,
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, [bots, builtCabins]);

  // Handle assigning file -> triggers Bob the Builder
  const handleAssignTask = async (fileId: string, botId: string) => {
    const bot = bots.find((b) => b.id === botId);
    const file = files.find((f) => f.id === fileId);
    if (!bot || !file) return;

    // Pick first open slot
    const usedSlots = Object.values(builtCabins).map((c) => c.slot);
    const openSlot = CABIN_SLOTS.find((s) => !usedSlots.includes(s.id)) || CABIN_SLOTS[0];

    // Trigger Bob the Builder
    setBobAnimation({
      active: true,
      targetSlot: openSlot.id,
      botName: bot.name,
    });

    setTimeout(async () => {
      await assignFileToBot(fileId, botId, bot.name);
      setBuiltCabins((prev) => ({
        ...prev,
        [botId]: { slot: openSlot.id, file },
      }));
      setBobAnimation({ active: false, targetSlot: null, botName: '' });
      showToast(`👷 Bob built a custom cabin for ${bot.name}!`, 'success');
    }, 1200);
  };

  // Handle releasing file -> triggers Rex the Destroyer
  const handleUnassignTask = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || !file.lockedBy) return;

    const botId = file.lockedBy;
    const bot = bots.find((b) => b.id === botId);
    const cabin = builtCabins[botId];

    if (cabin) {
      setRexAnimation({
        active: true,
        targetSlot: cabin.slot,
        botName: bot?.name || 'Bot',
      });
    }

    setTimeout(async () => {
      await unassignFile(fileId);
      setBuiltCabins((prev) => {
        const next = { ...prev };
        delete next[botId];
        return next;
      });
      setRexAnimation({ active: false, targetSlot: null, botName: '' });
      showToast(`🚜 Rex demolished the cabin and released the file!`, 'info');
    }, 1200);
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
      {/* Top Colony Header & Street Switcher */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-[var(--text-main)] font-heading">
              Colony Streets
            </span>
          </div>

          {/* Street Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
            <button
              onClick={() => setActiveStreet('cabins')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeStreet === 'cabins'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>🚧 Street 1: Cabins</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                {Object.keys(builtCabins).length}
              </span>
            </button>

            <button
              onClick={() => setActiveStreet('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeStreet === 'vault'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>🏛️ Street 2: Vault & App</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                {files.length}
              </span>
            </button>

            <button
              onClick={() => setActiveStreet('campus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeStreet === 'campus'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>☕ Street 3: Campus</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                5 spots
              </span>
            </button>

            <button
              onClick={() => setActiveStreet('all')}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeStreet === 'all'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Colony Free-Look Panorama"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Free Look</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
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

          {activeStreet === 'all' && (
            <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-2">
              <button
                onClick={() => setCanvasScale((s) => Math.min(1.4, s + 0.1))}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCanvasScale((s) => Math.max(0.7, s - 0.1))}
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
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STREET 1: WORK CABINS & STUDIOS (STUDIO DISTRICT)                         */}
      {/* ========================================================================= */}
      {activeStreet === 'cabins' && (
        <div className="p-6 bg-[var(--bg-app)] min-h-[520px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-[var(--text-main)] font-heading">
                Street 1: Studio Pod Cabins (Assigned Bots Work Here)
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Bob (`👷 🔨`) builds cabins • Rex (`🚜 💥`) demolishes them
            </span>
          </div>

          {/* Bob the Builder Active Construction Banner */}
          {bobAnimation.active && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-bounce">👷</span>
                <div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    Bob the Builder is constructing a Studio Cabin for {bobAnimation.botName}...
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Setting up desk, PC monitor, local git repo, and coffee mug!
                  </div>
                </div>
              </div>
              <Hammer className="w-5 h-5 text-emerald-500 animate-spin" />
            </motion.div>
          )}

          {/* Rex the Destroyer Active Demolition Banner */}
          {rexAnimation.active && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-pulse">🚜</span>
                <div>
                  <div className="text-xs font-bold text-rose-500 font-mono">
                    Rex the Demolition Bot is tearing down cabin for {rexAnimation.botName}!
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Task complete • Relieving bot to recreation campus.
                  </div>
                </div>
              </div>
              <Bomb className="w-5 h-5 text-rose-500 animate-bounce" />
            </motion.div>
          )}

          {/* Zig-Zag Cabin City Plots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CABIN_SLOTS.map((slot) => {
              const assignedEntry = Object.entries(builtCabins).find(([_, val]) => val.slot === slot.id);
              const assignedBotId = assignedEntry?.[0];
              const assignedFile = assignedEntry?.[1]?.file;
              const assignedBot = bots.find((b) => b.id === assignedBotId);

              return (
                <div
                  key={slot.id}
                  className={`relative rounded-3xl border p-4 transition-all duration-300 flex flex-col justify-between min-h-[210px] ${
                    assignedBot
                      ? 'bg-[var(--bg-card)] border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                      : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 hover:border-emerald-500/30'
                  }`}
                >
                  {/* Cabin Header Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[var(--text-main)] font-mono">{slot.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--bg-panel)] text-[var(--text-muted)]">
                        {slot.streetSide} street
                      </span>
                    </div>
                    {assignedBot ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[var(--text-faint)]">Empty Lot</span>
                    )}
                  </div>

                  {/* Cabin Interior */}
                  {assignedBot && assignedFile ? (
                    <div className="my-3 space-y-3">
                      {/* Occupant Bot Header */}
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 p-1 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                          <BotFace
                            shape={assignedBot.avatarShape || 'star'}
                            color={assignedBot.avatarColor || '#10b981'}
                            status={assignedBot.status}
                            emote="normal"
                            size={38}
                            showEmoteBadge={true}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
                            <span>{assignedBot.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] capitalize">({assignedBot.role})</span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Status: {assignedBot.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Locked File Work Desk */}
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <Monitor className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-bold text-[var(--text-main)] truncate">{assignedFile.path}</span>
                          </div>
                          <span className="text-[10px] text-amber-500 font-bold">🔒 LOCKED</span>
                        </div>

                        {/* Reassign / Release Controls */}
                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono border-t border-[var(--border-subtle)]">
                          <span className="text-[var(--text-muted)]">Reassign:</span>
                          <select
                            value={assignedBot.id}
                            onChange={async (e) => {
                              const newBotId = e.target.value;
                              if (newBotId && newBotId !== assignedBot.id) {
                                await handleAssignTask(assignedFile.id, newBotId);
                              }
                            }}
                            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 text-[var(--text-main)] focus:border-emerald-500"
                          >
                            {bots.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} ({b.role})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleUnassignTask(assignedFile.id)}
                            className="text-rose-500 hover:underline font-bold"
                            title="Demolish cabin & release file"
                          >
                            Release 🚜
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto text-center py-6">
                      <div className="w-10 h-10 rounded-2xl border border-dashed border-[var(--border-subtle)] mx-auto mb-2 flex items-center justify-center text-lg opacity-40">
                        🏗️
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-mono">Lot Ready for Construction</p>
                      <button
                        onClick={() => {
                          const freeBot = bots.find((b) => !builtCabins[b.id]);
                          const freeFile = files.find((f) => !f.lockedBy) || files[0];
                          if (freeBot && freeFile) {
                            handleAssignTask(freeFile.id, freeBot.id);
                          } else {
                            showToast('Create another bot or add a file first!', 'info');
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-mono font-semibold transition-colors"
                      >
                        + Assign Task to Build
                      </button>
                    </div>
                  )}

                  {/* Cabin Footer */}
                  <div className="text-[10px] font-mono text-[var(--text-faint)] flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <span>Street Lamp #0{slot.id.replace('pod-', '')} 💡</span>
                    <span>{assignedBot ? `Tokens: ${assignedBot.tokenUsage}` : 'Lot Available'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREET 2: MEMORY VAULT & LIVE APP MONITOR (TECH DISTRICT)                 */}
      {/* ========================================================================= */}
      {activeStreet === 'vault' && (
        <div className="p-6 bg-[var(--bg-app)] min-h-[520px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Memory Box Vault File Tree & Reassign Controls */}
            <div className="lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-main)] font-heading">
                        Central Memory Vault
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        Virtual filesystem shared across all bot models
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
                    {files.length} Files
                  </span>
                </div>

                {/* File Cards List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {files.map((file) => {
                    const lockInfo = activeLocks[file.path.toLowerCase()];
                    const assignedBot = lockInfo ? bots.find((b) => b.id === lockInfo.botId) : null;

                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-2 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="font-mono text-xs font-bold text-[var(--text-main)] truncate">
                              {file.path}
                            </span>
                            <span className="text-[10px] text-[var(--text-faint)] font-mono">
                              ({file.content.length} chars)
                            </span>
                          </div>

                          {/* Lock & Assignment Badge */}
                          {lockInfo ? (
                            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                              <Lock className="w-2.5 h-2.5" />
                              {lockInfo.botName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                              Free
                            </span>
                          )}
                        </div>

                        {/* Bot Auto-Summary Display */}
                        {file.lastSummary && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20 truncate">
                            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">Summary: {file.lastSummary}</span>
                          </div>
                        )}

                        {/* Reassign / Release Dropdown */}
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[var(--border-subtle)]">
                          <span className="text-[var(--text-muted)]">Assigned Bot:</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={file.lockedBy || ''}
                              onChange={async (e) => {
                                const botId = e.target.value;
                                if (!botId) {
                                  await handleUnassignTask(file.id);
                                } else {
                                  await handleAssignTask(file.id, botId);
                                }
                              }}
                              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] rounded-lg px-2 py-0.5 text-[var(--text-main)] focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="">(Unassigned / Free)</option>
                              {bots.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} ({b.role})
                                </option>
                              ))}
                            </select>
                            {file.lockedBy && (
                              <button
                                onClick={() => handleUnassignTask(file.id)}
                                className="text-[10px] text-rose-500 hover:underline font-bold"
                              >
                                Release
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-mono flex items-center justify-between">
                <span>Stored in browser IndexedDB (AES-GCM encrypted)</span>
                <button
                  onClick={() => setActiveView('office')}
                  className="text-emerald-500 hover:underline font-bold"
                >
                  Open Code Editor →
                </button>
              </div>
            </div>

            {/* Right: Full-Size Live Sandboxed App Monitor */}
            <div className="lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)] font-heading">
                      Live Built App Sandbox
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Real-time compilation of index.html, styles, and scripts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWallMonitorModal(true)}
                    className="p-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
                    title="Fullscreen Sandbox"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Iframe Preview */}
              <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-slate-950 shadow-inner">
                <iframe
                  title="Colony Live Preview"
                  srcDoc={bundledHtml}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full border-0"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-mono flex items-center justify-between">
                <span>Sandboxed iframe with zero external script access</span>
                <span className="text-emerald-500 font-bold">● Running Live</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREET 3: RECREATION CAMPUS & ACTIVITIES (FUN DISTRICT)                   */}
      {/* ========================================================================= */}
      {activeStreet === 'campus' && (
        <div className="p-6 bg-[var(--bg-app)] min-h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-[var(--text-main)] font-heading">
                Street 3: Recreation Campus (Untasked Bots Chill Here)
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Free bots roam between 5 fun spots with ambient movement
            </span>
          </div>

          {/* 5 Fun Activity Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.values(LEISURE_ZONES).map((zone, idx) => {
              // Find bots currently visiting this zone
              const zoneBots = bots.filter((b) => {
                if (builtCabins[b.id]) return false; // Assigned bots are in their cabins
                const currentAct = ambientBotZone[b.id] || (
                  idx === 0 ? 'coffee' :
                  idx === 1 ? 'arcade' :
                  idx === 2 ? 'tv' :
                  idx === 3 ? 'water_cooler' : 'library'
                );
                return currentAct === zone.id;
              });

              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    if (zone.id === 'library') setShowKnowledgeModal(true);
                  }}
                  className={`bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-4 shadow-lg flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-emerald-500/40 ${
                    zone.id === 'library' ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Zone Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                        {zone.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[var(--text-main)] font-mono">{zone.name}</h4>
                        <span className="text-[10px] text-[var(--text-muted)]">{zone.desc}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bots in this zone */}
                  <div className="my-4">
                    {zoneBots.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[var(--text-faint)] font-mono">
                        No bots currently in this zone
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        {zoneBots.map((bot) => (
                          <div
                            key={bot.id}
                            className="flex flex-col items-center gap-1 p-2 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] shadow-sm animate-in zoom-in-95 duration-200"
                          >
                            <BotFace
                              shape={bot.avatarShape || 'star'}
                              color={bot.avatarColor || '#10b981'}
                              status={bot.status}
                              emote={zone.emote}
                              size={34}
                              showEmoteBadge={true}
                            />
                            <span className="text-[10px] font-bold text-[var(--text-main)] font-mono">{bot.name}</span>
                            <span className="text-[9px] text-[var(--text-muted)] capitalize">({bot.role})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zone Footer */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>{zoneBots.length} bots chilling</span>
                    {zone.id === 'library' && <span className="text-emerald-500 font-bold">Inspect Docs →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FREE LOOK / PANORAMIC VIEWPORT                                           */}
      {/* ========================================================================= */}
      {activeStreet === 'all' && (
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

            {/* Central Dividing Walkway */}
            <div className="absolute top-0 bottom-0 left-[48%] w-12 border-x border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-faint)] rotate-90 whitespace-nowrap">
                Central Colony Concourse
              </span>
            </div>

            {/* Cabins Summary on Left */}
            <div className="absolute top-4 left-4 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-emerald-500" />
              <span>STREET 1: WORK CABINS</span>
            </div>

            {CABIN_SLOTS.slice(0, 4).map((slot, idx) => {
              const assignedEntry = Object.entries(builtCabins).find(([_, val]) => val.slot === slot.id);
              const assignedBot = assignedEntry ? bots.find((b) => b.id === assignedEntry[0]) : null;

              return (
                <div
                  key={slot.id}
                  style={{ left: `${idx % 2 === 0 ? 15 : 35}%`, top: `${idx < 2 ? 25 : 65}%` }}
                  className={`absolute w-44 h-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 flex flex-col justify-between ${
                    assignedBot
                      ? 'bg-[var(--bg-card)] border-emerald-500/50 shadow-md'
                      : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[var(--text-main)]">
                    <span>{slot.name}</span>
                    {assignedBot && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <div className="text-center py-2">
                    {assignedBot ? (
                      <span className="text-xs font-bold text-emerald-500">{assignedBot.name}</span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-faint)]">Empty Lot</span>
                    )}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] font-mono truncate">
                    {assignedBot ? `File: ${assignedEntry?.[1]?.file.path}` : 'Ready for Bob'}
                  </div>
                </div>
              );
            })}

            {/* Campus Summary on Right */}
            <div className="absolute top-4 right-4 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-500" />
              <span>STREET 3: RECREATION CAMPUS</span>
            </div>

            {Object.values(LEISURE_ZONES).map((zone, idx) => (
              <div
                key={zone.id}
                style={{
                  left: `${idx % 2 === 0 ? 65 : 85}%`,
                  top: `${idx === 0 || idx === 1 ? 25 : idx === 2 || idx === 3 ? 55 : 80}%`,
                }}
                className="absolute w-40 h-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2.5 flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {zone.icon}
                  <span className="text-[11px] font-bold text-[var(--text-main)] font-mono">{zone.name}</span>
                </div>
                <div className="text-[9px] text-[var(--text-muted)]">{zone.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Fullscreen Sandbox Modal */}
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
