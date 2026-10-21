"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
const hover_1 = require("./hover");
const debug_1 = require("./debug");
const testController_1 = require("./testController");
const taskProvider_1 = require("./taskProvider");
const dependencyExplorer_1 = require("./dependencyExplorer");
const swaggerPreview_1 = require("./swaggerPreview");
const codeLens_1 = require("./codeLens");
let client;
let statusBarItem;
let terminal;
function getAuraTerminal() {
    if (!terminal || terminal.exitStatus !== undefined) {
        terminal = vscode.window.createTerminal('Aura');
    }
    return terminal;
}
function resolveBinary(binaryName, configPathKey) {
    const config = vscode.workspace.getConfiguration('aura');
    const customPath = config.get(configPathKey);
    if (customPath && customPath.trim() !== '') {
        return customPath.trim();
    }
    // Check workspace target/release or target/debug
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const releaseBin = path.join(folder.uri.fsPath, 'target', 'release', binaryName);
            if (fs.existsSync(releaseBin)) {
                return releaseBin;
            }
            const debugBin = path.join(folder.uri.fsPath, 'target', 'debug', binaryName);
            if (fs.existsSync(debugBin)) {
                return debugBin;
            }
        }
    }
    return binaryName;
}
function activate(context) {
    const serverBinary = resolveBinary('auralsp', 'server.path');
    const serverOptions = {
        command: serverBinary,
        args: [],
        transport: node_1.TransportKind.stdio
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'aura' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.aura')
        }
    };
    client = new node_1.LanguageClient('auraLanguageServer', 'Aura Language Server', serverOptions, clientOptions);
    client.start().then(() => {
        updateStatusBar('ready');
    }).catch((err) => {
        console.error('Failed to start Aura LSP:', err);
        updateStatusBar('error');
    });
    // Create Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'aura.showMenu';
    context.subscriptions.push(statusBarItem);
    updateStatusBar('starting');
    statusBarItem.show();
    // Register Rich Contextual Hover and Go to Definition Providers
    context.subscriptions.push(vscode.languages.registerHoverProvider('aura', new hover_1.AuraHoverProvider()), vscode.languages.registerDefinitionProvider('aura', new hover_1.AuraDefinitionProvider()));
    // Register Aura Debug Configuration Provider
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('aura', new debug_1.AuraDebugConfigurationProvider(resolveBinary)));
    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('aura.showMenu', async () => {
        const isTestFile = vscode.window.activeTextEditor?.document.fileName.endsWith('_test.aura');
        const menuItems = [
            ...(isTestFile ? [{ label: '$(beaker) Run Active Test File', description: 'Run test suite in current file with auratest', id: 'runTestFile' }] : []),
            { label: '$(play) Run Active File', description: isTestFile ? 'Run active test file with auratest' : 'Compile and run active .aura file', id: 'run' },
            { label: '$(debug-alt) Debug Active File', description: 'Debug active .aura file with breakpoints & sourcemaps', id: 'debug' },
            { label: '$(debug-step-into) Step Debug Active File (CLI)', description: 'Interactive step-by-step debugger in terminal', id: 'stepDebug' },
            { label: '$(check) Type Check Active File', description: 'Run aurac check on active file', id: 'check' },
            { label: '$(gear) Build Standalone Binary', description: 'Compile to standalone native binary', id: 'build' },
            { label: '$(beaker) Run Project Tests', description: 'Execute entire test suite with auratest', id: 'test' },
            { label: '$(edit) Format Active File', description: 'Format using aurafmt', id: 'fmt' },
            { label: '$(eye) Start Live Watch Mode', description: 'Watch and recompile on file save', id: 'watch' },
            { label: '$(browser) Open Online Playground', description: 'Open local interactive playground', id: 'playground' },
            { label: '$(preview) Preview OpenAPI / Swagger Docs', description: 'Open interactive Swagger UI webview', id: 'swagger' },
            { label: '$(sync) Tidy Dependencies (aurac mod tidy)', description: 'Discover and tidy module dependencies', id: 'tidy' },
            { label: '$(archive) Vendor Dependencies (aurac mod vendor)', description: 'Vendor and freeze dependencies locally', id: 'vendor' },
            { label: '$(new-folder) Initialize Module (aurac mod init)', description: 'Create new aura.mod module', id: 'init' },
            { label: '$(refresh) Restart Language Server', description: 'Restart Aura LSP daemon', id: 'restart' }
        ];
        const selected = await vscode.window.showQuickPick(menuItems, {
            placeHolder: 'Aura Language Commands'
        });
        if (!selected)
            return;
        switch (selected.id) {
            case 'runTestFile':
                vscode.commands.executeCommand('aura.runActiveTestFile');
                break;
            case 'run':
                vscode.commands.executeCommand('aura.runActiveFile');
                break;
            case 'debug':
                vscode.commands.executeCommand('aura.debugActiveFile');
                break;
            case 'stepDebug':
                vscode.commands.executeCommand('aura.stepDebugActiveFile');
                break;
            case 'check':
                vscode.commands.executeCommand('aura.checkActiveFile');
                break;
            case 'build':
                vscode.commands.executeCommand('aura.buildActiveFile');
                break;
            case 'test':
                vscode.commands.executeCommand('aura.runTests');
                break;
            case 'fmt':
                vscode.commands.executeCommand('aura.formatFile');
                break;
            case 'watch':
                vscode.commands.executeCommand('aura.startWatch');
                break;
            case 'playground':
                vscode.commands.executeCommand('aura.openPlayground');
                break;
            case 'swagger':
                vscode.commands.executeCommand('aura.previewSwagger');
                break;
            case 'tidy':
                vscode.commands.executeCommand('aura.modTidy');
                break;
            case 'vendor':
                vscode.commands.executeCommand('aura.modVendor');
                break;
            case 'init':
                vscode.commands.executeCommand('aura.modInit');
                break;
            case 'restart':
                vscode.commands.executeCommand('aura.restartServer');
                break;
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.runActiveFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        const filePath = editor.document.fileName;
        // Automatically route *_test.aura files to auratest
        if (filePath.endsWith('_test.aura')) {
            const auratest = resolveBinary('auratest', 'compiler.path');
            const term = getAuraTerminal();
            term.show();
            term.sendText(`${auratest} -v "${filePath}"`);
            return;
        }
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} run "${filePath}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.runActiveTestFile', async (fileUri) => {
        let targetPath;
        if (fileUri && fileUri.fsPath) {
            targetPath = fileUri.fsPath;
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                vscode.window.showWarningMessage('Please open an Aura test file (*_test.aura) first.');
                return;
            }
            await editor.document.save();
            targetPath = editor.document.fileName;
        }
        if (!targetPath.endsWith('_test.aura')) {
            vscode.window.showWarningMessage('Selected file is not an Aura test file (*_test.aura).');
            return;
        }
        const auratest = resolveBinary('auratest', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${auratest} -v "${targetPath}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.runSingleTest', async (uri, testName) => {
        if (!uri || !testName)
            return;
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.uri.toString() === uri.toString()) {
            await editor.document.save();
        }
        const auratest = resolveBinary('auratest', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        const isBenchmark = testName.startsWith('benchmark_') || testName.startsWith('Benchmark');
        const flag = isBenchmark ? '-bench' : '-run';
        term.sendText(`${auratest} ${flag} "${testName}" -v "${uri.fsPath}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.debugActiveFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        await vscode.debug.startDebugging(undefined, {
            type: 'aura',
            request: 'launch',
            name: `Debug Aura: ${path.basename(editor.document.fileName)}`,
            program: editor.document.fileName
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.stepDebugActiveFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} step "${editor.document.fileName}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.checkActiveFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} check "${editor.document.fileName}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.buildActiveFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} build "${editor.document.fileName}" --standalone`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.runTests', async () => {
        const auratest = resolveBinary('auratest', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${auratest}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.formatFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        await editor.document.save();
        const aurafmt = resolveBinary('aurafmt', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurafmt} -w "${editor.document.fileName}"`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.startWatch', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura (.aura) file first.');
            return;
        }
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} watch "${editor.document.fileName}" --run`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.restartServer', async () => {
        if (client) {
            updateStatusBar('starting');
            await client.stop();
            await client.start();
            updateStatusBar('ready');
            vscode.window.showInformationMessage('Aura Language Server restarted.');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aura.openPlayground', () => {
        vscode.env.openExternal(vscode.Uri.parse('http://127.0.0.1:3000'));
    }));
    // Register Test Controller
    (0, testController_1.createAuraTestController)(context, resolveBinary);
    // Register Test CodeLens Provider (*_test.aura)
    const testCodeLensProvider = new codeLens_1.AuraTestCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'aura', scheme: 'file' }, testCodeLensProvider));
    // Register Task Provider
    context.subscriptions.push(vscode.tasks.registerTaskProvider(taskProvider_1.AuraTaskProvider.AuraType, new taskProvider_1.AuraTaskProvider(resolveBinary)));
    // Register Dependency Explorer
    const depsProvider = new dependencyExplorer_1.AuraDependenciesProvider();
    vscode.window.registerTreeDataProvider('auraDependencies', depsProvider);
    context.subscriptions.push(vscode.commands.registerCommand('aura.refreshDependencies', () => depsProvider.refresh()), vscode.commands.registerCommand('aura.previewSwagger', () => (0, swaggerPreview_1.openSwaggerPreview)(context)), vscode.commands.registerCommand('aura.modTidy', () => {
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} mod tidy`);
        setTimeout(() => depsProvider.refresh(), 2000);
    }), vscode.commands.registerCommand('aura.modVendor', () => {
        const aurac = resolveBinary('aurac', 'compiler.path');
        const term = getAuraTerminal();
        term.show();
        term.sendText(`${aurac} mod vendor`);
    }), vscode.commands.registerCommand('aura.modInit', async () => {
        const modName = await vscode.window.showInputBox({ prompt: 'Enter module namespace name', placeHolder: 'example.com/mymodule' });
        if (modName) {
            const aurac = resolveBinary('aurac', 'compiler.path');
            const term = getAuraTerminal();
            term.show();
            term.sendText(`${aurac} mod init ${modName}`);
            setTimeout(() => depsProvider.refresh(), 2000);
        }
    }));
}
function updateStatusBar(status) {
    if (!statusBarItem)
        return;
    switch (status) {
        case 'starting':
            statusBarItem.text = '$(sync~spin) Aura';
            statusBarItem.tooltip = 'Aura Language Server is starting...';
            break;
        case 'ready':
            statusBarItem.text = '$(zap) Aura';
            statusBarItem.tooltip = 'Aura Language Server is ready (Click for menu)';
            break;
        case 'error':
            statusBarItem.text = '$(alert) Aura';
            statusBarItem.tooltip = 'Aura Language Server failed to start (Click to restart)';
            break;
    }
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map