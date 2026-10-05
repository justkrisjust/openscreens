import { describe, it, expect } from 'vitest';
import { extractStatusTag } from '../adapters/base';
import { getAdapter, getAllAdapters } from '../adapters/registry';

describe('Provider Adapters & Tag Parser', () => {
  it('extracts status tag and cleans output correctly', () => {
    const raw = '[STATUS: working] Building the primary UI interface in index.html.';
    const { cleanText, status } = extractStatusTag(raw);
    expect(status).toBe('working');
    expect(cleanText).toBe('Building the primary UI interface in index.html.');
  });

  it('handles variations of status tag casing and format', () => {
    const { status: s1 } = extractStatusTag('STATUS: blocked\nFile is inaccessible');
    expect(s1).toBe('blocked');

    const { status: s2 } = extractStatusTag('[status: needs_help] Encountered runtime bug');
    expect(s2).toBe('needs_help');
  });

  it('exposes accurate CORS browser capabilities per provider', () => {
    const gemini = getAdapter('gemini');
    expect(gemini.capabilities.browserCorsSupported).toBe(true);
    expect(gemini.capabilities.needsProxy).toBe(false);

    const anthropic = getAdapter('anthropic');
    expect(anthropic.capabilities.browserCorsSupported).toBe(true);
    expect(anthropic.capabilities.requiresDirectBrowserHeader).toBe(true);

    const openai = getAdapter('openai');
    expect(openai.capabilities.needsProxy).toBe(true);

    const xai = getAdapter('xai');
    expect(xai.capabilities.needsProxy).toBe(true);
    expect(xai.capabilities.proxyStatusNote).toContain('Needs proxy (coming soon)');

    const mistral = getAdapter('mistral');
    expect(mistral.capabilities.needsProxy).toBe(true);
    expect(mistral.capabilities.proxyStatusNote).toContain('Needs proxy (coming soon)');
  });

  it('mock adapter sends valid chat responses and tokens', async () => {
    const mock = getAdapter('mock');
    const res = await mock.sendMessage({
      model: 'demo-claude-sonnet-persona',
      messages: [{ role: 'user', content: 'COMPAT_TEST_ROLE_FORMAT' }],
      apiKey: 'mock-key',
    });

    expect(res.text).toBeTruthy();
    expect(res.tokenUsage.totalTokens).toBeGreaterThan(0);
    expect(['working', 'thinking', 'done', 'waiting']).toContain(res.statusTag);
  });
});
