# OpenScreens — Multi-Model AI Office

[![Deploy OpenScreens to GitHub Pages](https://github.com/justkrisjust/openscreens/actions/workflows/deploy.yml/badge.svg)](https://github.com/justkrisjust/openscreens/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A client-side web application where you connect your own API keys from different AI providers, turn each into a named "bot" with a distinct persona and role, assemble them into collaborative projects, and watch them build together in a game-like office on a shared goal.

---

## 🌟 Key Features

1. **Multi-Provider AI Collaboration**:
   - Mix bots powered by **Anthropic Claude**, **Google Gemini**, **OpenAI**, **xAI Grok**, and **Mistral** in a single project.
   - Soft suggestions encourage mixing providers rather than locking to one model.
2. **Instant Zero-Cost Demo Mode**:
   - Built-in simulation with realistic multi-turn bot coordination, markdown editing, and lock respecting out of the box with zero keys and zero costs.
3. **App-Managed Virtual File Locking**:
   - Locks are managed by OpenScreens, never by the bots.
   - If Bot B requests `index.html` while Bot A is editing, Bot B immediately receives `"busy, pick another task"` without polling.
4. **Shared "Memory Box"**:
   - Virtual project file tree stored securely in **IndexedDB**.
   - Bots talk via compact event feeds and read/write markdown or code files only when needed, maximizing token efficiency.
5. **Character Gestures & Status Tags**:
   - Bots output a compact tag `[STATUS: working|thinking|blocked|needs_help|done|waiting]`.
   - The UI maps tags to expressive character animations and status pulses without bots burning tokens "acting".
6. **Pre-Flight Compatibility Check**:
   - 4-stage pre-flight test verifying role following, file writing syntax, lock respect, and a 2-bot handshake.
   - Derives actual pass/fail metrics with plain-language recommendations.
7. **Sandboxed Live Preview & ZIP Export**:
   - Test built web apps directly in an isolated `<iframe>` (`sandbox="allow-scripts"`).
   - Download the full project file tree as a `.zip` archive at any time with one click.
8. **Director Mode**:
   - You are the final approver! Send feedback or instructions to Bot A, Bot B, or broadcast to all bots.

---

## 🔒 Security Model

OpenScreens was built from day one under a strict zero-trust security paradigm:

- **100% Client-Side**: No backend server, no telemetry, no tracking. API calls are dispatched directly from your browser to provider endpoints.
- **WebCrypto AES-GCM (256-bit)**: When saved, API keys are encrypted locally using `window.crypto.subtle` with a key derived via **PBKDF2 (100,000 iterations)** from your master passphrase.
- **Session-Only Memory Mode**: You can keep keys in browser RAM only for the active tab session without persisting anything to disk.
- **Strict Content Security Policy (CSP)**: `connect-src` is strictly locked down to `'self'` and official provider API domains (`api.anthropic.com`, `generativelanguage.googleapis.com`, `api.openai.com`, `api.x.ai`, `api.mistral.ai`).
- **XSS-Safe Markdown & Code Sandbox**: All markdown rendering is filtered through **DOMPurify**. Live code preview runs inside a sandboxed iframe without `allow-same-origin`, preventing untrusted code from accessing your browser storage or keys.
- **One-Click Wipe All Data**: Instantly purges all IndexedDB tables, encrypted key vaults, and local session stores.
- **Pre-Commit Secret Auditing**: Automatic hook blocks commits containing API keys.

---

## 🌐 Provider Browser Compatibility Matrix

| Provider | Browser CORS Status | Direct Header | Notes |
|---|---|---|---|
| **Google Gemini** | ✅ **Direct Browser Support** | Not needed | Full CORS enabled natively on `generativelanguage.googleapis.com`. |
| **Anthropic Claude** | ✅ **Direct Browser Support** | `anthropic-dangerous-direct-browser-access: true` | Fully supported via official browser header. |
| **OpenAI** | ⚠️ **Needs Proxy / Custom Endpoint** | - | OpenAI API restricts direct browser CORS. Works via user-configurable custom proxy URL. |
| **xAI Grok** | ⚠️ **Needs Proxy (Coming Soon)** | - | Marked in UI as "Needs Proxy". Supports custom proxy URL. |
| **Mistral AI** | ⚠️ **Needs Proxy (Coming Soon)** | - | Marked in UI as "Needs Proxy". Supports custom proxy URL. |
| **Demo Simulator** | ✅ **Direct Browser Support** | - | 100% offline, zero-key realistic simulation. |

---

## 🎨 How to Swap in Figma Designs (For Designers)

OpenScreens isolates styling cleanly from business logic:

1. **Design Tokens (`src/styles/tokens.css`)**:
   - All colors, surface shades, borders, and typography reside in standard CSS custom properties (`--bg-app`, `--bg-card`, `--accent-primary`, `--status-working`, etc.).
   - Simply copy your Figma color and spacing tokens directly into `tokens.css`.
2. **Modular Components (`src/components/`)**:
   - `src/components/office/BotWorkArea.tsx`: Layout and character avatar presentation.
   - `src/components/memory/MemoryBox.tsx`: Virtual file tree and code editor card.
   - `src/components/office/EventFeed.tsx`: Event stream card.
   - `src/components/chat/DirectorChat.tsx`: User message dock.
   - All components use standard Tailwind utility classes and CSS variables.

---

## 🚀 Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/justkrisjust/openscreens.git
cd openscreens

# Install dependencies
npm install

# Run automated tests
npm test

# Run pre-commit secret check
npm run check:secrets

# Start local development server
npm run dev
```

---

## 📦 How to Add a New AI Provider

1. Create a new adapter file under `src/adapters/` (e.g. `src/adapters/cohere.ts`) implementing the `ProviderAdapter` interface:
   ```typescript
   export interface ProviderAdapter {
     id: ProviderId;
     displayName: string;
     capabilities: ProviderCapabilities;
     fetchModels(apiKey: string, customProxyUrl?: string): Promise<string[]>;
     sendMessage(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
   }
   ```
2. Register the adapter in `src/adapters/registry.ts`.
3. Add the provider ID to `ProviderId` union in `src/services/storage.ts`.
4. If direct browser CORS is supported, add the domain to the `connect-src` CSP meta tag in `index.html`.
