import type { BotGesture } from '../services/storage';

const VALID_GESTURES: BotGesture[] = ['working', 'thinking', 'blocked', 'needs_help', 'done', 'waiting'];

/**
 * Extracts [STATUS: <tag>] or status tag from the model response text,
 * returning the detected gesture and cleaned output without wasting tokens on acting.
 */
export function extractStatusTag(rawText: string): { cleanText: string; status: BotGesture } {
  if (!rawText) {
    return { cleanText: '', status: 'done' };
  }

  // Regex matches [STATUS: <tag>] or [status: <tag>] or STATUS: <tag> at beginning or end
  const statusRegex = /\[?(?:STATUS|status):\s*([a-zA-Z_]+)\]?/i;
  const match = rawText.match(statusRegex);

  let detectedStatus: BotGesture = 'working';

  if (match) {
    const candidate = match[1].toLowerCase().replace('-', '_') as BotGesture;
    if (VALID_GESTURES.includes(candidate)) {
      detectedStatus = candidate;
    }
  } else {
    // Heuristic fallbacks if model forgot tag
    if (/finished|completed|all done/i.test(rawText)) {
      detectedStatus = 'done';
    } else if (/help|stuck|cannot|error/i.test(rawText)) {
      detectedStatus = 'needs_help';
    } else if (/waiting|awaiting approval/i.test(rawText)) {
      detectedStatus = 'waiting';
    }
  }

  // Clean the status line so markdown viewer displays clean content
  const cleanText = rawText.replace(statusRegex, '').trim();

  return { cleanText, status: detectedStatus };
}

/**
 * Fallback token estimation for adapters that don't return precise token usage in browser
 */
export function estimateTokens(promptText: string, completionText: string) {
  const promptTokens = Math.max(1, Math.ceil(promptText.length / 4));
  const completionTokens = Math.max(1, Math.ceil(completionText.length / 4));
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
