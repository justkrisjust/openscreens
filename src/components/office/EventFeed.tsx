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
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-44 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
            Compact Event Feed
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Token-efficient stream
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {events.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No events logged yet. Press Start to initiate bot coordination.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 text-xs p-1.5 rounded-lg hover:bg-slate-950/40 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getEventIcon(ev.type)}</div>
              <div className="flex-1 leading-snug">
                <span className="font-semibold text-slate-300 mr-1.5">
                  {ev.botName}:
                </span>
                <span className="text-slate-400">{ev.summary}</span>
                {ev.tokensUsed ? (
                  <span className="ml-1.5 text-[9px] font-mono text-slate-600">
                    (+{ev.tokensUsed} tokens)
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] font-mono text-slate-600 shrink-0">
                {new Date(ev.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};
