import React, { useEffect, useRef } from 'react';
import {
  Activity,
  FileEdit,
  MessageSquare,
  Lock,
  Sparkles,
  Key,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useBotStore } from '../../stores/useBotStore';

export const EventFeed: React.FC = () => {
  const { events, isExecutingTurn } = useProjectStore();
  const { bots } = useBotStore();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events, isExecutingTurn]);

  const getBot = (botId: string) => bots.find((b) => b.id === botId);

  const getEventBadge = (type: string, filePath?: string) => {
    switch (type) {
      case 'file_request':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Key className="w-2.5 h-2.5" />
            File Request
          </span>
        );
      case 'file_handover':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Zap className="w-2.5 h-2.5" />
            Lock Transferred
          </span>
        );
      case 'file_edit':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">
            <FileEdit className="w-2.5 h-2.5" />
            {filePath ? filePath.split('/').pop() : 'Edit'}
          </span>
        );
      case 'lock_busy':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
            <Lock className="w-2.5 h-2.5" />
            Busy
          </span>
        );
      case 'system':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
            <Sparkles className="w-2.5 h-2.5" />
            System
          </span>
        );
      default:
        return null;
    }
  };

  const renderFormattedSummary = (summary: string) => {
    // Highlight @Mentions in light blue
    const parts = summary.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="font-bold text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded text-[11px] font-mono border border-sky-500/20"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col h-full shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wide font-mono">
            Agent Dialogue & Feed
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span>English Stream</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-6 h-6 text-[var(--text-faint)]" />
            <span>No agent dialogue yet. Start project to begin conversation.</span>
          </div>
        ) : (
          events.map((ev) => {
            const bot = getBot(ev.botId);
            const isDirectMsg = ev.type === 'chat_message' || ev.type === 'file_request' || ev.type === 'file_handover';

            return (
              <div
                key={ev.id}
                className={`p-2 rounded-xl border transition-all text-xs ${
                  ev.type === 'file_request'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : ev.type === 'file_handover'
                    ? 'bg-sky-500/5 border-sky-500/30'
                    : ev.type === 'file_edit'
                    ? 'bg-[var(--bg-panel)]/80 border-[var(--border-subtle)]'
                    : 'bg-[var(--bg-panel)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: bot?.avatarColor || '#0284c7' }}
                    >
                      {ev.botName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-[var(--text-main)] truncate text-[11px]">
                      {ev.botName}
                    </span>
                    {bot?.role && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase">
                        {bot.role}
                      </span>
                    )}
                    {getEventBadge(ev.type, ev.filePath)}
                  </div>
                  <span className="text-[9px] font-mono text-[var(--text-faint)] shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-[var(--text-muted)] leading-relaxed pl-5 text-[11.5px]">
                  {renderFormattedSummary(ev.summary)}
                </div>

                {ev.tokensUsed ? (
                  <div className="flex justify-end mt-1 text-[9px] font-mono text-[var(--text-faint)]">
                    +{ev.tokensUsed} tokens
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        {/* Live typing / dialogue indicator */}
        {isExecutingTurn && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-400 font-mono animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Agent streaming turn & collaborating...</span>
          </div>
        )}
      </div>
    </div>
  );
};
