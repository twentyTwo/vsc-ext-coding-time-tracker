import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { formatTime } from './utils';
import { SummaryViewProvider } from './summaryView';

export class StatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private summaryView: SummaryViewProvider;
    private updateInterval: NodeJS.Timeout;
    private readonly commandId = 'simpleCodingTimeTracker.manualSave';

    constructor(timeTracker: TimeTracker, summaryView: SummaryViewProvider) {
        this.timeTracker = timeTracker;
        this.summaryView = summaryView;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        
        // Register manual save command first
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
        
        // Set up status bar item
        this.statusBarItem.command = this.commandId;
        this.statusBarItem.tooltip = 'Click to save current session and show summary';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.show();
        
        void this.updateStatusBar();
        this.updateInterval = setInterval(() => void this.updateStatusBar(), 1000); // Update every second
    }    private async updateStatusBar() {
        const todayTotal = await this.timeTracker.getTodayTotal();
        const currentProjectTime = await this.timeTracker.getCurrentProjectTime();
        const isActive = this.timeTracker.isActive();
        
        // Show both total time and current project time
        this.statusBarItem.text = `${isActive ? '💻' : '⏸️'} ${this.formatTime(todayTotal)}`;
        this.statusBarItem.tooltip = await this.getTooltipText(isActive, currentProjectTime);
    }

    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }    
    
    private async getTooltipText(isActive: boolean, currentProjectTime: number): Promise<string> {
        const weeklyTotal = await this.timeTracker.getWeeklyTotal();
        const monthlyTotal = await this.timeTracker.getMonthlyTotal();
        const allTimeTotal = await this.timeTracker.getAllTimeTotal();
        const currentBranch = this.timeTracker.getCurrentBranch();
        const currentProject = this.timeTracker.getCurrentProject();

        return `${isActive ? 'Active' : 'Paused'} - Coding Time
Project: ${currentProject}
Branch: ${currentBranch}
Current Project Today: ${formatTime(currentProjectTime)}
This week total: ${formatTime(weeklyTotal)}
This month total: ${formatTime(monthlyTotal)}
All Time total: ${formatTime(allTimeTotal)}
Click to show summary`;
    }

    // Public method to force immediate update
    async updateNow() {
        await this.updateStatusBar();
    }

    dispose() {
        this.statusBarItem.dispose();
        clearInterval(this.updateInterval);
    }
}