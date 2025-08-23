import * as assert from 'assert';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../logger';

suite('Logger Tests', () => {
    let logger: Logger;
    let fsStub: sinon.SinonStub;
    let existsStub: sinon.SinonStub;
    let mkdirStub: sinon.SinonStub;
    let writeStub: sinon.SinonStub;
    let appendStub: sinon.SinonStub;

    setup(() => {
        // Reset the singleton instance before each test
        (Logger as any).instance = undefined;
        
        // Mock file system operations
        existsStub = sinon.stub(fs, 'existsSync');
        mkdirStub = sinon.stub(fs, 'mkdirSync');
        writeStub = sinon.stub(fs, 'writeFileSync');
        appendStub = sinon.stub(fs, 'appendFileSync');
        
        // Default mocks
        existsStub.returns(true);
        mkdirStub.returns(undefined);
        writeStub.returns(undefined);
        appendStub.returns(undefined);
        
        // Enable logging for tests
        Logger.setLoggingEnabled(true);
        logger = Logger.getInstance();
    });

    teardown(() => {
        Logger.setLoggingEnabled(false);
        sinon.restore();
    });

    suite('Singleton Pattern', () => {
        test('should return same instance', () => {
            const logger1 = Logger.getInstance();
            const logger2 = Logger.getInstance();
            
            assert.strictEqual(logger1, logger2);
        });

        test('should create new instance after reset', () => {
            const logger1 = Logger.getInstance();
            
            // Reset singleton
            (Logger as any).instance = undefined;
            const logger2 = Logger.getInstance();
            
            assert.notStrictEqual(logger1, logger2);
        });
    });

    suite('Logging Configuration', () => {
        test('should enable/disable logging', () => {
            Logger.setLoggingEnabled(true);
            assert.strictEqual(Logger.isLoggingEnabled(), true);
            
            Logger.setLoggingEnabled(false);
            assert.strictEqual(Logger.isLoggingEnabled(), false);
        });

        test('should not log when disabled', () => {
            Logger.setLoggingEnabled(false);
            logger = Logger.getInstance();
            
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            assert.ok(!appendStub.called);
        });

        test('should log when enabled', () => {
            Logger.setLoggingEnabled(true);
            logger = Logger.getInstance();
            
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            assert.ok(appendStub.called);
        });
    });

    suite('Log File Management', () => {
        test('should create storage directory if not exists', () => {
            Logger.setLoggingEnabled(true);
            // Reset singleton to ensure fresh instance
            (Logger as any).instance = undefined;
            existsStub.onFirstCall().returns(false); // Directory doesn't exist
            existsStub.onSecondCall().returns(true); // Log file will exist after directory creation
            
            logger = Logger.getInstance();
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            assert.ok(mkdirStub.called, 'Should call mkdir to create directory');
            const mkdirCall = mkdirStub.getCall(0);
            assert.ok(mkdirCall.args[0].includes('VSCodeTimeTracker'));
        });

        test('should create log file if not exists', () => {
            Logger.setLoggingEnabled(true);
            // Reset singleton to ensure fresh instance
            (Logger as any).instance = undefined;
            existsStub.onFirstCall().returns(true); // Directory exists
            existsStub.onSecondCall().returns(false); // Log file doesn't exist
            
            logger = Logger.getInstance();
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            assert.ok(writeStub.called, 'Should call writeFileSync to create log file');
        });

        test('should not recreate existing log file', () => {
            existsStub.returns(true); // Everything exists
            
            logger = Logger.getInstance();
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            assert.ok(!writeStub.called);
        });

        test('should generate correct log file path', () => {
            const logPath = logger.getLogFilePath();
            
            assert.ok(logPath.includes('timetracker_'));
            assert.ok(logPath.endsWith('.log'));
            assert.ok(logPath.includes(new Date().getFullYear().toString()));
        });
    });

    suite('Event Logging', () => {
        test('should log basic event', () => {
            logger.logEvent('test_event', { 
                project: 'my-project', 
                branch: 'feature-branch' 
            });
            
            assert.ok(appendStub.called);
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.event, 'test_event');
            assert.strictEqual(parsed.project, 'my-project');
            assert.strictEqual(parsed.branch, 'feature-branch');
            assert.strictEqual(parsed.seq, 1);
            assert.ok(parsed.time);
        });

        test('should increment sequence number', () => {
            logger.logEvent('event1', { project: 'test', branch: 'main' });
            logger.logEvent('event2', { project: 'test', branch: 'main' });
            
            assert.strictEqual(appendStub.callCount, 2);
            
            const log1 = JSON.parse(appendStub.getCall(0).args[1].trim());
            const log2 = JSON.parse(appendStub.getCall(1).args[1].trim());
            
            assert.strictEqual(log1.seq, 1);
            assert.strictEqual(log2.seq, 2);
        });

        test('should handle tracking_started event', () => {
            logger.logEvent('tracking_started', {
                project: 'test-project',
                branch: 'main',
                reason: 'cursor activity'
            });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.reason, 'cursor activity');
        });

        test('should handle session_saved event', () => {
            logger.logEvent('session_saved', {
                project: 'test-project',
                branch: 'main',
                duration: 30.5, // minutes
                reason: 'periodic'
            });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.duration, '1830s'); // 30.5 * 60 = 1830 seconds
            assert.strictEqual(parsed.reason, 'periodic');
        });

        test('should handle branch_changed event', () => {
            logger.logEvent('branch_changed', {
                project: 'test-project',
                oldBranch: 'main',
                newBranch: 'feature-branch'
            });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.from, 'main');
            assert.strictEqual(parsed.to, 'feature-branch');
        });

        test('should handle inactivity_detected event', () => {
            logger.logEvent('inactivity_detected', {
                project: 'test-project',
                branch: 'main',
                inactivityDuration: 180 // seconds
            });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.inactive_for, '180s');
        });

        test('should handle missing project and branch gracefully', () => {
            logger.logEvent('test_event', {});
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.project, '');
            assert.strictEqual(parsed.branch, '');
        });
    });

    suite('Time Formatting', () => {
        test('should format time in 24-hour format', () => {
            const now = new Date('2023-12-01T15:30:45');
            sinon.useFakeTimers(now);
            
            logger.logEvent('test_event', { project: 'test', branch: 'main' });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.time, '15:30:45');
            
            sinon.restore();
        });

        test('should format duration in seconds', () => {
            logger.logEvent('session_saved', {
                project: 'test',
                branch: 'main',
                duration: 2.5 // 2.5 minutes = 150 seconds
            });
            
            const logData = appendStub.getCall(0).args[1];
            const parsed = JSON.parse(logData.trim());
            
            assert.strictEqual(parsed.duration, '150s');
        });
    });

    suite('Date Handling', () => {
        test('should create new log file for new date', () => {
            const date1 = new Date('2023-12-01T10:00:00');
            const date2 = new Date('2023-12-02T10:00:00');
            
            let clock = sinon.useFakeTimers(date1);
            logger.logEvent('event1', { project: 'test', branch: 'main' });
            const path1 = logger.getLogFilePath();
            
            clock.restore();
            clock = sinon.useFakeTimers(date2);
            
            // Reset file exists to false for new date
            existsStub.returns(false);
            
            logger.logEvent('event2', { project: 'test', branch: 'main' });
            const path2 = logger.getLogFilePath();
            
            assert.notStrictEqual(path1, path2);
            assert.ok(path1.includes('2023-12-01'));
            assert.ok(path2.includes('2023-12-02'));
            
            clock.restore();
        });

        test('should reset sequence counter for new date', () => {
            const date1 = new Date('2023-12-01T10:00:00');
            const date2 = new Date('2023-12-02T10:00:00');
            
            let clock = sinon.useFakeTimers(date1);
            logger.logEvent('event1', { project: 'test', branch: 'main' });
            logger.logEvent('event2', { project: 'test', branch: 'main' });
            
            clock.restore();
            clock = sinon.useFakeTimers(date2);
            
            existsStub.returns(false);
            logger.logEvent('event3', { project: 'test', branch: 'main' });
            
            // Check that sequence restarted at 1 for new date
            const lastCall = appendStub.getCall(appendStub.callCount - 1);
            const parsed = JSON.parse(lastCall.args[1].trim());
            
            assert.strictEqual(parsed.seq, 1);
            
            clock.restore();
        });
    });

    suite('Error Handling', () => {
        test('should handle file write errors gracefully', () => {
            appendStub.throws(new Error('File write error'));
            
            // Should not throw
            assert.doesNotThrow(() => {
                logger.logEvent('test_event', { project: 'test', branch: 'main' });
            });
        });

        test('should handle directory creation errors gracefully', () => {
            mkdirStub.throws(new Error('Permission denied'));
            existsStub.onFirstCall().returns(false);
            
            // Should not throw
            assert.doesNotThrow(() => {
                Logger.setLoggingEnabled(true);
                Logger.getInstance();
            });
        });
    });
});
