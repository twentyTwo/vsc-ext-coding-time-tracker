# `database.ts` Documentation

This file implements the persistent storage and retrieval logic for the VS Code Coding Time Tracker extension. It manages time tracking entries, provides summary data, and supports search and data management operations.

## Overview
- **Purpose:** Store and manage coding time entries, including date, project, time spent, and branch information.
- **Storage:** Uses VS Code's `globalState` API for persistent storage across extension reloads.
- **Main Class:** `Database` – encapsulates all database operations.

## Key Concepts
- **TimeEntry:**
  - Represents a single tracked coding session.
  - Fields: `date` (YYYY-MM-DD), `project` (string), `timeSpent` (number, minutes), `branch` (string).
- **SummaryData:**
  - Aggregated statistics for reporting (daily, per project, per branch, total time).

## How It Works

### Initialization
- On construction, the `Database` loads all entries from `globalState`.
- If no entries exist, it initializes an empty array.
- It also migrates old entries to ensure the `branch` field is present.

### Adding Entries
- `addEntry(date, project, timeSpent, branch)`
  - Adds or updates a time entry for the given date, project, and branch.
  - If an entry already exists for the same date/project/branch, it increments the `timeSpent`.
  - Saves the updated entries back to persistent storage.

### Retrieving Entries
- `getEntries()`
  - Returns all time entries from memory (reloads from storage if needed).

### Updating Entries
- `updateEntries(entries)`
  - Internal method to update the in-memory and persistent storage with new entries.

### Summarizing Data
- `getSummaryData()`
  - Aggregates all entries to provide:
    - Daily summary (total time per day)
    - Project summary (total time per project)
    - Branch summary (total time per branch)
    - Total time tracked

### Searching Entries
- `searchEntries(startDate?, endDate?, project?, branch?)`
  - Returns entries matching the provided filters (date range, project, branch).

### Branches by Project
- `getBranchesByProject(project)`
  - Returns a sorted list of unique branches for a given project.

### Clearing Data
- `clearAllData()`
  - Prompts the user for confirmation before deleting all time tracking data.
  - If confirmed, clears all entries from storage.

## Error Handling
- All storage operations are wrapped in try/catch blocks.
- User is notified via VS Code notifications if an error occurs.

## Migration
- On initialization, checks if any entries are missing the `branch` field and updates them to include it (default: 'unknown').

## Usage
- The `Database` class is instantiated with the extension context and used throughout the extension to manage time tracking data.

---

**See the source code in `src/database.ts` for implementation details.**
