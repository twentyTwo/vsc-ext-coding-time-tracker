import * as vscode from 'vscode';

export interface TimeEntry {
    date: string;
    project: string;
    timeSpent: number;
    branch: string;
}

export interface SummaryData {
    dailySummary: { [date: string]: number };
    projectSummary: { [project: string]: number };
    branchSummary: { [branch: string]: number };
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
        
        // Migrate existing entries to include branch if needed
        this.migrateEntries();
    }

    private async migrateEntries() {
        if (this.entries && this.entries.length > 0) {
            const needsMigration = this.entries.some(entry => !('branch' in entry));
            if (needsMigration) {
                const migratedEntries = this.entries.map(entry => ({
                    ...entry,
                    branch: 'branch' in entry ? entry.branch : 'unknown'
                }));
                await this.updateEntries(migratedEntries);
            }
        }
    }

    private getLocalDateString(date: Date): string {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }

    async addEntry(date: Date, project: string, timeSpent: number, branch: string) {
        const dateString = this.getLocalDateString(date);
        const entries = this.getEntries();
        
        const existingEntryIndex = entries.findIndex(entry => 
            entry.date === dateString && 
            entry.project === project && 
            entry.branch === branch
        );

        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex].timeSpent += timeSpent;
        } else {
            entries.push({ date: dateString, project, timeSpent, branch });
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
        const branchSummary: { [branch: string]: number } = {};
        let totalTime = 0;

        for (const entry of entries) {
            dailySummary[entry.date] = (dailySummary[entry.date] || 0) + entry.timeSpent;
            projectSummary[entry.project] = (projectSummary[entry.project] || 0) + entry.timeSpent;
            branchSummary[entry.branch] = (branchSummary[entry.branch] || 0) + entry.timeSpent;
            totalTime += entry.timeSpent;
        }

        return {
            dailySummary,
            projectSummary,
            branchSummary,
            totalTime
        };
    }

    async searchEntries(startDate?: string, endDate?: string, project?: string, branch?: string): Promise<TimeEntry[]> {
        const entries = this.getEntries();
        return entries.filter(entry => {
            const dateMatch = (!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate);
            const projectMatch = !project || entry.project.toLowerCase().includes(project.toLowerCase());
            const branchMatch = !branch || entry.branch.toLowerCase().includes(branch.toLowerCase());
            return dateMatch && projectMatch && branchMatch;
        });
    }

    async getBranchesByProject(project: string): Promise<string[]> {
        const entries = await this.getEntries();
        const branchSet = new Set(
            entries
                .filter(entry => entry.project === project)
                .map(entry => entry.branch)
        );
        return Array.from(branchSet).sort();
    }

    async clearAllData(): Promise<void> {
        // Ask for explicit confirmation with a specific phrase to prevent accidental deletion
        const response = await vscode.window.showInputBox({
            prompt: 'This will permanently delete all time tracking data. Type "DELETE ALL DATA" to confirm.',
            placeHolder: 'DELETE ALL DATA'
        });

        if (response !== 'DELETE ALL DATA') {
            vscode.window.showInformationMessage('Data deletion cancelled.');
            return;
        }

        try {
            this.entries = [];
            await this.context.globalState.update('timeEntries', []);
            vscode.window.showInformationMessage('All time tracking data has been cleared.');
        } catch (error) {
            console.error('Error clearing data:', error);
            vscode.window.showErrorMessage('Failed to clear time tracking data');
        }
    }
}