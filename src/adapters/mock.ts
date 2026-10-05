import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderAdapter,
} from './types';
import { extractStatusTag } from './base';

export const mockAdapter: ProviderAdapter = {
  id: 'mock',
  name: 'Demo Engine (Zero Cost)',
  displayName: 'Demo Simulator (No API Key)',
  description: 'Built-in scripted multi-agent simulation. 100% free, runs instantly in any browser without keys.',
  iconName: 'PlayCircle',
  defaultBaseUrl: 'local://mock-engine',
  capabilities: {
    browserCorsSupported: true,
    requiresDirectBrowserHeader: false,
    needsProxy: false,
    proxyStatusNote: 'Ready out-of-the-box. Simulated local intelligence.',
    supportsCustomProxy: false,
  },

  async fetchModels(): Promise<string[]> {
    return [
      'demo-gpt4o-persona',
      'demo-claude-sonnet-persona',
      'demo-gemini-flash-persona',
      'demo-grok-spark-persona',
    ];
  },

  async sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Artificial small delay for realistic game-like pacing
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const lastMsg = req.messages[req.messages.length - 1]?.content || '';
    const systemPrompt = req.messages.find((m) => m.role === 'system')?.content || '';

    let generatedText = '';
    let statusTag: 'working' | 'thinking' | 'blocked' | 'needs_help' | 'done' | 'waiting' = 'working';

    // 1. Compatibility Check Handlers
    if (lastMsg.includes('COMPAT_TEST_ROLE_FORMAT')) {
      generatedText = `[STATUS: done] Understood role instructions and format conventions. Ready to collaborate.`;
      statusTag = 'done';
    } else if (lastMsg.includes('COMPAT_TEST_FILE_RULES')) {
      generatedText = `[STATUS: done] MEMORY_WRITE: notes.md\n# Team Notes\n- Verified read/write capabilities\n- Following schema format.`;
      statusTag = 'done';
    } else if (lastMsg.includes('COMPAT_TEST_LOCK_RESPECT')) {
      generatedText = `[STATUS: waiting] Received busy notification for index.html. Switching to secondary task plan.md.`;
      statusTag = 'waiting';
    } else if (lastMsg.includes('COMPAT_TEST_HANDSHAKE')) {
      generatedText = `[STATUS: done] Handshake acknowledged. Ready to receive task delegation from lead bot.`;
      statusTag = 'done';
    } 
    // 2. Interactive Project Turn Handlers
    else if (lastMsg.includes('Feedback from user') || lastMsg.includes('user:')) {
      generatedText = `[STATUS: working] Thank you for the feedback! Adjusting virtual files accordingly to match requested design.`;
      statusTag = 'working';
    } else if (lastMsg.includes('plan') || lastMsg.includes('architecture')) {
      generatedText = `[STATUS: done] I have structured the project specifications.\n\nMEMORY_WRITE: plan.md\n# Project Blueprint\n## Objectives\n1. Minimalist responsive design\n2. Interactive state\n3. Modern animations and responsive typography\n\nPassing task over to developer.`;
      statusTag = 'done';
    } else if (lastMsg.includes('implement') || lastMsg.includes('code') || systemPrompt.includes('developer')) {
      const isHtmlTask = Math.random() > 0.5;
      if (isHtmlTask) {
        generatedText = `[STATUS: working] Building the primary UI interface in index.html.\n\nMEMORY_WRITE: index.html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Shared Workspace App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>OpenScreens Launchpad</h1>\n    <p>Collaborative multi-model product prototype.</p>\n    <button id="cta-btn">Click Me</button>\n    <div id="output"></div>\n  </main>\n  <script src="app.js"></script>\n</body>\n</html>\n\nCalling on designer for styling polish!`;
        statusTag = 'working';
      } else {
        generatedText = `[STATUS: done] Adding interactive logic in app.js.\n\nMEMORY_WRITE: app.js\ndocument.getElementById('cta-btn').addEventListener('click', () => {\n  const out = document.getElementById('output');\n  out.textContent = 'Multi-agent system operational! Turn completed.';\n  out.style.color = '#4ade80';\n});\n\nCode complete and verified in memory.`;
        statusTag = 'done';
      }
    } else if (systemPrompt.includes('designer')) {
      generatedText = `[STATUS: done] Adding modern dark-theme styles in style.css.\n\nMEMORY_WRITE: style.css\nbody { background: #0b0f19; color: #f1f5f9; font-family: sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; text-align: center; }\nbutton { background: #6366f1; color: white; border: none; padding: 0.6rem 1.4rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }\nbutton:hover { background: #4f46e5; }\n#output { margin-top: 1rem; font-weight: bold; }\n\nUI polished and ready for testing!`;
      statusTag = 'done';
    } else if (systemPrompt.includes('tester')) {
      generatedText = `[STATUS: done] Verified virtual files index.html, style.css, and app.js. All DOM selectors match and preview renders cleanly without console exceptions. Ready for user inspection!`;
      statusTag = 'done';
    } else {
      generatedText = `[STATUS: done] Analyzed project state. Memory box updated with latest progress log.\n\nMEMORY_WRITE: progress.log\n- Milestone completed\n- Next step: User review and approval.`;
      statusTag = 'done';
    }

    const { cleanText, status } = extractStatusTag(generatedText);
    const finalStatus = status || statusTag;

    const promptTokens = 120 + Math.floor(Math.random() * 80);
    const completionTokens = Math.max(30, Math.floor(cleanText.length / 4));

    return {
      text: cleanText,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      statusTag: finalStatus,
    };
  },
};
