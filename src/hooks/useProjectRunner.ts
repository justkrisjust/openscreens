import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getAdapter } from '../adapters/registry';
import type { ChatMessage } from '../adapters/types';
import { lockManager } from '../services/lockManager';
import { useAuthStore } from '../stores/useAuthStore';
import { useBotStore } from '../stores/useBotStore';
import { useProjectStore } from '../stores/useProjectStore';

export function useProjectRunner() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const files = useProjectStore((s) => s.files);
  const events = useProjectStore((s) => s.events);
  const pausedBotIds = useProjectStore((s) => s.pausedBotIds);
  const isExecutingTurn = useProjectStore((s) => s.isExecutingTurn);

  const {
    incrementTurn,
    logEvent,
    setIsExecutingTurn,
    updateVirtualFileContent,
    createVirtualFile,
    refreshLocks,
    stopProjectExecution,
  } = useProjectStore();

  const { bots, setBotStatus, incrementTokens } = useBotStore();
  const { getKey, getProxyUrl } = useAuthStore();

  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeProject || activeProject.status !== 'running' || isExecutingTurn) {
      return;
    }

    // Check if max turns reached
    if (activeProject.currentTurn >= activeProject.maxTurns) {
      stopProjectExecution();
      logEvent('system', 'System', 'system', `Project completed milestone at turn limit (${activeProject.maxTurns}).`);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      return;
    }

    // Find available bots in project
    const projectBots = bots.filter(
      (b) => activeProject.botIds.includes(b.id) && !pausedBotIds.has(b.id)
    );

    if (projectBots.length === 0) {
      return;
    }

    // Pick bot for this turn in round-robin order
    const botIndex = activeProject.currentTurn % projectBots.length;
    const currentBot = projectBots[botIndex];

    // Check per-bot token cap
    if (currentBot.tokenUsage >= currentBot.tokenCap) {
      setBotStatus(currentBot.id, 'blocked');
      logEvent(
        currentBot.id,
        currentBot.name,
        'gesture',
        `Token cap reached (${currentBot.tokenUsage}/${currentBot.tokenCap}). Bot paused.`
      );
      incrementTurn();
      return;
    }

    // Schedule turn execution with short pacing
    turnTimerRef.current = setTimeout(async () => {
      setIsExecutingTurn(true);
      setBotStatus(currentBot.id, 'working');

      try {
        const adapter = getAdapter(currentBot.provider);
        const apiKey = getKey(currentBot.provider) || '';
        const proxyUrl = getProxyUrl(currentBot.provider);

        // Compact list of files in memory (paths only to conserve tokens)
        const fileManifest = files.map((f) => `- ${f.path} (${f.content.length} chars)`).join('\n');
        const recentEvents = events
          .slice(-4)
          .map((e) => `[${e.botName}]: ${e.summary}`)
          .join('\n');

        const activeLocksMap = lockManager.getProjectLocks(activeProject.id);
        const lockedList = Object.entries(activeLocksMap)
          .map(([p, info]) => `${p} (locked by ${info.botName})`)
          .join(', ');

        const systemPrompt = `You are ${currentBot.name}, a bot working on team goal: "${activeProject.goal}".
Role: ${currentBot.role}.
Personality: ${currentBot.personality}.
Rules for token efficiency:
1. Always output a single status tag: [STATUS: working|thinking|blocked|needs_help|done|waiting].
2. Keep team chat messages under 2 sentences.
3. If writing a virtual project file, format as:
MEMORY_WRITE: <filePath>
<file content>
4. If a file is locked, NEVER fight it or poll. Choose another file or task.`;

        const userPrompt = `Turn ${activeProject.currentTurn + 1} of ${activeProject.maxTurns}.
Memory Box Files:
${fileManifest || '(empty project)'}
Locked files: ${lockedList || 'None'}
Recent events:
${recentEvents || 'No recent events'}

What is your next action or message to the team?`;

        const messages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

        const response = await adapter.sendMessage({
          model: currentBot.model,
          messages,
          apiKey,
          customProxyUrl: proxyUrl,
          maxTokens: 600,
        });

        // Track tokens
        incrementTokens(currentBot.id, response.tokenUsage.totalTokens);
        setBotStatus(currentBot.id, response.statusTag);

        // Check if output includes MEMORY_WRITE
        const writeMatch = response.text.match(/MEMORY_WRITE:\s*([^\n\r]+)[\r\n]+([\s\S]*)/i);

        if (writeMatch) {
          const filePath = writeMatch[1].trim();
          const fileContent = writeMatch[2].trim();

          const existingFile = files.find(
            (f) => f.path.toLowerCase() === filePath.toLowerCase()
          );

          if (existingFile) {
            const success = await updateVirtualFileContent(
              existingFile.id,
              fileContent,
              currentBot.id,
              currentBot.name
            );
            if (success) {
              await logEvent(
                currentBot.id,
                currentBot.name,
                'file_edit',
                `${currentBot.name} updated ${filePath}`,
                filePath,
                response.tokenUsage.totalTokens
              );
            }
          } else {
            // New file creation
            await createVirtualFile(filePath, fileContent);
            await logEvent(
              currentBot.id,
              currentBot.name,
              'file_edit',
              `${currentBot.name} created ${filePath}`,
              filePath,
              response.tokenUsage.totalTokens
            );
          }
        } else {
          // Normal chat or status message
          const cleanText = response.text.replace(/\[STATUS:[^\]]+\]/gi, '').trim();
          if (cleanText) {
            await logEvent(
              currentBot.id,
              currentBot.name,
              'chat_message',
              cleanText.slice(0, 160),
              undefined,
              response.tokenUsage.totalTokens
            );
          }
        }

        refreshLocks();
        incrementTurn();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setBotStatus(currentBot.id, 'blocked');
        await logEvent(
          currentBot.id,
          currentBot.name,
          'gesture',
          `Error: ${errorMsg.slice(0, 120)}`
        );
        incrementTurn();
      } finally {
        setIsExecutingTurn(false);
      }
    }, 2200);

    return () => {
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
    };
  }, [
    activeProject?.status,
    activeProject?.currentTurn,
    activeProject?.id,
    isExecutingTurn,
    pausedBotIds,
  ]);
}
