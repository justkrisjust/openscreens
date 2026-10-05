import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  name: 'Anthropic Claude',
  displayName: 'Anthropic (Claude)',
  description: 'Direct browser access supported via official anthropic-dangerous-direct-browser-access header.',
  iconName: 'Cpu',
  defaultBaseUrl: 'https://api.anthropic.com/v1',
  capabilities: {
    browserCorsSupported: true,
    requiresDirectBrowserHeader: true,
    needsProxy: false,
    proxyStatusNote: 'Direct browser access enabled with anthropic-dangerous-direct-browser-access: true header.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]> {
    const baseUrl = customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/models`;

    try {
      const res = await fetch(url, {
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: { id: string }) => m.id);
        }
      }
    } catch (err) {
      console.warn('Anthropic models endpoint query failed, using latest model list:', err);
    }

    // Official modern Claude models
    return [
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ];
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = req.customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/messages`;

    // System prompt is top-level in Anthropic API
    const systemPrompt = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const conversationMessages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

    if (conversationMessages.length === 0) {
      conversationMessages.push({ role: 'user', content: 'Begin work.' });
    }

    const payload: {
      model: string;
      max_tokens: number;
      messages: typeof conversationMessages;
      system?: string;
      temperature?: number;
    } = {
      model: req.model,
      max_tokens: req.maxTokens || 1024,
      messages: conversationMessages,
      temperature: req.temperature ?? 0.7,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': req.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || '';
    const { cleanText, status } = extractStatusTag(rawText);

    const tokenUsage = data.usage
      ? {
          promptTokens: data.usage.input_tokens || 0,
          completionTokens: data.usage.output_tokens || 0,
          totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
        }
      : estimateTokens(systemPrompt + ' ' + JSON.stringify(conversationMessages), rawText);

    return {
      text: cleanText,
      tokenUsage,
      statusTag: status,
      rawResponse: data,
    };
  },
};
