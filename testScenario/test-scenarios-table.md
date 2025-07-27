# Test Scenarios - Tabular Summary

## Complete Test Case Overview

| Test ID | Feature Area | Test Name | Objective | Priority | Category | Prerequisites | Expected Outcome |
|---------|--------------|-----------|-----------|----------|----------|---------------|------------------|
| **TIME TRACKING CORE** |
| TC-CORE-001 | Time Tracking | Basic Time Tracking Start/Stop | Verify that time tracking starts and stops correctly | High | Core Functionality | Extension installed and activated | Status bar shows active/stopped states, time accumulated correctly |
| TC-CORE-002 | Time Tracking | Cursor Activity Detection | Verify that cursor movements trigger activity detection | High | Activity Detection | Extension installed and activated | Cursor movements maintain active tracking, no false timeouts |
| TC-CORE-003 | Time Tracking | Text Changes Tracking | Verify that text editing triggers activity detection | High | Activity Detection | Extension installed and activated | All text operations maintain active tracking |
| TC-CORE-004 | Time Tracking | Multi-File Activity | Verify tracking continues across multiple files | Medium | Multi-File Support | Extension installed and activated | Seamless tracking across file switches |
| TC-CORE-005 | Time Tracking | Inactivity Timeout | Verify tracking stops after configured inactivity period | High | Timeout Management | Extension installed, 3min timeout | Tracking stops after exactly 3 minutes, resumes automatically |
| TC-CORE-006 | Time Tracking | Focus Timeout | Verify tracking handles VS Code window focus changes | Medium | Focus Management | Extension installed and activated | Tracking pauses when unfocused, resumes when focused |
| TC-CORE-007 | Time Tracking | Session Persistence | Verify that sessions are saved correctly | High | Data Persistence | Extension installed and activated | Sessions saved to database, data persists across restarts |
| TC-CORE-008 | Time Tracking | Project Detection | Verify that current project is detected correctly | Medium | Project Management | Extension installed, workspace folder opened | Project name matches workspace folder, updates automatically |
| TC-CORE-009 | Time Tracking | Edge Cases - Empty Workspace | Verify behavior when no workspace is open | Low | Edge Cases | Extension installed | Graceful handling, tracking works for individual files |
| TC-CORE-010 | Time Tracking | Performance - Long Sessions | Verify performance during extended tracking sessions | Medium | Performance | Extension installed and activated | No performance degradation, stable memory usage |
| **HEALTH NOTIFICATIONS** |
| TC-HN-001 | Health | Eye Rest Notification Basic Flow | Verify eye rest notifications appear at configured intervals | High | Health Notifications | Extension installed, 20min intervals, notifications enabled | Notification appears after 20min, timer auto-pauses/resumes, positive feedback |
| TC-HN-002 | Health | Eye Rest Snooze Functionality | Verify eye rest snooze works correctly | High | Health Notifications | Extension installed, eye rest notifications enabled | 5-minute snooze works, normal cycle resumes after snooze |
| TC-HN-003 | Health | Stretch Notification Basic Flow | Verify stretch notifications appear at configured intervals | High | Health Notifications | Extension installed, 45min intervals, notifications enabled | Notification appears after 45min, correct modal message, encouraging feedback |
| TC-HN-004 | Health | Stretch Snooze Functionality | Verify stretch reminder snooze works correctly | High | Health Notifications | Extension installed, stretch notifications enabled | 10-minute snooze works, normal 45min cycle resumes |
| TC-HN-005 | Health | Break Notification Basic Flow | Verify break notifications appear after 2+ hours | High | Health Notifications | Extension installed, 120min threshold, notifications enabled | Error-level notification after 2 hours, emphasizes health importance |
| TC-HN-006 | Health | Break Snooze Functionality | Verify break reminder snooze works correctly | High | Health Notifications | Extension installed, break notifications enabled | 15-minute snooze works, maintains urgency level |
| TC-HN-007 | Health | Modal vs Non-Modal Behavior | Verify notifications respect modal setting | Medium | Configuration | Extension installed with settings access | Modal setting controls UI blocking behavior |
| TC-HN-008 | Health | Auto-Pause and Resume Timer | Verify timer automatically pauses/resumes with modal notifications | High | Timer Integration | Extension installed, modal notifications enabled | Timer pauses during modal, resumes automatically |
| TC-HN-009 | Health | Multiple Notification Types Timing | Verify multiple notification types work together correctly | Medium | Integration | Extension installed, all notifications enabled | Independent timing for each type, no conflicts |
| TC-HN-010 | Health | Notification Settings Configuration | Verify all health notification settings work correctly | Medium | Configuration | Extension installed with configuration access | Custom intervals respected, enable/disable works |
| TC-HN-011 | Health | Edge Case - Rapid Modal Dismissal | Verify behavior when user quickly dismisses modals | Low | Edge Cases | Extension installed, modal notifications enabled | Graceful handling of rapid dismissal, consistent timer state |
| TC-HN-012 | Health | Notification Accuracy During Breaks | Verify notifications don't appear during legitimate breaks | Medium | User Experience | Extension installed, notifications enabled | Break acknowledgment resets timer appropriately |
| TC-HN-013 | Health | Debug Commands Testing | Verify debug commands for testing notifications work correctly | Low | Development Tools | Extension installed with debug commands | Debug commands trigger notifications immediately |
| **GIT BRANCH TRACKING** |
| TC-GIT-001 | Git | Basic Branch Detection | Verify that current git branch is detected correctly | High | Branch Detection | Extension installed, workspace is git repository | Extension correctly identifies current git branch |
| TC-GIT-002 | Git | Branch Change Detection | Verify that branch changes are detected and sessions managed correctly | High | Branch Management | Extension installed, git repository with multiple branches | Session saved on branch change, new session starts automatically |
| TC-GIT-003 | Git | Multiple Branch Switches | Verify handling of multiple rapid branch switches | High | Branch Management | Extension installed, git repository with 3+ branches | Each branch maintains separate time tracking |
| TC-GIT-004 | Git | Non-Git Repository Handling | Verify extension works correctly in non-git workspaces | Medium | Non-Git Support | Extension installed, workspace without git | Extension works normally, branch shows appropriate default |
| TC-GIT-005 | Git | Git Repository Initialization | Verify behavior when git is initialized in existing workspace | Low | Git Initialization | Extension installed, non-git workspace open | Extension adapts to new git repository automatically |
| TC-GIT-006 | Git | Branch Creation and Deletion | Verify handling of branch creation and deletion operations | Medium | Branch Lifecycle | Extension installed, git repository | New branches detected, deletion doesn't affect stored data |
| TC-GIT-007 | Git | Git Watcher Performance | Verify git monitoring doesn't impact VS Code performance | Medium | Performance | Extension installed, git repository with many branches | Minimal performance impact, stable memory usage |
| TC-GIT-008 | Git | Concurrent Git Operations | Verify extension handles concurrent git operations correctly | Medium | Concurrency | Extension installed, git repository | No conflicts with VS Code git features, locking prevents issues |
| TC-GIT-009 | Git | Corrupted Git Repository | Verify graceful handling of git repository issues | Low | Error Handling | Extension installed, ability to simulate git issues | Graceful error handling, automatic recovery when resolved |
| TC-GIT-010 | Git | Branch Name Edge Cases | Verify handling of unusual branch names | Low | Edge Cases | Extension installed, git repository | All valid git branch names supported |
| TC-GIT-011 | Git | Detached HEAD State | Verify behavior in git detached HEAD state | Low | Git States | Extension installed, git repository | Detached HEAD detected and handled appropriately |
| TC-GIT-012 | Git | Submodule Support | Verify tracking works correctly with git submodules | Low | Submodules | Extension installed, git repository with submodules | Main repo and submodules tracked appropriately |
| **STATUS BAR INTEGRATION** |
| TC-SB-001 | Status Bar | Basic Status Bar Display | Verify status bar shows time tracking information correctly | High | UI Display | Extension installed and activated | Status bar item visible, time updates in real-time |
| TC-SB-002 | Status Bar | Activity Status Indication | Verify status bar reflects current tracking state | High | Status Indication | Extension installed and activated | Clear visual distinction between active/inactive states |
| TC-SB-003 | Status Bar | Manual Save Command | Verify status bar click triggers manual save | High | Manual Commands | Extension installed, tracking active | Status bar click triggers save, user gets confirmation |
| TC-SB-004 | Status Bar | Real-Time Updates | Verify status bar updates accurately in real-time | High | Real-Time Updates | Extension installed and activated | Updates every second, accurate time calculations |
| TC-SB-005 | Status Bar | Tooltip Information | Verify status bar tooltip provides useful information | Medium | User Information | Extension installed and activated | Tooltip shows project, branch, session duration |
| TC-SB-006 | Status Bar | Multiple Project Display | Verify status bar correctly shows information for different projects | Medium | Multi-Project Support | Extension installed, multiple workspaces available | Status bar reflects current active project |
| TC-SB-007 | Status Bar | Status Bar During Health Notifications | Verify status bar behavior during health notifications | Medium | Health Integration | Extension installed, health notifications enabled | Status bar shows paused state during modal |
| TC-SB-008 | Status Bar | Long Duration Display | Verify status bar handles long tracking sessions correctly | Medium | Display Formatting | Extension installed, ability to simulate long sessions | Time format scales appropriately for long durations |
| TC-SB-009 | Status Bar | Status Bar Command Registration | Verify status bar command is properly registered and accessible | Low | Command Registration | Extension installed and activated | Commands properly registered in VS Code |
| TC-SB-010 | Status Bar | Status Bar Positioning and Themes | Verify status bar integration with different VS Code themes | Low | Theme Compatibility | Extension installed, access to theme selection | Visible and readable in all themes |
| TC-SB-011 | Status Bar | Status Bar Performance | Verify status bar updates don't impact VS Code performance | Medium | Performance | Extension installed and activated | Minimal CPU impact, no interference with operations |
| TC-SB-012 | Status Bar | Status Bar Error Handling | Verify status bar handles errors gracefully | Low | Error Handling | Extension installed, ability to simulate errors | Appropriate error state shown, graceful recovery |
| **DATA PERSISTENCE & DATABASE** |
| TC-DB-001 | Database | Basic Data Entry Storage | Verify that time entries are stored correctly in database | High | Data Storage | Extension installed, database accessible | Time entry saved with accurate duration and project |
| TC-DB-002 | Database | Multiple Session Storage | Verify multiple tracking sessions are stored independently | High | Multi-Session Storage | Extension installed and activated | Two separate entries created, no interference |
| TC-DB-003 | Database | Data Retrieval Accuracy | Verify stored data can be retrieved accurately | High | Data Retrieval | Extension installed, sample data in database | All queries return correct data, filtering works |
| TC-DB-004 | Database | Database Schema Integrity | Verify database schema is correct and consistent | Medium | Schema Management | Extension installed, database access | Schema matches expected structure, proper indexing |
| TC-DB-005 | Database | Data Persistence Across Restarts | Verify data persists when VS Code is restarted | High | Persistence | Extension installed with existing data | All data available after restart, no data loss |
| TC-DB-006 | Database | Large Dataset Performance | Verify database performance with large amounts of data | Medium | Performance | Extension installed, ability to generate test data | Queries complete in reasonable time, stable memory |
| TC-DB-007 | Database | Concurrent Access Handling | Verify database handles concurrent operations correctly | Medium | Concurrency | Extension installed and activated | No data corruption, proper locking prevents conflicts |
| TC-DB-008 | Database | Data Migration and Upgrades | Verify database schema upgrades work correctly | Low | Migration | Extension with older database version | Migration completes without errors, data preserved |
| TC-DB-009 | Database | Error Recovery and Corruption Handling | Verify extension handles database errors gracefully | Low | Error Handling | Extension installed, ability to simulate database issues | Extension handles errors without crashing |
| TC-DB-010 | Database | Date and Time Handling | Verify date/time storage and retrieval works correctly across timezones | Medium | Date/Time Handling | Extension installed, ability to change timezone | Consistent date format, timezone changes handled |
| TC-DB-011 | Database | Data Export and Import | Verify data can be exported and imported correctly | Low | Data Portability | Extension installed with sample data | Export includes all data, import restores correctly |
| TC-DB-012 | Database | Storage Location and Permissions | Verify database storage location is appropriate and accessible | Low | Storage Management | Extension installed on various operating systems | Database stored appropriately, correct permissions |
| **CONFIGURATION & SETTINGS** |
| TC-CFG-001 | Configuration | Default Configuration Values | Verify extension loads with correct default settings | High | Default Settings | Fresh VS Code installation, extension newly installed | All settings have appropriate defaults matching documentation |
| TC-CFG-002 | Configuration | Inactivity Timeout Configuration | Verify inactivity timeout setting works correctly | High | Timeout Settings | Extension installed and activated | Tracking stops after configured timeout, immediate effect |
| TC-CFG-003 | Configuration | Focus Timeout Configuration | Verify focus timeout setting works correctly | High | Timeout Settings | Extension installed and activated | Focus timeout affects window focus behavior correctly |
| TC-CFG-004 | Configuration | Health Notification Settings | Verify all health notification settings work correctly | High | Health Settings | Extension installed with settings access | Custom intervals respected, enable/disable works |
| TC-CFG-005 | Configuration | Setting Validation | Verify invalid configuration values are handled correctly | Medium | Validation | Extension installed with settings access | Invalid values rejected, appropriate error messages |
| TC-CFG-006 | Configuration | Configuration Persistence | Verify settings persist across VS Code sessions | High | Persistence | Extension installed and activated | All custom settings persist across restarts |
| TC-CFG-007 | Configuration | Workspace vs User Settings | Verify workspace settings override user settings correctly | Medium | Settings Scope | Extension installed, workspace with settings file | Workspace settings take precedence over user settings |
| TC-CFG-008 | Configuration | Real-time Configuration Updates | Verify configuration changes take effect without restart | Medium | Live Updates | Extension installed and running | Setting changes apply immediately without restart |
| TC-CFG-009 | Configuration | Configuration UI Integration | Verify settings integrate properly with VS Code settings UI | Medium | UI Integration | Extension installed and activated | All settings visible and editable in VS Code settings |
| TC-CFG-010 | Configuration | Export and Import Configuration | Verify settings can be exported and shared | Low | Portability | Extension installed with custom settings | Settings included in VS Code export/import |
| TC-CFG-011 | Configuration | Configuration Migration | Verify settings migrate correctly between extension versions | Low | Migration | Extension with older configuration format | Settings preserved during upgrade, new defaults applied |
| TC-CFG-012 | Configuration | Configuration Performance | Verify configuration loading doesn't impact performance | Low | Performance | Extension installed with complex configuration | Fast configuration loading, minimal performance impact |

