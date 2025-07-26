# Technical Documentation

This document contains technical details about the Simple Coding Time Tracker VS Code extension, including development setup, release processes, and internal architecture.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Visual Studio Code
- Git

### Project Structure
```
vsc-ext-coding-time-tracker/
├── src/                   # Source code
│   ├── extension.ts       # Main extension file
│   ├── statusBar.ts       # Status bar functionality
│   ├── summaryView.ts     # Summary view implementation
│   ├── timeTracker.ts     # Time tracking logic
│   ├── database.ts        # Database operations
│   └── utils.ts          # Utility functions
├── scripts/              # Development scripts
│   └── generate-test-data.js  # Test data generation
├── .github/workflows/    # GitHub Actions workflows
│   ├── release.yml      # Release automation
│   └── publish.yml      # Marketplace publishing
└── images/              # Documentation images
```

## Release Process

The extension uses GitHub Actions to automate the release process. There are two types of releases supported:

### Beta Releases

Beta releases are pre-release versions used for testing new features or changes before a stable release.

To create a beta release:
```bash
git tag v<version>-beta.<number>
git push origin v<version>-beta.<number>
```

Example:
```bash
git tag v3.2.1-beta.1
git push origin v3.2.1-beta.1
```

For multiple beta releases of the same version, increment the beta number:
- v3.2.1-beta.1
- v3.2.1-beta.2
- v3.2.1-beta.3

### Production Releases

Production releases are stable versions ready for general use.

To create a production release:
```bash
git tag v<version>
git push origin v<version>
```

Example:
```bash
git tag v3.2.1
git push origin v3.2.1
```

### Automated Actions

When a tag is pushed, the following automated actions are performed:

1. **Build Process**:
   - Checks out the code
   - Sets up Node.js environment
   - Installs dependencies
   - Compiles the TypeScript code
   - Packages the VS Code extension (.vsix file)

2. **Release Creation**:
   - Creates a GitHub release
   - Attaches the .vsix package to the release
   - Sets appropriate release metadata:
     - For beta releases:
       - Marked as "pre-release"
       - Tagged with "🧪 Beta Release"
       - Includes beta warning message
     - For production releases:
       - Marked as full release
       - Tagged with "🚀 Release"
       - Includes stable release message
   - Links to CHANGELOG.md for detailed changes

3. **Extension Publishing**:
   - Automatically publishes the extension to the Visual Studio Code Marketplace
   - Updates the extension version and metadata

### Best Practices

- Create beta releases from feature branches when testing new functionality
- Create production releases only from the main branch
- Always update the CHANGELOG.md before creating a new release
- Keep version numbers consistent between beta and production releases
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Test beta releases thoroughly before creating a production release

### Release Files

The release process is defined in two GitHub Actions workflow files:

1. `.github/workflows/release.yml`: Handles the release creation process
2. `.github/workflows/publish.yml`: Handles publishing to the VS Code Marketplace

## Internal Architecture

### Core Components

1. **Extension Entry Point (`extension.ts`)**
   - Activates the extension
   - Initializes core components
   - Registers VS Code commands
   - Handles workspace events

2. **Time Tracker (`timeTracker.ts`)**
   - Core time tracking logic
   - Activity detection
   - Session management
   - Project identification

3. **Database (`database.ts`)**
   - Data persistence layer
   - Time entry storage
   - Summary data generation
   - Search functionality

4. **Status Bar (`statusBar.ts`)**
   - Real-time time display
   - Activity status indication
   - Quick access to commands
   - Tooltip information

5. **Summary View (`summaryView.ts`)**
   - Interactive data visualization
   - Chart rendering
   - Search and filtering
   - Data export

6. **Utilities (`utils.ts`)**
   - Time formatting
   - Data processing
   - Helper functions

### Git Branch Tracking

The extension uses the `simple-git` library to monitor git branch changes and associate coding time with specific branches:

1. **Initialization**
   - The git watcher is initialized in `timeTracker.ts` through the `setupGitWatcher()` method
   - It checks if the current workspace is a git repository
   - Sets up an interval to periodically check for branch changes

2. **Branch Monitoring**
   - Checks for branch changes every 5 seconds (optimized from 1 second to reduce CPU load)
   - Uses `git.branch()` to get the current branch name
   - When a branch change is detected, the current session is saved and a new one is started

3. **Optimization Considerations**
   - The interval is cleared and recreated when appropriate to prevent multiple overlapping intervals
   - A locking mechanism prevents concurrent executions of branch checking
   - Proper cleanup is implemented when the extension is deactivated

### Data Flow

1. User activity triggers events in VS Code
2. TimeTracker processes these events and tracks active time
3. Data is periodically saved to the Database
4. StatusBar updates in real-time
5. SummaryView queries the Database for visualization

### Configuration Options

The extension supports several configuration options in `package.json`:

```json
{
  "simpleCodingTimeTracker.saveInterval": {
    "type": "number",
    "default": 5,
    "description": "Interval in seconds to save the current coding session"
  },
  "simpleCodingTimeTracker.inactivityTimeout": {
    "type": "number",
    "default": 300,
    "description": "Time in seconds of inactivity before tracking stops"
  }
}
```

## Contributing

For detailed contribution guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Testing

### Generate Test Data

The extension includes a script to generate test data for development: [ON PROGRESS]

```bash
npm run generate-test-data
```

This will create sample time entries for the last 90 days with varied projects and durations.

### Manual Testing Checklist

Before submitting a pull request:

1. Verify time tracking starts/stops correctly
2. Check status bar updates
3. Test inactivity detection
4. Validate data persistence
5. Check summary view visualizations
6. Test search and filtering
7. Verify theme compatibility