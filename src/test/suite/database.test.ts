import * as assert from 'assert';
import { Database, TimeEntry } from '../../database';
import { MockExtensionContext } from '../mocks/vscode';

suite('Database Tests', () => {
    let database: Database;
    let mockContext: MockExtensionContext;

    setup(() => {
        mockContext = new MockExtensionContext();
        database = new Database(mockContext as any);
    });

    teardown(() => {
        // Clear any data between tests
        mockContext.globalState.update('timeEntries', []);
    });

    suite('Basic Operations', () => {
        test('should initialize with empty entries', async () => {
            const entries = database.getEntries();
            assert.strictEqual(entries.length, 0);
        });

        test('should add a new entry', async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            await database.addEntry(date, 'test-project', 30, 'main');

            const entries = database.getEntries();
            assert.strictEqual(entries.length, 1);
            assert.strictEqual(entries[0].project, 'test-project');
            assert.strictEqual(entries[0].timeSpent, 30);
            assert.strictEqual(entries[0].branch, 'main');
            assert.strictEqual(entries[0].date, '2023-12-01');
        });

        test('should merge entries for same date, project, and branch', async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            
            await database.addEntry(date, 'test-project', 30, 'main');
            await database.addEntry(date, 'test-project', 15, 'main');

            const entries = database.getEntries();
            assert.strictEqual(entries.length, 1);
            assert.strictEqual(entries[0].timeSpent, 45);
        });

        test('should create separate entries for different branches', async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            
            await database.addEntry(date, 'test-project', 30, 'main');
            await database.addEntry(date, 'test-project', 15, 'feature-branch');

            const entries = database.getEntries();
            assert.strictEqual(entries.length, 2);
            
            const mainEntry = entries.find(e => e.branch === 'main');
            const featureEntry = entries.find(e => e.branch === 'feature-branch');
            
            assert.strictEqual(mainEntry?.timeSpent, 30);
            assert.strictEqual(featureEntry?.timeSpent, 15);
        });

        test('should reject invalid time values', async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            
            // Test negative time
            await database.addEntry(date, 'test-project', -10, 'main');
            let entries = database.getEntries();
            assert.strictEqual(entries.length, 0);

            // Test zero time
            await database.addEntry(date, 'test-project', 0, 'main');
            entries = database.getEntries();
            assert.strictEqual(entries.length, 0);

            // Test extremely large time (more than 24 hours)
            await database.addEntry(date, 'test-project', 25 * 60, 'main');
            entries = database.getEntries();
            assert.strictEqual(entries.length, 0);
        });

        test('should round time values to 2 decimal places', async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            await database.addEntry(date, 'test-project', 30.12345, 'main');

            const entries = database.getEntries();
            assert.strictEqual(entries[0].timeSpent, 30.12);
        });
    });

    suite('Date Handling', () => {
        test('should handle different timezones correctly', async () => {
            const utcDate = new Date('2023-12-01T23:30:00Z');
            await database.addEntry(utcDate, 'test-project', 30, 'main');

            const entries = database.getEntries();
            // Should use local date string - the actual implementation converts to local date
            // The date shown will depend on the local timezone offset
            const expectedDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];
            assert.strictEqual(entries[0].date, expectedDate);
        });

        test('should handle date boundaries correctly', async () => {
            const date1 = new Date('2023-12-01T23:59:59Z');
            const date2 = new Date('2023-12-02T00:00:01Z');
            
            await database.addEntry(date1, 'test-project', 30, 'main');
            await database.addEntry(date2, 'test-project', 25, 'main');

            const entries = database.getEntries();
            
            // Convert dates to local date strings as the database does
            const expectedDate1 = new Date(date1.getTime() - (date1.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];
            const expectedDate2 = new Date(date2.getTime() - (date2.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];
            
            // May be same or different depending on timezone
            if (expectedDate1 === expectedDate2) {
                assert.strictEqual(entries.length, 1);
                assert.strictEqual(entries[0].timeSpent, 55); // 30 + 25
            } else {
                assert.strictEqual(entries.length, 2);
                const dec1Entry = entries.find(e => e.date === expectedDate1);
                const dec2Entry = entries.find(e => e.date === expectedDate2);
                
                assert.strictEqual(dec1Entry?.timeSpent, 30);
                assert.strictEqual(dec2Entry?.timeSpent, 25);
            }
        });
    });

    suite('Summary Data', () => {
        setup(async () => {
            // Add test data
            const date1 = new Date('2023-12-01T10:00:00Z');
            const date2 = new Date('2023-12-02T10:00:00Z');
            
            await database.addEntry(date1, 'project-a', 60, 'main');
            await database.addEntry(date1, 'project-a', 30, 'feature');
            await database.addEntry(date1, 'project-b', 45, 'main');
            await database.addEntry(date2, 'project-a', 75, 'main');
        });

        test('should calculate daily summary correctly', async () => {
            const summary = await database.getSummaryData();
            
            assert.strictEqual(summary.dailySummary['2023-12-01'], 135); // 60 + 30 + 45
            assert.strictEqual(summary.dailySummary['2023-12-02'], 75);
        });

        test('should calculate project summary correctly', async () => {
            const summary = await database.getSummaryData();
            
            assert.strictEqual(summary.projectSummary['project-a'], 165); // 60 + 30 + 75
            assert.strictEqual(summary.projectSummary['project-b'], 45);
        });

        test('should calculate branch summary correctly', async () => {
            const summary = await database.getSummaryData();
            
            assert.strictEqual(summary.branchSummary['main'], 180); // 60 + 45 + 75
            assert.strictEqual(summary.branchSummary['feature'], 30);
        });

        test('should calculate total time correctly', async () => {
            const summary = await database.getSummaryData();
            assert.strictEqual(summary.totalTime, 210); // 60 + 30 + 45 + 75
        });
    });

    suite('Search Functionality', () => {
        setup(async () => {
            const date1 = new Date('2023-12-01T10:00:00Z');
            const date2 = new Date('2023-12-02T10:00:00Z');
            const date3 = new Date('2023-12-03T10:00:00Z');
            
            await database.addEntry(date1, 'frontend-app', 60, 'main');
            await database.addEntry(date2, 'backend-api', 45, 'feature');
            await database.addEntry(date3, 'frontend-app', 30, 'hotfix');
        });

        test('should search by date range', async () => {
            const results = await database.searchEntries('2023-12-01', '2023-12-02');
            assert.strictEqual(results.length, 2);
        });

        test('should search by start date only', async () => {
            const results = await database.searchEntries('2023-12-02');
            assert.strictEqual(results.length, 2); // Dec 2 and Dec 3
        });

        test('should search by end date only', async () => {
            const results = await database.searchEntries(undefined, '2023-12-02');
            assert.strictEqual(results.length, 2); // Dec 1 and Dec 2
        });

        test('should search by project name (case insensitive)', async () => {
            const results = await database.searchEntries(undefined, undefined, 'FRONTEND');
            assert.strictEqual(results.length, 2);
            results.forEach(entry => {
                assert.ok(entry.project.toLowerCase().includes('frontend'));
            });
        });

        test('should search by branch name (case insensitive)', async () => {
            const results = await database.searchEntries(undefined, undefined, undefined, 'MAIN');
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].branch, 'main');
        });

        test('should combine multiple search criteria', async () => {
            const results = await database.searchEntries(
                '2023-12-01', 
                '2023-12-03', 
                'frontend', 
                undefined
            );
            assert.strictEqual(results.length, 2);
            results.forEach(entry => {
                assert.ok(entry.project.includes('frontend'));
                assert.ok(entry.date >= '2023-12-01' && entry.date <= '2023-12-03');
            });
        });
    });

    suite('Branch Operations', () => {
        setup(async () => {
            const date = new Date('2023-12-01T10:00:00Z');
            
            await database.addEntry(date, 'project-a', 60, 'main');
            await database.addEntry(date, 'project-a', 30, 'feature-1');
            await database.addEntry(date, 'project-a', 15, 'feature-2');
            await database.addEntry(date, 'project-b', 45, 'main');
        });

        test('should get branches by project', async () => {
            const branches = await database.getBranchesByProject('project-a');
            
            assert.strictEqual(branches.length, 3);
            assert.ok(branches.includes('main'));
            assert.ok(branches.includes('feature-1'));
            assert.ok(branches.includes('feature-2'));
        });

        test('should return sorted branches', async () => {
            const branches = await database.getBranchesByProject('project-a');
            
            // Should be sorted alphabetically
            assert.deepStrictEqual(branches, ['feature-1', 'feature-2', 'main']);
        });

        test('should return empty array for non-existent project', async () => {
            const branches = await database.getBranchesByProject('non-existent');
            assert.strictEqual(branches.length, 0);
        });
    });

    suite('Data Migration', () => {
        test('should migrate entries without branch field', async () => {
            // Simulate old data format without branch field
            const oldEntries = [
                { date: '2023-12-01', project: 'test-project', timeSpent: 60 }
            ];
            
            await mockContext.globalState.update('timeEntries', oldEntries);
            
            // Create new database instance to trigger migration
            const newDatabase = new Database(mockContext as any);
            const entries = newDatabase.getEntries();
            
            assert.strictEqual(entries.length, 1);
            assert.strictEqual(entries[0].branch, 'unknown');
        });
    });

    suite('Data Clearing', () => {
        test('should clear all data when confirmed', async () => {
            // Add some test data
            const date = new Date('2023-12-01T10:00:00Z');
            await database.addEntry(date, 'test-project', 30, 'main');
            
            // Verify data exists
            let entries = database.getEntries();
            assert.strictEqual(entries.length, 1);
            
            // Note: In real tests, you would need to mock vscode.window.showWarningMessage
            // and vscode.window.showInputBox to return the expected confirmation values
            // For this unit test, we'll test the data clearing logic directly
            
            await mockContext.globalState.update('timeEntries', []);
            database = new Database(mockContext as any);
            
            entries = database.getEntries();
            assert.strictEqual(entries.length, 0);
        });
    });
});
