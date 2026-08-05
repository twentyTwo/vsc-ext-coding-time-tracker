/**
 * Shared contract for Kilo Code usage reporting.
 *
 * This module deliberately imports nothing — not `vscode`, not `fs`. It is the
 * boundary between the reader (which touches the filesystem) and the webview
 * renderer (which only ever sees a finished summary), mirroring `claudeTypes.ts`.
 *
 * Kilo Code's local task files carry less than Claude Code's transcripts: there is
 * no per-request model id and no reliable workspace/project attribution, so this
 * summary has no `byModel` or `byProject` breakdown — see `byProtocol` instead,
 * which groups by the only per-request dimension actually present (`apiProtocol`).
 */

/**
 * One API request's token usage, as Kilo Code itself recorded it. Metadata only —
 * task prompts and responses are never read, stored, or transmitted.
 */
export interface KilocodeUsageRecord {
    /** Epoch-ms timestamp of the request. */
    ts: number;
    /** e.g. "openai", "anthropic" — the only per-request identifier Kilo Code keeps locally. */
    apiProtocol: string;
    tokensIn: number;
    tokensOut: number;
    cacheWrites: number;
    cacheReads: number;
    /** Cost as computed and reported by Kilo Code itself — not re-estimated here. */
    cost: number;
    /** True when Kilo Code could not determine usage for this request. */
    usageMissing: boolean;
    task: string;
}

/** Names of tools requested during a task — names only, never their inputs. */
export interface KilocodeToolCall {
    task: string;
    name: string;
}

export interface KilocodeUsageTotals {
    tokensIn: number;
    tokensOut: number;
    cacheWrites: number;
    cacheReads: number;
    /** Sum of the four token buckets above. */
    tokens: number;
    /** As reported by Kilo Code; not an independent estimate. */
    costUsd: number;
    tasks: number;
    /** Requests, i.e. `api_req_started` entries. */
    requests: number;
}

export interface KilocodeProtocolUsage {
    apiProtocol: string;
    tokens: number;
    costUsd: number;
    requests: number;
}

export interface KilocodeToolUsage {
    name: string;
    count: number;
}

export interface KilocodeDayUsage {
    /** Local `YYYY-MM-DD`, matching the time-tracking date keys. */
    date: string;
    tokensIn: number;
    tokensOut: number;
    cacheWrites: number;
    cacheReads: number;
    costUsd: number;
}

export interface KilocodeTaskUsage {
    id: string;
    tokens: number;
    costUsd: number;
    requests: number;
    tools: string[];
    /** Epoch-ms timestamp of the first recorded request. */
    start: number;
    /** Epoch-ms timestamp of the last recorded request. */
    end: number;
}

/**
 * Everything the Kilo Code tab renders. The renderer works purely from this
 * object, mirroring `ClaudeUsageSummary` — hence `source`.
 */
export interface KilocodeUsageSummary {
    source: 'local';
    /** False when no Kilo Code tasks directory was found; the UI shows an empty state. */
    available: boolean;
    /** Directory that was searched, shown in the empty state. */
    dataDir: string;
    /** Non-fatal problems (unreadable files, malformed JSON, missing usage) worth surfacing quietly. */
    warnings: string[];
    totals: KilocodeUsageTotals;
    byProtocol: KilocodeProtocolUsage[];
    byDay: KilocodeDayUsage[];
    byTool: KilocodeToolUsage[];
    /** Most recent tasks, newest first. */
    tasks: KilocodeTaskUsage[];
}
