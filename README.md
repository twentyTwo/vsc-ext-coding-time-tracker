 **📖 For detailed configuration, advanced features, and complete documentation, see the [Health Notifications Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Health-Notifications) in our wiki.**

# Simple Coding Time Tracker: A Visual Studio Code Extension
<div style="display: flex; align-items: center;">
  <img src="icon-sctt.png" alt="Simple Coding Time Tracker Icon" width="100" style="margin-right: 20px;">
</div>

Simple Coding Time Tracker is a powerful extension for Visual Studio Code that helps you monitor and analyze your coding time. If you are curious about your coding habits, this extension covers you.

## Features

- **Automatic Time Tracking**: Seamlessly tracks your coding time in the background.
- **Project and Branch Tracking**: Organizes time data by project and Git branches for comprehensive analysis.
- **Smart Activity Detection**: Automatically pauses tracking during periods of inactivity.
- **Focused Work Detection**: Intelligently tracks time even when VS Code isn't focused.
- **Health Notification System**: Proactive reminders to promote healthy coding habits with scientifically backed intervals.
- **Interactive Data Visualization**:
  - Project Summary Chart: Visual breakdown of time spent on each project
  - Daily Activity Timeline: Interactive line chart showing your coding patterns
  - Activity Heatmap: 3-month calendar view showing coding intensity
  - Theme-Aware Charts: Automatically adapts to VS Code's light/dark themes
- **Advanced Search & Filtering**:
  - Date Range Selection: Filter data by specific time periods
  - Project Filtering: Focus on specific projects
  - Quick Reset: One-click reset for search filters
- **Data Persistence**: Safely stores your time data for long-term analysis.

## Health Notification System

The extension includes a comprehensive health notification system to promote healthy coding habits and prevent strain-related issues.

### 🔔 Smart Health Notifications
- **Eye Rest Reminders**: Every 20 minutes, get reminded to follow the 20-20-20 rule (look at something 20 feet away for 20 seconds)
- **Stretch Reminders**: Every 30 minutes, get reminded to stand up and stretch your back and neck - Recommended for posture health
- **Break Suggestions**: Every 90 minutes, get prompted to take a proper break with multiple options - Based on ultradian rhythms
These are default values and designed to help you maintain focus and prevent fatigue during long coding sessions. You can always customize these intervals in the settings.

**📖 For detailed configuration, advanced features, and complete documentation, see the [Health Notifications Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Health-Notifications) in our wiki.**

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "Simple Coding Time Tracker"
4. Click "Install"

## Usage

Once installed, the extension will automatically start tracking your coding time. You can view your current session time in the status bar at the bottom of the VSCode window.

### Using Search & Filters

1. In the summary view, locate the search form
2. Select a date range using the date pickers
3. Filter by project and/or branch:
   - Choose a specific project to see all its branches
   - Select a branch to see time data for that specific branch
   - The branch dropdown automatically updates to show only branches from the selected project
4. Click "Search" to apply filters
5. Use "Reset" to clear all filters and refresh the view

The charts and visualizations will automatically update to reflect your selected project and branch filters.

### Configuration Options

You can customize the extension's behavior through VS Code settings:

1. Open VS Code Settings (Ctrl+, or Cmd+, on macOS)
2. Search for "Simple Coding Time Tracker"
3. Available settings:  
   - **Inactivity Timeout**: How long to wait before stopping the timer when no activity is detected but you are focused on VS Code (in seconds)
     - Default: 150 seconds (2.5 minutes)
     - Lower values will stop tracking sooner when you're not actively coding
     - Higher values will continue tracking for longer during breaks
   - **Focus Timeout**: How long to continue tracking after VS Code loses focus (in seconds)
     - Default: 180 seconds (3 minutes)
     - Determines how long to keep tracking when you switch to other applications
     - Useful for when you're referencing documentation or testing your application
   - **Health Notifications**: Configure health reminder settings
     - **Modal Notifications**: Enable/disable modal behavior for health notifications (default: true)
     - **Enable Notifications**: Enable/disable all health notifications (default: true)
     - **Eye Rest Interval**: Frequency of eye rest reminders in minutes (default: 20) - Based on 20-20-20 rule
     - **Stretch Interval**: Frequency of stretch reminders in minutes (default: 30) - Recommended for posture health
     - **Break Threshold**: Coding duration before suggesting a break in minutes (default: 90) - Based on ultradian rhythms


