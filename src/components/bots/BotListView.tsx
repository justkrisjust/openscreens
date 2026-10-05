import React from 'react';
import {
  Bot as BotIcon,
  Plus,
  Trash2,
  Cpu,
  Sparkles,
  Zap,
  Activity,
  Flame,
  Shield,
  Gauge,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAdapter } from '../../adapters/registry';

export const BotListView: React.FC = () => {
  const { bots, removeBot, resetTokens } = useBotStore();
  const { setNewBotModalOpen, showToast } = useUIStore();

  const providerIcons: Record<string, React.ReactNode> = {
    gemini: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
    anthropic: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
    openai: <BotIcon className="w-3.5 h-3.5 text-emerald-400" />,
    xai: <Zap className="w-3.5 h-3.5 text-amber-400" />,
    mistral: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    mock: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            Bot Roster ({bots.length}/12)
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Build your team with different AI providers, personalities, and roles.
          </p>
        </div>

        <button
          onClick={() => setNewBotModalOpen(true)}
          disabled={bots.length >= 12}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Bot
        </button>
      </div>

      {bots.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm">
          <BotIcon className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-main)]">No Bots Configured</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 mb-4">
            Add your first AI bot or try demo mode to start collaborating.
          </p>
          <button
            onClick={() => setNewBotModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
          >
            Create First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => {
            const adapter = getAdapter(bot.provider);
            const tokenPercent = Math.min(100, Math.round((bot.tokenUsage / bot.tokenCap) * 100));

            return (
              <div
                key={bot.id}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: bot.avatarColor }}
                      >
                        {bot.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--text-main)] text-sm">
                            {bot.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)]">
                            {bot.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          {providerIcons[bot.provider]}
                          <span className="truncate max-w-[140px] font-mono text-[11px]">
                            {bot.model}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        removeBot(bot.id);
                        showToast(`Removed bot ${bot.name}`, 'info');
                      }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
                      title="Delete bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed italic bg-[var(--bg-panel)] p-2.5 rounded-xl border border-[var(--border-subtle)] mb-4">
                    "{bot.personality}"
                  </p>
                </div>

                {/* Token Meter & Status */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-[var(--text-faint)]" />
                      Usage:
                    </span>
                    <span
                      className={`font-semibold ${
                        tokenPercent > 80 ? 'text-rose-500' : 'text-[var(--text-main)]'
                      }`}
                    >
                      {bot.tokenUsage.toLocaleString()} / {bot.tokenCap.toLocaleString()} tokens ({tokenPercent}%)
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        tokenPercent > 80
                          ? 'bg-rose-500'
                          : tokenPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${tokenPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Status: <strong className="text-[var(--text-main)] capitalize">{bot.status}</strong>
                    </span>
                    {bot.tokenUsage > 0 && (
                      <button
                        onClick={() => resetTokens(bot.id)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Reset Meter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
