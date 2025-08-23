import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { HealthNotificationManager } from '../../healthNotifications';

suite('HealthNotificationManager Tests', () => {
    let healthManager: HealthNotificationManager;
    let clock: sinon.SinonFakeTimers;
    let onPauseStub: sinon.SinonStub;
    let onResumeStub: sinon.SinonStub;
    let showWarningMessageStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let configStub: sinon.SinonStub;

    setup(() => {
        clock = sinon.useFakeTimers();
        onPauseStub = sinon.stub();
        onResumeStub = sinon.stub();
        
        // Mock VS Code window methods
        showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
        showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
        
        // Mock configuration
        configStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: sinon.stub().callsFake((key: string, defaultValue: any) => {
                switch (key) {
                    case 'health.eyeRestInterval': return 20;
                    case 'health.stretchInterval': return 30;
                    case 'health.breakThreshold': return 90;
                    case 'health.enableNotifications': return true;
                    case 'health.modalNotifications': return true;
                    default: return defaultValue;
                }
            })
        } as any);
        
        healthManager = new HealthNotificationManager(onPauseStub, onResumeStub);
    });

    teardown(() => {
        clock.restore();
        healthManager.dispose();
        sinon.restore();
    });

    suite('Initialization', () => {
        test('should load default settings', () => {
            assert.ok(configStub.called);
        });

        test('should not be active initially', () => {
            // We can't directly test private properties, but we can test behavior
            // By default, notifications should not be running
            clock.tick(21 * 60 * 1000); // 21 minutes
            assert.ok(!showWarningMessageStub.called);
        });
    });

    suite('Start and Stop', () => {
        test('should start notifications when start() is called', () => {
            healthManager.start();
            
            // Fast-forward to eye rest time (20 minutes)
            clock.tick(20 * 60 * 1000);
            
            assert.ok(showWarningMessageStub.called);
        });

        test('should not start if already active', () => {
            healthManager.start();
            const timerSetCount = clock.countTimers();
            
            healthManager.start(); // Try to start again
            
            // Should not create additional timers
            assert.strictEqual(clock.countTimers(), timerSetCount);
        });

        test('should stop all notifications when stop() is called', () => {
            healthManager.start();
            const initialTimerCount = clock.countTimers();
            
            healthManager.stop();
            
            // All timers should be cleared
            assert.strictEqual(clock.countTimers(), 0);
        });

        test('should not restart notifications after stop', () => {
            healthManager.start();
            healthManager.stop();
            
            // Fast-forward past all notification intervals
            clock.tick(100 * 60 * 1000);
            
            assert.ok(!showWarningMessageStub.called);
            assert.ok(!showErrorMessageStub.called);
        });
    });

    suite('Eye Rest Notifications', () => {
        test('should show eye rest notification after interval', () => {
            healthManager.start();
            
            // Fast-forward to eye rest time (20 minutes)
            clock.tick(20 * 60 * 1000);
            
            assert.ok(showWarningMessageStub.called);
            const call = showWarningMessageStub.getCall(0);
            assert.ok(call.args[0].includes('EYE HEALTH REMINDER'));
        });

        test('should auto-pause timer when modal notification appears', () => {
            healthManager.start();
            
            // Fast-forward to eye rest time
            clock.tick(20 * 60 * 1000);
            
            assert.ok(onPauseStub.called);
        });

        test('should auto-resume timer when modal notification disappears', async () => {
            healthManager.start();
            
            // Mock user dismissing the notification
            showWarningMessageStub.resolves('I just did it!');
            
            // Fast-forward to eye rest time
            clock.tick(20 * 60 * 1000);
            
            // Process immediate timers only to avoid infinite loop
            clock.runToLast();
            
            assert.ok(onResumeStub.called);
        });

        test('should handle snooze for eye rest notification', async () => {
            healthManager.start();
            showWarningMessageStub.resolves('Remind me in 5 min');
            
            clock.tick(20 * 60 * 1000); // 20 minutes
            
            // Process timers without infinite loop
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('snoozed for 5 minutes'));
        });

        test('should show success message when user completes eye rest', async () => {
            healthManager.start();
            showWarningMessageStub.resolves('I just did it!');
            
            clock.tick(20 * 60 * 1000);
            
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('Your eyes thank you'));
        });

        test('should repeat eye rest notifications', () => {
            healthManager.start();
            
            // First notification at 20 minutes
            clock.tick(20 * 60 * 1000);
            assert.strictEqual(showWarningMessageStub.callCount, 1);
            
            // Clear the stub to reset call count
            showWarningMessageStub.resetHistory();
            
            // Second notification at another 20 minutes (40 minutes total)
            clock.tick(20 * 60 * 1000);
            assert.strictEqual(showWarningMessageStub.callCount, 1);
        });
    });

    suite('Stretch Notifications', () => {
        test('should show stretch notification after interval', () => {
            healthManager.start();
            
            // Fast-forward to stretch time (30 minutes)
            clock.tick(30 * 60 * 1000);
            
            // Should have eye rest at 20 min and stretch at 30 min
            assert.ok(showWarningMessageStub.called);
            
            // Find the stretch notification call
            const stretchCall = showWarningMessageStub.getCalls()
                .find(call => call.args[0].includes('STRETCH REMINDER'));
            assert.ok(stretchCall, 'Should have found stretch reminder call');
        });

        test('should handle snooze for stretch notification', async () => {
            healthManager.start();
            showWarningMessageStub.resolves('Remind me in 10 min');
            
            clock.tick(30 * 60 * 1000);
            
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('snoozed for 10 minutes'));
        });

        test('should show success message when user stretches', async () => {
            healthManager.start();
            showWarningMessageStub.resolves('I just stretched!');
            
            clock.tick(30 * 60 * 1000);
            
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('back and neck feel better'));
        });
    });

    suite('Break Notifications', () => {
        test('should show break notification after threshold', () => {
            healthManager.start();
            
            // Fast-forward to break time (90 minutes)
            clock.tick(90 * 60 * 1000);
            
            assert.ok(showErrorMessageStub.called);
            const call = showErrorMessageStub.getCall(0);
            assert.ok(call.args[0].includes('HEALTH BREAK REQUIRED'));
        });

        test('should handle snooze for break notification', async () => {
            healthManager.start();
            showErrorMessageStub.resolves('Remind me in 15 min');
            
            clock.tick(90 * 60 * 1000);
            
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('snoozed for 15 minutes'));
        });

        test('should show success message when user takes break', async () => {
            healthManager.start();
            showErrorMessageStub.resolves('I took a break!');
            
            clock.tick(90 * 60 * 1000);
            
            clock.runToLast();
            
            assert.ok(showInformationMessageStub.called);
            const call = showInformationMessageStub.getCall(0);
            assert.ok(call.args[0].includes('mind and body are recharged'));
        });
    });

    suite('Multiple Notification Types', () => {
        test('should handle overlapping notifications', () => {
            healthManager.start();
            
            // Fast-forward to when both eye rest and stretch should trigger
            // Eye rest: 20 min, Stretch: 30 min
            clock.tick(30 * 60 * 1000);
            
            // Should have both eye rest (at 20 min) and stretch (at 30 min)
            assert.strictEqual(showWarningMessageStub.callCount, 2);
        });

        test('should handle all three notification types', () => {
            healthManager.start();
            
            // Fast-forward to when all should trigger
            // Eye rest: 20, 40, 60, 80, 100 min
            // Stretch: 30, 60, 90 min  
            // Break: 90 min
            clock.tick(90 * 60 * 1000);
            
            // Should have multiple warning messages (eye rest + stretch) and one error (break)
            assert.ok(showWarningMessageStub.callCount >= 2);
            assert.strictEqual(showErrorMessageStub.callCount, 1);
        });
    });

    suite('Configuration Updates', () => {
        test('should update settings when updateSettings() is called', () => {
            // Change configuration
            configStub.returns({
                get: sinon.stub().callsFake((key: string, defaultValue: any) => {
                    switch (key) {
                        case 'health.eyeRestInterval': return 10; // Changed from 20
                        case 'health.stretchInterval': return 15; // Changed from 30
                        case 'health.breakThreshold': return 45; // Changed from 90
                        case 'health.enableNotifications': return true;
                        case 'health.modalNotifications': return true;
                        default: return defaultValue;
                    }
                })
            } as any);
            
            healthManager.start();
            healthManager.updateSettings();
            
            // Should trigger with new interval (10 minutes instead of 20)
            clock.tick(10 * 60 * 1000);
            assert.ok(showWarningMessageStub.called);
        });

        test('should not start notifications when disabled in config', () => {
            configStub.returns({
                get: sinon.stub().callsFake((key: string, defaultValue: any) => {
                    switch (key) {
                        case 'health.enableNotifications': return false; // Disabled
                        default: return defaultValue;
                    }
                })
            } as any);
            
            const disabledManager = new HealthNotificationManager(onPauseStub, onResumeStub);
            disabledManager.start();
            
            clock.tick(100 * 60 * 1000); // Fast-forward way past all intervals
            
            assert.ok(!showWarningMessageStub.called);
            assert.ok(!showErrorMessageStub.called);
            
            disabledManager.dispose();
        });

        test('should not auto-pause when modal notifications disabled', () => {
            configStub.returns({
                get: sinon.stub().callsFake((key: string, defaultValue: any) => {
                    switch (key) {
                        case 'health.modalNotifications': return false; // Non-modal
                        case 'health.eyeRestInterval': return 20;
                        case 'health.enableNotifications': return true;
                        default: return defaultValue;
                    }
                })
            } as any);
            
            const nonModalManager = new HealthNotificationManager(onPauseStub, onResumeStub);
            nonModalManager.start();
            
            clock.tick(20 * 60 * 1000);
            
            // Should not auto-pause for non-modal notifications
            assert.ok(!onPauseStub.called);
            
            nonModalManager.dispose();
        });
    });

    suite('Disposal', () => {
        test('should clean up all timers on dispose', () => {
            healthManager.start();
            const timerCount = clock.countTimers();
            
            healthManager.dispose();
            
            assert.strictEqual(clock.countTimers(), 0);
        });

        test('should stop notifications on dispose', () => {
            healthManager.start();
            healthManager.dispose();
            
            clock.tick(100 * 60 * 1000);
            
            assert.ok(!showWarningMessageStub.called);
            assert.ok(!showErrorMessageStub.called);
        });
    });

    suite('Test Features', () => {
        test('should trigger test notification', () => {
            healthManager.triggerTestNotification();
            
            assert.ok(showWarningMessageStub.called);
            const call = showWarningMessageStub.getCall(0);
            assert.ok(call.args[0].includes('EYE HEALTH REMINDER'));
        });
    });
});
