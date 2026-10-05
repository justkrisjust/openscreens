import React, { useState } from 'react';
import {
  Coins,
  DollarSign,
  Gauge,
  RotateCcw,
  Download,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Edit2,
  Plus,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useUIStore } from '../../stores/useUIStore';
import { BotFace } from '../office/BotFace';
import {
  calculateBotCost,
  calculateFleetMetrics,
  PRICING_CATALOG,
} from '../../services/tokenPricing';

export const TokensView: React.FC = () => {
  const { bots, resetTokens, resetAllTokens, setTokenCap } = useBotStore();
  const { openEditBotModal, openCreateBotModal, showToast } = useUIStore();

  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingCapBotId, setEditingCapBotId] = useState<string | null>(null);
  const [newCapValue, setNewCapValue] = useState<number>(15000);

  const fleetMetrics = calculateFleetMetrics(bots);

  // Filter bots if role filter applied
  const filteredBots = bots.filter((b) => (filterRole === 'all' ? true : b.role === filterRole));

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: fleetMetrics,
      bots: bots.map((b) => {
        const cost = calculateBotCost(b);
        return {
          id: b.id,
          name: b.name,
          role: b.role,
          provider: b.provider,
          model: b.model,
          tokensSpent: cost.totalTokens,
          inputTokens: cost.inputTokens,
          outputTokens: cost.outputTokens,
          tokensLeft: cost.tokensLeft,
          tokenCap: b.tokenCap,
          usagePercent: cost.usagePercent,
          estimatedCostUsd: cost.formattedCost,
          pricing: cost.pricing,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openscreens-token-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Token usage report downloaded!', 'success');
  };

  const handleSaveCap = (botId: string) => {
    setTokenCap(botId, newCapValue);
    setEditingCapBotId(null);
    showToast(`Token budget updated to ${newCapValue.toLocaleString()}`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-500" />
            Token & Cost Intelligence
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Track real-time input/output token consumption, remaining budgets, and accurate USD costs across all AI providers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl border border-[var(--border-subtle)] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Reset token usage meters for ALL bots to 0?')) {
                resetAllTokens();
                showToast('All bot token counters reset.', 'info');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--bg-panel)] hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-muted)] rounded-xl border border-[var(--border-subtle)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Meters</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span>Total Tokens Spent</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
            {fleetMetrics.totalTokens.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mt-1">
            <span>In: {fleetMetrics.totalInputTokens.toLocaleString()}</span>
            <span>•</span>
            <span>Out: {fleetMetrics.totalOutputTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span>Total Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {fleetMetrics.formattedTotalCost}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Calculated at official provider rates
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span>Total Tokens Left</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
            {fleetMetrics.remainingTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
            Across {fleetMetrics.totalCap.toLocaleString()} total cap allowance
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span>Average Cost / 1k</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
            {fleetMetrics.averageCostPer1k}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Blended prompt & completion rate
          </div>
        </div>
      </div>

      {/* Safety Notice: Zero Overdraft Protection */}
      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-semibold text-[var(--text-main)]">
            Hard Budget Protection Active
          </h4>
          <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
            OpenScreens monitors each bot's consumption turn by turn. When a bot exhausts its token allowance, it is automatically paused with a blocked status to protect you from unintended API overages.
          </p>
        </div>
      </div>

      {/* Per-Bot Token Breakdown Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            Individual Bot Consumption
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-lg px-2 py-1 text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="leader">Leader</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="tester">Tester</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>
        </div>

        {filteredBots.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">
            <p className="text-xs text-[var(--text-muted)]">No bots found matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => {
              const cost = calculateBotCost(bot);
              const isEditingCap = editingCapBotId === bot.id;

              return (
                <div
                  key={bot.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    {/* Bot Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <BotFace
                            shape={bot.avatarShape || 'squircle'}
                            color={bot.avatarColor}
                            status={bot.status}
                            size={44}
                            showEmoteBadge={false}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-[var(--text-main)]">
                              {bot.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-subtle)] capitalize">
                              {bot.role}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[var(--text-muted)] truncate block max-w-[140px]">
                            {cost.pricing.modelName}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => openEditBotModal(bot.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
                        title="Edit bot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] mb-4">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Tokens Spent</span>
                        <span className="text-xs font-bold font-mono text-[var(--text-main)]">
                          {cost.totalTokens.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Tokens Left</span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            cost.tokensLeft < 1000 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {cost.tokensLeft.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Estimated Cost</span>
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {cost.formattedCost}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Prompt / Comp</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {cost.inputTokens} / {cost.outputTokens}
                        </span>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                        <span>Allowance Consumed</span>
                        <span>{cost.usagePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            cost.usagePercent > 80
                              ? 'bg-rose-500'
                              : cost.usagePercent > 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${cost.usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer & Budget Adjustment */}
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    {isEditingCap ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1000}
                            step={1000}
                            value={newCapValue}
                            onChange={(e) => setNewCapValue(Number(e.target.value))}
                            className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-lg px-2 py-1 font-mono text-[var(--text-main)]"
                          />
                          <button
                            onClick={() => handleSaveCap(bot.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCapBotId(null)}
                            className="px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-panel)] rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => {
                            setEditingCapBotId(bot.id);
                            setNewCapValue(bot.tokenCap || 15000);
                          }}
                          className="text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors font-mono"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Cap: {(bot.tokenCap || 15000).toLocaleString()}</span>
                        </button>
                        <button
                          onClick={() => resetTokens(bot.id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[10px]"
                        >
                          Reset Meter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Provider Pricing Reference Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
            Model Pricing Reference Guide
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              (USD per 1,000,000 tokens)
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2 px-3">Provider</th>
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3">Prompt (Input) / 1M</th>
                <th className="py-2 px-3">Completion (Output) / 1M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-main)]">
              {Object.entries(PRICING_CATALOG)
                .slice(0, 10)
                .map(([key, item]) => (
                  <tr key={key} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                    <td className="py-2 px-3 capitalize font-sans text-xs font-medium">
                      {item.provider}
                    </td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                      {item.modelName}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">
                      ${item.inputPerMillion.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">
                      ${item.outputPerMillion.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
