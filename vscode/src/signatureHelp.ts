import * as vscode from 'vscode';

interface AuraSignature {
    label: string;
    documentation: string;
    parameters: { label: string; documentation: string }[];
}

const SIGNATURES: Record<string, AuraSignature> = {
    'println': {
        label: 'println(value: Any): Unit',
        documentation: 'Prints a line to standard output (stdout) followed by a newline.',
        parameters: [{ label: 'value: Any', documentation: 'The expression or value to display.' }]
    },
    'print': {
        label: 'print(value: Any): Unit',
        documentation: 'Prints a value to standard output (stdout) without appending a newline.',
        parameters: [{ label: 'value: Any', documentation: 'The expression or value to display.' }]
    },
    'eprintln': {
        label: 'eprintln(value: Any): Unit',
        documentation: 'Prints a line to standard error (stderr) followed by a newline.',
        parameters: [{ label: 'value: Any', documentation: 'The expression or error message to display.' }]
    },
    'len': {
        label: 'len(container: List | String | Map | Set | Array): Int',
        documentation: 'Returns the number of elements or bytes in the collection or string in O(1) time.',
        parameters: [{ label: 'container: Any', documentation: 'The target data structure or string.' }]
    },
    'make': {
        label: 'make<T>(type: T, capacity: Int, length?: Int): T',
        documentation: 'Allocates and initializes slices, channels, or maps with specified capacity.',
        parameters: [
            { label: 'type: T', documentation: 'Target type definition.' },
            { label: 'capacity: Int', documentation: 'Initial preallocated buffer capacity.' },
            { label: 'length?: Int', documentation: 'Optional initial length for slices.' }
        ]
    },
    'assert': {
        label: 'assert(condition: Bool, message?: String): Unit',
        documentation: 'Evaluates condition; if false, aborts execution with assertion panic.',
        parameters: [
            { label: 'condition: Bool', documentation: 'Expression that must evaluate to true.' },
            { label: 'message?: String', documentation: 'Optional descriptive error message.' }
        ]
    },
    'assert_eq': {
        label: 'assert_eq<T>(actual: T, expected: T, message?: String): Unit',
        documentation: 'Asserts that actual and expected values are strictly equal (==).',
        parameters: [
            { label: 'actual: T', documentation: 'The actual computed value.' },
            { label: 'expected: T', documentation: 'The expected reference value.' },
            { label: 'message?: String', documentation: 'Optional descriptive error message.' }
        ]
    },
    'Channel.new': {
        label: 'Channel.new<T>(capacity: Int = 0): Channel<T>',
        documentation: 'Creates a CSP channel with optional buffer capacity (0 = unbuffered).',
        parameters: [{ label: 'capacity: Int = 0', documentation: 'Buffer size in elements.' }]
    },
    'Server.new': {
        label: 'Server.new(addr: String): Server',
        documentation: 'Initializes a new native HTTP server bound to the given host/port address.',
        parameters: [{ label: 'addr: String', documentation: 'Address string (e.g. ":8080" or "0.0.0.0:3000").' }]
    },
    'Response.json': {
        label: 'Response.json(data: Any, status: Int = 200): Response',
        documentation: 'Constructs an HTTP JSON response with serialized payload and status code.',
        parameters: [
            { label: 'data: Any', documentation: 'Object or record to serialize as JSON.' },
            { label: 'status: Int = 200', documentation: 'HTTP status code (default 200 OK).' }
        ]
    },
    'Response.html': {
        label: 'Response.html(content: String, status: Int = 200): Response',
        documentation: 'Constructs an HTTP response with Content-Type: text/html.',
        parameters: [
            { label: 'content: String', documentation: 'HTML markup string.' },
            { label: 'status: Int = 200', documentation: 'HTTP status code (default 200 OK).' }
        ]
    },
    't.Errorf': {
        label: 't.Errorf(format: String, ...args: Any): Unit',
        documentation: 'Logs an error and marks the test as failed, continuing execution (Go-style).',
        parameters: [
            { label: 'format: String', documentation: 'Printf-style format string.' },
            { label: '...args: Any', documentation: 'Arguments to interpolate.' }
        ]
    },
    't.Fatalf': {
        label: 't.Fatalf(format: String, ...args: Any): Unit',
        documentation: 'Logs an error and stops test execution immediately (Go-style).',
        parameters: [
            { label: 'format: String', documentation: 'Printf-style format string.' },
            { label: '...args: Any', documentation: 'Arguments to interpolate.' }
        ]
    },
    't.Run': {
        label: 't.Run(name: String, testFn: fn(t: *testing.T)): Bool',
        documentation: 'Runs testFn as a subtest under a unique hierarchical name.',
        parameters: [
            { label: 'name: String', documentation: 'Subtest display identifier.' },
            { label: 'testFn: fn(t: *testing.T)', documentation: 'Subtest closure receiving sub-t controller.' }
        ]
    }
};

export class AuraSignatureHelpProvider implements vscode.SignatureHelpProvider {
    public provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.SignatureHelpContext
    ): vscode.ProviderResult<vscode.SignatureHelp> {
        const lineText = document.lineAt(position.line).text.substring(0, position.character);

        // Find enclosing function call: match identifier preceding opening parenthesis
        const match = lineText.match(/([a-zA-Z0-9_\.]+)\s*\(([^()]*)$/);
        if (!match) {
            return undefined;
        }

        const funcName = match[1];
        const argsInside = match[2];

        // Determine current parameter index by counting unnested commas
        let paramIndex = 0;
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < argsInside.length; i++) {
            const ch = argsInside[i];
            if ((ch === '"' || ch === '\'' || ch === '`') && (i === 0 || argsInside[i - 1] !== '\\')) {
                if (inQuotes && ch === quoteChar) {
                    inQuotes = false;
                } else if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = ch;
                }
            } else if (ch === ',' && !inQuotes) {
                paramIndex++;
            }
        }

        const sigInfo = SIGNATURES[funcName];
        if (!sigInfo) {
            return undefined;
        }

        const help = new vscode.SignatureHelp();
        const signature = new vscode.SignatureInformation(sigInfo.label, new vscode.MarkdownString(sigInfo.documentation));

        signature.parameters = sigInfo.parameters.map(
            p => new vscode.ParameterInformation(p.label, new vscode.MarkdownString(p.documentation))
        );

        help.signatures = [signature];
        help.activeSignature = 0;
        help.activeParameter = Math.min(paramIndex, signature.parameters.length - 1);

        return help;
    }
}
