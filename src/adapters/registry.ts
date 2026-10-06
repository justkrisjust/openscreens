import type { ProviderId } from '../services/storage';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './gemini';
import { mistralAdapter } from './mistral';
import { mockAdapter } from './mock';
import { openaiAdapter } from './openai';
import { ollamaAdapter } from './ollama';
import type { ProviderAdapter } from './types';
import { xaiAdapter } from './xai';

const ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  openai: openaiAdapter,
  xai: xaiAdapter,
  mistral: mistralAdapter,
  ollama: ollamaAdapter,
  mock: mockAdapter,
};

export function getAdapter(provider: ProviderId): ProviderAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`Unknown provider adapter: "${provider}". Defaulting to mock demo adapter.`);
  }
  return adapter;
}

export function getAllAdapters(): ProviderAdapter[] {
  return Object.values(ADAPTERS);
}

export function getRealProviderAdapters(): ProviderAdapter[] {
  return [geminiAdapter, anthropicAdapter, openaiAdapter, ollamaAdapter, xaiAdapter, mistralAdapter];
}
