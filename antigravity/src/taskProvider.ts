import * as vscode from 'vscode';

export class AuraTaskProvider implements vscode.TaskProvider {
    static readonly AuraType = 'aura';

    constructor(private resolveBinary: (bin: string, key: string) => string) {}

    public provideTasks(): vscode.ProviderResult<vscode.Task[]> {
        return this.getAuraTasks();
    }

    public resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
        return task;
    }

    private getAuraTasks(): vscode.Task[] {
        const tasks: vscode.Task[] = [];
        const aurac = this.resolveBinary('aurac', 'compiler.path');
        const auratest = this.resolveBinary('auratest', 'compiler.path');
        const aurafmt = this.resolveBinary('aurafmt', 'compiler.path');

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

        // 6. Test Suite Task
        const testTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'test' },
            vscode.TaskScope.Workspace,
            'Run Test Suite (auratest / aurac test)',
            'aura',
            new vscode.ShellExecution(`${auratest} -v`)
        );
        testTask.group = vscode.TaskGroup.Test;
        tasks.push(testTask);

        // 7. Benchmarks Task
        const benchTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'bench' },
            vscode.TaskScope.Workspace,
            'Run Benchmarks (aurac test --bench)',
            'aura',
            new vscode.ShellExecution(`${aurac} test --bench`)
        );
        tasks.push(benchTask);

        // 8. Format Workspace Task
        const fmtTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'format' },
            vscode.TaskScope.Workspace,
            'Format Workspace (aurafmt -w .)',
            'aura',
            new vscode.ShellExecution(`${aurafmt} -w .`)
        );
        tasks.push(fmtTask);

        // 9. Format Active File Task
        const fmtFileTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'format-file' },
            vscode.TaskScope.Workspace,
            'Format Active File (aurafmt -w ${file})',
            'aura',
            new vscode.ShellExecution(`${aurafmt} -w "\${file}"`)
        );
        tasks.push(fmtFileTask);

        // 10. Module Tidy Task
        const modTidyTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-tidy' },
            vscode.TaskScope.Workspace,
            'Module: Tidy Dependencies (aurac mod tidy)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod tidy`)
        );
        tasks.push(modTidyTask);

        // 11. Module Verify Task
        const modVerifyTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-verify' },
            vscode.TaskScope.Workspace,
            'Module: Verify Cryptographic Hashes (aurac mod verify)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod verify`)
        );
        tasks.push(modVerifyTask);

        // 12. Module Vendor Task
        const modVendorTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'mod-vendor' },
            vscode.TaskScope.Workspace,
            'Module: Vendor Dependencies Locally (aurac mod vendor)',
            'aura',
            new vscode.ShellExecution(`${aurac} mod vendor`)
        );
        tasks.push(modVendorTask);

        // 13. Live Watch Task
        const watchTask = new vscode.Task(
            { type: AuraTaskProvider.AuraType, command: 'watch' },
            vscode.TaskScope.Workspace,
            'Start Live Watch & Recompile Mode (aurac watch)',
            'aura',
            new vscode.ShellExecution(`${aurac} watch "\${file}" --run`)
        );
        tasks.push(watchTask);

        return tasks;
    }
}
