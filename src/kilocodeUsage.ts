import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
    KilocodeDayUsage,
    KilocodeProtocolUsage,
    KilocodeTaskUsage,
    KilocodeToolUsage,
    KilocodeUsageRecord,
    KilocodeUsageSummary,
    KilocodeUsageTotals
} from './kilocodeTypes';

/**
 * Reads Kilo Code's local task files and aggregates token usage.
 *
 * Kilo Code (the `kilocode.kilo-code` VS Code extension) writes one folder per
 * task under `<globalStorage>/kilocode.kilo-code/tasks/<task-id>/`. Each folder
 * has three files; only `ui_messages.json` is ever read here:
 *   - `ui_messages.json`  — UI-facing message log. Per-request usage lives in
 *     `say: "api_req_started"` entries; tool-call names live in `ask: "tool"`
 *     entries. This is the only file this reader opens.
 *   - `task_metadata.json` — file paths touched by the task. Never read.
 *   - `api_conversation_history.json` — the full prompt/response transcript,
 *     often over 1 MB. Never read.
 *
 * Kilo Code's storage root is a sibling of this extension's own
 * `globalStorageUri`, so it can be located without guessing a platform-specific
 * VS Code user-data path — whatever profile/install this extension runs under,
 * Kilo Code's data (if present) sits right next to ours.
 *
 * Unlike Claude Code's transcripts, Kilo Code's task files carry no per-request
 * model id and no reliable workspace/project attribution, so this reader has no
 * `byModel`/`byProject` equivalent and no workspace-scope filter — see
 * `kilocodeTypes.ts` for what's available instead.
 *
 * This class never touches the webview — it returns a plain summary object.
 */

const CACHE_VERSION = 1;
const CACHE_FILE = 'kilocode-usage-cache.json';
const MAX_TASK_ROWS = 25;
const MAX_WARNINGS = 50;

interface CacheEntry {
    size: number;
    mtimeMs: number;
    records: KilocodeUsageRecord[];
    tools: { task: string; name: string }[];
}

interface CacheFile {
    version: number;
    files: { [absPath: string]: CacheEntry };
}

interface DiscoveredTask {
    taskId: string;
    filePath: string;
}

