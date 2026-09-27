use zed_extension_api::{self as zed, LanguageServerId, Result};

struct AuraExtension;

impl zed::Extension for AuraExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        // 1. Check workspace target/release or target/debug
        if let Some(path) = worktree.which("target/release/auralsp") {
            return Ok(zed::Command {
                command: path,
                args: vec![],
                env: Default::default(),
            });
        }

        // 2. Check for auralsp on system PATH
        if let Some(path) = worktree.which("auralsp") {
            return Ok(zed::Command {
                command: path,
                args: vec![],
                env: Default::default(),
            });
        }

        // 3. Fallback to aurac lsp on PATH
        if let Some(path) = worktree.which("aurac") {
            return Ok(zed::Command {
                command: path,
                args: vec!["lsp".to_string()],
                env: Default::default(),
            });
        }

        // 4. Default executable invocation
        Ok(zed::Command {
            command: "auralsp".to_string(),
            args: vec![],
            env: Default::default(),
        })
    }
}

zed::register_extension!(AuraExtension);
