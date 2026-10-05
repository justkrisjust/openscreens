import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import { useBotStore } from '../../stores/useBotStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAdapter, getAllAdapters } from '../../adapters/registry';
import type { BotRole, ProviderId, BotShape } from '../../services/storage';
import { BotFace, BOT_SHAPES, type BotEmoteType } from '../office/BotFace';

const AVATAR_COLORS = [
  '#10b981', // Emerald / Light Green
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#3b82f6', // Blue
];

const ROLES: { id: BotRole; label: string; desc: string }[] = [
  { id: 'leader', label: 'Leader / Architect', desc: 'Coordinates team turns, defines milestones, and reviews work.' },
  { id: 'developer', label: 'Developer', desc: 'Implements code files (HTML, JS, logic) and resolves bugs.' },
  { id: 'designer', label: 'Designer', desc: 'Crafts styles, layouts, CSS tokens, and polish.' },
  { id: 'tester', label: 'Tester', desc: 'Verifies files, inspects preview DOM, and tests edge cases.' },
  { id: 'reviewer', label: 'Reviewer', desc: 'Performs security, token-efficiency, and formatting checks.' },
];

export const BotSetupModal: React.FC = () => {
  const { isNewBotModalOpen, editingBotId, closeBotModal, showToast } = useUIStore();
  const { bots, createBot, updateBot } = useBotStore();
  const { getKey, getProxyUrl } = useAuthStore();

  const isEditing = Boolean(editingBotId);
  const editingBot = isEditing ? bots.find((b) => b.id === editingBotId) : null;

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ProviderId>('gemini');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [role, setRole] = useState<BotRole>('developer');
  const [personality, setPersonality] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarShape, setAvatarShape] = useState<BotShape>('squircle');
  const [tokenCap, setTokenCap] = useState(15000);
  const [testEmote, setTestEmote] = useState<BotEmoteType>('normal');

  const adapters = getAllAdapters();

  // Populate fields if in editing mode, or reset if in creating mode
  useEffect(() => {
    if (editingBot) {
      setName(editingBot.name);
      setProvider(editingBot.provider);
      setModel(editingBot.model);
      setRole(editingBot.role);
      setPersonality(editingBot.personality);
      setAvatarColor(editingBot.avatarColor || AVATAR_COLORS[0]);
      setAvatarShape(editingBot.avatarShape || 'squircle');
      setTokenCap(editingBot.tokenCap || 15000);
    } else {
      setName('');
      setProvider('gemini');
      setModel('');
      setRole('developer');
      setPersonality('');
      setAvatarColor(AVATAR_COLORS[0]);
      setAvatarShape('squircle');
      setTokenCap(15000);
    }
    setTestEmote('normal');
  }, [editingBot, isNewBotModalOpen]);

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
          if (!isEditing || !model || !fetched.includes(model)) {
            setModel(fetched[0]);
          }
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
  }, [provider, isNewBotModalOpen, getKey, getProxyUrl, isEditing]);

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
      if (isEditing && editingBotId) {
        await updateBot(editingBotId, {
          name: name.trim(),
          provider,
          model,
          role,
          personality: personality.trim() || 'Pragmatic and collaborative team member.',
          avatarColor,
          avatarShape,
          tokenCap,
        });
        showToast(`Bot ${name} updated successfully!`, 'success');
      } else {
        await createBot({
          name: name.trim(),
          provider,
          model,
          role,
          personality: personality.trim() || 'Pragmatic and collaborative team member.',
          avatarColor,
          avatarIcon: 'Bot',
          avatarShape,
          tokenCap,
        });
        showToast(`Bot ${name} created and added to your office!`, 'success');
      }

      closeBotModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <button
          onClick={closeBotModal}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Interactive Bot Avatar Card in Modal Header */}
        <div className="flex items-center gap-4 mb-5 p-3.5 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)]">
          <div className="shrink-0 relative">
            <BotFace
              shape={avatarShape}
              color={avatarColor}
              status={
                testEmote === 'frustrated'
                  ? 'blocked'
                  : testEmote === 'sweat'
                  ? 'needs_help'
                  : testEmote === 'lightbulb'
                  ? 'working'
                  : 'waiting'
              }
              emote={testEmote}
              size={54}
              showEmoteBadge={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--text-main)] truncate">
                {name.trim() || (isEditing ? 'Edit Bot' : 'New Bot')}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                {role}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
              {isEditing ? 'Customize shape, colors, and token budget.' : 'Choose from 10 distinct head shapes with animated facial expressions.'}
            </p>
            {/* Interactive Emote Preview Buttons */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <span className="text-[10px] text-[var(--text-muted)] font-mono mr-1">Preview Emote:</span>
              {(['normal', 'lightbulb', 'frustrated', 'sweat', 'coffee', 'stars'] as BotEmoteType[]).map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setTestEmote(em)}
                  className={`px-1.5 py-0.5 text-[10px] rounded-md transition-all ${
                    testEmote === em
                      ? 'bg-emerald-500 text-white font-bold shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {em === 'normal' ? '•ᴗ•' : em === 'lightbulb' ? '💡' : em === 'frustrated' ? '💢' : em === 'sweat' ? '💦' : em === 'coffee' ? '☕' : '★'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Soft Rule Notice */}
        {!isEditing && isMonoProvider && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Tip for great results:</strong> Mixing different model providers (e.g. Gemini + Claude + OpenAI) produces richer multi-agent synergy!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bot Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
              Bot Name
            </label>
            <input
              type="text"
              placeholder="e.g. Larry, Ada, Pixel, Atlas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2.5 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          {/* 10 Avatar Shapes Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5 flex items-center justify-between">
              <span>Avatar Shape & Head Chassis (10 Styles)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono capitalize">
                Selected: {avatarShape}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BOT_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setAvatarShape(s.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    avatarShape === s.id
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-sm scale-105'
                      : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-emerald-500/50'
                  }`}
                  title={s.label}
                >
                  <BotFace
                    shape={s.id}
                    color={avatarColor}
                    status="waiting"
                    emote="normal"
                    size={28}
                    showEmoteBadge={false}
                  />
                  <span className="text-[10px] font-medium text-[var(--text-main)] truncate w-full text-center">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Tint Colors */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
              Avatar Color Tint
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    avatarColor === c ? 'scale-110 border-white shadow-md ring-2 ring-emerald-500' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
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
                      ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-main)] font-semibold'
                      : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{a.displayName}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {a.capabilities.browserCorsSupported ? 'Browser Direct' : 'Needs Proxy'}
                  </div>
                </button>
              ))}
            </div>

            {!getKey(provider) && provider !== 'mock' && (
              <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-500 flex items-center justify-between">
                <span>⚠️ No API key set for {getAdapter(provider).name} yet.</span>
                <button
                  type="button"
                  onClick={() => {
                    closeBotModal();
                    useUIStore.getState().setActiveView('keys');
                  }}
                  className="text-amber-600 dark:text-amber-300 underline font-medium hover:text-amber-500"
                >
                  Connect Key in Vault
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Model Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-main)]">
                Model (Fetched Dynamically)
              </label>
              {isLoadingModels && (
                <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching models...
                </span>
              )}
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono"
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
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
              Team Role
            </label>
            <div className="space-y-1.5">
              {ROLES.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                    role === r.id
                      ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-main)] font-semibold'
                      : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => setRole(r.id)}
                    className="mt-0.5 text-emerald-600 focus:ring-0 bg-[var(--bg-card)] border-[var(--border-subtle)]"
                  />
                  <div>
                    <div className="text-xs font-medium text-[var(--text-main)]">{r.label}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
              Personality & Behavior (1-2 lines)
            </label>
            <textarea
              placeholder="e.g. Meticulous code reviewer with a dry sense of humor. Focuses on edge cases and clean formatting."
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={2}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Token Cap */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-main)]">
                Per-Bot Token Allowance / Cap
              </label>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {tokenCap.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={60000}
              step={1000}
              value={tokenCap}
              onChange={(e) => setTokenCap(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              {[5000, 15000, 30000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTokenCap(preset)}
                  className={`px-2 py-0.5 text-[10px] rounded-lg font-mono transition-colors ${
                    tokenCap === preset
                      ? 'bg-emerald-500 text-white font-semibold'
                      : 'bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {(preset / 1000)}k
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={closeBotModal}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-panel)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Create Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
