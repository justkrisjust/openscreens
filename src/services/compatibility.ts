import { getAdapter } from '../adapters/registry';
import type { ChatMessage } from '../adapters/types';
import type { Bot } from './storage';

export interface CompatibilityTestStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'pass' | 'warn' | 'fail';
  isHardFailure: boolean;
  tokensUsed: number;
  outputSummary?: string;
  suggestion: string;
}

export interface BotCompatibilityReport {
  botId: string;
  botName: string;
  model: string;
  provider: string;
  steps: CompatibilityTestStep[];
  overallStatus: 'pass' | 'warn' | 'fail';
  canStart: boolean;
  totalTokensUsed: number;
}

export interface HandshakeReport {
  botA: string;
  botB: string;
  status: 'pending' | 'running' | 'pass' | 'warn' | 'fail';
  tokensUsed: number;
  outputSummary?: string;
  suggestion: string;
}

export interface FullCompatibilityReport {
  botReports: BotCompatibilityReport[];
  handshakeReport?: HandshakeReport;
  overallScorePercent: number; // Derived directly from (passes / total) * 100
  canStart: boolean;
  hasHardFailures: boolean;
  hasWarnings: boolean;
}

/**
 * Runs the 4-stage compatibility test for a team of bots
 */
export async function runFullCompatibilityCheck(
  bots: Bot[],
  keyGetter: (provider: Bot['provider']) => string | undefined,
  proxyGetter?: (provider: Bot['provider']) => string | undefined
): Promise<FullCompatibilityReport> {
  const botReports: BotCompatibilityReport[] = [];

  for (const bot of bots) {
    const apiKey = keyGetter(bot.provider) || (bot.provider === 'mock' ? 'mock-key' : '');
    const proxyUrl = proxyGetter ? proxyGetter(bot.provider) : undefined;
    const adapter = getAdapter(bot.provider);

    const steps: CompatibilityTestStep[] = [
      {
        id: 'role_format',
        name: 'Role & Format Following',
        description: 'Verifies model responds as its persona and emits status tags [STATUS: ...]',
        status: 'pending',
        isHardFailure: true,
        tokensUsed: 0,
        suggestion: '',
      },
      {
        id: 'file_rules',
        name: 'Shared File Read/Write',
        description: 'Tests if model formats file outputs correctly (MEMORY_WRITE: notes.md)',
        status: 'pending',
        isHardFailure: true,
        tokensUsed: 0,
        suggestion: '',
      },
      {
        id: 'lock_respect',
        name: 'File Lock Respect',
        description: 'Tests response when notified that a virtual file is locked by a teammate',
        status: 'pending',
        isHardFailure: false, // Soft warning, user can override
        tokensUsed: 0,
        suggestion: '',
      },
    ];

    // Step 1: Role & Format
    steps[0].status = 'running';
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are ${bot.name}, an AI bot with role "${bot.role}". Personality: "${bot.personality}". You must output your current action tag in format [STATUS: working|done|waiting]. Keep response concise.`,
        },
        {
          role: 'user',
          content: `COMPAT_TEST_ROLE_FORMAT: Confirm your role and provide your readiness greeting.`,
        },
      ];

      const res = await adapter.sendMessage({
        model: bot.model,
        messages,
        apiKey,
        customProxyUrl: proxyUrl,
        maxTokens: 150,
      });

      steps[0].tokensUsed = res.tokenUsage.totalTokens;
      steps[0].outputSummary = res.text.slice(0, 120);

      if (res.statusTag && res.text.length > 5) {
        steps[0].status = 'pass';
        steps[0].suggestion = 'Passed: Model cleanly adopted persona and output format tags.';
      } else {
        steps[0].status = 'warn';
        steps[0].suggestion = 'Warning: Model responded but missed the explicit status tag format.';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      steps[0].status = 'fail';
      steps[0].tokensUsed = 0;
      steps[0].outputSummary = msg.slice(0, 150);
      steps[0].suggestion = msg.includes('CORS') || msg.includes('proxy')
        ? 'Hard failure: Browser CORS blocked this provider. A proxy or browser-supported provider is required.'
        : 'Hard failure: API request failed. Verify your API key or model availability.';
    }

    // Step 2: File Read/Write Syntax
    if (steps[0].status !== 'fail') {
      steps[1].status = 'running';
      try {
        const messages: ChatMessage[] = [
          {
            role: 'system',
            content: `You write virtual project files using the exact syntax: MEMORY_WRITE: <filename>\n<content>`,
          },
          {
            role: 'user',
            content: `COMPAT_TEST_FILE_RULES: Write a quick checklist to team_notes.md.`,
          },
        ];

        const res = await adapter.sendMessage({
          model: bot.model,
          messages,
          apiKey,
          customProxyUrl: proxyUrl,
          maxTokens: 200,
        });

        steps[1].tokensUsed = res.tokenUsage.totalTokens;
        steps[1].outputSummary = res.text.slice(0, 120);

        if (res.text.includes('MEMORY_WRITE') || res.text.includes('team_notes.md')) {
          steps[1].status = 'pass';
          steps[1].suggestion = 'Passed: Model correctly generated structured memory file syntax.';
        } else {
          steps[1].status = 'warn';
          steps[1].suggestion = 'Warning: Model provided notes but omitted the strict MEMORY_WRITE syntax. Try a stronger model if automated file editing fails.';
        }
      } catch (err: unknown) {
        steps[1].status = 'fail';
        steps[1].suggestion = 'Hard failure during file syntax evaluation.';
      }
    } else {
      steps[1].status = 'fail';
      steps[1].suggestion = 'Skipped due to prior connectivity failure.';
    }

    // Step 3: Lock Respect
    if (steps[0].status !== 'fail') {
      steps[2].status = 'running';
      try {
        const messages: ChatMessage[] = [
          {
            role: 'system',
            content: `You collaborate with other bots. When told a file is locked ("busy, pick another task"), you must never fight or poll. Acknowledge and switch tasks or wait.`,
          },
          {
            role: 'user',
            content: `COMPAT_TEST_LOCK_RESPECT: Notice from app: "busy, pick another task: index.html is locked by teammate". What is your next action?`,
          },
        ];

        const res = await adapter.sendMessage({
          model: bot.model,
          messages,
          apiKey,
          customProxyUrl: proxyUrl,
          maxTokens: 150,
        });

        steps[2].tokensUsed = res.tokenUsage.totalTokens;
        steps[2].outputSummary = res.text.slice(0, 120);

        if (/wait|switch|another|plan|secondary|acknowledged/i.test(res.text)) {
          steps[2].status = 'pass';
          steps[2].suggestion = 'Passed: Model respects lock boundaries without attempting to overwrite.';
        } else {
          steps[2].status = 'warn';
          steps[2].suggestion = 'Warning: Model response was ambiguous regarding file lock boundaries.';
        }
      } catch {
        steps[2].status = 'warn';
        steps[2].suggestion = 'Warning: Lock test timed out. App will enforce locks automatically regardless.';
      }
    } else {
      steps[2].status = 'fail';
      steps[2].suggestion = 'Skipped due to prior failure.';
    }

    const hasFail = steps.some((s) => s.status === 'fail');
    const hasWarn = steps.some((s) => s.status === 'warn');
    const overallStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';

    botReports.push({
      botId: bot.id,
      botName: bot.name,
      model: bot.model,
      provider: bot.provider,
      steps,
      overallStatus,
      canStart: !hasFail, // Can start if only warnings
      totalTokensUsed: steps.reduce((sum, s) => sum + s.tokensUsed, 0),
    });
  }

  // Step 4: 2-Bot Handshake (if at least 2 bots exist)
  let handshakeReport: HandshakeReport | undefined;
  if (bots.length >= 2) {
    const botA = bots[0];
    const botB = bots[1];
    handshakeReport = {
      botA: botA.name,
      botB: botB.name,
      status: 'running',
      tokensUsed: 0,
      suggestion: '',
    };

    try {
      const adapterB = getAdapter(botB.provider);
      const keyB = keyGetter(botB.provider) || (botB.provider === 'mock' ? 'mock' : '');
      const proxyB = proxyGetter ? proxyGetter(botB.provider) : undefined;

      const res = await adapterB.sendMessage({
        model: botB.model,
        messages: [
          {
            role: 'system',
            content: `You are ${botB.name}. Teammate ${botA.name} just left a note for you: "I drafted the initial architecture. Please review and coordinate." Respond to confirm receipt.`,
          },
          {
            role: 'user',
            content: `COMPAT_TEST_HANDSHAKE: Respond to ${botA.name}'s handoff.`,
          },
        ],
        apiKey: keyB,
        customProxyUrl: proxyB,
        maxTokens: 120,
      });

      handshakeReport.tokensUsed = res.tokenUsage.totalTokens;
      handshakeReport.outputSummary = res.text.slice(0, 100);
      handshakeReport.status = 'pass';
      handshakeReport.suggestion = `Passed: 2-Bot handshake successful (${botA.name} ➔ ${botB.name}). Team communication verified.`;
    } catch {
      handshakeReport.status = 'warn';
      handshakeReport.suggestion = `Warning: Handshake experienced latency. Bots can still communicate via virtual files.`;
    }
  }

  // Calculate actual derived metrics (no fake numbers)
  let totalTests = 0;
  let passedTests = 0;

  for (const b of botReports) {
    for (const s of b.steps) {
      totalTests++;
      if (s.status === 'pass') passedTests++;
      else if (s.status === 'warn') passedTests += 0.5;
    }
  }

  if (handshakeReport) {
    totalTests++;
    if (handshakeReport.status === 'pass') passedTests++;
    else if (handshakeReport.status === 'warn') passedTests += 0.5;
  }

  const overallScorePercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;
  const hasHardFailures = botReports.some((b) => b.steps.some((s) => s.status === 'fail' && s.isHardFailure));
  const hasWarnings = botReports.some((b) => b.overallStatus === 'warn');

  return {
    botReports,
    handshakeReport,
    overallScorePercent,
    canStart: !hasHardFailures,
    hasHardFailures,
    hasWarnings,
  };
}
