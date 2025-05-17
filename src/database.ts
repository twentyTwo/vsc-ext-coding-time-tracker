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
    private syncInterval: NodeJS.Timeout | null = null;
    private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
    private hasUnsyncedChanges = false;
    private readonly MAX_RETRY_INTERVAL = 30 * 60 * 1000; // 30 minutes
    private retryCount = 0;

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

        // Start periodic sync
        this.startPeriodicSync();
    }

    async syncNow(): Promise<void> {
        if (!this.entries) return;
        
        try {
            const currentEntries = await this.getSyncedEntries();
            const mergedEntries = this.mergeTimeEntries(currentEntries, this.entries);
            await this.updateSyncedEntries(mergedEntries);
            this.hasUnsyncedChanges = false;
            this.retryCount = 0;
        } catch (error) {
            console.error('Error during manual sync:', error);
            throw error;
        }
    }

    private startPeriodicSync() {
        // Clear any existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Initial sync on startup
        this.syncNow().catch(error => {
            console.error('Error during initial sync:', error);
        });

        // Set up new interval with exponential backoff
        this.scheduleNextSync();
    }

    private scheduleNextSync() {
        const interval = Math.min(
            this.SYNC_INTERVAL * Math.pow(2, this.retryCount),
            this.MAX_RETRY_INTERVAL
        );

        this.syncInterval = setInterval(async () => {
            if (this.hasUnsyncedChanges && this.entries) {
                try {
                    await this.syncNow();
                } catch (error) {
                    console.error('Error during periodic sync:', error);
                    this.retryCount++;
                    // Reschedule with increased interval
                    clearInterval(this.syncInterval!);
                    this.scheduleNextSync();
                }
            }
        }, interval);
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
        const entries = this.entries || await this.getSyncedEntries();
        
        const existingEntryIndex = entries.findIndex(entry => entry.date === dateString && entry.project === project);

        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex].timeSpent += timeSpent;
        } else {
            entries.push({ date: dateString, project, timeSpent });
        }

        try {
            // Update local entries
            this.entries = entries;
            this.hasUnsyncedChanges = true;
            
            // Store in local state as backup
            await this.context.globalState.update(this.STORAGE_KEY, entries);
        } catch (error) {
            console.error('Error saving entry:', error);
            vscode.window.showErrorMessage('Failed to save time entry');
        }
    }

    dispose() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        // Final sync before disposal if there are unsaved changes
        if (this.hasUnsyncedChanges && this.entries) {
            this.updateSyncedEntries(this.entries).catch(error => {
                console.error('Error during final sync:', error);
            });
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