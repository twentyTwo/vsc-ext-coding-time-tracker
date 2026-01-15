# Copilot Instructions for Simple Coding Time Tracker

## Project Overview
VS Code extension that tracks coding time with visualization, health reminders, and git branch/language detection. Version 0.6.7, published to VS Code Marketplace and Open VSX.

## Architecture

### Core Components (all in `src/`)
- **extension.ts**: Main entry point; activates on startup; registers commands, event listeners, and manages component lifecycle
- **timeTracker.ts**: Tracks user activity (cursor, text edits, window focus); monitors git branches; manages inactivity/focus timeouts; coordinates with health notifications
- **database.ts**: Persists time entries via VS Code's globalState; each entry stores: date, project, timeSpent (minutes), branch, language
- **summaryView.ts**: Webview UI showing 4 chart types (project, timeline, heatmap, languages); handles search/filtering; ~2800 lines with HTML/CSS/JS embedded
- **settingsView.ts**: User-friendly settings UI; updates all tracker configuration
- **statusBar.ts**: Real-time timer display at bottom of editor; clickable to show summary
- **healthNotifications.ts**: Manages 3 health reminders (20-20-20 eye rule, stretch, break intervals)
- **logger.ts**: Centralized logging
- **utils.ts**: 50+ language detection from file extensions and VS Code language IDs; time formatting

### Data Flow
1. **Activity Detection** → Activity triggers cursor/text/hover event handlers in timeTracker
2. **Activity Tracking** → Updates lastCursorActivity; resets inactivity timeout
3. **Branch Monitoring** → Git watcher checks branch every 5 seconds; saves session and starts new one on branch change
4. **Time Accumulation** → Save interval (5 sec) calculates elapsed time; validates against 24-hour ceiling
5. **Database Persistence** → addEntry() to globalState; queried by summaryView for charts

### Configuration Management
Settings stored in package.json `contributes.configuration`; read via `vscode.workspace.getConfiguration()`. Key settings:
- `inactivityTimeout` (minutes): Stop tracking after inactivity in focused VS Code
- `focusTimeout` (minutes): Continue tracking N minutes after VS Code loses focus
- `statusBar.showSeconds`, `statusBar.icon`, `statusBar.backgroundStyle`
- `health.enableNotifications`, `health.eyeRestInterval`, `health.stretchInterval`, `health.breakInterval`

**Pattern**: Settings changes trigger `onDidChangeConfiguration` listener in extension.ts; notify components to reload config via updateConfiguration() methods.

## Critical Workflows

### Building & Packaging
```bash
npm install              # Install dependencies
npm run compile          # TypeScript → JavaScript to dist/
npm run package          # Create .vsix file via webpack
```

### Testing (see CONTRIBUTING.md § Testing the Extension)
1. **F5 in VS Code**: Launches Extension Development Host
2. **Enable dev commands**: Search "enableDevCommands" in settings
3. **Generate test data**: Command `SCTT: Generate Test Data (Dev)` creates 90-day dataset

### Release Process (TECHNICAL.md)
- **Beta**: `git tag v<version>-beta.<number> && git push origin v<version>-beta.<number>`
- **Production**: `git tag v<version> && git push origin v<version>`
- GitHub Actions auto-builds, creates release, publishes to Marketplace

### Git Branch Strategy
- `main`: Production releases → Marketplace
- `develop`: Beta testing
- `site`: GitHub Pages documentation (separate branch)
- `stats-data`: Statistics only

## Key Patterns & Conventions

### Event Management
- Use `vscode.* event listeners` for activity (onDidChangeTextEditorSelection, onDidChangeTextDocument, onDidChangeWindowState, onDidChangeActiveTextEditor)
- Always call `this.updateCursorActivity()` on any editor activity
- Store timers in private fields; clear with `clearTimeout()` / `clearInterval()`; clean up on deactivate

### Time Tracking Logic
- **Cursor inactivity**: 2.5 min default (configurable); reset on any editor activity
- **Focus timeout**: 3 min default; continues tracking N minutes after VS Code loses focus
- **Branch changes**: Save current session before starting new one (prevents cross-branch mixing)
- **Validation**: Reject time entries > 24 hours or <= 0

### Language Detection
`detectLanguageFromFile(filePath)` uses file extension map (~50+ languages); fallback to VS Code's languageId via `detectLanguageFromLanguageId(languageId)`. See [utils.ts](src/utils.ts) for full map.

### Database Migrations
If adding new TimeEntry fields, add migration logic in Database.migrateEntries() to backfill old entries (see branch/language migration pattern).

### Webview Communication
Webviews (summaryView, settingsView) use `webview.postMessage()` to send and `onDidReceiveMessage()` to receive. Commands passed as JSON: `{ command: 'name', data: {...} }`.

### Error Handling
- Wrap async operations in try-catch
- Use vscode.window.showErrorMessage() for user-facing errors
- Log via Logger.getInstance().log()
- Never silently fail on persistence or git operations

## Important Files Reference
- [package.json](package.json): Dependencies, extension config, scripts
- [TECHNICAL.md](TECHNICAL.md): Release process, CI/CD pipelines
- [CONTRIBUTING.md](CONTRIBUTING.md): Dev setup, testing commands
- [src/timeTracker.ts](src/timeTracker.ts): Core tracking—understand inactivity/focus logic here first
- [src/database.ts](src/database.ts): Understand TimeEntry schema and query patterns
