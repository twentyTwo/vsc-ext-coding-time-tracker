import * as vscode from 'vscode';

export interface HealthNotificationSettings {
    eyeRestInterval: number; // minutes
    stretchInterval: number; // minutes  
    breakThreshold: number; // minutes
    enableNotifications: boolean;
    modalNotifications: boolean; // Make all notifications modal
}

export class HealthNotificationManager {
    private eyeRestTimer?: any;
    private stretchTimer?: any;
    private breakTimer?: any;
    private settings!: HealthNotificationSettings;
    private onPauseCallback?: () => void;
    private onResumeCallback?: () => void;
    private isActive: boolean = false;

    constructor(onPauseCallback?: () => void, onResumeCallback?: () => void) {
        this.onPauseCallback = onPauseCallback;
        this.onResumeCallback = onResumeCallback;
        this.loadSettings();
    }

    private loadSettings(): void {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        this.settings = {
            eyeRestInterval: config.get('health.eyeRestInterval', 20),
            stretchInterval: config.get('health.stretchInterval', 45),
            breakThreshold: config.get('health.breakThreshold', 120),
            enableNotifications: config.get('health.enableNotifications', true),
            modalNotifications: config.get('health.modalNotifications', true)
        };
    }

    public updateSettings(): void {
        this.loadSettings();
        if (this.isActive) {
            this.stop();
            this.start();
        }
    }

    public start(): void {
        if (!this.settings.enableNotifications || this.isActive) {
            return;
        }

        this.isActive = true;
        this.startEyeRestReminder();
        this.startStretchReminder();
        this.startBreakReminder();
    }

    public stop(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.clearAllTimers();
    }

    private clearAllTimers(): void {
        if (this.eyeRestTimer) {
            clearTimeout(this.eyeRestTimer);
            this.eyeRestTimer = undefined;
        }
        if (this.stretchTimer) {
            clearTimeout(this.stretchTimer);
            this.stretchTimer = undefined;
        }
        if (this.breakTimer) {
            clearTimeout(this.breakTimer);
            this.breakTimer = undefined;
        }
    }

    private startEyeRestReminder(): void {
        this.eyeRestTimer = setTimeout(() => {
            this.showEyeRestNotification();
            // Restart timer for next reminder
            if (this.isActive) {
                this.startEyeRestReminder();
            }
        }, this.settings.eyeRestInterval * 60 * 1000);
    }

    private startStretchReminder(): void {
        this.stretchTimer = setTimeout(() => {
            this.showStretchNotification();
            // Restart timer for next reminder
            if (this.isActive) {
                this.startStretchReminder();
            }
        }, this.settings.stretchInterval * 60 * 1000);
    }

    private startBreakReminder(): void {
        this.breakTimer = setTimeout(() => {
            this.showBreakNotification();
            // Restart timer for next reminder
            if (this.isActive) {
                this.startBreakReminder();
            }
        }, this.settings.breakThreshold * 60 * 1000);
    }

    private async showEyeRestNotification(): Promise<void> {
        const remindAction = 'Remind me in 5 min';
        const doneAction = 'I just did it!';
        
        // Auto-pause timer when modal appears (if modal is enabled)
        if (this.settings.modalNotifications && this.onPauseCallback) {
            console.log('Eye rest modal: Auto-pausing timer');
            this.onPauseCallback();
        }
        
        const result = await vscode.window.showWarningMessage(
            '👁️ EYE HEALTH REMINDER: Look at something 20 feet away for 20 seconds (20-20-20 rule)',
            { modal: this.settings.modalNotifications },
            doneAction,
            remindAction
        );

        // Auto-resume timer when modal disappears (if modal is enabled)
        if (this.settings.modalNotifications && this.onResumeCallback) {
            console.log('Eye rest modal: Auto-resuming timer');
            this.onResumeCallback();
        }

        if (result === remindAction) {
            console.log('Eye rest notification: Snooze requested for 5 minutes');
            // Restart eye rest timer in 5 minutes instead of full interval
            if (this.eyeRestTimer) {
                clearTimeout(this.eyeRestTimer);
            }
            this.eyeRestTimer = setTimeout(() => {
                this.showEyeRestNotification();
                // After snooze, restart normal timer
                if (this.isActive) {
                    this.startEyeRestReminder();
                }
            }, 5 * 60 * 1000); // 5 minutes
            vscode.window.showInformationMessage('⏰ Eye rest reminder snoozed for 5 minutes');
        } else if (result === doneAction) {
            console.log('Eye rest notification: User completed eye rest exercise');
            vscode.window.showInformationMessage('👏 Excellent! Your eyes thank you for the break. Keep protecting your vision!');
        }
    }

