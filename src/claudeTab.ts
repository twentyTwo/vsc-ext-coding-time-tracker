/**
 * Markup, styles and client script for the Claude Code usage tab.
 *
 * These strings are interpolated into the dashboard template in `summaryView.ts`.
 * The renderer works purely from a `ClaudeUsageSummary` delivered over
 * `postMessage` — it never touches the filesystem, so the same code can render a
 * summary from any source.
 *
 * IMPORTANT: the client script below must contain no backticks and no `${`.
 * It lives inside a template literal here and is embedded into another one in
 * `summaryView.ts`; avoiding both sequences entirely keeps it from needing two
 * layers of escaping. Build strings with `+` and use `document.createElement`.
 */

export const claudeTabStyles = `
    .tab-bar {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--vscode-panel-border);
        margin-bottom: 20px;
    }
    .tab-btn {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-family: var(--vscode-font-family);
        font-size: 13px;
        opacity: 0.7;
        padding: 8px 14px;
    }
    .tab-btn:hover { opacity: 1; }
    .tab-btn.active {
        border-bottom-color: var(--vscode-textLink-foreground);
        opacity: 1;
        font-weight: 600;
    }
    [hidden] { display: none !important; }

    .claude-toolbar {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: space-between;
        margin-bottom: 16px;
    }
    .claude-scope { display: flex; gap: 4px; }
    .claude-scope-btn,
    .claude-refresh-btn {
        background-color: var(--input-background, var(--vscode-input-background));
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-family: var(--vscode-font-family);
        font-size: 12px;
        padding: 5px 12px;
    }
    .claude-scope-btn.active {
        background-color: var(--vscode-textLink-foreground);
        border-color: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
    }
    .claude-scope-btn[disabled] { cursor: default; opacity: 0.5; }

    .claude-status,
    .claude-empty {
        color: var(--vscode-descriptionForeground, var(--vscode-foreground));
        font-size: 13px;
        padding: 28px 12px;
        text-align: center;
    }
    .claude-empty code {
        background-color: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1));
        border-radius: 3px;
        padding: 1px 5px;
    }

    .claude-grid-2 {
        display: grid;
        gap: 15px;
        grid-template-columns: repeat(2, 1fr);
        margin-bottom: 30px;
    }
    .claude-card {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 5px;
        margin-bottom: 20px;
        padding: 12px;
    }
    .claude-card h3 {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.4px;
        margin: 0 0 10px 0;
        text-transform: uppercase;
    }
    .claude-chart { height: 190px; position: relative; }
    .claude-chart-tall { height: 240px; }

    .claude-table-wrap { overflow-x: auto; margin-bottom: 24px; }
    .claude-table {
        border-collapse: collapse;
        font-size: 12px;
        width: 100%;
    }
    .claude-table th,
    .claude-table td {
        border-bottom: 1px solid var(--vscode-panel-border);
        padding: 6px 10px;
        text-align: left;
        white-space: nowrap;
    }
    .claude-table th {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.4px;
        opacity: 0.8;
        text-transform: uppercase;
    }
    .claude-table td.claude-num { text-align: right; }
    .claude-table tr.claude-highlight td { color: var(--vscode-textLink-foreground); font-weight: 600; }

    .claude-note {
        font-size: 11px;
        line-height: 1.6;
        margin-top: 8px;
        opacity: 0.75;
    }

    @media (max-width: 600px) {
        .claude-grid-2 { grid-template-columns: 1fr; }
    }
`;

