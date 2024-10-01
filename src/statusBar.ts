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
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.show();
        this.updateStatusBar();
        this.updateInterval = setInterval(() => this.updateStatusBar(), 1000); // Update every second
    }

    private updateStatusBar() {
        const todayTotal = this.timeTracker.getTodayTotal();
        this.statusBarItem.text = `💻 ${this.formatTime(todayTotal)}`;
        this.statusBarItem.tooltip = this.getTooltipText();
    }

    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes * 60) % 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    private getTooltipText(): string {
        const weeklyTotal = this.timeTracker.getWeeklyTotal();
        const monthlyTotal = this.timeTracker.getMonthlyTotal();
        const allTimeTotal = this.timeTracker.getAllTimeTotal();

        return `Total Coding Time:
This week: ${formatTime(weeklyTotal)}
This month: ${formatTime(monthlyTotal)}
All Time: ${formatTime(allTimeTotal)}
Click to show summary`;
    }

    onDidClick(listener: () => void): vscode.Disposable {
        return this.onDidClickEmitter.event(listener);
    }

    dispose() {
        clearInterval(this.updateInterval);
        this.statusBarItem.dispose();
        this.onDidClickEmitter.dispose();
    }
}