import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { resolveAuraTool } from './utils';

export function createAuraTestController(
    context: vscode.ExtensionContext,
    _resolveBinary: (bin: string, key: string) => string
): vscode.TestController {
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

    // 1. Standard Run Profile
    const runProfile = controller.createRunProfile(
        'Run Aura Tests',
        vscode.TestRunProfileKind.Run,
        async (request, token) => {
            await executeTestRun(controller, request, token, false);
        },
        true
    );
    context.subscriptions.push(runProfile);

    // 2. Coverage Profile
    const coverageProfile = controller.createRunProfile(
        'Run Aura Tests with Coverage',
        vscode.TestRunProfileKind.Coverage,
        async (request, token) => {
            await executeTestRun(controller, request, token, true);
        },
        false
    );
    context.subscriptions.push(coverageProfile);

    return controller;
}

async function executeTestRun(
    controller: vscode.TestController,
    request: vscode.TestRunRequest,
    token: vscode.CancellationToken,
    withCoverage: boolean
) {
    const run = controller.createTestRun(request);
    const resolvedTool = resolveAuraTool('auratest');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    const queue: vscode.TestItem[] = [];
    if (request.include) {
        request.include.forEach(t => queue.push(t));
    } else {
        controller.items.forEach(t => queue.push(t));
    }

    for (const test of queue) {
        if (token.isCancellationRequested) {
            run.skipped(test);
            continue;
        }

        run.started(test);
        const testFilePath = test.uri?.fsPath;
        const args: string[] = [...resolvedTool.prefixArgs, '-v'];

        if (withCoverage) {
            args.push('-cover');
        }

        // If running a specific test or benchmark function (id contains ::)
        if (test.id.includes('::')) {
            const parts = test.id.split('::');
            const funcName = parts[1];
            const isBench = parts.length > 2 && parts[2] === 'bench';

            if (isBench) {
                args.push('-bench', `^${funcName}$`);
            } else {
                args.push('-run', `^${funcName}$`);
            }
        }

        if (testFilePath) {
            args.push(testFilePath);
        }

        await new Promise<void>((resolve) => {
            const proc = spawn(resolvedTool.executable, args, { cwd: workspaceFolder });
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (d) => { stdout += d.toString(); });
            proc.stderr.on('data', (d) => { stderr += d.toString(); });

            proc.on('close', (code) => {
                const output = stdout + stderr;
                run.appendOutput(output.replace(/\n/g, '\r\n'));

                if (code === 0) {
                    run.passed(test);
                } else {
                    run.failed(test, new vscode.TestMessage(stderr || stdout || `Test exited with code ${code}`));
                }
                resolve();
            });

            proc.on('error', (err) => {
                run.errored(test, new vscode.TestMessage(`Failed to execute ${resolvedTool.executable}: ${err.message}`));
                resolve();
            });
        });
    }

    run.end();
}

async function discoverTests(controller: vscode.TestController) {
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
            let decoratorType: 'test' | 'bench' | null = null;

            lines.forEach((line, index) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('@test')) {
                    decoratorType = 'test';
                    return;
                }
                if (trimmed.startsWith('@bench')) {
                    decoratorType = 'bench';
                    return;
                }

                // Preserve decorator across comments and blank lines
                if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                    return;
                }

                // Match functions: fn test_xxx, fn TestXxx, fn bench_xxx, fn BenchmarkXxx, or decorated fn
                const match = line.match(/^\s*(?:export\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/);
                if (match) {
                    const funcName = match[1];
                    const isBench = funcName.startsWith('bench_') || funcName.startsWith('Benchmark') || decoratorType === 'bench';
                    const isTest = funcName.startsWith('test_') || funcName.startsWith('Test') || decoratorType === 'test';

                    if (isTest || isBench) {
                        const childId = `${id}::${funcName}${isBench ? '::bench' : ''}`;
                        const childItem = controller.createTestItem(childId, `${isBench ? '⚡ ' : '🧪 '}${funcName}`, file);
                        childItem.range = new vscode.Range(index, 0, index, line.length);
                        testItem?.children.add(childItem);
                    }
                }
                decoratorType = null;
            });
        } catch {
            // Document read failed, retain file-level test item
        }
    }
}
