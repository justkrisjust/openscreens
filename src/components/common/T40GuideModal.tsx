import React, { useState } from 'react';
import {
  Sparkles,
  X,
  HelpCircle,
  Cpu,
  Layers,
  MessageSquare,
  Box,
  Flame,
  CheckCircle2,
  ChevronRight,
  Send,
} from 'lucide-react';
import { BotFace } from '../office/BotFace';

interface T40GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  answer: string;
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'turns',
    title: 'What are "Turns" and why 15/15?',
    icon: <Flame className="w-4 h-4 text-amber-500" />,
    answer:
      'A "Turn" is one round of work by a single bot. In Turn 1, Bot A reads a file, writes code, or reviews, and reports back. Then Bot B takes Turn 2. The turn cap (e.g. 15) is a safety circuit breaker: it prevents bots from talking in infinite loops and draining your token budget while you step away. When turns reach 15/15, the project pauses so you can review their progress, click "+10 Turns" or "Resume" whenever you are ready for the next sprint.',
  },
  {
    id: 'ollama',
    title: 'How do I connect Local AI (Ollama / DeepSeek)?',
    icon: <Cpu className="w-4 h-4 text-emerald-500" />,
    answer:
      'OpenScreens connects directly to your local PC without sending data anywhere! 1) Run Ollama on your PC (e.g. `ollama run deepseek-r1:8b` or `ollama run qwen2.5-coder`). 2) Ensure CORS is permitted by starting Ollama with `OLLAMA_ORIGINS="*"`. 3) In OpenScreens, go to API Keys Vault, select Local AI (Ollama), default endpoint is `http://localhost:11434/v1`. 4) No API key is needed and cost is completely free ($0.00)!',
  },
  {
    id: 'colony',
    title: 'How does the "Colony: 3 Streets" layout work?',
    icon: <Layers className="w-4 h-4 text-blue-500" />,
    answer:
      'Instead of cramming everything into one tight screen, the Colony is split into 3 spacious streets: \n• Street 1 (Work Cabins): Individual office cabins for assigned bots. Bob the Builder constructs cabins on the spot, and Rex the Destroyer demolishes them when work is done.\n• Street 2 (Memory Vault & Live App): Central file vault and full-size live app monitor.\n• Street 3 (Recreation Campus): 5 fun spots (Coffee, Arcade, TV, Water Cooler, Library) where untasked bots chill.',
  },
  {
    id: 'assignment',
    title: 'How do File Assignments & Auto-Summaries work?',
    icon: <Box className="w-4 h-4 text-purple-500" />,
    answer:
      'Open the Memory Box in Street 2 or on the workspace. Click the "Assigned:" dropdown on any file to assign it to Bot A, reassign it to Bot B, or release it. When a bot finishes modifying a file, it automatically writes a concise 1-sentence SUMMARY of what it changed so you and the other bots know what was accomplished.',
  },
  {
    id: 'chat',
    title: 'How does the Director Chat work?',
    icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    answer:
      'You are the Director and final approver! Click the "[💬 Chat]" button in the top bar to open the slide-out Director Chat Drawer. You can broadcast directives to all bots or message a specific bot, click quick approval pills ("Approve", "Polish Design", "Request Test"), or guide the team with feedback. Sending a directive wakes up idle bots and sets them back to work.',
  },
];

export const T40GuideModal: React.FC<T40GuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<GuideTopic>(GUIDE_TOPICS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAskCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    const q = customQuestion.toLowerCase();
    if (q.includes('turn') || q.includes('stop') || q.includes('resume')) {
      setCustomAnswer(GUIDE_TOPICS[0].answer);
    } else if (q.includes('ollama') || q.includes('local') || q.includes('deepseek')) {
      setCustomAnswer(GUIDE_TOPICS[1].answer);
    } else if (q.includes('street') || q.includes('colony') || q.includes('cabin')) {
      setCustomAnswer(GUIDE_TOPICS[2].answer);
    } else if (q.includes('file') || q.includes('assign') || q.includes('memory') || q.includes('summary')) {
      setCustomAnswer(GUIDE_TOPICS[3].answer);
    } else if (q.includes('chat') || q.includes('directive') || q.includes('approv')) {
      setCustomAnswer(GUIDE_TOPICS[4].answer);
    } else {
      setCustomAnswer(
        `Great question! In OpenScreens, you coordinate autonomous bots around a shared Memory Box in the 3-Street Colony. You can configure models in the Bots tab, connect local Ollama models in the Key Vault, and guide their work anytime through the Director Chat drawer!`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <BotFace
                shape="star"
                color="#10b981"
                status="working"
                emote="stars"
                size={34}
                showEmoteBadge={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-main)] font-heading">
                  T-40 (Colony Guide & Companion)
                </h2>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  OUT OF THE BOX
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Here to explain OpenScreens, Turns, Local AI, and Colony navigation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Quick FAQ Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono mb-2">
              Select a Topic to Learn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GUIDE_TOPICS.map((topic) => {
                const isSelected = selectedTopic.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomAnswer(null);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-[var(--text-main)] font-bold shadow-sm'
                        : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="shrink-0">{topic.icon}</div>
                    <span className="text-xs truncate flex-1">{topic.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-500' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-[var(--text-main)] font-heading">
                {customAnswer ? 'T-40 Answers Your Question' : selectedTopic.title}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line font-sans">
              {customAnswer || selectedTopic.answer}
            </p>
          </div>

          {/* Custom Question Input */}
          <form onSubmit={handleAskCustom} className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-main)] font-mono">
              Have another question? Ask T-40 directly:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. How does Bob build cabins? Can I use DeepSeek offline?..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl px-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            T-40 is built directly into OpenScreens • 100% Client-Side
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold rounded-xl transition-colors text-xs"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