## Test Execution Summary

### Priority Distribution
- **High Priority**: 32 test cases (40.5%)
- **Medium Priority**: 35 test cases (44.3%) 
- **Low Priority**: 12 test cases (15.2%)

### Feature Distribution
- **Time Tracking Core**: 10 test cases
- **Health Notifications**: 13 test cases
- **Git Branch Tracking**: 12 test cases
- **Status Bar Integration**: 12 test cases
- **Data Persistence & Database**: 12 test cases
- **Configuration & Settings**: 12 test cases

### Category Breakdown
| Category | Count | Priority Focus |
|----------|-------|----------------|
| Core Functionality | 8 | High |
| Health Notifications | 13 | High/Medium |
| Activity Detection | 3 | High |
| Data Storage/Retrieval | 8 | High/Medium |
| Configuration | 12 | High/Medium |
| Performance | 6 | Medium |
| Error Handling | 6 | Low/Medium |
| Edge Cases | 8 | Low |
| UI Integration | 7 | Medium |
| Git Integration | 12 | High/Medium |

## Test Environment Requirements

### Minimum Setup
- VS Code (latest stable version)
- Extension installed in development mode
- Git repository for git-related tests
- Multiple workspace folders
- Access to VS Code settings

### Advanced Setup
- Multiple operating systems (Windows, macOS, Linux)
- VS Code Insiders for compatibility testing
- Large test datasets (1000+ entries)
- Performance monitoring tools
- Network simulation for offline testing

## Execution Recommendations

### Daily Testing (High Priority)
- TC-CORE-001, TC-CORE-002, TC-CORE-005, TC-CORE-007
- TC-HN-001, TC-HN-002, TC-HN-003, TC-HN-005
- TC-GIT-001, TC-GIT-002, TC-GIT-003
- TC-SB-001, TC-SB-002, TC-SB-003, TC-SB-004
- TC-DB-001, TC-DB-002, TC-DB-003, TC-DB-005
- TC-CFG-001, TC-CFG-002, TC-CFG-004, TC-CFG-006

### Weekly Testing (Medium Priority)
- All remaining Medium priority test cases
- Cross-platform compatibility tests
- Performance benchmarks

### Release Testing (All Priority Levels)
- Complete test suite execution
- Regression testing
- User acceptance scenarios
