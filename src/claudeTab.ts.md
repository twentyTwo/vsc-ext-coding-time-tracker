# `claudeTab.ts` Documentation

This file provides the markup, styles and client-side script for the Claude Code tab of the dashboard. It exports three strings that `summaryView.ts` interpolates into its HTML template.

## Overview
- **Purpose:** Render a `ClaudeUsageSummary` as stat cards, charts and tables.
- **Exports:** `claudeTabStyles` (CSS), `claudeTabBody` (markup), `claudeTabScript` (client script).
- **Data flow:** The script never reads the filesystem. It posts `claudeRefresh` to the extension host and renders whatever `claudeUsage` message comes back, so the same renderer works regardless of where the summary came from.

## The escaping rule

**The client script must contain no backticks and no `${`.**

`claudeTabScript` is a template literal here, and it is interpolated into another template literal in `summaryView.ts`. Either sequence would otherwise need two layers of escaping and break in confusing ways. Build strings with `+` and construct DOM nodes with `document.createElement`.

Interpolating the *value* of these strings is safe — only text written literally inside a template literal is parsed for placeholders.

## Layout

- **Toolbar:** scope toggle (All projects / This workspace) and a Refresh button. The workspace button is disabled when no folder is open.
- **Stat cards:** total tokens, estimated cost, sessions, assistant turns — reusing the existing `.insights-grid` / `.insight-box` classes so the tab matches the rest of the dashboard.
- **Charts:** token breakdown doughnut, tokens by model, a stacked per-day chart for the last 30 days with estimated cost on a secondary axis, and tool usage.
- **Tables:** projects and recent sessions.
- **Note block:** the cost-is-an-estimate disclaimer, any unpriced models, parse warnings, and the directory that was read.

## Behaviour

### Tab switching
Tab state lives in this file rather than in `summaryView.ts`, which keeps the wiring seam in the dashboard thin. `show()` reassigns `webview.html` on every refresh and tears down the DOM, so the active tab is persisted with `vscode.setState()` and restored on load.

### Lazy loading
Session transcripts are only scanned when the Claude tab is first opened, never on dashboard open, so the coding-time dashboard never waits on disk I/O. Switching scope or pressing Refresh re-requests.

### Charts
Chart instances are held in `claudeCharts` and destroyed before being recreated. Every chart call is guarded by a `typeof Chart === 'undefined'` check, so if the charting library fails to load the tables and totals still render and the note block says so.

### Escaping user data
Project paths, branch names and tool names come off disk. Table cells are filled with `textContent`, never `innerHTML`.
