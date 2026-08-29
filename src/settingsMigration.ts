import * as vscode from 'vscode';

const OLD_PREFIX = 'simpleCodingTimeTracker';
const NEW_PREFIX = 'simpleCodingInsights';

const SETTING_KEYS = [
    'inactivityTimeout',
    'focusTimeout',
    'statusBar.showSeconds',
    'statusBar.icon',
    'statusBar.backgroundStyle',
    'statusBar.color',
    'health.enableNotifications',
    'health.modalNotifications',
    'health.eyeRestInterval',
    'health.stretchInterval',
    'health.breakThreshold',
    'claude.dataPath',
    'claude.showTab',
    'claude.showNewFeatureBanner',
    'claude.idleGapMinutes',
    'enableDevCommands'
];

const MIGRATION_FLAG_KEY = 'sciSettingsMigrated';

export async function migrateSettings(context: vscode.ExtensionContext): Promise<void> {
    if (context.globalState.get(MIGRATION_FLAG_KEY)) {
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration();
        for (const key of SETTING_KEYS) {
            try {
                await migrateKey(config, `${OLD_PREFIX}.${key}`, `${NEW_PREFIX}.${key}`);
            } catch (error) {
                console.warn(`[settingsMigration] Failed to migrate setting "${key}":`, error);
            }
        }
    } catch (error) {
        console.warn('[settingsMigration] Settings migration failed:', error);
    } finally {
        try {
            await context.globalState.update(MIGRATION_FLAG_KEY, true);
        } catch (error) {
            console.warn('[settingsMigration] Failed to record migration flag:', error);
        }
    }
}

async function migrateKey(config: vscode.WorkspaceConfiguration, oldKey: string, newKey: string): Promise<void> {
    const oldInspect = config.inspect(oldKey);
    const newInspect = config.inspect(newKey);
    if (!oldInspect || !newInspect) {
        return;
    }

    if (oldInspect.globalValue !== undefined) {
        if (newInspect.globalValue === undefined) {
            await config.update(newKey, oldInspect.globalValue, vscode.ConfigurationTarget.Global);
        }
        await config.update(oldKey, undefined, vscode.ConfigurationTarget.Global);
    }

    if (oldInspect.workspaceValue !== undefined) {
        if (newInspect.workspaceValue === undefined) {
            await config.update(newKey, oldInspect.workspaceValue, vscode.ConfigurationTarget.Workspace);
        }
        await config.update(oldKey, undefined, vscode.ConfigurationTarget.Workspace);
    }
}
