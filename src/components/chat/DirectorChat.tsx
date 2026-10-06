import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, ThumbsUp, Sparkles, Bot } from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

export const DirectorChat: React.FC = () => {
  const { bots } = useBotStore();
  const { activeProject, events, logEvent, startProjectExecution } = useProjectStore();
  const { showToast } = useUIStore();

  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState<'all' | string>('all');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const projectBots = bots.filter((b) => activeProject?.botIds.includes(b.id));

  // Extract all chat events
  const chatEvents = events.filter((e) => e.type === 'chat_message');

  // Filter messages by selected target if desired, or show all
  const filteredMessages = chatEvents.filter((ev) => {
    if (targetId === 'all') return true;
    const targetBot = projectBots.find((b) => b.id === targetId);
    if (!targetBot) return true;
    // Show if message is from the bot OR if user feedback was directed to this bot
    return ev.botId === targetId || ev.summary.includes(`[${targetBot.name}]`) || ev.summary.includes('[All Bots]');
  });

  // Auto-scroll inside chat box only (never scroll the window)
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeProject) return;

    const targetBot = targetId === 'all' ? null : bots.find((b) => b.id === targetId);
    const targetLabel = targetBot ? targetBot.name : 'All Bots';

    await logEvent(
      'user-director',
      'You (Director)',
      'chat_message',
      `Feedback to [${targetLabel}]: ${message.trim()}`
    );

    // If project was idle or waiting for approval, resume
    if (activeProject.status === 'idle') {
      startProjectExecution();
    }

    showToast(`Directive sent to ${targetLabel}`, 'info');
    setMessage('');
  };

  const handleQuickDirective = async (presetText: string) => {
    if (!activeProject) return;
    setMessage(presetText);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-3 flex flex-col h-full shadow-sm transition-colors duration-200">
      {/* Header & Target selector */}
      <div className="pb-2 border-b border-[var(--border-subtle)] mb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-[var(--text-main)] font-heading truncate">
              Director Chat
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-mono shrink-0">
              {filteredMessages.length} msgs
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
            Final Approver
          </span>
        </div>

        {/* Target Selector */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border-subtle)]/60">
          <span className="text-[10px] text-[var(--text-muted)] font-mono font-medium shrink-0">Target:</span>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="flex-1 min-w-0 bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[11px] rounded-lg px-2 py-1 text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-medium cursor-pointer truncate"
          >
            <option value="all">Broadcast to All Bots</option>
            {projectBots.map((b) => (
              <option key={b.id} value={b.id}>
                Direct to {b.name} ({b.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message History Thread */}
      <div
        ref={chatScrollRef}
        className="flex-1 min-h-[160px] overflow-y-auto space-y-2 pr-1 mb-2 scroll-smooth"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-6 text-center text-xs text-[var(--text-muted)]">
            <MessageSquare className="w-8 h-8 text-[var(--text-faint)] mb-2 opacity-50" />
            <p className="font-medium text-[var(--text-main)]">No directives sent yet</p>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5 max-w-xs">
              Chat with your bots to guide their code, review designs, or give real-time feedback.
            </p>
          </div>
        ) : (
          filteredMessages.map((ev) => {
            const isUser = ev.botId === 'user-director';
            const botData = !isUser ? projectBots.find((b) => b.id === ev.botId) : null;

            return (
              <div
                key={ev.id}
                className={`flex gap-2 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500 text-[10px] font-bold">
                    {botData?.name?.slice(0, 1) || 'B'}
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-[10px] font-bold ${
                        isUser ? 'text-emerald-100' : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    >
                      {ev.botName}
                    </span>
                    <span
                      className={`text-[9px] font-mono ${
                        isUser ? 'text-emerald-200' : 'text-[var(--text-faint)]'
                      }`}
                    >
                      {new Date(ev.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{ev.summary}</p>
                </div>
                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                    You
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Approval Pills */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => handleQuickDirective('Approved! Looks fantastic, proceed with the next task.')}
          className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 font-medium"
        >
          <ThumbsUp className="w-2.5 h-2.5" /> Approve
        </button>
        <button
          type="button"
          onClick={() => handleQuickDirective('Please refine the visual styling and add animations.')}
          className="text-[10px] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
        >
          Polish Design
        </button>
        <button
          type="button"
          onClick={() => handleQuickDirective('Inspect the preview and test for broken buttons.')}
          className="text-[10px] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
        >
          Request Test
        </button>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="text"
          placeholder={
            targetId === 'all'
              ? 'Instruct all bots or give feedback...'
              : `Send feedback directly to ${projectBots.find((b) => b.id === targetId)?.name || 'bot'}...`
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
