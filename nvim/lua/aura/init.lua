-- aura.nvim: First-class Aura language support for Neovim
local M = {}

local default_config = {
  lsp = {
    enable = true,
    cmd = { "auralsp" },
    fallback_cmd = { "aurac", "lsp" },
    inlay_hints = true,
    code_lens = true,
    semantic_tokens = true,
    format_on_save = false,
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
    update_in_insert = false,
  },
}

M.options = {}

function M.setup(user_config)
  M.options = vim.tbl_deep_extend("force", default_config, user_config or {})

  -- 1. Register Filetypes
  vim.filetype.add({
    extension = {
      aura = "aura",
    },
    filename = {
      ["aura.mod"] = "auramod",
      ["aura.lock"] = "auralock",
    },
  })

  -- 2. Setup LSP
  if M.options.lsp.enable then
    require("aura.lsp").setup(M.options)
  end

  -- 3. Setup User Commands
  require("aura.commands").setup(M.options)
end

return M
