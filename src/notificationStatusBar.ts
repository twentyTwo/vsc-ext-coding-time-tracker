import * as vscode from 'vscode';

export class NotificationStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private readonly commandId = 'simpleCodingTimeTracker.toggleNotifications';
    private statusBarReference?: any; // Reference to main status bar for updates

    constructor() {
        // Create status bar item with priority 99 to appear immediately to the right of time tracker (priority 100)
        // Use very specific priority to minimize gap
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            99.9999
        );
        
        this.statusBarItem.command = this.commandId;
        this.updateStatusBar();
        this.statusBarItem.show();
    }

    private updateStatusBar(): void {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const isEnabled = config.get('health.enableNotifications', false);
        
        // Use minimal text with no extra spaces
        this.statusBarItem.text = isEnabled ? '🔔' : '🔕';
        // this.statusBarItem.text = isEnabled ? '$(bell)' : '$(bell-dot)';
        this.statusBarItem.tooltip = `Health Notifications: ${isEnabled ? 'ON' : 'OFF'} (Click to toggle)`;
        
        // Keep same background as time tracker for unified appearance
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }

    public async toggle(): Promise<void> {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const currentEnabled = config.get('health.enableNotifications', false);
        
        // Toggle the setting
        await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
        
        // Update the main status bar display
        if (this.statusBarReference) {
            await this.statusBarReference.updateNow();
        }
        
        // Show brief feedback message
        const status = !currentEnabled ? 'enabled' : 'disabled';
        const icon = !currentEnabled ? '🔔' : '🔕';
        vscode.window.showInformationMessage(`${icon} Health notifications ${status}`);
    }

    public refresh(): void {
        this.updateStatusBar();
        // Also update the main status bar when configuration changes
        if (this.statusBarReference) {
            this.statusBarReference.updateNow();
        }
    }

    public setStatusBarReference(statusBar: any): void {
        this.statusBarReference = statusBar;
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}