use crate::adapter::all_adapters;
use crate::kits::install_plan::{compute_kit_install_plan, PlanItemKind};
use crate::kits::manifest::{
    KitManifest, ManifestConfigFile, ManifestExtension, KIT_FORMAT_VERSION,
};
use crate::kits::zip_io::{pack_kit, PackEntry};
use crate::models::{ConfigCategory, ExtensionKind};
use chrono::Utc;
use std::fs;
use tempfile::tempdir;

fn write_kit(dir: &std::path::Path) -> std::path::PathBuf {
    write_kit_with_names(dir, "react-helper", "CLAUDE.md")
}

fn write_kit_with_names(
    dir: &std::path::Path,
    extension_name: &str,
    config_filename: &str,
) -> std::path::PathBuf {
    let zip_path = dir.join("k.oac-kit.zip");
    let manifest = KitManifest {
        kit_format_version: KIT_FORMAT_VERSION,
        kit_id: "k1".into(),
        name: "K1".into(),
        description: "".into(),
        created_at: Utc::now(),
        exported_from: "test".into(),
        extensions: vec![ManifestExtension {
            name: extension_name.into(),
            kind: ExtensionKind::Skill,
            source_extension_id: "ext-1".into(),
            source_url: None,
            content_hash: "sha256:abc".into(),
            asset_path: "assets/ext-1/SKILL.md".into(),
            position: 0,
            source_revision: None,
            source_branch: None,
        }],
        config_files: vec![ManifestConfigFile {
            agent: "claude".into(),
            category: ConfigCategory::Rules,
            filename: config_filename.into(),
            asset_path: "assets/config-claude-rules/CLAUDE.md".into(),
            position: 0,
        }],
        secrets_stripped: vec![],
    };
    let entries = vec![
        PackEntry {
            zip_path: "assets/ext-1/SKILL.md".into(),
            bytes: b"body".to_vec(),
        },
        PackEntry {
            zip_path: "assets/config-claude-rules/CLAUDE.md".into(),
            bytes: b"rules".to_vec(),
        },
    ];
    pack_kit(&zip_path, &manifest, &entries).unwrap();
    zip_path
}

#[test]
fn plan_marks_conflicts_when_target_exists() {
    let dir = tempdir().unwrap();
    let project = dir.path().join("proj");
    fs::create_dir_all(&project).unwrap();
    // Pre-create the CLAUDE.md target to force a config conflict
    fs::write(project.join("CLAUDE.md"), "pre-existing").unwrap();

    let zip = write_kit(dir.path());
    let adapters = all_adapters();
    let plan = compute_kit_install_plan(&adapters, &zip, project.to_str().unwrap(), "claude").unwrap();
    let config_item = plan
        .iter()
        .find(|i| matches!(i.asset_kind, PlanItemKind::Config { .. }))
        .expect("config item should be in the plan");
    assert!(config_item.conflicts_with_existing);
}

#[test]
fn plan_target_path_joins_with_project_root() {
    let dir = tempdir().unwrap();
    let project = dir.path().join("proj");
    fs::create_dir_all(&project).unwrap();
    let zip = write_kit(dir.path());
    let adapters = all_adapters();
    let plan = compute_kit_install_plan(&adapters, &zip, project.to_str().unwrap(), "claude").unwrap();
    for item in &plan {
        assert!(
            item.target_path.starts_with(&project),
            "target {:?} must be inside project root {:?}",
            item.target_path,
            project
        );
    }
}

#[test]
fn plan_returns_error_when_agent_unknown() {
    let dir = tempdir().unwrap();
    let project = dir.path().join("proj");
    fs::create_dir_all(&project).unwrap();
    let zip = write_kit(dir.path());
    let adapters = all_adapters();
    let res = compute_kit_install_plan(&adapters, &zip, project.to_str().unwrap(), "no-such-agent");
    assert!(res.is_err());
}

#[test]
fn plan_rejects_manifest_controlled_extension_paths() {
    for unsafe_name in ["../../escape", "/tmp/escape", r"C:\escape"] {
        let dir = tempdir().unwrap();
        let project = dir.path().join("proj");
        fs::create_dir_all(&project).unwrap();
        let zip = write_kit_with_names(dir.path(), unsafe_name, "CLAUDE.md");
        let result = compute_kit_install_plan(
            &all_adapters(),
            &zip,
            project.to_str().unwrap(),
            "claude",
        );
        assert!(result.is_err(), "unsafe extension name was accepted: {unsafe_name}");
    }
}

#[test]
fn plan_rejects_manifest_controlled_config_paths() {
    for unsafe_name in ["../escape.md", "/tmp/escape.md", r"C:\escape.md"] {
        let dir = tempdir().unwrap();
        let project = dir.path().join("proj");
        fs::create_dir_all(&project).unwrap();
        let zip = write_kit_with_names(dir.path(), "react-helper", unsafe_name);
        let result = compute_kit_install_plan(
            &all_adapters(),
            &zip,
            project.to_str().unwrap(),
            "claude",
        );
        assert!(result.is_err(), "unsafe config filename was accepted: {unsafe_name}");
    }
}

#[cfg(unix)]
#[test]
fn plan_rejects_symlinked_target_directory_outside_project() {
    use std::os::unix::fs::symlink;

    let dir = tempdir().unwrap();
    let project = dir.path().join("proj");
    let outside = dir.path().join("outside");
    fs::create_dir_all(project.join(".claude")).unwrap();
    fs::create_dir_all(&outside).unwrap();
    symlink(&outside, project.join(".claude/skills")).unwrap();

    let zip = write_kit(dir.path());
    let result = compute_kit_install_plan(
        &all_adapters(),
        &zip,
        project.to_str().unwrap(),
        "claude",
    );
    assert!(result.is_err(), "symlinked target escaped the project root");
}
