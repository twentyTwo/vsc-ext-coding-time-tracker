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
    private readonly STORAGE_KEY = 'timeEntries';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.migrateToSyncedStorage();
    }

    private async migrateToSyncedStorage() {
        // Check if we have data in the old storage
        const oldData = this.context.globalState.get<TimeEntry[]>(this.STORAGE_KEY);
        
        if (oldData && oldData.length > 0) {
            // Get current synced data
            const syncedData = await this.getSyncedEntries();
            
            // Merge old and new data, taking the highest timeSpent for each date/project
            const mergedData = this.mergeTimeEntries(oldData, syncedData);
            
            // Save to synced storage
            await this.updateSyncedEntries(mergedData);
            
            // Clear old storage
            await this.context.globalState.update(this.STORAGE_KEY, []);
        }
        
        // Load entries from synced storage
        this.entries = await this.getSyncedEntries();
    }

    private mergeTimeEntries(entries1: TimeEntry[], entries2: TimeEntry[]): TimeEntry[] {
        const mergedMap = new Map<string, TimeEntry>();
        
        // Helper function to add entries to the map
        const addToMap = (entry: TimeEntry) => {
            const key = `${entry.date}-${entry.project}`;
            if (!mergedMap.has(key)) {
                mergedMap.set(key, { ...entry });
            } else {
                // Take the higher timeSpent value
                const existing = mergedMap.get(key)!;
                if (entry.timeSpent > existing.timeSpent) {
                    existing.timeSpent = entry.timeSpent;
                }
            }
        };

        // Add entries from both sources
        entries1.forEach(addToMap);
        entries2.forEach(addToMap);

        return Array.from(mergedMap.values());
    }

    private getLocalDateString(date: Date): string {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }

    private async getSyncedEntries(): Promise<TimeEntry[]> {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        return config.get<TimeEntry[]>(this.STORAGE_KEY, []);
    }

    private async updateSyncedEntries(entries: TimeEntry[]): Promise<void> {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        await config.update(this.STORAGE_KEY, entries, vscode.ConfigurationTarget.Global);
    }

    async addEntry(date: Date, project: string, timeSpent: number) {
        const dateString = this.getLocalDateString(date);
        const entries = await this.getSyncedEntries();
        
        const existingEntryIndex = entries.findIndex(entry => entry.date === dateString && entry.project === project);

        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex].timeSpent += timeSpent;
        } else {
            entries.push({ date: dateString, project, timeSpent });
        }

        try {
            await this.updateSyncedEntries(entries);
            this.entries = entries;
        } catch (error) {
            console.error('Error saving entry:', error);
            vscode.window.showErrorMessage('Failed to save time entry');
        }
    }

    getEntries(): TimeEntry[] {
        return this.entries || [];
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
        const today = this.getLocalDateString(new Date());
        const entries = this.getEntries();
        const updatedEntries = entries.filter(entry => entry.date !== today);
        await this.updateSyncedEntries(updatedEntries);
    }

    async resetAllTime(): Promise<void> {
        await this.updateSyncedEntries([]);
    }
}