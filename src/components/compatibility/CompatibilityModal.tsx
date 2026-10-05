import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCw,
  Sparkles,
  Users,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import {
  runFullCompatibilityCheck,
  type FullCompatibilityReport,
} from '../../services/compatibility';

export const CompatibilityModal: React.FC = () => {
  const { bots } = useBotStore();
  const { getKey, getProxyUrl } = useAuthStore();
  const { activeProject, startProjectExecution } = useProjectStore();
  const { setActiveView, showToast } = useUIStore();

  const [report, setReport] = useState<FullCompatibilityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const projectBots = bots.filter((b) => activeProject?.botIds.includes(b.id));

  const handleRunCheck = async () => {
    if (projectBots.length === 0) {
      showToast('No bots assigned to active project.', 'warn');
      return;
    }

    setIsRunning(true);
    try {
      const result = await runFullCompatibilityCheck(
        projectBots,
        (prov) => getKey(prov),
        (prov) => getProxyUrl(prov)
      );
      setReport(result);

      if (result.canStart) {
        showToast('Compatibility check completed successfully!', 'success');
      } else {
        showToast('Hard compatibility failures detected. Please review suggestions.', 'error');
      }
    } catch (e: unknown) {
      showToast(String(e), 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartWithOverride = () => {
    startProjectExecution();
    setActiveView('office');
    showToast('Project launched with soft warning overrides.', 'info');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />;
      default:
        return <div className="w-4 h-4 rounded-full border border-slate-700" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            Team Compatibility Suite
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Validates role adherence, memory syntax, lock respect, and 2-bot handshakes before launch.
          </p>
        </div>

        <button
          onClick={handleRunCheck}
          disabled={isRunning || projectBots.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Suite (Testing Models)...</span>
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" />
              <span>Run Compatibility Check</span>
            </>
          )}
        </button>
      </div>

      {!report && !isRunning && (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
          <Users className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-main)]">
            Ready to Test {projectBots.length} Bots
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mt-1 mb-5">
            Runs a lightweight evaluation (~500 tokens per bot) verifying format following,
            file locking rules, and inter-bot coordination.
          </p>
          <button
            onClick={handleRunCheck}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-colors"
          >
            Start Pre-Flight Test
          </button>
        </div>
      )}

      {/* Results View */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
              report.canStart
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  {report.canStart ? 'Team Ready for Coordination' : 'Hard Failure Blocked'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-subtle)]">
                  Derived Score: {report.overallScorePercent}%
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {report.canStart
                  ? report.hasWarnings
                    ? 'All hard tests passed with minor soft warnings. You can proceed directly or review suggestions below.'
                    : '100% clean pass! All bot message formats, lock rules, and handshakes verified.'
                  : 'Critical failures detected. Review the red items below (e.g. invalid key or unsupported browser CORS).'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {report.canStart ? (
                <button
                  onClick={handleStartWithOverride}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Office</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveView('keys')}
                  className="px-4 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-panel)] text-[var(--text-main)] text-xs font-medium rounded-xl border border-[var(--border-subtle)] transition-colors"
                >
                  Inspect API Keys
                </button>
              )}
            </div>
          </div>

          {/* Individual Bot Reports */}
          <div className="space-y-4">
            {report.botReports.map((b) => (
              <div
                key={b.botId}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[var(--text-main)] text-sm">
                      {b.botName}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      ({b.provider} • {b.model})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-faint)]">
                    {b.totalTokensUsed} tokens tested
                  </span>
                </div>

                <div className="space-y-3">
                  {b.steps.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(s.status)}</div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {s.description}
                          </div>
                          {s.suggestion && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                              Suggestion: {s.suggestion}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                            s.status === 'pass'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : s.status === 'warn'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Handshake Result */}
            {report.handshakeReport && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-[var(--text-main)] text-sm">
                      2-Bot Handshake ({report.handshakeReport.botA} ➔ {report.handshakeReport.botB})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-faint)]">
                    {report.handshakeReport.tokensUsed} tokens
                  </span>
                </div>
                <div className="p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-main)]">
                    {report.handshakeReport.suggestion}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    {report.handshakeReport.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
