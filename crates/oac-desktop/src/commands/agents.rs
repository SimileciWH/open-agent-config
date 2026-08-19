use super::AppState;
use oac_core::{OacError, models::*, scanner};
use tauri::State;

#[tauri::command]
pub fn list_agents(state: State<AppState>) -> Result<Vec<AgentInfo>, OacError> {
    let adapters = &*state.adapters;
    let store = state.store.lock();

    // Build agent order map from DB (or fall back to adapter iteration order)
    let db_order = store.get_agent_order().unwrap_or_default();
    let order_map: std::collections::HashMap<String, i32> = db_order.into_iter().collect();

    let mut result = Vec::new();
    for a in adapters {
        let enabled = store
            .get_agent_setting(a.name())
            .map(|(_, enabled)| enabled)
            .unwrap_or(true);
        result.push(AgentInfo {
            name: a.name().to_string(),
            detected: a.detect(),
            extension_count: 0,
            // The adapter path is the actual detection/scanning source of
            // truth. Legacy custom_path records are retained in SQLite for
            // compatibility but must not be presented as active overrides.
            path: a.base_dir().to_string_lossy().to_string(),
            enabled,
            capabilities: AgentCapabilities::from_adapter(a.as_ref()),
        });
    }

    // Sort by user-defined order; agents without sort_order go to end (index 999)
    result.sort_by_key(|a| *order_map.get(&a.name).unwrap_or(&999));
    Ok(result)
}

#[tauri::command]
pub fn update_agent_path(
    state: State<AppState>,
    name: String,
    path: Option<String>,
) -> Result<(), OacError> {
    let store = state.store.lock();
    store.set_agent_path(&name, path.as_deref())
}

#[tauri::command]
pub fn set_agent_enabled(
    state: State<AppState>,
    name: String,
    enabled: bool,
) -> Result<(), OacError> {
    let store = state.store.lock();
    store.set_agent_enabled(&name, enabled)
}

#[tauri::command]
pub fn update_agent_order(state: State<AppState>, names: Vec<String>) -> Result<(), OacError> {
    let adapters = &*state.adapters;
    let valid_names: std::collections::HashSet<&str> = adapters.iter().map(|a| a.name()).collect();
    if names.iter().any(|n| !valid_names.contains(n.as_str())) {
        return Err(OacError::Validation(
            "Invalid agent name in order list".into(),
        ));
    }
    let store = state.store.lock();
    store.set_agent_order(&names)
}

#[tauri::command]
pub fn list_agent_configs(state: State<AppState>) -> Result<Vec<AgentDetail>, OacError> {
    let adapters = &*state.adapters;
    let store = state.store.lock();

    let projects = store.list_project_tuples();

    let mut results = Vec::new();
    for a in adapters {
        let detected = a.detect();
        let mut config_files = if detected {
            scanner::scan_agent_configs(a.as_ref(), &projects)
        } else {
            vec![]
        };

        // Merge user-defined custom config paths (skip if path already found by auto-scan)
        let existing_paths: std::collections::HashSet<String> = config_files
            .iter()
            .filter_map(|f| std::path::Path::new(&f.path).canonicalize().ok())
            .map(|p| p.to_string_lossy().to_string())
            .collect();
        if let Ok(custom_paths) = store.list_custom_config_paths(a.name()) {
            for (id, path, label, category_str, scope_json) in custom_paths {
                let canonical = std::path::Path::new(&path)
                    .canonicalize()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| path.clone());
                if existing_paths.contains(&canonical) {
                    continue;
                }
                let category = category_str
                    .parse::<ConfigCategory>()
                    .unwrap_or(ConfigCategory::Settings);
                let scope = scope_json
                    .as_deref()
                    .and_then(|s| serde_json::from_str::<ConfigScope>(s).ok())
                    .unwrap_or(ConfigScope::Global);
                let p = std::path::Path::new(&path);
                let (size_bytes, modified_at, is_dir, exists) =
                    if let Ok(meta) = std::fs::metadata(p) {
                        let modified = meta.modified().ok().map(|t| {
                            let d = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                            chrono::DateTime::<chrono::Utc>::from_timestamp(d.as_secs() as i64, 0)
                                .unwrap_or_default()
                        });
                        (meta.len(), modified, meta.is_dir(), true)
                    } else {
                        (0, None, false, false)
                    };
                config_files.push(AgentConfigFile {
                    path: path.clone(),
                    agent: a.name().to_string(),
                    category,
                    scope,
                    file_name: p
                        .file_name()
                        .map(|f| f.to_string_lossy().to_string())
                        .unwrap_or_else(|| path.clone()),
                    size_bytes,
                    modified_at,
                    is_dir,
                    exists,
                    custom_id: Some(id),
                    custom_label: Some(label),
                });
            }
        }

        let extensions = store
            .list_extensions(None, Some(a.name()))
            .unwrap_or_default();
        let all = extensions.iter();
        let extension_counts = ExtensionCounts {
            skill: all
                .clone()
                .filter(|e| e.kind == ExtensionKind::Skill)
                .count(),
            mcp: all
                .clone()
                .filter(|e| e.kind == ExtensionKind::Mcp)
                .count(),
            plugin: all
                .clone()
                .filter(|e| e.kind == ExtensionKind::Plugin)
                .count(),
            hook: all
                .clone()
                .filter(|e| e.kind == ExtensionKind::Hook)
                .count(),
            cli: all.filter(|e| e.kind == ExtensionKind::Cli).count(),
        };

        results.push(AgentDetail {
            name: a.name().to_string(),
            detected,
            config_files,
            extension_counts,
        });
    }
    Ok(results)
}
