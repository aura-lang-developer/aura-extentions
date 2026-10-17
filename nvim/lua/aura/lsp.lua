local M = {}

local function find_root(fname)
  local util = pcall(require, "lspconfig.util") and require("lspconfig.util") or nil
  if util then
    return util.root_pattern("aura.mod", "aura.lock", ".git")(fname) or vim.fn.getcwd()
  end
  local root = vim.fs.find({ "aura.mod", "aura.lock", ".git" }, { upward = true, path = fname })[1]
  return root and vim.fs.dirname(root) or vim.fn.getcwd()
end

local function resolve_lsp_command(options)
  local custom_cmd = options.lsp.cmd
  if custom_cmd and #custom_cmd > 0 and vim.fn.executable(custom_cmd[1]) == 1 then
    return custom_cmd
  end

  -- Check workspace target binary
  local cwd = vim.fn.getcwd()
  local target_release = cwd .. "/target/release/auralsp"
  if vim.fn.executable(target_release) == 1 then
    return { target_release }
  end

  local target_debug = cwd .. "/target/debug/auralsp"
  if vim.fn.executable(target_debug) == 1 then
    return { target_debug }
  end

  -- Check user cargo and local directories
  local home = vim.fn.expand("$HOME")
  local candidates = {
    home .. "/.cargo/bin/auralsp",
    home .. "/.aura/bin/auralsp",
    "/opt/homebrew/bin/auralsp",
    "/usr/local/bin/auralsp",
    home .. "/.cargo/bin/aurac",
    "/opt/homebrew/bin/aurac",
    "/usr/local/bin/aurac",
  }

  for _, candidate in ipairs(candidates) do
    if vim.fn.executable(candidate) == 1 then
      if candidate:match("aurac$") then
        return { candidate, "lsp" }
      end
      return { candidate }
    end
  end

  -- Check system PATH
  if vim.fn.executable("auralsp") == 1 then
    return { "auralsp" }
  end

  if vim.fn.executable("aurac") == 1 then
    return { "aurac", "lsp" }
  end

  return { "auralsp" }
end

function M.setup(options)
  local has_lspconfig, lspconfig = pcall(require, "lspconfig")
  local cmd = resolve_lsp_command(options)

  local on_attach = function(client, bufnr)
    local opts = { noremap = true, silent = true, buffer = bufnr }
    local km = options.keymaps

    if km and km.enable then
      if km.hover then vim.keymap.set("n", km.hover, vim.lsp.buf.hover, opts) end
      if km.definition then vim.keymap.set("n", km.definition, vim.lsp.buf.definition, opts) end
      if km.references then vim.keymap.set("n", km.references, vim.lsp.buf.references, opts) end
      if km.implementation then vim.keymap.set("n", km.implementation, vim.lsp.buf.implementation, opts) end
      if km.code_action then vim.keymap.set("n", km.code_action, vim.lsp.buf.code_action, opts) end
      if km.rename then vim.keymap.set("n", km.rename, vim.lsp.buf.rename, opts) end
      if km.format then vim.keymap.set("n", km.format, function() vim.lsp.buf.format({ async = true }) end, opts) end
      if km.signature_help then vim.keymap.set("i", km.signature_help, vim.lsp.buf.signature_help, opts) end
    end

    -- Inlay Hints (Neovim 0.10+)
    if options.lsp.inlay_hints and vim.lsp.inlay_hint then
      pcall(function()
        vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
      end)
    end

    -- Format on save
    if options.lsp.format_on_save then
      local group = vim.api.nvim_create_augroup("AuraFormatOnSave_" .. bufnr, { clear = true })
      vim.api.nvim_create_autocmd("BufWritePre", {
        group = group,
        buffer = bufnr,
        callback = function()
          vim.lsp.buf.format({ bufnr = bufnr, timeout_ms = 2000 })
        end,
      })
    end
  end

  -- Diagnostic configuration
  if options.diagnostics then
    vim.diagnostic.config(options.diagnostics)
  end

  if has_lspconfig then
    local configs = require("lspconfig.configs")
    if not configs.auralsp then
      configs.auralsp = {
        default_config = {
          cmd = cmd,
          filetypes = { "aura" },
          root_dir = find_root,
          settings = {},
        },
      }
    end

    lspconfig.auralsp.setup({
      cmd = cmd,
      on_attach = on_attach,
    })
  elseif vim.lsp and vim.lsp.start then
    -- Native Neovim 0.8+ LSP fallback without requiring nvim-lspconfig
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "aura",
      callback = function(ev)
        vim.lsp.start({
          name = "auralsp",
          cmd = cmd,
          root_dir = find_root(vim.api.nvim_buf_get_name(ev.buf)),
          on_attach = on_attach,
        })
      end,
    })
  end
end

return M
