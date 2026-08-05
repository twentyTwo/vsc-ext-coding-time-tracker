/**
 * Markup, styles and client script for the Kilo Code usage tab.
 *
 * These strings are interpolated into the dashboard template in `summaryView.ts`.
 * The renderer works purely from a `KilocodeUsageSummary` delivered over
 * `postMessage` — it never touches the filesystem, mirroring `claudeTab.ts`.
 *
 * IMPORTANT: the client script below must contain no backticks and no `${`.
 * It lives inside a template literal here and is embedded into another one in
 * `summaryView.ts`; avoiding both sequences entirely keeps it from needing two
 * layers of escaping. Build strings with `+` and use `document.createElement`.
 *
 * Generic tab-bar/tab-panel CSS and switching logic (`.tab-btn`, `[hidden]`,
 * `claudeSetTab`/`claudeWire`) live in `claudeTab.ts` and are shared by this
 * tab — only Kilo-specific styles are defined here.
 */

export const kilocodeTabStyles = `
    .kilo-toolbar {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-bottom: 16px;
    }
    .kilo-refresh-btn {
        background-color: var(--input-background, var(--vscode-input-background));
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-family: var(--vscode-font-family);
        font-size: 12px;
        padding: 5px 12px;
    }

    .kilo-status,
    .kilo-empty {
        color: var(--vscode-descriptionForeground, var(--vscode-foreground));
        font-size: 13px;
        padding: 28px 12px;
        text-align: center;
    }
    .kilo-empty code {
        background-color: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1));
        border-radius: 3px;
        padding: 1px 5px;
    }

    .kilo-grid-2 {
        display: grid;
        gap: 15px;
        grid-template-columns: repeat(2, 1fr);
        margin-bottom: 30px;
    }
    .kilo-card {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 5px;
        margin-bottom: 20px;
        padding: 12px;
    }
    .kilo-card h3 {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.4px;
        margin: 0 0 10px 0;
        text-transform: uppercase;
    }
    .kilo-chart { height: 190px; position: relative; }
    .kilo-chart-tall { height: 240px; }

    .kilo-table-wrap { overflow-x: auto; margin-bottom: 24px; }
    .kilo-table {
        border-collapse: collapse;
        font-size: 12px;
        width: 100%;
    }
    .kilo-table th,
    .kilo-table td {
        border-bottom: 1px solid var(--vscode-panel-border);
        padding: 6px 10px;
        text-align: left;
        white-space: nowrap;
    }
    .kilo-table th {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.4px;
        opacity: 0.8;
        text-transform: uppercase;
    }
    .kilo-table td.kilo-num { text-align: right; }

    .kilo-note {
        font-size: 11px;
        line-height: 1.6;
        margin-top: 8px;
        opacity: 0.75;
    }

    @media (max-width: 600px) {
        .kilo-grid-2 { grid-template-columns: 1fr; }
    }
`;

