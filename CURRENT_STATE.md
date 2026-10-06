# OpenScreens Current Summary

- **Live Site**: https://justkrisjust.github.io/openscreens/
- **Architecture**: Bob & Rex Top-Left Crew Cells + Sequential Construction/Demolition Workflows + Transit Line Pathfinding + Zero-Project Standby Mode
- **Guide Companion**: T-40 (Out of the box)

## Recent Completed Changes
1. **Separate Express Transit Line & Teleportation Fix (SS1)**:
   - Added express bypass line (`M 288 310 L 920 310`) routing directly between work cabins and leisure campus at `y = 31%`, completely bypassing the central vault.
   - Synchronized transit duration: locked animation duration to 3.2s with a 3400ms cleanup buffer (Step 5 fires at 6200ms), eliminating snap/teleportation into office desks.
2. **Knowledge Vault Relocation & 2 New Chill Spots (SS2)**:
   - Moved Knowledge Vault terminal to center-bottom (`x: 50%, y: 82%`) beneath the Memory Vault, connected to vertical transit corridor.
   - Added 2 new AI leisure spots: GPU Overclock Spa (`x: 72%, y: 53%`) and Synthwave DJ Booth (`x: 90%, y: 53%`), expanding campus to 6 spots.
   - Replaced blocked wander interval with independent per-bot randomized timers (12s–45s) across all project states so idle bots freely wander along transit lines.
3. **Removed Duplicate Static Bot Face Inside Cabin (SS3)**:
   - Removed duplicate static `<BotFace />` inside cabin card; active bot avatar sits at the desk via motion element.
4. **Verification**: 18/18 Vitest tests passing, production build 100% clean, zero security issues.
