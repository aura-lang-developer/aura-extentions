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

-- 3. Execution helpers and test runners (*_test.aura support)
local function run_aura_file()
  local file = vim.fn.expand("%:p")
  if file == "" then
    vim.notify("No active Aura file", vim.log.levels.WARN)
    return
  end
  if file:match("_test%.aura$") then
    vim.cmd("split | terminal auratest -v " .. vim.fn.shellescape(file))
  else
    vim.cmd("split | terminal aurac run " .. vim.fn.shellescape(file))
  end
end

local function run_aura_test_file()
  local file = vim.fn.expand("%:p")
  if file == "" then
    vim.notify("No active Aura file", vim.log.levels.WARN)
    return
  end
  vim.cmd("split | terminal auratest -v " .. vim.fn.shellescape(file))
end

local function run_aura_test_suite()
  vim.cmd("split | terminal auratest")
end

vim.api.nvim_create_user_command("AuraRun", run_aura_file, { desc = "Run active Aura file (or tests if *_test.aura)" })
vim.api.nvim_create_user_command("AuraTest", run_aura_test_file, { desc = "Run active Aura test file with auratest" })
vim.api.nvim_create_user_command("AuraTestSuite", run_aura_test_suite, { desc = "Run all Aura project tests with auratest" })

lspconfig.auralsp.setup({
  on_attach = function(client, bufnr)
    local opts = { noremap = true, silent = true, buffer = bufnr }
    vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
    vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
    vim.keymap.set("n", "<leader>f", function() vim.lsp.buf.format({ async = true }) end, opts)
    vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
    vim.keymap.set("n", "<leader>r", run_aura_file, opts)
    vim.keymap.set("n", "<leader>tr", run_aura_test_file, opts)
    vim.keymap.set("n", "<leader>ts", run_aura_test_suite, opts)
  end,
})
