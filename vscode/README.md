# Aura Language Extension for VS Code

Official Visual Studio Code extension for the **Aura Language** featuring full Language Server Protocol (LSP) integration.

## Features

- 🎨 **Syntax Highlighting**: Full TextMate grammar for functions, sum types, microservices, HTTP routing, pipelines (`|>`), channels (`<-`), async/await, and template strings.
- 💡 **Hover Information**: Instant type signatures, inferred types, docstrings, and standard library documentation.
- 🔍 **Go to Definition**: Jump directly to function definitions, let bindings, sum type variants, and interface implementations.
- ⚡ **Real-time Diagnostics**: On-the-fly compiler errors, type errors, and syntax validation.
- 📝 **Autocompletion**: Contextual keywords, local variables, standard library methods, and snippet expansions.
- ✨ **Document Formatting**: Code formatting aligned with `aurafmt`.
- 🌐 **Online Playground Integration**: Quick command to launch and open the Aura interactive playground.

## Installation & Setup

1. Install the Aura Compiler (`cargo install --path .`).
2. Ensure `auralsp` or `aurac` is available in your `$PATH`.
3. Open any `.aura` file in VS Code!
