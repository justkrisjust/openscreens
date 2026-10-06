# OpenScreens Current Summary

- **Live Site**: https://justkrisjust.github.io/openscreens/
- **Architecture**: Colony 3-Street Architecture + Local AI Production Mode
- **Guide Companion**: T-40 (Out of the box)

## Recent Completed Changes
1. **Colony 3 Streets Layout**: Overhauled `VirtualOfficeFloor.tsx` into 3 spacious street tabs:
   - `Street 1 (Work Cabins)`: Expansive studio pods along a zig-zag street with active work desks, Bob the Builder construction animation (`👷 🔨`), Rex demolition animation (`🚜 💥`), and direct reassign/release controls.
   - `Street 2 (Vault & App)`: Central Memory Box file vault with lock badges, assignment dropdowns, bot auto-summaries, alongside a full-size Live App Monitor iframe sandbox.
   - `Street 3 (Recreation Campus)`: Relaxing park connecting the 5 leisure spots (Coffee, 8-Bit Arcade, TV Lounge, Water Cooler, Knowledge Vault) with ambient bot wandering.
   - `Free Look`: Panoramic bird's-eye view with zoom and pan.
2. **Slide-Out Director Chat Drawer**: Wired `[💬 Chat]` button to open an animated slide-over chat drawer from anywhere on both desktop and mobile, with live conversation thread, quick approval pills, target bot selector, and directive input.
3. **Out-of-the-Box Guide Bot "T-40"**: Seeded T-40 in `demoData.ts` as a built-in companion bot. Created `T40GuideModal.tsx` accessible via `[🤖 Guide (T-40)]` in Header and `[Ask T-40]` in the project canvas to answer user questions about turns, local Ollama, colony streets, and directives.
4. **Searchable Model Combobox**: Expanded `ollamaAdapter` with all major official models (`deepseek-r1`, `qwen2.5-coder`, `llama3.3`, `llama3.2`, `mistral`, `gemma2`, `phi4`). Upgraded `BotSetupModal.tsx` with a live search filter input and custom model support.
5. **Bold Star Face**: Removed the inner circular mask in `BotFace.tsx`, sharpened the outer star points and added a glowing inner star visor so star faces stand out crisply and proudly.
6. **Memory Box Reassign & Auto-Summary**: Added unified Reassign/Release dropdown in `MemoryBox.tsx`. Enhanced `useProjectRunner.ts` to extract `SUMMARY:` from bot outputs and save it to `VirtualFile.lastSummary`.
