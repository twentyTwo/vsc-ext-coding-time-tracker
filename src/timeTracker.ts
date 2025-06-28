import * as vscode from 'vscode';
import { Database, TimeEntry } from './database';
import { simpleGit, SimpleGit } from 'simple-git';
import { Logger } from './logger';

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
    private logger: Logger;
    private updateInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;
    private saveIntervalSeconds: number = 5;
    private lastCursorActivity: number = Date.now();
    private cursorInactivityTimeout: NodeJS.Timeout | null = null;
    private inactivityTimeoutSeconds: number = 180;
    private focusTimeoutHandle: NodeJS.Timeout | null = null;
    private focusTimeoutSeconds: number = 180;
    private gitWatcher: GitWatcher | null = null;
    private branchCheckInterval: NodeJS.Timeout | null = null;
    private lastUpdateTime: number = Date.now();
    private lastFocusTime: number = Date.now();
    // Track time between updates for validation

    constructor(database: Database) {
        this.database = database;
        this.logger = Logger.getInstance();
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
        vscode.window.onDidChangeWindowState(async (e) => {
            const now = Date.now();
            if (e.focused) {
                if (this.focusTimeoutHandle) {
                    // Window regained focus within the timeout period
                    clearTimeout(this.focusTimeoutHandle);
                    this.focusTimeoutHandle = null;
                    
                    // Save current session before starting new one
                    if (this.isTracking) {
                        await this.saveCurrentSession('window focus gained');
                    }
                    this.startTracking('focus regained');
                }
                this.lastFocusTime = now;
            } else {
                // Save session when losing focus
                if (this.isTracking) {
                    await this.saveCurrentSession('window focus lost');
                }
                
                if (this.focusTimeoutHandle) {
                    clearTimeout(this.focusTimeoutHandle);
                }
                this.focusTimeoutHandle = setTimeout(() => {
                    if (this.isTracking) {
                        this.stopTracking('focus timeout');
                    }
                }, this.focusTimeoutSeconds * 1000);
            }
        });
    }

    public updateConfiguration() {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        // this.saveIntervalSeconds = config.get('saveInterval', 5);
        this.inactivityTimeoutSeconds = config.get('inactivityTimeout', 180);
        this.focusTimeoutSeconds = config.get('focusTimeout', 180);
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
                    this.logger.logEvent('inactivity_detected', {
                        project: this.currentProject,
                        branch: this.currentBranch,
                        inactivityDuration: inactivityDuration / 1000,
                        lastActivityTime: new Date(this.lastCursorActivity).toISOString()
                    });
                    this.stopTracking('inactivity');
                }
            }, this.inactivityTimeoutSeconds * 1000);
        }

        this.lastCursorActivity = currentTime;
    }

    public async updateCursorActivity() {
        if (!this.isTracking) {
            await this.startTracking('cursor activity');
            return;
        }

        const currentProject = this.getCurrentProject();
        if (currentProject !== this.currentProject) {
            // Save time for previous project before switching
            await this.saveCurrentSession();
            this.currentProject = currentProject;
            this.startTime = Date.now();
        }

        this.lastCursorActivity = Date.now();
        this.setupCursorTracking();
    }

    async startTracking(reason: string = 'manual') {
        if (!this.isTracking) {
            await this.updateCurrentBranch();
            const now = Date.now();
            this.isTracking = true;
            this.startTime = now;
            this.lastUpdateTime = now;
            this.lastSaveTime = now;
            this.currentProject = this.getCurrentProject();
            
            this.logger.logEvent('tracking_started', {
                reason,
                project: this.currentProject,
                branch: this.currentBranch,
                startTime: new Date(now).toISOString()
            });

            // Only need update interval for UI updates
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            
            this.setupCursorTracking();
            await this.setupGitWatcher();
        }
    }

    stopTracking(reason?: string) {
        if (this.isTracking) {
            const now = Date.now();
            this.isTracking = false;
            
            // Clear update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            if (this.cursorInactivityTimeout) {
                clearTimeout(this.cursorInactivityTimeout);
                this.cursorInactivityTimeout = null;
            }

            this.logger.logEvent('tracking_stopped', {
                reason: reason || 'manual',
                project: this.currentProject,
                branch: this.currentBranch,
                stopTime: new Date(now).toISOString(),
                sessionDuration: (now - this.startTime) / 60000
            });

            // Save the final session
            this.saveCurrentSession(reason);

            // Reset tracking state
            this.lastSaveTime = 0;
            this.stopGitWatcher();
        }
    }

    private validateTimeGap(): boolean {
        const now = Date.now();
        this.lastUpdateTime = now;
        return true;
    }

    private updateCurrentSession() {
        // Validate time gap before updating session
        if (!this.validateTimeGap()) {
            return;
        }
        // This method will be called every second when tracking is active
        // You can emit an event here if you want to update the UI more frequently
    }

    private lastSaveTime: number = 0;

    public async saveCurrentSession(reason?: string) {
        const now = Date.now();
        let duration = (now - this.startTime) / 60000; // Convert to minutes
        
        // Adjust duration based on the reason for session end
        if (reason === 'inactivity' && this.inactivityTimeoutSeconds) {
            // Subtract the inactivity timeout period
            duration = Math.max(0, duration - this.inactivityTimeoutSeconds / 60);
        } else if (reason === 'focus timeout' && this.focusTimeoutSeconds) {
            // Subtract the focus timeout period
            duration = Math.max(0, duration - this.focusTimeoutSeconds / 60);
        }

        if (duration > 0) {
            // Log the session being saved
            this.logger.logEvent('session_saved', {
                reason: reason || 'periodic',
                project: this.currentProject,
                branch: this.currentBranch,
                duration,
                startTime: new Date(this.startTime).toISOString(),
                endTime: new Date(now).toISOString()
            });
            
            await this.database.addEntry(new Date(), this.currentProject, duration, this.currentBranch);
            this.startTime = now; // Reset start time for next session
            this.lastSaveTime = now;
        }
    }    
    
    getCurrentProject(): string {
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
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
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

    public registerStatusBarCommand(command: string) {
        return vscode.commands.registerCommand(command, () => {
            if (this.isTracking) {
                // Save current session with manual save reason
                this.saveCurrentSession('manual status bar click');
                
                // Log the manual save event
                this.logger.logEvent('manual_save', {
                    project: this.currentProject,
                    branch: this.currentBranch,
                    duration: (Date.now() - this.startTime) / 60000,
                    startTime: new Date(this.startTime).toISOString(),
                    endTime: new Date().toISOString()
                });
                
                // Reset start time for next session
                this.startTime = Date.now();
                
                // Show confirmation to user
                vscode.window.showInformationMessage('Time entry saved manually');
            }
        });
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
                this.logger.logEvent('branch_check_error', {
                    project: this.currentProject,
                    currentBranch: this.currentBranch,
                    error: 'No workspace folder found'
                });
                return;
            }

            const git = simpleGit(workspaceFolder.uri.fsPath);
            const isGitRepo = await git.checkIsRepo();
            
            if (!isGitRepo) {
                this.logger.logEvent('branch_check_error', {
                    project: this.currentProject,
                    currentBranch: this.currentBranch,
                    error: 'Not a git repository'
                });
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
            this.logger.logEvent('branch_check_error', {
                project: this.currentProject,
                currentBranch: this.currentBranch,
                error: error instanceof Error ? 
                    `Git setup error: ${error.message}` : 
                    'Unknown git setup error',
                location: 'setupGitWatcher'
            });
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
                // Log branch change event
                this.logger.logEvent('branch_changed', {
                    project: this.currentProject,
                    oldBranch: this.gitWatcher.lastKnownBranch,
                    newBranch: currentBranch
                });

                // Save the current session with the old branch
                await this.saveCurrentSession(`branch change from ${this.gitWatcher.lastKnownBranch} to ${currentBranch}`);

                // Update branch tracking
                this.gitWatcher.lastKnownBranch = currentBranch;
                this.currentBranch = currentBranch;

                // Start a new session from this point
                this.startTime = Date.now();
            }
        } catch (error) {
            this.logger.logEvent('branch_check_error', {
                project: this.currentProject,
                currentBranch: this.currentBranch,
                error: error instanceof Error ? 
                    `Branch check error: ${error.message}` : 
                    'Unknown branch check error',
                location: 'checkBranchChanges'
            });
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