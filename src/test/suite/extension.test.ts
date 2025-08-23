import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate } from '../../extension';
import { MockExtensionContext } from '../mocks/vscode';

suite('Extension Integration Tests', () => {
    let mockContext: MockExtensionContext;
    let commandRegisterStub: sinon.SinonStub;
    let onDidChangeTextEditorSelectionStub: sinon.SinonStub;
    let onDidChangeConfigurationStub: sinon.SinonStub;

    setup(() => {
        mockContext = new MockExtensionContext();
        
        // Mock VS Code API
        commandRegisterStub = sinon.stub(vscode.commands, 'registerCommand');
        onDidChangeTextEditorSelectionStub = sinon.stub(vscode.window, 'onDidChangeTextEditorSelection');
        onDidChangeConfigurationStub = sinon.stub(vscode.workspace, 'onDidChangeConfiguration');
        
        // Mock disposables
        const mockDisposable = { dispose: sinon.stub() };
        commandRegisterStub.returns(mockDisposable);
        onDidChangeTextEditorSelectionStub.returns(mockDisposable);
        onDidChangeConfigurationStub.returns(mockDisposable);
    });

    teardown(() => {
        sinon.restore();
    });

    suite('Extension Activation', () => {
        test('should activate without errors', () => {
            assert.doesNotThrow(() => {
                activate(mockContext as any);
            });
        });

        test('should register all required commands', () => {
            activate(mockContext as any);
            
            // Verify that commands are registered
            assert.ok(commandRegisterStub.called);
            
            const registeredCommands = commandRegisterStub.getCalls().map(call => call.args[0]);
            
            assert.ok(registeredCommands.includes('simpleCodingTimeTracker.showSummary'));
            assert.ok(registeredCommands.includes('simpleCodingTimeTracker.viewStorageData'));
            assert.ok(registeredCommands.includes('simpleCodingTimeTracker.clearAllData'));
            assert.ok(registeredCommands.includes('simpleCodingTimeTracker.toggleHealthNotifications'));
        });

        test('should register event listeners', () => {
            activate(mockContext as any);
            
            assert.ok(onDidChangeTextEditorSelectionStub.called);
            assert.ok(onDidChangeConfigurationStub.called);
        });

        test('should add subscriptions to context', () => {
            activate(mockContext as any);
            
            // Should have added disposables to subscriptions
            assert.ok(mockContext.subscriptions.length > 0);
        });
    });

    suite('Command Registration', () => {
        test('should register show summary command', () => {
            activate(mockContext as any);
            
            const showSummaryCall = commandRegisterStub.getCalls()
                .find(call => call.args[0] === 'simpleCodingTimeTracker.showSummary');
            
            assert.ok(showSummaryCall);
            assert.strictEqual(typeof showSummaryCall.args[1], 'function');
        });

        test('should register view storage data command', () => {
            activate(mockContext as any);
            
            const viewStorageCall = commandRegisterStub.getCalls()
                .find(call => call.args[0] === 'simpleCodingTimeTracker.viewStorageData');
            
            assert.ok(viewStorageCall);
            assert.strictEqual(typeof viewStorageCall.args[1], 'function');
        });

        test('should register clear all data command', () => {
            activate(mockContext as any);
            
            const clearDataCall = commandRegisterStub.getCalls()
                .find(call => call.args[0] === 'simpleCodingTimeTracker.clearAllData');
            
            assert.ok(clearDataCall);
            assert.strictEqual(typeof clearDataCall.args[1], 'function');
        });

        test('should register toggle health notifications command', () => {
            activate(mockContext as any);
            
            const toggleHealthCall = commandRegisterStub.getCalls()
                .find(call => call.args[0] === 'simpleCodingTimeTracker.toggleHealthNotifications');
            
            assert.ok(toggleHealthCall);
            assert.strictEqual(typeof toggleHealthCall.args[1], 'function');
        });
    });

    suite('Event Listener Registration', () => {
        test('should register text editor selection change listener', () => {
            activate(mockContext as any);
            
            assert.ok(onDidChangeTextEditorSelectionStub.called);
            const listenerCall = onDidChangeTextEditorSelectionStub.getCall(0);
            assert.strictEqual(typeof listenerCall.args[0], 'function');
        });

        test('should register configuration change listener', () => {
            activate(mockContext as any);
            
            assert.ok(onDidChangeConfigurationStub.called);
            const listenerCall = onDidChangeConfigurationStub.getCall(0);
            assert.strictEqual(typeof listenerCall.args[0], 'function');
        });

        test('should handle configuration changes for the extension', () => {
            activate(mockContext as any);
            
            const configListener = onDidChangeConfigurationStub.getCall(0).args[0];
            
            // Mock configuration change event
            const mockEvent = {
                affectsConfiguration: sinon.stub().returns(true)
            };
            
            // Should not throw when handling configuration change
            assert.doesNotThrow(() => {
                configListener(mockEvent);
            });
            
            assert.ok(mockEvent.affectsConfiguration.calledWith('simpleCodingTimeTracker'));
        });

        test('should ignore unrelated configuration changes', () => {
            activate(mockContext as any);
            
            const configListener = onDidChangeConfigurationStub.getCall(0).args[0];
            
            // Mock configuration change event for different extension
            const mockEvent = {
                affectsConfiguration: sinon.stub().returns(false)
            };
            
            // Should not throw when handling unrelated configuration change
            assert.doesNotThrow(() => {
                configListener(mockEvent);
            });
            
            assert.ok(mockEvent.affectsConfiguration.calledWith('simpleCodingTimeTracker'));
        });
    });

    suite('Component Integration', () => {
        test('should create all required components', () => {
            // This test verifies that all components are created without errors
            // The actual functionality is tested in individual component tests
            assert.doesNotThrow(() => {
                activate(mockContext as any);
            });
        });

        test('should dispose all components when context subscriptions are disposed', () => {
            activate(mockContext as any);
            
            // Simulate disposing all subscriptions (like when extension is deactivated)
            mockContext.subscriptions.forEach(disposable => {
                if (disposable && typeof disposable.dispose === 'function') {
                    assert.doesNotThrow(() => {
                        disposable.dispose();
                    });
                }
            });
        });
    });

    suite('Error Handling', () => {
        test('should handle errors during activation gracefully', () => {
            // Simulate an error during command registration
            commandRegisterStub.onFirstCall().throws(new Error('Command registration failed'));
            
            // Extension should still attempt to activate other components
            // The error should be caught and handled gracefully
            activate(mockContext as any);
            
            // If we get here, the error was handled gracefully
            assert.ok(true, 'Extension activation handled error gracefully');
        });

        test('should handle errors in event listeners gracefully', () => {
            activate(mockContext as any);
            
            // Get the text editor selection listener
            const selectionListener = onDidChangeTextEditorSelectionStub.getCall(0).args[0];
            
            // Should not throw even if there's an error in the listener
            assert.doesNotThrow(() => {
                selectionListener();
            });
        });
    });

    suite('Extension Context Usage', () => {
        test('should use provided extension context', () => {
            activate(mockContext as any);
            
            // Verify that the mock context was used
            assert.ok(mockContext.subscriptions.length > 0);
        });

        test('should store disposables in context subscriptions', () => {
            const initialSubscriptionCount = mockContext.subscriptions.length;
            
            activate(mockContext as any);
            
            // Should have added subscriptions
            assert.ok(mockContext.subscriptions.length > initialSubscriptionCount);
        });
    });
});
