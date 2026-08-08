# Technical Documentation

This document contains technical details about the Simple Coding Insights VS Code extension, including development setup, release processes, and internal architecture.

## Current Status

**Version**: 0.6.3 | **Marketplaces**: [VS Code](https://marketplace.visualstudio.com/items?itemName=noorashuvo.simple-coding-time-tracker) | [Open VSX](https://open-vsx.org/extension/noorashuvo/simple-coding-time-tracker) | **Website**: [GitHub Pages](https://twentytwo.github.io/vsc-ext-coding-time-tracker/)

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Visual Studio Code
- Git

### Project Structure
```
vsc-ext-coding-time-tracker/
├── src/                   # Source code
│   ├── extension.ts       # Main entry point
│   ├── timeTracker.ts     # Core tracking logic
│   ├── database.ts        # Data persistence
│   ├── summaryView.ts     # Charts & visualization
│   ├── healthNotifications.ts # Health reminders
│   └── [other components] # statusBar, settingsView, logger, utils
├── docs/                  # Website (on site branch)
├── .github/workflows/     # CI/CD pipelines
└── package.json          # Extension configuration
```

## Branch Management

The repository uses a multi-branch strategy for organized development and deployment:

| Branch | Purpose | Deployment |
|--------|---------|------------|
| `main` | Production releases | VS Code Marketplace, Open VSX |
| `develop` | Beta releases & testing | Pre-release testing |
| `site` | GitHub Pages website | https://twentytwo.github.io/vsc-ext-coding-time-tracker/ |
| `stats-data` | Repository statistics | Data storage only |

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

- **Time Tracker**: Activity detection, inactivity/focus timeouts, Git branch tracking, 50+ language support
- **Database**: Local storage, CRUD operations, filtering, export
- **Summary View**: Interactive charts (project, timeline, heatmap, languages), theme-aware
- **Health Notifications**: Eye rest (20-20-20), stretch, break reminders with snooze
- **Status Bar**: Real-time display, tooltips, click to open summary

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

### Configuration

**Key Settings:**
- `inactivityTimeout`: 2.5 min (pause on inactivity)
- `focusTimeout`: 3 min (continue after focus loss)
- Health notifications: eye rest (20m), stretch (30m), breaks (90m)
- `enableDevCommands`: false (test data generation)

**Access:** Settings button in summary view OR VS Code settings

## Contributing

For detailed contribution guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Testing

### Dev Commands
Enable `enableDevCommands` → `SCTT: Generate Test Data (Dev)` creates 90 days of realistic data

### Manual Testing
F5 launches Extension Development Host for testing core features

## GitHub Pages Website

Site: https://twentytwo.github.io/vsc-ext-coding-time-tracker/ (on `site` branch)
See [WEBSITE.md](WEBSITE.md) for maintenance

## Documentation References

- **Branch Management**: [BRANCHES.md](BRANCHES.md) - Complete branch workflow guide
- **Website Maintenance**: [WEBSITE.md](WEBSITE.md) - Detailed website documentation
- **GitHub Pages Setup**: [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) - Initial deployment guide
- **Contributing Guidelines**: [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute to the project
- **User Documentation**: Available on the [GitHub Pages site](https://twentytwo.github.io/vsc-ext-coding-time-tracker/documentation.html)