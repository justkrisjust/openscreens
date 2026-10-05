# OpenScreens — Architecture & Implementation Plan

> **Product**: OpenScreens  
> **Vision**: Bring multiple AI models (Claude, Gemini, OpenAI, xAI, Mistral) into a single virtual game-like collaborative workspace where named bots with distinct personas, roles, and models work together on a shared project goal. The user is the final director and approver.  
> **Platform**: React 19 + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand + IndexedDB. 100% Client-side static application.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OpenScreens UI Layer                            │
│  ┌───────────────┐ ┌──────────────────────┐ ┌────────────────────────┐ │
│  │ Bot Workspace │ │ Shared "Memory Box"  │ │ User Chat & Director   │ │
│  │ (Left/Right)  │ │ (Virtual File Tree)  │ │ (Direct or Broadcast)  │ │
│  └───────┬───────┘ └──────────┬───────────┘ └───────────┬────────────┘ │
└──────────┼────────────────────┼─────────────────────────┼──────────────┘
           │                    │                         │
┌──────────▼────────────────────▼─────────────────────────▼──────────────┐
│                    OpenScreens Core Engine (Zustand)                   │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   Turn-Taking Engine  │  │        Virtual File Lock Manager       │ │
│  │ (Token Caps, Events)  │  │  (App-managed locks, no bot polling)   │ │
│  └───────────┬───────────┘  └───────────────────┬────────────────────┘ │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
┌──────────────▼──────────────────────────────────▼──────────────────────┐
│                  Unified Provider Adapter Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ │
│  │  Anthropic   │ │  Google      │ │   OpenAI     │ │ xAI / Mistral  │ │
│  │ (Direct CORS)│ │  (Direct)    │ │(Direct/Proxy)│ │(Flagged Proxy) │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───────┬────────┘ │
│         └────────────────┼────────────────┼─────────────────┘          │
│                          │  Mock Adapter  │ (Demo Mode - zero keys)    │
└──────────────────────────┼────────────────┴────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────────┐
│                 Client Security & Storage Layer                        │
│  - WebCrypto AES-GCM + PBKDF2 encryption for saved keys                │
│  - Session-only in-memory storage toggle                              │
│  - IndexedDB (via idb) for projects, virtual files, chat logs          │
│  - Sandboxed Preview iframe (`sandbox="allow-scripts"`)               │
│  - DOMPurify sanitized markdown output                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & File Structure

```
openscreens/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── public/
│   ├── favicon.svg             # OpenScreens minimal icon
│   └── sandboxed-runner.html   # Sandboxed project preview runner
├── src/
│   ├── adapters/               # Unified AI Provider Adapters
│   │   ├── types.ts            # Provider, Model, Message, Adapter interface
│   │   ├── base.ts             # Base adapter helpers
│   │   ├── anthropic.ts        # Claude direct browser API adapter
│   │   ├── gemini.ts           # Google Gemini direct REST adapter
│   │   ├── openai.ts           # OpenAI direct / proxy adapter
│   │   ├── xai.ts              # xAI adapter (flagged: needs proxy)
│   │   ├── mistral.ts          # Mistral adapter (flagged: needs proxy)
│   │   ├── mock.ts             # Scripted realistic Demo Mode adapter
│   │   └── registry.ts         # Adapter lookup & capability queries
│   ├── components/             # Modular UI Components
│   │   ├── common/             # Buttons, Badges, Modals, Tooltips, Toasts
│   │   ├── security/           # KeyVaultModal, SecurityNotice, WipeDataButton
│   │   ├── bots/               # BotCard, BotAvatar, GestureIcon, StatusPill
│   │   ├── memory/             # MemoryBox, FileTree, FileEditor, LockBadge
│   │   ├── office/             # OfficeCanvas, BotWorkArea, SpeechBubble, EventFeed
│   │   ├── chat/               # DirectorChatInput, TargetSelector
│   │   ├── preview/            # LivePreviewModal, ZipExporter
│   │   └── compatibility/      # CompatibilityCheckModal, TestStepRow
│   ├── hooks/                  # React custom hooks
│   │   ├── useTheme.ts         # Dark/light mode theme toggle
│   │   └── useProjectRunner.ts # Game loop & step execution hook
│   ├── services/               # Core Services
│   │   ├── crypto.ts           # WebCrypto AES-GCM + PBKDF2 encryption
│   │   ├── storage.ts          # IndexedDB schema & CRUD operations
│   │   ├── lockManager.ts      # Virtual File Lock Manager (atomic locks)
│   │   ├── compatibility.ts    # 4-stage bot compatibility test suite
│   │   └── demoData.ts         # Demo mode scripts, projects, and bots
│   ├── stores/                 # Zustand Global State
│   │   ├── useAuthStore.ts     # Encrypted keys, session keys, lock status
│   │   ├── useBotStore.ts      # Bot definitions, personas, token usage
│   │   ├── useProjectStore.ts  # Active project, file tree, locks, event log
│   │   └── useUIStore.ts       # Active view, modals, settings, theme
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (colors, radii, spacing, fonts)
│   │   └── index.css           # Tailwind configuration & global styles
│   ├── tests/                  # Automated Vitest unit & integration tests
│   │   ├── lockManager.test.ts # Lock acquisition, release, conflict avoidance
│   │   ├── adapters.test.ts    # Adapter contracts, model fetching, error handling
│   │   ├── compatibility.test.ts # Pass/fail evaluation & suggestions
│   │   └── crypto.test.ts      # AES-GCM encryption/decryption roundtrips
│   ├── App.tsx                 # Main application view switcher
│   ├── main.tsx                # React root entry
│   └── vite-env.d.ts
├── index.html                  # HTML entry with strict CSP meta tag
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite configuration with base path support
└── README.md                   # Setup guide, security model, provider guide
```

