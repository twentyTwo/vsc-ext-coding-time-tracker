import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Database } from './database';
import { SummaryViewProvider } from './summaryView';
import { SettingsViewProvider } from './settingsView';
import { migrateSettings } from './settingsMigration';

export async function activate(context: vscode.ExtensionContext) {
    await migrateSettings(context);

    const database = new Database(context);
    const timeTracker = new TimeTracker(database);
    const summaryView = new SummaryViewProvider(context, database, timeTracker);
    const settingsView = new SettingsViewProvider(context);
    const statusBar = new StatusBar(timeTracker, summaryView);

    // Register cursor tracking
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(() => {
            timeTracker.updateCursorActivity();
        })
    );

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleCodingInsights')) {
                timeTracker.updateConfiguration();
                // Update status bar when health notifications setting changes
                if (e.affectsConfiguration('simpleCodingInsights.health.enableNotifications')) {
                    statusBar.updateNow();
                }
                // Re-render an already-open dashboard when a tab's visibility changes,
                // so the toggle takes effect without a manual reload.
                if (e.affectsConfiguration('simpleCodingInsights.claude.showTab')) {
                    void summaryView.refreshIfOpen();
                }
            }
        })
    );

    // Register the show summary command
    let disposable = vscode.commands.registerCommand('simpleCodingInsights.showSummary', () => {
        summaryView.show();
    });

    // Register open settings command
    let openSettingsCommand = vscode.commands.registerCommand('simpleCodingInsights.openSettings', () => {
        settingsView.show();
    });

    // Register view storage command
    let viewStorageDisposable = vscode.commands.registerCommand('simpleCodingInsights.viewStorageData', async () => {
        try {
            const entries = await database.getEntries();
            const processedData = {
                totalEntries: entries.length,
                exportDate: new Date().toISOString(),
                entries: entries.map(entry => ({
                    ...entry,
                    timeSpentFormatted: `${Math.round(entry.timeSpent)} minutes`
                }))
            };
            
            // Create a temporary untitled document
            const document = await vscode.workspace.openTextDocument({
                content: JSON.stringify(processedData, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(document, {
                preview: false,
                viewColumn: vscode.ViewColumn.One
            });
            
            vscode.window.showInformationMessage('Time tracking data loaded successfully');        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to view data: ${error?.message || 'Unknown error'}`);
        }
    });

    // Register data management command
    let clearDataCommand = vscode.commands.registerCommand('simpleCodingInsights.clearAllData', async () => {
        // Stop tracking before clearing data
        if (timeTracker.isActive()) {
            timeTracker.stopTracking('clear all data');
        }
        
        const success = await database.clearAllData();
        if (success) {
            // Update the summary view to show empty state
            await summaryView.show();
            // Force status bar update
            statusBar.updateNow();
        }
    });


    // Register health notifications toggle command (legacy command with confirmation)
    let toggleHealthCommand = vscode.commands.registerCommand('simpleCodingInsights.toggleHealthNotifications', async () => {
        const config = vscode.workspace.getConfiguration('simpleCodingInsights');
        const currentEnabled = config.get('health.enableNotifications', false);
        
        // Show current state and ask for confirmation
        const action = currentEnabled ? 'disable' : 'enable';
        const icon = currentEnabled ? '🔕' : '🔔';
        const statusText = currentEnabled ? 'currently ENABLED' : 'currently DISABLED';
        
        const message = `Health notifications are ${statusText}. ${icon} ${action.charAt(0).toUpperCase() + action.slice(1)} them?`;
        const confirmAction = currentEnabled ? 'Disable' : 'Enable';
        
        const choice = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            confirmAction,
            'Cancel'
        );
        
        if (choice === confirmAction) {
            await config.update('health.enableNotifications', !currentEnabled, vscode.ConfigurationTarget.Global);
            
            const resultMessage = !currentEnabled ? 
                '$(bell) Health notifications enabled! You\'ll receive reminders for eye rest (20min), stretching (45min), and breaks (2h).' :
                '$(bell-slash) Health notifications disabled. No health reminders will be shown.';
            
            vscode.window.showInformationMessage(resultMessage);
            
            // Update status bar to reflect the change
            statusBar.updateNow();
        }
    });

    // Register test pause command for debugging
    let testPauseCommand = vscode.commands.registerCommand('simpleCodingInsights.testPause', () => {
        console.log('Test pause command executed');
        if (timeTracker.isActive()) {
            timeTracker.pauseTimer();
            vscode.window.showInformationMessage('Test pause executed - check console for logs');
        } else {
            vscode.window.showInformationMessage('Timer is not active');
        }
    });

    // Register test notification command for debugging
    let testNotificationCommand = vscode.commands.registerCommand('simpleCodingInsights.testNotification', () => {
        console.log('Test notification command executed');
        (timeTracker as any).healthManager.triggerTestNotification();
    });

    // Test data generation command
    let generateTestDataCommand = vscode.commands.registerCommand('simpleCodingInsights.generateTestData', async () => {
        // Check if dev commands are enabled
        const config = vscode.workspace.getConfiguration('simpleCodingInsights');
        const enableDevCommands = config.get<boolean>('enableDevCommands', false) || 
                                  context.extensionMode === vscode.ExtensionMode.Development;
        
        if (!enableDevCommands) {
            vscode.window.showWarningMessage('Development commands are disabled. Enable "simpleCodingInsights.enableDevCommands" in settings to use this feature.');
            return;
        }

        const projects = [
            'React Dashboard', 'Node.js API', 'Mobile App', 'Database Migration', 'UI Components',
            'Backend Service', 'Documentation', 'Testing Suite', 'DevOps Setup', 'Data Analytics'
        ];

        const branches = [
            'main', 'develop', 'feature/user-auth', 'feature/dashboard', 'feature/api-integration',
            'bugfix/login-issue', 'bugfix/memory-leak', 'hotfix/security-patch', 'release/v1.2.0',
            'feature/mobile-responsive', 'feature/dark-theme', 'refactor/database-layer'
        ];

        const languages = [
            'typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust',
            'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'scss', 'json', 'yaml', 'markdown', 'sql', 'bash'
        ];

        const value = await vscode.window.showInputBox({
            title: 'Enter the number of days which should be generated',
            prompt: 'Please enter the number of days',
            placeHolder: '90 to generate entries for the last 90 days',
            validateInput: (input) => {
                if(isNaN(Number(input))) {
                    return 'Must be a number';
                }
                // Only Positive integers without 0
                if(!(/^[1-9][[0-9]*$/.test(input))) {
                    return 'Enter an integer greater than 0';
                }
                return null
            }
        })

        if (value == undefined) {
            // user cancelled the input
            return;
        }

        const today = new Date();
        let totalEntries = 0;
        const days = Number(value);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🎲 Generating test data...",
            cancellable: false
        }, async (progress) => {
            try {
                // Generate data for the last x days
                for (let i = 0; i < days; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    
                    // Skip some days randomly (weekends or days off)
                    if (Math.random() < 0.2) continue; // 20% chance to skip a day
                    
                    // Generate 1-4 entries per day
                    const entriesCount = Math.floor(Math.random() * 4) + 1;
                    
                    for (let j = 0; j < entriesCount; j++) {
                        const project = projects[Math.floor(Math.random() * projects.length)];
                        const branch = branches[Math.floor(Math.random() * branches.length)];
                        const language = languages[Math.floor(Math.random() * languages.length)];
                        // Random time between 15 minutes and 3 hours
                        const timeSpent = Math.floor(Math.random() * 165) + 15;
                        
                        // Use the database's addEntry method
                        await database.addEntry(date, project, timeSpent, branch, language);
                        totalEntries++;
                    }
                    
                    // Update progress
                    progress.report({ increment: (1/days) * 100 });
                }

                // Add some special test cases for yesterday and today
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                await database.addEntry(yesterday, 'Node.js API', 480, 'feature/api-integration', 'typescript');
                await database.addEntry(today, 'React Dashboard', 120, 'feature/dashboard', 'typescript');
                await database.addEntry(today, 'Documentation', 60, 'main', 'markdown');
                totalEntries += 3;

            } catch (error) {
                vscode.window.showErrorMessage(`❌ Error generating test data: ${error}`);
                return;
            }
        });

        vscode.window.showInformationMessage(`✅ Generated ${totalEntries} test entries for ${days} days successfully!`);
    });

    // Delete test data command
    let deleteTestDataCommand = vscode.commands.registerCommand('simpleCodingInsights.deleteTestData', async () => {
        // Check if dev commands are enabled
        const config = vscode.workspace.getConfiguration('simpleCodingInsights');
        const enableDevCommands = config.get<boolean>('enableDevCommands', false) || 
                                  context.extensionMode === vscode.ExtensionMode.Development;
        
        if (!enableDevCommands) {
            vscode.window.showWarningMessage('Development commands are disabled. Enable "simpleCodingInsights.enableDevCommands" in settings to use this feature.');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            '🗑️ Delete all time tracking data? This action cannot be undone.',
            { modal: true },
            'Delete All Data',
            'Cancel'
        );

        if (confirmation === 'Delete All Data') {
            const finalConfirmation = await vscode.window.showInputBox({
                prompt: 'Type "DELETE ALL DATA" to confirm permanent deletion of all time tracking data.',
                placeHolder: 'DELETE ALL DATA',
                ignoreFocusOut: true
            });

            if (finalConfirmation === 'DELETE ALL DATA') {
                try {
                    const success = await database.clearAllData();
                    if (success) {
                        vscode.window.showInformationMessage('✅ All time tracking data has been deleted successfully!');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`❌ Error deleting data: ${error}`);
                }
            } else {
                vscode.window.showInformationMessage('Data deletion cancelled.');
            }
        }
    });

    context.subscriptions.push(clearDataCommand);
    context.subscriptions.push(toggleHealthCommand);
    context.subscriptions.push(openSettingsCommand);
    context.subscriptions.push(testPauseCommand);
    context.subscriptions.push(testNotificationCommand);
    context.subscriptions.push(generateTestDataCommand);
    context.subscriptions.push(deleteTestDataCommand);

    context.subscriptions.push(disposable);
    context.subscriptions.push(viewStorageDisposable);
    context.subscriptions.push(timeTracker);
    context.subscriptions.push(statusBar);
    context.subscriptions.push(settingsView);

    // Legacy command ID aliases: kept so existing user keybindings on the old
    // simpleCodingTimeTracker.* IDs keep working. Hidden from the palette via
    // "when": "false" in package.json; safe to remove in a future release.
    const legacyCommandAliases = [
        'showSummary',
        'viewStorageData',
        'clearAllData',
        'toggleNotifications',
        'toggleHealthNotifications',
        'openSettings',
        'generateTestData',
        'deleteTestData'
    ].map(name => vscode.commands.registerCommand(`simpleCodingTimeTracker.${name}`, () => {
        void vscode.commands.executeCommand(`simpleCodingInsights.${name}`);
    }));
    context.subscriptions.push(...legacyCommandAliases);

    // Start tracking immediately if VS Code is already focused
    if (vscode.window.state.focused) {
        timeTracker.startTracking('initial startup');
    }

    // Window state is now handled in TimeTracker class
    vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        if (e.focused && !timeTracker.isActive()) {
            timeTracker.startTracking('window focus');
        }
    });

    vscode.workspace.onDidOpenTextDocument(() => {
        if (vscode.window.state.focused) {
            timeTracker.startTracking('document opened');
        }
    });

}

export function deactivate() {}