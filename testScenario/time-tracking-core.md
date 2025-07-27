# Time Tracking Core - Test Cases

## Overview
Core time tracking functionality including start/stop, activity detection, and session management.

## Test Cases

### TC-001: Basic Time Tracking Start/Stop
**Objective:** Verify that time tracking starts and stops correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Open VS Code with a workspace
2. Start typing in any file
3. Verify status bar shows tracking is active
4. Stop all activity for 3+ minutes
5. Verify tracking stops due to inactivity

**Expected Result:**
- Status bar shows active tracking when typing
- Status bar shows paused/stopped when inactive
- Time is accumulated correctly

**Priority:** High
**Category:** Core Functionality

---

### TC-002: Cursor Activity Detection
**Objective:** Verify that cursor movements trigger activity detection
**Prerequisites:** Extension installed and activated
**Steps:**
1. Open a file in VS Code
2. Move cursor around without typing
3. Check if tracking is active
4. Select text with mouse
5. Verify activity is detected

**Expected Result:**
- Cursor movements should trigger activity detection
- Text selection should maintain active tracking
- No false inactivity timeouts during cursor activity

**Priority:** High
**Category:** Activity Detection

---

### TC-003: Text Changes Tracking
**Objective:** Verify that text editing triggers activity detection
**Prerequisites:** Extension installed and activated
**Steps:**
1. Open a file in VS Code
2. Type some text
3. Delete some text
4. Copy/paste text
5. Undo/redo operations

**Expected Result:**
- All text editing operations should maintain active tracking
- Timer should not stop during continuous editing
- Status bar should reflect active state

**Priority:** High
**Category:** Activity Detection

---

### TC-004: Multi-File Activity
**Objective:** Verify tracking continues across multiple files
**Prerequisites:** Extension installed and activated
**Steps:**
1. Open multiple files in VS Code
2. Switch between files
3. Edit different files
4. Close and open files

**Expected Result:**
- Tracking should continue seamlessly across file switches
- No session breaks when switching files
- Activity detection works in all files

**Priority:** Medium
**Category:** Multi-File Support

---

### TC-005: Inactivity Timeout
**Objective:** Verify that tracking stops after configured inactivity period
**Prerequisites:** Extension installed, inactivity timeout set to 3 minutes
**Steps:**
1. Start tracking by typing
2. Stop all activity (no typing, no cursor movement)
3. Wait for inactivity timeout (3 minutes)
4. Verify tracking stops
5. Resume activity and verify tracking restarts

**Expected Result:**
- Tracking stops after exactly 3 minutes of inactivity
- Status bar reflects stopped state
- Tracking automatically resumes when activity detected

**Priority:** High
**Category:** Timeout Management

---

### TC-006: Focus Timeout
**Objective:** Verify that tracking handles VS Code window focus changes
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start tracking in VS Code
2. Switch to another application
3. Wait for focus timeout period
4. Return to VS Code
5. Verify tracking behavior

**Expected Result:**
- Tracking should pause when VS Code loses focus
- Tracking should resume when VS Code regains focus
- Time should not accumulate while unfocused

**Priority:** Medium
**Category:** Focus Management

---

### TC-007: Session Persistence
**Objective:** Verify that sessions are saved correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start a tracking session
2. Work for several minutes
3. Manually save session (if feature available)
4. Check database for saved entries
5. Restart VS Code and verify data persists

**Expected Result:**
- Sessions are saved to database correctly
- Data persists across VS Code restarts
- No data loss during normal operation

**Priority:** High
**Category:** Data Persistence

---

### TC-008: Project Detection
**Objective:** Verify that current project is detected correctly
**Prerequisites:** Extension installed, workspace folder opened
**Steps:**
1. Open a workspace with a named folder
2. Start tracking
3. Verify project name is detected
4. Switch to different workspace
5. Verify project name updates

**Expected Result:**
- Project name should match workspace folder name
- Project detection should be automatic
- Project changes should be reflected immediately

**Priority:** Medium
**Category:** Project Management

---

### TC-009: Edge Cases - Empty Workspace
**Objective:** Verify behavior when no workspace is open
**Prerequisites:** Extension installed
**Steps:**
1. Close all workspace folders
2. Open a single file
3. Start tracking activity
4. Verify behavior

**Expected Result:**
- Extension should handle no workspace gracefully
- Tracking should still work for individual files
- Project name should show appropriate default

**Priority:** Low
**Category:** Edge Cases

---

### TC-010: Performance - Long Sessions
**Objective:** Verify performance during extended tracking sessions
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start a tracking session
2. Maintain activity for 4+ hours continuously
3. Monitor CPU usage and memory
4. Verify tracking accuracy

**Expected Result:**
- No performance degradation over time
- Memory usage should remain stable
- Tracking accuracy maintained throughout session

**Priority:** Medium
**Category:** Performance

## Test Data Requirements
- Multiple workspace folders with different names
- Files of various types (.js, .ts, .md, .json, etc.)
- Large files (1000+ lines) for performance testing

## Environment Setup
- VS Code latest version
- Extension installed and configured
- Test workspace with sample projects
- Multiple file types available for testing
