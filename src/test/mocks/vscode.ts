import * as vscode from 'vscode';

export class MockMemento implements vscode.Memento {
    private storage: Map<string, any> = new Map();

    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string, defaultValue?: T): T | undefined {
        const value = this.storage.get(key);
        return value !== undefined ? value : defaultValue;
    }

    async update(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }

    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }

    clear(): void {
        this.storage.clear();
    }

    setKeysForSync(keys: readonly string[]): void {
        // Mock implementation
    }
}

export class MockExtensionContext {
    subscriptions: vscode.Disposable[] = [];
    workspaceState: vscode.Memento = new MockMemento();
    globalState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void } = new MockMemento() as any;
    secrets: vscode.SecretStorage = {} as vscode.SecretStorage;
    extensionUri: vscode.Uri = vscode.Uri.file('/mock/extension/path');
    extensionPath: string = '/mock/extension/path';
    environmentVariableCollection: vscode.GlobalEnvironmentVariableCollection = {} as any;
    languageModelAccessInformation: vscode.LanguageModelAccessInformation = {} as any;
    asAbsolutePath = (relativePath: string): string => `/mock/extension/path/${relativePath}`;
    storageUri: vscode.Uri | undefined = vscode.Uri.file('/mock/storage');
    storagePath: string | undefined = '/mock/storage';
    globalStorageUri: vscode.Uri = vscode.Uri.file('/mock/global/storage');
    globalStoragePath: string = '/mock/global/storage';
    logUri: vscode.Uri = vscode.Uri.file('/mock/log');
    logPath: string = '/mock/log';
    extensionMode: vscode.ExtensionMode = vscode.ExtensionMode.Test;
    extension: vscode.Extension<any> = {} as vscode.Extension<any>;
}

export class MockDisposable implements vscode.Disposable {
    private disposed = false;

    dispose(): void {
        this.disposed = true;
    }

    get isDisposed(): boolean {
        return this.disposed;
    }
}

export function createMockWorkspaceFolder(name: string, path: string): vscode.WorkspaceFolder {
    return {
        uri: vscode.Uri.file(path),
        name,
        index: 0
    };
}

export function createMockTextDocument(fileName: string, languageId: string = 'typescript'): vscode.TextDocument {
    return {
        uri: vscode.Uri.file(fileName),
        fileName,
        languageId,
        version: 1,
        isDirty: false,
        isClosed: false,
        isUntitled: false,
        eol: vscode.EndOfLine.LF,
        lineCount: 10,
        save: () => Promise.resolve(true),
        getText: () => 'mock content',
        getWordRangeAtPosition: () => undefined,
        validateRange: (range) => range,
        validatePosition: (position) => position,
        lineAt: () => ({} as vscode.TextLine),
        offsetAt: () => 0,
        positionAt: () => new vscode.Position(0, 0)
    } as vscode.TextDocument;
}
