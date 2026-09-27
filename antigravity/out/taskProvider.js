"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraTaskProvider = void 0;
const vscode = require("vscode");
class AuraTaskProvider {
    constructor(resolveBinary) {
        this.resolveBinary = resolveBinary;
    }
    provideTasks() {
        return this.getAuraTasks();
    }
    resolveTask(task) {
        return task;
    }
    getAuraTasks() {
        const tasks = [];
        const aurac = this.resolveBinary('aurac', 'compiler.path');
        const auratest = this.resolveBinary('auratest', 'compiler.path');
        const aurafmt = this.resolveBinary('aurafmt', 'compiler.path');
        // 1. Build Task
        const buildTask = new vscode.Task({ type: AuraTaskProvider.AuraType, command: 'build' }, vscode.TaskScope.Workspace, 'Build Active File', 'aura', new vscode.ShellExecution(`${aurac} build "\${file}" --standalone`), ['$aurac']);
        buildTask.group = vscode.TaskGroup.Build;
        tasks.push(buildTask);
        // 2. Type Check Task
        const checkTask = new vscode.Task({ type: AuraTaskProvider.AuraType, command: 'check' }, vscode.TaskScope.Workspace, 'Type Check Active File', 'aura', new vscode.ShellExecution(`${aurac} check "\${file}"`), ['$aurac']);
        tasks.push(checkTask);
        // 3. Test Suite Task
        const testTask = new vscode.Task({ type: AuraTaskProvider.AuraType, command: 'test' }, vscode.TaskScope.Workspace, 'Run Test Suite', 'aura', new vscode.ShellExecution(`${auratest}`));
        testTask.group = vscode.TaskGroup.Test;
        tasks.push(testTask);
        // 4. Format Task
        const fmtTask = new vscode.Task({ type: AuraTaskProvider.AuraType, command: 'format' }, vscode.TaskScope.Workspace, 'Format Workspace (aurafmt)', 'aura', new vscode.ShellExecution(`${aurafmt} -w .`));
        tasks.push(fmtTask);
        return tasks;
    }
}
exports.AuraTaskProvider = AuraTaskProvider;
AuraTaskProvider.AuraType = 'aura';
//# sourceMappingURL=taskProvider.js.map