// Kimi Code CLI configuration references:
// - MCP: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html
// - Skills: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html
// - Config files: https://www.kimi.com/code/docs/en/kimi-code-cli/configuration/config-files
//
// Kimi keeps MCP in mcp.json, separate from config.toml. The native `enabled`
// flag is preserved in place so disabling a server does not remove secrets or
// advanced fields that HarnessKit does not model yet.

use super::{AgentAdapter, HookEntry, HookFormat, McpServerEntry, ProjectMarker, RemoteMcpSchema};
use crate::models::ConfigScope;
use std::path::{Path, PathBuf};

pub struct KimiAdapter {
    home: PathBuf,
    kimi_home: PathBuf,
}

impl Default for KimiAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl KimiAdapter {
    pub fn new() -> Self {
        let home = dirs::home_dir().unwrap_or_default();
        let kimi_home = std::env::var_os("KIMI_CODE_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|| home.join(".kimi-code"));
        Self { home, kimi_home }
    }

    #[cfg(test)]
    pub fn with_home(home: PathBuf) -> Self {
        Self {
            kimi_home: home.join(".kimi-code"),
            home,
        }
    }

    fn parse_json(path: &Path) -> Option<serde_json::Value> {
        let content = std::fs::read_to_string(path).ok()?;
        serde_json::from_str(&content).ok()
    }
}

impl AgentAdapter for KimiAdapter {
    fn name(&self) -> &str {
        "kimi"
    }

    fn base_dir(&self) -> PathBuf {
        self.kimi_home.clone()
    }

    fn detect(&self) -> bool {
        self.base_dir().exists()
    }

    fn skill_dirs(&self) -> Vec<PathBuf> {
        // Kimi-specific skills follow KIMI_CODE_HOME; the shared directory
        // remains rooted at the real OS home so it can be shared by agents.
        vec![
            self.base_dir().join("skills"),
            self.home.join(".agents").join("skills"),
        ]
    }

    fn mcp_config_path(&self) -> PathBuf {
        self.base_dir().join("mcp.json")
    }

    fn hook_config_path(&self) -> PathBuf {
        // Kimi lifecycle hooks live in config.toml. Hook management is
        // intentionally out of scope for the first Kimi adapter slice.
        self.base_dir().join("config.toml")
    }

    fn plugin_dirs(&self) -> Vec<PathBuf> {
        vec![]
    }

    fn hook_format(&self) -> HookFormat {
        HookFormat::None
    }

    fn supports_native_mcp_toggle(&self) -> bool {
        true
    }

    fn supports_global_hook_install(&self) -> bool {
        false
    }

    fn read_mcp_servers(&self) -> Vec<McpServerEntry> {
        self.read_mcp_servers_from(&self.mcp_config_path())
    }

    fn read_mcp_servers_from(&self, path: &Path) -> Vec<McpServerEntry> {
        let Some(config) = Self::parse_json(path) else {
            return vec![];
        };
        let Some(servers) = config.get("mcpServers").and_then(|v| v.as_object()) else {
            return vec![];
        };

        servers
            .iter()
            .map(|(name, val)| {
                let url = val.get("url").and_then(|v| v.as_str()).map(String::from);
                let transport = match (url.is_some(), val.get("transport").and_then(|v| v.as_str()))
                {
                    (true, Some("sse")) => super::McpTransport::Sse,
                    (true, _) => super::McpTransport::Http,
                    (false, _) => super::McpTransport::Stdio,
                };
                McpServerEntry {
                    name: name.clone(),
                    command: val
                        .get("command")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .into(),
                    args: super::json_string_vec(val, "args"),
                    env: super::json_string_map(val, "env"),
                    transport,
                    url,
                    headers: super::json_string_map(val, "headers"),
                    extra: super::json_extra_fields(
                        val,
                        &[
                            "command",
                            "args",
                            "env",
                            "url",
                            "transport",
                            "headers",
                            "enabled",
                        ],
                    ),
                    enabled: val.get("enabled").and_then(|v| v.as_bool()).unwrap_or(true),
                }
            })
            .collect()
    }

