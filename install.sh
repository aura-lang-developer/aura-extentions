#!/usr/bin/env bash
# ==============================================================================
# ⚡ Aura Language — Unified Editor Extensions Installer
# Installs Aura language support for:
#   - Visual Studio Code
#   - Google Antigravity IDE
#   - Zed Editor
#   - Neovim
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ------------------------------------------------------------------------------
# Formatting & Colors
# ------------------------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD="\033[1m"
  DIM="\033[2m"
  CYAN="\033[0;36m"
  GREEN="\033[0;32m"
  YELLOW="\033[0;33m"
  BLUE="\033[0;34m"
  MAGENTA="\033[0;35m"
  RED="\033[0;31m"
  RESET="\033[0m"
else
  BOLD=""
  DIM=""
  CYAN=""
  GREEN=""
  YELLOW=""
  BLUE=""
  MAGENTA=""
  RED=""
  RESET=""
fi

log_info()    { echo -e "${CYAN}ℹ${RESET}  $*"; }
log_step()    { echo -e "${BLUE}==>${RESET} ${BOLD}$*${RESET}"; }
log_success() { echo -e "${GREEN}✔${RESET}  ${BOLD}$*${RESET}"; }
log_warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
log_error()   { echo -e "${RED}✖${RESET}  ${BOLD}$*${RESET}" >&2; }

# ------------------------------------------------------------------------------
# Target Selection Defaults
# ------------------------------------------------------------------------------
TARGET_ALL=true
TARGET_VSCODE=false
TARGET_ANTIGRAVITY=false
TARGET_ZED=false
TARGET_NVIM=false
BUILD_ONLY=false
DEV_LINK=false

print_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "    ⚡  A U R A   L A N G U A G E"
  echo "    Editor Extensions & IDE Installer"
  echo -e "${RESET}${DIM}    Monorepo: VS Code • Antigravity • Zed • Neovim${RESET}\n"
}

print_help() {
  print_banner
  cat <<EOF
Usage: ./install.sh [OPTIONS]

Options:
  -a, --all             Build and install extensions for all detected editors (default)
      --vscode          Install only for Visual Studio Code
      --antigravity     Install only for Google Antigravity IDE
      --zed             Install only for Zed Editor
      --nvim            Install only for Neovim
  -b, --build-only      Only compile and package artifacts (.vsix, .wasm) without installing
      --dev-link        Symlink extensions instead of copying (Zed / Neovim)
  -h, --help            Show this help message

Examples:
  ./install.sh                      # Auto-detects installed editors and installs all
  ./install.sh --vscode --zed       # Install only for VS Code and Zed
  ./install.sh --antigravity        # Install only for Antigravity IDE
  ./install.sh --build-only         # Package .vsix and .wasm without installing
  ./install.sh --dev-link           # Install with active live symlinks for Neovim and Zed
EOF
}

# ------------------------------------------------------------------------------
# CLI Argument Parsing
# ------------------------------------------------------------------------------
SELECTED_SPECIFIC=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--all)
      TARGET_ALL=true
      shift
      ;;
    --vscode)
      TARGET_VSCODE=true
      SELECTED_SPECIFIC=true
      TARGET_ALL=false
      shift
      ;;
    --antigravity)
      TARGET_ANTIGRAVITY=true
      SELECTED_SPECIFIC=true
      TARGET_ALL=false
      shift
      ;;
    --zed)
      TARGET_ZED=true
      SELECTED_SPECIFIC=true
      TARGET_ALL=false
      shift
      ;;
    --nvim)
      TARGET_NVIM=true
      SELECTED_SPECIFIC=true
      TARGET_ALL=false
      shift
      ;;
    -b|--build-only)
      BUILD_ONLY=true
      shift
      ;;
    --dev-link)
      DEV_LINK=true
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Run './install.sh --help' for usage details."
      exit 1
      ;;
  esac
done

if [ "$SELECTED_SPECIFIC" = true ]; then
  TARGET_ALL=false
fi

