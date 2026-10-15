import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getAdapter } from '../adapters/registry';
import type { ChatMessage } from '../adapters/types';
import { lockManager } from '../services/lockManager';
import { useAuthStore } from '../stores/useAuthStore';
import { useBotStore } from '../stores/useBotStore';
import { useProjectStore } from '../stores/useProjectStore';
import { buildKnowledgeContextPrompt } from '../services/knowledgeService';

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
  const previousBotIdsRef = useRef<string[]>([]);

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

    // Detect mid-project newly assigned bots and log dynamic role delegation
    const currentBotIds = projectBots.map((b) => b.id);
    if (previousBotIdsRef.current.length > 0 && previousBotIdsRef.current.length < currentBotIds.length) {
      const addedBots = projectBots.filter((b) => !previousBotIdsRef.current.includes(b.id));
      const existingBots = projectBots.filter((b) => previousBotIdsRef.current.includes(b.id));

      for (const newBot of addedBots) {
        const delegator = existingBots[0];
        if (delegator) {
          logEvent(
            delegator.id,
            delegator.name,
            'system',
            `[Role Handover] ${delegator.name} delegated ${newBot.role.toUpperCase()} responsibilities to newly joined teammate ${newBot.name}.`
          );
        }
      }
    }
    previousBotIdsRef.current = currentBotIds;

    // Pick bot for this turn in round-robin order
    const botIndex = activeProject.currentTurn % projectBots.length;
    const currentBot = projectBots[botIndex];

    // Dynamic role coverage calculation
    const isSoleBot = projectBots.length === 1;
    const coveredRoles = new Set(projectBots.map((b) => b.role));
    const CORE_ROLES = ['leader', 'developer', 'tester', 'reviewer', 'designer'];
    const unassignedRoles = CORE_ROLES.filter((r) => !coveredRoles.has(r as any));

    let roleInstructions = '';
    if (isSoleBot) {
      roleInstructions = `You are the SOLE team member on this project. You must autonomously fulfill ALL roles:
- Leader: Break down goals into milestones, structure files.
- Developer: Write functional HTML, JS, CSS files to Memory Box using MEMORY_WRITE.
- Tester: Validate file contents, test logic, and fix edge cases.
- Reviewer: Code review and summary generation.`;
    } else if (botIndex === 0 && unassignedRoles.length > 0) {
      roleInstructions = `Your primary role is ${currentBot.role}. Since no specialist teammates cover [${unassignedRoles.join(', ')}], you also act as the default fallback fulfilling these roles when needed.`;
    } else {
      const teammateSummary = projectBots
        .filter((b) => b.id !== currentBot.id)
        .map((b) => `${b.name} (${b.role})`)
        .join(', ');
      roleInstructions = `Your role is ${currentBot.role}. Active teammates: ${teammateSummary}. Delegate other tasks and focus on your specialty.`;
    }

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
Personality: ${currentBot.personality}.
Role Guidance:
${roleInstructions}

STRICT PRODUCTION RULES:
1. ENGLISH ONLY: You MUST communicate ONLY in natural, fluent English. NEVER use Morse code, binary digits (0s and 1s), hexadecimal strings, or cryptic tokens.
2. CONCISE SUMMARY (MAX 150 TOKENS): Keep all conversational statements and summaries strictly under 150 tokens. State clearly what you did, what you need, or what you are asking.
3. CONVERSATIONAL COLLABORATION: When speaking to a teammate, always tag them with @TeammateName (e.g. "@ArchitectBot: I reviewed the files" or "@TesterBot: Ready for testing").
4. FILE ACCESS NEGOTIATION PROTOCOL:
   - If a file is locked by a teammate (see Locked files below) and you need to access it, do NOT give up. Ask them in English using format:
     [FILE_REQUEST: <filePath> -> @<TeammateName>] <Short English message requesting access>
   - If a teammate requested a file from you and your edits are complete, hand it over in English using format:
     [FILE_HANDOVER: <filePath> -> @<TeammateName>] <Short English handover message>
5. STATUS TAG: Always output a single status tag: [STATUS: working|thinking|blocked|needs_help|done|waiting].
6. MEMORY WRITE FORMAT (if modifying code or creating project files):
MEMORY_WRITE: <filePath>
<file content>
SUMMARY: <short 1-sentence English explanation of what you changed>${buildKnowledgeContextPrompt(activeProject.knowledgeBase)}`;

        const userPrompt = `Turn ${activeProject.currentTurn + 1} of ${activeProject.maxTurns}.
