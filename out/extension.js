"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const timeTracker_1 = require("./timeTracker");
const statusBar_1 = require("./statusBar");
const database_1 = require("./database");
const summaryView_1 = require("./summaryView");
function activate(context) {
    const database = new database_1.Database(context);
    const timeTracker = new timeTracker_1.TimeTracker(database);
    const statusBar = new statusBar_1.StatusBar(timeTracker);
    const summaryView = new summaryView_1.SummaryView(context, database);
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
    vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) {
            timeTracker.startTracking();
        }
        else {
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map