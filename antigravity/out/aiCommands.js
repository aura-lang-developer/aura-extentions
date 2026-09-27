"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuraAiCommands = registerAuraAiCommands;
const vscode = require("vscode");
const path = require("path");
function registerAuraAiCommands(context) {
    // 1. Generate Tests with AI
    context.subscriptions.push(vscode.commands.registerCommand('aura.ai.generateTests', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura source file first.');
            return;
        }
        const selection = editor.selection;
        const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        const fileName = path.basename(editor.document.fileName);
        const prompt = `Generate a comprehensive test suite using Aura Language's built-in 'auratest' framework for the following code from ${fileName}:\n\n\`\`\`aura\n${text}\n\`\`\`\n\nInclude unit tests, assertions with assert() and assert_eq(), edge cases, and benchmarks.`;
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage(`Aura AI: Prompt generated for ${fileName}! Copied to clipboard. Paste into Antigravity AI Agent chat to generate tests.`, 'Open Test File').then(async (action) => {
            if (action === 'Open Test File') {
                const testFileName = editor.document.fileName.replace(/\.aura$/, '_test.aura');
                const uri = vscode.Uri.file(testFileName);
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
            }
        });
    }));
    // 2. Refactor to CSP Concurrency
    context.subscriptions.push(vscode.commands.registerCommand('aura.ai.refactorCsp', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            vscode.window.showWarningMessage('Please open an Aura source file first.');
            return;
        }
        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        const prompt = `Refactor the following Aura code to use Go-style CSP concurrency with lightweight fibers (spawn), channels (Channel<T>::new(buffer)), channel send/receive (ch <- val, <-ch), and select multiplexing:\n\n\`\`\`aura\n${code}\n\`\`\``;
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage('Aura AI: CSP Concurrency prompt copied to clipboard! Paste into Antigravity Chat.');
    }));
    // 3. Explain Type & Exhaustiveness Analysis
    context.subscriptions.push(vscode.commands.registerCommand('aura.ai.explainType', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'aura') {
            return;
        }
        const pos = editor.selection.active;
        const wordRange = editor.document.getWordRangeAtPosition(pos);
        const word = wordRange ? editor.document.getText(wordRange) : 'selected type';
        const prompt = `Explain the Aura algebraic data type or interface '${word}', analyze its variants and provide an exhaustive pattern matching skeleton with match ${word} { ... } handling all arms cleanly.`;
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage(`Aura AI: Type explanation & exhaustiveness prompt for '${word}' copied to clipboard.`);
    }));
    // 4. One-Click Smart Fix for Diagnostics
    context.subscriptions.push(vscode.commands.registerCommand('aura.ai.fixDiagnostic', async () => {
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
    }));
    // 5. Architecture & Concurrency Visualizer
    context.subscriptions.push(vscode.commands.registerCommand('aura.ai.visualizeArchitecture', async () => {
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        const text = doc ? doc.getText() : '';
        const panel = vscode.window.createWebviewPanel('auraArchitectureVisualizer', 'Aura Architecture & Concurrency Visualizer', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = getArchitectureHtml(text, doc ? path.basename(doc.fileName) : 'Aura Project');
    }));
}
function getArchitectureHtml(sourceCode, fileName) {
    // Generate simple Mermaid graph by scanning items
    const lines = sourceCode.split('\n');
    const functions = [];
    const channels = [];
    const types = [];
    for (const line of lines) {
        const fnMatch = line.match(/^\s*(?:export\s+)?fn\s+([a-zA-Z0-9_]+)/);
        if (fnMatch)
            functions.push(fnMatch[1]);
        const chMatch = line.match(/(?:let\s+)?([a-zA-Z0-9_]+)\s*=\s*Channel/);
        if (chMatch)
            channels.push(chMatch[1]);
        const tyMatch = line.match(/^\s*(?:export\s+)?type\s+([a-zA-Z0-9_]+)/);
        if (tyMatch)
            types.push(tyMatch[1]);
    }
    let mermaidGraph = 'graph TD\\n';
    mermaidGraph += `  subgraph Module["${fileName}"]\\n`;
    for (const f of functions.slice(0, 8)) {
        mermaidGraph += `    fn_${f}["fn ${f}()"]\\n`;
    }
    for (const ch of channels.slice(0, 5)) {
        mermaidGraph += `    chan_${ch}(("chan ${ch}"))\\n`;
    }
    for (const t of types.slice(0, 5)) {
        mermaidGraph += `    type_${t}["type ${t}"]\\n`;
    }
    mermaidGraph += '  end\\n';
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Aura Architecture Visualizer</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { font-family: sans-serif; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        .card { background: #252526; border: 1px solid #3c3c3c; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        h2 { margin-top: 0; color: #4ec9b0; }
        .mermaid { display: flex; justify-content: center; }
    </style>
</head>
<body>
    <div class="card">
        <h2>⚡ Aura Architecture & Concurrency Visualizer</h2>
        <p>Visualizing structure, channels, and types for <code>${fileName}</code>.</p>
    </div>
    <div class="card">
        <div class="mermaid">
            ${mermaidGraph.replace(/\\n/g, '\n')}
        </div>
    </div>
    <script>
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    </script>
</body>
</html>`;
}
//# sourceMappingURL=aiCommands.js.map