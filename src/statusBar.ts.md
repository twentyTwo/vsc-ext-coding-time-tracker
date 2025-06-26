# `statusBar.ts` Documentation

This file manages the VS Code status bar item for the Coding Time Tracker extension. It displays the current tracking status and provides quick access to extension commands.

## Overview
- **Purpose:** Show time tracking status and provide user interaction via the status bar.
- **Main Responsibilities:**
  - Create and update a status bar item
  - Display current tracked time, project, and branch
  - Handle user clicks to trigger extension commands

## Key Concepts
- **Status Bar Item:**
  - Created using VS Code's API
  - Updated in real-time as tracking state changes
- **User Interaction:**
  - Clicking the status bar item can start/stop tracking or open the summary view

## Usage
- Used by the main extension entry point to keep users informed and provide quick actions.

---

**See the source code in `src/statusBar.ts` for implementation details.**
