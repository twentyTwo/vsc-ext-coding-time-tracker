import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeQuotaSummary, ClaudeQuotaWindow, ClaudeQuotaWindowKind } from './claudeTypes';

/**
 * Fetches real 5-hour / weekly rate-limit utilisation from Anthropic's OAuth
 * usage endpoint, reusing the credentials Claude Code itself stores on disk.
 * This is the same data the `claude` CLI's `/usage` command shows.
 *
 * Unlike `claudeUsage.ts`, this module does make a network request — to
 * `api.anthropic.com`, with the bearer token Claude Code already has, and
 * nothing else (no prompts, no file content). It only runs when the user has
 * explicitly opted in via `simpleCodingInsights.claude.showUsageLimits`.
 */

interface ClaudeCredentials {
    claudeAiOauth: {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
    };
}

// Subset of the fields actually used from https://api.anthropic.com/api/oauth/usage.
interface RawUsageLimit {
    utilization?: number;
    resets_at?: string | null;
}

interface RawLimitEntry {
    kind?: string;
    group?: string;
    percent?: number;
    resets_at?: string | null;
    scope?: { model?: { display_name?: string } | null; surface?: string | null } | null;
    is_active?: boolean;
}

interface RawUsageResponse {
    five_hour?: RawUsageLimit | null;
    seven_day?: RawUsageLimit | null;
    seven_day_opus?: RawUsageLimit | null;
    seven_day_sonnet?: RawUsageLimit | null;
    limits?: RawLimitEntry[] | null;
}

interface HttpResponse {
    status: number;
    body: string;
}

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';
const OAUTH_BETA_HEADER = 'oauth-2025-04-20';
const REQUEST_TIMEOUT_MS = 15000;
const RATE_LIMIT_COOLDOWN_MS = 60000;

/** Maps a `limits[]` entry's kind/group onto the three window kinds this UI shows. */
function kindOf(entry: RawLimitEntry): ClaudeQuotaWindowKind | null {
    const kind = entry.kind ?? '';
    if (kind === 'session') {
        return 'session';
    }
    if (kind === 'weekly_all') {
        return 'weekly_all';
    }
    if (kind === 'weekly_scoped') {
        return 'weekly_scoped';
    }
    if (entry.group === 'session') {
        return 'session';
    }
    if (entry.group === 'weekly') {
        return 'weekly_scoped';
    }
    return null;
}

function windowFromEntry(entry: RawLimitEntry): ClaudeQuotaWindow | null {
    const kind = kindOf(entry);
    if (!kind) {
        return null;
    }
    const pct = Number(entry.percent);
    return {
        kind,
        scopeLabel: kind === 'weekly_scoped'
            ? (entry.scope?.model?.display_name || entry.scope?.surface || undefined)
            : undefined,
        utilization: Number.isFinite(pct) ? pct : 0,
        resetsAt: entry.resets_at ?? '',
        isActive: entry.is_active === true
    };
}

function windowFromLegacy(
    limit: RawUsageLimit | null | undefined,
    kind: ClaudeQuotaWindowKind,
    scopeLabel?: string
): ClaudeQuotaWindow | null {
    // Null (not merely absent) is how a retired per-model field is reported;
    // treating that as 0 would render a permanent, wrong "Opus 0%".
    if (!limit) {
        return null;
    }
    const pct = Number(limit.utilization);
    return {
        kind,
        scopeLabel,
        utilization: Number.isFinite(pct) ? pct : 0,
        resetsAt: limit.resets_at ?? '',
        isActive: false
    };
}

const WINDOW_RANK: Record<ClaudeQuotaWindowKind, number> = { session: 0, weekly_all: 1, weekly_scoped: 2 };

/**
 * Normalizes the usage payload into an ordered list of windows (session, then
 * all-models weekly, then any per-model weekly caps).
 *
 * The endpoint has two generations of this data: a `limits[]` array (current)
 * and flat per-window fields (legacy, kept as a fallback when `limits` is
 * absent or empty). When `limits` is present it wins outright — both
 * generations are emitted at once today with the same figures, so merging
 * them would double-count.
 */
