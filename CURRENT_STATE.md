# OpenScreens Current Summary

- **Live Site**: https://justkrisjust.github.io/openscreens/
- **Last Verification**: Vitest 18/18 passed, Vite production build clean (0 errors)

## Recent Changes
1. **Mobile Menu Bar**: Added 3-lines hamburger button (`☰` / `Menu`) in `src/components/common/Header.tsx`. Tapping it expands an animated slide drawer with direct access to Office, Bots, Projects, Tokens, Compatibility, API Keys, and Data Wipe.
2. **Eliminated Mobile Auto-Scroll Bug**: Replaced `scrollIntoView()` on the EventFeed with internal container-only scroll (`scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight`) in `src/components/office/EventFeed.tsx`. The screen never jumps or scrolls down on Start/turn execution.
3. **Integrated Director Chat with Conversation History**: Completely upgraded `src/components/chat/DirectorChat.tsx` to render a full message thread with message bubbles, Director vs Bot indicators, timestamps, quick approval pills, target selector (All bots or specific bot), and auto-scrolling container.
4. **Mobile Segmented View Switcher**: In `src/components/office/OfficeCanvas.tsx`, added mobile tabs (`🏢 Office`, `💬 Chat`, `📦 Files`, `⚡ Feed`) plus top-bar Chat shortcut button so mobile users can chat with bots directly without scrolling past tall stations.
