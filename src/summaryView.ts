import * as vscode from 'vscode';
import { Database, SummaryData } from './database';

export class SummaryView {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private database: Database;

    constructor(context: vscode.ExtensionContext, database: Database) {
        this.context = context;
        this.database = database;
    }

    async show() {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'codingTimeSummary',
                'Coding Time Summary',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.webview.html = this.getHtmlForWebview();

            this.panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'refresh') {
                        this.updateContent();
                    }
                },
                undefined,
                this.context.subscriptions
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        await this.updateContent();
    }

    private async updateContent() {
        if (this.panel) {
            const summaryData = await this.database.getSummaryData();
            this.panel.webview.postMessage({ command: 'update', data: summaryData });
        }
    }

    private getHtmlForWebview(): string {
        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Coding Time Summary</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { font-size: 24px; margin-bottom: 20px; }
                    h2 { font-size: 20px; margin-top: 30px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
                    th { font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Coding Time Summary</h1>
                <div id="content">Loading...</div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'update') {
                            updateContent(message.data);
                        }
                    });

                    function updateContent(data) {
                        const content = document.getElementById('content');
                        content.innerHTML = \`
                            <h2>Total Time: \${formatTime(data.totalTime)}</h2>
                            
                            <h2>Project Summary</h2>
                            <table>
                                <tr><th>Project</th><th>Time</th></tr>
                                \${Object.entries(data.projectSummary)
                                    .map(([project, time]) => \`<tr><td>\${project}</td><td>\${formatTime(time)}</td></tr>\`)
                                    .join('')}
                            </table>

                            <h2>Daily Summary (Last 7 Days)</h2>
                            <table>
                                <tr><th>Date</th><th>Time</th></tr>
                                \${Object.entries(data.dailySummary)
                                    .sort((a, b) => b[0].localeCompare(a[0]))
                                    .slice(0, 7)
                                    .map(([date, time]) => \`<tr><td>\${date}</td><td>\${formatTime(time)}</td></tr>\`)
                                    .join('')}
                            </table>
                        \`;
                    }

                    function formatTime(minutes) {
                        const hours = Math.floor(minutes / 60);
                        const mins = Math.floor(minutes % 60);
                        return \`\${hours}h \${mins}m\`;
                    }

                    // Request a refresh when the webview becomes visible
                    vscode.postMessage({ command: 'refresh' });
                </script>
            </body>
            </html>
        `;
    }
}