export function normalizeClaudeQuotaWindows(usage: RawUsageResponse | null): ClaudeQuotaWindow[] {
    if (!usage) {
        return [];
    }
    const entries = Array.isArray(usage.limits) ? usage.limits : null;
    if (entries && entries.length > 0) {
        const windows = entries
            .map(windowFromEntry)
            .filter((w): w is ClaudeQuotaWindow => w !== null);
        if (windows.length > 0) {
            return sortWindows(windows);
        }
    }
    const legacy = [
        windowFromLegacy(usage.five_hour, 'session'),
        windowFromLegacy(usage.seven_day, 'weekly_all'),
        windowFromLegacy(usage.seven_day_opus, 'weekly_scoped', 'Opus'),
        windowFromLegacy(usage.seven_day_sonnet, 'weekly_scoped', 'Sonnet')
    ].filter((w): w is ClaudeQuotaWindow => w !== null);
    return sortWindows(legacy);
}

function sortWindows(windows: ClaudeQuotaWindow[]): ClaudeQuotaWindow[] {
    return windows
        .map((w, i) => ({ w, i }))
        .sort((a, b) => WINDOW_RANK[a.w.kind] - WINDOW_RANK[b.w.kind] || a.i - b.i)
        .map((x) => x.w);
}

/** Run an HTTP request via Node's built-in fetch, with a hard timeout. */
async function requestViaFetch(
    url: string,
    opts: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<HttpResponse> {
    if (typeof fetch === 'undefined') {
        throw new Error('fetch unavailable in this VS Code version');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: opts.method || 'GET',
            headers: opts.headers,
            body: opts.body,
            signal: controller.signal
        });
        return { status: res.status, body: await res.text() };
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Run an HTTP request via the system `curl` binary. Fallback for the (rare)
 * case where Anthropic's edge rejects Node's TLS handshake but accepts curl's
 * — `curl`/`curl.exe` ship with every supported OS.
 */
function requestViaCurl(
    url: string,
    opts: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
        const args = ['-sS', '-w', '\n__CCQ_STATUS__%{http_code}', '--max-time', String(Math.ceil(REQUEST_TIMEOUT_MS / 1000))];
        if (opts.method && opts.method !== 'GET') {
            args.push('-X', opts.method);
        }
        for (const [key, value] of Object.entries(opts.headers || {})) {
            args.push('-H', `${key}: ${value}`);
        }
        if (opts.body !== undefined) {
            args.push('--data-binary', '@-');
        }
        args.push(url);

        const cmd = process.platform === 'win32' ? 'curl.exe' : 'curl';
        const child = spawn(cmd, args, { shell: false, windowsHide: true });
        let stdout = '';
        let stderr = '';
        let settled = false;
        child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8'); });
        child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf-8'); });
        child.on('error', (error) => {
            if (settled) { return; }
            settled = true;
            reject(error);
        });
        child.on('close', (code) => {
            if (settled) { return; }
            settled = true;
            if (code !== 0) {
                reject(new Error(`curl exit ${code}: ${stderr.trim().slice(0, 200)}`));
                return;
            }
            const match = stdout.match(/^([\s\S]*)\n__CCQ_STATUS__(\d{3})$/);
            if (!match) {
                reject(new Error('Could not parse curl output'));
                return;
            }
            resolve({ status: parseInt(match[2], 10), body: match[1] });
        });
        if (opts.body !== undefined) {
            child.stdin.end(opts.body);
        } else {
            child.stdin.end();
        }
    });
}

/**
 * One instance lives for the lifetime of the dashboard (see `summaryView.ts`),
 * so it can remember a 429 cooldown across refreshes — otherwise mashing the
 * Refresh button would just draw more 429s. `dataDir` is passed per call,
 * not fixed at construction, since the user can change
 * `simpleCodingInsights.claude.dataPath` at any time.
 */
export class ClaudeQuotaClient {
    private preferCurl = false;
    private rateLimitedUntil = 0;

