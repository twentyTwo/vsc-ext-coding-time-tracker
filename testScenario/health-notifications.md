# Health Notifications - Test Cases

## Overview
Health notification system including eye rest, stretch reminders, and break notifications with modal interface and pause functionality.

## Test Cases

### TC-HN-001: Eye Rest Notification Basic Flow
**Objective:** Verify eye rest notifications appear at configured intervals
**Prerequisites:** Extension installed, eye rest interval set to 20 minutes, notifications enabled
**Steps:**
1. Start tracking activity
2. Work continuously for 20 minutes
3. Verify eye rest notification appears
4. Click "I just did it!" button
5. Verify positive feedback message appears

**Expected Result:**
- Notification appears exactly after 20 minutes
- Modal blocks UI (if modal setting enabled)
- Timer auto-pauses when modal appears
- Timer auto-resumes when modal dismissed
- Positive feedback message displayed

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-002: Eye Rest Snooze Functionality
**Objective:** Verify eye rest snooze works correctly
**Prerequisites:** Extension installed, eye rest notifications enabled
**Steps:**
1. Start tracking and wait for eye rest notification
2. Click "Remind me in 5 min" button
3. Verify snooze confirmation message
4. Wait 5 minutes
5. Verify notification appears again
6. Continue normal 20-minute intervals after snooze

**Expected Result:**
- Snooze message confirms 5-minute delay
- Notification reappears after exactly 5 minutes
- Normal 20-minute cycle resumes after snooze
- Timer behavior remains consistent

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-003: Stretch Notification Basic Flow
**Objective:** Verify stretch notifications appear at configured intervals
**Prerequisites:** Extension installed, stretch interval set to 45 minutes, notifications enabled
**Steps:**
1. Start tracking activity
2. Work continuously for 45 minutes
3. Verify stretch notification appears
4. Click "I just stretched!" button
5. Verify positive feedback message appears

**Expected Result:**
- Notification appears exactly after 45 minutes
- Modal has correct message about stretching
- Timer auto-pauses/resumes correctly
- Encouraging feedback provided

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-004: Stretch Snooze Functionality
**Objective:** Verify stretch reminder snooze works correctly
**Prerequisites:** Extension installed, stretch notifications enabled
**Steps:**
1. Start tracking and wait for stretch notification
2. Click "Remind me in 10 min" button
3. Verify snooze confirmation message
4. Wait 10 minutes
5. Verify notification appears again

**Expected Result:**
- Snooze delays notification by exactly 10 minutes
- Normal 45-minute cycle resumes after snooze
- All timer behaviors work correctly

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-005: Break Notification Basic Flow
**Objective:** Verify break notifications appear after 2+ hours
**Prerequisites:** Extension installed, break threshold set to 120 minutes, notifications enabled
**Steps:**
1. Start tracking activity
2. Work continuously for 2+ hours
3. Verify break notification appears (Error level)
4. Click "I took a break!" button
5. Verify positive feedback message appears

**Expected Result:**
- Notification appears after exactly 2 hours
- Notification uses Error level (red, urgent)
- Message emphasizes health importance
- Timer pauses/resumes automatically

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-006: Break Snooze Functionality
**Objective:** Verify break reminder snooze works correctly
**Prerequisites:** Extension installed, break notifications enabled
**Steps:**
1. Work for 2+ hours to trigger break notification
2. Click "Remind me in 15 min" button
3. Verify snooze confirmation message
4. Wait 15 minutes
5. Verify notification appears again

**Expected Result:**
- Break notification can be snoozed for 15 minutes
- Notification reappears with same urgency
- Normal 2-hour cycle continues after snooze

**Priority:** High
**Category:** Health Notifications

---

### TC-HN-007: Modal vs Non-Modal Behavior
**Objective:** Verify notifications respect modal setting
**Prerequisites:** Extension installed with access to settings
**Steps:**
1. Set modalNotifications to true
2. Trigger any health notification
3. Verify modal behavior (blocks UI)
4. Set modalNotifications to false
5. Trigger another notification
6. Verify non-modal behavior

