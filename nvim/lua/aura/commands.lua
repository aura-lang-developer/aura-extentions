local M = {}

local function resolve_bin(name)
  local home = vim.fn.expand("$HOME")
  local candidates = {
    home .. "/.cargo/bin/" .. name,
    home .. "/.aura/bin/" .. name,
    "/opt/homebrew/bin/" .. name,
    "/usr/local/bin/" .. name,
  }
  for _, candidate in ipairs(candidates) do
    if vim.fn.executable(candidate) == 1 then
      return candidate
    end
  end
  return name
end

local function run_in_terminal(cmd)
  vim.cmd("botright 12split | terminal " .. cmd)
  vim.cmd("startinsert")
end

function M.setup(_options)
  local aurac = resolve_bin("aurac")
  local auratest = resolve_bin("auratest")
  local aurafmt = resolve_bin("aurafmt")

  -- :AuraRun [file]
  vim.api.nvim_create_user_command("AuraRun", function(opts)
    local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
    if file == "" then
      vim.notify("No active Aura file to run", vim.log.levels.WARN)
      return
    end
    run_in_terminal(aurac .. " run " .. vim.fn.shellescape(file))
  end, { nargs = "?", complete = "file" })

  -- :AuraStep [file] (Interactive step debugger)
  vim.api.nvim_create_user_command("AuraStep", function(opts)
    local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
    if file == "" then
      vim.notify("No active Aura file to debug", vim.log.levels.WARN)
      return
    end
    run_in_terminal(aurac .. " step " .. vim.fn.shellescape(file))
  end, { nargs = "?", complete = "file" })

  -- :AuraBuild [file] [--target <native|go>] [--release]
  vim.api.nvim_create_user_command("AuraBuild", function(opts)
    local file = vim.fn.expand("%")
    local extra = opts.args ~= "" and (" " .. opts.args) or ""
    if file == "" then
      vim.notify("No active Aura file to build", vim.log.levels.WARN)
      return
    end
    run_in_terminal(aurac .. " build " .. vim.fn.shellescape(file) .. extra)
  end, { nargs = "*" })

  -- :AuraCheck
  vim.api.nvim_create_user_command("AuraCheck", function()
    local file = vim.fn.expand("%")
    if file == "" then return end
    run_in_terminal(aurac .. " check " .. vim.fn.shellescape(file))
  end, {})

  -- :AuraTest [paths/flags]
  vim.api.nvim_create_user_command("AuraTest", function(opts)
    local test_bin = vim.fn.executable(auratest) == 1 and auratest or (aurac .. " test")
    local args = opts.args ~= "" and (" " .. opts.args) or " -v"
    run_in_terminal(test_bin .. args)
  end, { nargs = "*" })

  -- :AuraTestFile
  vim.api.nvim_create_user_command("AuraTestFile", function()
    local file = vim.fn.expand("%")
    if file == "" then
      vim.notify("No active Aura test file to run", vim.log.levels.WARN)
      return
    end
    local test_bin = vim.fn.executable(auratest) == 1 and auratest or (aurac .. " test")
    run_in_terminal(test_bin .. " -v " .. vim.fn.shellescape(file))
  end, {})

  -- :AuraCoverage [flags]
  vim.api.nvim_create_user_command("AuraCoverage", function(opts)
    local test_bin = vim.fn.executable(auratest) == 1 and auratest or (aurac .. " test")
    local extra = opts.args ~= "" and (" " .. opts.args) or " --coverage-html coverage.html"
    run_in_terminal(test_bin .. " -cover" .. extra)
  end, { nargs = "*" })

  -- :AuraBench
  vim.api.nvim_create_user_command("AuraBench", function(opts)
    local args = opts.args ~= "" and (" " .. opts.args) or ""
    run_in_terminal(aurac .. " test --bench" .. args)
  end, { nargs = "*" })

  -- :AuraFormat
  vim.api.nvim_create_user_command("AuraFormat", function(opts)
    local target = opts.args ~= "" and opts.args or vim.fn.expand("%")
    if target == "" then target = "." end
    local fmt_cmd = vim.fn.executable(aurafmt) == 1 and (aurafmt .. " -w ") or (aurac .. " fmt -w ")
    vim.fn.system(fmt_cmd .. vim.fn.shellescape(target))
    vim.cmd("edit!")
    vim.notify("✨ Aura file formatted", vim.log.levels.INFO)
  end, { nargs = "?", complete = "file" })

  -- :AuraModTidy
  vim.api.nvim_create_user_command("AuraModTidy", function()
    run_in_terminal(aurac .. " mod tidy")
  end, {})

  -- :AuraModVerify
  vim.api.nvim_create_user_command("AuraModVerify", function()
    run_in_terminal(aurac .. " mod verify")
  end, {})

  -- :AuraModVendor
  vim.api.nvim_create_user_command("AuraModVendor", function()
    run_in_terminal(aurac .. " mod vendor")
  end, {})

  -- :AuraPlayground
  vim.api.nvim_create_user_command("AuraPlayground", function()
    run_in_terminal(aurac .. " playground")
  end, {})

  -- :AuraSwagger [port]
  vim.api.nvim_create_user_command("AuraSwagger", function(opts)
    local port = opts.args ~= "" and opts.args or "8080"
    local url = "http://127.0.0.1:" .. port .. "/swagger"
    local open_cmd = vim.fn.has("mac") == 1 and "open" or "xdg-open"
    vim.fn.system(open_cmd .. " " .. vim.fn.shellescape(url))
    vim.notify("🌐 Opened Aura OpenAPI / Swagger at " .. url, vim.log.levels.INFO)
  end, { nargs = "?" })
end

return M
