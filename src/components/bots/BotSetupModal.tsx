import React, { useState, useEffect } from 'react';
import {
  X,
  Bot as BotIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAdapter, getAllAdapters } from '../../adapters/registry';
import type { BotRole, ProviderId } from '../../services/storage';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const ROLES: { id: BotRole; label: string; desc: string }[] = [
  { id: 'leader', label: 'Leader / Architect', desc: 'Coordinates team turns, defines milestones, and reviews work.' },
  { id: 'developer', label: 'Developer', desc: 'Implements code files (HTML, JS, logic) and resolves bugs.' },
  { id: 'designer', label: 'Designer', desc: 'Crafts styles, layouts, CSS tokens, and polish.' },
  { id: 'tester', label: 'Tester', desc: 'Verifies files, inspects preview DOM, and tests edge cases.' },
  { id: 'reviewer', label: 'Reviewer', desc: 'Performs security, token-efficiency, and formatting checks.' },
];

export const BotSetupModal: React.FC = () => {
  const { isNewBotModalOpen, setNewBotModalOpen, showToast } = useUIStore();
  const { bots, createBot } = useBotStore();
  const { getKey, getProxyUrl } = useAuthStore();

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ProviderId>('gemini');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [role, setRole] = useState<BotRole>('developer');
  const [personality, setPersonality] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [tokenCap, setTokenCap] = useState(15000);

  const adapters = getAllAdapters();

  // Load models whenever provider changes
  useEffect(() => {
    let isCurrent = true;
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const adapter = getAdapter(provider);
        const apiKey = getKey(provider) || (provider === 'mock' ? 'mock-key' : '');
        const proxyUrl = getProxyUrl(provider);

        const fetched = await adapter.fetchModels(apiKey, proxyUrl);
        if (isCurrent && fetched.length > 0) {
          setAvailableModels(fetched);
          setModel(fetched[0]);
        }
      } catch (e) {
        console.warn('Could not fetch models dynamically:', e);
      } finally {
        if (isCurrent) setIsLoadingModels(false);
      }
    };

    if (isNewBotModalOpen) {
      loadModels();
    }

    return () => {
      isCurrent = false;
    };
  }, [provider, isNewBotModalOpen, getKey, getProxyUrl]);

  if (!isNewBotModalOpen) return null;

  // Soft rule check: check if project or team has multiple providers
  const currentProviders = new Set(bots.map((b) => b.provider));
  const isMonoProvider = currentProviders.size === 1 && currentProviders.has(provider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please name your bot.', 'warn');
      return;
    }
    if (!model) {
      showToast('Please select a model.', 'warn');
      return;
    }

    try {
      await createBot({
        name: name.trim(),
        provider,
        model,
        role,
        personality: personality.trim() || 'Pragmatic and collaborative team member.',
        avatarColor,
        avatarIcon: 'Bot',
        tokenCap,
      });

      showToast(`Bot ${name} created and added to your roster!`, 'success');
      setNewBotModalOpen(false);
      setName('');
      setPersonality('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setNewBotModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: avatarColor }}
          >
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Create New Bot
            </h3>
            <p className="text-xs text-slate-400">
              Assign a role, model, and character to join your office.
            </p>
          </div>
        </div>

        {/* Soft Rule Notice: Suggest mixing providers */}
        {isMonoProvider && (
          <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Tip for great results:</strong> Mixing different model providers (e.g. Gemini + Claude + OpenAI) produces richer multi-agent synergy!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bot Name & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Bot Name
              </label>
              <input
                type="text"
                placeholder="e.g. Larry, Ada, Pixel..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Avatar Tint
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      avatarColor === c ? 'scale-110 border-white' : 'border-transparent opacity-70'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {adapters.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setProvider(a.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    provider === a.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{a.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {a.capabilities.browserCorsSupported ? 'Browser Direct' : 'Needs Proxy'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Model Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Model (Fetched Dynamically)
              </label>
              {isLoadingModels && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching models...
                </span>
              )}
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Team Role
            </label>
            <div className="space-y-1.5">
              {ROLES.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                    role === r.id
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => setRole(r.id)}
                    className="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-medium text-slate-200">{r.label}</div>
                    <div className="text-[11px] text-slate-400">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Personality & Behavior (1-2 lines)
            </label>
            <textarea
              placeholder="e.g. Meticulous code reviewer with a dry sense of humor. Focuses on edge cases and clean formatting."
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Token Cap */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Per-Bot Token Cap
              </label>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {tokenCap.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={50000}
              step={1000}
              value={tokenCap}
              onChange={(e) => setTokenCap(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setNewBotModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Bot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
