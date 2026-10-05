import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const xaiAdapter: ProviderAdapter = {
  id: 'xai',
  name: 'xAI Grok',
  displayName: 'xAI (Grok)',
  description: 'Grok models by xAI. Browser CORS restricted; requires custom proxy (coming soon for direct).',
  iconName: 'Zap',
  defaultBaseUrl: 'https://api.x.ai/v1',
  capabilities: {
    browserCorsSupported: false,
    requiresDirectBrowserHeader: false,
    needsProxy: true,
    proxyStatusNote: 'Needs proxy (coming soon): xAI does not provide CORS headers for direct web browsers. You can specify a custom proxy URL if you host one.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]> {
    if (!customProxyUrl) {
      // Without proxy, return verified models rather than failing with a CORS error
      return ['grok-2-latest', 'grok-2-vision-1212', 'grok-beta'];
    }

    try {
      const res = await fetch(`${customProxyUrl.replace(/\/$/, '')}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: { id: string }) => m.id);
        }
      }
    } catch (e) {
      console.warn('xAI models proxy query failed:', e);
    }

    return ['grok-2-latest', 'grok-2-vision-1212', 'grok-beta'];
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!req.customProxyUrl) {
      throw new Error(
        'xAI Grok requires a backend proxy due to browser CORS policies. Please configure a custom proxy URL in Settings or try Gemini, Claude, or Demo Mode.'
      );
    }

    const baseUrl = req.customProxyUrl.replace(/\/$/, '');
    const url = `${baseUrl}/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`xAI Error (${res.status}): ${err.slice(0, 150)}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const { cleanText, status } = extractStatusTag(rawText);

    const usage = data.usage;
    const tokenUsage = usage
      ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        }
      : estimateTokens(JSON.stringify(req.messages), rawText);

    return {
      text: cleanText,
      tokenUsage,
      statusTag: status,
      rawResponse: data,
    };
  },
};
