🌐 **Website**: [https://twentytwo.github.io/vsc-ext-coding-time-tracker/](https://twentytwo.github.io/vsc-ext-coding-time-tracker/)

**📖 For detailed configuration, advanced features, and complete documentation, see the [Simple Coding Time Tracker Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki) in our wiki.**

📦 **Installation:** [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=noorashuvo.simple-coding-time-tracker) (VS Code) | [Open VSX Registry](https://open-vsx.org/extension/noorashuvo/simple-coding-time-tracker) (Cursor, Windsurf, Trae, VS Codium etc) 


# Simple Coding Time Tracker: A Visual Studio Code Extension
<div style="display: flex; align-items: center;">
  <img src="icon-sctt.png" alt="Simple Coding Time Tracker Icon" width="100" style="margin-right: 20px;">
</div>

Simple Coding Time Tracker is a powerful extension for Visual Studio Code that helps you monitor and analyze your coding time. If you are curious about your coding habits, this extension covers you.

## Features

- **Automatic Time Tracking**: Seamlessly tracks your coding time in the background.
- **Project and Branch Tracking**: Organizes time data by project and Git branches for comprehensive analysis.
- **Language Tracking**: Automatically detects and tracks time spent in different programming languages.
- **Smart Activity Detection**: Automatically pauses tracking during periods of inactivity.
- **Focused Work Detection**: Intelligently tracks time even when VS Code isn't focused.
- **Health Notification System**: Proactive reminders to promote healthy coding habits with scientifically backed intervals.
- **Dedicated Settings View**: Comprehensive settings interface accessible via the summary view with easy-to-use controls for all configuration options.
- **Customizable Status Bar**:
  - Show/Hide Seconds: Toggle seconds display to reduce distractions
  - Custom Icons: Choose any emoji or VS Code Codicon as the timer icon
  - Background Styles: Select from default, warning (yellow), or error (red) backgrounds
  - Custom Colors: Apply custom hex colors or theme color references to the status bar text
  - Combined Display: Timer and notification status in a single status bar item
  - Quick Actions: Click timer to save session and open summary, view notification status via bell icon
- **Developer Insights Dashboard**:
  - Most Productive Day: Shows your best coding day with average time
  - Languages Used: Count of languages with most-used language highlight
  - Projects Worked: Number of projects with most active project highlight
  - Longest Streak: Track your coding streak with animated flame indicator
- **Coding Time Analytics**:
  - Time Summary: Horizontal bar chart comparing today, week, month, year, and all-time totals
  - Daily Average: Visual breakdown of daily coding patterns
  - Weekly Progress: Line chart showing weekly trends
  - Monthly Trend: Area chart displaying monthly progression
- **Interactive Data Visualization**:
  - Project Summary Chart: Visual breakdown of time spent on each project
  - Daily Activity Timeline: Interactive line chart showing your coding patterns (last 30 days)
  - Activity Heatmap: 3-month calendar view showing coding intensity with detailed tooltips
  - Language Distribution Chart: Visual breakdown of time spent in different programming languages
  - Theme-Aware Charts: Automatically adapts to VS Code's light/dark themes
- **Advanced Search & Filtering**:
  - Date Range Selection: Filter data by specific time periods
  - Project Filtering: Focus on specific projects
  - Branch Filtering: Filter by Git branches (dynamically updates based on selected project)
  - Language Filtering: Focus on specific programming languages
  - Quick Reset: One-click reset for search filters
- **Data Persistence**: Safely stores your time data for long-term analysis.

## Time Tracking Details
The extension tracks your coding time by monitoring file changes and user activity within Visual Studio Code. It uses a combination of timers and event listeners to ensure accurate tracking without impacting performance. The extension automatically detects the programming language you're working with based on file extensions and VS Code's language detection.

**📖 For detailed configuration, advanced features, and complete documentation, see the [Time Tracking Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Time-Tracking) in our wiki.**

## Health Notification System Details

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
3. Filter by project, branch, and/or language:
   - Choose a specific project to see all its branches
   - Select a branch to see time data for that specific branch
   - Select a language to see time data for that specific programming language
   - The branch dropdown automatically updates to show only branches from the selected project
4. Click "Search" to apply filters
5. Use "Reset" to clear all filters and refresh the view

The charts and visualizations will automatically update to reflect your selected project, branch, and language filters.

### Configuration Options

You can customize the extension's behavior through VS Code settings or the dedicated Settings view:

**Method 1: Using the Settings View (Recommended)**
1. Open the Coding Time Summary view by clicking on the status bar or using the command `SCTT: Show Coding Time Summary`
2. Click the "Settings" button in the top-right corner of the summary view
3. Configure all settings through the user-friendly interface with descriptions and validation
4. Click "Save Settings" to apply changes

**Method 2: Using VS Code Settings**
1. Open VS Code Settings (Ctrl+, or Cmd+, on macOS)
2. Search for "Simple Coding Time Tracker"

**Available settings:**  
   - **Time Tracking Settings**:
     - **Inactivity Timeout**: How long to wait before stopping the timer when no activity is detected but you are focused on VS Code (in minutes)
       - Default: 2.5 minutes
       - Lower values will stop tracking sooner when you're not actively coding
       - Higher values will continue tracking for longer during breaks
     - **Focus Timeout**: How long to continue tracking after VS Code loses focus (in minutes)
       - Default: 3 minutes
       - Determines how long to keep tracking when you switch to other applications
       - Useful for when you're referencing documentation or testing your application
   
   - **Status Bar Display Settings**:
     - **Show Seconds**: Display seconds in the status bar time (HH:MM:SS)
       - Default: true
       - Disable to reduce distractions and show only hours and minutes (HH:MM)
     - **Status Bar Icon**: Icon or Codicon name to display before the timer
       - Default: '$(code)'
       - Supports emojis (e.g., '💻', '⏱️') or VS Code Codicons (e.g., '$(clock)', '$(rocket)')
     - **Background Style**: Background color style for the timer in the status bar
       - Default: 'warning' (yellow)
       - Options: 'default' (theme color), 'warning' (yellow), 'error' (red)
     - **Custom Color**: Custom color for the timer text
       - Default: '' (empty, uses theme default)
       - Supports hex colors (e.g., '#FFAA00') or VS Code theme color references (e.g., 'editor.foreground')
   
   - **Health Notifications**: Configure health reminder settings
     - **Enable Notifications**: Enable/disable all health notifications (default: false)
     - **Modal Notifications**: Enable/disable modal behavior for health notifications (default: true)
     - **Eye Rest Interval**: Frequency of eye rest reminders in minutes (default: 20) - Based on 20-20-20 rule
     - **Stretch Interval**: Frequency of stretch reminders in minutes (default: 30) - Recommended for posture health
     - **Break Threshold**: Coding duration before suggesting a break in minutes (default: 90) - Based on ultradian rhythms
   
   - **Developer Settings**:
     - **Enable Dev Commands**: Enable development commands for testing (default: false)
       - Only enable this for testing purposes
       - When enabled, adds 'Generate Test Data' and 'Delete Test Data' commands


## Screenshots

### Coding time summary
The summary page provides a detailed report of your coding activity with interactive charts and visualizations:
- **Developer Insights Dashboard**:
  - Most Productive Day with average time breakdown
  - Languages Used count with most-used language highlight
  - Projects Worked count with most active project highlight
  - Longest Streak tracking with animated flame indicator
- **Coding Time Analytics**:
  - Time Summary comparing today, week, month, year, and all-time totals
  - Daily Average showing coding patterns over last 30 days
  - Weekly Progress line chart with trend visualization
  - Monthly Trend area chart displaying progression
- **Interactive Charts**:
  - Project distribution chart showing time allocation across projects
  - Daily activity timeline with interactive tooltips (last 30 days)
  - 3-month activity heatmap for long-term pattern analysis
  - Language distribution chart showing time spent in different programming languages
  - Theme-aware visualizations that adapt to your VS Code theme
- **Advanced Search & Filtering**:
  - Date range selection for specific time periods
  - Project and branch filtering with dynamic branch updates
  - Quick reset button to clear all filters
- **Quick Access**:
  - Settings button in header for instant configuration access
  - Click status bar timer to save session and open summary
  - Bell icon shows health notification status at a glance

![Coding Summary](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/sctt-light.png)

#### Dark theme
![Coding Summary Dark Theme](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/sctt-dark.png)


#### Status Bar
Status bar resets to zero at midnight each day and hence shows the coding time for the current day.
![Status Bar](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/statusbar.png)

#### Tooltip
Tooltip shows the total coding time weekly, monthly and all time basis.
![Tooltip](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/tooltip.png)


#### Settings View
The dedicated settings view provides an easy-to-use interface for configuring all extension options. Access it by clicking the "Settings" button in the summary view header.
![Settings](https://raw.githubusercontent.com/twentyTwo/static-file-hosting/main/vsc-ext-coding-time-tracker-files/settings.png)


## 📚 Documentation

For comprehensive documentation, guides, and testing information, visit our **[Documentation Wiki](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki)**:

- **[Health Notifications Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Health-Notifications)** - Complete health notification configuration and features
- **[Time Tracking Guide](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Time-Tracking)** - How time tracking works internally  
- **[Test Scenarios](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/Test-Scenarios)** - Comprehensive testing documentation
- **[Development Roadmap](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki/TODO)** - Current tasks and future plans

## Testing & Development

For developers and testers, the extension includes built-in test data generation commands:

### Enabling Test Commands
1. Open Settings (`Ctrl+,`)
2. Search: `"enableDevCommands"`  
3. Enable "Simple Coding Time Tracker › Enable Dev Commands"

### Available Test Commands
- **`SCTT: Generate Test Data (Dev)`** - Creates realistic test data for 90 days
- **`SCTT: Delete Test Data (Dev)`** - Safely removes all tracking data

**Note**: These commands are hidden from regular users and only appear when explicitly enabled in settings.

For complete testing documentation, see [TECHNICAL.md](TECHNICAL.md).

## Technical Documentation

For technical details about development, release process, and internal architecture, please see [TECHNICAL.md](TECHNICAL.md).

## Changelog

### [0.7.0] - 2026-1-18
- Added comprehensive status bar customization options
- Implemented show/hide seconds toggle for reduced distractions
- Added custom icon support (emojis and VS Code Codicons)
- Implemented background style selection (default, warning, error)
- Added custom color picker for status bar text
- Combined timer and notification status in single status bar item
- Enhanced tooltip with health notification status display
- Added click-to-save functionality on status bar timer

### [0.6.6] - 2025-11-28
- Added Developer Insights dashboard with productivity analytics
- Implemented Most Productive Day tracking with average time
- Added Languages Used counter with most-used language highlight
- Implemented Projects Worked counter with most active project
- Added Longest Streak tracking with animated flame indicator
- Enhanced summary view with new analytics widgets
- Added Coding Time Analytics section with multiple charts
- Implemented Time Summary horizontal bar chart
- Added Daily Average visualization with 30-day history
- Implemented Weekly Progress line chart with trend analysis
- Added Monthly Trend area chart for progression tracking
- Enhanced 3-month activity heatmap with detailed tooltips
- Improved chart responsiveness and interactivity

### [0.6.5] - 2025-11-10
- Enhanced summary view with improved data visualization
- Added Settings button in summary view header for quick access
- Improved daily activity timeline to show last 30 days
- Enhanced project distribution chart with better sorting
- Improved search and filtering UX with dynamic branch updates
- Added better tooltips and hover effects on charts
- Enhanced theme compatibility for all visualizations

### [0.6.4] - 2025-10-25
- Improved status bar display with better formatting
- Enhanced notification status indicator with bell icon
- Added comprehensive tooltip information including project and branch
- Improved time formatting consistency across all displays
- Enhanced data persistence and reliability
- Improved error handling and logging

### [0.6.3] - 2025-10-10
- Added dedicated Settings View accessible from the summary view header
- Implemented `SCTT: Open Settings` command for direct access to settings interface
- Enhanced user experience with intuitive settings management through webview interface
- Added Settings button to summary view header for quick access to configuration options
- All extension settings now available through both traditional VS Code settings and the new dedicated view

### [0.6.1] - 2025-08-30
- Added comprehensive test data generation commands for developers and testers
- Implemented `SCTT: Generate Test Data (Dev)` command that creates 90 days of realistic test data
- Added `SCTT: Delete Test Data (Dev)` command for safe cleanup of test data
- Test commands are hidden from end users by default and only visible when `enableDevCommands` setting is enabled
- Enhanced security with configuration-controlled command visibility
- Improved testing workflow for packaged extension installations
- Added progress indicators for test data generation process

### [0.6.0] - 2025-08-28
- Added comprehensive language tracking to monitor time spent in different programming languages
- Automatic language detection based on file extensions and VS Code language IDs
- Support for 50+ programming languages including JavaScript, TypeScript, Python, Java, C++, and more
- Enhanced search and filtering capabilities to include language-based filtering
- Language distribution visualization in summary charts
- All existing functionality preserved with seamless migration of historical data

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