# ------------------------------------------------------------------------------
# Editor & Tool Detection
# ------------------------------------------------------------------------------
VSCODE_CLI=""
if command -v code &>/dev/null; then
  VSCODE_CLI="$(command -v code)"
elif [[ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]]; then
  VSCODE_CLI="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
fi

ANTIGRAVITY_CLI=""
if command -v antigravity &>/dev/null; then
  ANTIGRAVITY_CLI="$(command -v antigravity)"
elif command -v antigravity-ide &>/dev/null; then
  ANTIGRAVITY_CLI="$(command -v antigravity-ide)"
elif [[ -x "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide" ]]; then
  ANTIGRAVITY_CLI="/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide"
elif [[ -x "/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity-ide" ]]; then
  ANTIGRAVITY_CLI="/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity-ide"
fi

ZED_EXISTS=false
ZED_EXT_DIR=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  ZED_EXT_DIR="$HOME/Library/Application Support/Zed/extensions/installed/aura"
  if command -v zed &>/dev/null || [[ -d "/Applications/Zed.app" ]] || [[ -d "$HOME/Library/Application Support/Zed" ]]; then
    ZED_EXISTS=true
  fi
else
  ZED_EXT_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/zed/extensions/installed/aura"
  if command -v zed &>/dev/null || [[ -d "${XDG_DATA_HOME:-$HOME/.local/share}/zed" ]]; then
    ZED_EXISTS=true
  fi
fi

NVIM_EXISTS=false
NVIM_PACK_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/nvim/site/pack/aura/start/aura.nvim"
if command -v nvim &>/dev/null || [[ -d "$HOME/.config/nvim" ]] || [[ -d "${XDG_DATA_HOME:-$HOME/.local/share}/nvim" ]]; then
  NVIM_EXISTS=true
fi

VSCE_BIN=""
if [[ -x "$SCRIPT_DIR/vscode/node_modules/.bin/vsce" ]]; then
  VSCE_BIN="$SCRIPT_DIR/vscode/node_modules/.bin/vsce"
elif [[ -x "$SCRIPT_DIR/antigravity/node_modules/.bin/vsce" ]]; then
  VSCE_BIN="$SCRIPT_DIR/antigravity/node_modules/.bin/vsce"
elif command -v vsce &>/dev/null; then
  VSCE_BIN="$(command -v vsce)"
fi

# ------------------------------------------------------------------------------
# Build Helpers
# ------------------------------------------------------------------------------
build_vscode() {
  log_step "Building Visual Studio Code extension (aura-vscode)..."
  npm run compile:vscode
  
  if [[ -n "$VSCE_BIN" ]]; then
    (cd vscode && "$VSCE_BIN" package --no-git-tag-version)
  else
    (cd vscode && npx -y @vscode/vsce package --no-git-tag-version)
  fi
  log_success "Packaged vscode/aura-vscode-0.2.0.vsix"
}

build_antigravity() {
  log_step "Building Google Antigravity IDE extension (aura-antigravity)..."
  npm run compile:antigravity
  
  if [[ -n "$VSCE_BIN" ]]; then
    (cd antigravity && "$VSCE_BIN" package --no-git-tag-version)
  else
    (cd antigravity && npx -y @vscode/vsce package --no-git-tag-version)
  fi
  log_success "Packaged antigravity/aura-antigravity-0.2.0.vsix"
}

build_zed() {
  log_step "Building Zed Editor extension (aura-zed)..."
  if command -v cargo &>/dev/null; then
    # Ensure wasm32-wasip1 target is available
    if ! rustup target list --installed 2>/dev/null | grep -q "wasm32-wasip1"; then
      log_info "Adding rust target wasm32-wasip1..."
      rustup target add wasm32-wasip1
    fi
    (cd zed && cargo build --target wasm32-wasip1 --release)
    cp -f ./zed/target/wasm32-wasip1/release/aura_zed.wasm ./zed/extension.wasm
    log_success "Compiled zed/extension.wasm (WebAssembly)"
  else
    log_warn "cargo not found. Skipping compilation of zed/extension.wasm."
  fi
}

