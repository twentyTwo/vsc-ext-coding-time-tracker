# Rebrand IDs to `simpleCodingInsights` (keep extension ID)

## Goal
Complete the "Simple Coding Time Tracker" → "Simple Coding Insights" rebrand at the **identifier level**: rename all command IDs and settings keys from `simpleCodingTimeTracker.*` to `simpleCodingInsights.*`, with a one-time settings migration so existing users keep their configuration. The display-name rebrand already shipped in commit `dc38b51`.

## Locked decisions
- **Keep `name: "simple-coding-time-tracker"`** in package.json — preserves marketplace ID (`noorashuvo.simple-coding-time-tracker`), auto-updates, and `globalState` tracked-time data. Do NOT change `name`, `publisher`, or repository URLs.
- **New prefix: `simpleCodingInsights.*`** (plural, matches displayName).
- **Legacy command IDs stay functional as hidden aliases** (consistent with the README's continuity promise). Palette-hidden via `"when": "false"` on their contributions; remove in a future release.
- **One-time settings migration shim** at activation, guarded by a `globalState` flag.
- Version bump `0.7.7` → `0.8.0`.

## Task list

### 1. package.json
- Rename all 14 settings keys: `simpleCodingTimeTracker.*` → `simpleCodingInsights.*` (configuration properties).
- Rename all 8 command IDs: `simpleCodingTimeTracker.*` → `simpleCodingInsights.*`.
- Update both `when` clauses: `config.simpleCodingTimeTracker.enableDevCommands` → `config.simpleCodingInsights.enableDevCommands`.
- Add 8 legacy command contributions with **old IDs**, same titles, `"when": "false"` (keeps keybindings working, hides from palette).
- Bump `version` to `0.8.0`. Leave `name`, `icon` path updates to task 5, everything else unchanged.

### 2. New file: `src/settingsMigration.ts`
- Export `migrateSettings(context: vscode.ExtensionContext): Promise<void>`.
- Map of old→new keys for all 14 settings (e.g. `simpleCodingTimeTracker.inactivityTimeout` → `simpleCodingInsights.inactivityTimeout`).
- Guard: run only once via `context.globalState` flag (`sciSettingsMigrated`).
- For each key: inspect configuration (`workspace.getConfiguration()` + `inspect()`); if the new key is unset (default) and the old key has a user- or workspace-scoped value, `update()` the new key at the same target. Then best-effort `update(oldKey, undefined, target)` to clean up.
- No-op silently if old keys absent.

### 3. `src/extension.ts`
- Call `await migrateSettings(context)` before constructing Database/TimeTracker in `activate()`.
- Rename all `registerCommand('simpleCodingTimeTracker.*')` → new prefix.
- Register the 8 **legacy command IDs** as aliases: same handlers, minimal wrappers (add a short comment noting they exist for keybinding compat and can be removed later).
- Update all `config.get('simpleCodingTimeTracker.*')` reads to the new prefix.

### 4. Rename settings-prefix reads in remaining sources
Files with `config.get('simpleCodingTimeTracker.…')` or `getConfiguration('simpleCodingTimeTracker')`:
- `src/statusBar.ts` (7 refs incl. `getConfiguration`)
- `src/healthNotifications.ts` (1)
- `src/notificationStatusBar.ts` (3)
- `src/settingsView.ts` (getConfiguration + update/reset calls — note the settings save/reset code updates `claude.showTab`, `claude.showNewFeatureBanner`, `enableDevCommands` via the config object, so changing the `getConfiguration` prefix covers them)
- `src/summaryView.ts` (getConfiguration refs)
- `src/claudeTab.ts` (1: `claude.dataPath`)
- `src/claudeUsage.ts` (2)
- `src/timeTracker.ts` (1)
- **Internal webview postMessage strings** (`simpleCodingTimeTracker.refreshStatusBar`, `simpleCodingTimeTracker.manualSave`, `simpleCodingTimeTracker.toggleNotifications` between webview HTML and message handlers): rename **both sides together** (emitter in webview script + handler in message switch) or they will silently break. These are internal-only, not contributed commands.

### 5. Misc brand strings
- `git mv icon-sctt.png icon-sci.png` + update `"icon"` in package.json.
- `src/settingsView.ts:21`: webview title `'scttSettings'` → `'sciSettings'`.

### 6. Docs
- `README.md`: replace remaining `SCTT:` command titles with `SCI:` (line 140 is also outdated vs current titles), update all `simpleCodingTimeTracker.*` setting/command references, extend the "Renamed" callout (line 15) to note command/settings-key migration and that old keybindings keep working; add changelog entry for 0.8.0.
- `TECHNICAL.md`, `CONTRIBUTING.md`: update identifier references.
- `docs/index.html`, `docs/documentation.html`, `docs/js/main.js`, `docs/README.md`: update setting/command references.
- `.github/copilot-instructions.md:47`: `SCTT: Generate Test Data (Dev)` → `SCI: Generate Test Data (Dev)`.
- Do NOT touch: `package-lock.json` (name unchanged), root `*.vsix` artifacts, GitHub repo URLs.

## Edge cases
- Workspace-scoped old settings: migration uses `inspect()` and migrates at the scope where defined.
- User keybindings on old command IDs: keep working via hidden alias registrations.
- Migration failure (e.g. read-only config): catch and log; never block activation.
- Rollback to an old extension version: new-key settings ignored — acceptable, documented in changelog.

## Validation
1. `npm run compile` and `npm run lint` pass.
2. F5 extension host: set `simpleCodingTimeTracker.inactivityTimeout` in user settings.json first → reload → verify value appears under `simpleCodingInsights.inactivityTimeout`, old key removed, flag set in globalState.
3. Command palette: all `SCI:` commands work; old IDs absent from palette; a keybinding bound to `simpleCodingTimeTracker.showSummary` still opens the dashboard.
4. Dev commands hidden until `simpleCodingInsights.enableDevCommands` is enabled.
5. Settings view save/reset round-trips new keys; Claude tab, status bar icon/color, health settings all respected.
6. `rg -n "simpleCodingTimeTracker" src package.json` returns only the intentional legacy-alias registrations and migration map entries.
