import * as vscode from 'vscode';
import { Database, TimeEntry } from './database';

export class TimeTracker implements vscode.Disposable {
    private isTracking: boolean = false;
    private startTime: number = 0;
    private currentProject: string = '';
    private database: Database;
    private updateInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;    private saveIntervalSeconds: number = 5;
    private lastCursorActivity: number = Date.now();
    private cursorInactivityTimeout: NodeJS.Timeout | null = null;
    private inactivityTimeoutSeconds: number = 300;
    private focusTimeoutHandle: NodeJS.Timeout | null = null;
    private focusTimeoutSeconds: number = 60;

    constructor(database: Database) {
        this.database = database;
        this.updateConfiguration();

        // Track cursor movements
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.updateCursorActivity();
        });

        // Track text changes
        vscode.workspace.onDidChangeTextDocument(() => {
            this.updateCursorActivity();
        });

        // Track active editor changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateCursorActivity();
        });

        // Track hover events
        vscode.languages.registerHoverProvider({ scheme: '*' }, {
            provideHover: () => {
                this.updateCursorActivity();
                return null;
            }
        });

        // Track type definition requests (triggered by mouse movement over symbols)
        vscode.languages.registerTypeDefinitionProvider({ scheme: '*' }, {
            provideTypeDefinition: () => {
                this.updateCursorActivity();
                return null;
            }
        });

        // Track signature help requests (triggered by hovering over function calls)
        vscode.languages.registerSignatureHelpProvider({ scheme: '*' }, {
            provideSignatureHelp: () => {
                this.updateCursorActivity();
                return null;
            }
        }, '(', ',');

        // Track when VS Code window gains focus
        vscode.window.onDidChangeWindowState((e) => {
            if (e.focused) {
                // Clear any pending timeout when focus returns
                if (this.focusTimeoutHandle) {
                    clearTimeout(this.focusTimeoutHandle);
                    this.focusTimeoutHandle = null;
                }
                this.startTracking();
            } else {
                // Set timeout when focus is lost
                if (this.focusTimeoutHandle) {
                    clearTimeout(this.focusTimeoutHandle);
                }
                this.focusTimeoutHandle = setTimeout(() => {
                    if (this.isTracking) {
                        this.stopTracking();
                    }
                }, this.focusTimeoutSeconds * 1000);
            }
        });
    }

    public updateConfiguration() {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        this.saveIntervalSeconds = config.get('saveInterval', 5);
        this.inactivityTimeoutSeconds = config.get('inactivityTimeout', 300); // Default 5 minutes in seconds
        this.focusTimeoutSeconds = config.get('focusTimeout', 60);
    }

    private setupCursorTracking() {
        if (this.cursorInactivityTimeout) {
            clearTimeout(this.cursorInactivityTimeout);
        }

        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - this.lastCursorActivity;

        // Only setup new timeout if we haven't exceeded the inactivity threshold
        if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
            // Set up cursor activity tracking
            this.cursorInactivityTimeout = setTimeout(() => {
                const now = Date.now();
                const inactivityDuration = now - this.lastCursorActivity;
                
                // Only stop tracking if we've truly been inactive
                if (this.isTracking && inactivityDuration >= this.inactivityTimeoutSeconds * 1000) {
                    this.stopTracking();
                    this.saveCurrentSession();
                }
            }, this.inactivityTimeoutSeconds * 1000); // Convert seconds to milliseconds
        }

        this.lastCursorActivity = currentTime;
    }

    public updateCursorActivity() {
        if (!this.isTracking) {
            this.startTracking();
        }

        // Update the last activity timestamp
        this.lastCursorActivity = Date.now();

        // Reset and setup the inactivity timer
        this.setupCursorTracking();
    }

    startTracking() {
        if (!this.isTracking) {
            this.isTracking = true;
            this.startTime = Date.now();
            this.currentProject = this.getCurrentProject();
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            this.saveInterval = setInterval(() => this.saveCurrentSession(), this.saveIntervalSeconds * 1000); // Convert seconds to milliseconds
            this.setupCursorTracking();
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
            if (this.cursorInactivityTimeout) {
                clearTimeout(this.cursorInactivityTimeout);
                this.cursorInactivityTimeout = null;
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
        if (!workspaceFolders) {
            return 'Unknown Project';
        }

        // Get the active text editor
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return 'No Active File';
        }

        // Get workspace information
        const workspaceName = vscode.workspace.name || 'Default Workspace';
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);

        if (!workspaceFolder) {
            // File is outside any workspace folder
            return `External/${this.getExternalProjectName(activeEditor.document.uri)}`;
        }

        // If we're in a multi-root workspace, prefix with workspace name
        if (workspaceFolders.length > 1) {
            return `${workspaceName}/${workspaceFolder.name}`;
        }

        return workspaceFolder.name;
    }

    private getExternalProjectName(uri: vscode.Uri): string {
        // Handle different scenarios for external files
        if (uri.scheme !== 'file') {
            return 'Virtual Files';
        }

        // Get the parent folder name for external files
        const path = uri.fsPath;
        const parentFolder = path.split(/[\\/]/);
        
        // Remove empty segments and file name
        const folders = parentFolder.filter(Boolean);
        if (folders.length >= 2) {
            // Return "ParentFolder/CurrentFolder"
            return `${folders[folders.length - 2]}/${folders[folders.length - 1]}`;
        }
        
        return 'Other';
    }

    private getLocalDateString(date: Date): string {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }

    getTodayTotal(): number {
        const today = this.getLocalDateString(new Date());
        const entries = this.database.getEntries();
        const todayTotal = entries
            .filter((entry: TimeEntry) => entry.date === today)
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        // Add the current session time if tracking is active and we haven't exceeded inactivity threshold
        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            // Only include current session if we're still within the activity window
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return todayTotal + currentSessionTime;
            }
        }
        
        return todayTotal;
    }

    getCurrentProjectTime(): number {
        const today = this.getLocalDateString(new Date());
        const currentProject = this.getCurrentProject();
        const entries = this.database.getEntries();
        const currentProjectTime = entries
            .filter((entry: TimeEntry) => entry.date === today && entry.project === currentProject)
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        // Add the current session time if tracking is active and within activity window
        if (this.isTracking && this.currentProject === currentProject) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return currentProjectTime + currentSessionTime;
            }
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

        // Add current session if tracking is active and within activity window
        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return total + currentSessionTime;
            }
        }

        return total;
    }

    private getTotalSince(startDate: Date): number {
        const entries = this.database.getEntries();
        const startDateString = this.getLocalDateString(startDate);
        const now = this.getLocalDateString(new Date());
        
        const filteredEntries = entries.filter(entry => 
            entry.date >= startDateString && entry.date <= now
        );

        const total = filteredEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);

        // Add current session if tracking is active and within activity window
        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return total + currentSessionTime;
            }
        }

        return total;
    }

    getYearlyTotal(): number {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        return this.getTotalSince(startOfYear);
    }    dispose() {
        this.stopTracking();
    }

    isActive(): boolean {
        return this.isTracking;
    }
}