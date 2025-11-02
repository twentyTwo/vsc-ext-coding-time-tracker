import * as vscode from 'vscode';
import { Database, TimeEntry } from './database';
import { simpleGit, SimpleGit } from 'simple-git';
import { Logger } from './logger';
import { HealthNotificationManager } from './healthNotifications';
import { detectLanguageFromFile, detectLanguageFromLanguageId, detectActivityFromUri } from './utils';

type GitWatcher = {
    git: SimpleGit;
    lastKnownBranch: string;
};

export class TimeTracker implements vscode.Disposable {
    private isTracking: boolean = false;
    private isPaused: boolean = false; // New: track if user manually paused
    private startTime: number = 0;
    private currentProject: string = '';
    private currentBranch: string = 'unknown';
    private currentLanguage: string = 'unknown';
    private database: Database;
    private logger: Logger;
    private updateInterval: NodeJS.Timeout | null = null;
    private saveInterval: NodeJS.Timeout | null = null;
    private saveIntervalSeconds: number = 5;
    private lastCursorActivity: number = Date.now();
    private cursorInactivityTimeout: NodeJS.Timeout | null = null;
    private inactivityTimeoutSeconds: number = 150; // Default 2.5 minutes * 60 = 150 seconds
    private focusTimeoutHandle: NodeJS.Timeout | null = null;
    private focusTimeoutSeconds: number = 180; // Default 3 minutes * 60 = 180 seconds
    private gitWatcher: GitWatcher | null = null;
    private branchCheckInterval: NodeJS.Timeout | null = null;
    private isCheckingBranch: boolean = false;
    private lastUpdateTime: number = Date.now();
    private lastFocusTime: number = Date.now();
    private healthManager: HealthNotificationManager;
    private trackTerminal: boolean = true;
    private trackAIChat: boolean = true;
    private lastTerminalActivity: number = 0;
    private terminalCheckInterval: NodeJS.Timeout | null = null;
    // Track time between updates for validation

    constructor(database: Database) {
        this.database = database;
        this.logger = Logger.getInstance();
        this.healthManager = new HealthNotificationManager(
            () => this.pauseForHealthBreak(), 
            () => this.resumeFromHealthBreak()
        );
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
                this.updateCurrentLanguage();
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
                }
                
                // Save current session if tracking (but don't restart immediately)
                if (this.isTracking) {
                    await this.saveCurrentSession('window focus gained');
                }
                
                // Start or continue tracking
                if (!this.isTracking) {
                    this.startTracking('focus regained');
                }
                
                this.lastFocusTime = now;
                this.lastCursorActivity = now; // Update activity on focus
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

        // Track terminal activity - but only update language, not activity
        // Activity will be updated by shell execution events or periodic check
        vscode.window.onDidChangeActiveTerminal((terminal) => {
            if (terminal && this.trackTerminal) {
                // Don't set lastTerminalActivity here - wait for actual commands
                this.updateCurrentLanguage();
                // Only trigger activity if we were already tracking in terminal recently
                const timeSinceTerminalActivity = Date.now() - this.lastTerminalActivity;
                if (timeSinceTerminalActivity < 10000) {
                    this.updateCursorActivity();
                }
            }
        });

        // Track when terminal opens - just update language
        vscode.window.onDidOpenTerminal((terminal) => {
            if (this.trackTerminal) {
                this.updateCurrentLanguage();
                // Don't automatically start tracking just because terminal opened
            }
        });

        // Track terminal state changes (like becoming active)
        vscode.window.onDidChangeTerminalState((terminal) => {
            if (this.trackTerminal && terminal === vscode.window.activeTerminal) {
                this.updateCurrentLanguage();
                // Don't automatically update activity on state change
            }
        });

        // Track terminal shell integration events for actual command execution
        vscode.window.onDidStartTerminalShellExecution?.(() => {
            if (this.trackTerminal) {
                this.lastTerminalActivity = Date.now();
                this.updateCurrentLanguage();
                this.updateCursorActivity();
            }
        });

        vscode.window.onDidEndTerminalShellExecution?.(() => {
            if (this.trackTerminal) {
                this.lastTerminalActivity = Date.now();
                this.updateCurrentLanguage();
                this.updateCursorActivity();
            }
        });

        // Track terminal shell integration changes
        vscode.window.onDidChangeTerminalShellIntegration?.(() => {
            if (this.trackTerminal) {
                this.lastTerminalActivity = Date.now();
                this.updateCurrentLanguage();
                this.updateCursorActivity();
            }
        });

