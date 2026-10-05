import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  name: 'OpenAI',
  displayName: 'OpenAI (ChatGPT)',
  description: 'Standard OpenAI chat completions. Browser CORS restricted; requires custom proxy or CORS proxy.',
  iconName: 'Bot',
  defaultBaseUrl: 'https://api.openai.com/v1',
  capabilities: {
    browserCorsSupported: false,
    requiresDirectBrowserHeader: false,
    needsProxy: true,
    proxyStatusNote: 'Browser CORS restricted by OpenAI. Set a custom proxy URL or use Gemini / Claude for direct browser connections.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]> {
    const baseUrl = customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/models`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const chatModels = data.data
            .map((m: { id: string }) => m.id)
            .filter((id: string) => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3'));
          if (chatModels.length > 0) {
            return chatModels.sort();
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI models fetch error (expected if no proxy):', err);
    }

    return ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-mini', 'gpt-4-turbo'];
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = req.customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/chat/completions`;

    try {
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
          max_tokens: req.maxTokens ?? 1024,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API Error (${res.status}): ${errText.slice(0, 200)}`);
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
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error(
          'OpenAI API call blocked by browser CORS policy. Please specify a custom proxy URL in Settings or use a provider with native browser support (e.g. Gemini, Claude, or Demo Mode).'
        );
      }
      throw err;
    }
  },
};