export const kilocodeTabBody = `
    <div class="kilo-toolbar">
        <button class="kilo-refresh-btn" id="kilo-refresh" type="button">Refresh</button>
    </div>

    <div class="kilo-status" id="kilo-status">Loading Kilo Code usage&hellip;</div>
    <div class="kilo-empty" id="kilo-empty" hidden></div>

    <div id="kilo-content" hidden>
        <div class="insights-grid">
            <div class="insight-box">
                <h3>Total Tokens</h3>
                <div class="insight-value" id="kilo-total-tokens">0</div>
                <div class="insight-subtitle" id="kilo-total-tokens-sub">&nbsp;</div>
            </div>
            <div class="insight-box">
                <h3>Reported Cost</h3>
                <div class="insight-value" id="kilo-total-cost">$0.00</div>
                <div class="insight-subtitle">as recorded by Kilo Code</div>
            </div>
            <div class="insight-box">
                <h3>Tasks</h3>
                <div class="insight-value" id="kilo-total-tasks">0</div>
                <div class="insight-subtitle" id="kilo-total-tools">&nbsp;</div>
            </div>
            <div class="insight-box">
                <h3>Requests</h3>
                <div class="insight-value" id="kilo-total-requests">0</div>
                <div class="insight-subtitle" id="kilo-total-protocols">&nbsp;</div>
            </div>
        </div>

        <div class="kilo-grid-2">
            <div class="kilo-card">
                <h3>Token Breakdown</h3>
                <div class="kilo-chart"><canvas id="kiloTokenChart"></canvas></div>
            </div>
            <div class="kilo-card">
                <h3>Tokens by API Protocol</h3>
                <div class="kilo-chart"><canvas id="kiloProtocolChart"></canvas></div>
            </div>
        </div>

        <div class="kilo-card">
            <h3>Usage Over Time (last 30 days)</h3>
            <div class="kilo-chart kilo-chart-tall"><canvas id="kiloDailyChart"></canvas></div>
        </div>

        <div class="kilo-card">
            <h3>Tool Usage</h3>
            <div class="kilo-chart"><canvas id="kiloToolChart"></canvas></div>
        </div>

        <h2>Recent Tasks</h2>
        <div class="kilo-table-wrap">
            <table class="kilo-table" id="kilo-tasks-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Task</th>
                        <th>Tools</th>
                        <th>Requests</th>
                        <th>Duration</th>
                        <th>Tokens</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <div class="kilo-note" id="kilo-note"></div>
    </div>
`;

