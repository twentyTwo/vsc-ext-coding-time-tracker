import * as vscode from 'vscode';
import { Database, SummaryData, TimeEntry } from './database';
import { ThemeIcon } from 'vscode';
import { formatTime } from './utils';
import { TimeTracker } from './timeTracker';

export class SummaryViewProvider implements vscode.WebviewViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private database: Database;
    private timeTracker: TimeTracker;

    constructor(context: vscode.ExtensionContext, database: Database, timeTracker: TimeTracker) {
        this.context = context;
        this.database = database;
        this.timeTracker = timeTracker;
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
                    const searchResults = await this.database.searchEntries(message.startDate, message.endDate, message.project);
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
        const totalTime = {
            today: formatTime(this.timeTracker.getTodayTotal()),
            weekly: formatTime(this.timeTracker.getWeeklyTotal()),
            monthly: formatTime(this.timeTracker.getMonthlyTotal()),
            yearly: formatTime(this.timeTracker.getYearlyTotal()), // Add this line
            allTime: formatTime(this.timeTracker.getAllTimeTotal())
        };

        if (webview) {
            webview.html = this.getHtmlForWebview(projects);
            webview.postMessage({ command: 'update', data: summaryData, projects: projects, totalTime: totalTime });
        } else if (this.panel) {
            this.panel.reveal();
            this.panel.webview.html = this.getHtmlForWebview(projects);
            this.panel.webview.postMessage({ command: 'update', data: summaryData, projects: projects, totalTime: totalTime });
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
                        const searchResults = await this.database.searchEntries(message.startDate, message.endDate, message.project);
                        this.panel?.webview.postMessage({ command: 'searchResult', data: searchResults });
                    }
                },
                undefined,
                this.context.subscriptions
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            this.panel.webview.postMessage({ command: 'update', data: summaryData, projects: projects, totalTime: totalTime });
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
                    .container {
                        padding: 0px;
                    }
                    .search-form {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .search-form input,
                    .search-form select,
                    .search-form button {
                        height: 32px;
                        padding: 0 8px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-size: 13px;
                        border-radius: 2px;
                    }
                    .search-form input[type="date"] {
                        padding: 0 4px;
                    }
                    .search-form select {
                        padding-right: 24px;
                    }
                    .search-form button {
                        cursor: pointer;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 0 12px;
                    }
                    .search-form button:hover {
                        background-color: var(--vscode-button-hoverBackground);
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
                    .total-time-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr); /* Change to 5 columns */
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .total-time-item {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        padding: 15px;
                        text-align: center;
                        border-radius: 5px;
                    }
                    .total-time-item h3 {
                        margin-top: 0;
                        font-size: 16px;
                        color: var(--vscode-foreground);
                    }
                    .total-time-item p {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 10px 0 0;
                        color: var(--vscode-textLink-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Coding Time Summary</h1>
                    <button class="reload-button" id="reload-button">Reload</button>
                </div>
                <div class="container">
                    <h2>Total Coding Time</h2>
                    <div class="total-time-grid">
                        <div class="total-time-item">
                            <h3>Today</h3>
                            <p id="today-total">Loading...</p>
                        </div>
                        <div class="total-time-item">
                            <h3>This Week</h3>
                            <p id="weekly-total">Loading...</p>
                            <small>Sunday - today</small>
                        </div>
                        <div class="total-time-item">
                            <h3>This Month</h3>
                            <p id="monthly-total">Loading...</p>
                             <small><span id="month-start"></span> - today</small>
                        </div>
                        <div class="total-time-item">
                            <h3>This Year</h3>
                            <p id="yearly-total">Loading...</p>
                             <small>From January 1st to today</small>
                        </div>
                        <div class="total-time-item">
                            <h3>All Time</h3>
                            <p id="all-time-total">Loading...</p>
                        </div>
                    </div>
                    <div class="search-form">
                        <input type="date" id="start-date-search" name="start-date-search">
                        <input type="date" id="end-date-search" name="end-date-search">
                        <select id="project-search" name="project-search">
                            <option value="">All Projects</option>
                            ${projectOptions}
                        </select>
                        <button id="search-button">Search</button>
                    </div>
                    <div id="content">Loading...</div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'update') {
                            updateContent(message.data);
                            updateProjectDropdown(message.projects);
                            updateTotalTimeSection(message.totalTime);
                        } else if (message.command === 'searchResult') {
                            displaySearchResult(message.data);
                        }
                    });

                    document.getElementById('search-button').addEventListener('click', () => {
                        const startDate = document.getElementById('start-date-search').value;
                        const endDate = document.getElementById('end-date-search').value;
                        const project = document.getElementById('project-search').value;
                        vscode.postMessage({ command: 'search', startDate, endDate, project });
                    });

                    // Add event listener for the reload button
                    document.getElementById('reload-button').addEventListener('click', () => {
                        // Reset date fields
                        document.getElementById('start-date-search').value = '';
                        document.getElementById('end-date-search').value = '';
                        // Reset project dropdown
                        document.getElementById('project-search').value = '';
                        // Send refresh command
                        vscode.postMessage({ command: 'refresh' });
                    });

                    function updateProjectDropdown(projects) {
                        const dropdown = document.getElementById('project-search');
                        dropdown.innerHTML = '<option value="">All Projects</option>' +
                            projects.map(project => \`<option value="\${project}">\${project}</option>\`).join('');
                    }

                    function updateTotalTimeSection(totalTime) {
                        document.getElementById('today-total').textContent = totalTime.today;
                        document.getElementById('weekly-total').textContent = totalTime.weekly;
                        document.getElementById('monthly-total').textContent = totalTime.monthly;
                        document.getElementById('yearly-total').textContent = totalTime.yearly;
                        document.getElementById('all-time-total').textContent = totalTime.allTime;

                        // Set the start of the current month
                        const now = new Date();
                        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
                        document.getElementById('month-start').textContent = \`\${monthNames[now.getMonth()]} 1st\`;
                    }

                    function updateContent(data) {
                        const content = document.getElementById('content');
                        content.innerHTML = \`
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
                            <h2>Search Results: (Coding Time is \${formatTime(totalTime)})</h2>
                            <table>
                                <tr><th>Date</th><th>Project</th><th>Coding Time</th></tr>
                                \${tableRows}
                            </table>
                        \`;
                    }

                    function formatTime(minutes) {
                        const hours = Math.floor(minutes / 60);
                        const mins = Math.round(minutes % 60);
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