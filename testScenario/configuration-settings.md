# Configuration & Settings - Test Cases

## Overview
Extension configuration management including user settings, default values, setting validation, and configuration persistence.

## Test Cases

### TC-CFG-001: Default Configuration Values
**Objective:** Verify extension loads with correct default settings
**Prerequisites:** Fresh VS Code installation, extension newly installed
**Steps:**
1. Install extension for first time
2. Check all configuration values
3. Verify defaults match documentation
4. Start tracking with default settings
5. Verify all features work with defaults

**Expected Result:**
- All settings have appropriate default values
- Default inactivity timeout: 180 seconds
- Default focus timeout: 180 seconds
- Health notifications enabled by default
- Modal notifications enabled by default
- Eye rest interval: 20 minutes
- Stretch interval: 45 minutes
- Break threshold: 120 minutes

**Priority:** High
**Category:** Default Settings

---

### TC-CFG-002: Inactivity Timeout Configuration
**Objective:** Verify inactivity timeout setting works correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Set inactivity timeout to 60 seconds
2. Start tracking activity
3. Stop all activity and wait exactly 60 seconds
4. Verify tracking stops
5. Test with different timeout values (30s, 300s)

**Expected Result:**
- Tracking stops after configured timeout period
- Setting change takes effect immediately
- All configured values work correctly
- No tracking beyond timeout period

**Priority:** High
**Category:** Timeout Settings

---

### TC-CFG-003: Focus Timeout Configuration
**Objective:** Verify focus timeout setting works correctly
**Prerequisites:** Extension installed and activated
**Steps:**
1. Set focus timeout to 120 seconds
2. Start tracking in VS Code
3. Switch to another application
4. Wait for configured timeout period
5. Verify tracking behavior

**Expected Result:**
- Tracking pauses after configured focus timeout
- Setting affects VS Code window focus behavior
- Tracking resumes when VS Code regains focus
- Timeout value is respected exactly

**Priority:** High
**Category:** Timeout Settings

---

### TC-CFG-004: Health Notification Settings
**Objective:** Verify all health notification settings work correctly
**Prerequisites:** Extension installed with access to settings
**Steps:**
1. Modify eye rest interval (e.g., to 15 minutes)
2. Modify stretch interval (e.g., to 30 minutes)
3. Modify break threshold (e.g., to 90 minutes)
4. Enable/disable notifications
5. Test modal vs non-modal settings

**Expected Result:**
- Custom intervals are respected exactly
- Enable/disable setting controls all notifications
- Modal setting affects notification behavior
- Settings changes take effect immediately
- All intervals work independently

**Priority:** High
**Category:** Health Settings

---

### TC-CFG-005: Setting Validation
**Objective:** Verify invalid configuration values are handled correctly
**Prerequisites:** Extension installed with access to settings
**Steps:**
1. Attempt to set negative timeout values
2. Set extremely large timeout values
3. Set invalid data types for settings
4. Test empty or null values
5. Verify extension behavior with invalid settings

**Expected Result:**
- Invalid values are rejected or corrected
- Extension provides appropriate error messages
- Fallback to default values when necessary
- No crashes due to invalid configuration
- User guidance for correcting invalid settings

**Priority:** Medium
**Category:** Validation

---

### TC-CFG-006: Configuration Persistence
**Objective:** Verify settings persist across VS Code sessions
**Prerequisites:** Extension installed and activated
**Steps:**
1. Modify several configuration values
2. Restart VS Code
3. Verify all settings maintained
4. Make additional changes
5. Test persistence across multiple restarts

**Expected Result:**
- All custom settings persist across restarts
- No settings reset to defaults unintentionally
- Configuration file maintains integrity
- Settings available immediately after restart

**Priority:** High
**Category:** Persistence

---

### TC-CFG-007: Workspace vs User Settings
**Objective:** Verify workspace settings override user settings correctly
**Prerequisites:** Extension installed, workspace with settings file
**Steps:**
1. Set user-level configuration values
2. Create workspace-specific settings
3. Verify workspace settings take precedence
4. Open different workspace
5. Verify settings change appropriately

**Expected Result:**
- Workspace settings override user settings
- User settings used when no workspace override
- Settings scope handled correctly by VS Code
- No conflicts between setting levels

**Priority:** Medium
**Category:** Settings Scope

---

### TC-CFG-008: Real-time Configuration Updates
**Objective:** Verify configuration changes take effect without restart
**Prerequisites:** Extension installed and running
**Steps:**
1. Start tracking activity
2. Change inactivity timeout while tracking
3. Change health notification intervals
4. Enable/disable features while active
5. Verify all changes apply immediately

**Expected Result:**
- Setting changes apply without restart required
- Active tracking adapts to new settings
- Health notification timers update appropriately
- No need to restart extension for settings to take effect

**Priority:** Medium
**Category:** Live Updates

---

### TC-CFG-009: Configuration UI Integration
**Objective:** Verify settings integrate properly with VS Code settings UI
**Prerequisites:** Extension installed and activated
**Steps:**
1. Open VS Code settings
2. Navigate to extension settings
3. Verify all settings are visible and editable
4. Test setting descriptions and help text
5. Verify setting categories and organization

**Expected Result:**
- All settings visible in VS Code settings UI
- Descriptions are clear and helpful
- Settings properly categorized
- UI controls appropriate for setting types
- Help text provides sufficient guidance

**Priority:** Medium
**Category:** UI Integration

---

### TC-CFG-010: Export and Import Configuration
**Objective:** Verify settings can be exported and shared
**Prerequisites:** Extension installed with custom settings
**Steps:**
1. Configure extension with custom values
2. Export VS Code settings
3. Import settings on different installation
4. Verify extension configuration transferred
5. Test with partial configuration imports

**Expected Result:**
- Extension settings included in VS Code export
- Import correctly applies extension settings
- Partial imports handle missing values gracefully
- Settings transfer maintains data integrity

**Priority:** Low
**Category:** Portability

---

### TC-CFG-011: Configuration Migration
**Objective:** Verify settings migrate correctly between extension versions
**Prerequisites:** Extension with older configuration format
**Steps:**
1. Install older version with settings
2. Upgrade to newer extension version
3. Verify settings migration occurs
4. Check for new default values
5. Test backwards compatibility

**Expected Result:**
- Existing settings preserved during upgrade
- New settings get appropriate default values
- Migration completes without user intervention
- No data loss during migration process

**Priority:** Low
**Category:** Migration

---

### TC-CFG-012: Configuration Performance
**Objective:** Verify configuration loading doesn't impact performance
**Prerequisites:** Extension installed with complex configuration
**Steps:**
1. Create large configuration with many settings
2. Monitor extension startup time
3. Test configuration change response time
4. Verify impact on tracking performance
5. Check memory usage of configuration system

**Expected Result:**
- Configuration loading is fast (<1 second)
- Setting changes respond immediately
- No performance impact on tracking
- Minimal memory usage for configuration
- Efficient configuration management

**Priority:** Low
**Category:** Performance

## Test Data Requirements
- Various configuration value combinations
- Invalid configuration values for testing validation
- Workspace-specific setting files
- Multiple VS Code installations for migration testing

## Environment Setup
- VS Code with extension installed
- Access to VS Code settings interface
- Multiple workspaces for testing scope
- Ability to modify configuration files directly
- Different extension versions for migration testing