## Screenshots

### Coding time summary
The summary page provides a detailed report of your coding activity with interactive charts and visualizations:
- Project distribution chart showing time allocation across projects
- Daily activity timeline with interactive tooltips
- 3-month activity heatmap for long-term pattern analysis
- Theme-aware visualizations that adapt to your VS Code theme
- Advanced search and filtering capabilities

![Coding Summary](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/sctt-light.png)

#### Dark theme
![Coding Summary Dark Theme](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/sctt-dark.png))


#### Status Bar
Status bar resets to zero at midnight each day and hence shows the coding time for the current day.
![Status Bar](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/statusbar.png)

#### Tooltip
Tooltip shows the total coding time weekly, monthly and all time basis.
![Tooltip](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/tooltip.png)


#### Settings
![Settings](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/settings.png)


## 📚 Documentation

For comprehensive documentation, guides, and testing information, visit our **[Documentation Wiki](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki)**:

- **[Health Notifications Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Health-Notifications)** - Complete health notification configuration and features
- **[Time Tracking Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Time-Tracking)** - How time tracking works internally  
- **[Test Scenarios](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Test-Scenarios)** - Comprehensive testing documentation
- **[Development Roadmap](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/TODO)** - Current tasks and future plans

## Technical Documentation

For technical details about development, release process, and internal architecture, please see [TECHNICAL.md](TECHNICAL.md).

## Changelog


### [0.5.0] - 2025-08-02
- Added comprehensive health notification system with customizable intervals
- Implemented **prominent, persistent notifications** that don't auto-dismiss:
  - Eye rest reminders (20-20-20 rule) every 20 minutes 
  - Stretch reminders every 30 minutes (Recommended for posture health)
  - Break suggestions every 90 minutes using (ultradian rhythms)

- Implemented toggle command for quick enable/disable of health notifications
- Health notifications automatically start/stop with time tracking
- All health notification intervals are fully configurable through VS Code settings

### [0.4.1] - 2025-07-26
- Fixed issue with excessive git processes being spawned
- Optimized git branch monitoring to reduce CPU load
- Reduced frequency of git checks from every 1 second to every 5 seconds
- Improved cleanup of interval timers to prevent memory leaks

### [0.4.0] - 2025-06-28
- Added Git branch tracking to monitor time spent on different branches
- Enhanced project view with branch-specific time tracking
- Implemented dynamic branch filtering based on selected project
- Improved charts to show time distribution across branches
- Added branch-specific data in search results and visualizations

### [0.3.9] - 2025-05-25
- Added Focus Timeout setting to intelligently track time when VS Code loses focus
- Fixed version tracking in GitHub Actions workflow to prevent publishing issues
- Updated documentation to clarify timeout settings and their purposes
- Enhanced error handling in the publishing workflow

### [0.3.4] - 2025-04-19
 - Handle multi-root workspaces, external files, and virtual files more effectively. 
 - Added a verify-changes job to check if a version update is required and ensure non-documentation files are modified before publishing. This prevents unnecessary releases.
 - Introduced a new workflow to automate the creation of beta and production releases, including attaching .vsix files and setting appropriate release metadata.
 - Added a new technical documentation file outlining the development setup, release process, internal architecture, and testing guidelines for the extension.

### [0.3.0] - 2025-04-14
- Added smart activity detection with configurable inactivity timeout
- Enhanced chart interactivity and responsiveness
- Improved theme compatibility for all visualizations
- Added quick reset button for search filters
- Refined chart tooltips and legends for better readability

### [0.2.3] - 2025-03-19
- Made the save interval configurable by the user, with a default of 5 seconds.
- Updated the documentation to reflect the new configuration option.

### [0.2.2] - 2024-10-04
- Added command to reset all timers
- Added a command to reset daily timer

### [0.2.1] - 2024-10-02
- Enhanced the UI of the summary view for a more professional look
- Implemented date range search functionality
- Added a reload button to reset search fields and refresh data
- Improved the layout and styling of the Total Coding Time section

### [0.1.4] 
- Initial release
- Automatic time tracking
- Project-based tracking
- Status bar display with tooltip
- Detailed summary view
- Data persistence

## Contributing

For developers interested in contributing to the project, please check out our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines and instructions.



