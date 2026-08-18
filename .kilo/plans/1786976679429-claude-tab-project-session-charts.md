# Claude tab: charts for Projects and Recent Sessions

## Goal
Add two Chart.js visualizations to the Claude Code usage tab: a grouped-bar chart for the Projects section (sessions / tokens / cost per project) and a bubble timeline for the Recent Sessions section (date vs tokens, bubble size = cost).

## Scope
- **Single file change: `src/claudeTab.ts`** (markup strings + client script). No changes to `claudeTypes.ts`, `claudeUsage.ts`, or `summaryView.ts` — the webview already receives everything needed (`byProject`, 25 most recent `sessions` with `activeMs`, Chart.js is already loaded via CDN, `claudeMakeChart`/`claudeDestroyCharts`/`claudePalette`/`claudeTextStyle` already exist).

## Critical constraint
The client script inside `claudeTabScript` must contain **no backticks and no `${`** (it is nested inside two template literals — see header comment in `claudeTab.ts`). Build all strings with `+` concatenation.

## Changes

### 1. Markup (`claudeTabBody`)
- Between `<h2>Projects</h2>` and the projects table, insert:
  `<div class="claude-card"><h3>Sessions / Tokens / Cost by Project</h3><div class="claude-chart claude-chart-tall"><canvas id="claudeProjectChart"></canvas></div></div>`
- Between `<h2>Recent Sessions</h2>` and the sessions table, insert:
  `<div class="claude-card"><h3>Recent Sessions Timeline</h3><div class="claude-chart claude-chart-tall"><canvas id="claudeSessionChart"></canvas></div></div>`

### 2. Script (`claudeTabScript`) — two new render functions

**`claudeRenderProjectChart(data)`** — grouped horizontal bars, top 10 projects by tokens (byProject is already sorted desc by tokens):
- 3 datasets: Sessions, Tokens, Est. Cost, using `claudePalette[0..2]`, `indexAxis: 'y'`.
- Values normalized per-metric: `value / maxOfMetric` (guard: if max is 0 use 0). The x-axis represents relative magnitude; set x-axis tick callback to show percentages.
- Tooltip callbacks must show the **raw** values: project name (label), sessions count, `claudeFmtTokens(tokens)`, `claudeFmtCost(costUsd)` — no normalized numbers in tooltips.
- Legend at bottom (showLegend via `claudeBaseOptions(true)`), then override tooltip callbacks.

**`claudeRenderSessionChart(data)`** — bubble timeline:
- Use `data.sessions` **reversed to chronological order** so time flows left→right.
- Each point: `x = Date.parse(session.end)` (skip sessions with unparseable/absent `end`), `y = session.tokens`, `r = 3 + 15 * sqrt(costUsd / maxCost)` clamped to 3–18; guard `maxCost = 0` (use min radius 3).
- Single dataset, `claudePalette[4]`.
- x-axis: `type: 'linear'` (NO `type: 'time'` — no date adapter is loaded); tick callback formats the ms value as a short local date (e.g. `'MM/DD'` via manual padding, no backticks). y-axis: default numeric ticks.
- Tooltip callbacks: title = `session.name` + branch (append `' (subagent)'` when `isSubagent`), label lines for date (`claudeFmtDate`), turns, active time (`claudeFmtDurationMs(activeMs)`), tokens, cost.

**`claudeRender(data)`**: call `claudeRenderProjectChart(data)` and `claudeRenderSessionChart(data)` after `claudeRenderToolChart(data)`.

No other wiring needed: `claudeDestroyCharts()` in `claudeRender` already disposes all charts on re-render, and `claudeMakeChart` no-ops when Chart.js failed to load.

## Edge cases
- 1–2 projects / sessions: charts render with the bars/bubbles available.
- All-zero metrics: normalized values become 0 (division guarded); bubbles fall back to min radius.
- Session with invalid `end` timestamp: skipped from the bubble chart (row still appears in the table).
- Dark/light themes: reuse `claudeTextStyle()` via `claudeBaseOptions`.

## Validation
1. `npm run compile` (webpack) and `npm run lint` (eslint) must pass.
2. Manual: open the dashboard → Claude Code tab (`simpleCodingTimeTracker` view). Verify in both scopes (All projects / This workspace):
   - Project chart shows up to 10 grouped bars; tooltips show raw sessions/tokens/cost; x-axis ticks are percentages.
   - Session chart is a left→right timeline; bubble size grows with cost; tooltips show project @ branch, date, turns, active time, tokens, cost.
   - Refresh and scope toggling destroy/recreate both charts without canvas errors.
   - Empty/`available: false` states still show the existing empty message (charts hidden with content).
