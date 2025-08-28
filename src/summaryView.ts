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
        };        webviewView.webview.onDidReceiveMessage(
            async message => {                
                if (message.command === 'refresh') {
                    await this.show(webviewView.webview);
                } else if (message.command === 'search') {
                    const searchResults = await this.database.searchEntries(
                        message.startDate, 
                        message.endDate, 
                        message.project,
                        message.branch
                    );
                    webviewView.webview.postMessage({ command: 'searchResult', data: searchResults });
                } else if (message.command === 'projectChanged') {
                    // If project is empty, show all branches, otherwise show only branches for selected project
                    const branches = message.project 
                        ? await this.database.getBranchesByProject(message.project)
                        : await this.getUniqueBranches();
                    webviewView.webview.postMessage({ command: 'updateBranches', branches });
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.show(webviewView.webview);
    }

    // Add this method to get branches for a specific project
    private async getBranchesByProject(project: string): Promise<string[]> {
        return await this.database.getBranchesByProject(project);
    }

    async show(webview?: vscode.Webview) {
        const summaryData = await this.database.getSummaryData();
        const allEntries = await this.database.getEntries();
        const projects = await this.getUniqueProjects();
        const branches = await this.getUniqueBranches();
        const totalTime = {
            today: formatTime(await this.timeTracker.getTodayTotal()),
            weekly: formatTime(await this.timeTracker.getWeeklyTotal()),
            monthly: formatTime(await this.timeTracker.getMonthlyTotal()),
            yearly: formatTime(await this.timeTracker.getYearlyTotal()),
            allTime: formatTime(await this.timeTracker.getAllTimeTotal())
        };

        if (webview) {
            webview.html = this.getHtmlForWebview(projects);
            webview.postMessage({ 
                command: 'update', 
                data: summaryData, 
                entries: allEntries,
                projects, 
                branches,
                totalTime 
            });
        } else if (this.panel) {
            this.panel.reveal();
            this.panel.webview.html = this.getHtmlForWebview(projects);
            this.panel.webview.postMessage({ command: 'update', data: summaryData, entries: allEntries, projects: projects, totalTime: totalTime });
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
                        this.panel?.webview.postMessage({ command: 'searchResult', data: searchResults });                    } else if (message.command === 'projectChanged') {
                        // Update branches for selected project
                        const branches = message.project 
                            ? await this.database.getBranchesByProject(message.project)
                            : await this.getUniqueBranches();
                        this.panel?.webview.postMessage({ command: 'updateBranches', branches });
                    }
                },
                undefined,
                this.context.subscriptions
            );            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            this.panel.webview.postMessage({ command: 'update', data: summaryData, entries: allEntries, projects, branches, totalTime });
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

    private async getUniqueBranches(): Promise<string[]> {
        const entries = await this.database.getEntries();
        const branchSet = new Set(entries.map(entry => entry.branch));
        return Array.from(branchSet).sort();
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
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    :root {
                        --background-color: var(--vscode-editor-background);
                        --text-color: var(--vscode-editor-foreground);
                        --border-color: var(--vscode-panel-border);
                        --header-background: var(--vscode-editor-background);
                        --header-foreground: var(--vscode-titleBar-activeForeground);
                        --chart-grid-color: rgba(255, 255, 255, 0.1);
                        --chart-text-color: rgba(255, 255, 255, 0.9);
                        --input-background: var(--vscode-input-background);
                        --input-foreground: var(--vscode-input-foreground);
                        --input-border: var(--vscode-input-border);
                        --button-background: var(--vscode-button-background);
                        --button-foreground: var(--vscode-button-foreground);
                        --button-hover: var(--vscode-button-hoverBackground);
                        --cell-background-0: var(--vscode-editor-background);
                        --cell-background-1: color-mix(in srgb, var(--vscode-charts-blue) 30%, transparent);
                        --cell-background-2: color-mix(in srgb, var(--vscode-charts-blue) 50%, transparent);
                        --cell-background-3: color-mix(in srgb, var(--vscode-charts-blue) 70%, transparent);
                        --cell-background-4: color-mix(in srgb, var(--vscode-charts-blue) 90%, transparent);
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
                        color: var (--header-foreground);
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
                    .reset-button {
                        background-color: var(--vscode-button-secondaryBackground) !important;
                        color: var(--vscode-button-secondaryForeground) !important;
                    }
                    .reset-button:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground) !important;
                    }
                    .header {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: var(--header-background);
                        padding: 10px;
                    }
                    .header h1 {
                        margin: 0;
                        padding: 0;
                        text-align: center;
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
                    
                    /* Insight Widgets CSS */
                    .insights-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                    }
                    .insight-box {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        padding: 12px;
                        text-align: center;
                        border-radius: 5px;
                        position: relative;
                        min-height: 100px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .insight-icon {
                        display: none;
                    }
                    .insight-box h3 {
                        margin: 0 0 8px 0;
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        font-weight: 500;
                        line-height: 1.2;
                    }
                    .insight-value {
                        font-size: 18px;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 3px;
                        line-height: 1.1;
                    }
                    .insight-subtitle {
                        font-size: 10px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 8px;
                        line-height: 1.2;
                    }
                    .insight-chart {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 50px;
                        flex-grow: 1;
                    }
                    .insight-visual {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 40px;
                        flex-grow: 1;
                    }
                    
                    /* Flame animation for streak */
                    .flame-container {
                        width: 25px;
                        height: 35px;
                        position: relative;
                    }
                    .flame {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(45deg, #ff4444, #ff8800, #ffaa00);
                        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                        transform-origin: bottom;
                        animation: flicker 2s ease-in-out infinite alternate;
                    }
                    .flame.low {
                        opacity: 0.4;
                        animation-duration: 3s;
                    }
                    .flame.medium {
                        opacity: 0.7;
                        animation-duration: 2s;
                    }
                    .flame.high {
                        opacity: 1;
                        animation-duration: 1s;
                    }
                    @keyframes flicker {
                        0% { transform: scale(1) rotate(-1deg); }
                        25% { transform: scale(1.05) rotate(1deg); }
                        50% { transform: scale(0.98) rotate(-0.5deg); }
                        75% { transform: scale(1.02) rotate(0.5deg); }
                        100% { transform: scale(1) rotate(0deg); }
                    }
                    
                    /* Responsive design for smaller screens */
                    @media (max-width: 1200px) {
                        .insights-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                    @media (max-width: 800px) {
                        .insights-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    @media (max-width: 500px) {
                        .insights-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                    
                    .heatmap-container {
                        margin: 30px 0;
                        overflow-x: auto;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 20px;
                    }
                    .heatmap-wrapper {
                        display: flex;
                        flex-direction: column;
                        width: fit-content;
                        margin: 0 auto;
                    }
                    .months-container {
                        display: flex;
                        gap: 30px;
                    }
                    .month-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }
                    .month-header {
                        text-align: center;
                        font-size: 14px;
                        color: var(--vscode-foreground);
                        font-weight: 500;
                    }
                    .heatmap-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 15px);
                        grid-auto-rows: 15px;
                        gap: 4px;
                    }
                    .day-labels {
                        display: grid;
                        grid-template-columns: repeat(7, 15px);
                        gap: 4px;
                        margin-top: 4px;
                        font-size: 10px;
                        color: var(--vscode-foreground);
                        opacity: 0.8;
                    }
                    .day-label {
                        text-align: center;
                    }
                    .heatmap-cell {
                        width: 15px;
                        height: 15px;
                        border-radius: 3px;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        transition: all 0.2s ease;
                    }
                    .heatmap-cell:hover {
                        transform: scale(1.1);
                    }
                    .heatmap-cell[data-level="0"] { background-color: var(--cell-background-0); }
                    .heatmap-cell[data-level="1"] { background-color: var(--cell-background-1); }
                    .heatmap-cell[data-level="2"] { background-color: var(--cell-background-2); }
                    .heatmap-cell[data-level="3"] { background-color: var(--cell-background-3); }
                    .heatmap-cell[data-level="4"] { background-color: var(--cell-background-4); }
                    .heatmap-legend {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 5px;
                        margin-top: 15px;
                        padding-top: 15px;
                        border-top: 1px solid var(--vscode-panel-border);
                        font-size: 11px;
                        color: var(--vscode-foreground);
                    }
                    .chart-container {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .chart-title {
                        font-size: 16px;
                        font-weight: 500;
                        color: var(--vscode-foreground);
                        margin-bottom: 15px;
                    }
                    .chart-wrapper {
                        position: relative;
                        height: 300px;
                        width: 100%;
                    }
                    .search-results-chart {
                        height: 400px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Coding Time Summary</h1>
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
                             <small>January 1st - today</small>
                        </div>
                        <div class="total-time-item">
                            <h3>All Time</h3>
                            <p id="all-time-total">Loading...</p>
                        </div>
                    </div>

                    <h2>Developer Insights</h2>
                    <div class="insights-grid">
                        <div class="insight-box">
                            <h3>Average Daily Time</h3>
                            <div class="insight-value" id="avg-daily-time">Loading...</div>
                            <div class="insight-chart">
                                <canvas id="avgDailyChart" width="120" height="40"></canvas>
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <h3>Languages Used</h3>
                            <div class="insight-value" id="languages-count">Loading...</div>
                            <div class="insight-subtitle" id="most-used-lang">Most used: Loading...</div>
                            <div class="insight-chart">
                                <canvas id="languagesChart" width="50" height="50"></canvas>
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <h3>Projects Worked</h3>
                            <div class="insight-value" id="projects-count">Loading...</div>
                            <div class="insight-subtitle" id="most-active-project">Most active: Loading...</div>
                            <div class="insight-chart">
                                <canvas id="projectsChart" width="50" height="40"></canvas>
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <h3>Longest Streak</h3>
                            <div class="insight-value" id="longest-streak">Loading...</div>
                            <div class="insight-subtitle" id="current-streak">Current: Loading...</div>
                            <div class="insight-visual">
                                <div class="flame-container">
                                    <div class="flame" id="flame-visual"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <h3>Most Productive Day</h3>
                            <div class="insight-value" id="productive-day">Loading...</div>
                            <div class="insight-subtitle" id="productive-day-time">Avg: Loading...</div>
                            <div class="insight-chart">
                                <canvas id="weekdayChart" width="50" height="35"></canvas>
                            </div>
                        </div>
                    </div>

                    <h2>Coding Activity</h2>
                    <div class="heatmap-container">
                        <div class="heatmap-wrapper">
                            <div class="months-container"></div>
                        </div>
                    </div>                    <div class="search-form">
                        <input type="date" id="start-date-search" name="start-date-search">
                        <input type="date" id="end-date-search" name="end-date-search">
                        <select id="project-search" name="project-search">
                            <option value="">All Projects</option>
                            ${projectOptions}
                        </select>
                        <select id="branch-search" name="branch-search">
                            <option value="">All Branches</option>
                        </select>
                        <button id="search-button">Search</button>
                        <button id="reload-button" class="reset-button">Reset</button>
                    </div>
                    <div id="content">
                        <div class="chart-container">
                            <div class="chart-title">Project Summary</div>
                            <div class="chart-wrapper">
                                <canvas id="projectChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-container">
                            <div class="chart-title">Daily Summary (Last 7 Days)</div>
                            <div class="chart-wrapper">
                                <canvas id="dailyChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-container search-results-chart" style="display: none;">
                            <div class="chart-title">Search Results</div>
                            <div class="chart-wrapper">
                                <canvas id="searchChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Get theme colors
                    const isDarkTheme = document.body.classList.contains('vscode-dark');
                    const style = getComputedStyle(document.documentElement);
                    
                    // Theme-aware colors
                    const chartColors = {
                        text: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                        background: style.getPropertyValue('--vscode-editor-background'),
                        grid: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        accent: style.getPropertyValue('--vscode-textLink-foreground'),
                        chartBlues: [
                            'rgba(64, 159, 255, 0.8)',
                            'rgba(49, 120, 198, 0.8)',
                            'rgba(35, 86, 141, 0.8)',
                            'rgba(28, 69, 113, 0.8)',
                            'rgba(21, 52, 85, 0.8)'
                        ]
                    };

                    // Common chart configuration
                    const commonChartConfig = {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: chartColors.grid,
                                    borderColor: chartColors.grid,
                                    lineWidth: 0.5
                                },
                                ticks: {
                                    color: chartColors.text,
                                    font: {
                                        size: 12,
                                        weight: '500'
                                    },
                                    padding: 8
                                },
                                title: {
                                    display: true,
                                    color: chartColors.text
                                }
                            },
                            x: {
                                grid: {
                                    color: chartColors.grid,
                                    borderColor: chartColors.grid,
                                    lineWidth: 0.5
                                },
                                ticks: {
                                    color: chartColors.text,
                                    font: {
                                        size: 12,
                                        weight: '500'
                                    },
                                    padding: 8
                                },
                                title: {
                                    display: true,
                                    color: chartColors.text
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: chartColors.text,
                                    font: {
                                        size: 12,
                                        weight: '600'
                                    },
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                titleColor: chartColors.text,
                                bodyColor: chartColors.text,
                                borderColor: chartColors.grid,
                                borderWidth: 1,
                                padding: 12,
                                displayColors: false
                            }
                        }
                    };
                    
                    window.addEventListener('message', event => {                        const message = event.data;
                        if (message.command === 'update') {
                            updateContent(message.data, message.entries);
                            updateProjectDropdown(message.projects);
                            if (message.branches) {
                                updateBranchDropdown(message.branches);
                            }
                            updateTotalTimeSection(message.totalTime);
                        } else if (message.command === 'searchResult') {
                            displaySearchResult(message.data);
                        } else if (message.command === 'updateBranches') {
                            updateBranchDropdown(message.branches);
                        }
                    });                    // Add event listener for project change
                    document.getElementById('project-search').addEventListener('change', (e) => {
                        const project = e.target.value;
                        vscode.postMessage({ command: 'projectChanged', project });
                        
                        // Also trigger search to update charts
                        const startDate = document.getElementById('start-date-search').value;
                        const endDate = document.getElementById('end-date-search').value;
                        const branch = document.getElementById('branch-search').value;
                        vscode.postMessage({ command: 'search', startDate, endDate, project, branch });
                    });

                    // Add event listener for branch change
                    document.getElementById('branch-search').addEventListener('change', (e) => {
                        const branch = e.target.value;
                        const project = document.getElementById('project-search').value;
                        const startDate = document.getElementById('start-date-search').value;
                        const endDate = document.getElementById('end-date-search').value;
                        vscode.postMessage({ command: 'search', startDate, endDate, project, branch });
                    });

                    document.getElementById('search-button').addEventListener('click', () => {
                        const startDate = document.getElementById('start-date-search').value;
                        const endDate = document.getElementById('end-date-search').value;
                        const project = document.getElementById('project-search').value;
                        const branch = document.getElementById('branch-search').value;
                        vscode.postMessage({ command: 'search', startDate, endDate, project, branch });
                    });

                    // Add event listener for the reload button
                    document.getElementById('reload-button').addEventListener('click', () => {
                        // Reset date fields
                        document.getElementById('start-date-search').value = '';
                        document.getElementById('end-date-search').value = '';
                        // Reset project dropdown
                        document.getElementById('project-search').value = '';
                        // Reset branch dropdown
                        document.getElementById('branch-search').value = '';
                        // Send refresh command
                        vscode.postMessage({ command: 'refresh' });
                    });

                    function updateProjectDropdown(projects) {
                        const dropdown = document.getElementById('project-search');
                        dropdown.innerHTML = '<option value="">All Projects</option>' +
                            projects.map(project => \`<option value="\${project}">\${project}</option>\`).join('');
                    }

                    function updateBranchDropdown(branches) {
                        const dropdown = document.getElementById('branch-search');
                        if (dropdown) {
                            dropdown.innerHTML = '<option value="">All Branches</option>' +
                                branches.map(branch => '<option value="' + branch + '">' + branch + '</option>').join('');
                        }
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

                    // Store chart instances to destroy them before creating new ones
                    let insightCharts = {
                        avgDaily: null,
                        languages: null,
                        projects: null,
                        weekday: null
                    };

                    function updateInsightWidgets(data, allEntries) {
                        // 1. Average Daily Coding Time
                        updateAverageDailyTime(data, allEntries);
                        
                        // 2. Languages Used
                        updateLanguagesInsight(data);
                        
                        // 3. Projects Worked
                        updateProjectsInsight(data);
                        
                        // 4. Longest Streak
                        updateStreakInsight(allEntries);
                        
                        // 5. Most Productive Day
                        updateProductiveDayInsight(allEntries);
                    }

                    function updateAverageDailyTime(data, allEntries) {
                        const dailyTimes = Object.values(data.dailySummary);
                        const totalDays = dailyTimes.length;
                        const avgDaily = totalDays > 0 ? data.totalTime / totalDays : 0;
                        
                        document.getElementById('avg-daily-time').textContent = formatTime(avgDaily);
                        
                        // Create horizontal bar chart for time periods
                        if (insightCharts.avgDaily) {
                            insightCharts.avgDaily.destroy();
                        }
                        
                        const ctx = document.getElementById('avgDailyChart').getContext('2d');
                        
                        // Calculate time periods
                        const today = getTodayTime(allEntries);
                        const thisWeek = getThisWeekTime(allEntries);
                        const thisMonth = getThisMonthTime(allEntries);
                        const allTime = data.totalTime;
                        
                        // Find max value for scaling
                        const maxTime = Math.max(today, thisWeek / 7, thisMonth / 30, avgDaily);
                        
                        insightCharts.avgDaily = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ['Today', 'Week Avg', 'Month Avg', 'All Time Avg'],
                                datasets: [{
                                    data: [today, thisWeek / 7, thisMonth / 30, avgDaily],
                                    backgroundColor: [
                                        '#FF6384',  // Today - Red
                                        '#36A2EB',  // Week - Blue
                                        '#FFCE56',  // Month - Yellow
                                        '#4BC0C0'   // All Time - Teal
                                    ],
                                    borderWidth: 0,
                                    barPercentage: 0.8,
                                    categoryPercentage: 0.9
                                }]
                            },
                            options: {
                                indexAxis: 'y', // Makes it horizontal
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { 
                                        display: false,
                                        beginAtZero: true,
                                        max: maxTime * 1.1
                                    },
                                    y: { 
                                        display: false 
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return \`\${context.label}: \${formatTime(context.raw)}\`;
                                            }
                                        }
                                    }
                                },
                                elements: {
                                    bar: {
                                        borderRadius: 2
                                    }
                                }
                            }
                        });
                    }

                    function updateLanguagesInsight(data) {
                        const languages = Object.entries(data.languageSummary);
                        const languageCount = languages.length;
                        
                        document.getElementById('languages-count').textContent = languageCount;
                        
                        if (languages.length > 0) {
                            const sortedLangs = languages.sort(([,a], [,b]) => b - a);
                            const topLang = sortedLangs[0];
                            const percentage = ((topLang[1] / data.totalTime) * 100).toFixed(1);
                            document.getElementById('most-used-lang').textContent = \`Most used: \${topLang[0]} (\${percentage}%)\`;
                            
                            // Create mini pie chart
                            if (insightCharts.languages) {
                                insightCharts.languages.destroy();
                            }
                            
                            const ctx = document.getElementById('languagesChart').getContext('2d');
                            const topLanguages = sortedLangs.slice(0, 4);
                            const otherTime = sortedLangs.slice(4).reduce((sum, [,time]) => sum + time, 0);
                            
                            const chartData = topLanguages.map(([name, time]) => ({ name, time }));
                            if (otherTime > 0) {
                                chartData.push({ name: 'Others', time: otherTime });
                            }
                            
                            insightCharts.languages = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: chartData.map(d => d.name),
                                    datasets: [{
                                        data: chartData.map(d => d.time),
                                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return \`\${context.label}: \${formatTime(context.raw)}\`;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            document.getElementById('most-used-lang').textContent = 'Most used: N/A';
                        }
                    }

                    function updateProjectsInsight(data) {
                        const projects = Object.entries(data.projectSummary);
                        const projectCount = projects.length;
                        
                        document.getElementById('projects-count').textContent = projectCount;
                        
                        if (projects.length > 0) {
                            const sortedProjects = projects.sort(([,a], [,b]) => b - a);
                            const topProject = sortedProjects[0];
                            const percentage = ((topProject[1] / data.totalTime) * 100).toFixed(1);
                            document.getElementById('most-active-project').textContent = \`Most active: \${topProject[0]} (\${percentage}%)\`;
                            
                            // Create mini bar chart
                            if (insightCharts.projects) {
                                insightCharts.projects.destroy();
                            }
                            
                            const ctx = document.getElementById('projectsChart').getContext('2d');
                            const topProjects = sortedProjects.slice(0, 3);
                            
                            insightCharts.projects = new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: topProjects.map(([name]) => name.length > 10 ? name.substring(0, 10) + '...' : name),
                                    datasets: [{
                                        data: topProjects.map(([,time]) => time),
                                        backgroundColor: '#36A2EB'
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: { display: false },
                                        y: { display: false }
                                    },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return \`\${context.label}: \${formatTime(context.raw)}\`;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            document.getElementById('most-active-project').textContent = 'Most active: N/A';
                        }
                    }

                    function updateStreakInsight(allEntries) {
                        const streaks = calculateStreaks(allEntries);
                        const longestStreak = streaks.longest;
                        const currentStreak = streaks.current;
                        
                        document.getElementById('longest-streak').textContent = \`\${longestStreak} days\`;
                        document.getElementById('current-streak').textContent = \`Current: \${currentStreak} days\`;
                        
                        // Update flame visual based on current streak
                        const flame = document.getElementById('flame-visual');
                        flame.className = 'flame';
                        if (currentStreak <= 2) {
                            flame.classList.add('low');
                        } else if (currentStreak <= 6) {
                            flame.classList.add('medium');
                        } else {
                            flame.classList.add('high');
                        }
                    }

                    function updateProductiveDayInsight(allEntries) {
                        const dayStats = calculateDayOfWeekStats(allEntries);
                        const mostProductiveDay = dayStats.mostProductive;
                        
                        document.getElementById('productive-day').textContent = mostProductiveDay.name;
                        document.getElementById('productive-day-time').textContent = \`Avg: \${formatTime(mostProductiveDay.avgTime)}\`;
                        
                        // Create mini bar chart for all days
                        if (insightCharts.weekday) {
                            insightCharts.weekday.destroy();
                        }
                        
                        const ctx = document.getElementById('weekdayChart').getContext('2d');
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayTimes = dayStats.days;
                        
                        insightCharts.weekday = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: dayNames,
                                datasets: [{
                                    data: dayTimes,
                                    backgroundColor: dayTimes.map((time, index) => 
                                        index === mostProductiveDay.index ? '#FF6384' : '#36A2EB'
                                    )
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { display: false },
                                    y: { display: false }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return \`\${dayNames[context.dataIndex]}: \${formatTime(context.raw)}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }

                    function calculateStreaks(entries) {
                        if (entries.length === 0) return { longest: 0, current: 0 };
                        
                        const dailyTotals = {};
                        entries.forEach(entry => {
                            dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.timeSpent;
                        });
                        
                        const dates = Object.keys(dailyTotals).sort();
                        let longestStreak = 0;
                        let currentStreak = 0;
                        let tempStreak = 0;
                        
                        const today = new Date().toISOString().split('T')[0];
                        let yesterdayHasCoding = false;
                        
                        for (let i = 0; i < dates.length; i++) {
                            const currentDate = new Date(dates[i]);
                            const prevDate = i > 0 ? new Date(dates[i-1]) : null;
                            
                            const diffDays = prevDate ? 
                                Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24)) : 1;
                            
                            if (diffDays === 1) {
                                tempStreak++;
                            } else {
                                tempStreak = 1;
                            }
                            
                            longestStreak = Math.max(longestStreak, tempStreak);
                            
                            // Check if this is yesterday or today for current streak
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yesterdayStr = yesterday.toISOString().split('T')[0];
                            
                            if (dates[i] === today || dates[i] === yesterdayStr) {
                                if (dates[i] === yesterdayStr) yesterdayHasCoding = true;
                                currentStreak = tempStreak;
                            }
                        }
                        
                        // If today is not in the list and yesterday doesn't have coding, current streak is 0
                        if (!dates.includes(today) && !yesterdayHasCoding) {
                            currentStreak = 0;
                        }
                        
                        return { longest: longestStreak, current: currentStreak };
                    }

                    function calculateDayOfWeekStats(entries) {
                        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
                        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
                        
                        entries.forEach(entry => {
                            const date = new Date(entry.date);
                            const dayOfWeek = date.getDay();
                            dayTotals[dayOfWeek] += entry.timeSpent;
                            dayCounts[dayOfWeek]++;
                        });
                        
                        const dayAverages = dayTotals.map((total, index) => 
                            dayCounts[index] > 0 ? total / dayCounts[index] : 0
                        );
                        
                        const maxAvgIndex = dayAverages.indexOf(Math.max(...dayAverages));
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        
                        return {
                            days: dayAverages,
                            mostProductive: {
                                name: dayNames[maxAvgIndex],
                                avgTime: dayAverages[maxAvgIndex],
                                index: maxAvgIndex
                            }
                        };
                    }

                    function getTodayTime(entries) {
                        const today = new Date().toISOString().split('T')[0];
                        return entries
                            .filter(entry => entry.date === today)
                            .reduce((sum, entry) => sum + entry.timeSpent, 0);
                    }

                    function getThisWeekTime(entries) {
                        const now = new Date();
                        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
                        const today = now.toISOString().split('T')[0];
                        
                        return entries
                            .filter(entry => entry.date >= startOfWeekStr && entry.date <= today)
                            .reduce((sum, entry) => sum + entry.timeSpent, 0);
                    }

                    function getThisMonthTime(entries) {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
                        const today = now.toISOString().split('T')[0];
                        
                        return entries
                            .filter(entry => entry.date >= startOfMonthStr && entry.date <= today)
                            .reduce((sum, entry) => sum + entry.timeSpent, 0);
                    }

                    function updateContent(data, allEntries = []) {
                        // Update insight widgets first
                        updateInsightWidgets(data, allEntries);
                        
                        const content = document.getElementById('content');
                        content.innerHTML = \`
                            <div class="chart-container">
                                <div class="chart-title">Project Summary (Top 5)</div>
                                <div class="chart-wrapper">
                                    <canvas id="projectChart"></canvas>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart-title">Daily Summary (Last 30 Days)</div>
                                <div class="chart-wrapper">
                                    <canvas id="dailyChart"></canvas>
                                </div>
                                <div class="chart-container search-results-chart">
                                    <div class="chart-title">Project Distribution</div>
                                    <div class="chart-wrapper">
                                        <canvas id="searchChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        \`;
                        
                        // Create heatmap
                        createHeatmap(data);
                        
                        // Project summary chart
                        const projectCtx = document.getElementById('projectChart').getContext('2d');
                        const projectData = Object.entries(data.projectSummary)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5);
                        
                        new Chart(projectCtx, {
                            type: 'bar',
                            data: {
                                labels: projectData.map(([key]) => key),
                                datasets: [{
                                    label: 'Coding Time',
                                    data: projectData.map(([_, time]) => time/60),
                                    backgroundColor: chartColors.chartBlues,
                                    borderColor: chartColors.grid,
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                ...commonChartConfig,
                                indexAxis: 'y',
                                plugins: {
                                    ...commonChartConfig.plugins,
                                    tooltip: {
                                        ...commonChartConfig.plugins.tooltip,
                                        callbacks: {
                                            label: function(context) {
                                                const hours = Math.floor(context.raw);
                                                const mins = Math.round((context.raw % 1) * 60);
                                                return \`\${context.label}: \${hours} hour\${hours !== 1 ? 's' : ''} and \${mins} minute\${mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        // Daily summary chart - showing last 30 days
                        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
                        const dailyData = Object.entries(data.dailySummary)
                            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                            .slice(-30);  // Show last 30 days instead of 7
                        
                        new Chart(dailyCtx, {
                            type: 'line',
                            data: {
                                labels: dailyData.map(([date]) => {
                                    const d = new Date(date);
                                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                }),
                                datasets: [{
                                    label: 'Coding Time',
                                    data: dailyData.map(([_, time]) => time / 60),
                                    fill: true,
                                    backgroundColor: \`\${chartColors.accent}33\`,
                                    borderColor: chartColors.accent,
                                    borderWidth: 2,
                                    tension: 0.4,
                                    pointBackgroundColor: chartColors.accent,
                                    pointBorderColor: chartColors.background,
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                }]
                            },
                            options: {
                                ...commonChartConfig,
                                scales: {
                                    ...commonChartConfig.scales,
                                    y: {
                                        ...commonChartConfig.scales.y,
                                        ticks: {
                                            ...commonChartConfig.scales.y.ticks,
                                            callback: function(value) {
                                                return \`\${value}h\`;
                                            }
                                        }
                                    }
                                },
                                plugins: {
                                    ...commonChartConfig.plugins,
                                    tooltip: {
                                        ...commonChartConfig.plugins.tooltip,
                                        callbacks: {
                                            label: function(context) {
                                                const hours = Math.floor(context.raw);
                                                const mins = Math.round((context.raw % 1) * 60);
                                                const date = new Date(context.label);
                                                return \`\${date.toLocaleDateString('en-US', { weekday: 'long' })}: \${hours} hour\${hours !== 1 ? 's' : ''} and \${mins} minute\${mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        // Initialize the search chart with all data
                        const searchCtx = document.getElementById('searchChart').getContext('2d');
                        const allProjectData = Object.entries(data.projectSummary)
                            .sort((a, b) => b[1] - a[1]);
                        
                        new Chart(searchCtx, {
                            type: 'pie',
                            data: {
                                labels: allProjectData.map(([project]) => project),
                                datasets: [{
                                    data: allProjectData.map(([_, minutes]) => ({
                                        value: minutes,
                                        hours: Math.floor(minutes / 60),
                                        mins: Math.round(minutes % 60)
                                    })),
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.7)',    // Red
                                        'rgba(54, 162, 235, 0.7)',   // Blue
                                        'rgba(255, 206, 86, 0.7)',   // Yellow
                                        'rgba(75, 192, 192, 0.7)',   // Teal
                                        'rgba(153, 102, 255, 0.7)',  // Purple
                                        'rgba(255, 159, 64, 0.7)',   // Orange
                                        'rgba(199, 199, 199, 0.7)',  // Gray
                                        'rgba(83, 102, 255, 0.7)',   // Indigo
                                        'rgba(40, 167, 69, 0.7)',    // Green
                                        'rgba(220, 53, 69, 0.7)'     // Dark Red
                                    ],
                                    borderColor: chartColors.background,
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            color: chartColors.text,
                                            font: {
                                                size: 12,
                                                weight: '500'
                                            },
                                            padding: 20,
                                            usePointStyle: true
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                        titleColor: chartColors.text,
                                        bodyColor: chartColors.text,
                                        borderColor: chartColors.grid,
                                        borderWidth: 1,
                                        padding: 12,
                                        callbacks: {
                                            label: function(context) {
                                                const data = context.raw;
                                                return \`\${context.label}: \${data.hours} hour\${data.hours !== 1 ? 's' : ''} and \${data.mins} minute\${data.mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }

                    function displaySearchResult(entries) {
                        const content = document.getElementById('content');
                        if (entries.length === 0) {
                            content.innerHTML = '<p>No results found.</p>';
                            return;
                        }

                        // Calculate data for all charts
                        let totalTime = 0;
                        const projectData = {};
                        const dailyData = {};                        // Process entries for both project and daily summaries
                        const selectedProject = document.getElementById('project-search').value;
                        const selectedBranch = document.getElementById('branch-search').value;

                        // Filter entries based on selected project and branch
                        const filteredEntries = entries.filter(entry => {
                            const projectMatch = !selectedProject || entry.project === selectedProject;
                            const branchMatch = !selectedBranch || entry.branch === selectedBranch;
                            return projectMatch && branchMatch;
                        });

                        // Process filtered entries
                        filteredEntries.forEach(entry => {
                            totalTime += entry.timeSpent;
                            
                            // If a project is selected, organize by branch
                            if (selectedProject) {
                                if (entry.project === selectedProject) {
                                    if (!projectData[entry.branch]) {
                                        projectData[entry.branch] = 0;
                                    }
                                    projectData[entry.branch] += entry.timeSpent;
                                }
                            } else {
                                // Otherwise organize by project
                                if (!projectData[entry.project]) {
                                    projectData[entry.project] = 0;
                                }
                                projectData[entry.project] += entry.timeSpent;
                            }
                    
                            // Update daily data
                            if (!dailyData[entry.date]) {
                                dailyData[entry.date] = 0;
                            }
                            dailyData[entry.date] += entry.timeSpent;
                        });
                    
                        // Update the content with all three charts
                        content.innerHTML = \`
                            <div class="chart-container">
                                <div class="chart-title">Project Summary (Filtered)</div>
                                <div class="chart-wrapper">
                                    <canvas id="projectChart"></canvas>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart-title">Daily Summary (Filtered)</div>
                                <div class="chart-wrapper">
                                    <canvas id="dailyChart"></canvas>
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="chart-title">Project Distribution (Total Time: \${formatTime(totalTime)})</div>
                                <div class="chart-wrapper">
                                    <canvas id="searchChart"></canvas>
                                </div>
                            </div>
                        \`;
                    
                        // Create Project Summary Bar Chart
                        const projectCtx = document.getElementById('projectChart').getContext('2d');
                        const projectChartData = Object.entries(projectData)
                            .sort((a, b) => b[1] - a[1])
                            // Show all branches when a project is selected, otherwise limit to top 5 projects
                            .slice(0, selectedProject ? undefined : 5);

                        new Chart(projectCtx, {
                            type: 'bar',
                            data: {
                                labels: projectChartData.map(([key]) => key),
                                datasets: [{
                                    label: selectedProject ? 'Time per Branch' : 'Time per Project',
                                    data: projectChartData.map(([_, time]) => time/60),
                                    backgroundColor: selectedProject 
                                        ? projectChartData.map((_, index) => chartColors.chartBlues[index % chartColors.chartBlues.length])
                                        : chartColors.chartBlues[0],
                                    borderColor: chartColors.grid,
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                ...commonChartConfig,
                                indexAxis: 'y',
                                plugins: {
                                    ...commonChartConfig.plugins,
                                    title: {
                                        display: selectedProject ? true : false,
                                        text: selectedProject ? \`Time Distribution Across Branches - \${selectedProject}\` : '',
                                        color: chartColors.text,
                                        font: {
                                            size: 14,
                                            weight: '600'
                                        },
                                        padding: {
                                            bottom: 15
                                        }
                                    },
                                    tooltip: {
                                        ...commonChartConfig.plugins.tooltip,
                                        callbacks: {
                                            title: function(context) {
                                                return selectedProject ? \`Branch: \${context[0].label}\` : \`Project: \${context[0].label}\`;
                                            },
                                            label: function(context) {
                                                const hours = Math.floor(context.raw);
                                                const mins = Math.round((context.raw % 1) * 60);
                                                return \`Time: \${hours} hour\${hours !== 1 ? 's' : ''} and \${mins} minute\${mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    
                        // Create Daily Summary Line Chart
                        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
                        const dailyChartData = Object.entries(dailyData)
                            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
                    
                        new Chart(dailyCtx, {
                            type: 'line',
                            data: {
                                labels: dailyChartData.map(([date]) => {
                                    const d = new Date(date);
                                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                }),
                                datasets: [{
                                    label: 'Coding Time',
                                    data: dailyChartData.map(([_, time]) => time / 60),
                                    fill: true,
                                    backgroundColor: \`\${chartColors.accent}33\`,
                                    borderColor: chartColors.accent,
                                    borderWidth: 2,
                                    tension: 0.4,
                                    pointBackgroundColor: chartColors.accent,
                                    pointBorderColor: chartColors.background,
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                }]
                            },
                            options: {
                                ...commonChartConfig,
                                scales: {
                                    ...commonChartConfig.scales,
                                    y: {
                                        ...commonChartConfig.scales.y,
                                        ticks: {
                                            ...commonChartConfig.scales.y.ticks,
                                            callback: function(value) {
                                                return \`\${value}h\`;
                                            }
                                        }
                                    }
                                },
                                plugins: {
                                    ...commonChartConfig.plugins,
                                    tooltip: {
                                        ...commonChartConfig.plugins.tooltip,
                                        callbacks: {
                                            label: function(context) {
                                                const hours = Math.floor(context.raw);
                                                const mins = Math.round((context.raw % 1) * 60);
                                                const date = new Date(context.label);
                                                return \`\${date.toLocaleDateString('en-US', { weekday: 'long' })}: \${hours} hour\${hours !== 1 ? 's' : ''} and \${mins} minute\${mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    
                        // Create Project Distribution Pie Chart
                        const searchCtx = document.getElementById('searchChart').getContext('2d');
                        const searchChartData = Object.entries(projectData)
                            .sort((a, b) => b[1] - a[1]);
                    
                        new Chart(searchCtx, {
                            type: 'pie',
                            data: {
                                labels: searchChartData.map(([project]) => project),
                                datasets: [{
                                    data: searchChartData.map(([_, minutes]) => ({
                                        value: minutes,
                                        hours: Math.floor(minutes / 60),
                                        mins: Math.round(minutes % 60)
                                    })),
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.7)',    // Red
                                        'rgba(54, 162, 235, 0.7)',    // Blue
                                        'rgba(255, 206, 86, 0.7)',    // Yellow
                                        'rgba(75, 192, 192, 0.7)',    // Teal
                                        'rgba(153, 102, 255, 0.7)',   // Purple
                                        'rgba(255, 159, 64, 0.7)',    // Orange
                                        'rgba(199, 199, 199, 0.7)',   // Gray
                                        'rgba(83, 102, 255, 0.7)',    // Indigo
                                        'rgba(40, 167, 69, 0.7)',     // Green
                                        'rgba(220, 53, 69, 0.7)'      // Dark Red
                                    ],
                                    borderColor: chartColors.background,
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            color: chartColors.text,
                                            font: {
                                                size: 12,
                                                weight: '500'
                                            },
                                            padding: 20,
                                            usePointStyle: true
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                        titleColor: chartColors.text,
                                        bodyColor: chartColors.text,
                                        borderColor: chartColors.grid,
                                        borderWidth: 1,
                                        padding: 12,
                                        callbacks: {
                                            label: function(context) {
                                                const data = context.raw;
                                                return \`\${context.label}: \${data.hours} hour\${data.hours !== 1 ? 's' : ''} and \${data.mins} minute\${data.mins !== 1 ? 's' : ''}\`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }

                    function formatTime(minutes) {
                        const hours = Math.floor(minutes / 60);
                        const mins = Math.round(minutes % 60);
                        return \`\${hours}h \${mins}m\`;
                    }

                    function createMonthGrid(data, date) {
                        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
                        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                        
                        const monthGrid = document.createElement('div');
                        monthGrid.className = 'month-grid';
                        
                        // Add month header
                        const header = document.createElement('div');
                        header.className = 'month-header';
                        header.textContent = \`\${monthName} \${date.getFullYear()}\`;
                        monthGrid.appendChild(header);
                        
                        // Create the grid
                        const grid = document.createElement('div');
                        grid.className = 'heatmap-grid';
                        
                        // Get the day of week (0 = Sunday, ..., 6 = Saturday)
                        const firstDayOfWeek = firstDay.getDay();
                        
                        // Create empty cells for padding before the first day
                        for (let i = 0; i < firstDayOfWeek; i++) {
                            const cell = document.createElement('div');
                            cell.className = 'heatmap-cell empty-cell';
                            cell.style.opacity = '0';
                            grid.appendChild(cell);
                        }
                        
                        // Create cells for each day of the month
                        let previousCell = null; // Add this line to store previous cell reference
                        for (let day = 1; day <= lastDay.getDate(); day++) {
                            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
                            const cell = document.createElement('div');
                            cell.className = 'heatmap-cell';
                            
                            const dateStr = currentDate.toISOString().split('T')[0];
                            const minutes = data.dailySummary[dateStr] || 0;
                            const level = getIntensityLevel(minutes);
                            
                            // Get the day name (Sunday first)
                            const dayOfWeek = currentDate.getDay();
                            const dayNames = [ 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                            
                            // Create detailed tooltip content
                            const hours = Math.floor(minutes / 60);
                            const mins = Math.round(minutes % 60);
                            let intensity = 'No activity';
                            if (level === 1) intensity = 'Light coding';
                            if (level === 2) intensity = 'Moderate coding';
                            if (level === 3) intensity = 'Active coding';
                            if (level === 4) intensity = 'Very active coding';
                            
                            const tooltipContent = \`📅 \${dateStr} (\${dayNames[dayOfWeek]})
⏰ Time spent: \${hours}h \${mins}m
📊 Activity level: \${intensity}\`;
                            
                            // Set the data-level on the previous cell if it exists
                            if (previousCell) {
                                previousCell.setAttribute('data-level', level.toString());
                                previousCell.title = tooltipContent;
                            }
                            
                            grid.appendChild(cell);
                            previousCell = cell; // Store current cell as previous for next iteration
                        }
                        
                        // Don't forget to set the attribute for the last cell
                        if (previousCell) {
                            const lastDate = new Date(date.getFullYear(), date.getMonth(), lastDay.getDate());
                            const lastDateStr = lastDate.toISOString().split('T')[0];
                            const lastMinutes = data.dailySummary[lastDateStr] || 0;
                            const lastLevel = getIntensityLevel(lastMinutes);
                            const lastDayName = ['Saturday','Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][lastDate.getDay()];
                            
                            const lastHours = Math.floor(lastMinutes / 60);
                            const lastMins = Math.round(lastMinutes % 60);
                            let lastIntensity = 'No activity';
                            if (lastLevel === 1) lastIntensity = 'Light coding';
                            if (lastLevel === 2) lastIntensity = 'Moderate coding';
                            if (lastLevel === 3) lastIntensity = 'Active coding';
                            if (lastLevel === 4) lastIntensity = 'Very active coding';
                            
                            const lastTooltipContent = \`📅 \${lastDateStr} (\${lastDayName})
⏰ Time spent: \${lastHours}h \${lastMins}m
📊 Activity level: \${lastIntensity}\`;
                            
                            previousCell.setAttribute('data-level', lastLevel.toString());
                            previousCell.title = lastTooltipContent;
                        }
                        
                        monthGrid.appendChild(grid);

                        // Add day labels below the grid with Sunday first
                        const dayLabels = document.createElement('div');
                        dayLabels.className = 'day-labels';
                        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                        days.forEach(day => {
                            const label = document.createElement('div');
                            label.className = 'day-label';
                            label.textContent = day;
                            dayLabels.appendChild(label);
                        });
                        monthGrid.appendChild(dayLabels);
                        
                        return monthGrid;
                    }

                    function createHeatmap(data) {
                        const container = document.querySelector('.heatmap-container');
                        container.innerHTML = '<div class="heatmap-wrapper"><div class="months-container"></div></div>';
                        
                        const monthsContainer = container.querySelector('.months-container');
                        const now = new Date();
                        
                        // Create grids for the last 3 months in reverse order (most recent first)
                        for (let i = 2; i >= 0; i--) {
                            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            const monthGrid = createMonthGrid(data, monthDate);
                            monthsContainer.appendChild(monthGrid);
                        }
                        
                        // Add legend
                        const legend = document.createElement('div');
                        legend.className = 'heatmap-legend';
                        legend.innerHTML = \`
                            <span>Less</span>
                            <div class="heatmap-cell" data-level="0"></div>
                            <div class="heatmap-cell" data-level="1"></div>
                            <div class="heatmap-cell" data-level="2"></div>
                            <div class="heatmap-cell" data-level="3"></div>
                            <div class="heatmap-cell" data-level="4"></div>
                            <span>More</span>
                        \`;
                        container.querySelector('.heatmap-wrapper').appendChild(legend);
                    }

                    function getIntensityLevel(minutes) {
                        if (minutes === 0) return 0;
                        if (minutes < 60) return 1;  // Less than 1 hour
                        if (minutes < 180) return 2; // 1-3 hours
                        if (minutes < 360) return 3; // 3-6 hours
                        return 4; // More than 6 hours
                    }

                    // Request a refresh when the webview becomes visible
                    vscode.postMessage({ command: 'refresh' });
                </script>
            </body>
            </html>
        `;
    }
}