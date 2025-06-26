# `extension.ts` Documentation

This file is the main entry point for the VS Code Coding Time Tracker extension. It registers commands, initializes the database, and sets up the extension's UI components and event listeners.

## Overview
- **Purpose:** Bootstrap the extension, handle activation/deactivation, and wire up commands and UI.
- **Main Responsibilities:**
  - Register extension commands (start/stop tracking, show summary, clear data, etc.)
  - Initialize the `Database` and other core modules
  - Set up status bar and summary view
  - Listen for relevant VS Code events (e.g., workspace changes)

## Key Concepts
- **Activation:**
  - The `activate` function is called when the extension is activated.
  - Initializes the database, status bar, and summary view.
  - Registers all extension commands with VS Code.
- **Deactivation:**
  - The `deactivate` function is called when the extension is deactivated.
  - Used for cleanup if necessary.

## Commands Registered
- Start/stop time tracking
- Show summary view
- Clear all tracked data
- Other utility commands as needed

## Usage
- This file should not contain business logic; it delegates to other modules (e.g., `database.ts`, `statusBar.ts`, `summaryView.ts`, `timeTracker.ts`).

---

**See the source code in `src/extension.ts` for implementation details.**
