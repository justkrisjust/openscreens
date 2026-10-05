import { describe, it, expect } from 'vitest';
import { calculateBotCost, calculateFleetMetrics, getModelPricing, formatUsdCost } from '../services/tokenPricing';
import { BOT_SHAPES } from '../components/office/BotFace';
import type { Bot } from '../services/storage';

describe('Token Pricing & Cost Intelligence Engine', () => {
  const sampleClaudeBot: Bot = {
    id: 'test-claude',
    name: 'Claude Test',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    role: 'leader',
    personality: 'Test personality',
    avatarColor: '#10b981',
    avatarIcon: 'Bot',
    avatarShape: 'star',
    tokenUsage: 10000,
    inputTokens: 7000,
    outputTokens: 3000,
    tokenCap: 20000,
    status: 'working',
    createdAt: Date.now(),
  };

  it('correctly retrieves model pricing for Anthropic Claude 3.5 Sonnet', () => {
    const pricing = getModelPricing(sampleClaudeBot.model, sampleClaudeBot.provider);
    expect(pricing.inputPerMillion).toBe(3.0);
    expect(pricing.outputPerMillion).toBe(15.0);
  });

  it('calculates accurate USD cost for input, output, and total tokens', () => {
    const cost = calculateBotCost(sampleClaudeBot);
    // 7000 in = (7000 / 1_000_000) * 3 = 0.021
    // 3000 out = (3000 / 1_000_000) * 15 = 0.045
    // total = 0.066
    expect(cost.inputCost).toBeCloseTo(0.021, 4);
    expect(cost.outputCost).toBeCloseTo(0.045, 4);
    expect(cost.totalCost).toBeCloseTo(0.066, 4);
    expect(cost.formattedCost).toBe('$0.066');
    expect(cost.tokensLeft).toBe(10000); // 20000 cap - 10000 usage
    expect(cost.usagePercent).toBe(50);
  });

  it('correctly aggregates fleet metrics across multiple bots', () => {
    const sampleGptBot: Bot = {
      id: 'test-gpt',
      name: 'GPT Test',
      provider: 'openai',
      model: 'gpt-4o',
      role: 'developer',
      personality: 'Test dev',
      avatarColor: '#6366f1',
      avatarIcon: 'Bot',
      avatarShape: 'hexagon',
      tokenUsage: 5000,
      inputTokens: 3000,
      outputTokens: 2000,
      tokenCap: 15000,
      status: 'waiting',
      createdAt: Date.now(),
    };

    const fleet = calculateFleetMetrics([sampleClaudeBot, sampleGptBot]);
    expect(fleet.totalBots).toBe(2);
    expect(fleet.totalTokens).toBe(15000);
    expect(fleet.totalCap).toBe(35000);
    expect(fleet.remainingTokens).toBe(20000);
    expect(fleet.totalCostUsd).toBeGreaterThan(0);
  });

  it('formats small micro-dollar amounts to 4 decimal places', () => {
    expect(formatUsdCost(0.0042)).toBe('$0.0042');
    expect(formatUsdCost(0)).toBe('$0.0000');
    expect(formatUsdCost(1.25)).toBe('$1.250');
  });
});

describe('Bot Shapes Catalog', () => {
  it('contains exactly 10 distinct custom shapes', () => {
    expect(BOT_SHAPES.length).toBe(10);
    const shapeIds = BOT_SHAPES.map((s) => s.id);
    expect(shapeIds).toContain('circle');
    expect(shapeIds).toContain('squircle');
    expect(shapeIds).toContain('box');
    expect(shapeIds).toContain('star');
    expect(shapeIds).toContain('hexagon');
    expect(shapeIds).toContain('diamond');
    expect(shapeIds).toContain('shield');
    expect(shapeIds).toContain('capsule');
    expect(shapeIds).toContain('heart');
    expect(shapeIds).toContain('octagon');
  });
});
