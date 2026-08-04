# `claudeUsage.ts` Documentation

This file reads Claude Code's local session transcripts and aggregates token usage into a summary for the Claude Code tab of the dashboard. It is the only file in the extension that touches Claude Code's data directory.

## Overview
- **Purpose:** Report how many tokens Claude Code has used, broken down by model, project, branch, day, tool and session, with an estimated API-equivalent cost.
- **Storage read:** Claude Code's own JSONL transcripts. Nothing is written back to them.
- **Main Class:** `ClaudeUsageReader` – discovery, parsing, caching, pricing and aggregation.
- **Privacy:** Only usage metadata is read — token counts, model names, timestamps, tool *names*, `cwd` and git branch. Message content is never parsed, stored or transmitted.

## Key Concepts
- **UsageRecord** (declared in `claudeTypes.ts`): one assistant turn's token usage, keyed by `message.id`.
- **ClaudeUsageSummary** (declared in `claudeTypes.ts`): the finished object handed to the webview. This is the contract; the reader never touches the UI.
- **Scope:** `all` covers every project on the machine, `workspace` only those whose path is inside an open workspace folder.

## How It Works

### Locating the data directory
Resolution order, first match wins:
1. The `simpleCodingTimeTracker.claude.dataPath` setting (supports a leading `~`).
2. The `CLAUDE_CONFIG_DIR` environment variable.
3. `~/.claude`.

If `<dir>/projects` does not exist, the reader returns a summary with `available: false` so the tab can show an empty state naming the directory it searched.

### Discovery
Claude Code stores one directory per project under `projects/`, named after the working directory with separators replaced by dashes. Inside each:
- `<session-id>.jsonl` — the main session transcript.
- `<session-id>/subagents/agent-*.jsonl` — subagent transcripts, which are real token spend and are included, tagged `isSubagent`.

The directory name is a lossy encoding of the path (it cannot distinguish a separator from a literal dash), so it is only a fallback. The authoritative project path is the `cwd` field inside the transcript.

### Parsing
Transcripts reach tens of megabytes, so each file is streamed line by line with `readline` rather than read into memory. Lines that do not contain `"assistant"` are skipped without being parsed, which avoids the cost of `JSON.parse` on every user turn.

For each assistant turn with a `message.usage` block the reader records input, output, cache-write and cache-read tokens, the model, the timestamp, server tool request counts, and the names of any `tool_use` blocks.

Cache writes are split by TTL when `usage.cache_creation` provides `ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`, because the two are billed at different rates. Older transcripts only carry the flat `cache_creation_input_tokens`, which is billed at the 5-minute rate.

### Deduplication
Resuming or forking a session replays earlier turns into a new transcript, so the same turn can appear in several files. Aggregation keeps a set of seen `message.id` values and counts each turn once. This is why deduplication happens at aggregation time and not inside the per-file cache — the cache has no cross-file view.

### Caching
Re-parsing every transcript on each dashboard open is wasteful, so parsed records are cached as JSON in the extension's `globalStorageUri` directory (not `globalState`, which is unsuitable for data of this size). Each entry is keyed by absolute path and validated against the file's `size` and `mtimeMs`; anything that changed is re-parsed and anything that disappeared is dropped. `CACHE_VERSION` invalidates the whole cache when the record shape changes.

### Pricing
`MODEL_RATES` is a longest-prefix-wins table of USD per million input and output tokens. Cache rates are fixed multiples of the input rate: 1.25x for a 5-minute write, 2x for a 1-hour write, and 0.1x for a read. Fast mode is billed at the Opus fast rate.

A model that matches nothing in the table is priced at a fallback rate and reported in `summary.unknownModels`, so the UI can say the estimate is incomplete instead of silently showing a wrong number.

Cost is always an **estimate**: Claude Code does not record cost, rates change, and subscription plans do not bill per token at all.

### Aggregation
A single pass builds totals plus the per-model, per-project, per-branch, per-day, per-tool and per-session breakdowns. Day keys use the same local-date conversion as `database.ts`, so the Claude charts line up with the coding-time heatmap instead of drifting by timezone. Subagent spend rolls up into its parent session; a session row is only flagged as a subagent if nothing else contributed to it.

## Notes
- The transcript format is internal to Claude Code and can change without notice. Parsing is deliberately defensive: unreadable files and malformed lines are collected into `summary.warnings` rather than thrown.
- `getSummary` serializes overlapping calls so two quick refreshes do not scan the disk twice.