    fn read_hooks(&self) -> Vec<HookEntry> {
        vec![]
    }

    fn translate_hook_event(&self, _event: &str) -> Option<String> {
        None
    }

    fn global_settings_files(&self) -> Vec<PathBuf> {
        vec![self.hook_config_path(), self.mcp_config_path()]
    }

    fn project_markers(&self) -> Vec<ProjectMarker> {
        vec![ProjectMarker::Dir(".kimi-code")]
    }

    fn project_settings_patterns(&self) -> Vec<String> {
        vec![".kimi-code/mcp.json".into()]
    }

    fn project_skill_dirs(&self) -> Vec<String> {
        vec![".kimi-code/skills".into(), ".agents/skills".into()]
    }

    fn project_skill_read_dirs(&self) -> Vec<String> {
        vec![".agents/skills".into()]
    }

    fn project_mcp_config_relpath(&self) -> Option<String> {
        Some(".kimi-code/mcp.json".into())
    }

    fn project_hook_config_relpath(&self) -> Option<String> {
        None
    }

    fn remote_mcp_schema(&self) -> RemoteMcpSchema {
        RemoteMcpSchema::Kimi
    }

    fn hook_config_paths_for(&self, scope: &ConfigScope) -> Vec<PathBuf> {
        self.hook_config_path_for(scope).into_iter().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::super::{AgentAdapter, McpTransport};
    use super::*;

    #[test]
    fn read_mcp_servers_parses_kimi_transports_and_enabled_state() {
        let tmp = tempfile::tempdir().unwrap();
        let config = tmp.path().join("mcp.json");
        std::fs::write(
            &config,
            r#"{"mcpServers":{
                "fs":{"command":"npx","args":["-y","server-fs"],"cwd":"/tmp/project"},
                "linear":{"url":"https://mcp.linear.app/mcp","headers":{"Authorization":"Bearer token"}},
                "events":{"transport":"sse","url":"https://example.com/sse","enabled":false}
            }}"#,
        )
        .unwrap();

        let adapter = KimiAdapter::with_home(tmp.path().to_path_buf());
        let servers = adapter.read_mcp_servers_from(&config);
        let by_name: std::collections::HashMap<_, _> =
            servers.iter().map(|s| (s.name.as_str(), s)).collect();

        assert_eq!(by_name["fs"].transport, McpTransport::Stdio);
        assert_eq!(by_name["fs"].command, "npx");
        assert_eq!(by_name["fs"].extra["cwd"], "/tmp/project");
        assert_eq!(by_name["linear"].transport, McpTransport::Http);
        assert_eq!(
            by_name["linear"].url.as_deref(),
            Some("https://mcp.linear.app/mcp")
        );
        assert_eq!(by_name["events"].transport, McpTransport::Sse);
        assert!(!by_name["events"].enabled);
    }

    #[test]
    fn paths_follow_kimi_home_and_project_conventions() {
        let tmp = tempfile::tempdir().unwrap();
        let adapter = KimiAdapter::with_home(tmp.path().to_path_buf());
        assert_eq!(adapter.base_dir(), tmp.path().join(".kimi-code"));
        assert_eq!(
            adapter.mcp_config_path(),
            tmp.path().join(".kimi-code/mcp.json")
        );
        assert_eq!(
            adapter.skill_dirs()[0],
            tmp.path().join(".kimi-code/skills")
        );
        assert_eq!(adapter.project_skill_dirs()[0], ".kimi-code/skills");
        assert_eq!(
            adapter.project_mcp_config_relpath().as_deref(),
            Some(".kimi-code/mcp.json")
        );
        assert_eq!(adapter.hook_format(), HookFormat::None);
    }
}