        // Start periodic check for terminal activity
        this.startTerminalActivityMonitoring();
    }

    public updateConfiguration() {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        // this.saveIntervalSeconds = config.get('saveInterval', 5);
        // Convert from minutes to seconds for internal use
        this.inactivityTimeoutSeconds = config.get('inactivityTimeout', 2.5) * 60;
        this.focusTimeoutSeconds = config.get('focusTimeout', 3) * 60;
        this.trackTerminal = config.get('trackTerminalActivity', true);
        this.trackAIChat = config.get('trackAIChatActivity', true);
        
        // Update health notification settings
        if (this.healthManager) {
            this.healthManager.updateSettings();
        }
    }

    private startTerminalActivityMonitoring() {
        // Stop any existing monitoring
        if (this.terminalCheckInterval) {
            clearInterval(this.terminalCheckInterval);
        }

        // Check every 2 seconds if terminal is active AND there was recent activity
        this.terminalCheckInterval = setInterval(() => {
            if (this.trackTerminal && vscode.window.activeTerminal) {
                const now = Date.now();
                const timeSinceTerminalActivity = now - this.lastTerminalActivity;
                
                // Only treat as activity if:
                // 1. Terminal had actual activity in the last 5 seconds (from shell events)
                // 2. AND there's no active text editor (terminal has focus)
                if (timeSinceTerminalActivity < 5000 && !vscode.window.activeTextEditor) {
                    this.updateCurrentLanguage();
                    // Only update cursor activity if there was recent actual terminal activity
                    this.updateCursorActivity();
                }
            }
        }, 2000);
    }

    private updateCurrentBranch() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.currentBranch = 'unknown';
                return;
            }

            const git = simpleGit(workspaceFolder.uri.fsPath);
            try {
                const branchInfo = git.branch();
                branchInfo.then(info => {
                    this.currentBranch = info.current || 'unknown';
                });
            } catch (error) {
                this.currentBranch = 'unknown';
            }
        } catch (error) {
            this.currentBranch = 'unknown';
        }
    }

    private updateCurrentLanguage() {
        const activeEditor = vscode.window.activeTextEditor;
        
        // SIMPLIFIED APPROACH: Check what has focus and what user is actively doing
        
        // First check if there's an active text editor (could be AI chat, code file, etc.)
        if (activeEditor) {
            // Check for AI Chat and special activities first
            if (this.trackAIChat) {
                const activityType = detectActivityFromUri(
                    activeEditor.document.uri.toString(),
                    activeEditor.document.languageId
                );
                
                if (activityType !== 'unknown') {
                    this.currentLanguage = activityType;
                    return;
                }
            }
            
            // Regular code editor - detect language from file
            if (activeEditor.document.languageId) {
                const detectedLanguage = detectLanguageFromLanguageId(activeEditor.document.languageId);
                this.currentLanguage = detectedLanguage;
            } else {
                // Fall back to file extension detection
                this.currentLanguage = detectLanguageFromFile(activeEditor.document.fileName);
            }
            return;
        }
        
        // No active text editor - check if terminal has focus
        if (this.trackTerminal && vscode.window.activeTerminal) {
            this.currentLanguage = 'Terminal';
            return;
        }
        
        // Nothing has focus
        this.currentLanguage = 'unknown';
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
                        language: this.currentLanguage,
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
        // Don't auto-resume if user manually paused
        if (this.isPaused) {
            console.log('Timer is manually paused - not auto-resuming');
            return;
        }

        if (!this.isTracking) {
            await this.startTracking('cursor activity');
            return;
        }

        const currentProject = this.getCurrentProject();
        this.updateCurrentLanguage();
        
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
            this.updateCurrentBranch();
            this.updateCurrentLanguage();
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
                language: this.currentLanguage,
                startTime: new Date(now).toISOString()
            });

            // Only need update interval for UI updates
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            this.updateInterval = setInterval(() => this.updateCurrentSession(), 1000);
            
            this.setupCursorTracking();
            await this.setupGitWatcher();
            
            // Start health notifications
            this.healthManager.start();
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
                language: this.currentLanguage,
                stopTime: new Date(now).toISOString(),
                sessionDuration: (now - this.startTime) / 60000
            });

            // Save the final session
            this.saveCurrentSession(reason);

            // Reset tracking state
            this.lastSaveTime = 0;
            this.stopGitWatcher();
            
            // Stop health notifications
            this.healthManager.stop();
        }
    }

    public pauseTimer() {
        console.log('pauseTimer() called - stopping tracking');
        this.isPaused = true;
        this.logger.logEvent('manual_pause_triggered', {
            reason: 'health notification pause button',
            project: this.currentProject,
            branch: this.currentBranch,
            language: this.currentLanguage,
            sessionDuration: (Date.now() - this.startTime) / 60000,
            wasTracking: this.isTracking
        });
        
        if (this.isTracking) {
            this.stopTracking('health notification pause');
            console.log('Timer successfully stopped');
        } else {
            console.log('Timer was already stopped');
        }
        
        // Set up a simple way for user to resume - through a command or status bar click
        vscode.window.showInformationMessage(
            'Coding timer paused. Click "Resume" to continue tracking.', 
            'Resume'
        ).then(selection => {
            if (selection === 'Resume') {
                this.resumeTimer();
            }
        });
        // Note: Don't show additional messages here as it conflicts with modal notifications
    }

    public resumeTimer(): void {
        console.log('Resuming timer after manual pause');
        this.isPaused = false;
        this.startTracking('manual resume');
    }

    public pauseForHealthBreak(): void {
        console.log('pauseForHealthBreak() called - auto-pausing for health modal');
        this.logger.logEvent('health_break_pause', {
            reason: 'health modal appeared',
            project: this.currentProject,
            branch: this.currentBranch,
            language: this.currentLanguage,
            sessionDuration: (Date.now() - this.startTime) / 60000,
            wasTracking: this.isTracking
        });
        
        if (this.isTracking) {
            this.stopTracking('health modal pause');
            console.log('Timer auto-paused for health break');
        }
    }

    public resumeFromHealthBreak(): void {
        console.log('resumeFromHealthBreak() called - auto-resuming after health modal');
        this.logger.logEvent('health_break_resume', {
            reason: 'health modal dismissed',
            project: this.currentProject,
            branch: this.currentBranch,
            language: this.currentLanguage
        });
        
        // Only auto-resume if not manually paused
        if (!this.isPaused) {
            this.startTracking('health modal dismissed');
            console.log('Timer auto-resumed after health break');
        } else {
            console.log('Timer remains paused - user manually paused');
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
        if (!this.isTracking) {
            return; // Don't save if not tracking
        }

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

        // Only save if duration is at least 1 second (prevent micro-sessions)
        if (duration >= 0.0167) { // 1 second = 0.0167 minutes
            // Log the session being saved
            this.logger.logEvent('session_saved', {
                reason: reason || 'periodic',
                project: this.currentProject,
                branch: this.currentBranch,
                language: this.currentLanguage,
                duration,
                startTime: new Date(this.startTime).toISOString(),
                endTime: new Date(now).toISOString()
            });
            
            await this.database.addEntry(new Date(), this.currentProject, duration, this.currentBranch, this.currentLanguage);
            this.startTime = now; // Reset start time for next session
            this.lastSaveTime = now;
            this.lastCursorActivity = now; // Update last activity to prevent immediate inactivity
        } else {
            // For very short durations, just reset the start time without saving
            this.startTime = now;
            this.lastCursorActivity = now;
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
                entry.branch === this.currentBranch &&
                entry.language === this.currentLanguage
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
        // Make sure all intervals are stopped
        this.stopTracking('extension disposed');
        
        // Ensure git watcher is completely stopped
        this.stopGitWatcher();
        
        // Stop terminal monitoring
        if (this.terminalCheckInterval) {
            clearInterval(this.terminalCheckInterval);
            this.terminalCheckInterval = null;
        }
        
        // Dispose health notifications
        this.healthManager.dispose();
        
        // Clear any other potentially running intervals
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
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
                    language: this.currentLanguage,
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

    getCurrentLanguage(): string {
        return this.currentLanguage;
    }

    private async setupGitWatcher() {
        // Clear any existing interval first to prevent duplicate watchers
        this.stopGitWatcher();
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                this.logger.logEvent('branch_check_error', {
                    project: this.currentProject,
                    currentBranch: this.currentBranch,
                    currentLanguage: this.currentLanguage,
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
                    currentLanguage: this.currentLanguage,
                    error: 'Not a git repository'
                });
                return;
            }

            const branchInfo = await git.branch();
            this.gitWatcher = {
                git,
                lastKnownBranch: branchInfo.current || 'unknown'
            };

            // Check for branch changes less frequently to reduce CPU load
            // Changed from 1 second to 5 seconds to reduce the number of git processes spawned
            this.branchCheckInterval = setInterval(async () => {
                await this.checkBranchChanges();
            }, 5000);

        } catch (error) {
            this.logger.logEvent('branch_check_error', {
                project: this.currentProject,
                currentBranch: this.currentBranch,
                currentLanguage: this.currentLanguage,
                error: error instanceof Error ? 
                    `Git setup error: ${error.message}` : 
                    'Unknown git setup error',
                location: 'setupGitWatcher'
            });
            console.error('Error setting up git watcher:', error);
        }
    }

    private async checkBranchChanges() {
        // Prevent concurrent executions of branch checking
        if (this.isCheckingBranch || !this.gitWatcher || !this.isTracking) {
            return;
        }

        try {
            this.isCheckingBranch = true;
            const branchInfo = await this.gitWatcher.git.branch();
            const currentBranch = branchInfo.current || 'unknown';

            // If branch has changed
            if (currentBranch !== this.gitWatcher.lastKnownBranch) {
                // Log branch change event
                this.logger.logEvent('branch_changed', {
                    project: this.currentProject,
                    language: this.currentLanguage,
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
                currentLanguage: this.currentLanguage,
                error: error instanceof Error ? 
                    `Branch check error: ${error.message}` : 
                    'Unknown branch check error',
                location: 'checkBranchChanges'
            });
            console.error('Error checking branch changes:', error);
        } finally {
            // Always reset the flag to allow future checks
            this.isCheckingBranch = false;
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