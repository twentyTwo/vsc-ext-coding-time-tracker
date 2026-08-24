import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import {
    BranchUsage,
    ClaudeUsageSummary,
    DayUsage,
    FileRecords,
    ModelUsage,
    ProjectUsage,
    SessionUsage,
    ToolUsage,
    UsageRecord,
    UsageScope
} from './claudeTypes';

/**
 * Reads Claude Code's local session transcripts and aggregates token usage.
 *
 * Claude Code writes one JSONL file per session under
 * `<config>/projects/<encoded-cwd>/<session-id>.jsonl`, plus subagent transcripts
 * under `<session-id>/subagents/agent-*.jsonl`. Every assistant turn carries a
 * `message.usage` block; nothing else in the transcript is read.
 *
 * This class never touches the webview — it returns a plain summary object.
 */

/** Per-million-token rates. Cache rates are derived; see `costOf`. */
interface ModelRate {
    input: number;
    output: number;
}

/**
 * Longest-prefix-wins price table, USD per million tokens.
 * Snapshot — rates change, so the UI always labels cost as an estimate.
 */
const MODEL_RATES: { prefix: string; rate: ModelRate }[] = [
    { prefix: 'claude-fable-5', rate: { input: 10, output: 50 } },
    { prefix: 'claude-mythos', rate: { input: 10, output: 50 } },
    { prefix: 'claude-opus', rate: { input: 5, output: 25 } },
    { prefix: 'claude-sonnet', rate: { input: 3, output: 15 } },
    { prefix: 'claude-haiku', rate: { input: 1, output: 5 } }
];

/** Applied to Opus-tier models when the turn ran in fast mode. */
const FAST_RATE: ModelRate = { input: 10, output: 50 };

/** Used when a model matches nothing in the table, so cost is never silently zero. */
const FALLBACK_RATE: ModelRate = { input: 3, output: 15 };

/** Cache-write and cache-read rates are fixed multiples of the input rate. */
const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_WRITE_1H_MULTIPLIER = 2;
const CACHE_READ_MULTIPLIER = 0.1;

/** Bump when `UsageRecord` changes shape so stale caches are discarded. */
const CACHE_VERSION = 1;
const CACHE_FILE = 'claude-usage-cache.json';

const MAX_SESSION_ROWS = 25;

interface CacheEntry extends FileRecords {
    size: number;
    mtimeMs: number;
}

interface CacheFile {
    version: number;
    files: { [absPath: string]: CacheEntry };
}

interface DiscoveredFile {
    filePath: string;
    isSubagent: boolean;
    /** Decoded from the directory name; only used if the transcript has no `cwd`. */
    fallbackProject: string;
}

export class ClaudeUsageReader {
    private context: vscode.ExtensionContext;
    private cache: CacheFile = { version: CACHE_VERSION, files: {} };
    private cacheLoaded = false;
    /** Serializes overlapping refreshes so two clicks don't parse everything twice. */
    private inFlight: Promise<ClaudeUsageSummary> | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async getSummary(scope: UsageScope = 'all'): Promise<ClaudeUsageSummary> {
        if (this.inFlight) {
            // A scan is already running; wait for it, then re-aggregate for this scope.
            await this.inFlight.catch(() => undefined);
        }
        const run = this.buildSummary(scope);
        this.inFlight = run;
        try {
            return await run;
        } finally {
            if (this.inFlight === run) {
                this.inFlight = null;
            }
        }
    }

    /** Discards the on-disk cache so the next read re-parses everything. */
    async clearCache(): Promise<void> {
        this.cache = { version: CACHE_VERSION, files: {} };
        this.cacheLoaded = true;
        try {
            fs.unlinkSync(this.cacheFilePath());
        } catch (error) {
            // Nothing cached yet — nothing to clear.
        }
    }

    // --- data directory -----------------------------------------------------

    /**
     * Explicit setting wins, then Claude Code's own env var, then the default
     * location. Returned whether or not it exists so the empty state can name it.
     */
    getDataDir(): string {
        const configured = vscode.workspace
            .getConfiguration('simpleCodingInsights')
            .get<string>('claude.dataPath', '');
        if (configured && configured.trim().length > 0) {
            return path.resolve(this.expandHome(configured.trim()));
        }
        const fromEnv = process.env.CLAUDE_CONFIG_DIR;
        if (fromEnv && fromEnv.trim().length > 0) {
            return path.resolve(this.expandHome(fromEnv.trim()));
        }
        return path.join(os.homedir(), '.claude');
    }