export const kilocodeTabScript = `
    (function () {
        var kiloCharts = {};
        var kiloState = { requested: false, pending: false };
        var kiloPalette = [
            'rgba(64, 159, 255, 0.85)',
            'rgba(126, 211, 159, 0.85)',
            'rgba(247, 184, 75, 0.85)',
            'rgba(233, 107, 107, 0.85)',
            'rgba(178, 140, 255, 0.85)',
            'rgba(94, 200, 216, 0.85)',
            'rgba(240, 142, 199, 0.85)',
            'rgba(163, 189, 97, 0.85)'
        ];

        function kiloEl(id) {
            return document.getElementById(id);
        }

        function kiloTextStyle() {
            var dark = document.body.classList.contains('vscode-dark');
            return {
                text: dark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                grid: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            };
        }

        function kiloFmtTokens(value) {
            var n = value || 0;
            if (n >= 1000000) { return (n / 1000000).toFixed(2) + 'M'; }
            if (n >= 1000) { return (n / 1000).toFixed(1) + 'K'; }
            return String(Math.round(n));
        }

        function kiloFmtCost(value) {
            var n = value || 0;
            if (n > 0 && n < 0.01) { return '$' + n.toFixed(4); }
            return '$' + n.toFixed(2);
        }

        function kiloFmtDate(epochMs) {
            if (!epochMs) { return 'unknown'; }
            var d = new Date(epochMs);
            if (isNaN(d.getTime())) { return 'unknown'; }
            return d.toLocaleDateString();
        }

        function kiloFmtDuration(startMs, endMs) {
            if (!startMs || !endMs || endMs < startMs) { return '-'; }
            var minutes = Math.round((endMs - startMs) / 60000);
            if (minutes < 60) { return minutes + 'm'; }
            return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
        }

        function kiloShortTaskId(id) {
            return String(id).slice(0, 8);
        }

        function kiloDestroyCharts() {
            for (var key in kiloCharts) {
                if (kiloCharts[key] && typeof kiloCharts[key].destroy === 'function') {
                    kiloCharts[key].destroy();
                }
            }
            kiloCharts = {};
        }

        function kiloMakeChart(canvasId, config) {
            if (typeof Chart === 'undefined') { return; }
            var canvas = kiloEl(canvasId);
            if (!canvas) { return; }
            kiloCharts[canvasId] = new Chart(canvas.getContext('2d'), config);
        }

        function kiloBaseOptions(showLegend) {
            var colors = kiloTextStyle();
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

        function kiloSetRows(tableId, rows) {
            var table = kiloEl(tableId);
            if (!table) { return; }
            var body = table.getElementsByTagName('tbody')[0];
            if (!body) { return; }
            while (body.firstChild) { body.removeChild(body.firstChild); }
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var tr = document.createElement('tr');
                for (var c = 0; c < row.cells.length; c++) {
                    var td = document.createElement('td');
                    // textContent, never innerHTML: these values are task ids and
                    // tool names read off disk.
                    td.textContent = row.cells[c].text;
                    if (row.cells[c].numeric) { td.className = 'kilo-num'; }
                    if (row.cells[c].title) { td.title = row.cells[c].title; }
                    tr.appendChild(td);
                }
                body.appendChild(tr);
            }
        }

        function kiloShow(which, message) {
            var status = kiloEl('kilo-status');
            var empty = kiloEl('kilo-empty');
            var content = kiloEl('kilo-content');
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

        function kiloRequest() {
            if (kiloState.pending) { return; }
            kiloState.requested = true;
            kiloState.pending = true;
            kiloShow('status', 'Reading Kilo Code tasks\\u2026');
            vscode.postMessage({ command: 'kilocodeRefresh' });
        }

        function kiloRenderTotals(data) {
            var totals = data.totals;
            kiloEl('kilo-total-tokens').textContent = kiloFmtTokens(totals.tokens);
            kiloEl('kilo-total-tokens-sub').textContent =
                kiloFmtTokens(totals.tokensIn + totals.tokensOut) + ' non-cache';
            kiloEl('kilo-total-cost').textContent = kiloFmtCost(totals.costUsd);
            kiloEl('kilo-total-tasks').textContent = String(totals.tasks);
            kiloEl('kilo-total-requests').textContent = String(totals.requests);
            kiloEl('kilo-total-protocols').textContent =
                data.byProtocol.length + (data.byProtocol.length === 1 ? ' protocol' : ' protocols');

            var toolCalls = 0;
            for (var i = 0; i < data.byTool.length; i++) { toolCalls += data.byTool[i].count; }
            kiloEl('kilo-total-tools').textContent = toolCalls + ' tool calls';
        }

        function kiloRenderTokenChart(data) {
            var totals = data.totals;
            kiloMakeChart('kiloTokenChart', {
                type: 'doughnut',
                data: {
                    labels: ['Input', 'Output', 'Cache write', 'Cache read'],
                    datasets: [{
                        data: [totals.tokensIn, totals.tokensOut, totals.cacheWrites, totals.cacheReads],
                        backgroundColor: kiloPalette.slice(0, 4),
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
                                color: kiloTextStyle().text,
                                boxWidth: 12,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }

        function kiloRenderProtocolChart(data) {
            var labels = [];
            var values = [];
            var top = data.byProtocol.slice(0, 8);
            for (var i = 0; i < top.length; i++) {
                labels.push(top[i].apiProtocol);
                values.push(top[i].tokens);
            }
            var options = kiloBaseOptions(false);
            options.indexAxis = 'y';
            kiloMakeChart('kiloProtocolChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: kiloPalette[0], borderWidth: 0 }]
                },
                options: options
            });
        }

        function kiloRenderDailyChart(data) {
            var days = data.byDay.slice(-30);
            var labels = [];
            var input = [];
            var output = [];
            var cacheWrite = [];
            var cacheRead = [];
            var cost = [];
            for (var i = 0; i < days.length; i++) {
                labels.push(days[i].date.slice(5));
                input.push(days[i].tokensIn);
                output.push(days[i].tokensOut);
                cacheWrite.push(days[i].cacheWrites);
                cacheRead.push(days[i].cacheReads);
                cost.push(Number(days[i].costUsd.toFixed(4)));
            }
            var colors = kiloTextStyle();
            kiloMakeChart('kiloDailyChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Input', data: input, backgroundColor: kiloPalette[0] },
                        { label: 'Output', data: output, backgroundColor: kiloPalette[1] },
                        { label: 'Cache write', data: cacheWrite, backgroundColor: kiloPalette[2] },
                        { label: 'Cache read', data: cacheRead, backgroundColor: kiloPalette[3] },
                        {
                            type: 'line',
                            label: 'Cost (USD)',
                            data: cost,
                            yAxisID: 'y1',
                            borderColor: kiloPalette[4],
                            backgroundColor: kiloPalette[4],
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

        function kiloRenderToolChart(data) {
            var top = data.byTool.slice(0, 12);
            var labels = [];
            var values = [];
            for (var i = 0; i < top.length; i++) {
                labels.push(top[i].name);
                values.push(top[i].count);
            }
            var options = kiloBaseOptions(false);
            options.indexAxis = 'y';
            kiloMakeChart('kiloToolChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: kiloPalette[5], borderWidth: 0 }]
                },
                options: options
            });
        }

        function kiloRenderTables(data) {
            var taskRows = [];
            for (var i = 0; i < data.tasks.length; i++) {
                var task = data.tasks[i];
                taskRows.push({
                    cells: [
                        { text: kiloFmtDate(task.end) },
                        { text: kiloShortTaskId(task.id), title: task.id },
                        { text: task.tools.join(', ') },
                        { text: String(task.requests), numeric: true },
                        { text: kiloFmtDuration(task.start, task.end), numeric: true },
                        { text: kiloFmtTokens(task.tokens), numeric: true },
                        { text: kiloFmtCost(task.costUsd), numeric: true }
                    ]
                });
            }
            kiloSetRows('kilo-tasks-table', taskRows);
        }

        function kiloRenderNote(data) {
            var note = kiloEl('kilo-note');
            if (!note) { return; }
            while (note.firstChild) { note.removeChild(note.firstChild); }

            var lines = [];
            lines.push('Cost is read directly from Kilo Code\\u2019s own request accounting, not independently estimated.');
            lines.push('Kilo Code does not record a model id or workspace/project per request locally, so there is ' +
                'no per-model or per-project breakdown \\u2014 tokens are grouped by API protocol instead.');
            if (typeof Chart === 'undefined') {
                lines.push('Charts could not load because the charting library was unavailable.');
            }
            for (var w = 0; w < data.warnings.length && w < 5; w++) {
                lines.push(data.warnings[w]);
            }
            lines.push('Read from ' + data.dataDir + '. Only usage metadata and tool names are read \\u2014 never task prompts or responses.');

            for (var i = 0; i < lines.length; i++) {
                var div = document.createElement('div');
                div.textContent = lines[i];
                note.appendChild(div);
            }
        }

        function kiloRender(data) {
            kiloDestroyCharts();

            if (!data.available) {
                kiloShow('empty', 'No Kilo Code tasks found in ' + data.dataDir +
                    '. If your data lives elsewhere, set simpleCodingTimeTracker.kilocode.dataPath in Settings.');
                return;
            }
            if (data.totals.requests === 0) {
                kiloShow('empty', 'No Kilo Code usage recorded yet.');
                return;
            }

            kiloShow('content');
            kiloRenderTotals(data);
            kiloRenderTokenChart(data);
            kiloRenderProtocolChart(data);
            kiloRenderDailyChart(data);
            kiloRenderToolChart(data);
            kiloRenderTables(data);
            kiloRenderNote(data);
        }

        window.addEventListener('message', function (event) {
            var message = event.data;
            if (!message || message.command !== 'kilocodeUsage') { return; }
            kiloState.pending = false;
            if (message.error) {
                kiloShow('empty', 'Could not read Kilo Code usage: ' + message.error);
                return;
            }
            kiloRender(message.data);
        });

        var kiloWired = false;

        function kiloWire() {
            if (kiloWired) { return; }
            kiloWired = true;

            var refresh = kiloEl('kilo-refresh');
            if (refresh) {
                refresh.addEventListener('click', function () {
                    kiloState.requested = false;
                    kiloRequest();
                });
            }
        }

        document.addEventListener('DOMContentLoaded', kiloWire);
        if (document.readyState !== 'loading') { kiloWire(); }

        // Scanning task logs is deferred until the tab is actually opened, so the
        // rest of the dashboard never waits on it. tabActivated is dispatched by
        // the generic tab-switching logic in claudeTab.ts.
        window.addEventListener('tabActivated', function (event) {
            if (event && event.detail === 'kilocode' && !kiloState.requested) { kiloRequest(); }
        });
    })();
`;