    private async showStretchNotification(): Promise<void> {
        const remindAction = 'Remind me in 10 min';
        const doneAction = 'I just stretched!';
        
        // Auto-pause timer when modal appears (if modal is enabled)
        if (this.settings.modalNotifications && this.onPauseCallback) {
            console.log('Stretch modal: Auto-pausing timer');
            this.onPauseCallback();
        }
        
        const result = await vscode.window.showWarningMessage(
            '🧘 STRETCH REMINDER: Stand up and stretch your back and neck - Your body needs it!',
            { modal: this.settings.modalNotifications },
            doneAction,
            remindAction
        );

        // Auto-resume timer when modal disappears (if modal is enabled)
        if (this.settings.modalNotifications && this.onResumeCallback) {
            console.log('Stretch modal: Auto-resuming timer');
            this.onResumeCallback();
        }

        if (result === remindAction) {
            console.log('Stretch notification: Snooze requested for 10 minutes');
            // Restart stretch timer in 10 minutes instead of full interval
            if (this.stretchTimer) {
                clearTimeout(this.stretchTimer);
            }
            this.stretchTimer = setTimeout(() => {
                this.showStretchNotification();
                // After snooze, restart normal timer
                if (this.isActive) {
                    this.startStretchReminder();
                }
            }, 10 * 60 * 1000); // 10 minutes
            vscode.window.showInformationMessage('⏰ Stretch reminder snoozed for 10 minutes');
        } else if (result === doneAction) {
            console.log('Stretch notification: User completed stretching');
            vscode.window.showInformationMessage('💪 Amazing! Your back and neck feel better already. Keep up the healthy habits!');
        }
    }

    private async showBreakNotification(): Promise<void> {
        const remindAction = 'Remind me in 15 min';
        const doneAction = 'I took a break!';

        // Auto-pause timer when modal appears (if modal is enabled)
        if (this.settings.modalNotifications && this.onPauseCallback) {
            console.log('Break modal: Auto-pausing timer');
            this.onPauseCallback();
        }

        const result = await vscode.window.showErrorMessage(
            '🚨 HEALTH BREAK REQUIRED: You\'ve been coding for 2+ hours! Take a break now for your health.',
            { modal: this.settings.modalNotifications },
            doneAction,
            remindAction
        );

        // Auto-resume timer when modal disappears (if modal is enabled)
        if (this.settings.modalNotifications && this.onResumeCallback) {
            console.log('Break modal: Auto-resuming timer');
            this.onResumeCallback();
        }

        if (result === remindAction) {
            console.log('Break notification: Snooze requested for 15 minutes');
            // Restart break timer in 15 minutes instead of full interval
            if (this.breakTimer) {
                clearTimeout(this.breakTimer);
            }
            this.breakTimer = setTimeout(() => {
                this.showBreakNotification();
                // After snooze, restart normal timer
                if (this.isActive) {
                    this.startBreakReminder();
                }
            }, 15 * 60 * 1000); // 15 minutes
            vscode.window.showInformationMessage('⏰ Break reminder snoozed for 15 minutes');
        } else if (result === doneAction) {
            console.log('Break notification: User took a proper break');
            vscode.window.showInformationMessage('🌟 Outstanding! You prioritized your health. Your mind and body are recharged and ready to code!');
        }
    }

    public dispose(): void {
        this.stop();
    }

    // Test method to trigger notifications for debugging
    public triggerTestNotification(): void {
        console.log('Triggering test eye rest notification');
        this.showEyeRestNotification();
    }
}
