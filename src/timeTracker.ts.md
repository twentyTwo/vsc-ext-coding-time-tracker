# `timeTracker.ts` Documentation

This file contains the core logic for tracking Dev Pulse (dev time) in the extension. It manages timers, detects window focus, and records time entries.

## Overview
- **Purpose:** Track time spent with the VS Code window focused and record it to the database.
- **Main Responsibilities:**
  - Start and stop time tracking sessions
  - Detect window focus/blur and workspace/project/branch changes
  - Periodically save tracked time to the database

## Key Concepts
- **Timer Management:**
  - Uses intervals or timeouts to track elapsed time
  - Pauses/resumes based on VS Code window focus, not editor keystrokes
- **Focus-Based Tracking:**
  - `onDidChangeWindowState` is the sole start/stop authority: tracking starts when the window gains focus and stops only after it has been unfocused longer than the configurable Focus Timeout
  - Editor/cursor/hover events (`updateCursorActivity`) no longer stop tracking on inactivity — they're only used to detect a project switch and roll over the session
  - A wall-clock gap check (`validateTimeGap`) excludes OS sleep/lock time from tracked sessions, since VS Code can stay reported as "focused" through a suspend
- **Data Recording:**
  - Writes time entries to the database at regular intervals or on session end

## Usage
- Called by extension commands to start/stop tracking and to handle activity events.

---

**See the source code in `src/timeTracker.ts` for implementation details.**