export class KilocodeUsageReader {
    private context: vscode.ExtensionContext;
    private cache: CacheFile = { version: CACHE_VERSION, files: {} };
    private cacheLoaded = false;
    /** Serializes overlapping refreshes so two clicks don't parse everything twice. */
    private inFlight: Promise<KilocodeUsageSummary> | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async getSummary(): Promise<KilocodeUsageSummary> {
        if (this.inFlight) {
            await this.inFlight.catch(() => undefined);
        }
        const run = this.buildSummary();
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
     * Explicit setting wins, otherwise the sibling of this extension's own
     * globalStorage directory. Returned whether or not it exists so the empty
     * state can name it.
     */
    getDataDir(): string {
        const configured = vscode.workspace
            .getConfiguration('simpleCodingTimeTracker')
            .get<string>('kilocode.dataPath', '');
        if (configured && configured.trim().length > 0) {
            return path.resolve(configured.trim());
        }
        return path.join(this.context.globalStorageUri.fsPath, '..', 'kilocode.kilo-code');
    }

    // --- scanning -----------------------------------------------------------

    private discoverTasks(tasksDir: string, warnings: string[]): DiscoveredTask[] {
        const found: DiscoveredTask[] = [];
        let taskDirs: fs.Dirent[];
        try {
            taskDirs = fs.readdirSync(tasksDir, { withFileTypes: true });
        } catch (error) {
            warnings.push('Could not read ' + tasksDir);
            return found;
        }

        for (const taskDir of taskDirs) {
            if (!taskDir.isDirectory()) {
                continue;
            }
            const filePath = path.join(tasksDir, taskDir.name, 'ui_messages.json');
            if (fs.existsSync(filePath)) {
                found.push({ taskId: taskDir.name, filePath });
            }
        }
        return found;
    }

    // --- parsing --------------------------------------------------------

    private parseTask(task: DiscoveredTask, warnings: string[]): { records: KilocodeUsageRecord[]; tools: { task: string; name: string }[] } {
        const records: KilocodeUsageRecord[] = [];
        const tools: { task: string; name: string }[] = [];

        let raw: string;
        try {
            raw = fs.readFileSync(task.filePath, 'utf8');
        } catch (error) {
            warnings.push('Could not open ' + task.taskId);
            return { records, tools };
        }

        let messages: any[];
        try {
            messages = JSON.parse(raw);
        } catch (error) {
            warnings.push('Could not parse ' + task.taskId);
            return { records, tools };
        }
        if (!Array.isArray(messages)) {
            return { records, tools };
        }

        for (const message of messages) {
            if (!message || typeof message.text !== 'string') {
                continue;
            }
            if (message.type === 'say' && message.say === 'api_req_started') {
                const record = this.toRecord(message, task.taskId);
                if (record) {
                    records.push(record);
                }
            } else if (message.type === 'ask' && message.ask === 'tool') {
                const name = this.toToolName(message.text);
                if (name) {
                    tools.push({ task: task.taskId, name });
                }
            }
        }

        return { records, tools };
    }

    private toRecord(message: any, taskId: string): KilocodeUsageRecord | null {
        let parsed: any;
        try {
            parsed = JSON.parse(message.text);
        } catch (error) {
            return null;
        }
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        return {
            ts: this.num(message.ts),
            apiProtocol: typeof parsed.apiProtocol === 'string' && parsed.apiProtocol.length > 0
                ? parsed.apiProtocol
                : 'unknown',
            tokensIn: this.num(parsed.tokensIn),
            tokensOut: this.num(parsed.tokensOut),
            cacheWrites: this.num(parsed.cacheWrites),
            cacheReads: this.num(parsed.cacheReads),
            cost: this.num(parsed.cost),
            usageMissing: parsed.usageMissing === true,
            task: taskId
        };
    }

    private toToolName(text: string): string | null {
        try {
            const parsed = JSON.parse(text);
            return parsed && typeof parsed.tool === 'string' && parsed.tool.length > 0 ? parsed.tool : null;
        } catch (error) {
            return null;
        }
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

    /** Returns parsed records/tools for every discovered task, parsing only what changed. */
    private collect(tasks: DiscoveredTask[], warnings: string[]): CacheEntry[] {
        this.loadCache();
        const next: { [absPath: string]: CacheEntry } = {};
        const result: CacheEntry[] = [];

        for (const task of tasks) {
            let stat: fs.Stats;
            try {
                stat = fs.statSync(task.filePath);
            } catch (error) {
                continue; // Deleted between listing and reading.
            }

            const cached = this.cache.files[task.filePath];
            if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
                next[task.filePath] = cached;
                result.push(cached);
                continue;
            }

            const parsed = this.parseTask(task, warnings);
            const entry: CacheEntry = {
                size: stat.size,
                mtimeMs: stat.mtimeMs,
                records: parsed.records,
                tools: parsed.tools
            };
            next[task.filePath] = entry;
            result.push(entry);
        }

        // Entries for tasks that no longer exist are dropped by rebuilding the map.
        this.cache = { version: CACHE_VERSION, files: next };
        this.saveCache();
        return result;
    }

    // --- aggregation ----------------------------------------------------

    /** Local `YYYY-MM-DD`, matching the time-tracking date keys in database.ts. */
    private localDateKey(epochMs: number): string | null {
        if (!epochMs) {
            return null;
        }
        const date = new Date(epochMs);
        if (isNaN(date.getTime())) {
            return null;
        }
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
    }

    private emptySummary(dataDir: string, available: boolean): KilocodeUsageSummary {
        return {
            source: 'local',
            available: available,
            dataDir: dataDir,
            warnings: [],
            totals: {
                tokensIn: 0, tokensOut: 0, cacheWrites: 0, cacheReads: 0,
                tokens: 0, costUsd: 0, tasks: 0, requests: 0
            },
            byProtocol: [], byDay: [], byTool: [], tasks: []
        };
    }

    private async buildSummary(): Promise<KilocodeUsageSummary> {
        const dataDir = this.getDataDir();
        const tasksDir = path.join(dataDir, 'tasks');
        if (!fs.existsSync(tasksDir)) {
            return this.emptySummary(dataDir, false);
        }

        const warnings: string[] = [];
        const discovered = this.discoverTasks(tasksDir, warnings);
        const collected = this.collect(discovered, warnings);

        const summary = this.emptySummary(dataDir, true);

        const protocols: { [protocol: string]: KilocodeProtocolUsage } = {};
        const days: { [date: string]: KilocodeDayUsage } = {};
        const tools: { [name: string]: number } = {};
        const tasks: { [id: string]: KilocodeTaskUsage } = {};
        let missingUsage = 0;

        for (const entry of collected) {
            for (const record of entry.records) {
                const cacheTotal = record.cacheWrites + record.cacheReads;
                const tokens = record.tokensIn + record.tokensOut + cacheTotal;

                summary.totals.tokensIn += record.tokensIn;
                summary.totals.tokensOut += record.tokensOut;
                summary.totals.cacheWrites += record.cacheWrites;
                summary.totals.cacheReads += record.cacheReads;
                summary.totals.costUsd += record.cost;
                summary.totals.requests++;
                if (record.usageMissing) {
                    missingUsage++;
                }

                const protocol = protocols[record.apiProtocol] || (protocols[record.apiProtocol] = {
                    apiProtocol: record.apiProtocol, tokens: 0, costUsd: 0, requests: 0
                });
                protocol.tokens += tokens;
                protocol.costUsd += record.cost;
                protocol.requests++;

                const dateKey = this.localDateKey(record.ts);
                if (dateKey) {
                    const day = days[dateKey] || (days[dateKey] = {
                        date: dateKey, tokensIn: 0, tokensOut: 0, cacheWrites: 0, cacheReads: 0, costUsd: 0
                    });
                    day.tokensIn += record.tokensIn;
                    day.tokensOut += record.tokensOut;
                    day.cacheWrites += record.cacheWrites;
                    day.cacheReads += record.cacheReads;
                    day.costUsd += record.cost;
                }

                const task = tasks[record.task] || (tasks[record.task] = {
                    id: record.task,
                    tokens: 0,
                    costUsd: 0,
                    requests: 0,
                    tools: [],
                    start: record.ts,
                    end: record.ts
                });
                task.tokens += tokens;
                task.costUsd += record.cost;
                task.requests++;
                if (record.ts && (!task.start || record.ts < task.start)) {
                    task.start = record.ts;
                }
                if (record.ts && (!task.end || record.ts > task.end)) {
                    task.end = record.ts;
                }
            }

            for (const toolCall of entry.tools) {
                tools[toolCall.name] = (tools[toolCall.name] || 0) + 1;
                const task = tasks[toolCall.task];
                if (task && task.tools.indexOf(toolCall.name) === -1) {
                    task.tools.push(toolCall.name);
                }
            }
        }

        summary.totals.tokens =
            summary.totals.tokensIn +
            summary.totals.tokensOut +
            summary.totals.cacheWrites +
            summary.totals.cacheReads;
        summary.totals.tasks = Object.keys(tasks).length;

        if (missingUsage > 0) {
            warnings.push(missingUsage + ' request(s) had no usage data recorded by Kilo Code.');
        }
        summary.warnings = warnings.slice(0, MAX_WARNINGS);

        summary.byProtocol = this.mapValues(protocols).sort((a, b) => b.tokens - a.tokens);
        summary.byDay = this.mapValues(days).sort((a, b) => (a.date < b.date ? -1 : 1));
        summary.tasks = this.mapValues(tasks)
            .sort((a, b) => b.end - a.end)
            .slice(0, MAX_TASK_ROWS);

        const toolRows: KilocodeToolUsage[] = [];
        for (const name of Object.keys(tools)) {
            toolRows.push({ name: name, count: tools[name] });
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
