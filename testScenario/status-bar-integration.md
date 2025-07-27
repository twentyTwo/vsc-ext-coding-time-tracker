# Status Bar Integration - Test Cases

## Overview
Status bar functionality including real-time time display, activity indicators, manual save commands, and visual feedback.

## Test Cases

### TC-SB-001: Basic Status Bar Display
**Objective:** Verify status bar shows time tracking information correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start VS Code with extension
2. Verify status bar item appears
3. Start tracking activity
4. Observe status bar updates
5. Check time format and display

**Expected Result:**
- Status bar item visible and positioned correctly
- Time display updates in real-time
- Format is readable and consistent (e.g., "2h 34m")
- Status bar integrates well with VS Code UI

**Priority:** High
**Category:** UI Display

---

### TC-SB-002: Activity Status Indication
**Objective:** Verify status bar reflects current tracking state
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start tracking activity
2. Verify status bar shows active state
3. Stop activity and wait for timeout
4. Verify status bar shows inactive/paused state
5. Resume activity and check state change

**Expected Result:**
- Clear visual distinction between active/inactive states
- Icons or colors indicate current state
- State changes are immediate and accurate
- Tooltip provides additional information

**Priority:** High
**Category:** Status Indication

---

### TC-SB-003: Manual Save Command
**Objective:** Verify status bar click triggers manual save
**Prerequisites:** Extension installed, tracking active
**Steps:**
1. Start tracking and accumulate some time
2. Click on status bar item
3. Verify manual save is triggered
4. Check for confirmation message
5. Verify session data is saved

**Expected Result:**
- Status bar click registers correctly
- Manual save command executes
- User receives confirmation feedback
- Session time is saved to database
- Timer resets for new session

**Priority:** High
**Category:** Manual Commands

---

### TC-SB-004: Real-Time Updates
**Objective:** Verify status bar updates accurately in real-time
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start tracking activity
2. Observe status bar for several minutes
3. Verify time increments correctly
4. Check update frequency (should be every second)
5. Verify accuracy against system clock

**Expected Result:**
- Status bar updates every second
- Time calculations are accurate
- No lag or delay in updates
- Consistent update rhythm

**Priority:** High
**Category:** Real-Time Updates

---

### TC-SB-005: Tooltip Information
**Objective:** Verify status bar tooltip provides useful information
**Prerequisites:** Extension installed and activated
**Steps:**
1. Hover over status bar item while tracking
2. Read tooltip content
3. Test tooltip during different states (active/inactive)
4. Verify tooltip shows relevant project/branch info

**Expected Result:**
- Tooltip appears on hover
- Contains current project name
- Shows current branch (if git repository)
- Displays current session duration
- Additional context information provided

**Priority:** Medium
**Category:** User Information

---

### TC-SB-006: Multiple Project Display
**Objective:** Verify status bar correctly shows information for different projects
**Prerequisites:** Extension installed, multiple workspaces available
**Steps:**
1. Start tracking in Project A
2. Note status bar information
3. Switch to Project B workspace
4. Verify status bar updates with new project info
5. Switch back and verify information changes

**Expected Result:**
- Status bar reflects current active project
- Project name changes when switching workspaces
- Time tracking continues appropriately
- No confusion between projects

**Priority:** Medium
**Category:** Multi-Project Support

---

### TC-SB-007: Status Bar During Health Notifications
**Objective:** Verify status bar behavior during health notifications
**Prerequisites:** Extension installed, health notifications enabled
**Steps:**
1. Start tracking until health notification appears
2. Observe status bar when modal notification shows
3. Interact with health notification
4. Verify status bar updates appropriately

**Expected Result:**
- Status bar shows paused state during modal
- Clear indication that timer is paused for health break
- Status resumes correctly after modal dismissal
- Consistent behavior across notification types

**Priority:** Medium
**Category:** Health Integration

---

### TC-SB-008: Long Duration Display
**Objective:** Verify status bar handles long tracking sessions correctly
**Prerequisites:** Extension installed, ability to simulate long sessions
**Steps:**
1. Start tracking for extended period (4+ hours)
2. Verify time display formatting
3. Check for overflow or display issues
4. Test with very long durations (8+ hours)

**Expected Result:**
- Time format scales appropriately (hours, minutes)
- No display overflow or truncation
- Readable format maintained for long durations
- Consistent formatting regardless of duration

**Priority:** Medium
**Category:** Display Formatting

---

### TC-SB-009: Status Bar Command Registration
**Objective:** Verify status bar command is properly registered and accessible
**Prerequisites:** Extension installed and activated
**Steps:**
1. Check VS Code command palette for status bar related commands
2. Execute commands manually if available
3. Verify command registration in extension
4. Test command execution from different sources

**Expected Result:**
- Commands are properly registered in VS Code
- Commands execute correctly when called
- No duplicate or conflicting command registrations
- Commands accessible through appropriate interfaces

**Priority:** Low
**Category:** Command Registration

---

### TC-SB-010: Status Bar Positioning and Themes
**Objective:** Verify status bar integration with different VS Code themes
**Prerequisites:** Extension installed, access to theme selection
**Steps:**
1. Test status bar with light theme
2. Switch to dark theme and verify appearance
3. Test with high contrast themes
4. Verify positioning remains consistent
5. Check text readability in all themes

**Expected Result:**
- Status bar item visible in all themes
- Text color contrasts appropriately with background
- Icons display correctly across themes
- Positioning remains consistent
- No theme-specific display issues

**Priority:** Low
**Category:** Theme Compatibility

---

### TC-SB-011: Status Bar Performance
**Objective:** Verify status bar updates don't impact VS Code performance
**Prerequisites:** Extension installed and activated
**Steps:**
1. Start tracking activity
2. Monitor CPU usage during status bar updates
3. Perform intensive VS Code operations
4. Verify status bar updates continue smoothly
5. Check for memory leaks over time

**Expected Result:**
- Minimal CPU impact from status bar updates
- No interference with other VS Code operations
- Stable memory usage over time
- Smooth and consistent updates

**Priority:** Medium
**Category:** Performance

---

### TC-SB-012: Status Bar Error Handling
**Objective:** Verify status bar handles errors gracefully
**Prerequisites:** Extension installed, ability to simulate error conditions
**Steps:**
1. Simulate database connection issues
2. Verify status bar behavior during errors
3. Test recovery when issues are resolved
4. Check error indication to user

**Expected Result:**
- Status bar shows appropriate error state
- User is informed of issues without being overwhelmed
- Graceful recovery when problems are resolved
- No crashes or unhandled exceptions

**Priority:** Low
**Category:** Error Handling

## Test Data Requirements
- Multiple workspace configurations
- Projects with different names and structures
- Long-running sessions for duration testing
- Various VS Code themes for compatibility testing

## Environment Setup
- VS Code with extension installed
- Multiple workspace folders available
- Access to VS Code theme selection
- Ability to monitor system performance
- Different project types for testing
