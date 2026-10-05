import React from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Gauge,
  Sparkles,
  Bot as BotIcon,
  Globe,
  Coins,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAdapter } from '../../adapters/registry';
import { BotFace } from '../office/BotFace';
import { calculateBotCost } from '../../services/tokenPricing';

export const BotListView: React.FC = () => {
  const { bots, removeBot, resetTokens } = useBotStore();
  const { openCreateBotModal, openEditBotModal, setActiveView, showToast } = useUIStore();

  const providerIcons: Record<string, React.ReactNode> = {
    anthropic: <span className="text-amber-500 font-mono text-[10px]">Claude</span>,
    gemini: <span className="text-blue-500 font-mono text-[10px]">Gemini</span>,
    openai: <span className="text-emerald-500 font-mono text-[10px]">OpenAI</span>,
    xai: <span className="text-zinc-400 font-mono text-[10px]">xAI</span>,
    mistral: <span className="text-orange-500 font-mono text-[10px]">Mistral</span>,
    mock: <span className="text-violet-500 font-mono text-[10px]">Demo</span>,
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            AI Bot Roster
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {bots.length} Active Bots
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Configure each bot's shape, avatar face, model provider, and token allowances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('tokens')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl border border-[var(--border-subtle)] transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
            <span>Token Dashboard</span>
          </button>
          <button
            onClick={openCreateBotModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Bot</span>
          </button>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-panel)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
            <BotIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1">
            No bots in your office yet
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-4">
            Create your first bot with a custom head shape, model provider, and character to get started.
          </p>
          <button
            onClick={openCreateBotModal}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
          >
            Create First Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => {
            const adapter = getAdapter(bot.provider);
            const costInfo = calculateBotCost(bot);

            return (
              <div
                key={bot.id}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Animated Interactive Bot Face in selected Shape */}
                      <div className="shrink-0">
                        <BotFace
                          shape={bot.avatarShape || 'squircle'}
                          color={bot.avatarColor}
                          status={bot.status}
                          size={46}
                          showEmoteBadge={false}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--text-main)] text-sm">
                            {bot.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)] capitalize">
                            {bot.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          {providerIcons[bot.provider]}
                          <span className="truncate max-w-[130px] font-mono text-[11px]">
                            {bot.model}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bot Actions: Edit & Delete */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => openEditBotModal(bot.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
                        title="Edit bot avatar, shape, and settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          removeBot(bot.id);
                          showToast(`Removed bot ${bot.name}`, 'info');
                        }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
                        title="Delete bot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed italic bg-[var(--bg-panel)] p-2.5 rounded-xl border border-[var(--border-subtle)] mb-4">
                    "{bot.personality}"
                  </p>
                </div>

                {/* Token Meter, Cost & Status */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-[var(--text-faint)]" />
                      Usage:
                    </span>
                    <span
                      className={`font-semibold ${
                        costInfo.usagePercent > 80 ? 'text-rose-500' : 'text-[var(--text-main)]'
                      }`}
                    >
                      {costInfo.totalTokens.toLocaleString()} / {bot.tokenCap.toLocaleString()} ({costInfo.usagePercent}%)
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        costInfo.usagePercent > 80
                          ? 'bg-rose-500'
                          : costInfo.usagePercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${costInfo.usagePercent}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text-muted)]">
                      Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{costInfo.formattedCost}</strong>
                    </span>
                    <span className="text-[var(--text-muted)]">
                      Left: <strong className="text-[var(--text-main)] font-mono">{costInfo.tokensLeft.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
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
