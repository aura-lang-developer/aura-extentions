import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class AuraDependencyItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isDirect: boolean = true
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}@${this.version}`;
        this.description = this.version;
        this.iconPath = new vscode.ThemeIcon(isDirect ? 'package' : 'repo-forked');
    }
}

export class AuraDependenciesProvider implements vscode.TreeDataProvider<AuraDependencyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AuraDependencyItem | undefined | null | void> = new vscode.EventEmitter<AuraDependencyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AuraDependencyItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AuraDependencyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AuraDependencyItem): Thenable<AuraDependencyItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return Promise.resolve([]);
        }

        const items: AuraDependencyItem[] = [];
        for (const folder of workspaceFolders) {
            const modFile = path.join(folder.uri.fsPath, 'aura.mod');
            if (fs.existsSync(modFile)) {
                try {
                    const content = fs.readFileSync(modFile, 'utf8');
                    const lines = content.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Look for require lines: require <pkg> <version> or <pkg> = "<version>"
                        if (trimmed.startsWith('require ') || trimmed.includes('@') || trimmed.includes('=')) {
                            const parts = trimmed.replace('require', '').split(/[@=\s]+/);
                            const name = parts[0]?.trim();
                            const version = parts[1]?.trim().replace(/"/g, '') || 'latest';
                            if (name && !name.startsWith('//')) {
                                items.push(new AuraDependencyItem(name, version, vscode.TreeItemCollapsibleState.None, true));
                            }
                        }
                    }
                } catch {
                    // Ignore parse error
                }
            }
        }

        return Promise.resolve(items);
    }
}
