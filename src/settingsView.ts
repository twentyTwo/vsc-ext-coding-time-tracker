import * as vscode from 'vscode';

export class SettingsViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public show() {
        if (this.panel) {
            // Refresh HTML so newly added settings render for existing panels
            this.panel.webview.html = this.getHtmlContent();
            void this.sendCurrentSettings();
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'scttSettings',
            'Simple Coding Time Tracker - Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getHtmlContent();
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'loadSettings':
                        await this.sendCurrentSettings();
                        break;
                    case 'saveSettings':
                        await this.saveSettings(message.settings);
                        break;
                    case 'resetSettings':
                        await this.resetToDefaults();
                        break;
                }
            }
        );

        // Load current settings when panel opens
        this.sendCurrentSettings();
    }

    private async sendCurrentSettings() {
        if (!this.panel) return;

        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const settings = {
            inactivityTimeout: config.get('inactivityTimeout', 2.5),
            focusTimeout: config.get('focusTimeout', 3),
            statusBarShowSeconds: config.get('statusBar.showSeconds', true),
            statusBarIcon: config.get('statusBar.icon', '$(code)'),
            statusBarBackgroundStyle: config.get('statusBar.backgroundStyle', 'warning'),
            statusBarColor: config.get('statusBar.color', ''),
            healthEnableNotifications: config.get('health.enableNotifications', false),
            healthModalNotifications: config.get('health.modalNotifications', true),
            healthEyeRestInterval: config.get('health.eyeRestInterval', 20),
            healthStretchInterval: config.get('health.stretchInterval', 30),
            healthBreakThreshold: config.get('health.breakThreshold', 90),
            enableDevCommands: config.get('enableDevCommands', false)
        };

        this.panel.webview.postMessage({
            command: 'settingsLoaded',
            settings: settings
        });
    }

    private async saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');

        try {
            // Determine the target scope: Workspace if available, otherwise Global
            // This prevents "Unable to write to Workspace Settings because no workspace is opened" error
            // Note: workspaceFile is only defined for multi-root workspaces (.code-workspace files)
            // workspaceFolders is defined when any folder is opened in VS Code
            const hasWorkspace = vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0;
            const configTarget = hasWorkspace ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

            // Most settings should be saved to Workspace scope if available (default behavior in package.json)
            // Otherwise fall back to Global scope
            await config.update('inactivityTimeout', settings.inactivityTimeout, configTarget);
            await config.update('focusTimeout', settings.focusTimeout, configTarget);
            await config.update('statusBar.showSeconds', settings.statusBarShowSeconds, configTarget);
            await config.update('statusBar.icon', settings.statusBarIcon, configTarget);
            await config.update('statusBar.backgroundStyle', settings.statusBarBackgroundStyle, configTarget);
            await config.update('statusBar.color', settings.statusBarColor, configTarget);
            await config.update('health.enableNotifications', settings.healthEnableNotifications, configTarget);
            await config.update('health.modalNotifications', settings.healthModalNotifications, configTarget);
            await config.update('health.eyeRestInterval', settings.healthEyeRestInterval, configTarget);
            await config.update('health.stretchInterval', settings.healthStretchInterval, configTarget);
            await config.update('health.breakThreshold', settings.healthBreakThreshold, configTarget);
            
            // Only enableDevCommands has "scope": "application" in package.json, so it must be saved to Global
            await config.update('enableDevCommands', settings.enableDevCommands, vscode.ConfigurationTarget.Global);

            console.log('Settings saved successfully:', settings);
            vscode.window.showInformationMessage('✅ Settings saved successfully!');
            
            if (this.panel) {
                this.panel.webview.postMessage({ command: 'saveSuccess' });
            }
            
            // Force a status bar refresh after a small delay to ensure all config changes are applied
            // This is needed because multiple sequential config.update() calls can cause race conditions
            setTimeout(() => {
                vscode.commands.executeCommand('simpleCodingTimeTracker.refreshStatusBar');
            }, 100);
        } catch (error) {
            console.error('Failed to save settings:', error);
            vscode.window.showErrorMessage(`Failed to save settings: ${error}`);
        }
    }

    private async resetToDefaults() {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');

        try {
            // Determine the target scope: Workspace if available, otherwise Global
            // Note: workspaceFolders is defined when any folder is opened (not just .code-workspace files)
            const hasWorkspace = vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0;
            const configTarget = hasWorkspace ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;

            // Reset workspace-scoped settings (or global if no workspace)
            await config.update('inactivityTimeout', undefined, configTarget);
            await config.update('focusTimeout', undefined, configTarget);
            await config.update('statusBar.showSeconds', undefined, configTarget);
            await config.update('statusBar.icon', undefined, configTarget);
            await config.update('statusBar.backgroundStyle', undefined, configTarget);
            await config.update('statusBar.color', undefined, configTarget);
            await config.update('health.enableNotifications', undefined, configTarget);
            await config.update('health.modalNotifications', undefined, configTarget);
            await config.update('health.eyeRestInterval', undefined, configTarget);
            await config.update('health.stretchInterval', undefined, configTarget);
            await config.update('health.breakThreshold', undefined, configTarget);
            
            // Reset global-scoped settings
            await config.update('enableDevCommands', undefined, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage('✅ Settings reset to defaults!');
            await this.sendCurrentSettings();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to reset settings: ${error}`);
        }
    }

    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.36/dist/codicon.css">
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            color: var(--vscode-titleBar-activeForeground);
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 30px;
        }

        h2 {
            color: var(--vscode-symbolIcon-colorForeground);
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .setting-group {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .setting-item {
            margin-bottom: 20px;
        }

        .setting-item:last-child {
            margin-bottom: 0;
        }

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 5px;
            color: var(--vscode-input-foreground);
        }

        .description {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            line-height: 1.4;
        }

        input[type="number"], input[type="text"], select {
            width: 100%;
            max-width: 200px;
            padding: 6px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
        }

        input[type="number"]:focus, input[type="text"]:focus, select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .color-row {
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 320px;
        }

        input[type="color"] {
            width: 42px;
            height: 32px;
            padding: 0;
            border: 1px solid var(--vscode-input-border);
            background: transparent;
        }

        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .button-container {
            display: flex;
            gap: 10px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .range-info {
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .icon {
            margin-right: 5px;
        }

        .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 0.9em;
        }

        /* Icon Picker Styles */
        .icon-picker-container {
            position: relative;
            width: 100%;
            max-width: 400px;
        }

        .icon-picker-selected {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            cursor: pointer;
            min-height: 36px;
        }

        .icon-picker-selected:hover {
            border-color: var(--vscode-focusBorder);
        }

        .icon-picker-selected .codicon {
            font-size: 18px;
        }

        .icon-picker-selected .icon-name {
            flex: 1;
            font-size: 13px;
        }

        .icon-picker-selected .dropdown-arrow {
            font-size: 12px;
        }

        .icon-picker-dropdown {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 350px;
            overflow-y: auto;
            background-color: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            z-index: 1000;
            margin-top: 2px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .icon-picker-dropdown.open {
            display: block;
        }

        .icon-picker-search {
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
            position: sticky;
            top: 0;
            background-color: var(--vscode-dropdown-background);
        }

        .icon-picker-search input {
            width: 100%;
            padding: 6px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
            box-sizing: border-box;
        }

        .icon-picker-category {
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            background-color: var(--vscode-sideBar-background);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .icon-picker-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 2px;
            padding: 4px;
        }

        .icon-picker-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 4px;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.1s;
        }

        .icon-picker-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .icon-picker-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .icon-picker-item .codicon {
            font-size: 20px;
            margin-bottom: 4px;
        }

        .icon-picker-item .icon-label {
            font-size: 10px;
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
        }

        .icon-picker-item.hidden {
            display: none;
        }
    </style>
</head>
<body>
    <h1>⚙️ Simple Coding Time Tracker Settings</h1>

    <div class="setting-group">
        <h2>⏱️ Time Tracking Settings</h2>
        
        <div class="setting-item">
            <label for="inactivityTimeout">Inactivity Timeout (minutes)</label>
            <div class="description">Pause tracking if there is no keyboard or mouse activity in VS Code for this many minutes.</div>
            <input type="number" id="inactivityTimeout" min="0.5" max="60" step="0.5" />
            <div class="range-info">Range: 0.5 - 60 minutes</div>
        </div>

        <div class="setting-item">
            <label for="focusTimeout">Focus Timeout (minutes)</label>
            <div class="description">If you switch away from VS Code, continue counting as coding time for up to this many minutes before pausing.</div>
            <input type="number" id="focusTimeout" min="0.5" max="60" step="0.5" />
            <div class="range-info">Range: 0.5 - 60 minutes</div>
        </div>
    </div>

    <div class="setting-group">
        <h2>📊 Status Bar Display Settings</h2>
        
        <div class="setting-item">
            <div class="checkbox-container">
                <input type="checkbox" id="statusBarShowSeconds" />
                <label for="statusBarShowSeconds" style="margin: 0;">Show Seconds</label>
            </div>
            <div class="description">Display seconds in the status bar time (HH:MM:SS). Disable to reduce distractions and show only hours and minutes.</div>
        </div>

        <div class="setting-item">
            <label for="statusBarIcon">Status Bar Icon</label>
            <div class="description">Select a VS Code Codicon to display before the timer in the status bar.</div>
            <input type="hidden" id="statusBarIcon" value="$(code)" />
            <div class="icon-picker-container">
                <div class="icon-picker-selected" id="iconPickerTrigger">
                    <i class="codicon codicon-code" id="selectedIconPreview"></i>
                    <span class="icon-name" id="selectedIconName">Code</span>
                    <i class="codicon codicon-chevron-down dropdown-arrow"></i>
                </div>
                <div class="icon-picker-dropdown" id="iconPickerDropdown">
                    <div class="icon-picker-search">
                        <input type="text" id="iconSearchInput" placeholder="Search icons..." />
                    </div>
                    <div id="iconPickerContent"></div>
                </div>
            </div>
            <div class="range-info">Click to browse and select from available VS Code icons</div>
        </div>

        <div class="setting-item">
            <label for="statusBarBackgroundStyle">Status Bar Background</label>
            <div class="description">Choose the background style for the timer: use the default status bar color, a warning highlight, or an error highlight.</div>
            <select id="statusBarBackgroundStyle" style="max-width: 220px;">
                <option value="default">Default (theme)</option>
                <option value="warning">Warning (yellow)</option>
                <option value="error">Error (red)</option>
            </select>
            <div class="range-info">Matches VS Code theme colors: status bar default, warning, or error background</div>
        </div>

        <div class="setting-item">
            <label for="statusBarColor">Status Bar Font Color</label>
            <div class="description">Pick a font color for the timer text, or enter a hex/theme color. Leave empty for default.</div>
            <div class="color-row">
                <input type="color" id="statusBarColorPicker" aria-label="Pick status bar font color" />
                <input type="text" id="statusBarColor" placeholder="#FFAA00 or theme color" style="flex: 1; max-width: 260px;" />
            </div>
            <div class="range-info">Examples: #FFAA00 (orange), #00FF00 (green), or theme color (e.g., editor.foreground). Leave blank for default.</div>
        </div>
    </div>

    <div class="setting-group">
        <h2>🔔 Health Notification Settings</h2>
        
        <div class="setting-item">
            <div class="checkbox-container">
                <input type="checkbox" id="healthEnableNotifications" />
                <label for="healthEnableNotifications" style="margin: 0;">Enable Health Notifications</label>
            </div>
            <div class="description">Receive reminders for eye rest, stretching, and breaks during coding sessions.</div>
        </div>

        <div class="setting-item">
            <div class="checkbox-container">
                <input type="checkbox" id="healthModalNotifications" />
                <label for="healthModalNotifications" style="margin: 0;">Modal Notifications</label>
            </div>
            <div class="description">Make health notifications modal (blocks UI until dismissed) for better visibility.</div>
        </div>

        <div class="setting-item">
            <label for="healthEyeRestInterval">Eye Rest Interval (minutes)</label>
            <div class="description">Interval for eye rest reminders - Based on 20-20-20 rule (look at something 20 feet away for 20 seconds every 20 minutes).</div>
            <input type="number" id="healthEyeRestInterval" min="5" max="120" step="1" />
            <div class="range-info">Range: 5 - 120 minutes</div>
        </div>

        <div class="setting-item">
            <label for="healthStretchInterval">Stretch Interval (minutes)</label>
            <div class="description">Interval for stretch reminders - Recommended for posture health.</div>
            <input type="number" id="healthStretchInterval" min="10" max="180" step="1" />
            <div class="range-info">Range: 10 - 180 minutes</div>
        </div>

        <div class="setting-item">
            <label for="healthBreakThreshold">Break Threshold (minutes)</label>
            <div class="description">Coding duration before suggesting a break - Based on ultradian rhythms.</div>
            <input type="number" id="healthBreakThreshold" min="30" max="480" step="1" />
            <div class="range-info">Range: 30 - 480 minutes</div>
        </div>
    </div>

    <div class="setting-group">
        <h2>🛠️ Developer Settings</h2>
        
        <div class="setting-item">
            <div class="checkbox-container">
                <input type="checkbox" id="enableDevCommands" />
                <label for="enableDevCommands" style="margin: 0;">Enable Development Commands</label>
            </div>
            <div class="description">Enable development commands (Generate/Delete Test Data). Only enable this for testing purposes.</div>
            <div class="warning">⚠️ Warning: Development commands can modify or delete your time tracking data. Use with caution.</div>
        </div>
    </div>

    <div class="button-container">
        <button id="saveButton">💾 Save Settings</button>
        <button id="resetButton" class="secondary">🔄 Reset to Defaults</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Icon data organized by category
        const iconCategories = {
            'Common': [
                { id: 'code', label: 'Code' },
                { id: 'clock', label: 'Clock' },
                { id: 'watch', label: 'Watch' },
                { id: 'history', label: 'History' },
                { id: 'pulse', label: 'Pulse' },
                { id: 'rocket', label: 'Rocket' },
                { id: 'zap', label: 'Zap' },
                { id: 'flame', label: 'Flame' },
                { id: 'heart', label: 'Heart' },
                { id: 'star', label: 'Star' },
                { id: 'star-full', label: 'Star Full' },
                { id: 'star-empty', label: 'Star Empty' }
            ],
            'Activities': [
                { id: 'run', label: 'Run' },
                { id: 'play', label: 'Play' },
                { id: 'debug-start', label: 'Debug Start' },
                { id: 'terminal', label: 'Terminal' },
                { id: 'console', label: 'Console' },
                { id: 'keyboard', label: 'Keyboard' },
                { id: 'edit', label: 'Edit' },
                { id: 'pencil', label: 'Pencil' },
                { id: 'wand', label: 'Wand' }
            ],
            'Status': [
                { id: 'check', label: 'Check' },
                { id: 'pass', label: 'Pass' },
                { id: 'pass-filled', label: 'Pass Filled' },
                { id: 'error', label: 'Error' },
                { id: 'warning', label: 'Warning' },
                { id: 'info', label: 'Info' },
                { id: 'circle-filled', label: 'Circle Filled' },
                { id: 'circle-outline', label: 'Circle Outline' },
                { id: 'primitive-dot', label: 'Dot' }
            ],
            'Objects': [
                { id: 'file-code', label: 'File Code' },
                { id: 'file', label: 'File' },
                { id: 'folder', label: 'Folder' },
                { id: 'book', label: 'Book' },
                { id: 'notebook', label: 'Notebook' },
                { id: 'package', label: 'Package' },
                { id: 'archive', label: 'Archive' },
                { id: 'database', label: 'Database' },
                { id: 'server', label: 'Server' },
                { id: 'vm', label: 'VM' },
                { id: 'cloud', label: 'Cloud' },
                { id: 'globe', label: 'Globe' },
                { id: 'home', label: 'Home' },
                { id: 'dashboard', label: 'Dashboard' }
            ],
            'People': [
                { id: 'account', label: 'Account' },
                { id: 'person', label: 'Person' },
                { id: 'organization', label: 'Organization' },
                { id: 'smiley', label: 'Smiley' },
                { id: 'hubot', label: 'Hubot' },
                { id: 'feedback', label: 'Feedback' },
                { id: 'thumbsup', label: 'Thumbs Up' },
                { id: 'thumbsdown', label: 'Thumbs Down' }
            ],
            'Arrows': [
                { id: 'arrow-up', label: 'Arrow Up' },
                { id: 'arrow-down', label: 'Arrow Down' },
                { id: 'arrow-left', label: 'Arrow Left' },
                { id: 'arrow-right', label: 'Arrow Right' },
                { id: 'chevron-up', label: 'Chevron Up' },
                { id: 'chevron-down', label: 'Chevron Down' },
                { id: 'sync', label: 'Sync' },
                { id: 'refresh', label: 'Refresh' }
            ],
            'Tools': [
                { id: 'tools', label: 'Tools' },
                { id: 'gear', label: 'Gear' },
                { id: 'settings-gear', label: 'Settings' },
                { id: 'wrench', label: 'Wrench' },
                { id: 'beaker', label: 'Beaker' },
                { id: 'telescope', label: 'Telescope' },
                { id: 'microscope', label: 'Microscope' },
                { id: 'lightbulb', label: 'Lightbulb' },
                { id: 'plug', label: 'Plug' },
                { id: 'circuit-board', label: 'Circuit Board' },
                { id: 'debug', label: 'Debug' },
                { id: 'bug', label: 'Bug' }
            ],
            'Source Control': [
                { id: 'git-branch', label: 'Git Branch' },
                { id: 'git-commit', label: 'Git Commit' },
                { id: 'git-merge', label: 'Git Merge' },
                { id: 'git-pull-request', label: 'Pull Request' },
                { id: 'source-control', label: 'Source Control' },
                { id: 'repo', label: 'Repo' },
                { id: 'repo-forked', label: 'Repo Forked' }
            ],
            'Symbols': [
                { id: 'symbol-class', label: 'Class' },
                { id: 'symbol-method', label: 'Method' },
                { id: 'symbol-function', label: 'Function' },
                { id: 'symbol-variable', label: 'Variable' },
                { id: 'symbol-constant', label: 'Constant' },
                { id: 'symbol-namespace', label: 'Namespace' },
                { id: 'symbol-interface', label: 'Interface' },
                { id: 'symbol-enum', label: 'Enum' }
            ],
            'Notifications': [
                { id: 'bell', label: 'Bell' },
                { id: 'bell-dot', label: 'Bell Dot' },
                { id: 'bell-slash', label: 'Bell Slash' },
                { id: 'megaphone', label: 'Megaphone' },
                { id: 'comment', label: 'Comment' },
                { id: 'comment-discussion', label: 'Discussion' },
                { id: 'mail', label: 'Mail' },
                { id: 'inbox', label: 'Inbox' }
            ],
            'Media': [
                { id: 'play-circle', label: 'Play Circle' },
                { id: 'stop-circle', label: 'Stop Circle' },
                { id: 'record', label: 'Record' },
                { id: 'unmute', label: 'Unmute' },
                { id: 'mute', label: 'Mute' },
                { id: 'device-camera', label: 'Camera' },
                { id: 'device-camera-video', label: 'Video' }
            ],
            'Miscellaneous': [
                { id: 'coffee', label: 'Coffee' },
                { id: 'gift', label: 'Gift' },
                { id: 'key', label: 'Key' },
                { id: 'lock', label: 'Lock' },
                { id: 'unlock', label: 'Unlock' },
                { id: 'shield', label: 'Shield' },
                { id: 'tag', label: 'Tag' },
                { id: 'bookmark', label: 'Bookmark' },
                { id: 'pin', label: 'Pin' },
                { id: 'pinned', label: 'Pinned' },
                { id: 'eye', label: 'Eye' },
                { id: 'eye-closed', label: 'Eye Closed' },
                { id: 'search', label: 'Search' },
                { id: 'zoom-in', label: 'Zoom In' },
                { id: 'zoom-out', label: 'Zoom Out' },
                { id: 'graph', label: 'Graph' },
                { id: 'pie-chart', label: 'Pie Chart' },
                { id: 'calendar', label: 'Calendar' },
                { id: 'target', label: 'Target' },
                { id: 'milestone', label: 'Milestone' },
                { id: 'tasklist', label: 'Tasklist' },
                { id: 'checklist', label: 'Checklist' },
                { id: 'extensions', label: 'Extensions' },
                { id: 'sparkle', label: 'Sparkle' },
                { id: 'copilot', label: 'Copilot' }
            ]
        };

        // Initialize icon picker
        function initIconPicker() {
            const container = document.getElementById('iconPickerContent');
            const trigger = document.getElementById('iconPickerTrigger');
            const dropdown = document.getElementById('iconPickerDropdown');
            const searchInput = document.getElementById('iconSearchInput');

            // Build the icon grid
            let html = '';
            for (const [category, icons] of Object.entries(iconCategories)) {
                html += '<div class="icon-picker-category">' + category + '</div>';
                html += '<div class="icon-picker-grid">';
                for (const icon of icons) {
                    html += '<div class="icon-picker-item" data-value="$(' + icon.id + ')" data-label="' + icon.label + '">';
                    html += '<i class="codicon codicon-' + icon.id + '"></i>';
                    html += '<span class="icon-label">' + icon.label + '</span>';
                    html += '</div>';
                }
                html += '</div>';
            }
            container.innerHTML = html;

            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
                if (dropdown.classList.contains('open')) {
                    searchInput.focus();
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });

            // Handle icon selection
            container.addEventListener('click', (e) => {
                const item = e.target.closest('.icon-picker-item');
                if (item) {
                    selectIcon(item.dataset.value, item.dataset.label);
                    dropdown.classList.remove('open');
                }
            });

            // Search functionality
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const items = container.querySelectorAll('.icon-picker-item');
                const categories = container.querySelectorAll('.icon-picker-category');
                
                items.forEach(item => {
                    const label = item.dataset.label.toLowerCase();
                    const value = item.dataset.value.toLowerCase();
                    if (label.includes(query) || value.includes(query)) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });

                // Hide empty category headers
                categories.forEach(cat => {
                    const grid = cat.nextElementSibling;
                    const visibleItems = grid.querySelectorAll('.icon-picker-item:not(.hidden)');
                    cat.style.display = visibleItems.length > 0 ? 'block' : 'none';
                    grid.style.display = visibleItems.length > 0 ? 'grid' : 'none';
                });
            });
        }

        function selectIcon(value, label) {
            document.getElementById('statusBarIcon').value = value;
            const iconId = value.replace('$(', '').replace(')', '');
            document.getElementById('selectedIconPreview').className = 'codicon codicon-' + iconId;
            document.getElementById('selectedIconName').textContent = label;

            // Update selected state
            const items = document.querySelectorAll('.icon-picker-item');
            items.forEach(item => {
                item.classList.toggle('selected', item.dataset.value === value);
            });
        }

        function updateIconPickerFromValue(value) {
            if (!value || !value.startsWith('$(')) {
                value = '$(code)';
            }
            const iconId = value.replace('$(', '').replace(')', '');
            
            // Find the label for this icon
            let label = iconId.charAt(0).toUpperCase() + iconId.slice(1).replace(/-/g, ' ');
            for (const icons of Object.values(iconCategories)) {
                const found = icons.find(i => i.id === iconId);
                if (found) {
                    label = found.label;
                    break;
                }
            }

            document.getElementById('statusBarIcon').value = value;
            document.getElementById('selectedIconPreview').className = 'codicon codicon-' + iconId;
            document.getElementById('selectedIconName').textContent = label;

            // Update selected state
            const items = document.querySelectorAll('.icon-picker-item');
            items.forEach(item => {
                item.classList.toggle('selected', item.dataset.value === value);
            });
        }

        // Load settings when page loads
        window.addEventListener('load', () => {
            initIconPicker();
            vscode.postMessage({ command: 'loadSettings' });
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'settingsLoaded') {
                loadSettings(message.settings);
            } else if (message.command === 'saveSuccess') {
                // Visual feedback handled by extension
            }
        });

        function loadSettings(settings) {
            document.getElementById('inactivityTimeout').value = settings.inactivityTimeout;
            document.getElementById('focusTimeout').value = settings.focusTimeout;
            document.getElementById('statusBarShowSeconds').checked = settings.statusBarShowSeconds;
            updateIconPickerFromValue(settings.statusBarIcon);
            document.getElementById('statusBarBackgroundStyle').value = settings.statusBarBackgroundStyle;
            syncTextAndPicker(settings.statusBarColor || '');
            document.getElementById('healthEnableNotifications').checked = settings.healthEnableNotifications;
            document.getElementById('healthModalNotifications').checked = settings.healthModalNotifications;
            document.getElementById('healthEyeRestInterval').value = settings.healthEyeRestInterval;
            document.getElementById('healthStretchInterval').value = settings.healthStretchInterval;
            document.getElementById('healthBreakThreshold').value = settings.healthBreakThreshold;
            document.getElementById('enableDevCommands').checked = settings.enableDevCommands;
        }

        function getSettings() {
            return {
                inactivityTimeout: parseFloat(document.getElementById('inactivityTimeout').value),
                focusTimeout: parseFloat(document.getElementById('focusTimeout').value),
                statusBarShowSeconds: document.getElementById('statusBarShowSeconds').checked,
                statusBarIcon: document.getElementById('statusBarIcon').value,
                statusBarBackgroundStyle: document.getElementById('statusBarBackgroundStyle').value,
                statusBarColor: document.getElementById('statusBarColor').value,
                healthEnableNotifications: document.getElementById('healthEnableNotifications').checked,
                healthModalNotifications: document.getElementById('healthModalNotifications').checked,
                healthEyeRestInterval: parseInt(document.getElementById('healthEyeRestInterval').value),
                healthStretchInterval: parseInt(document.getElementById('healthStretchInterval').value),
                healthBreakThreshold: parseInt(document.getElementById('healthBreakThreshold').value),
                enableDevCommands: document.getElementById('enableDevCommands').checked
            };
        }

        const hexRegex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

        function normalizeHexToSix(value) {
            const trimmed = value.trim();
            if (!trimmed) return '';
            const withHash = trimmed.startsWith('#') ? trimmed : '#' + trimmed;
            if (!hexRegex.test(withHash)) return '';
            const hex = withHash.replace('#', '');
            if (hex.length === 3) {
                return '#' + hex.split('').map(c => c + c).join('').toLowerCase();
            }
            return '#' + hex.toLowerCase();
        }

        function syncTextAndPicker(value) {
            const textInput = document.getElementById('statusBarColor');
            const pickerInput = document.getElementById('statusBarColorPicker');
            textInput.value = value;
            const normalized = normalizeHexToSix(value);
            if (normalized) {
                pickerInput.value = normalized;
            } else {
                pickerInput.value = '#ffaa00'; // fallback visible color
            }
        }

        // Keep text input and picker in sync
        document.addEventListener('DOMContentLoaded', () => {
            const textInput = document.getElementById('statusBarColor');
            const pickerInput = document.getElementById('statusBarColorPicker');

            pickerInput.addEventListener('input', () => {
                textInput.value = pickerInput.value;
            });

            textInput.addEventListener('input', () => {
                const normalized = normalizeHexToSix(textInput.value);
                if (normalized) {
                    pickerInput.value = normalized;
                }
            });
        });

        document.getElementById('saveButton').addEventListener('click', () => {
            const settings = getSettings();
            vscode.postMessage({
                command: 'saveSettings',
                settings: settings
            });
        });

        document.getElementById('resetButton').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to their default values?')) {
                vscode.postMessage({ command: 'resetSettings' });
            }
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
