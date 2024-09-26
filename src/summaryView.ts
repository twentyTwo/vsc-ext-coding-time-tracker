import * as vscode from 'vscode';
import { Database, SummaryData, TimeEntry } from './database';
import { ThemeIcon } from 'vscode';

export class SummaryViewProvider implements vscode.WebviewViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private database: Database;

    constructor(context: vscode.ExtensionContext, database: Database) {
        this.context = context;
        this.database = database;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'refresh') {
                    await this.show(webviewView.webview);
                } else if (message.command === 'search') {
                    const searchResults = await this.database.searchEntries(message.date, message.project);
                    webviewView.webview.postMessage({ command: 'searchResult', data: searchResults });
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.show(webviewView.webview);
    }

    async show(webview?: vscode.Webview) {
        const summaryData = await this.database.getSummaryData();
        const projects = await this.getUniqueProjects();

        if (webview) {
            webview.html = this.getHtmlForWebview(projects);
            webview.postMessage({ command: 'update', data: summaryData, projects: projects });
        } else if (this.panel) {
            this.panel.reveal();
            this.panel.webview.html = this.getHtmlForWebview(projects);
            this.panel.webview.postMessage({ command: 'update', data: summaryData, projects: projects });
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

            this.panel.webview.html = this.getHtmlForWebview(projects);

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'refresh') {
                        await this.show(this.panel?.webview);
                    } else if (message.command === 'search') {
                        const searchResults = await this.database.searchEntries(message.date, message.project);
                        this.panel?.webview.postMessage({ command: 'searchResult', data: searchResults });
                    }
                },
                undefined,
                this.context.subscriptions
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            this.panel.webview.postMessage({ command: 'update', data: summaryData, projects: projects });
        }
    }

    // Modify the updateContent method to accept a webview parameter
    private async updateContent(webview?: vscode.Webview) {
        const summaryData = await this.database.getSummaryData();
        const projects = await this.getUniqueProjects();
        
        if (webview) {
            webview.html = this.getHtmlForWebview(projects);
            webview.postMessage({ command: 'update', data: summaryData, projects: projects });
        } else if (this.panel) {
            this.panel.webview.html = this.getHtmlForWebview(projects);
            this.panel.webview.postMessage({ command: 'update', data: summaryData, projects: projects });
        }
    }

    private async getUniqueProjects(): Promise<string[]> {
        const entries = await this.database.getEntries();
        const projectSet = new Set(entries.map(entry => entry.project));
        return Array.from(projectSet).sort();
    }

    private getHtmlForWebview(projects: string[]): string {
        const projectOptions = projects.map(project => `<option value="${project}">${project}</option>`).join('');
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Coding Time Summary</title>
                <style>
                    :root {
                        --background-color: var(--vscode-editor-background);
                        --text-color: var(--vscode-editor-foreground);
                        --border-color: var(--vscode-panel-border);
                        --header-background: var(--vscode-titleBar-activeBackground);
                        --header-foreground: var(--vscode-titleBar-activeForeground);
                    }
                    body {
                        font-family: var(--vscode-font-family);
                        background-color: var(--background-color);
                        color: var(--text-color);
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        background-color: var(--header-background);
                        color: var(--header-foreground);
                        padding: 10px;
                    }
                    h2 {
                        font-size: 20px;
                        margin-top: 30px;
                        margin-bottom: 10px;
                        border-bottom: 1px solid var(--border-color);
                        padding-bottom: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th, td {
                        text-align: left;
                        padding: 8px;
                        border-bottom: 1px solid var(--border-color);
                    }
                    th {
                        font-weight: bold;
                        background-color: var(--header-background);
                        color: var(--header-foreground);
                    }
                    .search-form {
                        margin-bottom: 20px;
                    }
                    .search-form select {
                        margin-right: 10px;
                        padding: 5px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background-color: var(--header-background);
                        padding: 10px;
                    }
                    .header h1 {
                        margin: 0;
                        padding: 0;
                        background-color: transparent;
                    }
                    .reload-button {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 5px;
                        color: var(--header-foreground);
                        font-size: 16px;
                    }
                    .reload-button:hover {
                        background-color: rgba(255, 255, 255, 0.1);
                    }
                    .reload-button::before {
                        content: "↻";
                        margin-right: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Coding Time Summary</h1>
                    <button class="reload-button" onclick="vscode.postMessage({command: 'refresh'})">Reload</button>
                </div>
                <div class="search-form">
                    <input type="date" id="date-search" name="date-search">
                    <select id="project-search" name="project-search">
                        <option value="">All Projects</option>
                        ${projectOptions}
                    </select>
                    <button id="search-button">Search</button>
                </div>
                <div id="content">Loading...</div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'update') {
                            updateContent(message.data);
                            updateProjectDropdown(message.projects);
                        } else if (message.command === 'searchResult') {
                            displaySearchResult(message.data);
                        }
                    });

                    document.getElementById('search-button').addEventListener('click', () => {
                        const date = document.getElementById('date-search').value;
                        const project = document.getElementById('project-search').value;
                        vscode.postMessage({ command: 'search', date, project });
                    });

                    function updateProjectDropdown(projects) {
                        const dropdown = document.getElementById('project-search');
                        dropdown.innerHTML = '<option value="">All Projects</option>' +
                            projects.map(project => \`<option value="\${project}">\${project}</option>\`).join('');
                    }

                    function updateContent(data) {
                        const content = document.getElementById('content');
                        content.innerHTML = \`
                            <h2>Total Coding Time: \${formatTime(data.totalTime)}</h2>
                            
                            <h2>Project Summary</h2>
                            <table>
                                <tr><th>Project</th><th>Coding Time</th></tr>
                                \${Object.entries(data.projectSummary)
                                    .map(([project, time]) => \`<tr><td>\${project}</td><td>\${formatTime(time)}</td></tr>\`)
                                    .join('')}
                            </table>

                            <h2>Daily Summary (Last 7 Days)</h2>
                            <table>
                                <tr><th>Date</th><th>Coding Time</th></tr>
                                \${Object.entries(data.dailySummary)
                                    .sort((a, b) => b[0].localeCompare(a[0]))
                                    .slice(0, 7)
                                    .map(([date, time]) => \`<tr><td>\${date}</td><td>\${formatTime(time)}</td></tr>\`)
                                    .join('')}
                            </table>
                        \`;
                    }

                    function displaySearchResult(entries) {
                        const content = document.getElementById('content');
                        if (entries.length === 0) {
                            content.innerHTML = '<p>No results found.</p>';
                            return;
                        }

                        let totalTime = 0;
                        const tableRows = entries.map(entry => {
                            totalTime += entry.timeSpent;
                            return \`<tr><td>\${entry.date}</td><td>\${entry.project}</td><td>\${formatTime(entry.timeSpent)}</td></tr>\`;
                        }).join('');

                        content.innerHTML = \`
                            <h2>Search Results</h2>
                            <p>Total Time: \${formatTime(totalTime)}</p>
                            <table>
                                <tr><th>Date</th><th>Project</th><th>Coding Time</th></tr>
                                \${tableRows}
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