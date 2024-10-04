import * as vscode from 'vscode';
import { Database, TimeEntry } from './database';

export class TimeTracker implements vscode.Disposable {
    private isTracking: boolean = false;
    private startTime: number = 0;
    private currentProject: string = '';
    private database: Database;
    private updateInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;

    constructor(database: Database) {
        this.database = database;
    }

    startTracking() {
        if (!this.isTracking) {
            this.isTracking = true;
            this.startTime = Date.now();
            this.currentProject = this.getCurrentProject();
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            this.saveInterval = setInterval(() => this.saveCurrentSession(), 60000); // Save every minute
        }
    }

    stopTracking() {
        if (this.isTracking) {
            this.isTracking = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            if (this.saveInterval) {
                clearInterval(this.saveInterval);
                this.saveInterval = null;
            }
            this.saveCurrentSession();
        }
    }

    private updateCurrentSession() {
        // This method will be called every second when tracking is active
        // You can emit an event here if you want to update the UI more frequently
    }

    private async saveCurrentSession() {
        if (this.isTracking) {
            const duration = (Date.now() - this.startTime) / 60000; // Convert to minutes
            await this.database.addEntry(new Date(), this.currentProject, duration);
            this.startTime = Date.now(); // Reset the start time for the next interval
        }
    }

    private getCurrentProject(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders ? workspaceFolders[0].name : 'Unknown Project';
    }

    getTodayTotal(): number {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.database.getEntries();
        const todayTotal = entries
            .filter((entry: TimeEntry) => entry.date === today)
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        // Add the current session time if tracking is active
        if (this.isTracking) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return todayTotal + currentSessionTime;
        }
        
        return todayTotal;
    }

    getCurrentProjectTime(): number {
        const today = new Date().toISOString().split('T')[0];
        const currentProject = this.getCurrentProject();
        const entries = this.database.getEntries();
        const currentProjectTime = entries
            .filter((entry: TimeEntry) => entry.date === today && entry.project === currentProject)
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        // Add the current session time if tracking is active
        if (this.isTracking && this.currentProject === currentProject) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return currentProjectTime + currentSessionTime;
        }
        
        return currentProjectTime;
    }

    getWeeklyTotal(): number {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return this.getTotalSince(startOfWeek);
    }

    getMonthlyTotal(): number {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.getTotalSince(startOfMonth);
    }

    getAllTimeTotal(): number {
        const total = this.database.getEntries()
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);

        // Add current session if tracking is active
        if (this.isTracking) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return total + currentSessionTime;
        }

        return total;
    }

    private getTotalSince(startDate: Date): number {
        const entries = this.database.getEntries();
        const startDateString = startDate.toISOString().split('T')[0];
        const now = new Date().toISOString().split('T')[0];
        
        const filteredEntries = entries.filter(entry => 
            entry.date >= startDateString && entry.date <= now
        );

        const total = filteredEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);

        // Add current session if tracking is active
        if (this.isTracking) {
            const currentSessionTime = (Date.now() - this.startTime) / 60000;
            return total + currentSessionTime;
        }

        return total;
    }

    getYearlyTotal(): number {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        return this.getTotalSince(startOfYear);
    }

    dispose() {
        this.stopTracking();
    }

    resetTimer(): void {
        this.stopTracking();
        this.startTime = 0;
        this.database.resetTodayTime();
    }

    resetAllTimers(): void {
        this.stopTracking();
        this.startTime = 0;
        this.database.resetAllTime();
    }
}