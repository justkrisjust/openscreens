import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Tv,
  Gamepad2,
  Droplet,
  BookOpen,
  Hammer,
  Bomb,
  HardHat,
  X,
  Pause,
  Play,
  Zap,
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

// 7 Leisure & Study Activity Zones across Campus
export type LeisureActivity =
  | 'coffee'
  | 'arcade'
  | 'gpu_spa'
  | 'dj_lounge'
  | 'tv'
  | 'water_cooler'
  | 'knowledge';

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

export const LEISURE_ZONES: Record<LeisureActivity, LeisureZone> = {
  coffee: {
    id: 'coffee',
    name: 'Coffee Barista Lounge',
    icon: <Coffee className="w-4 h-4 text-amber-500" />,
    x: 72,
    y: 23,
    desc: 'Sipping espresso & recharging energy',
    emote: 'coffee',
    stationName: '☕ Coffee Station',
  },
  arcade: {
    id: 'arcade',
    name: '8-Bit Arcade Playground',
    icon: <Gamepad2 className="w-4 h-4 text-violet-400" />,
    x: 90,
    y: 23,
    desc: 'Testing reflexes with retro games',
    emote: 'stars',
    stationName: '🕹️ Arcade Depot',
  },
  gpu_spa: {
    id: 'gpu_spa',
    name: 'GPU Overclock Sauna & Spa',
    icon: <Zap className="w-4 h-4 text-rose-400" />,
    x: 72,
    y: 53,
    desc: 'Thermal cooling dip & clearing tensor cache',
    emote: 'stars',
    stationName: '🧖‍♂️ GPU Spa',
  },
  dj_lounge: {
    id: 'dj_lounge',
    name: 'Synthwave DJ Booth & Dancefloor',
    icon: <Sparkles className="w-4 h-4 text-fuchsia-400" />,
    x: 90,
    y: 53,
    desc: 'Tuning neural frequencies to synth beats',
    emote: 'normal',
    stationName: '🎧 DJ Stage',
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
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge Vault Terminal',
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    x: 50,
    y: 82,
    desc: 'Reading project specs & documentation',
    emote: 'lightbulb',
    stationName: '📚 Vault Terminal',
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
  { id: 0, name: 'Studio Pod Alpha', x: 12, y: 23 },
  { id: 1, name: 'Studio Pod Beta', x: 28, y: 23 },
  { id: 2, name: 'Studio Pod Gamma', x: 12, y: 53 },
  { id: 3, name: 'Studio Pod Delta', x: 28, y: 53 },
  { id: 4, name: 'Studio Pod Epsilon', x: 12, y: 82 },
  { id: 5, name: 'Studio Pod Zeta', x: 28, y: 82 },
];

const TRANSIT_ANIMATION_SECONDS = 3.2;

export const VirtualOfficeFloor: React.FC<VirtualOfficeFloorProps> = ({
  bots,
  activeLocks,
  isExecutingTurn,
}) => {
  const {
    files,
    activeProject,
    events,
    assignFileToBot,
    unassignFile,
    toggleBotPause,
    pausedBotIds,
  } = useProjectStore();
  const { showToast, setActiveView } = useUIStore();

  const [selectedBotForBrief, setSelectedBotForBrief] = useState<Bot | null>(null);
  const [showWallMonitorModal, setShowWallMonitorModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  // Canvas Pan & Zoom (Free Look)
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // Passive ambient wandering spots for untasked bots
  const [botLeisureSpots, setBotLeisureSpots] = useState<Record<string, LeisureActivity>>({});

  // Dynamic Office Cabins: botId -> { slot: number, file: VirtualFile }
  const [builtCabins, setBuiltCabins] = useState<Record<string, { slot: number; file: VirtualFile }>>({});

  // Track waypoint paths for bots so they follow the green line instead of jumping diagonally
  const [botTransitPaths, setBotTransitPaths] = useState<
    Record<string, Array<{ x: number; y: number }>>
  >({});
  const prevSpotRef = useRef<Record<string, LeisureActivity | string>>({});

  // Active Construction State (Two-step flow: Bob builds first -> then Bot travels along line)
  const [activeConstruction, setActiveConstruction] = useState<{
    botId: string;
    botName: string;
    fileId: string;
    slotIndex: number;
    stage: 'bob_traveling' | 'bob_building' | 'bob_returning' | 'bot_traveling';
  } | null>(null);

  // Active Demolition State (Two-step flow: Bot leaves first -> then Rex demolishes office)
  const [activeDemolition, setActiveDemolition] = useState<{
    botId: string;
    botName: string;
    fileId: string;
    slotIndex: number;
    stage: 'bot_leaving' | 'rex_traveling' | 'rex_demolishing' | 'rex_returning';
  } | null>(null);

  // Tentative cabin visibly standing while bot is in transit
  const [tentativeCabin, setTentativeCabin] = useState<{
    slotIndex: number;
    file: VirtualFile;
    botId: string;
  } | null>(null);

  // Vacating cabin slot while bot is walking to leisure zone
  const [vacatingCabinSlot, setVacatingCabinSlot] = useState<number | null>(null);

  // Bob's Workshop Cell State (Top-Left cell at x: 12%, y: 9%)
  const [bobPos, setBobPos] = useState<{ x: number; y: number }>({ x: 12, y: 9 });
  const [bobStatus, setBobStatus] = useState<'idle' | 'traveling' | 'building' | 'returning'>('idle');
  const [bobSpeech, setBobSpeech] = useState<string | null>(null);

  // Rex's Demolition Depot Cell State (Top-Left cell at x: 28%, y: 9%)
  const [rexPos, setRexPos] = useState<{ x: number; y: number }>({ x: 28, y: 9 });
  const [rexStatus, setRexStatus] = useState<'idle' | 'traveling' | 'demolishing' | 'returning'>('idle');
  const [rexSpeech, setRexSpeech] = useState<string | null>(null);

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

  // =========================================================================
  // WAYPOINT ROUTING STRICTLY ALONG THE LIGHT GREEN TRANSIT NETWORK
  // Includes the separate Cabin-to-Chill Express Bypass Line (y = 36%) per SS1
  // =========================================================================
  const computeWaypointsAlongLine = (
    fromSpot: LeisureActivity | string,
    toSpot: LeisureActivity | string,
    index: number
  ): Array<{ x: number; y: number }> => {
    const offsetX = ((index % 3) - 1) * 3.5;
    const offsetY = Math.floor(index / 3) * 2.8;

    // CASE 1: Heading into a Cabin Workstation (e.g. 'cabin-0')
    if (typeof toSpot === 'string' && toSpot.startsWith('cabin-')) {
      const slotIndex = parseInt(toSpot.replace('cabin-', ''), 10) || 0;
      const slot = CABIN_SLOTS[slotIndex] || CABIN_SLOTS[0];
      const targetDesk = { x: slot.x + 2.5, y: slot.y + 1.5 };

      // From another cabin
      if (typeof fromSpot === 'string' && fromSpot.startsWith('cabin-')) {
        const fromIndex = parseInt(fromSpot.replace('cabin-', ''), 10) || 0;
        const fromSlot = CABIN_SLOTS[fromIndex] || CABIN_SLOTS[0];
        return [
          { x: fromSlot.x + 2.5, y: fromSlot.y + 1.5 },
          { x: 20, y: fromSlot.y },
          { x: 20, y: slot.y },
          targetDesk,
        ];
      }

      // From Knowledge Vault at Center Bottom (x: 50, y: 82)
      if (fromSpot === 'knowledge') {
        return [
          { x: 50, y: 82 },
          { x: 20, y: 82 },
          { x: 20, y: slot.y },
          targetDesk,
        ];
      }

      // From Recreation Campus: Travel via the Express Bypass Line (SS1 fix)
      const fromZone = LEISURE_ZONES[fromSpot as LeisureActivity] || LEISURE_ZONES.coffee;
      const fromPos = { x: fromZone.x + offsetX, y: fromZone.y + offsetY };
      return [
        fromPos,
        { x: 64, y: fromZone.y }, // Step onto East spine
        { x: 64, y: 36 },         // Walk along East spine to Express Bypass Line
        { x: 20, y: 36 },         // Glide across Express Bypass above Vault
        { x: 20, y: slot.y },     // Down West spine to cabin floor
        targetDesk,               // Enter cabin desk
      ];
    }

    // CASE 2: Heading to Knowledge Vault at Center Bottom (SS2 fix)
    if (toSpot === 'knowledge') {
      const finalDest = { x: 50 + offsetX, y: 82 + offsetY };

      // From a Cabin
      if (typeof fromSpot === 'string' && fromSpot.startsWith('cabin-')) {
        const slotIndex = parseInt(fromSpot.replace('cabin-', ''), 10) || 0;
        const slot = CABIN_SLOTS[slotIndex] || CABIN_SLOTS[0];
        return [
          { x: slot.x + 2.5, y: slot.y + 1.5 },
          { x: 20, y: slot.y },
          { x: 20, y: 82 },
          finalDest,
        ];
      }

      // From an East Campus Chill Zone
      const fromZone = LEISURE_ZONES[fromSpot as LeisureActivity] || LEISURE_ZONES.coffee;
      const fromPos = { x: fromZone.x + offsetX, y: fromZone.y + offsetY };
      return [
        fromPos,
        { x: 64, y: fromZone.y },
        { x: 64, y: 82 },
        finalDest,
      ];
    }

    // CASE 3: Heading to an East Campus Recreation Lounge
    const targetZone = LEISURE_ZONES[toSpot as LeisureActivity] || LEISURE_ZONES.coffee;
    const finalDest = { x: targetZone.x + offsetX, y: targetZone.y + offsetY };

    // From Cabin desk: Travel via Express Bypass Line (SS1 fix)
    if (typeof fromSpot === 'string' && fromSpot.startsWith('cabin-')) {
      const slotIndex = parseInt(fromSpot.replace('cabin-', ''), 10) || 0;
      const slot = CABIN_SLOTS[slotIndex] || CABIN_SLOTS[0];
      return [
        { x: slot.x + 2.5, y: slot.y + 1.5 }, // Origin in cabin desk
        { x: 20, y: slot.y },                // Step onto West spine
        { x: 20, y: 36 },                    // Up West spine to Express Bypass Line
        { x: 64, y: 36 },                    // Glide across Express Bypass above Vault
        { x: 64, y: targetZone.y },          // Along East spine to target lounge
        finalDest,                           // Enter lounge spot
      ];
    }

    // From Knowledge Vault at Center Bottom
    if (fromSpot === 'knowledge') {
      return [
        { x: 50, y: 82 },
        { x: 64, y: 82 },
        { x: 64, y: targetZone.y },
        finalDest,
      ];
    }

    // Between two East Campus recreation spots
    const fromZone = LEISURE_ZONES[fromSpot as LeisureActivity] || LEISURE_ZONES.coffee;
    const fromPos = { x: fromZone.x + offsetX, y: fromZone.y + offsetY };

    if (fromZone.id === targetZone.id) {
      return [finalDest];
    }

    if (fromZone.y === targetZone.y) {
      return [fromPos, finalDest];
    }

    return [
      fromPos,
      { x: 64, y: fromZone.y },
      { x: 64, y: targetZone.y },
      finalDest,
    ];
  };

  // =========================================================================
  // INDEPENDENT ASYNCHRONOUS WANDERING PER BOT (12s to 45s STAGGERED INTERVALS)
  // Bots roam freely across all leisure zones & Knowledge Vault anytime!
  // =========================================================================
  useEffect(() => {
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};

    const scheduleNextWander = (botId: string) => {
      // Randomized timestamp between 12s and 45s per bot
      const randomDelay = Math.floor(Math.random() * (45000 - 12000)) + 12000;

      timers[botId] = setTimeout(() => {
        const isAssigned = Boolean(builtCabins[botId]);
        const isBusyWithCrew = activeConstruction?.botId === botId || activeDemolition?.botId === botId;
        const isMoving = Boolean(botTransitPaths[botId]);

        if (!isAssigned && !isBusyWithCrew && !isMoving) {
          const activities: LeisureActivity[] = [
            'coffee',
            'arcade',
            'gpu_spa',
            'dj_lounge',
            'tv',
            'water_cooler',
            'knowledge',
          ];
          const currentSpot = prevSpotRef.current[botId] || botLeisureSpots[botId] || 'coffee';
          const candidates = activities.filter((a) => a !== currentSpot);
          const nextActivity = candidates[Math.floor(Math.random() * candidates.length)] || 'coffee';

          const botIndex = bots.findIndex((b) => b.id === botId);
          const waypoints = computeWaypointsAlongLine(currentSpot, nextActivity, botIndex);

          prevSpotRef.current[botId] = nextActivity;

          setBotTransitPaths((prev) => ({
            ...prev,
            [botId]: waypoints,
          }));

          setBotLeisureSpots((prev) => ({
            ...prev,
            [botId]: nextActivity,
          }));

          // Remove transit path strictly after full movement finishes (3.2s animation + 200ms buffer)
          setTimeout(() => {
            setBotTransitPaths((prev) => {
              const next = { ...prev };
              delete next[botId];
              return next;
            });
          }, 3400);
        }

        // Schedule subsequent wandering loop
        scheduleNextWander(botId);
      }, randomDelay);
    };

    bots.forEach((bot) => {
      scheduleNextWander(bot.id);
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [bots, builtCabins, activeConstruction, activeDemolition]);

  // =========================================================================
  // TASK ASSIGNMENT SEQUENTIAL FLOW (Bob builds FIRST -> then Bot travels)
  // =========================================================================
  const handleAssignTask = async (fileId: string, botId: string) => {
    if (!activeProject) {
      setBobSpeech("Vault not open to build office! Create or select a project first.");
      showToast("Vault not open to build office! Create or select a project first.", "warn");
      setTimeout(() => setBobSpeech(null), 3500);
      return;
    }

    if (activeConstruction || activeDemolition) {
      showToast("Crew is currently busy! Please wait a moment.", "info");
      return;
    }

    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    // Pick first open slot
    const usedSlots = Object.values(builtCabins).map((c) => c.slot);
    if (tentativeCabin) usedSlots.push(tentativeCabin.slotIndex);
    const openSlot = CABIN_SLOTS.find((s) => !usedSlots.includes(s.id)) || CABIN_SLOTS[0];

    // STEP 1: Bob dispatches from his workshop cell directly to the cabin slot
    setActiveConstruction({
      botId: targetBot.id,
      botName: targetBot.name,
      fileId,
      slotIndex: openSlot.id,
      stage: 'bob_traveling',
    });
    setBobStatus('traveling');
    setBobPos({ x: openSlot.x, y: openSlot.y });
    setBobSpeech(`On my way to construct studio for ${targetBot.name}!`);

    // STEP 2: Bob arrives and builds office
    setTimeout(() => {
      setBobStatus('building');
      setBobSpeech(`🔨 Bob: Constructing ${openSlot.name}...`);
    }, 800);

    // STEP 3: Bob completes construction and flies back to his workshop cell
    setTimeout(() => {
      setBobStatus('returning');
      setBobPos({ x: 12, y: 9 });
      setBobSpeech(`Studio built! ${targetBot.name}, reporting for duty!`);
      // Studio is now built and standing on the floor
      setTentativeCabin({ slotIndex: openSlot.id, file: targetFile, botId: targetBot.id });
    }, 2000);

    // STEP 4: Bob arrives back in his cell; Bot leaves chill spot and travels along the green line
    setTimeout(() => {
      setBobStatus('idle');
      setBobSpeech(null);

      setActiveConstruction((prev) => (prev ? { ...prev, stage: 'bot_traveling' } : null));

      const botIndex = bots.findIndex((b) => b.id === targetBot.id);
      const currentSpot = prevSpotRef.current[targetBot.id] || botLeisureSpots[targetBot.id] || 'coffee';
      const waypoints = computeWaypointsAlongLine(currentSpot, `cabin-${openSlot.id}`, botIndex);

      setBotTransitPaths((prev) => ({
        ...prev,
        [targetBot.id]: waypoints,
      }));
    }, 2800);

    // STEP 5: Bot arrives at desk, locks file, and gets seated
    // Transit duration is 3.2s (3200ms). Step 4 is at 2800ms -> Step 5 fires at 2800 + 3400 = 6200ms!
    setTimeout(async () => {
      await assignFileToBot(fileId, targetBot.id, targetBot.name);
      prevSpotRef.current[targetBot.id] = `cabin-${openSlot.id}`;

      setBotTransitPaths((prev) => {
        const next = { ...prev };
        delete next[targetBot.id];
        return next;
      });

      setTentativeCabin(null);
      setActiveConstruction(null);

      showToast(`✨ ${targetBot.name} is seated in ${openSlot.name} working on ${targetFile.path}!`, 'success');
      if (selectedBotForBrief?.id === botId) {
        setSelectedBotForBrief(null);
      }
    }, 6200);
  };

  // =========================================================================
  // TASK RELEASE SEQUENTIAL FLOW (Bot leaves FIRST -> then Rex demolishes)
  // =========================================================================
  const handleUnassignTask = async (fileId: string) => {
    if (activeConstruction || activeDemolition) {
      showToast("Crew is currently busy! Please wait a moment.", "info");
      return;
    }

    const file = files.find((f) => f.id === fileId);
    if (!file || !file.lockedBy) return;

    const botId = file.lockedBy;
    const targetBot = bots.find((b) => b.id === botId);
    const botName = targetBot?.name || 'Bot';
    const slotIndex = builtCabins[botId]?.slot ?? 0;
    const slot = CABIN_SLOTS[slotIndex] || CABIN_SLOTS[0];

    const destChill: LeisureActivity = 'coffee';
    const botIndex = bots.findIndex((b) => b.id === botId);

    // STEP 1: Bot leaves office FIRST and travels along transit line to chill area
    setActiveDemolition({
      botId,
      botName,
      fileId,
      slotIndex,
      stage: 'bot_leaving',
    });
    setVacatingCabinSlot(slotIndex);

    const waypoints = computeWaypointsAlongLine(`cabin-${slotIndex}`, destChill, botIndex);
    setBotTransitPaths((prev) => ({
      ...prev,
      [botId]: waypoints,
    }));

    // STEP 2: Bot safely arrives at chill spot (after 3400ms); Rex leaves depot directly to cabin
    setTimeout(() => {
      setBotLeisureSpots((prev) => ({
        ...prev,
        [botId]: destChill,
      }));
      prevSpotRef.current[botId] = destChill;
      setBotTransitPaths((prev) => {
        const next = { ...prev };
        delete next[botId];
        return next;
      });

      // Now Rex dispatches directly from depot to cabin
      setActiveDemolition((prev) => (prev ? { ...prev, stage: 'rex_traveling' } : null));
      setRexStatus('traveling');
      setRexPos({ x: slot.x, y: slot.y });
      setRexSpeech(`🚜 Rex: En route to demolish ${slot.name}!`);
    }, 3400);

    // STEP 3: Rex arrives and demolishes the office
    setTimeout(() => {
      setRexStatus('demolishing');
      setRexSpeech(`💥 Demolishing studio! ${botName} safely chilled.`);
    }, 4200);

    // STEP 4: Rex finishes demolition and returns to depot
    setTimeout(async () => {
      setRexStatus('returning');
      setRexPos({ x: 28, y: 9 });
      setRexSpeech(`Demolition complete! Lot is cleared.`);

      setVacatingCabinSlot(null);
      await unassignFile(fileId);
    }, 5400);

    // STEP 5: Rex arrives back at depot
    setTimeout(() => {
      setRexStatus('idle');
      setRexSpeech(null);
      setActiveDemolition(null);

      showToast(`🚜 Rex demolished the studio! ${botName} is relaxing in leisure campus.`, 'info');
      if (selectedBotForBrief?.id === botId) {
        setSelectedBotForBrief(null);
      }
    }, 6200);
  };

  // Get current waypoint array for rendering bot position / animation
  const getBotWaypoints = (bot: Bot, index: number): Array<{ x: number; y: number }> => {
    // If bot has active transit route along the green line, follow it!
    if (botTransitPaths[bot.id] && botTransitPaths[bot.id].length > 0) {
      return botTransitPaths[bot.id];
    }

    // If bot has an established cabin desk and isn't vacating:
    const cabin = builtCabins[bot.id];
    if (cabin && vacatingCabinSlot !== cabin.slot) {
      const slot = CABIN_SLOTS[cabin.slot] || CABIN_SLOTS[0];
      return [{ x: slot.x + 2.5, y: slot.y + 1.5 }];
    }

    // Default resting spot in leisure campus or Knowledge Vault
    const currentActivity = botLeisureSpots[bot.id] || (
      index % 7 === 0 ? 'coffee' :
      index % 7 === 1 ? 'arcade' :
      index % 7 === 2 ? 'gpu_spa' :
      index % 7 === 3 ? 'dj_lounge' :
      index % 7 === 4 ? 'knowledge' :
      index % 7 === 5 ? 'tv' : 'water_cooler'
    );

    const zone = LEISURE_ZONES[currentActivity] || LEISURE_ZONES.coffee;
    const offsetX = ((index % 3) - 1) * 3.5;
    const offsetY = Math.floor(index / 3) * 2.8;

    return [{ x: zone.x + offsetX, y: zone.y + offsetY }];
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
            • Free Look Canvas • Connected Transit Network
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
              if (!activeProject) {
                setBobSpeech("Vault not open to build office! Create or select a project first.");
                showToast("Vault not open to build office! Create or select a project first.", "warn");
                setTimeout(() => setBobSpeech(null), 3500);
                return;
              }
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
      <div className="relative w-full h-[720px] overflow-hidden cursor-grab active:cursor-grabbing bg-[var(--bg-app)]">
        <motion.div
          drag
          dragElastic={0.08}
          dragConstraints={{ left: -400, right: 400, top: -240, bottom: 240 }}
          style={{ scale: canvasScale, x: canvasPan.x, y: canvasPan.y }}
          className="relative w-[1440px] h-[860px] mx-auto origin-center transition-transform"
        >
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* ============================================================ */}
          {/* COMPLETE LIGHT GREEN TRANSIT NETWORK (WITH EXPRESS BYPASS)   */}
          {/* ============================================================ */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <filter id="cleanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Soft Ambient Underglow */}
            <path
              d="M 172 198 L 403 198 M 172 455 L 403 455 M 172 705 L 403 705 M 288 198 L 288 705 M 288 310 L 920 310 M 288 455 L 920 455 M 720 455 L 720 705 M 920 198 L 920 705 M 920 198 L 1296 198 M 920 455 L 1296 455 M 920 705 L 1296 705"
              stroke="rgba(52, 211, 153, 0.2)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Single Clean Light Green Line */}
            <path
              d="M 172 198 L 403 198 M 172 455 L 403 455 M 172 705 L 403 705 M 288 198 L 288 705 M 288 310 L 920 310 M 288 455 L 920 455 M 720 455 L 720 705 M 920 198 L 920 705 M 920 198 L 1296 198 M 920 455 L 1296 455 M 920 705 L 1296 705"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cleanGlow)"
              fill="none"
            />

            {/* Sleek Junction Waypoint Dots */}
            {/* Express Cabin-to-Chill Bypass Junctions (SS1 fix) */}
            <circle cx="288" cy="310" r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
            <circle cx="920" cy="310" r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />

            {/* Concourse & Central Vault Junctions */}
            <circle cx="288" cy="455" r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
            <circle cx="720" cy="455" r="6" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
            <circle cx="920" cy="455" r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />

            {/* Center Bottom Knowledge Vault Junction (SS2 fix) */}
            <circle cx="720" cy="705" r="6" fill="#34d399" stroke="#ffffff" strokeWidth="2" />

            {/* East Campus Recreation Junctions */}
            <circle cx="1036" cy="198" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="1296" cy="198" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="1036" cy="455" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="1296" cy="455" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="1036" cy="705" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="1296" cy="705" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          {/* Central Colony Concourse Label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--bg-panel)]/80 backdrop-blur-sm px-4 py-1 rounded-full border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] z-10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-[var(--text-main)]">Colony Transit Network</span>
            <span>(Cabins ↔ Express Line ↔ Vault ↔ Recreation)</span>
          </div>

          {/* ============================================================ */}
          {/* TOP LEFT: CREW WORKSHOPS (BOB & REX CELLS)                   */}
          {/* ============================================================ */}
          <div className="absolute top-4 left-6 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-2 z-10">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span>CREW WORKSHOPS & CABINS DISTRICT</span>
          </div>

          {/* Bob's Workshop Cell (Resting Station for Bob) */}
          <div
            onClick={() => {
              if (!activeProject) {
                setBobSpeech("Vault not open to build office! Create or select a project first.");
                showToast("Vault not open to build office! Create or select a project first.", "warn");
                setTimeout(() => setBobSpeech(null), 3500);
              } else {
                setBobSpeech("Ready to construct! Assign a task to deploy me.");
                setTimeout(() => setBobSpeech(null), 3000);
              }
            }}
            style={{ left: '12%', top: '9%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-48 h-16 rounded-2xl bg-[var(--bg-card)] border border-amber-500/40 p-2.5 flex items-center gap-2.5 shadow-lg shadow-amber-500/5 hover:border-amber-400 cursor-pointer transition-all z-20 group"
            title="Bob's Workshop - Click to talk with Bob"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              {bobStatus === 'idle' ? '👷' : '🏗️'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-[var(--text-main)] truncate">Bob's Workshop</span>
                <span className={`w-2 h-2 rounded-full ${bobStatus !== 'idle' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
              </div>
              <div className="text-[9px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                {bobStatus === 'idle' ? 'Office Builder • Ready' : '🔨 Out on Site'}
              </div>
            </div>
          </div>

          {/* Rex's Demolition Depot Cell (Resting Station for Rex) */}
          <div
            onClick={() => {
              setRexSpeech("Ready to clear! Relieve any working bot to demolish its studio.");
              setTimeout(() => setRexSpeech(null), 3000);
            }}
            style={{ left: '28%', top: '9%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-48 h-16 rounded-2xl bg-[var(--bg-card)] border border-rose-500/40 p-2.5 flex items-center gap-2.5 shadow-lg shadow-rose-500/5 hover:border-rose-400 cursor-pointer transition-all z-20 group"
            title="Rex's Demolition Depot - Click to talk with Rex"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              {rexStatus === 'idle' ? '🚜' : '💥'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-[var(--text-main)] truncate">Rex's Depot</span>
                <span className={`w-2 h-2 rounded-full ${rexStatus !== 'idle' ? 'bg-rose-400 animate-ping' : 'bg-emerald-500'}`} />
              </div>
              <div className="text-[9px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                {rexStatus === 'idle' ? 'Demolition Yard • Ready' : '💥 Demolishing'}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOB THE BUILDER DYNAMIC FLIGHT / CONSTRUCTION DISPATCH       */}
          {/* ============================================================ */}
          <motion.div
            animate={{
              left: `${bobPos.x}%`,
              top: `${bobPos.y}%`,
              scale: bobStatus === 'building' ? [1, 1.2, 1] : bobStatus !== 'idle' ? 1.1 : 0,
              opacity: bobStatus !== 'idle' ? 1 : 0,
            }}
            transition={{
              duration: bobStatus === 'traveling' || bobStatus === 'returning' ? 0.8 : 0.3,
              ease: 'easeInOut',
              repeat: bobStatus === 'building' ? Infinity : 0,
              repeatType: 'reverse',
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-50"
          >
            {bobSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -top-12 bg-amber-500 text-slate-950 font-bold font-mono text-[10px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-50 animate-bounce"
              >
                {bobSpeech}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-500" />
              </motion.div>
            )}
            <div className="w-13 h-13 rounded-2xl bg-amber-500 border-2 border-white text-white flex items-center justify-center text-2xl shadow-2xl animate-pulse">
              👷
            </div>
          </motion.div>

          {/* Bob's speech bubble when idle in his cell */}
          {bobStatus === 'idle' && bobSpeech && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ left: '12%', top: '3.5%' }}
              className="absolute -translate-x-1/2 bg-amber-500 text-slate-950 font-bold font-mono text-[10px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-50 animate-bounce pointer-events-none"
            >
              {bobSpeech}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-500" />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* REX THE DEMOLISHER DYNAMIC FLIGHT / DEMOLITION DISPATCH      */}
          {/* ============================================================ */}
          <motion.div
            animate={{
              left: `${rexPos.x}%`,
              top: `${rexPos.y}%`,
              scale: rexStatus === 'demolishing' ? [1, 1.25, 1] : rexStatus !== 'idle' ? 1.1 : 0,
              opacity: rexStatus !== 'idle' ? 1 : 0,
            }}
            transition={{
              duration: rexStatus === 'traveling' || rexStatus === 'returning' ? 0.8 : 0.3,
              ease: 'easeInOut',
              repeat: rexStatus === 'demolishing' ? Infinity : 0,
              repeatType: 'reverse',
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-50"
          >
            {rexSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -top-12 bg-rose-500 text-white font-bold font-mono text-[10px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-50 animate-bounce"
              >
                {rexSpeech}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-500" />
              </motion.div>
            )}
            <div className="w-13 h-13 rounded-2xl bg-rose-600 border-2 border-white text-white flex items-center justify-center text-2xl shadow-2xl animate-pulse">
              🚜
            </div>
          </motion.div>

          {/* Rex's speech bubble when idle in his cell */}
          {rexStatus === 'idle' && rexSpeech && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ left: '28%', top: '3.5%' }}
              className="absolute -translate-x-1/2 bg-rose-500 text-white font-bold font-mono text-[10px] px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap z-50 animate-bounce pointer-events-none"
            >
              {rexSpeech}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-500" />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* LEFT SIDE: 6 WORK CABIN SLOTS (SPACIOUS & EXPANDED)          */}
          {/* ============================================================ */}
          {CABIN_SLOTS.map((slot) => {
            // When there is NO active project, all offices are closed
            if (!activeProject) {
              return (
                <div
                  key={slot.id}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  className="absolute w-52 h-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/40 p-3.5 flex flex-col justify-between z-10 opacity-75"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[11px] font-mono font-bold text-[var(--text-main)] truncate">
                      {slot.name}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-amber-500 font-bold">
                      <Lock className="w-2.5 h-2.5" />
                      Closed
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-xl mb-1 opacity-70">🔒</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono">
                      Office Closed
                    </span>
                    <span className="text-[9px] text-[var(--text-faint)] mt-0.5">
                      Vault closed • Standby
                    </span>
                  </div>

                  <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-faint)]">
                    <span>Track Station #{slot.id + 1}</span>
                    <span>Standby</span>
                  </div>
                </div>
              );
            }

            // Active Project Mode: Check if assigned or tentatively built
            const isTentative = tentativeCabin && tentativeCabin.slotIndex === slot.id;
            const isVacating = vacatingCabinSlot === slot.id;

            const assignedBotEntry = Object.entries(builtCabins).find(
              ([_, val]) => val.slot === slot.id
            );
            const assignedBotId = isTentative ? tentativeCabin.botId : assignedBotEntry?.[0];
            const assignedFile = isTentative ? tentativeCabin.file : assignedBotEntry?.[1]?.file;
            const assignedBot = bots.find((b) => b.id === assignedBotId);

            // Construction & Demolition Indicators
            const isBeingBuilt = activeConstruction?.slotIndex === slot.id && activeConstruction.stage === 'bob_building';
            const isBeingDemolished = activeDemolition?.slotIndex === slot.id && activeDemolition.stage === 'rex_demolishing';

            return (
              <div
                key={slot.id}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className={`absolute w-52 h-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border transition-all duration-300 flex flex-col justify-between p-3.5 z-10 ${
                  assignedBot && !isVacating
                    ? 'bg-[var(--bg-card)] border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : isBeingBuilt
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md animate-pulse'
                    : isBeingDemolished
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-md animate-pulse'
                    : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 hover:border-emerald-500/30'
                }`}
              >
                {/* Cabin Header */}
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[11px] font-mono font-bold text-[var(--text-main)] truncate">
                    {slot.name}
                  </span>
                  {isBeingBuilt ? (
                    <span className="text-[9px] font-mono text-amber-500 font-bold animate-pulse">
                      🔨 Building...
                    </span>
                  ) : isBeingDemolished ? (
                    <span className="text-[9px] font-mono text-rose-500 font-bold animate-pulse">
                      💥 Demolishing...
                    </span>
                  ) : isVacating ? (
                    <span className="text-[9px] font-mono text-amber-500 font-bold">
                      Vacating...
                    </span>
                  ) : assignedBot ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">Empty Lot</span>
                  )}
                </div>

                {/* Desk Furniture or File Task (NO duplicate static BotFace image per SS3) */}
                {assignedBot && assignedFile && !isVacating ? (
                  <div className="flex-1 flex flex-col items-center justify-center my-1 bg-[var(--bg-panel)] rounded-xl p-2 border border-[var(--border-subtle)] shadow-inner">
                    <div className="flex items-center gap-1.5 mb-1 max-w-full">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] font-bold font-mono text-[var(--text-main)] truncate">
                        {assignedFile.path}
                      </span>
                    </div>

                    {/* Developer Info Tag (Duplicate static face removed per user feedback in SS3) */}
                    <div
                      onClick={() => setSelectedBotForBrief(assignedBot)}
                      className="flex items-center justify-between w-full mt-0.5 px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-emerald-500 transition-colors"
                      title="Click to view bot dossier"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: assignedBot.avatarColor || '#10b981' }}
                        />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate">
                          {assignedBot.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] capitalize shrink-0 font-mono">
                        {assignedBot.role}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUnassignTask(assignedFile.id)}
                      className="mt-1.5 text-[10px] text-rose-500 hover:text-rose-400 font-bold underline font-mono transition-colors"
                      title="Relieve bot to leisure campus & call Rex to demolish cabin"
                    >
                      (Relieve Bot / Demolish)
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-xl opacity-40 mb-1">
                      {isBeingBuilt ? '🔨' : isBeingDemolished ? '💥' : '🏗️'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {isBeingBuilt
                        ? 'Bob constructing...'
                        : isBeingDemolished
                        ? 'Rex demolishing...'
                        : isVacating
                        ? 'Bot leaving desk...'
                        : 'Ready for Bob to build'}
                    </span>
                  </div>
                )}

                {/* Cabin Footer Waypoint */}
                <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                  <span>Track Station #{slot.id + 1}</span>
                  {assignedBot && !isVacating && <span className="text-emerald-500 font-semibold">Locked</span>}
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
            style={{ left: '50%', top: '17%' }}
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
            style={{ left: '50%', top: '53%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-80 p-4 rounded-3xl border-2 shadow-2xl transition-all z-20 flex flex-col gap-2.5 ${
              !activeProject
                ? 'bg-[var(--bg-card)]/95 border-amber-500/60 shadow-amber-500/10'
                : 'bg-[var(--bg-card)] border-emerald-500/60 shadow-emerald-500/15'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-bold font-mono text-[var(--text-main)] flex items-center gap-2">
                {!activeProject ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Folder className="w-4 h-4 text-emerald-500" />
                )}
                <span>{!activeProject ? 'Vault Sealed (Standby)' : 'Central Memory Vault'}</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  !activeProject
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
              >
                {!activeProject ? '🔒 Closed' : `${files.length} Files`}
              </span>
            </div>

            {!activeProject ? (
              <div className="py-5 px-3 flex flex-col items-center justify-center text-center bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)]">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center text-2xl mb-2 animate-pulse">
                  🔒
                </div>
                <div className="text-xs font-bold text-[var(--text-main)] font-mono">
                  Vault Closed - No Active Project
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 max-w-[200px] leading-relaxed">
                  Vault doors are locked. Bob cannot build offices without an active project.
                </p>
                <button
                  onClick={() => setActiveView('projects')}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-semibold font-mono shadow-md transition-all hover:scale-105"
                >
                  + Create / Select Project
                </button>
              </div>
            ) : (
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
            )}

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span>Station: 🏛️ Central Vault Depot</span>
              <span className={!activeProject ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                {!activeProject ? 'AES-256 Locked' : 'AES-256 Active'}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CENTER BOTTOM: KNOWLEDGE VAULT TERMINAL (MOVED PER SS2)       */}
          {/* ============================================================ */}
          <div
            onClick={() => setShowKnowledgeModal(true)}
            style={{ left: '50%', top: '82%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-80 h-36 rounded-3xl bg-[var(--bg-card)] border-2 border-emerald-500/40 p-3.5 flex flex-col justify-between shadow-xl cursor-pointer hover:border-emerald-500 transition-colors group z-20"
            title="Click to inspect project knowledge base"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Knowledge Vault Terminal</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {activeProject?.knowledgeBase?.length || 0} Docs
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
              <div className="text-3xl opacity-80 mb-0.5 group-hover:scale-110 transition-transform">
                📚 📖
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {activeProject?.knowledgeBase?.length
                  ? `${activeProject.knowledgeBase.length} docs indexed • Click to read`
                  : 'Click to inspect or link knowledge'}
              </span>
            </div>

            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
              <span>Station: 📚 Vault Terminal</span>
              <span className="font-bold">AES-256 Storage</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: 6 RECREATION & LEISURE ACTIVITY ZONES            */}
          {/* ============================================================ */}
          <div className="absolute top-4 right-8 text-xs font-mono font-bold text-[var(--text-muted)] flex items-center gap-2 z-10">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>RECREATION & LEISURE CAMPUS (6 SPOTS)</span>
          </div>

          {/* Zone 1: Coffee Barista Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.coffee.x}%`, top: `${LEISURE_ZONES.coffee.y}%` }}
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 flex flex-col justify-between shadow-lg z-10"
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
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 flex flex-col justify-between shadow-lg z-10"
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

          {/* Zone 3: GPU Overclock Sauna & Thermal Spa (NEW Bot Area) */}
          <div
            style={{ left: `${LEISURE_ZONES.gpu_spa.x}%`, top: `${LEISURE_ZONES.gpu_spa.y}%` }}
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-rose-500/30 p-3 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.gpu_spa.icon}
                <span>GPU Overclock Spa</span>
              </div>
              <span className="text-[9px] font-mono text-rose-400">Thermal</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              🧖‍♂️ ♨️
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.gpu_spa.desc}</span>
              <span className="text-rose-400 shrink-0 font-bold">⚡ Spa</span>
            </div>
          </div>

          {/* Zone 4: Synthwave DJ Booth & Dancefloor (NEW Bot Area) */}
          <div
            style={{ left: `${LEISURE_ZONES.dj_lounge.x}%`, top: `${LEISURE_ZONES.dj_lounge.y}%` }}
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-fuchsia-500/30 p-3 flex flex-col justify-between shadow-lg z-10"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)] text-[11px] font-bold font-mono text-[var(--text-main)]">
              <div className="flex items-center gap-1.5">
                {LEISURE_ZONES.dj_lounge.icon}
                <span>Synthwave DJ Booth</span>
              </div>
              <span className="text-[9px] font-mono text-fuchsia-400">Synth</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-3xl opacity-75">
              🎧 🪩
            </div>
            <div className="pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
              <span className="truncate">{LEISURE_ZONES.dj_lounge.desc}</span>
              <span className="text-fuchsia-400 shrink-0 font-bold">🪩 Stage</span>
            </div>
          </div>

          {/* Zone 5: Chill TV Lounge */}
          <div
            style={{ left: `${LEISURE_ZONES.tv.x}%`, top: `${LEISURE_ZONES.tv.y}%` }}
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 flex flex-col justify-between shadow-lg z-10"
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

          {/* Zone 6: Water Cooler Chat Hub */}
          <div
            style={{ left: `${LEISURE_ZONES.water_cooler.x}%`, top: `${LEISURE_ZONES.water_cooler.y}%` }}
            className="absolute w-52 h-38 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 flex flex-col justify-between shadow-lg z-10"
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
          {/* ALL BOTS MOVING ALONG THE GREEN TRANSIT LINE                 */}
          {/* ============================================================ */}
          {bots.map((bot, index) => {
            const waypoints = getBotWaypoints(bot, index);
            const isAssigned = Boolean(builtCabins[bot.id]) && vacatingCabinSlot !== builtCabins[bot.id]?.slot;
            const isWorking = bot.status === 'working';
            const isTroubled = bot.status === 'blocked';
            const isPaused = pausedBotIds.has(bot.id);

            // Determine appropriate facial emote
            let emote: BotEmoteType = 'normal';
            if (isProjectStopped || isPaused || !activeProject) {
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
                  left: waypoints.map((p) => `${p.x}%`),
                  top: waypoints.map((p) => `${p.y}%`),
                }}
                transition={{
                  duration: TRANSIT_ANIMATION_SECONDS,
                  ease: 'easeInOut',
                }}
                onClick={() => setSelectedBotForBrief(bot)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-30 transition-transform hover:scale-115"
              >
                {/* Floating Activity Bubble / Bot Name Pill */}
                <div className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-mono font-bold text-[var(--text-main)] shadow-md flex items-center gap-1 mb-1 whitespace-nowrap group-hover:border-emerald-500 transition-colors">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: bot.avatarColor || '#10b981' }}
                  />
                  <span>{bot.name}</span>
                  {isPaused && <span className="text-[9px] text-amber-500">(Paused)</span>}
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

      {/* ============================================================ */}
      {/* BOT BRIEF / DOSSIER MODAL ON CLICK                           */}
      {/* ============================================================ */}
      {selectedBotForBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
              <div className="flex items-center gap-3">
                <BotFace
                  shape={selectedBotForBrief.avatarShape || 'squircle'}
                  color={selectedBotForBrief.avatarColor || '#10b981'}
                  status={selectedBotForBrief.status}
                  emote={
                    builtCabins[selectedBotForBrief.id]
                      ? 'lightbulb'
                      : LEISURE_ZONES[botLeisureSpots[selectedBotForBrief.id] || 'coffee'].emote
                  }
                  size={48}
                  showEmoteBadge={true}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-main)] font-heading">
                      {selectedBotForBrief.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      {selectedBotForBrief.role}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    Model Provider: <strong className="text-[var(--text-main)]">{selectedBotForBrief.provider}</strong>
                    {selectedBotForBrief.model && ` (${selectedBotForBrief.model})`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBotForBrief(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
                title="Close dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3.5 text-xs">
              {/* Location & Current Task */}
              <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] mb-1 flex items-center justify-between">
                  <span>Current Assignment & Location</span>
                  {builtCabins[selectedBotForBrief.id] ? (
                    <span className="text-emerald-500 flex items-center gap-1 font-bold">
                      <Lock className="w-3 h-3" /> In Cabin Studio
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold">Untasked (In Lounge)</span>
                  )}
                </div>

                {builtCabins[selectedBotForBrief.id] ? (
                  <div>
                    <p className="text-[var(--text-main)] font-semibold mt-1">
                      Working on: <code className="text-emerald-500 font-mono">{builtCabins[selectedBotForBrief.id].file.path}</code>
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                      Location: {CABIN_SLOTS[builtCabins[selectedBotForBrief.id].slot]?.name}
                    </p>
                    <button
                      onClick={() => handleUnassignTask(builtCabins[selectedBotForBrief.id].file.id)}
                      className="mt-2.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Bomb className="w-3 h-3" />
                      <span>Relieve Bot & Demolish Cabin (Rex)</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[var(--text-main)] mt-1">
                      Chilling at: <strong className="text-amber-500 font-mono">{LEISURE_ZONES[botLeisureSpots[selectedBotForBrief.id] || 'coffee'].name}</strong>
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {LEISURE_ZONES[botLeisureSpots[selectedBotForBrief.id] || 'coffee'].desc}
                    </p>

                    {/* Quick Assign Dropdown */}
                    {activeProject && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">Assign File:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAssignTask(e.target.value, selectedBotForBrief.id);
                          }}
                          defaultValue=""
                          className="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs rounded-xl px-2.5 py-1 text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Choose file for bot...</option>
                          {files.filter((f) => !f.lockedBy).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.path}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Token Usage Stats */}
              <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--text-muted)] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Token Budget & Usage</span>
                  </span>
                  <span className="text-[var(--text-main)]">
                    {selectedBotForBrief.tokenUsage.toLocaleString()} / {selectedBotForBrief.tokenCap.toLocaleString()} tokens
                  </span>
                </div>

                <div className="w-full bg-[var(--bg-card)] rounded-full h-2 overflow-hidden border border-[var(--border-subtle)] mb-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (selectedBotForBrief.tokenUsage / selectedBotForBrief.tokenCap) * 100)}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                  <div>Input: {selectedBotForBrief.inputTokens?.toLocaleString() || 0} tokens</div>
                  <div>Output: {selectedBotForBrief.outputTokens?.toLocaleString() || 0} tokens</div>
                </div>
              </div>

              {/* Recent Event Log */}
              {(() => {
                const botEvents = events.filter((e) => e.botId === selectedBotForBrief.id);
                const lastEvent = botEvents[botEvents.length - 1];
                if (!lastEvent) return null;

                return (
                  <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
                    <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] mb-1">
                      Latest Activity
                    </div>
                    <p className="text-[var(--text-main)] italic">
                      "{lastEvent.summary}"
                    </p>
                    <span className="text-[10px] font-mono text-[var(--text-faint)] mt-1 block">
                      {new Date(lastEvent.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-[var(--border-subtle)] mt-4 flex items-center justify-between">
              <button
                onClick={() => toggleBotPause(selectedBotForBrief.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  pausedBotIds.has(selectedBotForBrief.id)
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                    : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {pausedBotIds.has(selectedBotForBrief.id) ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Bot</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Bot</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedBotForBrief(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
