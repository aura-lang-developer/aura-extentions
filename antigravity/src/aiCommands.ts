import * as vscode from 'vscode';
import * as path from 'path';

export function registerAuraAiCommands(context: vscode.ExtensionContext) {
    // 1. Generate Tests with AI (auratest)
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                vscode.window.showWarningMessage('Please open an Aura source file first.');
                return;
            }

            const selection = editor.selection;
            const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
            const fileName = path.basename(editor.document.fileName);
            const prompt = `Generate a comprehensive test and benchmark suite using Aura Language's built-in 'auratest' engine for the following code from ${fileName}:\n\n\`\`\`aura\n${text}\n\`\`\`\n\nInclude unit tests with @test, assertions (assert, assert_eq), edge cases, concurrency tests with channels/spawn, and benchmarks with @bench.`;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(
                `Aura AI: Prompt generated for ${fileName}! Copied to clipboard. Paste into Antigravity AI Agent chat to generate tests.`,
                'Open Test File'
            ).then(async (action) => {
                if (action === 'Open Test File') {
                    const testFileName = editor.document.fileName.replace(/\.aura$/, '_test.aura');
                    const uri = vscode.Uri.file(testFileName);
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                }
            });
        })
    );

    // 2. Refactor to CSP Concurrency
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.refactorCsp', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                vscode.window.showWarningMessage('Please open an Aura source file first.');
                return;
            }

            const selection = editor.selection;
            const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
            const prompt = `Refactor the following Aura code to use Go-style CSP concurrency with lightweight fibers (spawn), channels (Channel.new(buffer)), channel send/receive (channel <- value, <-channel), thread-safe sync.Mutex with defer mu.unlock(), and select multiplexing:\n\n\`\`\`aura\n${code}\n\`\`\``;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Aura AI: CSP Concurrency prompt copied to clipboard! Paste into Antigravity Chat.');
        })
    );

    // 3. Refactor to Go-Style Struct Methods & Interfaces
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.refactorReceivers', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                vscode.window.showWarningMessage('Please open an Aura source file first.');
                return;
            }

            const selection = editor.selection;
            const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
            const prompt = `Refactor the following Aura code to use Golang-style domain structs (struct / export struct), method receivers (fn (self: Type) Method() for read-only vs fn (self: *Type) Method() for mutations), and duck-typed structural interfaces:\n\n\`\`\`aura\n${code}\n\`\`\``;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Aura AI: Struct Method Receivers prompt copied to clipboard! Paste into Antigravity Chat.');
        })
    );

    // 4. Generate HTTP Backend Service (ServeMux)
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.generateHttpService', async () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor?.selection;
            const code = selection && !selection.isEmpty ? editor.document.getText(selection) : '';

            const prompt = `Generate a high-performance backend microservice in Aura Lang using net/http style ServeMux (let mux = http.newServeMux()), logging/CORS middleware, dynamic route parameters (http.pathValue), thread-safe state synchronization with sync.Mutex and defer, and JSON responses (http.json):\n\n${code ? `Domain models:\n\`\`\`aura\n${code}\n\`\`\`\n` : ''}`;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage('Aura AI: Backend HTTP Service prompt copied to clipboard! Paste into Antigravity Chat.');
        })
    );

    // 5. Explain Type & Exhaustiveness Analysis
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.explainType', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                return;
            }

            const pos = editor.selection.active;
            const wordRange = editor.document.getWordRangeAtPosition(pos);
            const word = wordRange ? editor.document.getText(wordRange) : 'selected type';

            const prompt = `Explain the Aura type or interface '${word}', analyze its variants/fields, and provide an exhaustive pattern matching skeleton with match ${word} { ... } handling all arms cleanly.`;
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(`Aura AI: Type explanation & exhaustiveness prompt for '${word}' copied to clipboard.`);
        })
    );

    // 6. One-Click Smart Fix for Diagnostics
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.fixDiagnostic', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'aura') {
                return;
            }

            const diags = vscode.languages.getDiagnostics(editor.document.uri);
            if (diags.length === 0) {
                vscode.window.showInformationMessage('No active compiler diagnostics found in current file.');
                return;
            }

            const diagMessages = diags.map(d => `Line ${d.range.start.line + 1}: ${d.message}`).join('\n');
            const fileContent = editor.document.getText();
            const prompt = `Fix the following Aura compiler diagnostics in ${path.basename(editor.document.fileName)}:\n\n${diagMessages}\n\nSource code:\n\`\`\`aura\n${fileContent}\n\`\`\`\n\nExplain the root cause and provide the corrected code diff.`;

            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(`Aura AI: Diagnostic fix prompt for ${diags.length} issues copied to clipboard.`);
        })
    );

    // 7. Architecture & Concurrency Visualizer
    context.subscriptions.push(
        vscode.commands.registerCommand('aura.ai.visualizeArchitecture', async () => {
            const editor = vscode.window.activeTextEditor;
            const doc = editor?.document;
            const text = doc ? doc.getText() : '';

            const panel = vscode.window.createWebviewPanel(
                'auraArchitectureVisualizer',
                'Aura Architecture & Concurrency Visualizer',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );

            panel.webview.html = getArchitectureHtml(text, doc ? path.basename(doc.fileName) : 'Aura Project');
        })
    );
}

