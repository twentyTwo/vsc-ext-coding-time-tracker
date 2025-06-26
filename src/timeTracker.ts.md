# `timeTracker.ts` Documentation

This file contains the core logic for tracking coding time in the Coding Time Tracker extension. It manages timers, detects activity, and records time entries.

## Overview
- **Purpose:** Track active coding time and record it to the database.
- **Main Responsibilities:**
  - Start and stop time tracking sessions
  - Detect user activity and workspace/project/branch changes
  - Periodically save tracked time to the database

## Key Concepts
- **Timer Management:**
  - Uses intervals or timeouts to track elapsed time
  - Pauses/resumes based on user activity
- **Activity Detection:**
  - Monitors editor events to determine if the user is actively coding
- **Data Recording:**
  - Writes time entries to the database at regular intervals or on session end

## Usage
- Called by extension commands to start/stop tracking and to handle activity events.

---

**See the source code in `src/timeTracker.ts` for implementation details.**
