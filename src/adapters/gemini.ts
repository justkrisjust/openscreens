import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const geminiAdapter: ProviderAdapter = {
  id: 'gemini',
  name: 'Google Gemini',
  displayName: 'Google (Gemini)',
  description: 'Direct browser access enabled. Fast, multi-modal reasoning.',
  iconName: 'Sparkles',
  defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  capabilities: {
    browserCorsSupported: true,
    requiresDirectBrowserHeader: false,
    needsProxy: false,
    proxyStatusNote: 'Direct browser CORS supported natively by Google Generative Language API.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]> {
    const baseUrl = customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/models?key=${encodeURIComponent(apiKey)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google API returned status ${res.status}: ${errorText.slice(0, 150)}`);
      }
      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Unexpected Google API response format: missing models array');
      }

      // Filter for models supporting content generation
      const models = data.models
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ''))
        .filter((name: string) => !name.includes('embedding') && !name.includes('aqa'));

      return models.length > 0
        ? models
        : ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    } catch (err: unknown) {
      console.warn('Falling back to default Gemini models due to error:', err);
      return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    }
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = req.customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    // Strip models/ prefix if present
    const cleanModel = req.model.replace(/^models\//, '');
    const url = `${baseUrl}/models/${cleanModel}:generateContent?key=${encodeURIComponent(req.apiKey)}`;

    // Separate system messages from conversational contents
    const systemMessages = req.messages.filter((m) => m.role === 'system');
    const conversationMessages = req.messages.filter((m) => m.role !== 'system');

    const contents = conversationMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If contents is empty, add user message
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Begin task' }] });
    }

    const payload: {
      contents: typeof contents;
      systemInstruction?: { parts: { text: string }[] };
      generationConfig: {
        temperature?: number;
        maxOutputTokens?: number;
      };
    } = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? 1024,
      },
    };

    if (systemMessages.length > 0) {
      payload.systemInstruction = {
        parts: systemMessages.map((s) => ({ text: s.content })),
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    const { cleanText, status } = extractStatusTag(rawText);

    const usage = data.usageMetadata;
    const tokenUsage = usage
      ? {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        }
      : estimateTokens(
          req.messages.map((m) => m.content).join(' '),
          rawText
        );

    return {
      text: cleanText,
      tokenUsage,
      statusTag: status,
      rawResponse: data,
    };
  },
};
