<p align="center">
  <img src="images/icon.png" width="128" height="128" alt="Aura Language Mascot" />
</p>

# 🌌 aura.nvim — Aura Language Support for Neovim

First-class support for **Aura Language** (`.aura`) in Neovim, featuring rich LSP integration (`auralsp` / `aurac lsp`), syntax highlighting, custom user commands, diagnostic formatting, and snippets.

---

## ⚡ Features

- **Full LSP Integration**: Hover documentation, Go to Definition (`gd`), References (`gr`), Implementation (`gi`), Code Actions (`<leader>ca`), and Rename (`<leader>rn`).
- **Inlay Hints**: Inferred type hints and parameter names (Neovim 0.10+).
- **Diagnostics & Formatting**: On-the-fly syntax and type checker errors, plus `:AuraFormat` (`aurafmt`).
- **Interactive Commands**: Run (`:AuraRun`), build native binaries (`:AuraBuild`), type check (`:AuraCheck`), test (`:AuraTest`), benchmark (`:AuraBench`), and manage modules (`:AuraModTidy`, `:AuraModVerify`, `:AuraModVendor`).
- **Syntax Highlighting**: Native Vim syntax highlighting supporting receiver methods, structs, packed structs, build tags (`//aura:build`), CSP channels, and stdlib modules.
- **Snippets**: Pre-configured snippets for functions, structs, interfaces, HTTP `ServeMux`, CSP channels, and tests.

---

## 📦 Installation

### Using `lazy.nvim` (Recommended)

```lua
{
  "aura-lang-developer/aura-extentions",
  dir = "/path/to/aura-extentions/nvim", -- Or GitHub repo
  ft = { "aura", "auramod", "auralock" },
  dependencies = {
    "neovim/nvim-lspconfig",
  },
  config = function()
    require("aura").setup({
      lsp = {
        enable = true,
        inlay_hints = true,
        format_on_save = false,
      },
    })
  end,
}
```

### Using `packer.nvim`

```lua
use {
  'aura-lang-developer/aura-extentions',
  rtp = 'nvim',
  config = function()
    require('aura').setup()
  end
}
```

---

## 🛠️ Configuration Options

```lua
require("aura").setup({
  lsp = {
    enable = true,
    cmd = { "auralsp" },            -- Custom executable or fallback to aurac lsp
    inlay_hints = true,             -- Show inferred types inline
    code_lens = true,
    format_on_save = false,         -- Auto-format on BufWritePre
  },
  keymaps = {
    enable = true,
    hover = "K",
    definition = "gd",
    references = "gr",
    implementation = "gi",
    code_action = "<leader>ca",
    rename = "<leader>rn",
    format = "<leader>f",
    signature_help = "<C-k>",
  },
  diagnostics = {
    virtual_text = true,
    signs = true,
    underline = true,
  }
})
```

---

## ⌨️ User Commands

| Command | Description |
| :--- | :--- |
| `:AuraRun [file]` | Compiles and runs the active or specified `.aura` file |
| `:AuraBuild [--release]` | Builds standalone native binary executable via Cranelift |
| `:AuraCheck` | Runs type checker verification (`aurac check`) |
| `:AuraTest [flags]` | Runs test suite via `auratest` |
| `:AuraBench` | Runs performance benchmarks (`aurac test --bench`) |
| `:AuraFormat` | Formats current buffer or workspace with `aurafmt` |
| `:AuraModTidy` | Automatically tidies and cleans `aura.mod` dependencies |
| `:AuraModVerify` | Verifies cryptographic SHA-256 hashes in `aura.lock` |
| `:AuraModVendor` | Creates offline vendor package directory (`aurac mod vendor`) |
| `:AuraPlayground` | Launches local interactive web playground |
