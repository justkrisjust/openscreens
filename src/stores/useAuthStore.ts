import { create } from 'zustand';
import type { ProviderId } from '../services/storage';
import {
  deleteEncryptedKey,
  getAllEncryptedKeys,
  saveEncryptedKey,
} from '../services/storage';
import { decryptData, encryptData } from '../services/crypto';

interface AuthState {
  isUnlocked: boolean;
  passphrase: string | null;
  // Decrypted keys kept in volatile memory for the active session
  sessionKeys: Partial<Record<ProviderId, string>>;
  // Optional custom proxy URLs for providers requiring proxy
  proxyUrls: Partial<Record<ProviderId, string>>;
  // Indicator whether encrypted keys exist in IndexedDB
  hasSavedKeys: boolean;

  // Actions
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  setSessionKey: (provider: ProviderId, key: string, persistEncrypted?: boolean) => Promise<void>;
  getKey: (provider: ProviderId) => string | undefined;
  removeKey: (provider: ProviderId) => Promise<void>;
  setProxyUrl: (provider: ProviderId, url: string) => void;
  getProxyUrl: (provider: ProviderId) => string | undefined;
  checkSavedKeys: () => Promise<void>;
  wipeAllKeys: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isUnlocked: false,
  passphrase: null,
  sessionKeys: {
    mock: 'mock-local-token',
  },
  proxyUrls: {},
  hasSavedKeys: false,

  unlockVault: async (passphrase: string) => {
    try {
      const records = await getAllEncryptedKeys();
      const decryptedKeys: Partial<Record<ProviderId, string>> = {
        mock: 'mock-local-token',
      };

      for (const rec of records) {
        try {
          const plain = await decryptData(rec.encryptedPayload, passphrase);
          decryptedKeys[rec.provider] = plain;
        } catch {
          // If any payload fails to decrypt with this passphrase, reject unlock
          return false;
        }
      }

      set({
        isUnlocked: true,
        passphrase,
        sessionKeys: decryptedKeys,
        hasSavedKeys: records.length > 0,
      });
      return true;
    } catch {
      return false;
    }
  },

  lockVault: () => {
    set({
      isUnlocked: false,
      passphrase: null,
      sessionKeys: { mock: 'mock-local-token' },
    });
  },

  setSessionKey: async (provider: ProviderId, key: string, persistEncrypted = false) => {
    // Always store in memory for session
    set((state) => ({
      sessionKeys: {
        ...state.sessionKeys,
        [provider]: key,
      },
    }));

    // If user requested persistent encrypted storage with passphrase
    if (persistEncrypted && provider !== 'mock') {
      const currentPassphrase = get().passphrase;
      if (!currentPassphrase) {
        throw new Error('Please set or enter your master passphrase to encrypt and save your key.');
      }
      const encryptedPayload = await encryptData(key, currentPassphrase);
      await saveEncryptedKey({
        provider,
        encryptedPayload,
        updatedAt: Date.now(),
      });
      set({ hasSavedKeys: true });
    }
  },

  getKey: (provider: ProviderId) => {
    if (provider === 'mock') return 'mock-local-token';
    return get().sessionKeys[provider];
  },

  removeKey: async (provider: ProviderId) => {
    set((state) => {
      const updated = { ...state.sessionKeys };
      delete updated[provider];
      return { sessionKeys: updated };
    });
    await deleteEncryptedKey(provider);
    await get().checkSavedKeys();
  },

  setProxyUrl: (provider: ProviderId, url: string) => {
    set((state) => ({
      proxyUrls: { ...state.proxyUrls, [provider]: url },
    }));
  },

  getProxyUrl: (provider: ProviderId) => {
    return get().proxyUrls[provider];
  },

  checkSavedKeys: async () => {
    const keys = await getAllEncryptedKeys();
    set({ hasSavedKeys: keys.length > 0 });
  },

  wipeAllKeys: async () => {
    set({
      isUnlocked: false,
      passphrase: null,
      sessionKeys: { mock: 'mock-local-token' },
      proxyUrls: {},
      hasSavedKeys: false,
    });
  },
}));
