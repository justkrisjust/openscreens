import type { BotGesture, ProviderId } from '../services/storage';

export interface ProviderCapabilities {
  browserCorsSupported: boolean;
  requiresDirectBrowserHeader: boolean;
  needsProxy: boolean;
  proxyStatusNote: string;
  supportsCustomProxy: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  apiKey: string;
  customProxyUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatCompletionResponse {
  text: string;
  tokenUsage: TokenUsage;
  statusTag: BotGesture;
  rawResponse?: unknown;
}

export interface ProviderAdapter {
  id: ProviderId;
  name: string;
  displayName: string;
  description: string;
  iconName: string; // Lucide icon identifier
  capabilities: ProviderCapabilities;
  defaultBaseUrl: string;
  fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]>;
  sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
