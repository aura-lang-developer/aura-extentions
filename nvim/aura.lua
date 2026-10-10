-- aura.lua: Quick standalone setup for Neovim (nvim-lspconfig & vim.lsp)
-- You can either `require("aura").setup()` or source this file directly.

local aura = require("aura")
aura.setup({
  lsp = {
    enable = true,
    inlay_hints = true,
    format_on_save = false,
  },
})

return aura
