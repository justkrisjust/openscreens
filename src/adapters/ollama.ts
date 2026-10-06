import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag, estimateTokens } from './base';

export const ollamaAdapter: ProviderAdapter = {
  id: 'ollama',
  name: 'Local AI (Ollama / DeepSeek)',
  displayName: 'Local AI (Ollama / DeepSeek)',
  description: 'Connect to Ollama, DeepSeek-R1, LM Studio, or any local OpenAI-compatible server on your PC.',
  iconName: 'Cpu',
  defaultBaseUrl: 'http://localhost:11434/v1',
  capabilities: {
    browserCorsSupported: true,
    requiresDirectBrowserHeader: false,
    needsProxy: false,
    proxyStatusNote: 'Direct browser connection to local server (e.g. Ollama at http://localhost:11434/v1 or LM Studio at http://localhost:1234/v1). API key is optional.',
    supportsCustomProxy: true,
  },

  async fetchModels(apiKey?: string, customProxyUrl?: string): Promise<string[]> {
    const baseUrl = customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    
    // First try OpenAI-compatible /models endpoint
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const names = data.data.map((m: { id: string }) => m.id);
          if (names.length > 0) return names.sort();
        }
      }
    } catch {
      // Fallback: check Ollama native tags endpoint if port is 11434
      try {
        const hostUrl = baseUrl.replace(/\/v1$/, '');
        const res = await fetch(`${hostUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models)) {
            const names = data.models.map((m: { name: string }) => m.name);
            if (names.length > 0) return names.sort();
          }
        }
      } catch {
        // Local server offline or CORS restricted
      }
    }

    const defaultOllamaModels = [
      'deepseek-r1:latest',
      'deepseek-r1:8b',
      'deepseek-r1:14b',
      'deepseek-r1:32b',
      'deepseek-r1:70b',
      'deepseek-coder-v2:latest',
      'qwen2.5-coder:latest',
      'qwen2.5-coder:7b',
      'qwen2.5-coder:14b',
      'qwen2.5-coder:32b',
      'qwen2.5:latest',
      'llama3.3:latest',
      'llama3.3:70b',
      'llama3.2:latest',
      'llama3.2:3b',
      'llama3.2:1b',
      'llama3.1:latest',
      'llama3.1:8b',
      'llama3.1:70b',
      'mistral:latest',
      'mistral-nemo:latest',
      'mixtral:8x7b',
      'phi4:latest',
      'phi3.5:latest',
      'codellama:latest',
      'codellama:7b',
      'starcoder2:latest',
      'gemma2:latest',
      'gemma2:9b',
      'gemma2:27b',
      'command-r:latest',
    ];

    return defaultOllamaModels;
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = req.customProxyUrl?.replace(/\/$/, '') || this.defaultBaseUrl;
    const url = `${baseUrl}/chat/completions`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (req.apiKey && req.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${req.apiKey}`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 1024,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Local AI error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const { cleanText, status } = extractStatusTag(content);

      const usage = data.usage;
      const tokenUsage = usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
          }
        : estimateTokens(JSON.stringify(req.messages), content);

      return {
        text: cleanText,
        tokenUsage,
        statusTag: status,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to reach Local AI at ${baseUrl}: ${msg}. Ensure your local server is running with CORS enabled (e.g. OLLAMA_ORIGINS="*").`);
    }
  },
};