export const claudeTabBody = `
    <div class="claude-toolbar">
        <div class="claude-scope">
            <button class="claude-scope-btn active" data-scope="all" type="button">All projects</button>
            <button class="claude-scope-btn" data-scope="workspace" type="button">This workspace</button>
        </div>
        <button class="claude-refresh-btn" id="claude-refresh" type="button">Refresh</button>
    </div>

    <div class="claude-status" id="claude-status">Loading Claude Code usage&hellip;</div>
    <div class="claude-empty" id="claude-empty" hidden></div>

    <div id="claude-content" hidden>
        <div class="insights-grid">
            <div class="insight-box">
                <h3>Total Tokens</h3>
                <div class="insight-value" id="claude-total-tokens">0</div>
                <div class="insight-subtitle" id="claude-total-tokens-sub">&nbsp;</div>
            </div>
            <div class="insight-box">
                <h3>Estimated Cost</h3>
                <div class="insight-value" id="claude-total-cost">$0.00</div>
                <div class="insight-subtitle">API-equivalent</div>
            </div>
            <div class="insight-box">
                <h3>Sessions</h3>
                <div class="insight-value" id="claude-total-sessions">0</div>
                <div class="insight-subtitle" id="claude-total-projects">&nbsp;</div>
            </div>
            <div class="insight-box">
                <h3>Assistant Turns</h3>
                <div class="insight-value" id="claude-total-messages">0</div>
                <div class="insight-subtitle" id="claude-total-tools">&nbsp;</div>
            </div>
        </div>

        <div class="claude-grid-2">
            <div class="claude-card">
                <h3>Token Breakdown</h3>
                <div class="claude-chart"><canvas id="claudeTokenChart"></canvas></div>
            </div>
            <div class="claude-card">
                <h3>Tokens by Model</h3>
                <div class="claude-chart"><canvas id="claudeModelChart"></canvas></div>
            </div>
        </div>

        <div class="claude-card">
            <h3>Usage Over Time (last 30 days)</h3>
            <div class="claude-chart claude-chart-tall"><canvas id="claudeDailyChart"></canvas></div>
        </div>

        <div class="claude-card">
            <h3>Tool Usage</h3>
            <div class="claude-chart"><canvas id="claudeToolChart"></canvas></div>
        </div>

        <h2>Projects</h2>
        <div class="claude-table-wrap">
            <table class="claude-table" id="claude-projects-table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Sessions</th>
                        <th>Tokens</th>
                        <th>Est. Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <h2>Recent Sessions</h2>
        <div class="claude-table-wrap">
            <table class="claude-table" id="claude-sessions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Project</th>
                        <th>Branch</th>
                        <th>Model</th>
                        <th>Turns</th>
                        <th title="Time actively spent in the conversation, excluding idle gaps longer than the configured threshold">Active Time</th>
                        <th>Tokens</th>
                        <th>Est. Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <div class="claude-note" id="claude-note"></div>
    </div>
`;

