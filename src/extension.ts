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

            vscode.window.showInformationMessage('Time tracking data loaded successfully');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to view data: ${error?.message || 'Unknown error'}`);
        }
    });

    // Register data management command (hidden from command palette)
    let clearDataCommand = vscode.commands.registerCommand('coding-time-tracker.clearAllData', () => {
        database.clearAllData();
    });
    context.subscriptions.push(clearDataCommand);

    context.subscriptions.push(disposable);
    context.subscriptions.push(viewStorageDisposable);
    context.subscriptions.push(timeTracker);
    context.subscriptions.push(statusBar);

    // Start tracking immediately if VS Code is already focused
    if (vscode.window.state.focused) {
        timeTracker.startTracking();
    }

    // Variable to store the focus timeout handle
    // let focusTimeoutHandle: NodeJS.Timeout | null = null;
    let focusTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
    
    vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        if (e.focused) {
            if (focusTimeoutHandle) {
                clearTimeout(focusTimeoutHandle);
                focusTimeoutHandle = null;
            }
            timeTracker.startTracking();
        } else {
            const config = vscode.workspace.getConfiguration('simpleCodingTimeTracker');
            const focusTimeoutSeconds = config.get('focusTimeout', 60);

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

export function deactivate() { }