# ------------------------------------------------------------------------------
# Install Helpers
# ------------------------------------------------------------------------------
install_vscode() {
  if [[ -z "$VSCODE_CLI" ]]; then
    log_warn "Visual Studio Code CLI ('code') not found. Skipping VS Code install."
    log_info "You can manually install with: code --install-extension vscode/aura-vscode-0.2.0.vsix"
    return
  fi
  
  log_step "Installing into Visual Studio Code..."
  "$VSCODE_CLI" --install-extension "$SCRIPT_DIR/vscode/aura-vscode-0.2.0.vsix" --force
  log_success "Visual Studio Code extension installed successfully."
}

install_antigravity() {
  if [[ -z "$ANTIGRAVITY_CLI" ]]; then
    log_warn "Antigravity IDE executable not detected. Skipping Antigravity install."
    log_info "You can manually install with: <antigravity-cli> --install-extension antigravity/aura-antigravity-0.2.0.vsix"
    return
  fi

  log_step "Installing into Google Antigravity IDE..."
  "$ANTIGRAVITY_CLI" --install-extension "$SCRIPT_DIR/antigravity/aura-antigravity-0.2.0.vsix" --force
  log_success "Antigravity IDE extension installed successfully."
}

install_zed() {
  log_step "Installing into Zed Editor ($ZED_EXT_DIR)..."
  mkdir -p "$ZED_EXT_DIR"
  
  if [ "$DEV_LINK" = true ]; then
    log_info "Linking Zed extension files in developer mode..."
    mkdir -p "$ZED_EXT_DIR"
    ln -sf "$SCRIPT_DIR/zed/extension.toml" "$ZED_EXT_DIR/extension.toml"
    [[ -f "$SCRIPT_DIR/zed/extension.wasm" ]] && ln -sf "$SCRIPT_DIR/zed/extension.wasm" "$ZED_EXT_DIR/extension.wasm"
    rm -rf "$ZED_EXT_DIR/languages"
    ln -s "$SCRIPT_DIR/zed/languages" "$ZED_EXT_DIR/languages"
  else
    cp -f "$SCRIPT_DIR/zed/extension.toml" "$ZED_EXT_DIR/extension.toml"
    if [[ -f "$SCRIPT_DIR/zed/extension.wasm" ]]; then
      cp -f "$SCRIPT_DIR/zed/extension.wasm" "$ZED_EXT_DIR/extension.wasm"
    fi
    rm -rf "$ZED_EXT_DIR/languages"
    cp -r "$SCRIPT_DIR/zed/languages" "$ZED_EXT_DIR/"
  fi
  log_success "Zed Editor extension installed successfully."
}

install_nvim() {
  log_step "Installing into Neovim packpath ($NVIM_PACK_DIR)..."
  mkdir -p "$(dirname "$NVIM_PACK_DIR")"
  
  if [ "$DEV_LINK" = true ]; then
    log_info "Creating symlink for Neovim plugin in developer mode..."
    rm -rf "$NVIM_PACK_DIR"
    ln -s "$SCRIPT_DIR/nvim" "$NVIM_PACK_DIR"
  else
    rm -rf "$NVIM_PACK_DIR"
    cp -r "$SCRIPT_DIR/nvim" "$NVIM_PACK_DIR"
  fi
  log_success "Neovim plugin installed successfully."
}

