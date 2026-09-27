# 🌟 Aura Language Support for Antigravity IDE

Official extension for **Aura Language** (`aurac`) tailored for **Google Antigravity IDE** and VS Code.

Combines high-performance Language Server Protocol (LSP) intelligence with Antigravity IDE's native AI-first pair programming workflows (Antigravity Tab Autocomplete, Inline `Cmd+I`, Sidebar Agent Mode, and Diagnostic Auto-Fix).

---

## ✨ Features

- **💡 Rich Contextual Hover Tooltips**:
  - Hovering over **keywords** (`fn`, `let`, `mut`, `match`, `interface`, `type`, `defer`, `spawn`, `select`, `embed`, etc.) displays syntax signatures, description, input parameters, return types, and code examples.
  - Hovering over **primitive and core types** (`Int`, `Float`, `String`, `Bool`, `Option<T>`, `Result<T, E>`, `Channel<T>`, `Context`, `WaitGroup`, `Mutex`) reveals bit-width, memory model, and concurrency behaviors.
  - Hovering over **operators** (`|>`, `<-`, `=>`, `?`) and decorators (`@test`) displays operator semantics and usage.
- **⚡ Full Language Server Protocol (LSP)**:
  - Sound type hover information with inferred signatures.
  - Contextual completions for keywords, stdlib functions, and types.
  - Go to Definition (`F12`) across modules and imports.
  - Real-time compiler diagnostics and red squigglies while typing.
- **🎨 Comprehensive Syntax Highlighting**:
  - Full support for algebraic data types (`type`), exhaustive pattern matching (`match`), and Go-style CSP primitives (`spawn`, `Channel<T>`, `select`).
  - Full keyword coverage: `defer`, `panic`, `recover`, `embed`, `interface`, etc.
  - Template strings with nested expression interpolation.
- **🧠 Antigravity IDE AI Modalities Integration**:
  - **Diagnostic Auto-Fix**: Compiler errors detected in the Problems pane seamlessly surface quick-fix agent triggers.
  - **Antigravity Tab**: Context-aware next-intent autocompletions for Aura functional patterns.
  - **Inline Command (`⌘+I` / `Ctrl+I`)**: Targeted refactors, ADT exhaustiveness completions, and doc generation.
  - **Sidebar Agent Mode**: Autonomous multi-step building, testing with `auratest`, and refactoring.
- **🛠️ Integrated Tooling & Commands**:
  - **Run Active File**: Instant execution via `aurac run`.
  - **Type Check**: Validate types with `aurac check`.
  - **Build Standalone Binary**: One-click native executable compilation (`aurac build --standalone`).
  - **Run Test Suite**: Interactive execution of `auratest`.
  - **Code Formatter**: Opinionated `aurafmt` integration on document save.
  - **Live Watch Mode**: Auto-recompile and run on edit with `aurac watch`.
  - **Interactive Playground**: Launch the local web playground (`aurac playground`).
- **📝 Rich Snippets**:
  - `fn`, `main`, `type-adt`, `type-record`, `interface`, `match`, `spawn`, `channel`, `select`, `defer`, `handler`, `test`, `db-pg`, `db-redis`, `http-server`.

---

## 📦 Installation in Antigravity IDE

### Option 1: Install from VSIX
1. Open Antigravity IDE.
2. Open the Command Palette (`⌘+Shift+P` / `Ctrl+Shift+P`).
3. Select **Extensions: Install from VSIX...**
4. Pick the built `aura-antigravity-0.1.0.vsix` file located in `editors/antigravity/`.

### Option 2: Command Line Installation
```bash
antigravity --install-extension editors/antigravity/aura-antigravity-0.1.0.vsix
```

---

## ⚙️ Configuration

| Setting | Default | Description |
| :--- | :--- | :--- |
| `aura.server.path` | `"auralsp"` | Path to the Aura Language Server binary. Automatically detects local workspace release/debug builds. |
| `aura.compiler.path` | `"aurac"` | Path to the Aura CLI Compiler binary. Automatically detects local workspace release/debug builds. |
| `aura.trace.server` | `"off"` | Traces LSP communication (`off`, `messages`, `verbose`). |

---

## ⌨️ Command Palette

| Command | Title | Action |
| :--- | :--- | :--- |
| `aura.showMenu` | Aura: Show Actions Menu | Opens quick menu with all Aura actions |
| `aura.runActiveFile` | Aura: Run Active File | Executes `aurac run <file>` in terminal |
| `aura.checkActiveFile` | Aura: Type Check Active File | Runs `aurac check <file>` |
| `aura.buildActiveFile` | Aura: Build Standalone Binary | Compiles native executable binary |
| `aura.runTests` | Aura: Run Test Suite (auratest) | Runs project tests |
| `aura.formatFile` | Aura: Format File (aurafmt) | Formats file with `aurafmt` |
| `aura.startWatch` | Aura: Start Live Watch Mode | Starts live recompile watcher |
| `aura.openPlayground` | Aura: Open Online Playground | Opens interactive playground in browser |
| `aura.restartServer` | Aura: Restart Language Server | Restarts active LSP process |

---

## 📄 License

MIT
