import React, { useEffect, useRef } from 'react';
import {
  Activity,
  FileEdit,
  MessageSquare,
  Lock,
  Sparkles,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

export const EventFeed: React.FC = () => {
  const { events } = useProjectStore();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'file_edit':
        return <FileEdit className="w-3.5 h-3.5 text-emerald-400" />;
      case 'lock_busy':
        return <Lock className="w-3.5 h-3.5 text-amber-400" />;
      case 'chat_message':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'system':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col h-full shadow-sm overflow-hidden transition-colors duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wide font-mono">
            Compact Event Feed
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          Token-efficient stream
        </span>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {events.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-muted)]">
            No events logged yet. Press Start to initiate bot coordination.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 text-xs p-1.5 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getEventIcon(ev.type)}</div>
              <div className="flex-1 leading-snug">
                <span className="font-semibold text-[var(--text-main)] mr-1.5">
                  {ev.botName}:
                </span>
                <span className="text-[var(--text-muted)]">{ev.summary}</span>
                {ev.tokensUsed ? (
                  <span className="ml-1.5 text-[9px] font-mono text-[var(--text-faint)]">
                    (+{ev.tokensUsed} tokens)
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] font-mono text-[var(--text-faint)] shrink-0">
                {new Date(ev.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