function getArchitectureHtml(sourceCode: string, fileName: string): string {
    const lines = sourceCode.split('\n');
    const functions: string[] = [];
    const receiverMethods: string[] = [];
    const structs: string[] = [];
    const interfaces: string[] = [];
    const channels: string[] = [];

    for (const line of lines) {
        const recvMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?fn\s*\(\s*[a-zA-Z0-9_]+\s*:\s*(\*?[a-zA-Z0-9_]+)\s*\)\s*([a-zA-Z0-9_]+)/);
        if (recvMatch) {
            receiverMethods.push(`(${recvMatch[1]}) ${recvMatch[2]}()`);
            continue;
        }

        const fnMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/);
        if (fnMatch) functions.push(fnMatch[1]);

        const structMatch = line.match(/^\s*(?:export\s+)?(?:packed\s+)?struct\s+([a-zA-Z0-9_]+)/);
        if (structMatch) structs.push(structMatch[1]);

        const ifaceMatch = line.match(/^\s*(?:export\s+)?interface\s+([a-zA-Z0-9_]+)/);
        if (ifaceMatch) interfaces.push(ifaceMatch[1]);

        const chMatch = line.match(/(?:let\s+)?([a-zA-Z0-9_]+)\s*=\s*Channel/);
        if (chMatch) channels.push(chMatch[1]);
    }

    let mermaidGraph = 'graph TD\\n';
    mermaidGraph += `  subgraph Module["📁 ${fileName}"]\\n`;

    for (const s of structs.slice(0, 6)) {
        mermaidGraph += `    struct_${s}["🏛️ struct ${s}"]\\n`;
    }
    for (const iface of interfaces.slice(0, 4)) {
        mermaidGraph += `    iface_${iface}["📑 interface ${iface}"]\\n`;
    }
    for (const m of receiverMethods.slice(0, 8)) {
        const cleanId = m.replace(/[^a-zA-Z0-9_]/g, '_');
        mermaidGraph += `    recv_${cleanId}["⚙️ ${m}"]\\n`;
    }
    for (const f of functions.slice(0, 8)) {
        mermaidGraph += `    fn_${f}["⚡ fn ${f}()"]\\n`;
    }
    for (const ch of channels.slice(0, 5)) {
        mermaidGraph += `    chan_${ch}(("📨 chan ${ch}"))\\n`;
    }
    mermaidGraph += '  end\\n';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Aura Architecture Visualizer</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #18181b; color: #f4f4f5; padding: 24px; margin: 0; }
        h2 { color: #38bdf8; font-size: 1.3rem; margin-top: 0; }
        .card { background: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #3f3f46; }
        .mermaid { background: #1e1e24; border-radius: 6px; padding: 16px; }
        .legend { display: flex; gap: 12px; margin-top: 12px; font-size: 0.85rem; color: #a1a1aa; flex-wrap: wrap; }
        .badge { background: #3f3f46; padding: 2px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <h2>🌌 Aura Architecture & Concurrency Visualizer</h2>
    <div class="card">
        <div class="mermaid">
${mermaidGraph}
        </div>
        <div class="legend">
            <span class="badge">🏛️ Structs</span>
            <span class="badge">📑 Interfaces</span>
            <span class="badge">⚙️ Receivers</span>
            <span class="badge">⚡ Functions</span>
            <span class="badge">📨 Channels</span>
        </div>
    </div>
    <script>
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    </script>
</body>
</html>`;
}
