import React from 'react';
import {
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Hammer,
  Coffee,
  Gauge,
  Bot as BotIcon,
} from 'lucide-react';
import type { Bot, BotGesture } from '../../services/storage';
import { useProjectStore } from '../../stores/useProjectStore';
import { BotFace } from './BotFace';

interface BotWorkAreaProps {
  bot: Bot;
  side: 'left' | 'right' | 'grid';
  lastMessage?: string;
}

export const BotWorkArea: React.FC<BotWorkAreaProps> = ({ bot, side, lastMessage }) => {
  const { pausedBotIds, toggleBotPause, isExecutingTurn } = useProjectStore();
  const isPaused = pausedBotIds.has(bot.id);
  const isCurrentlyWorking = bot.status === 'working';

  // Gesture & Status mapping
  const gestureMeta: Record<
    BotGesture,
    { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
  > = {
    working: {
      label: 'Working',
      icon: <Hammer className="w-3.5 h-3.5 animate-bounce text-blue-400" />,
      colorClass: 'text-blue-400 border-blue-500/30',
      bgClass: 'bg-blue-500/10',
    },
    thinking: {
      label: 'Thinking',
      icon: <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />,
      colorClass: 'text-purple-400 border-purple-500/30',
      bgClass: 'bg-purple-500/10',
    },
    done: {
      label: 'Done',
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
      colorClass: 'text-emerald-400 border-emerald-500/30',
      bgClass: 'bg-emerald-500/10',
    },
    blocked: {
      label: 'Blocked',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
      colorClass: 'text-rose-400 border-rose-500/30',
      bgClass: 'bg-rose-500/10',
    },
    needs_help: {
      label: 'Needs Help',
      icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
      colorClass: 'text-amber-400 border-amber-500/30',
      bgClass: 'bg-amber-500/10',
    },
    waiting: {
      label: 'Waiting',
      icon: <Coffee className="w-3.5 h-3.5 text-slate-400" />,
      colorClass: 'text-slate-400 border-slate-700',
      bgClass: 'bg-slate-800/40',
    },
  };

  const currentGesture = gestureMeta[bot.status] || gestureMeta.waiting;
  const tokenPercent = Math.min(100, Math.round((bot.tokenUsage / bot.tokenCap) * 100));

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
        isCurrentlyWorking
          ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 animate-working-glow'
          : 'border-slate-800'
      }`}
    >
      <div>
        {/* Top Header: Avatar, Name, Role, Pause Control */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative pt-3">
              <BotFace
                status={bot.status}
                color={bot.avatarColor}
                size={48}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">
                  {bot.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2025] text-slate-300 border border-[#2e313a]">
                  {bot.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">
                {bot.model}
              </div>
            </div>
          </div>

          {/* Pause / Break Toggle Button */}
          <button
            onClick={() => toggleBotPause(bot.id)}
            className={`p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title={isPaused ? 'Resume bot' : 'Give bot a break'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-amber-300" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Status Pill & Character Gesture Indicator */}
        <div className="mb-3 flex items-center justify-between">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${currentGesture.bgClass} ${currentGesture.colorClass}`}
          >
            {currentGesture.icon}
            <span>{currentGesture.label}</span>
          </div>

          {isPaused && (
            <span className="text-[11px] text-amber-400 font-mono">
              (On Break)
            </span>
          )}
        </div>

        {/* Speech / Output Bubble */}
        <div className="relative mb-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed min-h-[64px] flex flex-col justify-center">
            {lastMessage ? (
              <p className="line-clamp-3 italic">
                "{lastMessage}"
              </p>
            ) : (
              <p className="text-slate-500 italic">
                Awaiting next task delegation...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Token Usage Meter */}
      <div className="pt-3 border-t border-slate-800/70">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-slate-500" />
            Tokens:
          </span>
          <span
            className={
              tokenPercent > 80
                ? 'text-rose-400 font-bold'
                : 'text-slate-300 font-semibold'
            }
          >
            {bot.tokenUsage.toLocaleString()} / {bot.tokenCap.toLocaleString()} ({tokenPercent}%)
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              tokenPercent > 80
                ? 'bg-rose-500'
                : tokenPercent > 50
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${tokenPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
