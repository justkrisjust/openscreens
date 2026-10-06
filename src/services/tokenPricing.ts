import type { Bot, ProviderId } from './storage';

export interface ModelPricing {
  modelName: string;
  provider: ProviderId;
  inputPerMillion: number; // USD per 1,000,000 input tokens
  outputPerMillion: number; // USD per 1,000,000 output tokens
}

export const PRICING_CATALOG: Record<string, ModelPricing> = {
  // Anthropic
  'claude-3-5-sonnet-20241022': {
    modelName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-3-haiku-20240307': {
    modelName: 'Claude 3 Haiku',
    provider: 'anthropic',
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
  'claude-3-opus-20240229': {
    modelName: 'Claude 3 Opus',
    provider: 'anthropic',
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
  },

  // OpenAI
  'gpt-4o': {
    modelName: 'GPT-4o',
    provider: 'openai',
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
  },
  'gpt-4o-mini': {
    modelName: 'GPT-4o Mini',
    provider: 'openai',
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
  },
  'gpt-4-turbo': {
    modelName: 'GPT-4 Turbo',
    provider: 'openai',
    inputPerMillion: 10.0,
    outputPerMillion: 30.0,
  },

  // Google Gemini
  'gemini-1.5-pro': {
    modelName: 'Gemini 1.5 Pro',
    provider: 'gemini',
    inputPerMillion: 1.25,
    outputPerMillion: 5.0,
  },
  'gemini-1.5-flash': {
    modelName: 'Gemini 1.5 Flash',
    provider: 'gemini',
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
  },
  'gemini-2.0-flash-exp': {
    modelName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    inputPerMillion: 0.1,
    outputPerMillion: 0.4,
  },

  // xAI
  'grok-2': {
    modelName: 'Grok 2',
    provider: 'xai',
    inputPerMillion: 2.0,
    outputPerMillion: 10.0,
  },
  'grok-2-mini': {
    modelName: 'Grok 2 Mini',
    provider: 'xai',
    inputPerMillion: 0.5,
    outputPerMillion: 2.5,
  },

  // Mistral
  'mistral-large-latest': {
    modelName: 'Mistral Large',
    provider: 'mistral',
    inputPerMillion: 2.0,
    outputPerMillion: 6.0,
  },
  'mistral-small-latest': {
    modelName: 'Mistral Small',
    provider: 'mistral',
    inputPerMillion: 0.2,
    outputPerMillion: 0.6,
  },
  'codestral-latest': {
    modelName: 'Codestral',
    provider: 'mistral',
    inputPerMillion: 0.3,
    outputPerMillion: 0.9,
  },

  // Local AI (Ollama / DeepSeek / LM Studio) — Free!
  'deepseek-r1:latest': {
    modelName: 'DeepSeek-R1 (Local)',
    provider: 'ollama',
    inputPerMillion: 0.0,
    outputPerMillion: 0.0,
  },
  'deepseek-coder:6.7b': {
    modelName: 'DeepSeek-Coder (Local)',
    provider: 'ollama',
    inputPerMillion: 0.0,
    outputPerMillion: 0.0,
  },
  'llama3.2:latest': {
    modelName: 'Llama 3.2 (Local)',
    provider: 'ollama',
    inputPerMillion: 0.0,
    outputPerMillion: 0.0,
  },

  // Demo simulator models
  'demo-claude-sonnet-persona': {
    modelName: 'Demo Claude Sonnet',
    provider: 'mock',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'demo-gpt4o-persona': {
    modelName: 'Demo GPT-4o',
    provider: 'mock',
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
  },
  'demo-gemini-flash-persona': {
    modelName: 'Demo Gemini Flash',
    provider: 'mock',
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
  },
};

const DEFAULT_FALLBACK_PRICING: Record<ProviderId, { inputPerMillion: number; outputPerMillion: number }> = {
  anthropic: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  openai: { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  gemini: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  xai: { inputPerMillion: 2.0, outputPerMillion: 10.0 },
  mistral: { inputPerMillion: 2.0, outputPerMillion: 6.0 },
  ollama: { inputPerMillion: 0.0, outputPerMillion: 0.0 },
  mock: { inputPerMillion: 2.0, outputPerMillion: 8.0 },
};

export function getModelPricing(model: string, provider: ProviderId): ModelPricing {
  const normalized = model.toLowerCase();
  for (const [key, pricing] of Object.entries(PRICING_CATALOG)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return pricing;
    }
  }

  const fallback = DEFAULT_FALLBACK_PRICING[provider] || DEFAULT_FALLBACK_PRICING.mock;
  return {
    modelName: model || 'Standard Model',
    provider,
    inputPerMillion: fallback.inputPerMillion,
    outputPerMillion: fallback.outputPerMillion,
  };
}

export interface BotCostAnalysis {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensLeft: number;
  usagePercent: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  formattedCost: string;
  pricing: ModelPricing;
}

export function calculateBotCost(bot: Bot): BotCostAnalysis {
  const pricing = getModelPricing(bot.model, bot.provider);
  const totalTokens = bot.tokenUsage || 0;
  
  // Approximate breakdown if explicit input/output are not stored yet
  const inputTokens = bot.inputTokens ?? Math.round(totalTokens * 0.65);
  const outputTokens = bot.outputTokens ?? Math.round(totalTokens * 0.35);

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const totalCost = inputCost + outputCost;

  const cap = bot.tokenCap || 15000;
  const tokensLeft = Math.max(0, cap - totalTokens);
  const usagePercent = Math.min(100, Math.round((totalTokens / cap) * 100));

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    tokensLeft,
    usagePercent,
    inputCost,
    outputCost,
    totalCost,
    formattedCost: formatUsdCost(totalCost),
    pricing,
  };
}

export function formatUsdCost(cost: number): string {
  if (cost === 0) return '$0.0000';
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

export function calculateFleetMetrics(bots: Bot[]) {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let totalCap = 0;
  let totalCostUsd = 0;

  for (const bot of bots) {
    const analysis = calculateBotCost(bot);
    totalInputTokens += analysis.inputTokens;
    totalOutputTokens += analysis.outputTokens;
    totalTokens += analysis.totalTokens;
    totalCap += bot.tokenCap || 15000;
    totalCostUsd += analysis.totalCost;
  }

  const remainingTokens = Math.max(0, totalCap - totalTokens);
  const averageCostPer1k = totalTokens > 0 ? (totalCostUsd / totalTokens) * 1000 : 0;

  return {
    totalBots: bots.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCap,
    remainingTokens,
    totalCostUsd,
    formattedTotalCost: formatUsdCost(totalCostUsd),
    averageCostPer1k: `$${averageCostPer1k.toFixed(4)}`,
  };
}
