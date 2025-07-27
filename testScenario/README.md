# Test Scenario Index

## Overview
This directory contains comprehensive test cases for the Simple Coding Time Tracker VS Code extension, organized by feature areas.

## Test Case Files

### Core Features
1. **[Time Tracking Core](./time-tracking-core.md)** - Core time tracking functionality including start/stop, activity detection, and session management
2. **[Git Branch Tracking](./git-branch-tracking.md)** - Git branch detection, session management per branch, and repository monitoring  
3. **[Status Bar Integration](./status-bar-integration.md)** - Status bar display, real-time updates, and manual commands
4. **[Data Persistence & Database](./data-persistence-database.md)** - Database operations, data storage, retrieval, and integrity

### Health & User Experience
5. **[Health Notifications](./health-notifications.md)** - Eye rest, stretch reminders, break notifications with modal interface
6. **[Configuration & Settings](./configuration-settings.md)** - User settings, validation, persistence, and configuration management

## Test Categories

### Priority Levels
- **High Priority**: Core functionality that must work correctly
- **Medium Priority**: Important features that enhance user experience  
- **Low Priority**: Edge cases and advanced features

### Test Types
- **Functional Testing**: Feature behavior verification
- **Integration Testing**: Component interaction testing
- **Performance Testing**: Resource usage and response time
- **UI Testing**: User interface and interaction testing
- **Error Handling**: Graceful failure and recovery testing
- **Edge Cases**: Unusual scenarios and boundary conditions

## Test Execution Guidelines

### Pre-Testing Setup
1. Install VS Code latest version
2. Install extension in development mode
3. Prepare test workspaces with various configurations
4. Set up git repositories for git-related tests
5. Configure different VS Code themes for UI testing

### Test Data Requirements
- Multiple workspace folders with different names
- Git repositories with multiple branches
- Large files (1000+ lines) for performance testing
- Various file types (.js, .ts, .md, .json, etc.)
- Test data generator script for large datasets

### Environment Variations
- **Operating Systems**: Windows, macOS, Linux
- **VS Code Versions**: Stable, Insiders
- **Workspace Types**: Single folder, multi-root workspace, no workspace
- **Git States**: Normal branches, detached HEAD, submodules
- **Network Conditions**: Online, offline, slow connections

## Test Case Naming Convention

### Format: `TC-[AREA]-[NUMBER]: [Description]`
- **TC**: Test Case prefix
- **AREA**: Feature area abbreviation
  - `CORE`: Time Tracking Core
  - `GIT`: Git Branch Tracking  
  - `SB`: Status Bar Integration
  - `DB`: Data Persistence & Database
  - `HN`: Health Notifications
  - `CFG`: Configuration & Settings
- **NUMBER**: Sequential number within area (001, 002, etc.)
- **Description**: Brief test objective

### Examples:
- `TC-CORE-001`: Basic Time Tracking Start/Stop
- `TC-HN-005`: Break Notification Basic Flow
- `TC-GIT-003`: Multiple Branch Switches

## Automation Potential

### High Automation Potential
- Configuration validation tests
- Database integrity tests  
- Performance benchmarks
- Basic functionality tests

### Manual Testing Required
- User interface interactions
- Visual feedback verification
- Complex user workflows
- Cross-platform compatibility

### Semi-Automated Possible
- Health notification timing
- Git branch change detection
- Status bar updates
- Error condition simulation

## Test Reporting

### Test Results Documentation
- Test case ID and description
- Execution date and environment
- Pass/Fail status with details
- Screenshots for UI-related issues
- Performance metrics where applicable
- Bug reports with reproduction steps

### Coverage Tracking
- Feature coverage percentage
- Test case execution status
- Risk areas requiring additional testing
- Regression test suite maintenance

## Continuous Testing

### Pre-Release Testing
- Execute all High Priority test cases
- Perform cross-platform testing
- Validate performance benchmarks
- Test upgrade scenarios

### Regular Testing
- Weekly execution of core functionality tests
- Monthly comprehensive test suite execution
- Performance monitoring and trending
- User feedback integration into test cases

## Contributing to Test Cases

### Adding New Test Cases
1. Follow the established naming convention
2. Include all required sections (Objective, Prerequisites, Steps, Expected Result)
3. Specify priority and category
4. Update this index file

### Modifying Existing Test Cases
1. Maintain backward compatibility where possible
2. Update test case version/date
3. Document changes and rationale
4. Verify related test cases still valid

## Tools and Resources

### Testing Tools
- VS Code Extension Development Host
- Git command line tools
- Performance monitoring utilities
- Database inspection tools
- Screenshot/recording software

### Documentation References
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Testing Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Git Documentation](https://git-scm.com/doc)
- Project README and technical documentation
