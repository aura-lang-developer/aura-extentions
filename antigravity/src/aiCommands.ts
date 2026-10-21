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
                `Aura AI: Prompt generated for ${fileName}! Copied to clipboard. Paste into AI Agent chat to generate tests.`,
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
            vscode.window.showInformationMessage('Aura AI: CSP Concurrency prompt copied to clipboard! Paste into AI Chat.');
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
            vscode.window.showInformationMessage('Aura AI: Struct Method Receivers prompt copied to clipboard! Paste into AI Chat.');
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
            vscode.window.showInformationMessage('Aura AI: Backend HTTP Service prompt copied to clipboard! Paste into AI Chat.');
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
            const choice = await vscode.window.showQuickPick([
                { label: '$(file) Active File Architecture', description: editor ? path.basename(editor.document.fileName) : 'No active file', scope: 'file' },
                { label: '$(project) Entire Workspace Architecture', description: 'Analyze all .aura files in workspace', scope: 'workspace' }
            ], {
                placeHolder: 'Select scope for Architecture & Concurrency Visualizer'
            });

            if (!choice) return;

            let title = 'Aura Architecture Visualizer';
            let filesToAnalyze: { name: string; content: string }[] = [];

            if (choice.scope === 'file') {
                if (!editor) {
                    vscode.window.showWarningMessage('Please open an Aura file first.');
                    return;
                }
                title = `Architecture: ${path.basename(editor.document.fileName)}`;
                filesToAnalyze.push({
                    name: path.basename(editor.document.fileName),
                    content: editor.document.getText()
                });
            } else {
                title = 'Workspace Architecture & Concurrency';
                const found = await vscode.workspace.findFiles('**/*.aura', '**/node_modules/**');
                for (const uri of found) {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    filesToAnalyze.push({
                        name: path.basename(uri.fsPath),
                        content: doc.getText()
                    });
                }
            }

            const panel = vscode.window.createWebviewPanel(
                'auraArchitectureVisualizer',
                title,
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );

            panel.webview.html = buildMultiFileArchitectureHtml(filesToAnalyze, title);
        })
    );
}

function sanitizeId(str: string): string {
    return str.replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildMultiFileArchitectureHtml(files: { name: string; content: string }[], title: string): string {
    let mermaidLines: string[] = ['graph TD'];

    for (const file of files.slice(0, 12)) {
        const fileSubId = `mod_${sanitizeId(file.name)}`;
        mermaidLines.push(`  subgraph ${fileSubId}["📁 ${file.name}"]`);

        const lines = file.content.split('\n');
        const structs: string[] = [];
        const interfaces: string[] = [];
        const receiverMethods: { recv: string; name: string }[] = [];
        const functions: string[] = [];
        const channels: string[] = [];

        for (const line of lines) {
            const recvMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?fn\s*\(\s*[a-zA-Z0-9_]+\s*:\s*(\*?[a-zA-Z0-9_]+)\s*\)\s*([a-zA-Z0-9_]+)/);
            if (recvMatch) {
                receiverMethods.push({ recv: recvMatch[1], name: recvMatch[2] });
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

        for (const s of structs.slice(0, 5)) {
            const sId = `${fileSubId}_s_${sanitizeId(s)}`;
            mermaidLines.push(`    ${sId}["🏛️ struct ${s}"]`);
        }
        for (const iface of interfaces.slice(0, 4)) {
            const iId = `${fileSubId}_i_${sanitizeId(iface)}`;
            mermaidLines.push(`    ${iId}["📑 interface ${iface}"]`);
        }
        for (const m of receiverMethods.slice(0, 6)) {
            const mId = `${fileSubId}_m_${sanitizeId(m.recv)}_${sanitizeId(m.name)}`;
            mermaidLines.push(`    ${mId}["⚙️ (${m.recv}) ${m.name}()"]`);
        }
        for (const f of functions.slice(0, 6)) {
            const fId = `${fileSubId}_f_${sanitizeId(f)}`;
            mermaidLines.push(`    ${fId}["⚡ fn ${f}()"]`);
        }
        for (const ch of channels.slice(0, 4)) {
            const chId = `${fileSubId}_c_${sanitizeId(ch)}`;
            mermaidLines.push(`    ${chId}(("📨 chan ${ch}"))`);
        }

        mermaidLines.push('  end');
    }

    const mermaidDefinition = mermaidLines.join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #121214;
            color: #f4f4f5;
            padding: 24px;
            margin: 0;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #27272a;
            padding-bottom: 12px;
        }
        h2 {
            color: #38bdf8;
            font-size: 1.4rem;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .card {
            background: #18181b;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #27272a;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .mermaid {
            background: #111113;
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            text-align: center;
        }
        .legend {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            font-size: 0.85rem;
            color: #a1a1aa;
            flex-wrap: wrap;
        }
        .badge {
            background: #27272a;
            border: 1px solid #3f3f46;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🌌 ${title}</h2>
        <div style="font-size: 12px; color: #71717a;">Rendered via Mermaid Engine</div>
    </div>
    <div class="card">
        <div class="mermaid">
${mermaidDefinition}
        </div>
        <div class="legend">
            <span class="badge">🏛️ Structs</span>
            <span class="badge">📑 Interfaces</span>
            <span class="badge">⚙️ Method Receivers</span>
            <span class="badge">⚡ Functions</span>
            <span class="badge">📨 CSP Channels</span>
        </div>
    </div>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    </script>
</body>
</html>`;
}
