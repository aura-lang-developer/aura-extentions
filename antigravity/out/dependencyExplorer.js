"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraDependenciesProvider = exports.AuraDependencyItem = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class AuraDependencyItem extends vscode.TreeItem {
    constructor(label, version, collapsibleState, isDirect = true) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.isDirect = isDirect;
        this.tooltip = `${this.label}@${this.version}`;
        this.description = this.version;
        this.iconPath = new vscode.ThemeIcon(isDirect ? 'package' : 'repo-forked');
    }
}
exports.AuraDependencyItem = AuraDependencyItem;
class AuraDependenciesProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return Promise.resolve([]);
        }
        const items = [];
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
                }
                catch {
                    // Ignore parse error
                }
            }
        }
        return Promise.resolve(items);
    }
}
exports.AuraDependenciesProvider = AuraDependenciesProvider;
//# sourceMappingURL=dependencyExplorer.js.map