# ------------------------------------------------------------------------------
# Main Flow
# ------------------------------------------------------------------------------
main() {
  print_banner

  # Determine what needs to be built / installed
  DO_VSCODE=false
  DO_ANTIGRAVITY=false
  DO_ZED=false
  DO_NVIM=false

  if [ "$TARGET_ALL" = true ]; then
    [[ -n "$VSCODE_CLI" || "$BUILD_ONLY" = true ]] && DO_VSCODE=true
    [[ -n "$ANTIGRAVITY_CLI" || "$BUILD_ONLY" = true ]] && DO_ANTIGRAVITY=true
    [[ "$ZED_EXISTS" = true || "$BUILD_ONLY" = true ]] && DO_ZED=true
    [[ "$NVIM_EXISTS" = true || "$BUILD_ONLY" = true ]] && DO_NVIM=true

    # If no editor was detected, build all by default
    if [ "$DO_VSCODE" = false ] && [ "$DO_ANTIGRAVITY" = false ] && [ "$DO_ZED" = false ] && [ "$DO_NVIM" = false ]; then
      DO_VSCODE=true
      DO_ANTIGRAVITY=true
      DO_ZED=true
      DO_NVIM=true
    fi
  else
    [ "$TARGET_VSCODE" = true ] && DO_VSCODE=true
    [ "$TARGET_ANTIGRAVITY" = true ] && DO_ANTIGRAVITY=true
    [ "$TARGET_ZED" = true ] && DO_ZED=true
    [ "$TARGET_NVIM" = true ] && DO_NVIM=true
  fi

  echo -e "${BOLD}Detected Editors & Installation Targets:${RESET}"
  echo -e "  • Visual Studio Code:       $([ "$DO_VSCODE" = true ] && echo -e "${GREEN}Enabled${RESET} (${VSCODE_CLI:-CLI not in PATH})" || echo -e "${DIM}Disabled${RESET}")"
  echo -e "  • Google Antigravity IDE:   $([ "$DO_ANTIGRAVITY" = true ] && echo -e "${GREEN}Enabled${RESET} (${ANTIGRAVITY_CLI:-CLI not in PATH})" || echo -e "${DIM}Disabled${RESET}")"
  echo -e "  • Zed Editor:               $([ "$DO_ZED" = true ] && echo -e "${GREEN}Enabled${RESET} ($ZED_EXT_DIR)" || echo -e "${DIM}Disabled${RESET}")"
  echo -e "  • Neovim:                   $([ "$DO_NVIM" = true ] && echo -e "${GREEN}Enabled${RESET} ($NVIM_PACK_DIR)" || echo -e "${DIM}Disabled${RESET}")"
  echo ""

  # 1. Compilation & Packaging
  [ "$DO_VSCODE" = true ] && build_vscode
  [ "$DO_ANTIGRAVITY" = true ] && build_antigravity
  [ "$DO_ZED" = true ] && build_zed

  if [ "$BUILD_ONLY" = true ]; then
    echo ""
    log_success "All requested packages built successfully (--build-only specified)."
    exit 0
  fi

  # 2. Installation into respective editors
  echo ""
  [ "$DO_VSCODE" = true ] && install_vscode
  [ "$DO_ANTIGRAVITY" = true ] && install_antigravity
  [ "$DO_ZED" = true ] && install_zed
  [ "$DO_NVIM" = true ] && install_nvim

  # 3. Post-install Summary & Guidance
  echo -e "\n${GREEN}${BOLD}==============================================================================${RESET}"
  echo -e "${GREEN}${BOLD}🎉 Aura Language Editor Support Installed Successfully!${RESET}"
  echo -e "${GREEN}${BOLD}==============================================================================${RESET}\n"

  echo -e "${BOLD}Next steps for your editors:${RESET}"
  if [ "$DO_VSCODE" = true ]; then
    echo -e "  ${CYAN}VS Code:${RESET}       Reload window (${BOLD}Cmd/Ctrl + Shift + P${RESET} > ${DIM}Developer: Reload Window${RESET})"
  fi
  if [ "$DO_ANTIGRAVITY" = true ]; then
    echo -e "  ${CYAN}Antigravity:${RESET}   Restart Antigravity IDE to activate AI commands and test runners"
  fi
  if [ "$DO_ZED" = true ]; then
    echo -e "  ${CYAN}Zed:${RESET}           Restart Zed Editor to load extension from ${DIM}$ZED_EXT_DIR${RESET}"
  fi
  if [ "$DO_NVIM" = true ]; then
    echo -e "  ${CYAN}Neovim:${RESET}        Ready to use! Open any ${DIM}.aura${RESET} file; plugin is loaded via packpath"
  fi
  echo ""
}

main "$@"
