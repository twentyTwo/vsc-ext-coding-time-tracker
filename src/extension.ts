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
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(resetTimerDisposable);
    context.subscriptions.push(resetAllTimersDisposable);
    context.subscriptions.push(timeTracker);
    context.subscriptions.push(statusBar);

    // Start tracking immediately if VS Code is already focused
    if (vscode.window.state.focused) {
        timeTracker.startTracking();
    }

    vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        if (e.focused) {
            timeTracker.startTracking();
        } else {
            timeTracker.stopTracking();
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