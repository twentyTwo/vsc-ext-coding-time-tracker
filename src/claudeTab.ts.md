# `claudeTab.ts` Documentation

This file provides the markup, styles and client-side script for the Claude Code tab of the dashboard. It exports three strings that `summaryView.ts` interpolates into its HTML template.

## Overview
- **Purpose:** Render a `ClaudeUsageSummary` as stat cards, charts and tables.
- **Exports:** `claudeTabStyles` (CSS), `claudeTabBody` (markup), `claudeTabScript` (client script).
- **Data flow:** The script never reads the filesystem itself. It posts `claudeRefresh` to the extension host and renders whatever `claudeUsage` message comes back, so the same renderer works regardless of where the summary came from. A second, independent request/response pair — `claudeQuotaRefresh` / `claudeQuota` — drives the "Usage Limits" note and bars described below; it is the one part of this tab backed by a network call (see `claudeQuota.ts`), gated server-side on the `claude.showUsageLimits` setting.

## The escaping rule

**The client script must contain no backticks and no `${`.**

`claudeTabScript` is a template literal here, and it is interpolated into another template literal in `summaryView.ts`. Either sequence would otherwise need two layers of escaping and break in confusing ways. Build strings with `+` and construct DOM nodes with `document.createElement`.

Interpolating the *value* of these strings is safe — only text written literally inside a template literal is parsed for placeholders.

## Layout

- **Toolbar:** scope toggle (All projects / This workspace) and a Refresh button. The workspace button is disabled when no folder is open.
- **Usage Limits:** two bars — "5-Hour Session" and "This Week" — showing Anthropic's own rate-limit utilisation for the signed-in Claude Code account, with percent remaining and a reset countdown. Independent of the token-usage content below it: it has its own loading/disabled/signed-out/rate-limited/error states (in the `claude-quota-note` line) and renders whether or not local session transcripts were found. A per-model weekly cap, when Anthropic reports one with nonzero usage, is called out in that note line rather than given its own bar, since it can be the binding constraint even when the all-models weekly bar looks fine.
- **Stat cards:** total tokens, estimated cost, sessions, assistant turns — reusing the existing `.insights-grid` / `.insight-box` classes so the tab matches the rest of the dashboard.
- **Charts:** token breakdown doughnut, tokens by model, a stacked per-day chart for the last 30 days with estimated cost on a secondary axis, and tool usage.
- **Tables:** projects and recent sessions.
- **Note block:** the cost-is-an-estimate disclaimer, any unpriced models, parse warnings, and the directory that was read.

## Behaviour

### Tab switching
Tab state lives in this file rather than in `summaryView.ts`, which keeps the wiring seam in the dashboard thin. `show()` reassigns `webview.html` on every refresh and tears down the DOM, so the active tab is persisted with `vscode.setState()` and restored on load.

### Lazy loading
Session transcripts are only scanned when the Claude tab is first opened, never on dashboard open, so the coding-time dashboard never waits on disk I/O. Switching scope or pressing Refresh re-requests. The usage-limits fetch follows the same lazy trigger (tab open, or Refresh) but is tracked separately (`claudeQuotaState`), so a slow or failing network call never blocks the token-usage content from rendering.

### Charts
Chart instances are held in `claudeCharts` and destroyed before being recreated. Every chart call is guarded by a `typeof Chart === 'undefined'` check, so if the charting library fails to load the tables and totals still render and the note block says so.

### Escaping user data
Project paths, branch names and tool names come off disk. Table cells are filled with `textContent`, never `innerHTML`.
