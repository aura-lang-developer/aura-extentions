import * as vscode from 'vscode';
import { resolveAuraTool, resolveBinary } from './utils';

export class AuraTaskProvider implements vscode.TaskProvider {
    static readonly AuraType = 'aura';

    constructor(private _resolveBinary: (bin: string, key: string) => string) {}

    public provideTasks(): vscode.ProviderResult<vscode.Task[]> {
        return this.getAuraTasks();
    }

    public resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
        return task;
    }

    private getAuraTasks(): vscode.Task[] {
        const tasks: vscode.Task[] = [];
        const aurac = resolveBinary('aurac', 'compiler.path');
        const auratestTool = resolveAuraTool('auratest');
        const aurafmtTool = resolveAuraTool('aurafmt');

        const auratestCmd = auratestTool.prefixArgs.length > 0
            ? `${auratestTool.executable} ${auratestTool.prefixArgs.join(' ')}`
            : auratestTool.executable;

        const aurafmtCmd = aurafmtTool.prefixArgs.length > 0
            ? `${aurafmtTool.executable} ${aurafmtTool.prefixArgs.join(' ')}`
            : aurafmtTool.executable;

        // 1. Build Standalone Native (Cranelift)
        const buildNativeTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'build-native' },
            vscode.TaskScope.Workspace,
            'Build Standalone Native Binary (Cranelift)',
            'aura',
            new vscode.ShellExecution(`${aurac} build "\${file}" -o "\${fileBasenameNoExtension}" --target native`),
            ['$aurac']
        );
        buildNativeTask.group = vscode.TaskGroup.Build;
        tasks.push(buildNativeTask);

        // 2. Build Release Optimized (-O3, SIMD, Dead-code strip)
        const buildReleaseTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'build-release' },
            vscode.TaskScope.Workspace,
            'Build Release Standalone Binary (-O3, SIMD)',
            'aura',
            new vscode.ShellExecution(`${aurac} build "\${file}" -o "\${fileBasenameNoExtension}" --target native --release -O3`),
            ['$aurac']
        );
        tasks.push(buildReleaseTask);

        // 3. Build Go Backend
        const buildGoTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'build-go' },
            vscode.TaskScope.Workspace,
            'Build Native Executable via Go Toolchain',
            'aura',
            new vscode.ShellExecution(`${aurac} build "\${file}" -o "\${fileBasenameNoExtension}" --target go`),
            ['$aurac']
        );
        tasks.push(buildGoTask);

        // 4. Type Check Task
        const checkTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'check' },
            vscode.TaskScope.Workspace,
            'Type Check Active File (aurac check)',
            'aura',
            new vscode.ShellExecution(`${aurac} check "\${file}"`),
            ['$aurac']
        );
        tasks.push(checkTask);

        // 5. Run Active File Task
        const runTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'run' },
            vscode.TaskScope.Workspace,
            'Run Active File (aurac run)',
            'aura',
            new vscode.ShellExecution(`${aurac} run "\${file}"`)
        );
        tasks.push(runTask);

        // 6. Interactive Step Debugger Task
        const stepTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'step' },
            vscode.TaskScope.Workspace,
            'Step Debug Active File (aurac step)',
            'aura',
            new vscode.ShellExecution(`${aurac} step "\${file}"`)
        );
        tasks.push(stepTask);

        // 7. Test Suite Task
        const testTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'test' },
            vscode.TaskScope.Workspace,
            'Run Test Suite (auratest / aurac test)',
            'aura',
            new vscode.ShellExecution(`${auratestCmd} -v`)
        );
        testTask.group = vscode.TaskGroup.Test;
        tasks.push(testTask);

        // 8. Test Suite with Coverage Task
        const testCoverageTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'test-coverage' },
            vscode.TaskScope.Workspace,
            'Run Test Suite with Code Coverage (auratest -cover)',
            'aura',
            new vscode.ShellExecution(`${auratestCmd} -v -cover`)
        );
        tasks.push(testCoverageTask);

        // 9. Generate HTML Coverage Report Task
        const testCoverageHtmlTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'coverage-html' },
            vscode.TaskScope.Workspace,
            'Generate HTML Coverage Report (auratest --coverage-html coverage.html)',
            'aura',
            new vscode.ShellExecution(`${auratestCmd} --coverage-html coverage.html`)
        );
        tasks.push(testCoverageHtmlTask);

        // 10. Benchmarks Task
        const benchTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'bench' },
            vscode.TaskScope.Workspace,
            'Run Benchmarks (aurac test --bench)',
            'aura',
            new vscode.ShellExecution(`${aurac} test --bench`)
        );
        tasks.push(benchTask);

        // 11. Format Workspace Task
        const fmtTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'format' },
            vscode.TaskScope.Workspace,
            'Format Workspace (aurafmt -w .)',
            'aura',
            new vscode.ShellExecution(`${aurafmtCmd} -w .`)
        );
        tasks.push(fmtTask);

        // 12. Format Active File Task
        const fmtFileTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'format-file' },
            vscode.TaskScope.Workspace,
            'Format Active File (aurafmt -w ${file})',
            'aura',
            new vscode.ShellExecution(`${aurafmtCmd} -w "\${file}"`)
        );
        tasks.push(fmtFileTask);

        // 13. Module Tidy Task
        const modTidyTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-tidy' },
            vscode.TaskScope.Workspace,
            'Module: Tidy Dependencies (aurac mod tidy)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod tidy`)
        );
        tasks.push(modTidyTask);

        // 14. Module Verify Task
        const modVerifyTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-verify' },
            vscode.TaskScope.Workspace,
            'Module: Verify Cryptographic Hashes (aurac mod verify)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod verify`)
        );
        tasks.push(modVerifyTask);

        // 15. Module Vendor Task
        const modVendorTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-vendor' },
            vscode.TaskScope.Workspace,
            'Module: Vendor Dependencies Locally (aurac mod vendor)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod vendor`)
        );
        tasks.push(modVendorTask);

        // 16. Live Watch Task
        const watchTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'watch' },
            vscode.TaskScope.Workspace,
            'Live Recompilation Watch Mode (aurac watch --run)',
            'aura',
            new vscode.ShellExecution(`${aurac} watch "\${file}" --run`)
        );
        tasks.push(watchTask);

        return tasks;
    }
}
