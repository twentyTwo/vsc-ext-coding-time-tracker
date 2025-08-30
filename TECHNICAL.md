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

The extension includes built-in commands to generate comprehensive test data for development and testing purposes. These commands are hidden from end users by default and only available when explicitly enabled.

#### Enabling Test Data Commands

**Method 1: Via Settings UI**
1. Open VS Code Settings (`Ctrl+,`)
2. Search for `"enableDevCommands"`
3. Check the box for "Simple Coding Time Tracker › Enable Dev Commands"

**Method 2: Via settings.json**
```json
{
    "simpleCodingTimeTracker.enableDevCommands": true
}
```

#### Available Test Commands

Once enabled, the following commands become available in the Command Palette (`Ctrl+Shift+P`):

**`SCTT: Generate Test Data (Dev)`**
- Creates comprehensive test data for the last 90 days
- Generates 150-200 realistic time entries
- Includes 10 different projects, 12 Git branches, and 20 programming languages
- Session durations range from 15 minutes to 3 hours
- Automatically skips some days to simulate realistic patterns

**`SCTT: Delete Test Data (Dev)`**
- Safely removes ALL time tracking data with confirmation prompts
- Requires typing "DELETE ALL DATA" for safety
- Cannot be undone - use with caution

#### Test Data Structure

Generated test data includes:
```javascript
{
  date: "2025-08-30",           // ISO date string
  project: "React Dashboard",   // Random project name
  timeSpent: 120,              // Minutes (15-180 range)
  branch: "feature/dashboard", // Git branch name
  language: "typescript"       // Programming language
}
```

#### Security Features

- **Hidden by default**: Commands don't appear for end users
- **Configuration controlled**: Only visible when setting is enabled
- **Development mode fallback**: Always available in extension development
- **Clear labeling**: Commands marked with "(Dev)" suffix
- **Warning messages**: Shows helpful errors if commands are disabled

#### Testing Workflow

1. **Package your extension**: `npm run package`
2. **Install the package**: `code --install-extension your-package.vsix`
3. **Enable dev commands**: Set `enableDevCommands` to `true` in settings
4. **Generate test data**: Use `SCTT: Generate Test Data (Dev)` command
5. **Test extension features**: Verify charts, filtering, search functionality
6. **Clean up**: Use `SCTT: Delete Test Data (Dev)` to remove test data
7. **Disable dev commands**: Set `enableDevCommands` to `false`

This approach ensures test data generation works correctly with packaged extensions while keeping the functionality completely hidden from end users.

### Marketplace Publishing Tests

The extension uses a consolidated workflow with granular control for testing each marketplace individually. You can test publishing to specific marketplaces without affecting production.

#### Test Only Open VSX Registry

```bash
# Using GitHub CLI
gh workflow run build-and-publish.yml \
  --field publish_vscode=false \
  --field publish_openvsx=true \
  --field force_publish=true

# Or via GitHub UI:
# Actions → "Build and Publish Extension" → Run workflow
# ❌ Uncheck "Publish to VS Code Marketplace" 
# ✅ Check "Publish to Open VSX Registry"
# ✅ Check "Force publish" (if no version change)
```

#### Test Only VS Code Marketplace

```bash
# Using GitHub CLI
gh workflow run build-and-publish.yml \
  --field publish_vscode=true \
  --field publish_openvsx=false \
  --field force_publish=true

# Or via GitHub UI:
# Actions → "Build and Publish Extension" → Run workflow
# ✅ Check "Publish to VS Code Marketplace"
# ❌ Uncheck "Publish to Open VSX Registry"  
# ✅ Check "Force publish" (if no version change)
```

#### Test Both Marketplaces (Default)

```bash
# Using GitHub CLI
gh workflow run build-and-publish.yml \
  --field publish_vscode=true \
  --field publish_openvsx=true \
  --field force_publish=true

# Or via GitHub UI:
# Actions → "Build and Publish Extension" → Run workflow
# ✅ Check "Publish to VS Code Marketplace"
# ✅ Check "Publish to Open VSX Registry"
# ✅ Check "Force publish" (if testing without version change)
```

#### Workflow Input Parameters

| Parameter | Description | Default | Use Case |
|-----------|-------------|---------|----------|
| `publish_vscode` | Publish to VS Code Marketplace | `true` | Test VS Code publishing |
| `publish_openvsx` | Publish to Open VSX Registry | `true` | Test Open VSX publishing |
| `force_publish` | Force publish (ignore version change check) | `false` | Testing without version bump |

#### Testing Notes

- **Force Publish**: Use when testing without bumping the version in `package.json`
- **Individual Testing**: Disable one marketplace to test the other in isolation
- **Status Report**: The workflow provides detailed status for each marketplace
- **Artifacts**: VSIX files are stored as artifacts for 90 days for rollback capability

### Manual Testing Checklist

Before submitting a pull request:

1. Verify time tracking starts/stops correctly
2. Check status bar updates
3. Test inactivity detection
4. Validate data persistence
5. Check summary view visualizations
6. Test search and filtering
7. Verify theme compatibility