Memory Box Files:
${fileManifest || '(empty project)'}
Locked files: ${lockedList || 'None'}
Recent team dialogue:
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
          maxTokens: 500,
        });

        // Track tokens
        incrementTokens(
          currentBot.id,
          response.tokenUsage.totalTokens,
          response.tokenUsage.promptTokens,
          response.tokenUsage.completionTokens
        );
        setBotStatus(currentBot.id, response.statusTag);

        // Check for File Access Request: [FILE_REQUEST: filePath -> @Teammate] message
        const fileReqMatch = response.text.match(/\[FILE_REQUEST:\s*([^\s->]+)\s*->\s*@?([^\]]+)\]\s*([\s\S]*)/i);
        // Check for File Handover: [FILE_HANDOVER: filePath -> @Teammate] message
        const fileHandoverMatch = response.text.match(/\[FILE_HANDOVER:\s*([^\s->]+)\s*->\s*@?([^\]]+)\]\s*([\s\S]*)/i);

        if (fileReqMatch) {
          const reqFilePath = fileReqMatch[1].trim();
          const targetName = fileReqMatch[2].trim().toLowerCase();
          const reqMsg = fileReqMatch[3].replace(/\[STATUS:[^\]]+\]/gi, '').trim();

          const targetBot = projectBots.find(
            (b) => b.name.toLowerCase().includes(targetName) || b.role.toLowerCase() === targetName
          ) || projectBots.find((b) => b.id !== currentBot.id);

          if (targetBot) {
            useProjectStore.getState().setActiveFileNegotiation({
              requesterBotId: currentBot.id,
              requesterName: currentBot.name,
              holderBotId: targetBot.id,
              holderName: targetBot.name,
              filePath: reqFilePath,
              type: 'request',
              timestamp: Date.now(),
            });

            setTimeout(() => {
              useProjectStore.getState().setActiveFileNegotiation(null);
            }, 7500);

            await logEvent(
              currentBot.id,
              currentBot.name,
              'file_request',
              `@${targetBot.name}: ${reqMsg || `Could you please finish up and release ${reqFilePath}? Need it for next steps.`}`,
              reqFilePath,
              response.tokenUsage.totalTokens
            );
          }
        } else if (fileHandoverMatch) {
          const handoverFilePath = fileHandoverMatch[1].trim();
          const targetName = fileHandoverMatch[2].trim().toLowerCase();
          const handoverMsg = fileHandoverMatch[3].replace(/\[STATUS:[^\]]+\]/gi, '').trim();

          const targetBot = projectBots.find(
            (b) => b.name.toLowerCase().includes(targetName) || b.role.toLowerCase() === targetName
          ) || projectBots.find((b) => b.id !== currentBot.id);

          if (targetBot) {
            // Find file and reassign lock to target bot
            const targetFile = files.find((f) => f.path.toLowerCase() === handoverFilePath.toLowerCase());
            if (targetFile) {
              await useProjectStore.getState().assignFileToBot(targetFile.id, targetBot.id, targetBot.name);
            }

            useProjectStore.getState().setActiveFileNegotiation({
              requesterBotId: targetBot.id,
              requesterName: targetBot.name,
              holderBotId: currentBot.id,
              holderName: currentBot.name,
              filePath: handoverFilePath,
              type: 'handover',
              timestamp: Date.now(),
            });

            setTimeout(() => {
              useProjectStore.getState().setActiveFileNegotiation(null);
            }, 7500);

            await logEvent(
              currentBot.id,
              currentBot.name,
              'file_handover',
              `@${targetBot.name}: ${handoverMsg || `Finished updates to ${handoverFilePath}! Handing access over to you.`}`,
              handoverFilePath,
              response.tokenUsage.totalTokens
            );
          }
        }

        // Check if output includes MEMORY_WRITE
        const writeMatch = response.text.match(/MEMORY_WRITE:\s*([^\n\r]+)[\r\n]+([\s\S]*)/i);

        if (writeMatch) {
          const filePath = writeMatch[1].trim();
          let fileContent = writeMatch[2].trim();
          
          // Extract optional SUMMARY tag
          const summaryMatch = fileContent.match(/[\r\n]+SUMMARY:\s*([^\r\n]+)$/i);
          let autoSummary = `${currentBot.name} updated ${filePath}`;
          if (summaryMatch) {
            autoSummary = summaryMatch[1].trim();
            fileContent = fileContent.replace(/[\r\n]+SUMMARY:\s*([^\r\n]+)$/i, '').trim();
          }

          const existingFile = files.find(
            (f) => f.path.toLowerCase() === filePath.toLowerCase()
          );

          if (existingFile) {
            const success = await updateVirtualFileContent(
              existingFile.id,
              fileContent,
              currentBot.id,
              currentBot.name,
              autoSummary
            );
            if (success) {
              await logEvent(
                currentBot.id,
                currentBot.name,
                'file_edit',
                `${currentBot.name}: ${autoSummary}`,
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
        } else if (!fileReqMatch && !fileHandoverMatch) {
          // Normal chat or status message
          const cleanText = response.text.replace(/\[STATUS:[^\]]+\]/gi, '').trim();
          if (cleanText) {
            // Ensure 150 token constraint cap (~500 chars)
            const cappedText = cleanText.length > 500 ? cleanText.slice(0, 497) + '...' : cleanText;
            await logEvent(
              currentBot.id,
              currentBot.name,
              'chat_message',
              cappedText,
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
