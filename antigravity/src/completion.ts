import * as vscode from 'vscode';
import { HOVER_DATABASE, HoverDoc } from './hover';

/**
 * Aura Rich Completion Item Provider
 * Provides context-aware completions, keyword snippets, built-in types,
 * standard library modules, functions, and testing framework helpers.
 */
export class AuraCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);

        // Do not provide completions inside single-line comments
        if (linePrefix.trimStart().startsWith('//')) {
            return undefined;
        }

        const items: vscode.CompletionItem[] = [];

        // 1. Check if completing import from string: e.g. import { ... } from "..."
        if (/from\s*["'][^"']*$/.test(linePrefix) || /import\s*["'][^"']*$/.test(linePrefix)) {
            return this.getModuleImportCompletions();
        }

        // 2. Add all keywords, builtins, types, and stdlib entities from HOVER_DATABASE
        for (const [key, doc] of Object.entries(HOVER_DATABASE)) {
            // Skip operators or build tags for general word completion
            if (key.startsWith('//') || key === '|>' || key === '<-' || key === '=>' || key === '?' || key === '::') {
                continue;
            }

            const item = new vscode.CompletionItem(key, this.mapCategoryToCompletionKind(doc.category));
            item.detail = doc.signature || `${doc.category}: ${key}`;
            item.documentation = new vscode.MarkdownString(
                `### ${doc.title} *(${doc.category})*\n\n${doc.description}\n\n` +
                (doc.example ? `#### Ejemplo:\n\`\`\`aura\n${doc.example}\n\`\`\`\n\n` : '') +
                (doc.tips ? `> 💡 **Tip:** ${doc.tips}` : '')
            );

            // Add snippet templates for core language constructs if not triggered by property access
            if (!linePrefix.endsWith('.')) {
                item.insertText = this.getSnippetForSymbol(key, doc);
            }

            items.push(item);
        }

        // 3. Add Testing Helpers completions (Go-style *testing.T and *testing.B methods)
        if (document.fileName.endsWith('_test.aura') || linePrefix.includes('t.') || linePrefix.includes('b.')) {
            items.push(...this.getTestingCompletions());
        }

        // 4. Add Database and HTTP helpers
        items.push(...this.getSpecializedCompletions());

        return items;
    }

    private mapCategoryToCompletionKind(category: HoverDoc['category']): vscode.CompletionItemKind {
        switch (category) {
            case 'Keyword':
                return vscode.CompletionItemKind.Keyword;
            case 'Type':
                return vscode.CompletionItemKind.Class;
            case 'Built-in Function':
                return vscode.CompletionItemKind.Function;
            case 'Module':
                return vscode.CompletionItemKind.Module;
            case 'Decorator':
                return vscode.CompletionItemKind.Property;
            default:
                return vscode.CompletionItemKind.Value;
        }
    }

    private getSnippetForSymbol(key: string, doc: HoverDoc): vscode.SnippetString | string {
        switch (key) {
            case 'fn':
                return new vscode.SnippetString('fn ${1:name}(${2:params}): ${3:Unit} => {\n\t$0\n}');
            case 'let':
                return new vscode.SnippetString('let ${1:name}: ${2:Type} = ${3:value};');
            case 'mut':
                return new vscode.SnippetString('mut ${1:name} = ${2:value};');
            case 'struct':
                return new vscode.SnippetString('struct ${1:Name} {\n\t${2:field}: ${3:Type},\n};');
            case 'packed':
                return new vscode.SnippetString('packed struct ${1:Header} {\n\t${2:magic}: Int,\n};');
            case 'interface':
                return new vscode.SnippetString('interface ${1:Reader} {\n\tfn ${2:read}(${3:size}: Int): ${4:String};\n}');
            case 'type':
                return new vscode.SnippetString('type ${1:Status} =\n\t| ${2:Pending}\n\t| ${3:Success}\n\t| ${4:Failed};');
            case 'match':
                return new vscode.SnippetString('match ${1:expr} {\n\t${2:Case} => ${3:action},\n\t_ => ${4:default},\n}');
            case 'select':
                return new vscode.SnippetString('select {\n\t${1:msg} = <-${2:ch} => {\n\t\t$3\n\t}\n\tdefault => {\n\t\t$4\n\t}\n}');
            case 'spawn':
                return new vscode.SnippetString('spawn {\n\t$0\n};');
            case 'routine':
                return new vscode.SnippetString('routine {\n\t$0\n};');
            case 'go':
                return new vscode.SnippetString('go {\n\t$0\n};');
            case 'defer':
                return new vscode.SnippetString('defer ${1:cleanup()};');
            case 'errdefer':
                return new vscode.SnippetString('errdefer ${1:rollback()};');
            case 'embed':
                return new vscode.SnippetString('embed("${1:filepath}")');
            case 'embedBytes':
                return new vscode.SnippetString('embedBytes("${1:filepath}")');
            case 'import':
                return new vscode.SnippetString('import { ${1:items} } from "${2:module}";');
            case 'export':
                return new vscode.SnippetString('export ');
            case 'for':
                return new vscode.SnippetString('for ${1:item} in ${2:iterable} {\n\t$0\n}');
            case 'while':
                return new vscode.SnippetString('while ${1:condition} {\n\t$0\n}');
            case 'if':
                return new vscode.SnippetString('if ${1:condition} {\n\t$0\n} else {\n\t\n}');
            default:
                return key;
        }
    }

    private getModuleImportCompletions(): vscode.CompletionItem[] {
        const modules = [
            { name: 'net/http', desc: 'Standard HTTP server, client, ServeMux, Swagger & JSON responses' },
            { name: 'sync', desc: 'CSP primitives: WaitGroup, Mutex, RWMutex, Once' },
            { name: 'time', desc: 'Timers, non-blocking sleep, Duration, now()' },
            { name: 'json', desc: 'Ultra-fast JSON parse and stringify with struct tag mappings' },
            { name: 'math', desc: 'Mathematical functions (sin, cos, sqrt, PI, pow)' },
            { name: 'io', desc: 'File system I/O, readFile, writeFile, streaming Reader/Writer' },
            { name: 'os', desc: 'Operating system bindings, args, env, exit, stdout' },
            { name: 'crypto', desc: 'Cryptographic hash functions: sha256, sha512, md5, hmac' },
            { name: 'database/sql', desc: 'Generic SQL pool and database connection interfaces' },
            { name: 'pg', desc: 'High-performance native PostgreSQL driver with SCRAM-SHA-256' },
            { name: 'mysql', desc: 'Native MySQL driver with connection pooling and transactions' },
            { name: 'redis', desc: 'In-memory Redis driver for caching, Pub/Sub, and KV storage' },
            { name: 'mongo', desc: 'MongoDB document driver with BSON and aggregation pipeline' },
            { name: 'sqlite', desc: 'Embedded SQLite driver for local embedded storage' },
            { name: 'testing', desc: 'Go-style testing framework with *testing.T and *testing.B' }
        ];

        return modules.map(m => {
            const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Module);
            item.detail = `Aura Standard Library: ${m.name}`;
            item.documentation = new vscode.MarkdownString(m.desc);
            item.insertText = m.name;
            return item;
        });
    }

    private getTestingCompletions(): vscode.CompletionItem[] {
        const testingMethods = [
            { label: 't.Logf', snippet: 't.Logf("${1:%v}", ${2:val});', desc: 'Log formatted message to test log' },
            { label: 't.Errorf', snippet: 't.Errorf("${1:expected %v, got %v}", ${2:expected}, ${3:got});', desc: 'Record test failure and continue execution' },
            { label: 't.Fatalf', snippet: 't.Fatalf("${1:fatal error: %v}", ${2:err});', desc: 'Fail test immediately and abort execution' },
            { label: 't.Helper', snippet: 't.Helper();', desc: 'Marks the calling function as a test helper' },
            { label: 't.Parallel', snippet: 't.Parallel();', desc: 'Signals that this test runs concurrently with other parallel tests' },
            { label: 't.Run', snippet: 't.Run("${1:subtest_name}", fn(t: *testing.T) => {\n\t$0\n});', desc: 'Run table-driven or isolated subtest' },
            { label: 't.Cleanup', snippet: 't.Cleanup(fn() => {\n\t$0\n});', desc: 'Register cleanup function executed when test finishes' },
            { label: 't.TempDir', snippet: 'let ${1:dir} = t.TempDir();', desc: 'Create temporary directory deleted automatically after test' },
            { label: 't.Setenv', snippet: 't.Setenv("${1:KEY}", "${2:VALUE}");', desc: 'Set environment variable restored automatically when test finishes' },
            { label: 'b.ResetTimer', snippet: 'b.ResetTimer();', desc: 'Reset benchmark elapsed timer after setup' },
            { label: 'b.ReportAllocs', snippet: 'b.ReportAllocs();', desc: 'Enable memory allocation stats reporting for benchmark' },
            { label: 'b.Loop', snippet: 'for (let mut i = 0; i < b.N; i = i + 1) {\n\t$0\n}', desc: 'Standard benchmark iteration loop with b.N' }
        ];

        return testingMethods.map(m => {
            const item = new vscode.CompletionItem(m.label, vscode.CompletionItemKind.Method);
            item.detail = `testing: ${m.label}`;
            item.documentation = new vscode.MarkdownString(m.desc);
            item.insertText = new vscode.SnippetString(m.snippet);
            return item;
        });
    }

    private getSpecializedCompletions(): vscode.CompletionItem[] {
        const specialized = [
            {
                label: 'Channel.new',
                kind: vscode.CompletionItemKind.Constructor,
                detail: 'Channel.new<T>(capacity: Int = 0): Channel<T>',
                documentation: 'Create a CSP channel. Capacity 0 creates an unbuffered rendezvous channel; > 0 creates a buffered channel.',
                snippet: 'Channel.new<${1:Type}>(${2:0})'
            },
            {
                label: 'WaitGroup.new',
                kind: vscode.CompletionItemKind.Constructor,
                detail: 'WaitGroup.new(): WaitGroup',
                documentation: 'Create a WaitGroup counter for coordinating concurrent fibers.',
                snippet: 'WaitGroup.new()'
            },
            {
                label: 'Mutex.new',
                kind: vscode.CompletionItemKind.Constructor,
                detail: 'Mutex.new(): Mutex',
                documentation: 'Create a mutual exclusion lock.',
                snippet: 'Mutex.new()'
            },
            {
                label: 'Server.new',
                kind: vscode.CompletionItemKind.Constructor,
                detail: 'Server.new(addr: String): Server',
                documentation: 'Create a high-performance HTTP server instance listening on specified address.',
                snippet: 'Server.new("${1::8080}")'
            },
            {
                label: 'newServeMux',
                kind: vscode.CompletionItemKind.Function,
                detail: 'newServeMux(): ServeMux',
                documentation: 'Create an HTTP request multiplexer with route routing, parameters and OpenAPI documentation support.',
                snippet: 'newServeMux()'
            },
            {
                label: 'Response.json',
                kind: vscode.CompletionItemKind.Method,
                detail: 'Response.json(data: Any, status: Int = 200): Response',
                documentation: 'Return JSON HTTP Response with Content-Type: application/json and status code.',
                snippet: 'Response.json(${1:data})'
            },
            {
                label: 'Response.html',
                kind: vscode.CompletionItemKind.Method,
                detail: 'Response.html(content: String, status: Int = 200): Response',
                documentation: 'Return HTML HTTP Response with Content-Type: text/html and status code.',
                snippet: 'Response.html(${1:htmlString})'
            }
        ];

        return specialized.map(s => {
            const item = new vscode.CompletionItem(s.label, s.kind);
            item.detail = s.detail;
            item.documentation = new vscode.MarkdownString(s.documentation);
            item.insertText = new vscode.SnippetString(s.snippet);
            return item;
        });
    }
}
