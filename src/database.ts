import * as vscode from 'vscode';

export interface TimeEntry {
    date: string;
    project: string;
    timeSpent: number;
}

export interface SummaryData {
    dailySummary: { [date: string]: number };
    projectSummary: { [project: string]: number };
    totalTime: number;
}

export class Database {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async addEntry(date: Date, project: string, timeSpent: number) {
        const dateString = date.toISOString().split('T')[0];
        const entries = this.getEntries();
        const existingEntryIndex = entries.findIndex(entry => entry.date === dateString && entry.project === project);

        if (existingEntryIndex !== -1) {
            // Update existing entry
            entries[existingEntryIndex].timeSpent += timeSpent;
        } else {
            // Add new entry
            entries.push({ date: dateString, project, timeSpent });
        }

        await this.context.globalState.update('timeEntries', entries);
    }

    getEntries(): TimeEntry[] {
        return this.context.globalState.get<TimeEntry[]>('timeEntries', []);
    }

    async getSummaryData(): Promise<SummaryData> {
        const entries = this.getEntries();
        const dailySummary: { [date: string]: number } = {};
        const projectSummary: { [project: string]: number } = {};
        let totalTime = 0;

        for (const entry of entries) {
            dailySummary[entry.date] = (dailySummary[entry.date] || 0) + entry.timeSpent;
            projectSummary[entry.project] = (projectSummary[entry.project] || 0) + entry.timeSpent;
            totalTime += entry.timeSpent;
        }

        return {
            dailySummary,
            projectSummary,
            totalTime
        };
    }

    async searchEntries(startDate?: string, endDate?: string, project?: string): Promise<TimeEntry[]> {
        const entries = this.getEntries();
        return entries.filter(entry => {
            const dateMatch = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
            const projectMatch = !project || entry.project.toLowerCase().includes(project.toLowerCase());
            return dateMatch && projectMatch;
        });
    }

    async resetTodayTime(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.getEntries();
        const updatedEntries = entries.filter(entry => entry.date !== today);
        await this.context.globalState.update('timeEntries', updatedEntries);
    }

    async resetAllTime(): Promise<void> {
        await this.context.globalState.update('timeEntries', []);
    }
}