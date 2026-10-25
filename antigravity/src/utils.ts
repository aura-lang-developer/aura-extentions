import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function resolveBinary(binaryName: string, configPathKey: string): string {
    const config = vscode.workspace.getConfiguration('aura');
    const customPath = config.get<string>(configPathKey);
    if (customPath && customPath.trim() !== '') {
        return customPath.trim();
    }

    // 1. Check workspace target/release or target/debug
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const releaseBin = path.join(folder.uri.fsPath, 'target', 'release', binaryName);
            if (fs.existsSync(releaseBin)) {
                return releaseBin;
            }
            const debugBin = path.join(folder.uri.fsPath, 'target', 'debug', binaryName);
            if (fs.existsSync(debugBin)) {
                return debugBin;
            }
        }
    }

    // 2. Check standard user and system binary paths (fixes GUI launch without shell PATH on macOS/Linux)
    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';
    const exeSuffix = isWindows ? '.exe' : '';
    const candidatePaths = [
        path.join(homeDir, '.cargo', 'bin', binaryName + exeSuffix),
        path.join(homeDir, '.aura', 'bin', binaryName + exeSuffix),
        path.join(homeDir, '.local', 'bin', binaryName + exeSuffix),
        '/opt/homebrew/bin/' + binaryName,
        '/usr/local/bin/' + binaryName,
        '/usr/bin/' + binaryName,
    ];

    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return binaryName;
}

export interface ResolvedCommand {
    executable: string;
    prefixArgs: string[];
}

/**
 * Resolves an Aura tool, automatically falling back to `aurac <subcommand>`
 * if dedicated binaries (auralsp, auratest, aurafmt) are not present.
 */
export function resolveAuraTool(toolName: 'auralsp' | 'auratest' | 'aurafmt' | 'aurac'): ResolvedCommand {
    const directBin = resolveBinary(
        toolName,
        toolName === 'auralsp' ? 'server.path' : 'compiler.path'
    );

    if (fs.existsSync(directBin)) {
        return { executable: directBin, prefixArgs: [] };
    }

    // Fallback logic to aura or aurac
    if (toolName !== 'aurac') {
        const aura = resolveBinary('aura', 'compiler.path');
        const aurac = resolveBinary('aurac', 'compiler.path');
        const compilerBin = fs.existsSync(aura) ? aura : aurac;

        const subcommand = toolName === 'auralsp' ? 'lsp' :
                           toolName === 'auratest' ? 'test' :
                           toolName === 'aurafmt' ? 'fmt' : '';

        return {
            executable: compilerBin,
            prefixArgs: subcommand ? [subcommand] : []
        };
    }

    return { executable: directBin, prefixArgs: [] };
}
