import type { Bot, Project, VirtualFile } from './storage';

/**
 * Production initial state: ZERO fake/demo bots, ZERO fake projects.
 * Real data appears when the user creates bots or connects API keys.
 */
export const DEMO_BOTS: Bot[] = [];
export const DEMO_PROJECT_ID = '';
export const DEMO_PROJECT: Project | null = null;
export const DEMO_FILES: VirtualFile[] = [];

/**
 * Test fixtures strictly for automated Vitest test suite
 */
export const TEST_FIXTURE_BOTS: Bot[] = [
  {
    id: 'test-bot-larry',
    name: 'Larry',
    provider: 'mock',
    model: 'demo-claude-sonnet-persona',
    role: 'leader',
    personality: 'Visionary project lead. Coordinates team turns and architecture.',
    avatarColor: '#38bdf8',
    avatarIcon: 'Brain',
    avatarShape: 'star',
    tokenUsage: 0,
    inputTokens: 0,
    outputTokens: 0,
    tokenCap: 15000,
    status: 'waiting',
    createdAt: Date.now(),
  },
  {
    id: 'test-bot-ada',
    name: 'Ada',
    provider: 'mock',
    model: 'demo-gpt4o-persona',
    role: 'developer',
    personality: 'Fastidious full-stack dev. Writes HTML/JS and adheres to lock rules.',
    avatarColor: '#0284c7',
    avatarIcon: 'Code',
    avatarShape: 'squircle',
    tokenUsage: 0,
    inputTokens: 0,
    outputTokens: 0,
    tokenCap: 15000,
    status: 'working',
    createdAt: Date.now(),
  },
];
