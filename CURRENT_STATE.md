# OpenScreens Current Summary

- **Live Site**: https://justkrisjust.github.io/openscreens/
- **Architecture**: Bob & Rex Top-Left Crew Cells + Sequential Construction/Demolition Workflows + Transit Line Pathfinding + Zero-Project Standby Mode
- **Guide Companion**: T-40 (Out of the box)

## Recent Completed Changes
1. **Option to Delete Projects & Zero-Projects State**:
   - `ProjectsView.tsx`: Removed `projects.length > 1` limitation. Users can delete any project down to 0, with a clean zero-project empty state and quick `[+ Create First Project]` button.
   - `OfficeCanvas.tsx`: Removed blocking empty view when `!activeProject`. Renders the living office floor in Standby Mode with status pill `STANDBY • NO PROJECT`.
   - `MemoryBox.tsx`: Displays locked vault view (`🔒 Shared Memory Vault Locked`) when no project is active.
2. **Bob & Rex Top-Left Workshop Cells**:
   - Placed Bob's Workshop at `x: 12%, y: 9%` and Rex's Demolition Depot at `x: 28%, y: 9%`.
   - Both crew members reside in their cells when idle with live status indicators and interactive cartoon speech bubbles.
   - If user attempts to build an office without an active project, Bob speaks from his cell: *"Vault not open to build office! Create or select a project first."*
3. **Sequential Flow Check (Critical)**:
   - **Task Assignment**: Bob dispatches directly from his cell -> hammers & builds cabin -> returns to cell -> cabin visibly ready -> only then does the bot leave the chill zone and walk **along the green transit line** to its office desk.
   - **Task Release**: Bot leaves office desk **along the green transit line** to the leisure lounge -> only after bot safely arrives does Rex dispatch from his cell directly to the cabin -> Rex demolishes studio -> returns to depot.
   - **Transit Line Rule**: Bots strictly route along light green transit line corridors (`computeWaypointsAlongLine`); Bob and Rex fly directly without using transit lines.
4. **Verification**: 18/18 Vitest tests passing, production build 100% clean, zero security issues.
