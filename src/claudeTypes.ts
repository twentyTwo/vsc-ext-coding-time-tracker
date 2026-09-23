/**
 * Shared contract for Claude Code usage reporting.
 *
 * This module deliberately imports nothing — not `vscode`, not `fs`. It is the
 * boundary between the reader (which touches the filesystem) and the webview
 * renderer (which only ever sees a finished summary), so either side can be
 * replaced or consumed from outside this extension without dragging in the other.
 */

/** Which projects a summary covers. */
export type UsageScope = 'all' | 'workspace';

/**
 * One assistant turn's token usage. Metadata only — message content is never
 * read, stored, or transmitted.
 */
export interface UsageRecord {
    /** `message.id` — stable across session resumes, so it doubles as the dedupe key. */
    id: string;
    /** ISO 8601 timestamp of the turn. */
    ts: string;
    model: string;
    input: number;
    output: number;
    /** Cache writes billed at the 5-minute rate (1.25x input). */
    cacheWrite5m: number;
    /** Cache writes billed at the 1-hour rate (2x input). */
    cacheWrite1h: number;
    cacheRead: number;
    webSearch: number;
    webFetch: number;
    /** Fast mode changes the rate on Opus-tier models. */
    fast: boolean;
    /** Names of the tools invoked in this turn — names only, never inputs. */
    tools: string[];
    session: string;
    branch: string;
}

/**
 * Parsed records for a single transcript file, plus the fields that are constant
 * across it. Hoisting `project` here keeps the on-disk cache substantially smaller
 * than repeating the path on every record.
 */
export interface FileRecords {
    /** Absolute path of the project the session ran in. */
    project: string;
    /** Subagent transcripts are real spend, but worth distinguishing in the UI. */
    isSubagent: boolean;
    records: UsageRecord[];
}

export interface UsageTotals {
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
    /** Sum of the four token buckets above. */
    tokens: number;
    /** Estimated API-equivalent cost in USD. Subscription users pay nothing per token. */
    costUsd: number;
    sessions: number;
    /** Assistant turns, after dedupe. */
    messages: number;
}

export interface ModelUsage {
    model: string;
    tokens: number;
    costUsd: number;
    messages: number;
    /** False when the model was not in the price table and fell back to a default rate. */
    priced: boolean;
}

export interface ProjectUsage {
    /** Absolute path. */
    project: string;
    /** Basename, for display. */
    name: string;
    tokens: number;
    costUsd: number;
    sessions: number;
    isCurrentWorkspace: boolean;
}

export interface BranchUsage {
    branch: string;
    tokens: number;
}

export interface DayUsage {
    /** Local `YYYY-MM-DD`, matching the time-tracking date keys. */
    date: string;
    input: number;
    output: number;
    cacheWrite: number;
    cacheRead: number;
    costUsd: number;
}

export interface ToolUsage {
    name: string;
    count: number;
}

export interface SessionUsage {
    id: string;
    project: string;
    name: string;
    branch: string;
    models: string[];
    tokens: number;
    costUsd: number;
    /** ISO 8601 timestamp of the first assistant turn. */
    start: string;
    /** ISO 8601 timestamp of the last assistant turn. */
    end: string;
    messages: number;
    isSubagent: boolean;
    /**
     * Sum of gaps between consecutive assistant turns that fall under the
     * idle-gap threshold. Approximates real engaged time; unlike `end - start`
     * it does not balloon when a session is left open for hours or days
     * between messages.
     */
    activeMs: number;
}

/**
 * Everything the Claude tab renders. The renderer works purely from this object,
 * so an additional data source can be added later without touching the UI —
 * hence `source`.
 */
export interface ClaudeUsageSummary {
    source: 'local';
    /** False when no Claude Code data directory was found; the UI shows an empty state. */
    available: boolean;
    /** Directory that was searched, shown in the empty state. */
    dataDir: string;
    scope: UsageScope;
    /** True when a workspace folder is open, so the scope toggle can be enabled. */
    hasWorkspace: boolean;
    /** Models absent from the price table; their cost is a fallback estimate. */
    unknownModels: string[];
    /** Non-fatal problems (unreadable files, malformed lines) worth surfacing quietly. */
    warnings: string[];
    totals: UsageTotals;
    byModel: ModelUsage[];
    byProject: ProjectUsage[];
    byBranch: BranchUsage[];
    byDay: DayUsage[];
    byTool: ToolUsage[];
    /** Most recent sessions, newest first. */
    sessions: SessionUsage[];
}

/**
 * Rate-limit windows Anthropic's account usage endpoint reports. Unlike the rest
 * of this file, these figures are not derived from local transcripts — they come
 * straight from Anthropic, using the OAuth token Claude Code itself already
 * stores on disk. `session` is the rolling 5-hour window, `weekly_all` the
 * 7-day window across every model, and `weekly_scoped` a per-model weekly cap
 * (only present on some plans).
 */
export type ClaudeQuotaWindowKind = 'session' | 'weekly_all' | 'weekly_scoped';

export interface ClaudeQuotaWindow {
    kind: ClaudeQuotaWindowKind;
    /** Model or surface name for a `weekly_scoped` window (e.g. "Opus"), else undefined. */
    scopeLabel?: string;
    /** 0-100, as reported by Anthropic. */
    utilization: number;
    /** ISO timestamp, or '' for a usage-anchored window that has not started yet. */
    resetsAt: string;
    /** Anthropic's own flag for the window currently doing the limiting. */
    isActive: boolean;
}

/**
 * `ok` — `windows` reflects a fresh response from Anthropic.
 * `disabled` — the user has not turned this feature on (it calls Anthropic, unlike the rest of the tab).
 * `signed-out` — no usable Claude Code OAuth credentials were found on disk.
 * `rate-limited` — Anthropic asked us to back off; try again shortly.
 * `error` — the request failed for another reason; see `message`.
 */
export type ClaudeQuotaStatus = 'ok' | 'disabled' | 'signed-out' | 'rate-limited' | 'error';

export interface ClaudeQuotaSummary {
    status: ClaudeQuotaStatus;
    /** Human-readable detail, set for 'error'. */
    message?: string;
    /** ISO timestamp this snapshot was fetched at. */
    fetchedAt: string;
    windows: ClaudeQuotaWindow[];
}
