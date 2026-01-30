import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { formatTime } from './utils';
import { SummaryViewProvider } from './summaryView';

export class StatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private summaryView: SummaryViewProvider;
    private updateInterval: NodeJS.Timeout;
    private configChangeListener: vscode.Disposable;
    private readonly commandId = 'simpleCodingTimeTracker.manualSave';
    private readonly notificationCommandId = 'simpleCodingTimeTracker.toggleNotifications';

    constructor(timeTracker: TimeTracker, summaryView: SummaryViewProvider) {
        this.timeTracker = timeTracker;
        this.summaryView = summaryView;
        // Single combined status bar item at higher priority
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        
        // Register manual save command (clicking timer saves session)
        const commandDisposable = vscode.commands.registerCommand(this.commandId, () => {
            if (this.timeTracker.isActive()) {
                // Save current session with manual save reason
                this.timeTracker.saveCurrentSession('manual status bar click');
                
                // Show summary view after saving
                this.summaryView.show();
                
                // Show confirmation to user
                vscode.window.showInformationMessage('Time entry saved and summary view opened');
            }
        });
        
        // Register notification toggle command (clicking bell toggles notifications)
        const notificationCommandDisposable = vscode.commands.registerCommand(this.notificationCommandId, () => {
            this.toggleNotifications();
        });
        
        // Register refresh command for explicit status bar refresh after settings save
        const refreshCommandDisposable = vscode.commands.registerCommand('simpleCodingTimeTracker.refreshStatusBar', () => {
            void this.updateStatusBar();
        });
        
        // Set up combined status bar item
        this.statusBarItem.command = this.commandId;
        this.statusBarItem.tooltip = 'Click to save current session and show summary | Right-click for notifications menu';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.show();
        
        // Listen for configuration changes to update immediately
        this.configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleCodingTimeTracker.statusBar') ||
                e.affectsConfiguration('simpleCodingTimeTracker.health.enableNotifications')) {
                void this.updateStatusBar();
            }
        });
        
        void this.updateStatusBar();
        this.updateInterval = setInterval(() => void this.updateStatusBar(), 1000); // Update every second
    }    private async updateStatusBar() {
        const todayTotal = await this.timeTracker.getTodayTotal();
        const currentProjectTime = await this.timeTracker.getCurrentProjectTime();
        const isActive = this.timeTracker.isActive();
        
        // Get configuration settings
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const showSeconds = config.get('statusBar.showSeconds', true);
        const customIcon = config.get('statusBar.icon', '$(code)');
        const customColor = config.get('statusBar.color', '');
        const backgroundStyle = config.get('statusBar.backgroundStyle', 'warning');
        
        // Format time display
        const timeDisplay = this.formatTime(todayTotal, showSeconds);
        const timerIcon = isActive ? customIcon : '$(coffee)'; // VS Code pause icon
        
        // Get notification status and icon
        const notificationsEnabled = config.get('health.enableNotifications', false);
        const notificationIcon = notificationsEnabled ? '$(bell)' : '$(bell-slash)'; // VS Code bell icons
        
        // Combined display: timer + notifications in one status bar item
        this.statusBarItem.text = `${timerIcon} ${timeDisplay}  ${notificationIcon}`;
        
        // Apply custom color if configured
        if (customColor) {
            this.statusBarItem.color = customColor;
        } else {
            this.statusBarItem.color = undefined;
        }

        // Apply background style
        let backgroundColor: vscode.ThemeColor | undefined;
        if (backgroundStyle === 'warning') {
            backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else if (backgroundStyle === 'error') {
            backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else {
            backgroundColor = undefined;
        }
        
        this.statusBarItem.backgroundColor = backgroundColor;
        this.statusBarItem.tooltip = await this.getTooltipText(isActive, currentProjectTime, notificationsEnabled);
    }

    private formatTime(minutes: number, showSeconds: boolean = true): string {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        
        if (showSeconds) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }
    }    
    
    private async getTooltipText(isActive: boolean, currentProjectTime: number, notificationsEnabled: boolean): Promise<string> {
        const weeklyTotal = await this.timeTracker.getWeeklyTotal();
        const monthlyTotal = await this.timeTracker.getMonthlyTotal();
        const allTimeTotal = await this.timeTracker.getAllTimeTotal();
        const currentBranch = this.timeTracker.getCurrentBranch();
        const currentProject = this.timeTracker.getCurrentProject();

        const notificationStatus = notificationsEnabled ? 'ON' : 'OFF';
        
        return `${isActive ? 'Active' : 'Paused'} - Coding Time
Project: ${currentProject}
Branch: ${currentBranch}
Current Project Today: ${formatTime(currentProjectTime)}
This week total: ${formatTime(weeklyTotal)}
This month total: ${formatTime(monthlyTotal)}
All Time total: ${formatTime(allTimeTotal)}
Health Notifications: ${notificationStatus}
Click timer to save session | Hover bell icon for notification status`;
    }


    // Toggle notifications method
    private async toggleNotifications(): Promise<void> {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const currentEnabled = config.get('health.enableNotifications', false);
        
        // Toggle the setting
        await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
        
        // Update the visual state
        await this.updateStatusBar();
        
        // Show brief feedback message with VS Code icon
        const icon = !currentEnabled ? '$(bell)' : '$(bell-slash)';
        const status = !currentEnabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Health notifications ${status}`);
    }

    // Public method to force immediate update
    async updateNow() {
        await this.updateStatusBar();
    }

    dispose() {
        this.statusBarItem.dispose();
        this.configChangeListener.dispose();
        clearInterval(this.updateInterval);
    }
}