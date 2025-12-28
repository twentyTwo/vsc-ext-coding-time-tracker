import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { formatTime } from './utils';
import { SummaryViewProvider } from './summaryView';

export class StatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private notificationItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private summaryView: SummaryViewProvider;
    private updateInterval: NodeJS.Timeout;
    private configChangeListener: vscode.Disposable;
    private readonly commandId = 'simpleCodingTimeTracker.manualSave';
    private readonly notificationCommandId = 'simpleCodingTimeTracker.toggleNotifications';

    constructor(timeTracker: TimeTracker, summaryView: SummaryViewProvider) {
        this.timeTracker = timeTracker;
        this.summaryView = summaryView;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.notificationItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99.9999);
        
        // Register manual save command (clicking anywhere saves session)
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
        
        // Register notification toggle command
        const notificationCommandDisposable = vscode.commands.registerCommand(this.notificationCommandId, () => {
            this.toggleNotifications();
        });
        
        
        // Set up main status bar item
        this.statusBarItem.command = this.commandId;
        this.statusBarItem.tooltip = 'Click to save current session and show summary';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.show();
        
        // Set up notification status bar item
        this.notificationItem.command = this.notificationCommandId;
        this.notificationItem.tooltip = 'Click to toggle health notifications';
        this.notificationItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.notificationItem.show();
        
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
        
        // Update main status bar (time tracker only)
        const timeDisplay = this.formatTime(todayTotal, showSeconds);
        const icon = isActive ? '💻' : '⏸️';
        this.statusBarItem.text = `${icon} ${timeDisplay}`;
        
        this.statusBarItem.tooltip = await this.getTooltipText(isActive, currentProjectTime);
        
        // Update notification status bar
        const notificationsEnabled = config.get('health.enableNotifications', false);
        const notificationIcon = notificationsEnabled ? '🔔' : '🔕';
        this.notificationItem.text = notificationIcon;
        this.notificationItem.tooltip = `Health Notifications: ${notificationsEnabled ? 'ON' : 'OFF'} (Click to toggle)`;
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
    
    private async getTooltipText(isActive: boolean, currentProjectTime: number): Promise<string> {
        const weeklyTotal = await this.timeTracker.getWeeklyTotal();
        const monthlyTotal = await this.timeTracker.getMonthlyTotal();
        const allTimeTotal = await this.timeTracker.getAllTimeTotal();
        const currentBranch = this.timeTracker.getCurrentBranch();
        const currentProject = this.timeTracker.getCurrentProject();

        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const notificationsEnabled = config.get('health.enableNotifications', false);
        const notificationStatus = notificationsEnabled ? 'ON' : 'OFF';
        
        return `${isActive ? 'Active' : 'Paused'} - Coding Time
Project: ${currentProject}
Branch: ${currentBranch}
Current Project Today: ${formatTime(currentProjectTime)}
This week total: ${formatTime(weeklyTotal)}
This month total: ${formatTime(monthlyTotal)}
All Time total: ${formatTime(allTimeTotal)}
Notifications: ${notificationStatus}
Click to save session and show summary`;
    }


    // Toggle notifications method
    private async toggleNotifications(): Promise<void> {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const currentEnabled = config.get('health.enableNotifications', false);
        
        // Toggle the setting
        await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
        
        // Update the visual state
        await this.updateStatusBar();
        
        // Show brief feedback message
        const status = !currentEnabled ? 'enabled' : 'disabled';
        const icon = !currentEnabled ? '🔔' : '🔕';
        vscode.window.showInformationMessage(`${icon} Health notifications ${status}`);
    }

    // Public method to force immediate update
    async updateNow() {
        await this.updateStatusBar();
    }

    dispose() {
        this.statusBarItem.dispose();
        this.notificationItem.dispose();
        this.configChangeListener.dispose();
        clearInterval(this.updateInterval);
    }
}