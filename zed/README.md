<p align="center">
  <img src="images/icon.png" width="128" height="128" alt="Aura Language Mascot" />
</p>

# 🌌 Aura Language Support for Zed Editor

Official Aura Language extension for [Zed](https://zed.dev) editor.

## ✨ Features

- **WebAssembly Extension API (`zed_extension_api`)**: Native WASM extension that resolves and manages `auralsp` and `aurac lsp` automatically.
- **Language Server Protocol (`auralsp`)**: Diagnostics, Hover information, Type inference, Code completions, Go to Definition, Inlay Hints, and Call Hierarchy.
- **Tree-sitter Syntax Highlighting (`highlights.scm`)**: Complete syntactic colorization for receiver methods, structs, packed structs, build directives (`//aura:build`), CSP channels (`<-`, `->`), and standard library modules (`http`, `sync`, `os`, `time`).
- **Symbol Outline Navigator (`outline.scm`)**: Fast jump-to-symbol (`Cmd+R` / `Ctrl+R`) indexing structs, interfaces, sum types, and functions.
- **Intelligent Indentation & Brackets (`indents.scm`, `brackets.scm`)**: Smart auto-indent and pair matching for match expressions, blocks, and collection literals (`#{}`, `#[ ]`).
- **Formatting on Save**: Integrated code formatting using `aurafmt` and `auralsp`.
- **Predefined Tasks (`tasks.json`)**: One-click tasks to Run, Check, Build Standalone Native Binaries (Cranelift), Build via Go Toolchain, Run Tests & Benchmarks, Format Workspace, and Manage Modules (`aurac mod tidy/verify/vendor`).
- **Interactive Debugging**: Source-mapped debugging with breakpoints and local variable inspection via `aurac debug`.

---

## 📦 Installation in Zed

1. Symlink or copy the extension directory into your Zed extensions folder:
   ```bash
   # On macOS
   mkdir -p ~/Library/Application\ Support/Zed/extensions/installed/aura
   cp -r zed/* ~/Library/Application\ Support/Zed/extensions/installed/aura/
   ```
2. Ensure `aurac`, `auralsp`, `aurafmt`, and `auratest` are installed on your system `PATH`.

---

## ⚙️ Preconfigured Tasks in Zed

Open the Command Palette (`Cmd + Shift + P` or `Ctrl + Shift + P`), type **`task: spawn`**, and choose from:

| Task Label | Command Executed | Description |
| :--- | :--- | :--- |
| **Aura: Run Active File** | `aurac run "$ZED_FILE"` | Compiles and executes current `.aura` file |
| **Aura: Run Active Test File** | `auratest -v "$ZED_FILE"` | Run active test file (`*_test.aura`) |
| **Aura: Type Check Active File** | `aurac check "$ZED_FILE"` | Type check without emitting binaries |
| **Aura: Build Standalone Native Binary (Cranelift)** | `aurac build "$ZED_FILE" --target native` | Standalone machine code binary |
| **Aura: Build Release Optimized (-O3, SIMD)** | `aurac build "$ZED_FILE" --target native --release -O3` | Max performance optimized binary |
| **Aura: Build Native Executable via Go Toolchain** | `aurac build "$ZED_FILE" --target go` | Go toolchain single binary |
| **Aura: Run Test Suite (auratest)** | `auratest -v` | Unit tests & test runner |
| **Aura: Run Benchmarks** | `aurac test --bench` | Benchmark performance suite |
| **Aura: Format Workspace (aurafmt)** | `aurafmt -w .` | Workspace code formatter |
| **Aura: Tidy Module Dependencies** | `aurac mod tidy` | Discover & tidy `aura.mod` |
| **Aura: Verify Cryptographic Hashes** | `aurac mod verify` | Verify `aura.lock` checksums |
| **Aura: Vendor Dependencies** | `aurac mod vendor` | 100% offline self-contained builds |
