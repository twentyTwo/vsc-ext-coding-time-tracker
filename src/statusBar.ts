import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { formatTime } from './utils';

export class StatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private updateInterval: NodeJS.Timeout;
    private onDidClickEmitter = new vscode.EventEmitter<void>();

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'simpleCodingTimeTracker.showSummary';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');        this.statusBarItem.show();
        void this.updateStatusBar();
        this.updateInterval = setInterval(() => void this.updateStatusBar(), 1000); // Update every second
    }    private async updateStatusBar() {
        const todayTotal = await this.timeTracker.getTodayTotal();
        const currentProjectTime = await this.timeTracker.getCurrentProjectTime();
        const isActive = this.timeTracker.isActive();
        
        // Show both total time and current project time
        this.statusBarItem.text = `${isActive ? '💻' : '⏸️'} ${this.formatTime(todayTotal)} (${this.formatTime(currentProjectTime)})`;
        this.statusBarItem.tooltip = await this.getTooltipText(isActive, currentProjectTime);
    }

    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }    private async getTooltipText(isActive: boolean, currentProjectTime: number): Promise<string> {
        const weeklyTotal = await this.timeTracker.getWeeklyTotal();
        const monthlyTotal = await this.timeTracker.getMonthlyTotal();
        const allTimeTotal = await this.timeTracker.getAllTimeTotal();
        const currentBranch = this.timeTracker.getCurrentBranch();
        const currentProject = this.timeTracker.getCurrentProject();

        return `${isActive ? 'Active' : 'Paused'} - Coding Time
Project: ${currentProject}
Branch: ${currentBranch}
Current Project Today: ${formatTime(currentProjectTime)}
This week: ${formatTime(weeklyTotal)}
This month: ${formatTime(monthlyTotal)}
All Time: ${formatTime(allTimeTotal)}
Click to show summary`;
    }

    onDidClick(listener: () => void): vscode.Disposable {
        return this.onDidClickEmitter.event(listener);
    }

    // Public method to force immediate update
    async updateNow() {
        await this.updateStatusBar();
    }

    dispose() {
        clearInterval(this.updateInterval);
        this.statusBarItem.dispose();
        this.onDidClickEmitter.dispose();
    }
}