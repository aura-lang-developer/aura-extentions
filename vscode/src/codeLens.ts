import * as vscode from 'vscode';

export class AuraTestCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    public provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        if (!document.fileName.endsWith('_test.aura')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // File-level CodeLens at top of file
        const topRange = new vscode.Range(0, 0, 0, 0);
        codeLenses.push(
            new vscode.CodeLens(topRange, {
                title: '$(beaker) Run File Tests',
                tooltip: 'Run all tests in this test file with auratest',
                command: 'aura.runActiveTestFile',
                arguments: [document.uri]
            })
        );

        // Function-level CodeLens for each test and benchmark
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^\s*(?:export\s+)?fn\s+((?:test_|Test|benchmark_|Benchmark)[a-zA-Z0-9_]*)/);
            if (match) {
                const testName = match[1];
                const isBenchmark = testName.startsWith('benchmark_') || testName.startsWith('Benchmark');
                const range = new vscode.Range(i, 0, i, line.length);
                codeLenses.push(
                    new vscode.CodeLens(range, {
                        title: isBenchmark ? '$(dashboard) Run Benchmark' : '$(play) Run Test',
                        tooltip: `Run ${testName} with auratest`,
                        command: 'aura.runSingleTest',
                        arguments: [document.uri, testName]
                    })
                );
            }
        }

        return codeLenses;
    }

    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }
}
