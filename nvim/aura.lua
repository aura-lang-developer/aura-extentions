-- Aura Language Server configuration for Neovim (nvim-lspconfig & vim.lsp)

-- 1. Register .aura filetype
vim.filetype.add({
  extension = {
    aura = "aura",
  },
})

-- 2. Setup LSP client
local lspconfig = require("lspconfig")
local configs = require("lspconfig.configs")

if not configs.auralsp then
  configs.auralsp = {
    default_config = {
      cmd = { "auralsp" },
      filetypes = { "aura" },
      root_dir = function(fname)
        return lspconfig.util.find_git_ancestor(fname) or vim.fn.getcwd()
      end,
      settings = {},
    },
  }
end

lspconfig.auralsp.setup({
  on_attach = function(client, bufnr)
    local opts = { noremap = true, silent = true, buffer = bufnr }
    vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
    vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
    vim.keymap.set("n", "<leader>f", function() vim.lsp.buf.format({ async = true }) end, opts)
    vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
  end,
})
