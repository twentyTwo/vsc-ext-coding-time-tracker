import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Database } from './database';
import { SummaryViewProvider } from './summaryView';

export function activate(context: vscode.ExtensionContext) {
    const database = new Database(context);
    const timeTracker = new TimeTracker(database);
    const statusBar = new StatusBar(timeTracker);
    const summaryView = new SummaryViewProvider(context, database);

    let disposable = vscode.commands.registerCommand('codingTimeTracker.showSummary', () => {
        summaryView.show();
    });

    context.subscriptions.push(disposable);
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