    /**
     * Gaps between assistant turns longer than this are treated as the user
     * being away, not engaged — they contribute nothing to `activeMs` rather
     * than being counted or capped.
     */
    private getIdleGapMs(): number {
        const minutes = vscode.workspace
            .getConfiguration('simpleCodingInsights')
            .get<number>('claude.idleGapMinutes', 10);
        return Math.max(1, minutes) * 60000;
    }

    private expandHome(target: string): string {
        if (target === '~') {
            return os.homedir();
        }
        if (target.indexOf('~/') === 0 || target.indexOf('~\\') === 0) {
            return path.join(os.homedir(), target.slice(2));
        }
        return target;
    }

    // --- scanning -----------------------------------------------------------

    private discoverFiles(projectsDir: string, warnings: string[]): DiscoveredFile[] {
        const found: DiscoveredFile[] = [];
        let projectDirs: fs.Dirent[];
        try {
            projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true });
        } catch (error) {
            warnings.push('Could not read ' + projectsDir);
            return found;
        }

        for (const projectDir of projectDirs) {
            if (!projectDir.isDirectory()) {
                continue;
            }
            const dirPath = path.join(projectsDir, projectDir.name);
            const fallbackProject = this.decodeProjectDir(projectDir.name);
            let entries: fs.Dirent[];
            try {
                entries = fs.readdirSync(dirPath, { withFileTypes: true });
            } catch (error) {
                warnings.push('Could not read ' + dirPath);
                continue;
            }

            for (const entry of entries) {
                if (entry.isFile() && entry.name.slice(-6) === '.jsonl') {
                    found.push({
                        filePath: path.join(dirPath, entry.name),
                        isSubagent: false,
                        fallbackProject
                    });
                } else if (entry.isDirectory()) {
                    // <session-id>/subagents/agent-*.jsonl
                    const subagentDir = path.join(dirPath, entry.name, 'subagents');
                    let subFiles: string[];
                    try {
                        subFiles = fs.readdirSync(subagentDir);
                    } catch (error) {
                        continue; // No subagents for this session.
                    }
                    for (const subFile of subFiles) {
                        if (subFile.slice(-6) === '.jsonl') {
                            found.push({
                                filePath: path.join(subagentDir, subFile),
                                isSubagent: true,
                                fallbackProject
                            });
                        }
                    }
                }
            }
        }
        return found;
    }

    /**
     * Claude Code encodes a cwd by replacing separators with dashes, which is
     * lossy for paths that already contain dashes. This is only a fallback — the
     * authoritative project path is the `cwd` field inside the transcript.
     */
    private decodeProjectDir(dirName: string): string {
        return dirName.replace(/-/g, path.sep);
    }

    // --- parsing ------------------------------------------------------------

    private parseFile(file: DiscoveredFile, warnings: string[]): Promise<FileRecords> {
        return new Promise<FileRecords>((resolve) => {
            const records: UsageRecord[] = [];
            let project = '';
            let malformed = 0;
            let settled = false;

            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                if (malformed > 0) {
                    warnings.push(malformed + ' unreadable line(s) in ' + path.basename(file.filePath));
                }
                resolve({
                    project: project || file.fallbackProject,
                    isSubagent: file.isSubagent,
                    records
                });
            };

            let stream: fs.ReadStream;
            try {
                stream = fs.createReadStream(file.filePath, { encoding: 'utf8' });
            } catch (error) {
                warnings.push('Could not open ' + path.basename(file.filePath));
                finish();
                return;
            }

            const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

            rl.on('line', (line: string) => {
                // Cheap pre-filter: every assistant line contains this token, and
                // parsing every user turn's JSON is by far the dominant cost.
                if (line.indexOf('"assistant"') === -1) {
                    return;
                }
                let entry: any;
                try {
                    entry = JSON.parse(line);
                } catch (error) {
                    malformed++;
                    return;
                }
                if (!entry || entry.type !== 'assistant') {
                    return;
                }
                if (!project && typeof entry.cwd === 'string' && entry.cwd.length > 0) {
                    project = entry.cwd;
                }
                const record = this.toRecord(entry);
                if (record) {
                    records.push(record);
                }
            });

            rl.on('error', () => {
                warnings.push('Could not read ' + path.basename(file.filePath));
                finish();
            });
            stream.on('error', () => {
                warnings.push('Could not read ' + path.basename(file.filePath));
                rl.close();
                finish();
            });
            rl.on('close', finish);
        });
    }

    private toRecord(entry: any): UsageRecord | null {
        const message = entry.message;
        if (!message || !message.usage) {
            return null;
        }
        const usage = message.usage;
        const id = typeof message.id === 'string' && message.id.length > 0
            ? message.id
            : (typeof entry.uuid === 'string' ? entry.uuid : '');
        if (!id) {
            return null; // Without a stable id it cannot be deduped safely.
        }

        let cacheWrite5m = 0;
        let cacheWrite1h = 0;
        const creation = usage.cache_creation;
        if (creation) {
            cacheWrite5m = this.num(creation.ephemeral_5m_input_tokens);
            cacheWrite1h = this.num(creation.ephemeral_1h_input_tokens);
        }
        if (cacheWrite5m + cacheWrite1h === 0) {
            // Older transcripts only carry the flat total; bill it at the 5m rate.
            cacheWrite5m = this.num(usage.cache_creation_input_tokens);
        }

        const serverTools = usage.server_tool_use || {};
        const tools: string[] = [];
        if (Array.isArray(message.content)) {
            for (const block of message.content) {
                if (block && block.type === 'tool_use' && typeof block.name === 'string') {
                    tools.push(block.name);
                }
            }
        }

        return {
            id: id,
            ts: typeof entry.timestamp === 'string' ? entry.timestamp : '',
            model: typeof message.model === 'string' ? message.model : 'unknown',
            input: this.num(usage.input_tokens),
            output: this.num(usage.output_tokens),
            cacheWrite5m: cacheWrite5m,
            cacheWrite1h: cacheWrite1h,
            cacheRead: this.num(usage.cache_read_input_tokens),
            webSearch: this.num(serverTools.web_search_requests),
            webFetch: this.num(serverTools.web_fetch_requests),
            fast: usage.speed === 'fast',
            tools: tools,
            session: typeof entry.sessionId === 'string' ? entry.sessionId : 'unknown',
            branch: typeof entry.gitBranch === 'string' && entry.gitBranch.length > 0
                ? entry.gitBranch
                : 'unknown'
        };
    }

    private num(value: any): number {
        return typeof value === 'number' && isFinite(value) && value > 0 ? value : 0;
    }

    // --- cache --------------------------------------------------------------

    private cacheFilePath(): string {
        return path.join(this.context.globalStorageUri.fsPath, CACHE_FILE);
    }

    private loadCache(): void {
        if (this.cacheLoaded) {
            return;
        }
        this.cacheLoaded = true;
        try {
            const raw = fs.readFileSync(this.cacheFilePath(), 'utf8');
            const parsed = JSON.parse(raw) as CacheFile;
            if (parsed && parsed.version === CACHE_VERSION && parsed.files) {
                this.cache = parsed;
            }
        } catch (error) {
            // No usable cache — everything gets parsed fresh.
        }
    }

    private saveCache(): void {
        try {
            fs.mkdirSync(this.context.globalStorageUri.fsPath, { recursive: true });
            fs.writeFileSync(this.cacheFilePath(), JSON.stringify(this.cache), 'utf8');
        } catch (error) {
            // A failed cache write only costs time on the next read.
        }
    }

    /** Returns records for every discovered file, parsing only what changed. */
    private async collect(files: DiscoveredFile[], warnings: string[]): Promise<CacheEntry[]> {
        this.loadCache();
        const next: { [absPath: string]: CacheEntry } = {};
        const result: CacheEntry[] = [];

        for (const file of files) {
            let stat: fs.Stats;
            try {
                stat = fs.statSync(file.filePath);
            } catch (error) {
                continue; // Deleted between listing and reading.
            }

            const cached = this.cache.files[file.filePath];
            if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
                next[file.filePath] = cached;
                result.push(cached);
                continue;
            }

            const parsed = await this.parseFile(file, warnings);
            const entry: CacheEntry = {
                size: stat.size,
                mtimeMs: stat.mtimeMs,
                project: parsed.project,
                isSubagent: parsed.isSubagent,
                records: parsed.records
            };
            next[file.filePath] = entry;
            result.push(entry);
        }

        // Entries for files that no longer exist are dropped by rebuilding the map.
        this.cache = { version: CACHE_VERSION, files: next };
        this.saveCache();
        return result;
    }

    // --- pricing ------------------------------------------------------------

    private rateFor(model: string, fast: boolean): { rate: ModelRate; priced: boolean } {
        let best: ModelRate | null = null;
        let bestLength = -1;
        for (const candidate of MODEL_RATES) {
            if (model.indexOf(candidate.prefix) === 0 && candidate.prefix.length > bestLength) {
                best = candidate.rate;
                bestLength = candidate.prefix.length;
            }
        }
        if (!best) {
            return { rate: FALLBACK_RATE, priced: false };
        }
        if (fast && model.indexOf('claude-opus') === 0) {
            return { rate: FAST_RATE, priced: true };
        }
        return { rate: best, priced: true };
    }

    private costOf(record: UsageRecord, rate: ModelRate): number {
        const perToken = rate.input / 1000000;
        return (
            record.input * perToken +
            (record.output * rate.output) / 1000000 +
            record.cacheWrite5m * perToken * CACHE_WRITE_5M_MULTIPLIER +
            record.cacheWrite1h * perToken * CACHE_WRITE_1H_MULTIPLIER +
            record.cacheRead * perToken * CACHE_READ_MULTIPLIER
        );
    }

    // --- aggregation --------------------------------------------------------

    private normalizePath(target: string): string {
        const resolved = path.resolve(target);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }

    private workspacePaths(): string[] {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return [];
        }
        return folders.map((folder) => this.normalizePath(folder.uri.fsPath));
    }

    private inWorkspace(project: string, workspaces: string[]): boolean {
        if (workspaces.length === 0) {
            return false;
        }
        const normalized = this.normalizePath(project);
        for (const workspace of workspaces) {
            if (normalized === workspace || normalized.indexOf(workspace + path.sep) === 0) {
                return true;
            }
        }
        return false;
    }

    /** Local `YYYY-MM-DD`, matching the time-tracking date keys in database.ts. */
    private localDateKey(iso: string): string | null {
        if (!iso) {
            return null;
        }
        const date = new Date(iso);
        if (isNaN(date.getTime())) {
            return null;
        }
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
    }

    private emptySummary(scope: UsageScope, dataDir: string, available: boolean): ClaudeUsageSummary {
        return {
            source: 'local',
            available: available,
            dataDir: dataDir,
            scope: scope,
            hasWorkspace: this.workspacePaths().length > 0,
            unknownModels: [],
            warnings: [],
            totals: {
                input: 0, output: 0, cacheWrite: 0, cacheRead: 0,
                tokens: 0, costUsd: 0, sessions: 0, messages: 0
            },
            byModel: [], byProject: [], byBranch: [], byDay: [], byTool: [], sessions: []
        };
    }

    private async buildSummary(scope: UsageScope): Promise<ClaudeUsageSummary> {
        const dataDir = this.getDataDir();
        const projectsDir = path.join(dataDir, 'projects');
        if (!fs.existsSync(projectsDir)) {
            return this.emptySummary(scope, dataDir, false);
        }

        const warnings: string[] = [];
        const files = this.discoverFiles(projectsDir, warnings);
        const collected = await this.collect(files, warnings);

        const summary = this.emptySummary(scope, dataDir, true);
        summary.warnings = warnings;

        const workspaces = this.workspacePaths();
        const seen: { [id: string]: boolean } = {};
        const models: { [model: string]: ModelUsage } = {};
        const projects: { [project: string]: ProjectUsage } = {};
        const projectSessions: { [project: string]: { [session: string]: boolean } } = {};
        const branches: { [branch: string]: BranchUsage } = {};
        const days: { [date: string]: DayUsage } = {};
        const tools: { [name: string]: number } = {};
        const sessions: { [id: string]: SessionUsage } = {};
        const sessionTimestamps: { [id: string]: number[] } = {};
        const unknown: { [model: string]: boolean } = {};
        let webSearch = 0;
        let webFetch = 0;

        for (const entry of collected) {
            const isWorkspaceProject = this.inWorkspace(entry.project, workspaces);
            if (scope === 'workspace' && !isWorkspaceProject) {
                continue;
            }

            for (const record of entry.records) {
                // Resumed and forked sessions replay earlier turns into new files,
                // so the same message id can appear in several transcripts.
                if (seen[record.id]) {
                    continue;
                }
                seen[record.id] = true;

                const priceInfo = this.rateFor(record.model, record.fast);
                const cost = this.costOf(record, priceInfo.rate);
                const cacheWrite = record.cacheWrite5m + record.cacheWrite1h;
                const tokens = record.input + record.output + cacheWrite + record.cacheRead;
                if (!priceInfo.priced) {
                    unknown[record.model] = true;
                }

                summary.totals.input += record.input;
                summary.totals.output += record.output;
                summary.totals.cacheWrite += cacheWrite;
                summary.totals.cacheRead += record.cacheRead;
                summary.totals.costUsd += cost;
                summary.totals.messages++;
                webSearch += record.webSearch;
                webFetch += record.webFetch;

                const model = models[record.model] || (models[record.model] = {
                    model: record.model, tokens: 0, costUsd: 0, messages: 0, priced: priceInfo.priced
                });
                model.tokens += tokens;
                model.costUsd += cost;
                model.messages++;

                const project = projects[entry.project] || (projects[entry.project] = {
                    project: entry.project,
                    name: path.basename(entry.project) || entry.project,
                    tokens: 0,
                    costUsd: 0,
                    sessions: 0,
                    isCurrentWorkspace: isWorkspaceProject
                });
                project.tokens += tokens;
                project.costUsd += cost;
                const sessionsForProject = projectSessions[entry.project] || (projectSessions[entry.project] = {});
                if (!sessionsForProject[record.session]) {
                    sessionsForProject[record.session] = true;
                    project.sessions++;
                }

                const branch = branches[record.branch] || (branches[record.branch] = {
                    branch: record.branch, tokens: 0
                });
                branch.tokens += tokens;

                const dateKey = this.localDateKey(record.ts);
                if (dateKey) {
                    const day = days[dateKey] || (days[dateKey] = {
                        date: dateKey, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, costUsd: 0
                    });
                    day.input += record.input;
                    day.output += record.output;
                    day.cacheWrite += cacheWrite;
                    day.cacheRead += record.cacheRead;
                    day.costUsd += cost;
                }

                for (const tool of record.tools) {
                    tools[tool] = (tools[tool] || 0) + 1;
                }

                // Subagent spend rolls up into its parent session; the row is only
                // flagged as a subagent if nothing else contributed to it.
                const session = sessions[record.session] || (sessions[record.session] = {
                    id: record.session,
                    project: entry.project,
                    name: path.basename(entry.project) || entry.project,
                    branch: record.branch,
                    models: [],
                    tokens: 0,
                    costUsd: 0,
                    start: record.ts,
                    end: record.ts,
                    messages: 0,
                    isSubagent: entry.isSubagent,
                    activeMs: 0
                });
                session.tokens += tokens;
                session.costUsd += cost;
                session.messages++;
                session.isSubagent = session.isSubagent && entry.isSubagent;
                if (session.models.indexOf(record.model) === -1) {
                    session.models.push(record.model);
                }
                if (record.ts && (!session.start || record.ts < session.start)) {
                    session.start = record.ts;
                }
                if (record.ts && (!session.end || record.ts > session.end)) {
                    session.end = record.ts;
                }
                if (record.ts) {
                    const ms = Date.parse(record.ts);
                    if (!isNaN(ms)) {
                        (sessionTimestamps[record.session] || (sessionTimestamps[record.session] = [])).push(ms);
                    }
                }
            }
        }

        // Active time is the sum of gaps between consecutive turns that stay
        // under the idle threshold, so a session left open for hours between
        // messages doesn't read as hours of engaged work.
        const idleGapMs = this.getIdleGapMs();
        for (const id of Object.keys(sessions)) {
            const timestamps = (sessionTimestamps[id] || []).slice().sort((a, b) => a - b);
            let activeMs = 0;
            for (let i = 1; i < timestamps.length; i++) {
                const gap = timestamps[i] - timestamps[i - 1];
                if (gap > 0 && gap <= idleGapMs) {
                    activeMs += gap;
                }
            }
            sessions[id].activeMs = activeMs;
        }

        summary.totals.tokens =
            summary.totals.input +
            summary.totals.output +
            summary.totals.cacheWrite +
            summary.totals.cacheRead;

        summary.byModel = this.mapValues(models).sort((a, b) => b.tokens - a.tokens);
        summary.byProject = this.mapValues(projects).sort((a, b) => b.tokens - a.tokens);
        summary.byBranch = this.mapValues(branches).sort((a, b) => b.tokens - a.tokens);
        summary.byDay = this.mapValues(days).sort((a, b) => (a.date < b.date ? -1 : 1));
        summary.sessions = this.mapValues(sessions)
            .sort((a, b) => (a.end < b.end ? 1 : -1))
            .slice(0, MAX_SESSION_ROWS);
        summary.totals.sessions = Object.keys(sessions).length;
        summary.unknownModels = Object.keys(unknown).sort();

        const toolRows: ToolUsage[] = [];
        for (const name of Object.keys(tools)) {
            toolRows.push({ name: name, count: tools[name] });
        }
        if (webSearch > 0) {
            toolRows.push({ name: 'web_search (server)', count: webSearch });
        }
        if (webFetch > 0) {
            toolRows.push({ name: 'web_fetch (server)', count: webFetch });
        }
        summary.byTool = toolRows.sort((a, b) => b.count - a.count);

        return summary;
    }

    private mapValues<T>(map: { [key: string]: T }): T[] {
        const values: T[] = [];
        for (const key of Object.keys(map)) {
            values.push(map[key]);
        }
        return values;
    }
}
