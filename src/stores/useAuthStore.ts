import { create } from 'zustand';
import type { ProviderId, UserAccount } from '../services/storage';
import {
  deleteEncryptedKey,
  getAllEncryptedKeys,
  saveEncryptedKey,
  getUserAccountByEmail,
  getUserAccountById,
  saveUserAccount,
} from '../services/storage';
import { decryptData, encryptData, hashPassword, verifyPassword } from '../services/crypto';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  // Account Authentication State
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  isGuest: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;

  // Key Vault State
  isUnlocked: boolean;
  passphrase: string | null;
  sessionKeys: Partial<Record<ProviderId, string>>;
  proxyUrls: Partial<Record<ProviderId, string>>;
  hasSavedKeys: boolean;

  // Account Actions
  restoreSession: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Key Vault Actions
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  setSessionKey: (provider: ProviderId, key: string, persistEncrypted?: boolean, explicitPassphrase?: string) => Promise<void>;
  getKey: (provider: ProviderId) => string | undefined;
  removeKey: (provider: ProviderId) => Promise<void>;
  setProxyUrl: (provider: ProviderId, url: string) => void;
  getProxyUrl: (provider: ProviderId) => string | undefined;
  checkSavedKeys: () => Promise<void>;
  wipeAllKeys: () => Promise<void>;
}

const SESSION_STORAGE_KEY = 'openscreens_auth_session';
const REMEMBER_STORAGE_KEY = 'openscreens_remembered_uid';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  isGuest: false,
  failedAttempts: 0,
  lockoutUntil: null,

  isUnlocked: false,
  passphrase: null,
  sessionKeys: {
    mock: 'mock-local-token',
  },
  proxyUrls: {},
  hasSavedKeys: false,

  restoreSession: async () => {
    try {
      // 1. Check temporary session storage first
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { user: AuthUser; isGuest: boolean };
        if (parsed.user) {
          set({
            isAuthenticated: true,
            currentUser: parsed.user,
            isGuest: parsed.isGuest || false,
          });
          return;
        }
      }

      // 2. Check persistent remember me storage
      const rememberedUid = localStorage.getItem(REMEMBER_STORAGE_KEY);
      if (rememberedUid) {
        const user = await getUserAccountById(rememberedUid);
        if (user) {
          const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({ user: authUser, isGuest: false })
          );
          set({
            isAuthenticated: true,
            currentUser: authUser,
            isGuest: false,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Session restore fallback:', e);
    }
  },

  login: async (email: string, password: string, rememberMe = false) => {
    const { lockoutUntil, failedAttempts } = get();
    const now = Date.now();

    if (lockoutUntil && now < lockoutUntil) {
      const waitSec = Math.ceil((lockoutUntil - now) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Security lockout active for ${waitSec}s.`,
      };
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      const user = await getUserAccountByEmail(cleanEmail);
      if (!user) {
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= MAX_ATTEMPTS) {
          set({ failedAttempts: newAttempts, lockoutUntil: now + LOCKOUT_DURATION_MS });
          return {
            success: false,
            error: 'Too many failed attempts. Locked out for 30 seconds.',
          };
        }
        set({ failedAttempts: newAttempts });
        return { success: false, error: 'Invalid email or password.' };
      }

      const isValid = await verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= MAX_ATTEMPTS) {
          set({ failedAttempts: newAttempts, lockoutUntil: now + LOCKOUT_DURATION_MS });
          return {
            success: false,
            error: 'Too many failed attempts. Locked out for 30 seconds.',
          };
        }
        set({ failedAttempts: newAttempts });
        return { success: false, error: 'Invalid email or password.' };
      }

      // Successful login
      const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ user: authUser, isGuest: false })
      );

      if (rememberMe) {
        localStorage.setItem(REMEMBER_STORAGE_KEY, user.id);
      } else {
        localStorage.removeItem(REMEMBER_STORAGE_KEY);
      }

      set({
        isAuthenticated: true,
        currentUser: authUser,
        isGuest: false,
        failedAttempts: 0,
        lockoutUntil: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },

  register: async (name: string, email: string, password: string, rememberMe = false) => {
    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanName) {
      return { success: false, error: 'Name is required.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    try {
      const existing = await getUserAccountByEmail(cleanEmail);
      if (existing) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const { hash, salt } = await hashPassword(password);
      const newUser: UserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash: hash,
        salt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveUserAccount(newUser);

      const authUser: AuthUser = { id: newUser.id, name: newUser.name, email: newUser.email };
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ user: authUser, isGuest: false })
      );

      if (rememberMe) {
        localStorage.setItem(REMEMBER_STORAGE_KEY, newUser.id);
      }

      set({
        isAuthenticated: true,
        currentUser: authUser,
        isGuest: false,
        failedAttempts: 0,
        lockoutUntil: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },

  loginAsGuest: () => {
    const guestUser: AuthUser = {
      id: 'guest-director',
      name: 'Colony Director (Guest)',
      email: 'director@local.colony',
    };
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: guestUser, isGuest: true })
    );
    set({
      isAuthenticated: true,
      currentUser: guestUser,
      isGuest: true,
      failedAttempts: 0,
      lockoutUntil: null,
    });
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
    set({
      isAuthenticated: false,
      currentUser: null,
      isGuest: false,
      isUnlocked: false,
      passphrase: null,
      sessionKeys: { mock: 'mock-local-token' },
    });
  },

  resetPassword: async (email: string, newPassword: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    try {
      const user = await getUserAccountByEmail(cleanEmail);
      if (!user) {
        // Privacy-preserving response: do not reveal whether user exists
        return { success: true };
      }

      const { hash, salt } = await hashPassword(newPassword);
      user.passwordHash = hash;
      user.salt = salt;
      user.updatedAt = Date.now();
      await saveUserAccount(user);

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },

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

  setSessionKey: async (provider: ProviderId, key: string, persistEncrypted = false, explicitPassphrase?: string) => {
    set((state) => ({
      sessionKeys: {
        ...state.sessionKeys,
        [provider]: key,
      },
    }));

    if (persistEncrypted && provider !== 'mock') {
      const activePassphrase = explicitPassphrase || get().passphrase;
      if (!activePassphrase) {
        throw new Error('Please enter a master passphrase above to encrypt and save your key.');
      }
      if (!get().passphrase) {
        set({ passphrase: activePassphrase, isUnlocked: true });
      }
      const encryptedPayload = await encryptData(key, activePassphrase);
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
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
    set({
      isAuthenticated: false,
      currentUser: null,
      isGuest: false,
      isUnlocked: false,
      passphrase: null,
      sessionKeys: { mock: 'mock-local-token' },
      proxyUrls: {},
      hasSavedKeys: false,
    });
  },
}));
