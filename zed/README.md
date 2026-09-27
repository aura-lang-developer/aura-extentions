# Aura Language Support for Zed Editor

Official Aura Language extension for [Zed](https://zed.dev) editor.

## Features

- **WebAssembly Extension API (`zed_extension_api`)**: Native WASM extension that resolves and manages `auralsp` and `aurac lsp` automatically.
- **Language Server Protocol (`auralsp`)**: Diagnostics, Hover information, Type inference, Code completions, Go to Definition, Inlay Hints, and Call Hierarchy.
- **Tree-sitter Syntax Highlighting (`highlights.scm`)**: Deep syntactic colorization mapped to Zed theme scopes.
- **Symbol Outline Navigator (`outline.scm`)**: Fast jump-to-symbol (`Cmd+R` / `Ctrl+R`) index for functions, sum types, and interfaces.
- **Intelligent Indentation & Brackets (`indents.scm`, `brackets.scm`)**: Smart auto-indent and pair matching for match expressions, blocks, and collections.
- **Formatting on Save**: Integrated code formatting using `aurafmt` and `auralsp`.
- **Tasks & Execution (`tasks.json`)**: Pre-configured tasks to Run, Check, Build, and Test directly from Zed's command palette.
- **Interactive Debugging**: Source-mapped V8 Inspector debugging with breakpoints and local variable inspection via `aurac debug` and DAP.

---

## Installation in Zed

1. Clone or symlink this directory into your Zed extensions directory:
   ```bash
   # On macOS
   mkdir -p ~/Library/Application\ Support/Zed/extensions/installed/aura
   cp -r editors/zed/* ~/Library/Application\ Support/Zed/extensions/installed/aura/
   ```
2. Ensure `aurac`, `auralsp`, `aurafmt`, and `auratest` are in your system `PATH`:
   ```bash
   cargo install --path .
   ```

---

## Debugging Aura in Zed

Zed supports debugging via the **Debug Adapter Protocol (DAP)** and Node inspector.

### Option 1: Quick Debug Task (Recommended)

1. Open an `.aura` file in Zed.
2. Press `Cmd + Shift + P` (or `Ctrl + Shift + P` on Linux) and run **`task: spawn`**.
3. Select **`Aura: Debug Active File (Listen 9229)`**.
4. Aura will compile your code with high-precision Source Maps V3 and start the V8 inspector:
   ```
   🐛 Aura Debugger initialized for 'src/main.aura'
      ➜ V8 Inspector endpoint: 127.0.0.1:9229
      ➜ SourceMap active: src/main.aura.debug.mjs.map
      ➜ Status: Waiting for debugger to attach (--inspect-brk)...
   ```

### Option 2: Zed Native Debugger (`.zed/launch.json`)

Configure `.zed/launch.json` in your workspace:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Aura Active File",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "runtimeExecutable": "aurac",
      "runtimeArgs": ["debug", "--brk"],
      "port": 9229,
      "sourceMaps": true
    },
    {
      "name": "Attach to Aura Debugger (Port 9229)",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "127.0.0.1",
      "sourceMaps": true
    }
  ]
}
```

---

## Keybindings & Common Commands

| Command | Action | Keybinding (Zed) |
|---|---|---|
| `task: spawn` -> `Aura: Run Active File` | Compile and run active file with `aurac run` | `cmd-shift-p` |
| `task: spawn` -> `Aura: Debug Active File` | Start interactive debugger with `aurac debug` | `cmd-shift-p` |
| `task: spawn` -> `Aura: Type Check` | Run Hindley-Milner static type check (`aurac check`) | `cmd-shift-p` |
| `task: spawn` -> `Aura: Test Suite` | Run complete test suite (`auratest`) | `cmd-shift-p` |
| `editor: format` | Format current `.aura` buffer with `aurafmt` | `cmd-s` / `cmd-shift-i` |
