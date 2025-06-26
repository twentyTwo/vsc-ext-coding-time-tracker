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
        // Validate time spent to prevent unreasonable values
        if (timeSpent <= 0 || timeSpent > 24 * 60) { // More than 24 hours is unlikely
            console.warn(`Suspicious time value detected: ${timeSpent} minutes for ${project}/${branch}`);
            return;
        }

        const dateString = this.getLocalDateString(date);
        const entries = this.getEntries();
        
        const existingEntryIndex = entries.findIndex(entry => 
            entry.date === dateString && 
            entry.project === project && 
            entry.branch === branch
        );

        // Round to 2 decimal places to avoid floating point issues
        const roundedTime = Math.round(timeSpent * 100) / 100;

        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex].timeSpent += roundedTime;
        } else {
            entries.push({ date: dateString, project, timeSpent: roundedTime, branch });
        }

        try {
            await this.updateEntries(entries);
            console.log(`Saved ${roundedTime}min for ${project}/${branch} on ${dateString}`);
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

    async clearAllData(): Promise<boolean> {
        // First confirm with a warning dialog
        const warningResult = await vscode.window.showWarningMessage(
            'Are you sure you want to delete all time tracking data? This cannot be undone.',
            { modal: true },
            'Delete All Data',
            'Cancel'
        );

        if (warningResult !== 'Delete All Data') {
            return false;
        }

        // Then require typing confirmation for extra safety
        const response = await vscode.window.showInputBox({
            prompt: 'Type "DELETE ALL DATA" to confirm permanent deletion of all time tracking data.',
            placeHolder: 'DELETE ALL DATA',
            ignoreFocusOut: true
        });

        if (response !== 'DELETE ALL DATA') {
            vscode.window.showInformationMessage('Data deletion cancelled.');
            return false;
        }

        try {
            // Clear memory cache
            this.entries = [];
            
            // Clear persistent storage
            await this.context.globalState.update('timeEntries', []);
            
            // Show success message
            vscode.window.showInformationMessage('All time tracking data has been cleared successfully.');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            vscode.window.showErrorMessage('Failed to clear time tracking data: ' + (error instanceof Error ? error.message : 'Unknown error'));
            return false;
        }
    }
}