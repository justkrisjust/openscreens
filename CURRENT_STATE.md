# OpenScreens Current Summary

- **Live Site**: https://justkrisjust.github.io/openscreens/
- **Architecture**: Bob & Rex Top-Left Crew Cells + Sequential Construction/Demolition Workflows + Real-Time Location-Tracked Transit Network + Zero-Project Standby Mode
- **Guide Companion**: T-40 (Out of the box)

## Recent Completed Changes
1. **Real-Time Bot Movement Tracking ($A \to B \to C \to A$)**:
   - Replaced ungrounded fallback state with persistent `botLocations` state + `botLocationsRef` sync, tracking every bot's exact real-time campus spot (`coffee`, `arcade`, `gpu_spa`, `dj_lounge`, `tv`, `water_cooler`, `knowledge`, or `cabin-X`).
   - Every movement departs from the bot's actual current location and updates upon arrival ($3.4\text{s}$), so consecutive trips cycle smoothly ($A \to B$, then $B \to C$, then $C \to A$) without snapping back to $A$.
   - Added `activeMovingBotsRef` concurrency protection to prevent wander interruptions during active transit.
2. **Responsive Single Floor Instance**:
   - `OfficeCanvas.tsx`: Added `isDesktop` media query state (`>= 1024px`) to mount strictly ONE `<VirtualOfficeFloor>` instance across mobile tabs and desktop views, preventing conflicting duplicate timers.
3. **Continuous Bottom Transit Line**:
   - Extended bottom SVG railway with `M 288 705 L 920 705` and junction dots at $(288, 705)$ and $(920, 705)$, seamlessly connecting Cabins through Knowledge Vault to TV/Water Cooler.
4. **Verification**: 18/18 Vitest tests passing, production build 100% clean, zero security issues.
