import React, { useState } from 'react';
import { Send, Users, User, MessageSquare, ThumbsUp, RefreshCw } from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

export const DirectorChat: React.FC = () => {
  const { bots } = useBotStore();
  const { activeProject, logEvent, startProjectExecution } = useProjectStore();
  const { showToast } = useUIStore();

  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState<'all' | string>('all');

  const projectBots = bots.filter((b) => activeProject?.botIds.includes(b.id));

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">
            Director Chat (You are Final Approver)
          </span>
        </div>

        {/* Target Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-mono">Target:</span>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
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

      {/* Quick Approval Pills */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => handleQuickDirective('Approved! Looks fantastic, proceed with the next task.')}
          className="text-[10px] bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
        >
          <ThumbsUp className="w-2.5 h-2.5" /> Approve
        </button>
        <button
          type="button"
          onClick={() => handleQuickDirective('Please refine the visual styling and add animations.')}
          className="text-[10px] bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
        >
          Polish Design
        </button>
        <button
          type="button"
          onClick={() => handleQuickDirective('Inspect the preview and test for broken buttons.')}
          className="text-[10px] bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
        >
          Request Test
        </button>
      </div>

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
          className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-md shadow-indigo-600/20"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
