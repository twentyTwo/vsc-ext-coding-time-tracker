import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

type LogEntry = {
    seq: number;
    time: string;
    event: string;
    project: string;
    branch: string;
    reason?: string;
    duration?: string;
    from?: string;
    to?: string;
    inactive_for?: string;
}

export class Logger {
    private logFilePath: string = '';
    private static instance: Logger;
    private currentDate: string = '';
    private eventCounter: number = 0;
    private static enableLogging: boolean = false;

    private constructor() {
        this.currentDate = this.getDateString();
        this.updateLogPath();
    }

    private updateLogPath() {
        if (Logger.enableLogging) {
            const storagePath = this.getStoragePath();
            this.logFilePath = path.join(storagePath, `timetracker_${this.currentDate}.log`);
            this.ensureLogFileExists();
        } else {
            this.logFilePath = '';
        }
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public static setLoggingEnabled(enabled: boolean) {
        Logger.enableLogging = enabled;
        if (Logger.instance) {
            Logger.instance.updateLogPath();
        }
    }

    public static isLoggingEnabled(): boolean {
        return Logger.enableLogging;
    }

    private getStoragePath(): string {
        const storagePath = path.join('C:', 'VSCodeTimeTracker', 'logs');
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        return storagePath;
    }

    private getDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }

    private formatDuration(seconds: number): string {
        return `${Math.round(seconds)}s`;
    }

    private ensureLogFileExists() {
        if (!Logger.enableLogging) {
            return;
        }
        const date = this.getDateString();
        if (date !== this.currentDate) {
            this.currentDate = date;
            this.logFilePath = path.join(this.getStoragePath(), `timetracker_${date}.log`);
            this.eventCounter = 0;
        }
        if (this.logFilePath && !fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, '');
        }
    }

    public logEvent(event: string, details: Record<string, any>) {
        if (!Logger.enableLogging) {
            return;
        }

        this.ensureLogFileExists();
        const now = new Date();
        this.eventCounter++;

        // Simplify the log entry
        const logEntry: LogEntry = {
            seq: this.eventCounter,
            time: this.formatTime(now),
            event,
            project: details.project || '',
            branch: details.branch || ''
        };

        // Add relevant details based on event type
        switch (event) {
            case 'tracking_started':
                logEntry.reason = details.reason;
                break;
            case 'session_saved':
                logEntry.duration = this.formatDuration(details.duration * 60);
                logEntry.reason = details.reason;
                break;
            case 'branch_changed':
                logEntry.from = details.oldBranch;
                logEntry.to = details.newBranch;
                break;
            case 'inactivity_detected':
                logEntry.inactive_for = this.formatDuration(details.inactivityDuration);
                break;
        }

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFilePath, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public getLogFilePath(): string {
        return this.logFilePath;
    }
}
