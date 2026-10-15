import { create } from 'zustand';
import type { Bot, BotGesture } from '../services/storage';
import {
  deleteBot,
  getAllBots,
  saveBot,
} from '../services/storage';

interface BotState {
  bots: Bot[];
  isLoading: boolean;
  selectedBotId: string | null;

  // Actions
  loadBots: () => Promise<void>;
  createBot: (bot: Omit<Bot, 'id' | 'createdAt' | 'tokenUsage' | 'status'>) => Promise<Bot>;
  updateBot: (id: string, updates: Partial<Bot>) => Promise<void>;
  removeBot: (id: string) => Promise<void>;
  setBotStatus: (id: string, status: BotGesture) => void;
  incrementTokens: (id: string, tokens: number, inputTokens?: number, outputTokens?: number) => void;
  resetTokens: (id: string) => void;
  resetAllTokens: () => void;
  setTokenCap: (id: string, cap: number) => void;
  setSelectedBotId: (id: string | null) => void;
}

export const useBotStore = create<BotState>((set, get) => ({
  bots: [],
  isLoading: true,
  selectedBotId: null,

  loadBots: async () => {
    try {
      const storedBots = await getAllBots();
      // Filter out any legacy demo bots
      const realBots = storedBots.filter((b) => !b.id.startsWith('demo-'));
      if (storedBots.length !== realBots.length) {
        for (const b of storedBots) {
          if (b.id.startsWith('demo-')) {
            await deleteBot(b.id).catch(() => {});
          }
        }
      }
      set({ bots: realBots, isLoading: false });
    } catch (err) {
      console.warn('Error loading bots from storage:', err);
      set({ bots: [], isLoading: false });
    }
  },

  createBot: async (botData) => {
    const currentBots = get().bots;
    if (currentBots.length >= 12) {
      throw new Error('Maximum of 12 bots allowed in project.');
    }

    const newBot: Bot = {
      ...botData,
      id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tokenUsage: 0,
      tokenCap: botData.tokenCap || 15000,
      status: 'waiting',
      createdAt: Date.now(),
    };

    await saveBot(newBot);
    set((state) => ({ bots: [...state.bots, newBot] }));
    return newBot;
  },

  updateBot: async (id, updates) => {
    const current = get().bots.find((b) => b.id === id);
    if (!current) return;

    const updated = { ...current, ...updates };
    await saveBot(updated);
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? updated : b)),
    }));
  },

  removeBot: async (id) => {
    await deleteBot(id);
    set((state) => ({
      bots: state.bots.filter((b) => b.id !== id),
      selectedBotId: state.selectedBotId === id ? null : state.selectedBotId,
    }));
  },

  setBotStatus: (id, status) => {
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  },

  incrementTokens: (id, tokens, inputTokens = 0, outputTokens = 0) => {
    set((state) => ({
      bots: state.bots.map((b) =>
        b.id === id
          ? {
              ...b,
              tokenUsage: b.tokenUsage + tokens,
              inputTokens: (b.inputTokens || 0) + (inputTokens || Math.round(tokens * 0.65)),
              outputTokens: (b.outputTokens || 0) + (outputTokens || Math.round(tokens * 0.35)),
            }
          : b
      ),
    }));
  },

  resetTokens: (id) => {
    set((state) => ({
      bots: state.bots.map((b) =>
        b.id === id ? { ...b, tokenUsage: 0, inputTokens: 0, outputTokens: 0 } : b
      ),
    }));
  },

  resetAllTokens: () => {
    set((state) => ({
      bots: state.bots.map((b) => ({ ...b, tokenUsage: 0, inputTokens: 0, outputTokens: 0 })),
    }));
  },

  setTokenCap: (id, cap) => {
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? { ...b, tokenCap: cap } : b)),
    }));
  },

  setSelectedBotId: (id) => {
    set({ selectedBotId: id });
  },
}));
