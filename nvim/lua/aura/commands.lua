local M = {}

local function run_in_terminal(cmd)
  vim.cmd("botright 12split | terminal " .. cmd)
  vim.cmd("startinsert")
end

function M.setup(_options)
  -- :AuraRun [file]
  vim.api.nvim_create_user_command("AuraRun", function(opts)
    local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
    if file == "" then
      vim.notify("No active Aura file to run", vim.log.levels.WARN)
      return
    end
    run_in_terminal("aurac run " .. vim.fn.shellescape(file))
  end, { nargs = "?", complete = "file" })

  -- :AuraBuild [file] [--target <native|go>] [--release]
  vim.api.nvim_create_user_command("AuraBuild", function(opts)
    local file = vim.fn.expand("%")
    local extra = opts.args ~= "" and (" " .. opts.args) or ""
    if file == "" then
      vim.notify("No active Aura file to build", vim.log.levels.WARN)
      return
    end
    run_in_terminal("aurac build " .. vim.fn.shellescape(file) .. extra)
  end, { nargs = "*" })

  -- :AuraCheck
  vim.api.nvim_create_user_command("AuraCheck", function()
    local file = vim.fn.expand("%")
    if file == "" then return end
    run_in_terminal("aurac check " .. vim.fn.shellescape(file))
  end, {})

  -- :AuraTest [paths/flags]
  vim.api.nvim_create_user_command("AuraTest", function(opts)
    local args = opts.args ~= "" and (" " .. opts.args) or " -v"
    run_in_terminal("auratest" .. args)
  end, { nargs = "*" })

  -- :AuraBench
  vim.api.nvim_create_user_command("AuraBench", function(opts)
    local args = opts.args ~= "" and (" " .. opts.args) or ""
    run_in_terminal("aurac test --bench" .. args)
  end, { nargs = "*" })

  -- :AuraFormat
  vim.api.nvim_create_user_command("AuraFormat", function(opts)
    local target = opts.args ~= "" and opts.args or vim.fn.expand("%")
    if target == "" then target = "." end
    vim.fn.system("aurafmt -w " .. vim.fn.shellescape(target))
    vim.cmd("edit!")
    vim.notify("✨ Aura file formatted with aurafmt", vim.log.levels.INFO)
  end, { nargs = "?", complete = "file" })

  -- :AuraModTidy
  vim.api.nvim_create_user_command("AuraModTidy", function()
    run_in_terminal("aurac mod tidy")
  end, {})

  -- :AuraModVerify
  vim.api.nvim_create_user_command("AuraModVerify", function()
    run_in_terminal("aurac mod verify")
  end, {})

  -- :AuraModVendor
  vim.api.nvim_create_user_command("AuraModVendor", function()
    run_in_terminal("aurac mod vendor")
  end, {})

  -- :AuraPlayground
  vim.api.nvim_create_user_command("AuraPlayground", function()
    run_in_terminal("aurac playground")
  end, {})
end

return M