---

## 3. Milestones & Execution Plan

### Milestone 1: Foundation & Security Setup
- Setup design tokens (CSS variables) with clean dark/light mode palettes.
- Implement `crypto.ts` (WebCrypto AES-GCM + PBKDF2) with passphrase unlock and memory-only session mode.
- Implement IndexedDB storage (`storage.ts`) using `idb`.
- Configure strict Content Security Policy (`index.html`) with trusted domains:
  - `https://api.anthropic.com`
  - `https://generativelanguage.googleapis.com`
  - `https://api.openai.com`
  - `https://api.x.ai`
  - `https://api.mistral.ai`
- Create `.gitignore` and security pre-commit check script.

### Milestone 2: Provider Adapter Interface & Demo Engine
- Define unified `ProviderAdapter` interface:
  - `fetchModels(apiKey: string): Promise<string[]>`
  - `sendMessage(req: ChatRequest): Promise<ChatResponse>`
  - `checkCapabilities(): ProviderCapabilities` (CORS browser support vs needs proxy)
- Implement Google Gemini adapter (direct browser CORS).
- Implement Anthropic Claude adapter (`anthropic-dangerous-direct-browser-access: true`).
- Implement OpenAI adapter (direct or user proxy).
- Implement xAI & Mistral adapters (flagged as "needs proxy (coming soon)").
- Implement realistic, interactive `MockAdapter` for Demo Mode (zero cost, zero keys, simulated latency, rich markdown outputs).

### Milestone 3: App-Managed File Lock Manager & Memory Box
- Implement `LockManager`:
  - Atomic acquire/release of virtual file paths.
  - Non-polling conflict resolution: If Bot B requests `plan.md` while Bot A has lock, Bot B immediately receives a clean `status: 'busy'` signal with the option to pick another file or wait.
- Virtual Memory Box:
  - Virtual file tree in IndexedDB.
  - Markdown viewer & editor with syntax highlighting and sanitized previews.

### Milestone 4: Bot Setup, Compatibility Test & Turn Loop
- Bot setup interface:
  - Add API key, give bot a name, select provider & live model, assign role, write 1-2 line personality.
  - Max 12 bots per project. Suggest mixing providers.
- 4-Stage Compatibility Check Suite:
  1. Role adherence & structured message format.
  2. Memory box read/write verification.
  3. File lock respect ("file locked, choose alternative").
  4. 2-Bot handshake (Bot A writes note, Bot B responds).
  - Accurate derived pass/fail metrics with plain-language suggestions.
- Turn-Taking Office Canvas:
  - Visual layout: Bot A (left), Bot B (right), Memory Box (center), expandable for 2-4 bots.
  - Live token counters, meters, and caps per bot.
  - Gesture animations (working, thinking, blocked, needs_help, done, waiting).
  - Floating speech bubbles and compact event log ("Larry edited index.html").
  - User direct message vs broadcast chat.

### Milestone 5: Output Sandbox & Export
- Sandboxed `<iframe>` live preview for HTML/JS/CSS generated by bots.
- ZIP export (`jszip`) for one-click downloading of all virtual project files.
- Locked "coming soon" tabs for Deploy and Skills/Artifacts Store.
- One-click "Wipe All Data" button for complete local storage & IndexedDB purge.

### Milestone 6: Automated Testing, Security Review & Deployment
- Write Vitest tests:
  - `lockManager.test.ts`
  - `adapters.test.ts`
  - `compatibility.test.ts`
  - `crypto.test.ts`
- Run test suite and verify 100% pass.
- Reviewer checks: CSP, XSS sanitization (DOMPurify), secret leakage audit, accessibility pass.
- Deploy to GitHub Pages (or Vercel) and verify live public URL.

---

## 4. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Browser CORS blocking provider APIs | Directly support Anthropic (with official header) and Gemini (native CORS). Clearly flag xAI, Mistral, and OpenAI in UI with "needs proxy (coming soon)" and allow custom proxy URLs without breaking. Provide zero-key instant Demo Mode. |
| Accidental key leakage in git repo | WebCrypto encryption in browser only; strict `.gitignore`; automated pre-commit secret detection script; no analytics/logging. |
| Bot looping & runaway token consumption | Strict per-bot token cap, maximum turn limits, global stop button, and non-polling file locks. |
| XSS from bot-generated code or markdown | Mandatory DOMPurify sanitization on all markdown output; sandboxed `<iframe>` with restricted permissions for code execution. |
