import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Database } from './database';
import { SummaryViewProvider } from './summaryView';

export function activate(context: vscode.ExtensionContext) {
    const database = new Database(context);
    const timeTracker = new TimeTracker(database);
    const summaryView = new SummaryViewProvider(context, database, timeTracker);
    const statusBar = new StatusBar(timeTracker, summaryView);

    // Register cursor tracking
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(() => {
            timeTracker.updateCursorActivity();
        })
    );

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleCodingTimeTracker')) {
                timeTracker.updateConfiguration();
            }
        })
    );

    // Register the show summary command
    let disposable = vscode.commands.registerCommand('simpleCodingTimeTracker.showSummary', () => {
        summaryView.show();
    });

    // Register view storage command
    let viewStorageDisposable = vscode.commands.registerCommand('simpleCodingTimeTracker.viewStorageData', async () => {
        try {
            const entries = await database.getEntries();
            const processedData = {
                totalEntries: entries.length,
                exportDate: new Date().toISOString(),
                entries: entries.map(entry => ({
                    ...entry,
                    timeSpentFormatted: `${Math.round(entry.timeSpent)} minutes`
                }))
            };
            
            // Create a temporary untitled document
            const document = await vscode.workspace.openTextDocument({
                content: JSON.stringify(processedData, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(document, {
                preview: false,
                viewColumn: vscode.ViewColumn.One
            });
            
            vscode.window.showInformationMessage('Time tracking data loaded successfully');        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to view data: ${error?.message || 'Unknown error'}`);
        }
    });

    // Register data management command
    let clearDataCommand = vscode.commands.registerCommand('simpleCodingTimeTracker.clearAllData', async () => {
        // Stop tracking before clearing data
        if (timeTracker.isActive()) {
            timeTracker.stopTracking('clear all data');
        }
        
        const success = await database.clearAllData();
        if (success) {
            // Update the summary view to show empty state
            await summaryView.show();
            // Force status bar update
            statusBar.updateNow();
        }
    });

    // Register health notifications toggle command
    let toggleHealthCommand = vscode.commands.registerCommand('simpleCodingTimeTracker.toggleHealthNotifications', async () => {
        const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
        const currentEnabled = config.get('health.enableNotifications', true);
        
        // Show current state and ask for confirmation
        const action = currentEnabled ? 'disable' : 'enable';
        const icon = currentEnabled ? '🔕' : '🔔';
        const statusText = currentEnabled ? 'currently ENABLED' : 'currently DISABLED';
        
        const message = `Health notifications are ${statusText}. ${icon} ${action.charAt(0).toUpperCase() + action.slice(1)} them?`;
        const confirmAction = currentEnabled ? 'Disable' : 'Enable';
        
        const choice = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            confirmAction,
            'Cancel'
        );
        
        if (choice === confirmAction) {
            await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
            
            const resultMessage = !currentEnabled ? 
                '✅ Health notifications enabled! You\'ll receive reminders for eye rest (20min), stretching (45min), and breaks (2h).' :
                '❌ Health notifications disabled. No health reminders will be shown.';
            
            vscode.window.showInformationMessage(resultMessage);
            
            // Update status bar to reflect the change
            statusBar.updateNow();
        }
    });

    // Register test pause command for debugging
    let testPauseCommand = vscode.commands.registerCommand('simpleCodingTimeTracker.testPause', () => {
        console.log('Test pause command executed');
        if (timeTracker.isActive()) {
            timeTracker.pauseTimer();
            vscode.window.showInformationMessage('Test pause executed - check console for logs');
        } else {
            vscode.window.showInformationMessage('Timer is not active');
        }
    });

    // Register test notification command for debugging
    let testNotificationCommand = vscode.commands.registerCommand('simpleCodingTimeTracker.testNotification', () => {
        console.log('Test notification command executed');
        (timeTracker as any).healthManager.triggerTestNotification();
    });

    context.subscriptions.push(clearDataCommand);
    context.subscriptions.push(toggleHealthCommand);
    context.subscriptions.push(testPauseCommand);
    context.subscriptions.push(testNotificationCommand);

    context.subscriptions.push(disposable);
    context.subscriptions.push(viewStorageDisposable);
    context.subscriptions.push(timeTracker);
    context.subscriptions.push(statusBar);

    // Start tracking immediately if VS Code is already focused
    if (vscode.window.state.focused) {
        timeTracker.startTracking('initial startup');
    }

    // Window state is now handled in TimeTracker class
    vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        if (e.focused && !timeTracker.isActive()) {
            timeTracker.startTracking('window focus');
        }
    });

    vscode.workspace.onDidOpenTextDocument(() => {
        if (vscode.window.state.focused) {
            timeTracker.startTracking('document opened');
        }
    });

}

export function deactivate() {}