"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraDebugConfigurationProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class AuraDebugConfigurationProvider {
    constructor(resolveBinary) {
        this.resolveBinary = resolveBinary;
    }
    /**
     * Provide default configurations when launch.json is generated.
     */
    provideDebugConfigurations(_folder, _token) {
        return [
            {
                type: 'aura',
                request: 'launch',
                name: 'Debug Active Aura File',
                program: '${file}',
                args: [],
                stopOnEntry: false,
                sourceMaps: true
            },
            {
                type: 'aura',
                request: 'attach',
                name: 'Attach to Aura Process',
                port: 9229,
                address: '127.0.0.1'
            }
        ];
    }
    /**
     * Resolves an Aura debug configuration before launching.
     * Hooks into the built-in Node debugger ('pwa-node') while automatically
     * compiling the Aura source file with full Source Maps V3.
     */
    async resolveDebugConfiguration(folder, config, _token) {
        // If no config was provided (e.g. user pressed F5 directly on an .aura file)
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'aura') {
                config.type = 'aura';
                config.name = `Debug Aura: ${path.basename(editor.document.fileName)}`;
                config.request = 'launch';
                config.program = editor.document.fileName;
            }
            else {
                vscode.window.showErrorMessage('No active Aura file to debug.');
                return null;
            }
        }
        // Handle 'attach' request
        if (config.request === 'attach') {
            return {
                type: 'pwa-node',
                request: 'attach',
                name: config.name || 'Attach to Aura',
                port: config.port || 9229,
                address: config.address || '127.0.0.1',
                sourceMaps: true,
                resolveSourceMapLocations: ['**', '!**/node_modules/**'],
                skipFiles: [
                    '<node_internals>/**',
                    '**/node_modules/**',
                    '**/aura:runtime*',
                    '**/*.runtime.js'
                ],
                smartStep: true
            };
        }
        // Handle 'launch' request
        let program = config.program;
        if (!program || program === '${file}') {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'aura') {
                program = editor.document.fileName;
            }
            else {
                vscode.window.showErrorMessage('Please open or specify an Aura (.aura) file to debug.');
                return null;
            }
        }
        // Save documents before compiling
        await vscode.workspace.saveAll();
        const auracPath = this.resolveBinary('aurac', 'compiler.path');
        const programPath = path.isAbsolute(program)
            ? program
            : path.join(folder ? folder.uri.fsPath : process.cwd(), program);
        if (!fs.existsSync(programPath)) {
            vscode.window.showErrorMessage(`Aura source file not found: ${programPath}`);
            return null;
        }
        const projectDir = folder ? folder.uri.fsPath : path.dirname(programPath);
        const outDir = path.join(projectDir, '.aura', 'debug');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        const baseName = path.basename(programPath, path.extname(programPath));
        const targetJs = path.join(outDir, `${baseName}.mjs`);
        // Compile .aura file with sourcemaps using aurac
        try {
            await execFileAsync(auracPath, ['compile', programPath, '-o', targetJs]);
        }
        catch (err) {
            const stderr = err.stderr || err.message || String(err);
            vscode.window.showErrorMessage(`Aura compilation failed before debug:\n${stderr}`);
            return null;
        }
        // Ensure targetJs has main auto-invocation if main exists and is not already invoked
        if (fs.existsSync(targetJs)) {
            let jsContent = fs.readFileSync(targetJs, 'utf8');
            if (!jsContent.includes('__aura_invoked_main') && (jsContent.includes('function main(') || jsContent.includes('const main ='))) {
                jsContent += `\n\n// Auto-invoke main entrypoint for debugger\nconst __aura_invoked_main = true;\nif (typeof main === 'function') {\n  const __r = main();\n  if (__r && typeof __r.then === 'function') {\n    __r.catch(_e => { console.error(_e); if (typeof process !== 'undefined') process.exit(1); });\n  }\n}\n`;
                fs.writeFileSync(targetJs, jsContent, 'utf8');
            }
        }
        // Delegate execution to the official high-performance Node debugger ('pwa-node')
        // with Source Maps V3 automatically mapped back to .aura files
        return {
            type: 'pwa-node',
            request: 'launch',
            name: config.name || `Debug Aura: ${path.basename(programPath)}`,
            program: targetJs,
            args: config.args || [],
            cwd: config.cwd || (folder ? folder.uri.fsPath : path.dirname(programPath)),
            stopOnEntry: config.stopOnEntry ?? false,
            sourceMaps: true,
            resolveSourceMapLocations: [
                `${outDir}/**`,
                `${path.dirname(programPath)}/**`,
                '**',
                '!**/node_modules/**'
            ],
            outFiles: [
                `${outDir}/**/*.mjs`,
                `${outDir}/**/*.js`,
                `${path.dirname(programPath)}/**/*.mjs`,
                `${path.dirname(programPath)}/**/*.js`
            ],
            runtimeArgs: ['--enable-source-maps'],
            skipFiles: [
                '<node_internals>/**',
                '**/node_modules/**',
                '**/aura:runtime*',
                '**/*.runtime.js'
            ],
            smartStep: true,
            console: config.console || 'integratedTerminal',
            internalConsoleOptions: 'neverOpen'
        };
    }
}
exports.AuraDebugConfigurationProvider = AuraDebugConfigurationProvider;
//# sourceMappingURL=debug.js.map