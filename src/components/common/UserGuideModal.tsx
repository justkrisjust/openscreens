import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  Flame,
  Box,
  MessageSquare,
  Users,
  Hammer,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Zap,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export interface UserGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  category: 'workflow' | 'architecture' | 'local_ai' | 'faq';
  icon: React.ReactNode;
  summary: string;
  steps?: { title: string; desc: string }[];
  details: string[];
  codeSnippet?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'core-workflow',
    title: 'The 5-Step Production Workflow',
    category: 'workflow',
    icon: <Zap className="w-4 h-4 text-sky-400" />,
    summary: 'From concept to finished software in five autonomous, collaborative steps.',
    steps: [
      {
        title: '1. Create Bots & Assign Roles',
        desc: 'Go to Bots tab. Create custom bots with specialized roles (Leader, Developer, Tester, Designer, Reviewer). Select custom avatar shapes, color tints, and pick any model (Local Ollama, Gemini, Claude, OpenAI, etc.).',
      },
      {
        title: '2. Create Project & Knowledge Base',
        desc: 'Go to Projects tab. Name your project, write a clear goal prompt, and upload reference files, specifications, or link a local folder into the Knowledge Base so bots know your exact requirements.',
      },
      {
        title: '3. Run Compatibility & Deep Reasoning Check',
        desc: 'Click Compatibility tab. Select the candidate bots you want to test with the "+" button. The suite verifies persona formatting, memory syntax, lock adherence, and evaluates deep reasoning capped at 1,000 tokens.',
      },
      {
        title: '4. Assign Bots & Dynamic Role Fallback',
        desc: 'Assign bots to your project. If only one bot is assigned, it automatically fulfills ALL roles (planning, coding, testing). If you add a tester mid-sprint, the first bot immediately hands off testing responsibilities to the new specialist.',
      },
      {
        title: '5. Autonomous Sprints & Auto-Summaries',
        desc: 'Bots construct their cabins, read the Knowledge Base, acquire non-colliding file locks, implement code in the Memory Box, and automatically generate a 1-sentence summary on every change.',
      },
    ],
    details: [
      'Every bot turn respects token budgets and updates project files in real time.',
      'You can inspect and download virtual files or view the sandboxed live web preview anytime.',
    ],
  },
  {
    id: 'dynamic-roles',
    title: 'Dynamic Role Fallback & Responsibility Handover',
    category: 'workflow',
    icon: <Users className="w-4 h-4 text-indigo-400" />,
    summary: 'Smart adaptability: single-bot projects adapt to do everything; multi-bot teams specialize dynamically.',
    details: [
      '• Single-Bot Fallback: If you create a project requiring Leader, Dev, and Tester, but only assign 1 bot, that bot becomes the primary worker. It cycles through architectural planning, code authoring, and verification autonomously.',
      '• Mid-Sprint Dynamic Handover: If you edit the project and add a specialized bot (e.g. a Tester or Reviewer) while a sprint is running, the original bot detects the new arrival and automatically delegates that role to the new bot.',
      '• Audit Log Event: A role handover event is recorded in the Event Feed, e.g. "[Role Handover] Larry delegated [Tester] responsibilities to Ada".',
      '• Zero Deadlocks: Teammates never step on each other because the Lock Manager guarantees only one bot can write to a file at any given moment.',
    ],
  },
  {
    id: 'compatibility-test',
    title: 'Compatibility & Deep Reasoning Suite',
    category: 'workflow',
    icon: <ShieldCheck className="w-4 h-4 text-sky-400" />,
    summary: 'Rigorous multi-stage pre-flight checks testing models before you burn project tokens.',
    details: [
      '• Stage 1 (Role & Format Following): Verifies the model can output exact [STATUS: working|waiting] tags and speak in its assigned persona.',
      '• Stage 2 (Shared Memory File Syntax): Verifies the model correctly formats output files using the strict "MEMORY_WRITE: <path>" contract.',
      '• Stage 3 (File Lock Respect): Verifies the model does not poll or fight when told a file is currently busy/locked by a teammate.',
      '• Stage 4 (Deep Reasoning & Planning): Issues an architectural scenario requiring multi-step logic, edge case analysis, and task breakdown. Strictly capped at 1,000 tokens maximum per bot.',
      '• 2-Bot Handshake: When 2+ bots are selected, tests real-time coordination and handoff between teammates.',
    ],
  },
  {
    id: 'turns-explained',
    title: 'What are "Turns" and Why 15/15?',
    category: 'architecture',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    summary: 'A turn is a discrete unit of bot work. The turn limit is your financial & safety circuit breaker.',
    details: [
      '• Discrete Action Cycle: In Turn 1, Bot A reads a file, writes code, or reviews, and reports back. In Turn 2, Bot B inspects what was done and writes the next component.',
      '• Token Spend Circuit Breaker: Without a turn limit, runaway bot conversations could loop infinitely in the background and deplete your token budget while you step away.',
      '• Safe Milestones: When the project reaches 15/15 turns, it pauses automatically. You can review the code in Memory Box, test the live preview, and click "+10 Turns" or "Resume" whenever you are ready for the next sprint.',
      '• Customizable: You can adjust the maximum turn limit in the Project Editor to whatever length you prefer (e.g. 5, 15, 30, or 50 turns).',
    ],
  },
  {
    id: 'colony-streets',
    title: 'Colony Campus Layout: 3 Streets & Crew',
    category: 'architecture',
    icon: <Layers className="w-4 h-4 text-blue-400" />,
    summary: 'A spacious campus with real-time transit lines and animated construction crew.',
    details: [
      '• Street 1 (Work Cabins): When a bot is assigned to an active project, Bob the Builder marches from his workshop to erect a dedicated office cabin. When work is finished, Rex the Destroyer dismantles the cabin.',
      '• Street 2 (Memory Vault & Live App): Central repository holding virtual files, project knowledge, and the full-screen live application monitor.',
      '• Street 3 (Recreation Campus): 5 distinct chill spots (Coffee Bar, Retro Arcade, GPU Spa, DJ Lounge, TV Lounge). Free bots wander between spots along continuous transit lines without jumping.',
      '• Real-Time Location Tracking: Bots travel in true real time from A to B, B to C, and C to A, following campus roads seamlessly.',
    ],
  },
  {
    id: 'memory-box',
    title: 'Memory Box, File Locks & Auto-Summaries',
    category: 'workflow',
    icon: <Box className="w-4 h-4 text-purple-400" />,
    summary: 'Shared virtual file system with zero-dependency browser execution.',
    details: [
      '• File Assignments: Assign files to specific bots, reassign them, or release them back to the shared pool.',
      '• 1-Sentence Auto-Summaries: When a bot edits a file, it concludes with a concise "SUMMARY: <what changed>" line, automatically visible in the Memory Box.',
      '• Mutual Exclusion Locks: Locks expire automatically if abandoned, preventing frozen files.',
      '• Export: Download individual files or the entire project with a single click.',
    ],
  },
  {
    id: 'local-ollama',
    title: 'Connecting Local AI (Ollama / DeepSeek-R1 / LM Studio)',
    category: 'local_ai',
    icon: <Cpu className="w-4 h-4 text-sky-400" />,
    summary: 'Run 100% private, local models on your own GPU with zero API charges ($0.00).',
    codeSnippet: '# 1. Allow browser direct connection (CORS)\nset OLLAMA_ORIGINS="*"\nollama serve\n\n# 2. Run your preferred model in another terminal\nollama run deepseek-r1:8b\n# or\nollama run qwen2.5-coder:7b',
    details: [
      '1. Start Ollama with CORS enabled by setting `OLLAMA_ORIGINS="*"` before starting the server.',
      '2. In OpenScreens, go to API Keys Vault, select "Local AI (Ollama)". The default endpoint is http://localhost:11434/v1.',
      '3. In Bot Setup, the model dropdown will automatically fetch all models installed on your machine! You can also type any custom model name.',
      '4. LM Studio & LocalAI: Also supported out-of-the-box at http://localhost:1234/v1.',
    ],
  },
  {
    id: 'director-chat',
    title: 'Director Chat & Live Steering',
    category: 'workflow',
    icon: <MessageSquare className="w-4 h-4 text-sky-400" />,
    summary: 'You are the colony director. Steer bots, broadcast instructions, and give instant feedback.',
    details: [
      '• Chat Drawer: Open the Director Chat drawer from the top bar or office screen.',
      '• Quick Directives: Click pre-formatted pills like "Approve Milestone", "Polish Design", or "Add Edge Case Tests".',
      '• Wake-Up Trigger: Sending a directive immediately wakes idle bots and focuses their next turn on your request.',
    ],
  },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { isGuideModalOpen, closeGuideModal } = useUIStore();
  const isOpen = propIsOpen !== undefined ? propIsOpen : isGuideModalOpen;
  const onClose = propOnClose || closeGuideModal;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>('core-workflow');

  // Handle ESC key press and scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSections = GUIDE_SECTIONS.filter((section) => {
    const matchesCategory =
      selectedCategory === 'all' || section.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeSection =
    GUIDE_SECTIONS.find((s) => s.id === activeSectionId) || filteredSections[0] || GUIDE_SECTIONS[0];

  const modalElement = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="OpenScreens Production Guide and Documentation"
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[var(--text-main)] font-heading">
                  OpenScreens Production Guide & Documentation
                </h2>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  Step-by-Step
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Everything you need to orchestrate autonomous multi-model AI colonies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search guide (turns, ollama, roles...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs rounded-xl pl-9 pr-3 py-2 text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'workflow', label: 'Workflow' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'local_ai', label: 'Local AI (Ollama)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Left Index Sidebar + Right Detail View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Topic List */}
          <div className="w-full md:w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]/50 overflow-y-auto p-3 space-y-1.5 max-h-48 md:max-h-none">
            {filteredSections.map((sec) => {
              const isSelected = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-sky-500/15 text-[var(--text-main)] border border-sky-500/40 shadow-sm'
                      : 'hover:bg-[var(--bg-panel)] text-[var(--text-muted)] border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{sec.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-main)]'}`}>
                      {sec.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {sec.summary}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Reading Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-card)] space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase">
                  {activeSection.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight font-heading">
                {activeSection.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {activeSection.summary}
              </p>
            </div>

            {/* Stepped Workflow If present */}
            {activeSection.steps && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold">
                  Step-by-Step Instructions:
                </h4>
                <div className="space-y-2.5">
                  {activeSection.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl flex items-start gap-3 hover:border-sky-500/30 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-sky-500/20">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-main)]">
                          {st.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Snippet */}
            {activeSection.codeSnippet && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                  <Terminal className="w-3.5 h-3.5 text-sky-500" />
                  <span>Terminal Setup Commands</span>
                </div>
                <pre className="p-3.5 bg-black/90 text-sky-400 font-mono text-xs rounded-2xl overflow-x-auto border border-sky-500/20 leading-relaxed shadow-inner">
                  {activeSection.codeSnippet}
                </pre>
              </div>
            )}

            {/* Key Principles & Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Key Mechanics & Best Practices:
              </h4>
              <div className="space-y-2">
                {activeSection.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[var(--bg-panel)]/60 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-main)] leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            OpenScreens Client-Side Architecture • 100% In-Browser Privacy
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            Got It, Back to Office
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
};
