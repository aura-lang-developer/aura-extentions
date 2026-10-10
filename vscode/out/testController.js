"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuraTestController = createAuraTestController;
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
function createAuraTestController(context, resolveBinary) {
    const controller = vscode.tests.createTestController('auraTestController', 'Aura Tests');
    context.subscriptions.push(controller);
    controller.refreshHandler = async () => {
        await discoverTests(controller);
    };
    // Discover tests when workspace opens or files change
    discoverTests(controller);
    const watcher = vscode.workspace.createFileSystemWatcher('**/{*test*,tests}/**/*.aura');
    const directWatcher = vscode.workspace.createFileSystemWatcher('**/*_test.aura');
    const prefixWatcher = vscode.workspace.createFileSystemWatcher('**/test_*.aura');
    const triggerDiscovery = () => discoverTests(controller);
    watcher.onDidCreate(triggerDiscovery);
    watcher.onDidChange(triggerDiscovery);
    watcher.onDidDelete((uri) => controller.items.delete(uri.toString()));
    directWatcher.onDidCreate(triggerDiscovery);
    directWatcher.onDidChange(triggerDiscovery);
    directWatcher.onDidDelete((uri) => controller.items.delete(uri.toString()));
    prefixWatcher.onDidCreate(triggerDiscovery);
    prefixWatcher.onDidChange(triggerDiscovery);
    prefixWatcher.onDidDelete((uri) => controller.items.delete(uri.toString()));
    context.subscriptions.push(watcher, directWatcher, prefixWatcher);
    const runProfile = controller.createRunProfile('Run Aura Tests', vscode.TestRunProfileKind.Run, async (request, token) => {
        const run = controller.createTestRun(request);
        const auratest = resolveBinary('auratest', 'compiler.path');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        const queue = [];
        if (request.include) {
            request.include.forEach(t => queue.push(t));
        }
        else {
            controller.items.forEach(t => queue.push(t));
        }
        for (const test of queue) {
            if (token.isCancellationRequested) {
                run.skipped(test);
                continue;
            }
            run.started(test);
            const testFilePath = test.uri?.fsPath;
            const args = ['-v'];
            // If running a specific test function (id contains ::)
            if (test.id.includes('::')) {
                const funcName = test.id.split('::')[1];
                args.push('--run', `^${funcName}$`);
            }
            if (testFilePath) {
                args.push(testFilePath);
            }
            await new Promise((resolve) => {
                const proc = (0, child_process_1.spawn)(auratest, args, { cwd: workspaceFolder });
                let stdout = '';
                let stderr = '';
                proc.stdout.on('data', (d) => { stdout += d.toString(); });
                proc.stderr.on('data', (d) => { stderr += d.toString(); });
                proc.on('close', (code) => {
                    const output = stdout + stderr;
                    run.appendOutput(output.replace(/\n/g, '\r\n'));
                    if (code === 0) {
                        run.passed(test);
                    }
                    else {
                        run.failed(test, new vscode.TestMessage(stderr || stdout || `Test exited with code ${code}`));
                    }
                    resolve();
                });
                proc.on('error', (err) => {
                    run.errored(test, new vscode.TestMessage(`Failed to execute auratest: ${err.message}`));
                    resolve();
                });
            });
        }
        run.end();
    }, true);
    context.subscriptions.push(runProfile);
    return controller;
}
async function discoverTests(controller) {
    const testFiles = await vscode.workspace.findFiles('**/{*_test.aura,test_*.aura,tests/*.aura}', '**/node_modules/**');
    for (const file of testFiles) {
        const id = file.toString();
        const label = path.basename(file.fsPath);
        let testItem = controller.items.get(id);
        if (!testItem) {
            testItem = controller.createTestItem(id, label, file);
            controller.items.add(testItem);
        }
        // Parse individual test and benchmark functions in file
        try {
            const doc = await vscode.workspace.openTextDocument(file);
            const content = doc.getText();
            const lines = content.split('\n');
            testItem.children.replace([]);
            let hasDecorator = false;
            lines.forEach((line, index) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('@test') || trimmed.startsWith('@bench')) {
                    hasDecorator = true;
                    return;
                }
                // Match test functions: fn test_xxx, fn TestXxx, fn bench_xxx, fn BenchmarkXxx, or decorated fn xxx
                const match = line.match(/^\s*(?:export\s+)?(?:async\s+)?fn\s+((?:test_|Test|bench_|Benchmark)[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)/);
                if (match) {
                    const funcName = match[1];
                    const isTestFn = funcName.startsWith('test_') ||
                        funcName.startsWith('Test') ||
                        funcName.startsWith('bench_') ||
                        funcName.startsWith('Benchmark') ||
                        hasDecorator;
                    if (isTestFn) {
                        const childId = `${id}::${funcName}`;
                        const isBench = funcName.startsWith('bench_') || funcName.startsWith('Benchmark');
                        const childItem = controller.createTestItem(childId, `${isBench ? '⚡ ' : '🧪 '}${funcName}`, file);
                        childItem.range = new vscode.Range(index, 0, index, line.length);
                        testItem?.children.add(childItem);
                    }
                }
                hasDecorator = false;
            });
        }
        catch {
            // Document read failed, retain file-level test item
        }
    }
}
//# sourceMappingURL=testController.js.map