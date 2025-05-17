import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Database } from './database';
import { SummaryViewProvider } from './summaryView';

export function activate(context: vscode.ExtensionContext) {
    const database = new Database(context);
    const timeTracker = new TimeTracker(database);
    const statusBar = new StatusBar(timeTracker);
    const summaryView = new SummaryViewProvider(context, database, timeTracker);

    // Initialize configuration
    let focusTimeoutSeconds = vscode.workspace.getConfiguration('simpleCodingTimeTracker')
        .get('focusTimeout', 60);

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleCodingTimeTracker')) {
                timeTracker.updateConfiguration();
                focusTimeoutSeconds = vscode.workspace.getConfiguration('simpleCodingTimeTracker')
                    .get('focusTimeout', 60);
            }
        })
    );

    // Register cursor tracking
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(() => {
            timeTracker.updateCursorActivity();
        })
    );

    // Register the existing command
    let disposable = vscode.commands.registerCommand('simpleCodingTimeTracker.showSummary', () => {
        summaryView.show();
    });

    // Register the new reset timer command
    let resetTimerDisposable = vscode.commands.registerCommand('simpleCodingTimeTracker.resetTimer', () => {
        timeTracker.resetTimer();
        vscode.window.showInformationMessage('Coding time tracker has been reset for today.');
    });

    // Register the new reset all timers command
    let resetAllTimersDisposable = vscode.commands.registerCommand('simpleCodingTimeTracker.resetAllTimers', () => {
        vscode.window.showWarningMessage('Are you sure you want to reset all timers? This action cannot be undone.', 'Yes', 'No')
            .then(selection => {
                if (selection === 'Yes') {
                    timeTracker.resetAllTimers();
                    vscode.window.showInformationMessage('All coding time trackers have been reset.');
                }
            });
    });    // Register sync command
    let syncDisposable = vscode.commands.registerCommand('simpleCodingTimeTracker.syncNow', async () => {
        try {
            const startTime = Date.now();
            await database.syncNow();
            const syncTime = Date.now() - startTime;
            vscode.window.showInformationMessage(`Time entries synced successfully (${syncTime}ms)`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Sync error:', error);
            vscode.window.showErrorMessage(`Failed to sync time entries: ${errorMessage}. Check the developer tools console for more details.`);
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(resetTimerDisposable);
    context.subscriptions.push(resetAllTimersDisposable);
    context.subscriptions.push(syncDisposable);
    context.subscriptions.push(database);
    context.subscriptions.push(timeTracker);
    context.subscriptions.push(statusBar);

    // Start tracking immediately if VS Code is already focused
    if (vscode.window.state.focused) {
        timeTracker.startTracking();
    }

    // Variable to store the focus timeout handle
    let focusTimeoutHandle: NodeJS.Timeout | null = null;

    vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        if (e.focused) {
            if (focusTimeoutHandle) {
                clearTimeout(focusTimeoutHandle);
                focusTimeoutHandle = null;
            }
            timeTracker.startTracking();
        } else {
            // Only stop tracking after the focus timeout
            if (focusTimeoutHandle) {
                clearTimeout(focusTimeoutHandle);
            }
            
            focusTimeoutHandle = setTimeout(() => {
                timeTracker.stopTracking();
            }, focusTimeoutSeconds * 1000);
        }
    });

    vscode.workspace.onDidOpenTextDocument(() => {
        if (vscode.window.state.focused) {
            timeTracker.startTracking();
        }
    });

    // Refresh summary view when status bar is clicked
    statusBar.onDidClick(() => {
        summaryView.show();
    });
}

export function deactivate() {}