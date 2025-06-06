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
    private entries: TimeEntry[] | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // Initialize storage if empty
        if (!this.context.globalState.get('timeEntries')) {
            this.context.globalState.update('timeEntries', []);
        }
        // Load entries into memory
        this.entries = this.context.globalState.get<TimeEntry[]>('timeEntries', []);
    }

    private getLocalDateString(date: Date): string {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }

    async addEntry(date: Date, project: string, timeSpent: number) {
        const dateString = this.getLocalDateString(date);
        const entries = this.getEntries();
        
        const existingEntryIndex = entries.findIndex(entry => entry.date === dateString && entry.project === project);

        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex].timeSpent += timeSpent;
        } else {
            entries.push({ date: dateString, project, timeSpent });
        }

        try {
            await this.updateEntries(entries);
        } catch (error) {
            console.error('Error saving entry:', error);
            vscode.window.showErrorMessage('Failed to save time entry');
        }
    }

    getEntries(): TimeEntry[] {
        if (!this.entries) {
            this.entries = this.context.globalState.get<TimeEntry[]>('timeEntries', []);
        }
        return this.entries;
    }

    private async updateEntries(entries: TimeEntry[]): Promise<void> {
        this.entries = entries;
        await this.context.globalState.update('timeEntries', entries);
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
    }    async searchEntries(startDate?: string, endDate?: string, project?: string): Promise<TimeEntry[]> {
        const entries = this.getEntries();
        return entries.filter(entry => {
            const dateMatch = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
            const projectMatch = !project || entry.project.toLowerCase().includes(project.toLowerCase());
            return dateMatch && projectMatch;
        });
    }
}