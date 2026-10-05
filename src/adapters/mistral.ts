import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const mistralAdapter: ProviderAdapter = {
  id: 'mistral',
  name: 'Mistral AI',
  displayName: 'Mistral AI',
  description: 'French open & commercial models. Browser CORS restricted; requires custom proxy (coming soon for direct).',
  iconName: 'Flame',
  defaultBaseUrl: 'https://api.mistral.ai/v1',
  capabilities: {
    browserCorsSupported: false,
    requiresDirectBrowserHeader: false,
    needsProxy: true,
    proxyStatusNote: 'Needs proxy (coming soon): Mistral does not permit direct browser cross-origin requests. Set a custom proxy URL if you host one.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]> {
    if (!customProxyUrl) {
      return [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest',
        'codestral-latest',
        'open-mistral-nemo',
      ];
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
      console.warn('Mistral models fetch error:', e);
    }

    return ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'];
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!req.customProxyUrl) {
      throw new Error(
        'Mistral AI requires a backend proxy due to browser CORS security. Please set a custom proxy URL or switch to Gemini, Claude, or Demo Mode.'
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
      throw new Error(`Mistral Error (${res.status}): ${err.slice(0, 150)}`);
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