export const claudeTabScript = `
    (function () {
        var claudeCharts = {};
        var claudeState = { scope: 'all', requested: false, pending: false };
        var claudePalette = [
            'rgba(64, 159, 255, 0.85)',
            'rgba(126, 211, 159, 0.85)',
            'rgba(247, 184, 75, 0.85)',
            'rgba(233, 107, 107, 0.85)',
            'rgba(178, 140, 255, 0.85)',
            'rgba(94, 200, 216, 0.85)',
            'rgba(240, 142, 199, 0.85)',
            'rgba(163, 189, 97, 0.85)'
        ];

        function claudeEl(id) {
            return document.getElementById(id);
        }

        function claudeTextStyle() {
            var dark = document.body.classList.contains('vscode-dark');
            return {
                text: dark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                grid: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            };
        }

        function claudeFmtTokens(value) {
            var n = value || 0;
            if (n >= 1000000) { return (n / 1000000).toFixed(2) + 'M'; }
            if (n >= 1000) { return (n / 1000).toFixed(1) + 'K'; }
            return String(Math.round(n));
        }

        function claudeFmtCost(value) {
            var n = value || 0;
            if (n > 0 && n < 0.01) { return '$' + n.toFixed(4); }
            return '$' + n.toFixed(2);
        }

        function claudeFmtDate(iso) {
            if (!iso) { return 'unknown'; }
            var d = new Date(iso);
            if (isNaN(d.getTime())) { return 'unknown'; }
            return d.toLocaleDateString();
        }

        function claudeFmtDurationMs(ms) {
            if (typeof ms !== 'number' || isNaN(ms) || ms < 0) { return '-'; }
            var minutes = Math.round(ms / 60000);
            if (minutes < 1) { return '<1m'; }
            if (minutes < 60) { return minutes + 'm'; }
            return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
        }

        function claudeShortModel(model) {
            return String(model).replace('claude-', '');
        }

        function claudeDestroyCharts() {
            for (var key in claudeCharts) {
                if (claudeCharts[key] && typeof claudeCharts[key].destroy === 'function') {
                    claudeCharts[key].destroy();
                }
            }
            claudeCharts = {};
        }

        function claudeMakeChart(canvasId, config) {
            if (typeof Chart === 'undefined') { return; }
            var canvas = claudeEl(canvasId);
            if (!canvas) { return; }
            claudeCharts[canvasId] = new Chart(canvas.getContext('2d'), config);
        }

        function claudeBaseOptions(showLegend) {
            var colors = claudeTextStyle();
            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: showLegend,
                        position: 'bottom',
                        labels: { color: colors.text, boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid } },
                    y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid } }
                }
            };
        }

        function claudeSetRows(tableId, rows) {
            var table = claudeEl(tableId);
            if (!table) { return; }
            var body = table.getElementsByTagName('tbody')[0];
            if (!body) { return; }
            while (body.firstChild) { body.removeChild(body.firstChild); }
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var tr = document.createElement('tr');
                if (row.highlight) { tr.className = 'claude-highlight'; }
                for (var c = 0; c < row.cells.length; c++) {
                    var td = document.createElement('td');
                    // textContent, never innerHTML: these values are file paths and
                    // branch names read off disk.
                    td.textContent = row.cells[c].text;
                    if (row.cells[c].numeric) { td.className = 'claude-num'; }
                    if (row.cells[c].title) { td.title = row.cells[c].title; }
                    tr.appendChild(td);
                }
                body.appendChild(tr);
            }
        }

        function claudeShow(which, message) {
            var status = claudeEl('claude-status');
            var empty = claudeEl('claude-empty');
            var content = claudeEl('claude-content');
            if (!status || !empty || !content) { return; }
            status.hidden = which !== 'status';
            empty.hidden = which !== 'empty';
            content.hidden = which !== 'content';
            if (which === 'status') { status.textContent = message || ''; }
            if (which === 'empty') {
                while (empty.firstChild) { empty.removeChild(empty.firstChild); }
                var paragraph = document.createElement('div');
                paragraph.textContent = message || '';
                empty.appendChild(paragraph);
            }
        }

        function claudeRequest() {
            if (claudeState.pending) { return; }
            claudeState.requested = true;
            claudeState.pending = true;
            claudeShow('status', 'Reading Claude Code sessions\\u2026');
            vscode.postMessage({ command: 'claudeRefresh', scope: claudeState.scope });
        }

        function claudeSetScope(scope) {
            claudeState.scope = scope;
            var buttons = document.querySelectorAll('.claude-scope-btn');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute('data-scope') === scope) {
                    buttons[i].className = 'claude-scope-btn active';
                } else {
                    buttons[i].className = 'claude-scope-btn';
                }
            }
            claudeRequest();
        }

        function claudeSetTab(name) {
            var panels = document.querySelectorAll('.tab-panel');
            if (panels.length === 0) { return; }
            for (var p = 0; p < panels.length; p++) {
                panels[p].hidden = panels[p].id !== 'panel-' + name;
            }
            var buttons = document.querySelectorAll('.tab-btn');
            var title = document.getElementById('dashboard-title');
            for (var i = 0; i < buttons.length; i++) {
                var active = buttons[i].getAttribute('data-tab') === name;
                buttons[i].className = active ? 'tab-btn active' : 'tab-btn';
                if (active && title && buttons[i].getAttribute('data-title')) {
                    title.textContent = buttons[i].getAttribute('data-title');
                }
            }
            try { vscode.setState({ tab: name }); } catch (error) { /* state is optional */ }
            // Scanning session logs is deferred until the tab is actually opened,
            // so the time-tracking dashboard never waits on it.
            try { window.dispatchEvent(new CustomEvent('tabActivated', { detail: name })); } catch (error) { /* older webviews without CustomEvent */ }
            if (name === 'claude' && !claudeState.requested) { claudeRequest(); }
        }

        function claudeRenderTotals(data) {
            var totals = data.totals;
            claudeEl('claude-total-tokens').textContent = claudeFmtTokens(totals.tokens);
            claudeEl('claude-total-tokens-sub').textContent =
                claudeFmtTokens(totals.input + totals.output) + ' non-cache';
            claudeEl('claude-total-cost').textContent = claudeFmtCost(totals.costUsd);
            claudeEl('claude-total-sessions').textContent = String(totals.sessions);
            claudeEl('claude-total-projects').textContent =
                data.byProject.length + (data.byProject.length === 1 ? ' project' : ' projects');
            claudeEl('claude-total-messages').textContent = String(totals.messages);

            var toolCalls = 0;
            for (var i = 0; i < data.byTool.length; i++) { toolCalls += data.byTool[i].count; }
            claudeEl('claude-total-tools').textContent = toolCalls + ' tool calls';
        }

        function claudeRenderTokenChart(data) {
            var totals = data.totals;
            claudeMakeChart('claudeTokenChart', {
                type: 'doughnut',
                data: {
                    labels: ['Input', 'Output', 'Cache write', 'Cache read'],
                    datasets: [{
                        data: [totals.input, totals.output, totals.cacheWrite, totals.cacheRead],
                        backgroundColor: claudePalette.slice(0, 4),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: claudeTextStyle().text,
                                boxWidth: 12,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }

        function claudeRenderModelChart(data) {
            var labels = [];
            var values = [];
            var top = data.byModel.slice(0, 8);
            for (var i = 0; i < top.length; i++) {
                labels.push(claudeShortModel(top[i].model));
                values.push(top[i].tokens);
            }
            var options = claudeBaseOptions(false);
            options.indexAxis = 'y';
            claudeMakeChart('claudeModelChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: claudePalette[0], borderWidth: 0 }]
                },
                options: options
            });
        }

        function claudeRenderDailyChart(data) {
            var days = data.byDay.slice(-30);
            var labels = [];
            var input = [];
            var output = [];
            var cacheWrite = [];
            var cacheRead = [];
            var cost = [];
            for (var i = 0; i < days.length; i++) {
                labels.push(days[i].date.slice(5));
                input.push(days[i].input);
                output.push(days[i].output);
                cacheWrite.push(days[i].cacheWrite);
                cacheRead.push(days[i].cacheRead);
                cost.push(Number(days[i].costUsd.toFixed(4)));
            }
            var colors = claudeTextStyle();
            claudeMakeChart('claudeDailyChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Input', data: input, backgroundColor: claudePalette[0] },
                        { label: 'Output', data: output, backgroundColor: claudePalette[1] },
                        { label: 'Cache write', data: cacheWrite, backgroundColor: claudePalette[2] },
                        { label: 'Cache read', data: cacheRead, backgroundColor: claudePalette[3] },
                        {
                            type: 'line',
                            label: 'Est. cost (USD)',
                            data: cost,
                            yAxisID: 'y1',
                            borderColor: claudePalette[4],
                            backgroundColor: claudePalette[4],
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: colors.text, boxWidth: 12, font: { size: 10 } }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            ticks: { color: colors.text, font: { size: 9 }, maxRotation: 0, autoSkip: true },
                            grid: { color: colors.grid }
                        },
                        y: {
                            stacked: true,
                            ticks: { color: colors.text, font: { size: 9 } },
                            grid: { color: colors.grid }
                        },
                        y1: {
                            position: 'right',
                            ticks: { color: colors.text, font: { size: 9 } },
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            });
        }

        function claudeRenderToolChart(data) {
            var top = data.byTool.slice(0, 12);
            var labels = [];
            var values = [];
            for (var i = 0; i < top.length; i++) {
                labels.push(top[i].name);
                values.push(top[i].count);
            }
            var options = claudeBaseOptions(false);
            options.indexAxis = 'y';
            claudeMakeChart('claudeToolChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: claudePalette[5], borderWidth: 0 }]
                },
                options: options
            });
        }

        function claudeRenderTables(data) {
            var projectRows = [];
            for (var i = 0; i < data.byProject.length; i++) {
                var project = data.byProject[i];
                projectRows.push({
                    highlight: project.isCurrentWorkspace,
                    cells: [
                        { text: project.name, title: project.project },
                        { text: String(project.sessions), numeric: true },
                        { text: claudeFmtTokens(project.tokens), numeric: true },
                        { text: claudeFmtCost(project.costUsd), numeric: true }
                    ]
                });
            }
            claudeSetRows('claude-projects-table', projectRows);

            var sessionRows = [];
            for (var s = 0; s < data.sessions.length; s++) {
                var session = data.sessions[s];
                var models = [];
                for (var m = 0; m < session.models.length; m++) {
                    models.push(claudeShortModel(session.models[m]));
                }
                sessionRows.push({
                    highlight: false,
                    cells: [
                        { text: claudeFmtDate(session.end) },
                        { text: session.name + (session.isSubagent ? ' (subagent)' : ''), title: session.project },
                        { text: session.branch },
                        { text: models.join(', ') },
                        { text: String(session.messages), numeric: true },
                        { text: claudeFmtDurationMs(session.activeMs), numeric: true },
                        { text: claudeFmtTokens(session.tokens), numeric: true },
                        { text: claudeFmtCost(session.costUsd), numeric: true }
                    ]
                });
            }
            claudeSetRows('claude-sessions-table', sessionRows);
        }

        function claudeRenderNote(data) {
            var note = claudeEl('claude-note');
            if (!note) { return; }
            while (note.firstChild) { note.removeChild(note.firstChild); }

            var lines = [];
            lines.push('Cost is an estimate of equivalent API pricing. Claude Code does not record ' +
                'cost, and subscription plans do not bill per token.');
            if (data.unknownModels.length > 0) {
                lines.push('Priced with a fallback rate (model not in the price table): ' +
                    data.unknownModels.join(', ') + '.');
            }
            if (typeof Chart === 'undefined') {
                lines.push('Charts could not load because the charting library was unavailable.');
            }
            for (var w = 0; w < data.warnings.length && w < 5; w++) {
                lines.push(data.warnings[w]);
            }
            lines.push('Read from ' + data.dataDir + '. Only usage metadata is read \\u2014 never message content.');

            for (var i = 0; i < lines.length; i++) {
                var div = document.createElement('div');
                div.textContent = lines[i];
                note.appendChild(div);
            }
        }

        function claudeRender(data) {
            claudeDestroyCharts();

            var workspaceButton = document.querySelector('.claude-scope-btn[data-scope="workspace"]');
            if (workspaceButton) {
                if (data.hasWorkspace) {
                    workspaceButton.removeAttribute('disabled');
                } else {
                    workspaceButton.setAttribute('disabled', 'disabled');
                }
            }

            if (!data.available) {
                claudeShow('empty', 'No Claude Code sessions found in ' + data.dataDir +
                    '. If your data lives elsewhere, set simpleCodingTimeTracker.claude.dataPath in Settings.');
                return;
            }
            if (data.totals.messages === 0) {
                claudeShow('empty', data.scope === 'workspace'
                    ? 'No Claude Code usage recorded for this workspace yet.'
                    : 'No Claude Code usage recorded yet.');
                return;
            }

            claudeShow('content');
            claudeRenderTotals(data);
            claudeRenderTokenChart(data);
            claudeRenderModelChart(data);
            claudeRenderDailyChart(data);
            claudeRenderToolChart(data);
            claudeRenderTables(data);
            claudeRenderNote(data);
        }

        window.addEventListener('message', function (event) {
            var message = event.data;
            if (!message || message.command !== 'claudeUsage') { return; }
            claudeState.pending = false;
            if (message.error) {
                claudeShow('empty', 'Could not read Claude Code usage: ' + message.error);
                return;
            }
            claudeRender(message.data);
        });

        var claudeWired = false;

        function claudeWire() {
            if (claudeWired) { return; }
            claudeWired = true;

            var tabButtons = document.querySelectorAll('.tab-btn');
            for (var i = 0; i < tabButtons.length; i++) {
                tabButtons[i].addEventListener('click', function (event) {
                    claudeSetTab(event.currentTarget.getAttribute('data-tab'));
                });
            }

            var scopeButtons = document.querySelectorAll('.claude-scope-btn');
            for (var s = 0; s < scopeButtons.length; s++) {
                scopeButtons[s].addEventListener('click', function (event) {
                    if (event.currentTarget.getAttribute('disabled')) { return; }
                    claudeSetScope(event.currentTarget.getAttribute('data-scope'));
                });
            }

            var refresh = claudeEl('claude-refresh');
            if (refresh) {
                refresh.addEventListener('click', function () {
                    claudeState.requested = false;
                    claudeRequest();
                });
            }

            // The dashboard rebuilds its HTML on every refresh, so the active tab
            // is restored from webview state rather than kept in memory.
            var saved = null;
            try { saved = vscode.getState(); } catch (error) { saved = null; }
            var savedTab = saved && saved.tab ? saved.tab : 'time';
            claudeSetTab(claudeEl('panel-' + savedTab) ? savedTab : 'time');
        }

        document.addEventListener('DOMContentLoaded', claudeWire);
        if (document.readyState !== 'loading') { claudeWire(); }
    })();
`;
