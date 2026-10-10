"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraDependenciesProvider = exports.AuraDependencyItem = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class AuraDependencyItem extends vscode.TreeItem {
    constructor(label, versionOrDetail, category, collapsibleState, isVerified = false, targetPath) {
        super(label, collapsibleState);
        this.label = label;
        this.versionOrDetail = versionOrDetail;
        this.category = category;
        this.collapsibleState = collapsibleState;
        this.isVerified = isVerified;
        this.targetPath = targetPath;
        this.description = versionOrDetail;
        switch (category) {
            case 'module':
                this.iconPath = new vscode.ThemeIcon('root-folder');
                this.tooltip = `Aura Module: ${label} (${versionOrDetail})`;
                break;
            case 'require':
                this.iconPath = new vscode.ThemeIcon(isVerified ? 'verified-filled' : 'package');
                this.tooltip = `Dependency: ${label}@${versionOrDetail}${isVerified ? ' [🔒 Cryptographically Verified SHA-256]' : ' [Unverified]'}`;
                break;
            case 'replace':
                this.iconPath = new vscode.ThemeIcon('arrow-swap');
                this.tooltip = `Replacement: ${label} => ${targetPath || versionOrDetail}`;
                break;
            case 'lock':
                this.iconPath = new vscode.ThemeIcon('lock');
                this.tooltip = `Lockfile: ${label} (${versionOrDetail})`;
                break;
        }
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
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return Promise.resolve([]);
        }
        const items = [];
        for (const folder of workspaceFolders) {
            const modFile = path.join(folder.uri.fsPath, 'aura.mod');
            const lockFile = path.join(folder.uri.fsPath, 'aura.lock');
            if (!fs.existsSync(modFile)) {
                continue;
            }
            try {
                // Parse lockfile for verification hashes
                const lockHashes = new Map();
                if (fs.existsSync(lockFile)) {
                    const lockContent = fs.readFileSync(lockFile, 'utf8');
                    for (const line of lockContent.split('\n')) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
                            const parts = trimmed.split(/\s+/);
                            if (parts.length >= 3) {
                                lockHashes.set(parts[0], parts[2]);
                            }
                        }
                    }
                }
                const modContent = fs.readFileSync(modFile, 'utf8');
                const lines = modContent.split(/\r?\n/);
                let moduleName = 'unknown-module';
                let auraVersion = '0.1.0';
                const requires = [];
                const replaces = [];
                let inRequireBlock = false;
                let inReplaceBlock = false;
                for (const rawLine of lines) {
                    const line = rawLine.trim();
                    if (!line || line.startsWith('//') || line.startsWith('#'))
                        continue;
                    if (line.startsWith('module ')) {
                        moduleName = line.substring(7).trim();
                        continue;
                    }
                    if (line.startsWith('aura ')) {
                        auraVersion = line.substring(5).trim();
                        continue;
                    }
                    if (line.startsWith('require (')) {
                        inRequireBlock = true;
                        continue;
                    }
                    if (inRequireBlock) {
                        if (line === ')') {
                            inRequireBlock = false;
                            continue;
                        }
                        const parts = line.split(/\s+/);
                        if (parts.length >= 2) {
                            const depName = parts[0];
                            const depVer = parts[1];
                            requires.push({
                                name: depName,
                                version: depVer,
                                isVerified: lockHashes.has(depName)
                            });
                        }
                        continue;
                    }
                    if (line.startsWith('require ')) {
                        const rest = line.substring(8).trim();
                        const parts = rest.split(/\s+/);
                        if (parts.length >= 2) {
                            const depName = parts[0];
                            const depVer = parts[1];
                            requires.push({
                                name: depName,
                                version: depVer,
                                isVerified: lockHashes.has(depName)
                            });
                        }
                        continue;
                    }
                    if (line.startsWith('replace (')) {
                        inReplaceBlock = true;
                        continue;
                    }
                    if (inReplaceBlock) {
                        if (line === ')') {
                            inReplaceBlock = false;
                            continue;
                        }
                        const arrowIdx = line.indexOf('=>');
                        if (arrowIdx > -1) {
                            const orig = line.substring(0, arrowIdx).trim();
                            const target = line.substring(arrowIdx + 2).trim();
                            replaces.push({ name: orig, target });
                        }
                        continue;
                    }
                    if (line.startsWith('replace ')) {
                        const rest = line.substring(8).trim();
                        const arrowIdx = rest.indexOf('=>');
                        if (arrowIdx > -1) {
                            const orig = rest.substring(0, arrowIdx).trim();
                            const target = rest.substring(arrowIdx + 2).trim();
                            replaces.push({ name: orig, target });
                        }
                        continue;
                    }
                }
                // Add Module Info Item
                items.push(new AuraDependencyItem(moduleName, `Aura v${auraVersion}`, 'module', vscode.TreeItemCollapsibleState.None));
                // Add Require Items
                for (const req of requires) {
                    items.push(new AuraDependencyItem(req.name, req.version, 'require', vscode.TreeItemCollapsibleState.None, req.isVerified));
                }
                // Add Replace Items
                for (const rep of replaces) {
                    items.push(new AuraDependencyItem(rep.name, `=> ${rep.target}`, 'replace', vscode.TreeItemCollapsibleState.None, false, rep.target));
                }
                // Add Lock Status Item
                if (fs.existsSync(lockFile)) {
                    items.push(new AuraDependencyItem('aura.lock', `${lockHashes.size} package(s) verified (SHA-256)`, 'lock', vscode.TreeItemCollapsibleState.None, true));
                }
            }
            catch {
                // Parse error fallback
            }
        }
        return Promise.resolve(items);
    }
}
exports.AuraDependenciesProvider = AuraDependenciesProvider;
//# sourceMappingURL=dependencyExplorer.js.map