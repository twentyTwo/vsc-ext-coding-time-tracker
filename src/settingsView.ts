import * as vscode from 'vscode';

export class SettingsViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public show() {
        if (this.panel) {
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
            healthEnableNotifications: config.get('health.enableNotifications', true),
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
            // Most settings should be saved to Workspace scope (default behavior in package.json)
            await config.update('inactivityTimeout', settings.inactivityTimeout, vscode.ConfigurationTarget.Workspace);
            await config.update('focusTimeout', settings.focusTimeout, vscode.ConfigurationTarget.Workspace);
            await config.update('statusBar.showSeconds', settings.statusBarShowSeconds, vscode.ConfigurationTarget.Workspace);
            await config.update('health.enableNotifications', settings.healthEnableNotifications, vscode.ConfigurationTarget.Workspace);
            await config.update('health.modalNotifications', settings.healthModalNotifications, vscode.ConfigurationTarget.Workspace);
            await config.update('health.eyeRestInterval', settings.healthEyeRestInterval, vscode.ConfigurationTarget.Workspace);
            await config.update('health.stretchInterval', settings.healthStretchInterval, vscode.ConfigurationTarget.Workspace);
            await config.update('health.breakThreshold', settings.healthBreakThreshold, vscode.ConfigurationTarget.Workspace);
            
            // Only enableDevCommands has "scope": "application" in package.json, so it must be saved to Global
            await config.update('enableDevCommands', settings.enableDevCommands, vscode.ConfigurationTarget.Global);

            console.log('Settings saved successfully:', settings);
            vscode.window.showInformationMessage('✅ Settings saved successfully!');
            
            if (this.panel) {
                this.panel.webview.postMessage({ command: 'saveSuccess' });
            }
            
            // Trigger a configuration change event manually if needed
            // The onDidChangeConfiguration should fire automatically, but we log for debugging
            console.log('Configuration should update automatically via onDidChangeConfiguration event');
        } catch (error) {
            console.error('Failed to save settings:', error);
            vscode.window.showErrorMessage(`Failed to save settings: ${error}`);
        }
    }

    private async resetToDefaults() {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');

        try {
            // Reset workspace-scoped settings
            await config.update('inactivityTimeout', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('focusTimeout', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('statusBar.showSeconds', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('health.enableNotifications', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('health.modalNotifications', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('health.eyeRestInterval', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('health.stretchInterval', undefined, vscode.ConfigurationTarget.Workspace);
            await config.update('health.breakThreshold', undefined, vscode.ConfigurationTarget.Workspace);
            
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

        input[type="number"] {
            width: 100%;
            max-width: 200px;
            padding: 6px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
        }

        input[type="number"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
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

        // Load settings when page loads
        window.addEventListener('load', () => {
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
                healthEnableNotifications: document.getElementById('healthEnableNotifications').checked,
                healthModalNotifications: document.getElementById('healthModalNotifications').checked,
                healthEyeRestInterval: parseInt(document.getElementById('healthEyeRestInterval').value),
                healthStretchInterval: parseInt(document.getElementById('healthStretchInterval').value),
                healthBreakThreshold: parseInt(document.getElementById('healthBreakThreshold').value),
                enableDevCommands: document.getElementById('enableDevCommands').checked
            };
        }

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
