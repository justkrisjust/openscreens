import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { getAdapter, getRealProviderAdapters } from '../../adapters/registry';
import type { ProviderId } from '../../services/storage';

export const KeyVaultModal: React.FC = () => {
  const {
    isUnlocked,
    unlockVault,
    lockVault,
    setSessionKey,
    getKey,
    removeKey,
    hasSavedKeys,
    setProxyUrl,
    getProxyUrl,
  } = useAuthStore();

  const { showToast } = useUIStore();

  const [passphraseInput, setPassphraseInput] = useState('');
  const [persistEncrypted, setPersistEncrypted] = useState(false);
  const [visibleKeyProvider, setVisibleKeyProvider] = useState<ProviderId | null>(null);
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; msg: string }>>({});

  const [inputKeys, setInputKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [inputProxies, setInputProxies] = useState<Partial<Record<ProviderId, string>>>({});

  const realProviders = getRealProviderAdapters();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput) return;
    const ok = await unlockVault(passphraseInput);
    if (ok) {
      showToast('Vault unlocked. Encrypted keys loaded.', 'success');
    } else {
      showToast('Incorrect passphrase or corrupted encrypted payload.', 'error');
    }
  };

  const handleSaveProviderKey = async (providerId: ProviderId) => {
    const key = inputKeys[providerId]?.trim();
    if (!key) {
      showToast('Please enter an API key.', 'warn');
      return;
    }

    try {
      await setSessionKey(providerId, key, persistEncrypted, passphraseInput.trim() || undefined);
      if (inputProxies[providerId]) {
        setProxyUrl(providerId, inputProxies[providerId]!);
      }
      showToast(
        persistEncrypted
          ? `Key for ${providerId} encrypted with AES-GCM and saved.`
          : `Key for ${providerId} stored in session memory only.`,
        'success'
      );
      setInputKeys((prev) => ({ ...prev, [providerId]: '' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  const handleTestConnection = async (providerId: ProviderId) => {
    const key = getKey(providerId) || inputKeys[providerId];
    if (!key) {
      showToast('Add a key first to test connection.', 'warn');
      return;
    }

    setTestingProvider(providerId);
    const adapter = getAdapter(providerId);
    const proxy = getProxyUrl(providerId) || inputProxies[providerId];

    try {
      const models = await adapter.fetchModels(key, proxy);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: true,
          msg: `Connected! Found ${models.length} models: ${models.slice(0, 3).join(', ')}...`,
        },
      }));
      showToast(`Successfully verified connection to ${adapter.displayName}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          msg: msg.slice(0, 150),
        },
      }));
      showToast(`Connection failed: ${msg.slice(0, 100)}`, 'error');
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Security Banner */}
      <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-2xl p-5 mb-8 shadow-sm transition-colors duration-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text-main)]">
                Your Keys Stay in Your Browser
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Zero Server • Zero Telemetry
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              OpenScreens has <strong>no backend server</strong>. All API calls execute directly from
              your browser window to the official provider endpoints. When saved, keys are encrypted
              using <strong>WebCrypto AES-GCM (256-bit)</strong> with a <strong>PBKDF2</strong> key derived from your passphrase.
            </p>
          </div>
        </div>
      </div>

      {/* Master Passphrase Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isUnlocked
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[var(--bg-panel)] text-[var(--text-muted)]'
              }`}
            >
              {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-main)]">
                {isUnlocked ? 'Vault is Unlocked' : 'WebCrypto Key Vault'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {hasSavedKeys
                  ? 'Enter your master passphrase to decrypt stored keys.'
                  : 'Set a passphrase if you want to encrypt and persist keys across browser restarts.'}
              </p>
            </div>
          </div>

          {isUnlocked ? (
            <button
              onClick={lockVault}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] transition-colors"
            >
              Lock Vault
            </button>
          ) : (
            <form onSubmit={handleUnlock} className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Master passphrase..."
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500 w-44"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
              >
                Unlock
              </button>
            </form>
          )}
        </div>

        {/* Persistence Preference Toggle */}
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            id="persist-keys"
            checked={persistEncrypted}
            onChange={(e) => setPersistEncrypted(e.target.checked)}
            className="rounded border-[var(--border-strong)] text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-[var(--bg-panel)]"
          />
          <label htmlFor="persist-keys" className="cursor-pointer select-none">
            Save encrypted keys in IndexedDB with master passphrase (uncheck for session-only in memory)
          </label>
        </div>
      </div>

      {/* Provider API Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-main)] uppercase tracking-wider font-mono">
          AI Provider Connections
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {realProviders.map((adapter) => {
            const hasKey = !!getKey(adapter.id);
            const isVisible = visibleKeyProvider === adapter.id;
            const currentTest = testResults[adapter.id];
            const isTesting = testingProvider === adapter.id;

            return (
              <div
                key={adapter.id}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-strong)] transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)]">
                      <Key className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-main)] text-sm">
                          {adapter.displayName}
                        </span>
                        {/* Capabilities badge */}
                        {adapter.capabilities.browserCorsSupported ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                            Browser Direct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            Needs proxy (coming soon)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {adapter.capabilities.proxyStatusNote}
                      </p>
                    </div>
                  </div>

                  {hasKey && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Key Ready
                      </span>
                      <button
                        onClick={() => removeKey(adapter.id)}
                        className="text-xs text-[var(--text-muted)] hover:text-rose-500 px-2 py-1 rounded bg-[var(--bg-panel)] hover:bg-rose-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Input Fields */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="relative sm:col-span-8">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      placeholder={hasKey ? '••••••••••••••••••••••••' : `Enter ${adapter.name} API Key...`}
                      value={inputKeys[adapter.id] || ''}
                      onChange={(e) =>
                        setInputKeys((prev) => ({ ...prev, [adapter.id]: e.target.value }))
                      }
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3 py-2.5 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500 pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleKeyProvider(isVisible ? null : adapter.id)
                      }
                      className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    <button
                      onClick={() => handleSaveProviderKey(adapter.id)}
                      className="flex-1 px-3 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
                    >
                      {hasKey ? 'Update Key' : 'Save Key'}
                    </button>
                    <button
                      onClick={() => handleTestConnection(adapter.id)}
                      disabled={isTesting || (adapter.id !== 'ollama' && !hasKey && !inputKeys[adapter.id])}
                      className="px-3 py-2.5 text-xs font-medium bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl border border-[var(--border-subtle)] transition-colors disabled:opacity-40"
                    >
                      {isTesting ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>

                {/* Optional Custom Proxy / Local Endpoint URL */}
                {adapter.capabilities.supportsCustomProxy && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {adapter.id === 'ollama' ? 'Local URL:' : 'Custom Proxy:'}
                      </span>
                      <input
                        type="text"
                        placeholder={adapter.defaultBaseUrl}
                        value={
                          inputProxies[adapter.id] !== undefined
                            ? inputProxies[adapter.id]
                            : getProxyUrl(adapter.id) || ''
                        }
                        onChange={(e) => {
                          setInputProxies((prev) => ({ ...prev, [adapter.id]: e.target.value }));
                          setProxyUrl(adapter.id, e.target.value);
                        }}
                        className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[11px] rounded-lg px-2.5 py-1 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Connection Test Output */}
                {currentTest && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs font-mono flex items-start gap-2 ${
                      currentTest.success
                        ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {currentTest.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span className="leading-snug">{currentTest.msg}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
