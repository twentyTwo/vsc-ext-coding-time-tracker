import * as vscode from 'vscode';
import { Database, TimeEntry } from './database';
import { simpleGit, SimpleGit } from 'simple-git';

type GitWatcher = {
    git: SimpleGit;
    lastKnownBranch: string;
};

export class TimeTracker implements vscode.Disposable {
    private isTracking: boolean = false;
    private startTime: number = 0;
    private currentProject: string = '';
    private currentBranch: string = 'unknown';
    private database: Database;
    private updateInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;
    private saveIntervalSeconds: number = 5;
    private lastCursorActivity: number = Date.now();
    private cursorInactivityTimeout: NodeJS.Timeout | null = null;
    private inactivityTimeoutSeconds: number = 300;
    private focusTimeoutHandle: NodeJS.Timeout | null = null;
    private focusTimeoutSeconds: number = 60;
    private gitWatcher: GitWatcher | null = null;
    private branchCheckInterval: NodeJS.Timeout | null = null;
    private weekStartDay: number = 0; // 0 = Sunday by default

    private static readonly WEEKDAY_MAP: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };

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
        });        // Track active editor changes
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.currentProject = this.getCurrentProject();
            }
            this.updateCursorActivity();
        });

        // Track git branch changes
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.updateCurrentBranch();
        });

        // Track hover events
        vscode.languages.registerHoverProvider({ scheme: '*' }, {
            provideHover: () => {
                this.updateCursorActivity();
                return null;
            }
        });

        // Track type definition requests
        vscode.languages.registerTypeDefinitionProvider({ scheme: '*' }, {
            provideTypeDefinition: () => {
                this.updateCursorActivity();
                return null;
            }
        });

        // Track signature help requests
        vscode.languages.registerSignatureHelpProvider({ scheme: '*' }, {
            provideSignatureHelp: () => {
                this.updateCursorActivity();
                return null;
            }
        }, '(', ',');

        // Track when VS Code window gains focus
        vscode.window.onDidChangeWindowState((e) => {
            if (e.focused) {
                if (this.focusTimeoutHandle) {
                    clearTimeout(this.focusTimeoutHandle);
                    this.focusTimeoutHandle = null;
                }
                this.startTracking();
            } else {
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
        this.inactivityTimeoutSeconds = config.get('inactivityTimeout', 300);
        this.focusTimeoutSeconds = config.get('focusTimeout', 60);

        // Map string to number for weekStartDay
        const weekStartDayStr = config.get<string>('weekStartDay', 'Sunday');
        this.weekStartDay = TimeTracker.WEEKDAY_MAP[weekStartDayStr] ?? 0; 
    }

    private async updateCurrentBranch() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.currentBranch = 'unknown';
                return;
            }

            const git = simpleGit(workspaceFolder.uri.fsPath);
            try {
                const branchInfo = await git.branch();
                this.currentBranch = branchInfo.current || 'unknown';
            } catch (error) {
                this.currentBranch = 'unknown';
            }
        } catch (error) {
            this.currentBranch = 'unknown';
        }
    }

    private setupCursorTracking() {
        if (this.cursorInactivityTimeout) {
            clearTimeout(this.cursorInactivityTimeout);
        }

        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - this.lastCursorActivity;

        if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
            this.cursorInactivityTimeout = setTimeout(() => {
                const now = Date.now();
                const inactivityDuration = now - this.lastCursorActivity;
                
                if (this.isTracking && inactivityDuration >= this.inactivityTimeoutSeconds * 1000) {
                    this.stopTracking();
                    this.saveCurrentSession();
                }
            }, this.inactivityTimeoutSeconds * 1000);
        }

        this.lastCursorActivity = currentTime;
    }

    public async updateCursorActivity() {
        if (!this.isTracking) {
            await this.startTracking();
        }

        this.lastCursorActivity = Date.now();
        this.setupCursorTracking();
    }

    async startTracking() {
        if (!this.isTracking) {
            await this.updateCurrentBranch();
            this.isTracking = true;
            this.startTime = Date.now();
            this.currentProject = this.getCurrentProject();
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            this.saveInterval = setInterval(() => this.saveCurrentSession(), this.saveIntervalSeconds * 1000);
            this.setupCursorTracking();
            await this.setupGitWatcher(); // Set up real-time branch monitoring
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
            this.stopGitWatcher(); // Clean up branch monitoring
        }
    }

    private updateCurrentSession() {
        // This method will be called every second when tracking is active
        // You can emit an event here if you want to update the UI more frequently
    }

    private async saveCurrentSession() {
        if (this.isTracking) {
            const duration = (Date.now() - this.startTime) / 60000;
            await this.database.addEntry(new Date(), this.currentProject, duration, this.currentBranch);
            this.startTime = Date.now();
        }
    }    private getCurrentProject(): string {
        // If we have a current project name, keep using it
        if (this.currentProject && this.currentProject !== 'Unknown Project') {
            return this.currentProject;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        // No workspace folders open
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return 'Unknown Project';
        }

        // Single workspace
        if (workspaceFolders.length === 1) {
            return workspaceFolders[0].name;
        }

        // Multi-root workspace
        const workspaceName = vscode.workspace.name || 'Default Workspace';
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
            if (workspaceFolder) {
                return `${workspaceName}/${workspaceFolder.name}`;
            }
        }

        // Default to first workspace if no active editor
        return workspaceFolders[0].name;
    }

    private getExternalProjectName(uri: vscode.Uri): string {
        if (uri.scheme !== 'file') {
            return 'Virtual Files';
        }

        const path = uri.fsPath;
        const parentFolder = path.split(/[\\/]/);
        
        const folders = parentFolder.filter(Boolean);
        if (folders.length >= 2) {
            return `${folders[folders.length - 2]}/${folders[folders.length - 1]}`;
        }
        
        return 'Other';
    }

    private getLocalDateString(date: Date): string {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }

    async getTodayTotal(): Promise<number> {
        const today = this.getLocalDateString(new Date());
        const entries = await this.database.getEntries();
        const todayTotal = entries
            .filter((entry: TimeEntry) => entry.date === today)
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return todayTotal + currentSessionTime;
            }
        }
        
        return todayTotal;
    }

    async getCurrentProjectTime(): Promise<number> {
        const today = this.getLocalDateString(new Date());
        const currentProject = this.getCurrentProject();
        const entries = await this.database.getEntries();
        const currentProjectTime = entries
            .filter((entry: TimeEntry) => 
                entry.date === today && 
                entry.project === currentProject && 
                entry.branch === this.currentBranch
            )
            .reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);
        
        if (this.isTracking && this.currentProject === currentProject) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return currentProjectTime + currentSessionTime;
            }
        }
        
        return currentProjectTime;
    }

    async getWeeklyTotal(): Promise<number> {
        const now = new Date();
        // Calculate difference between current day and weekStartDay
        let diff = now.getDay() - this.weekStartDay;
        if (diff < 0) diff += 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        return this.getTotalSince(startOfWeek);
    }

    async getMonthlyTotal(): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.getTotalSince(startOfMonth);
    }

    async getAllTimeTotal(): Promise<number> {
        const entries = await this.database.getEntries();
        const total = entries.reduce((sum: number, entry: TimeEntry) => sum + entry.timeSpent, 0);

        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return total + currentSessionTime;
            }
        }

        return total;
    }

    private async getTotalSince(startDate: Date): Promise<number> {
        const entries = await this.database.getEntries();
        const startDateString = this.getLocalDateString(startDate);
        const now = this.getLocalDateString(new Date());
        
        const filteredEntries = entries.filter(entry => 
            entry.date >= startDateString && entry.date <= now
        );

        const total = filteredEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);

        if (this.isTracking) {
            const timeSinceLastActivity = Date.now() - this.lastCursorActivity;
            if (timeSinceLastActivity < this.inactivityTimeoutSeconds * 1000) {
                const currentSessionTime = (Date.now() - this.startTime) / 60000;
                return total + currentSessionTime;
            }
        }

        return total;
    }

    async getYearlyTotal(): Promise<number> {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return this.getTotalSince(startOfYear);
    }

    dispose() {
        this.stopTracking();
    }

    isActive(): boolean {
        return this.isTracking;
    }

    getCurrentBranch(): string {
        return this.currentBranch;
    }

    private async setupGitWatcher() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }

            const git = simpleGit(workspaceFolder.uri.fsPath);
            const isGitRepo = await git.checkIsRepo();
            
            if (!isGitRepo) {
                return;
            }

            const branchInfo = await git.branch();
            this.gitWatcher = {
                git,
                lastKnownBranch: branchInfo.current || 'unknown'
            };

            // Check for branch changes every second
            this.branchCheckInterval = setInterval(async () => {
                await this.checkBranchChanges();
            }, 1000);

        } catch (error) {
            console.error('Error setting up git watcher:', error);
        }
    }

    private async checkBranchChanges() {
        if (!this.gitWatcher || !this.isTracking) {
            return;
        }

        try {
            const branchInfo = await this.gitWatcher.git.branch();
            const currentBranch = branchInfo.current || 'unknown';

            // If branch has changed
            if (currentBranch !== this.gitWatcher.lastKnownBranch) {
                // Save the current session with the old branch
                await this.saveCurrentSession();

                // Update branch tracking
                this.gitWatcher.lastKnownBranch = currentBranch;
                this.currentBranch = currentBranch;

                // Start a new session
                this.startTime = Date.now();
            }
        } catch (error) {
            console.error('Error checking branch changes:', error);
        }
    }

    private stopGitWatcher() {
        if (this.branchCheckInterval) {
            clearInterval(this.branchCheckInterval);
            this.branchCheckInterval = null;
        }
        this.gitWatcher = null;
    }
}