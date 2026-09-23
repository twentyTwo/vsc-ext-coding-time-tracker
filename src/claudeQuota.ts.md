# `claudeQuota.ts` Documentation

This file fetches the real 5-hour and weekly rate-limit utilisation Anthropic reports for the signed-in Claude Code account, for the "Usage Limits" card on the Claude Code tab.

## Overview
- **Purpose:** Report how close the current 5-hour session window and the current weekly window are to Anthropic's rate limit, plus when each resets. This is the same data the `claude` CLI's `/usage` command shows.
- **Main class:** `ClaudeQuotaClient` — credential loading, token refresh, the HTTP call, and normalization.
- **Opt-in only:** unlike every other file behind the Claude Code tab, this one makes a network request. It only runs when `simpleCodingInsights.claude.showUsageLimits` is on; `summaryView.ts` checks the setting before constructing a request, so the client's code never runs otherwise.

## How it works

### Credentials
Claude Code stores an OAuth token pair at `<dataDir>/.credentials.json` (the same `dataDir` resolved by `ClaudeUsageReader.getDataDir()` in `claudeUsage.ts`, so the `claude.dataPath` setting and `CLAUDE_CONFIG_DIR` apply here too). This file is read directly — nothing is copied out of it except the bearer token attached to one outgoing request per fetch.

If the access token is expired (or about to be, within 60s), it is refreshed via Anthropic's OAuth token endpoint and the refreshed pair is written back to the same file, mirroring what Claude Code itself does. A refresh failure, or no credentials file at all, is reported as `signed-out` — not an error — since that is the expected state for anyone not using Claude Code's subscription login.

### The request
`GET https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>` and the `anthropic-beta: oauth-2025-04-20` header. Node's built-in `fetch` is tried first; if Anthropic's edge rejects the TLS handshake (`403 "Request not allowed"`, a known fingerprinting quirk) or `fetch` throws, the request is retried once via the system `curl` binary, which is present on every supported OS. A `429` starts a 60-second cooldown remembered on the `ClaudeQuotaClient` instance (which lives for the dashboard's lifetime) so a mashed Refresh button cannot spam Anthropic.

### Normalization
The endpoint has shipped two generations of this data: a `limits[]` array (current, `kind`/`percent`/`resets_at`/`scope`) and, before that, flat fields (`five_hour`, `seven_day`, `seven_day_opus`, `seven_day_sonnet`). `normalizeClaudeQuotaWindows` prefers `limits[]` when present and falls back to the flat fields otherwise, producing an ordered `ClaudeQuotaWindow[]`: the 5-hour `session` window, the all-models `weekly_all` window, then any per-model `weekly_scoped` caps, in that order.

## Notes
- `fetchSummary` never throws. Every failure path — no credentials, an expired refresh, a non-200 response, a network error — resolves to a `ClaudeQuotaSummary` with a `status` the UI renders directly (`signed-out`, `rate-limited`, `error`, or `ok`).
- No message content, file content, or prompt text is ever read or sent. The only outbound data is the existing bearer token.
- This endpoint and its shape are Anthropic's internal API, not a documented public contract, and can change without notice — the same caveat `claudeUsage.ts.md` makes about the local transcript format.
