# Simple Coding Time Tracker - How It Works

This document explains how the time tracking mechanism works in Simple Coding Time Tracker (SCTT). It's written for both developers who want to understand the code and users who want to know what's happening behind the scenes.

## Features

The following features are implemented in this codebase:

- **Automatic Coding Time Tracking**
  - Tracks active coding time in minutes, per project and per git branch.
  - Detects activity (typing, cursor movement, file changes) and inactivity.
  - Handles project and branch switching automatically.
  - Multi-root workspace aware.

- **Customizable Tracking Behavior**
  - Configurable save interval, inactivity timeout, and focus timeout via settings.
  - Accurate time tracking even with frequent app switching.

- **Persistent Data Storage**
  - Stores time entries persistently using VS Code's global state.
  - Data is structured as `TimeEntry` objects (date, project, branch, time spent).
  - Automatic migration for new data fields (e.g., branch support).

- **Summary and Reporting**
  - Provides a summary view with daily, project, and branch breakdowns.
  - Aggregates total time, and allows filtering by date, project, or branch.
  - Real-time status bar updates showing current tracked time and context.

- **User Interface Integration**
  - Status bar item for quick access and live tracking status.
  - Commands to start/stop tracking, show summary, and clear all data.
  - Webview or panel for detailed time statistics and reports.

- **Robust Error Handling**
  - All storage and tracking operations are wrapped in error handling.
  - User notifications for errors or important actions (e.g., data deletion).

- **Developer-Friendly Structure**
  - Modular codebase with clear separation of concerns:
    - `timeTracker.ts`: Core tracking logic and activity detection
    - `database.ts`: Persistent storage and summary aggregation
    - `statusBar.ts`: Status bar UI integration
    - `summaryView.ts`: Summary/reporting UI
    - `utils.ts`: Helper functions for formatting and common tasks
  - Well-documented code and architecture for easy maintenance and extension.

---

## Core Concepts

### Time Units and Storage
- Time is tracked in **minutes**
- Data is stored as `TimeEntry` objects with:
  - Date: When the coding session occurred
  - Project: Which project was being worked on
  - Branch: Which git branch was active
  - TimeSpent: Duration in minutes

### Key Variables That Control Tracking

```typescript
// These are the main timing control variables
saveIntervalSeconds = 5       // How often to save time entries
inactivityTimeoutSeconds = 300 // Stop tracking after 5 mins of inactivity
focusTimeoutSeconds = 180     // Continue tracking for 3 mins after losing focus
```

## How Time Tracking Works

### 1. Starting a Tracking Session

A tracking session starts when:
- You start typing/moving cursor
- VS Code window gains focus
- You switch to a different file

The tracker records:
- Start time (`startTime`)
- Current project (`currentProject`)
- Current git branch (`currentBranch`)

### 2. During Active Tracking

The tracker maintains three important intervals and time validation:

1. **Update Interval (1 second)**
   - Runs every second
   - Updates internal state and validates time continuity
   - Detects system sleep/wake by checking time gaps
   - Used for real-time UI updates

2. **Save Interval (5 seconds by default)**
   - Saves your current session to database
   - Creates a new time entry
   - Resets the start time

3. **Activity Monitoring**
   - Tracks cursor movements, typing, file changes
   - Updates `lastCursorActivity` timestamp
   - Used to detect inactivity

### 3. Project & Branch Tracking

The tracker automatically handles:

- **Project Changes**
  - Detects when you switch between projects
  - Saves time separately for each project
  - Multi-root workspace aware

- **Branch Changes**
  - Monitors git branch changes
  - Creates separate time entries per branch
  - Perfect for tracking time across feature branches

### 4. When Tracking Stops

Tracking stops in these scenarios:

1. **Inactivity** (after 5 minutes by default)
   - No cursor movement
   - No typing
   - No file changes
   - Abnormal time gaps (system sleep/hibernate detected)

2. **Lost Focus** (after 1 minute by default)
   - Switched to another application
   - Can be configured to wait longer

3. **Manual Stop**
   - VS Code is closed
   - Extension is disabled

### Database Structure

Time entries are stored with this structure:
```typescript
interface TimeEntry {
    date: string;        // ISO date string (YYYY-MM-DD)
    project: string;     // Project/workspace name
    timeSpent: number;   // Duration in minutes
    branch: string;      // Git branch name
}
```

## Configuration Options

You can customize tracking behavior:

1. **Save Interval** (`simpleCodingTimeTracker.saveInterval`)
   - How often to save time entries
   - Default: 5 seconds
   - Lower = More accurate but more writes

2. **Inactivity Timeout** (`simpleCodingTimeTracker.inactivityTimeout`)
   - How long to wait before stopping due to inactivity
   - Default: 300 seconds (5 minutes)
   - Higher = More lenient with breaks

3. **Focus Timeout** (`simpleCodingTimeTracker.focusTimeout`)
   - How long to continue tracking after losing window focus
   - Default: 180 seconds (3 minutes)
   - Higher = Better for quick app switches

## Tips for Accurate Tracking

1. **Keep VS Code Focused**
   - Tracking is most accurate when VS Code remains your active window
   - Use the focus timeout setting if you frequently switch apps

2. **Branch Awareness**
   - Create branches for different features
   - Time is tracked separately per branch
   - Great for client billing

3. **Project Organization**
   - Use separate VS Code windows for different projects
   - Or use multi-root workspaces for clean separation

## Common Scenarios

1. **Multiple Projects Open**
   ```
   Project A (main) → 30 mins
   Project B (feature) → 45 mins
   ```
   Each gets tracked separately

2. **Branch Switching**
   ```
   main → 1 hour
   feature/xyz → 30 mins
   ```
   Time is split accurately per branch

3. **Taking Breaks**
   ```
   10:00 - Start coding
   10:30 - Take break (no activity)
   10:35 - Tracking auto-stops
   10:40 - Resume coding (auto-starts)
   ```

## Behind-the-Scenes Logic

1. **Activity Detection**
   - Monitors VS Code events
   - Cursor movements
   - Text changes
   - File switches
   - Git operations

2. **Time Calculation**
   ```typescript
   duration = (currentTime - startTime) / 60000 // Convert ms to minutes
   ```

3. **Session Management**
   - Small sessions are combined
   - Inactive periods are excluded
   - Branch/project switches create new sessions

## Developer Notes

Key files and their roles:
- `timeTracker.ts`: Core tracking logic
- `database.ts`: Time entry storage
- `statusBar.ts`: Real-time UI updates
- `summaryView.ts`: Time statistics and reports