    /** Fallback for when fetch fails outright or is rejected with the TLS-fingerprint 403. */
    private async request(
        url: string,
        opts: { method?: string; headers?: Record<string, string>; body?: string }
    ): Promise<HttpResponse> {
        if (!this.preferCurl) {
            try {
                const response = await requestViaFetch(url, opts);
                if (response.status === 403 && response.body.includes('Request not allowed')) {
                    this.preferCurl = true;
                } else {
                    return response;
                }
            } catch (error) {
                // Fall through to curl.
            }
        }
        return requestViaCurl(url, opts);
    }

    private loadCredentials(credentialsPath: string): ClaudeCredentials | null {
        try {
            const content = fs.readFileSync(credentialsPath, 'utf-8');
            const parsed = JSON.parse(content) as ClaudeCredentials;
            return parsed?.claudeAiOauth?.accessToken ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    private isExpired(credentials: ClaudeCredentials): boolean {
        return Date.now() >= credentials.claudeAiOauth.expiresAt - 60000;
    }

    private async refreshAccessToken(
        credentials: ClaudeCredentials,
        credentialsPath: string
    ): Promise<ClaudeCredentials> {
        const response = await this.request(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh_token: credentials.claudeAiOauth.refreshToken,
                grant_type: 'refresh_token'
            })
        });
        if (response.status !== 200) {
            throw new Error(`Token refresh failed: ${response.status}`);
        }
        const data = JSON.parse(response.body) as { access_token: string; expires_in: number };
        const updated: ClaudeCredentials = {
            claudeAiOauth: {
                ...credentials.claudeAiOauth,
                accessToken: data.access_token,
                expiresAt: Date.now() + data.expires_in * 1000
            }
        };
        try {
            // Claude Code reads and rewrites this same file; keeping it in sync
            // means the next `/usage` from the CLI does not have to refresh again.
            fs.writeFileSync(credentialsPath, JSON.stringify(updated), 'utf-8');
        } catch (error) {
            // A failed write only costs an extra refresh on the next fetch.
        }
        return updated;
    }

    private callUsageApi(accessToken: string): Promise<HttpResponse> {
        return this.request(USAGE_URL, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'anthropic-beta': OAUTH_BETA_HEADER,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Fetch current usage-limit windows for the Claude Code profile at `dataDir`.
     * Never throws — every failure mode maps to a `ClaudeQuotaSummary.status`
     * the UI can render directly.
     */
    async fetchSummary(dataDir: string): Promise<ClaudeQuotaSummary> {
        const fetchedAt = new Date().toISOString();
        if (Date.now() < this.rateLimitedUntil) {
            return { status: 'rate-limited', fetchedAt, windows: [] };
        }

        const credentialsPath = path.join(dataDir, '.credentials.json');
        try {
            let credentials = this.loadCredentials(credentialsPath);
            if (!credentials) {
                return { status: 'signed-out', fetchedAt, windows: [] };
            }
            if (this.isExpired(credentials)) {
                try {
                    credentials = await this.refreshAccessToken(credentials, credentialsPath);
                } catch (error) {
                    return { status: 'signed-out', fetchedAt, windows: [] };
                }
            }

            let response = await this.callUsageApi(credentials.claudeAiOauth.accessToken);

            if (response.status === 429) {
                this.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
                return { status: 'rate-limited', fetchedAt, windows: [] };
            }

            if (response.status === 401) {
                try {
                    credentials = await this.refreshAccessToken(credentials, credentialsPath);
                    response = await this.callUsageApi(credentials.claudeAiOauth.accessToken);
                } catch (error) {
                    return { status: 'signed-out', fetchedAt, windows: [] };
                }
            }

            if (response.status !== 200) {
                return {
                    status: 'error',
                    message: `Anthropic returned HTTP ${response.status}`,
                    fetchedAt,
                    windows: []
                };
            }

            const data = JSON.parse(response.body) as RawUsageResponse;
            return { status: 'ok', fetchedAt, windows: normalizeClaudeQuotaWindows(data) };
        } catch (error) {
            return {
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
                fetchedAt,
                windows: []
            };
        }
    }
}