**Expected Result:**
- Modal true: Notification blocks UI, requires user action
- Modal false: Notification appears but doesn't block UI
- Timer pause/resume only works with modal enabled
- Setting change takes effect immediately

**Priority:** Medium
**Category:** Configuration

---

### TC-HN-008: Auto-Pause and Resume Timer
**Objective:** Verify timer automatically pauses/resumes with modal notifications
**Prerequisites:** Extension installed, modal notifications enabled
**Steps:**
1. Start tracking activity
2. Trigger any health notification
3. Verify timer pauses when modal appears
4. Interact with modal (any button)
5. Verify timer resumes when modal disappears

**Expected Result:**
- Timer status shows paused when modal appears
- No time accumulation during modal display
- Timer automatically resumes without user action
- Status bar reflects correct state throughout

**Priority:** High
**Category:** Timer Integration

---

### TC-HN-009: Multiple Notification Types Timing
**Objective:** Verify multiple notification types work together correctly
**Prerequisites:** Extension installed, all notifications enabled with default intervals
**Steps:**
1. Start tracking
2. Work continuously to trigger multiple notification types
3. Verify timing independence (eye rest at 20min, stretch at 45min, break at 120min)
4. Check that notifications don't interfere with each other

**Expected Result:**
- Each notification type maintains independent timing
- No conflicts between notification types
- All timers continue correctly after any notification
- Each type shows appropriate messages and snooze times

**Priority:** Medium
**Category:** Integration

---

### TC-HN-010: Notification Settings Configuration
**Objective:** Verify all health notification settings work correctly
**Prerequisites:** Extension installed with configuration access
**Steps:**
1. Change eye rest interval to custom value (e.g., 15 minutes)
2. Change stretch interval to custom value (e.g., 30 minutes)
3. Change break threshold to custom value (e.g., 90 minutes)
4. Disable/enable notifications
5. Test each configuration change

**Expected Result:**
- Custom intervals are respected exactly
- Settings changes take effect immediately
- Disabling notifications stops all health reminders
- Re-enabling restarts timers from current time

**Priority:** Medium
**Category:** Configuration

---

### TC-HN-011: Edge Case - Rapid Modal Dismissal
**Objective:** Verify behavior when user quickly dismisses modals
**Prerequisites:** Extension installed, modal notifications enabled
**Steps:**
1. Trigger health notification
2. Quickly dismiss modal without clicking buttons
3. Verify timer behavior
4. Trigger another notification immediately
5. Test rapid button clicking

**Expected Result:**
- System handles rapid dismissal gracefully
- Timer state remains consistent
- No duplicate notifications or timer issues
- User actions are processed correctly

**Priority:** Low
**Category:** Edge Cases

---

### TC-HN-012: Notification Accuracy During Breaks
**Objective:** Verify notifications don't appear during legitimate breaks
**Prerequisites:** Extension installed, notifications enabled
**Steps:**
1. Work until break notification appears
2. Click "I took a break!" 
3. Stop all activity for extended period
4. Resume work
5. Verify notification timing resets appropriately

**Expected Result:**
- Break acknowledgment resets notification timer
- System recognizes legitimate break time
- Notifications resume with fresh timing when work resumes
- No inappropriate notifications during actual breaks

**Priority:** Medium
**Category:** User Experience

---

### TC-HN-013: Debug Commands Testing
**Objective:** Verify debug commands for testing notifications work correctly
**Prerequisites:** Extension installed with debug commands available
**Steps:**
1. Execute debug command to trigger eye rest notification
2. Execute debug command to trigger stretch notification
3. Execute debug command to trigger break notification
4. Verify each notification appears with correct content
5. Test debug commands don't affect normal timing

**Expected Result:**
- Debug commands immediately trigger respective notifications
- Notifications appear with correct messages and buttons
- Debug triggers don't interfere with normal notification schedule
- Useful for development and testing

**Priority:** Low
**Category:** Development Tools

## Test Data Requirements
- Various workspace configurations
- Different notification interval settings
- Modal and non-modal configurations

## Environment Setup
- VS Code with extension installed
- Access to VS Code settings
- Ability to modify extension configuration
- Timer capability for precise timing verification
