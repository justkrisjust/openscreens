import React from 'react';
import {
  Play,
  Pause,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { BotWorkArea } from './BotWorkArea';
import { MemoryBox } from '../memory/MemoryBox';
import { EventFeed } from './EventFeed';
import { DirectorChat } from '../chat/DirectorChat';

export const OfficeCanvas: React.FC = () => {
  const {
    activeProject,
    startProjectExecution,
    pauseProjectExecution,
    stopProjectExecution,
    events,
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
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          View Projects
        </button>
      </div>
    );
  }

  // Find bots belonging to this project
  const projectBots = bots.filter((b) => activeProject.botIds.includes(b.id));

  // Determine last message per bot from recent events
  const getLastMessageForBot = (botId: string) => {
    const botEvents = events.filter((e) => e.botId === botId);
    return botEvents[botEvents.length - 1]?.summary;
  };

  const isRunning = activeProject.status === 'running';
  const isCompleted = activeProject.status === 'completed';
  const isPaused = activeProject.status === 'paused';

  const botA = projectBots[0];
  const botB = projectBots[1];
  const additionalBots = projectBots.slice(2);

  return (
    <div className="max-w-[1600px] mx-auto p-4 flex flex-col gap-4 min-h-[calc(100vh-65px)]">
      {/* Top Project Dashboard Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 m-0 tracking-tight">
              {activeProject.name}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                  : isCompleted
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : isPaused
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {activeProject.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
            <strong>Goal:</strong> {activeProject.goal}
          </p>
        </div>

        {/* Turn Meter & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Turn counter meter */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-500">Turns:</span>
            <span className="font-bold text-slate-200">
              {activeProject.currentTurn} / {activeProject.maxTurns}
            </span>
          </div>

          {/* Start / Pause / Stop buttons */}
          <div className="flex items-center gap-1.5">
            {isRunning ? (
              <button
                onClick={pauseProjectExecution}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={startProjectExecution}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{activeProject.currentTurn > 0 ? 'Resume' : 'Start'}</span>
              </button>
            )}

            <button
              onClick={stopProjectExecution}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
              title="Global Stop (reset turns and release locks)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Office Layout: Bot A (Left) - Memory Box (Center) - Bot B (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Area: Bot A */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {botA ? (
            <BotWorkArea
              bot={botA}
              side="left"
              lastMessage={getLastMessageForBot(botA.id)}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No Lead Bot Assigned
            </div>
          )}

          {/* If 3rd bot exists, show in secondary card */}
          {additionalBots[0] && (
            <BotWorkArea
              bot={additionalBots[0]}
              side="grid"
              lastMessage={getLastMessageForBot(additionalBots[0].id)}
            />
          )}
        </div>

        {/* Center: Shared Memory Box (Virtual File Tree + Editor) */}
        <div className="lg:col-span-6 min-h-[460px] flex flex-col">
          <MemoryBox />
        </div>

        {/* Right Area: Bot B */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {botB ? (
            <BotWorkArea
              bot={botB}
              side="right"
              lastMessage={getLastMessageForBot(botB.id)}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No Teammate Bot Assigned
            </div>
          )}

          {/* If 4th bot exists, show in secondary card */}
          {additionalBots[1] && (
            <BotWorkArea
              bot={additionalBots[1]}
              side="grid"
              lastMessage={getLastMessageForBot(additionalBots[1].id)}
            />
          )}
        </div>
      </div>

      {/* Bottom Area: Compact Event Feed (Left) & User Director Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-1">
        <div className="lg:col-span-7">
          <EventFeed />
        </div>
        <div className="lg:col-span-5">
          <DirectorChat />
        </div>
      </div>
    </div>
  );
};
