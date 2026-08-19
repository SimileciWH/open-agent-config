use axum::extract::State;
use axum::Json;
use oac_core::kits::project_summary::{
    count_project_extensions as core_count_project_extensions, ProjectExtensionCounts,
};
use oac_core::models::{DiscoveredProject, Project};
use oac_core::scanner;
use serde::Deserialize;
use std::path::Path;
use std::process::{Command, Output};

use crate::router::{blocking, ApiError};
use crate::state::WebState;

type Result<T> = std::result::Result<Json<T>, ApiError>;

pub async fn list_projects(
    State(state): State<WebState>,
) -> Result<Vec<Project>> {
    blocking(move || {
        let store = state.store.lock();
        let mut projects = store.list_projects()?;
        for p in &mut projects {
            p.exists = std::path::Path::new(&p.path).exists();
        }
        Ok(projects)
    }).await
}

#[derive(Deserialize)]
pub struct AddProjectParams {
    pub path: String,
}

pub async fn add_project(
    State(state): State<WebState>,
    Json(params): Json<AddProjectParams>,
) -> Result<Project> {
    blocking(move || {
        // Canonicalize to prevent duplicates via symlinks/relative paths
        let project_path = std::path::Path::new(&params.path)
            .canonicalize()
            .map_err(|e| oac_core::OacError::CommandFailed(format!("Invalid path: {}", e)))?;
        let project_path = super::normalize(&project_path);
        let path = project_path.to_string_lossy().to_string();

        // Validate the path contains project markers for any supported agent.
        // Each adapter declares its own markers via project_markers() — see
        // scanner::is_project_dir.
        if !scanner::is_project_dir(&project_path) {
            return Err(oac_core::OacError::Validation(
                "Directory does not contain any recognized agent configuration".into(),
            ));
        }

        // Check for duplicate before insert
        let store = state.store.lock();
        let existing = store.list_projects()?;
        if existing.iter().any(|p| p.path == path) {
            return Err(oac_core::OacError::Conflict("Project already added".into()));
        }

        let id = format!("proj-{:016x}", scanner::fnv1a(path.as_bytes()));
        let name = project_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let project = Project {
            id,
            name,
            path,
            created_at: chrono::Utc::now(),
            exists: true,
        };
        store.insert_project(&project)?;
        Ok(project)
    }).await
}

#[derive(Deserialize)]
pub struct RemoveProjectParams {
    pub id: String,
}

pub async fn remove_project(
    State(state): State<WebState>,
    Json(params): Json<RemoveProjectParams>,
) -> Result<()> {
    blocking(move || {
        let store = state.store.lock();
        store.delete_project(&params.id)?;
        Ok(())
    }).await
}

#[derive(Deserialize)]
pub struct CountExtensionsBody {
    pub path: String,
}

pub async fn count_project_extensions(
    State(state): State<WebState>,
    Json(body): Json<CountExtensionsBody>,
) -> Result<ProjectExtensionCounts> {
    blocking(move || {
        let p = std::path::Path::new(&body.path);
        Ok(core_count_project_extensions(p, &state.adapters))
    })
    .await
}

#[derive(Deserialize)]
pub struct DiscoverProjectsParams {
    pub root_path: String,
}

pub async fn discover_projects(
    State(_state): State<WebState>,
    Json(params): Json<DiscoverProjectsParams>,
) -> Result<Vec<DiscoveredProject>> {
    blocking(move || {
        let root = std::path::Path::new(&params.root_path);
        // Reject root directories: "/" on Unix, "C:\" on Windows
        let root_str = params.root_path.as_str();
        let is_drive_root = oac_core::sanitize::is_windows_abs_path(root_str) && root_str.len() <= 3;
        if root == std::path::Path::new("/") || root.parent().is_none() || is_drive_root {
            return Err(oac_core::OacError::Validation(
                "Cannot scan root directory — choose a more specific path".into(),
            ));
        }
        if !root.is_dir() {
            return Err(oac_core::OacError::Validation(format!(
                "Not a directory: {}", params.root_path
            )));
        }
        Ok(scanner::discover_projects(root, 12))
    }).await
}

/// Open the host operating system's native folder picker for local Web mode.
/// Tauri uses its dialog plugin directly; Web needs the backend because normal
/// browser APIs intentionally do not expose an absolute filesystem path.
pub async fn select_project_directory() -> Result<Option<String>> {
    blocking(select_project_directory_native).await
}

fn selected_directory_from_output(
    stdout: &[u8],
) -> std::result::Result<Option<String>, oac_core::OacError> {
    let output = String::from_utf8_lossy(stdout);
    let selected = output.trim_end_matches(['\r', '\n']);
    if selected.is_empty() {
        return Ok(None);
    }

    let canonical = Path::new(selected).canonicalize().map_err(|error| {
        oac_core::OacError::CommandFailed(format!(
            "The selected folder could not be resolved: {error}"
        ))
    })?;
    if !canonical.is_dir() {
        return Err(oac_core::OacError::Validation(
            "The selected path is not a directory".into(),
        ));
    }

    Ok(Some(
        super::normalize(&canonical).to_string_lossy().to_string(),
    ))
}

fn picker_command_failed(program: &str, output: &Output) -> oac_core::OacError {
    let detail = String::from_utf8_lossy(&output.stderr);
    let detail = detail.trim();
    let message = if detail.is_empty() {
        format!("{program} exited with status {}", output.status)
    } else {
        format!("{program} failed: {detail}")
    };
    oac_core::OacError::CommandFailed(message)
}

#[cfg(any(target_os = "macos", test))]
fn select_project_directory_macos() -> std::result::Result<Option<String>, oac_core::OacError> {
    let output = Command::new("/usr/bin/osascript")
        .args([
            "-e",
            r#"tell application "Finder""#,
            "-e",
            "activate",
            "-e",
            r#"POSIX path of (choose folder with prompt "Choose a workspace folder")"#,
            "-e",
            "end tell",
        ])
        .output()
        .map_err(|error| {
            oac_core::OacError::CommandFailed(format!(
                "Could not launch the macOS folder picker: {error}"
            ))
        })?;

    if output.status.success() {
        return selected_directory_from_output(&output.stdout);
    }
    if String::from_utf8_lossy(&output.stderr).contains("(-128)") {
        return Ok(None);
    }
    Err(picker_command_failed("osascript", &output))
}

#[cfg(any(target_os = "windows", test))]
fn select_project_directory_windows() -> std::result::Result<Option<String>, oac_core::OacError> {
    const SCRIPT: &str = r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Choose a workspace folder'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  [Console]::Out.Write($dialog.SelectedPath)
}
"#;

    let output = Command::new("powershell.exe")
        .args(["-NoLogo", "-NoProfile", "-STA", "-Command", SCRIPT])
        .output()
        .map_err(|error| {
            oac_core::OacError::CommandFailed(format!(
                "Could not launch the Windows folder picker: {error}"
            ))
        })?;

    if output.status.success() {
        selected_directory_from_output(&output.stdout)
    } else {
        Err(picker_command_failed("powershell.exe", &output))
    }
}

#[cfg(any(target_os = "linux", test))]
fn select_project_directory_linux() -> std::result::Result<Option<String>, oac_core::OacError> {
    let candidates: [(&str, &[&str]); 3] = [
        (
            "zenity",
            &[
                "--file-selection",
                "--directory",
                "--title=Choose a workspace folder",
            ],
        ),
        (
            "yad",
            &[
                "--file-selection",
                "--directory",
                "--title=Choose a workspace folder",
            ],
        ),
        (
            "kdialog",
            &[
                "--getexistingdirectory",
                ".",
                "--title",
                "Choose a workspace folder",
            ],
        ),
    ];
    let mut last_failure = None;

    for (program, args) in candidates {
        let output = match Command::new(program).args(args).output() {
            Ok(output) => output,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => {
                return Err(oac_core::OacError::CommandFailed(format!(
                    "Could not launch {program}: {error}"
                )));
            }
        };

        if output.status.success() {
            return selected_directory_from_output(&output.stdout);
        }
        if output.status.code() == Some(1) && output.stderr.is_empty() {
            return Ok(None);
        }
        last_failure = Some(picker_command_failed(program, &output));
    }

    Err(last_failure.unwrap_or_else(|| {
        oac_core::OacError::CommandFailed(
            "No native folder picker is available. Install zenity, yad, or kdialog, or paste the path instead."
                .into(),
        )
    }))
}

#[cfg(target_os = "macos")]
fn select_project_directory_native() -> std::result::Result<Option<String>, oac_core::OacError> {
    select_project_directory_macos()
}

#[cfg(target_os = "windows")]
fn select_project_directory_native() -> std::result::Result<Option<String>, oac_core::OacError> {
    select_project_directory_windows()
}

#[cfg(target_os = "linux")]
fn select_project_directory_native() -> std::result::Result<Option<String>, oac_core::OacError> {
    select_project_directory_linux()
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn select_project_directory_native() -> std::result::Result<Option<String>, oac_core::OacError> {
    Err(oac_core::OacError::CommandFailed(
        "Native folder selection is not supported on this operating system; paste the path instead."
            .into(),
    ))
}

#[cfg(test)]
mod tests {
    use super::selected_directory_from_output;
    use std::path::Path;

    #[test]
    fn all_platform_picker_implementations_typecheck() {
        let _macos = super::select_project_directory_macos;
        let _windows = super::select_project_directory_windows;
        let _linux = super::select_project_directory_linux;
    }

    #[test]
    fn empty_picker_output_is_a_cancel() {
        assert_eq!(selected_directory_from_output(b"\n").unwrap(), None);
    }

    #[test]
    fn picker_output_is_canonicalized_and_keeps_spaces() {
        let root = tempfile::tempdir().unwrap();
        let selected = root.path().join("workspace with spaces");
        std::fs::create_dir_all(&selected).unwrap();
        let raw = format!("{}\n", selected.display());

        let result = selected_directory_from_output(raw.as_bytes())
            .unwrap()
            .expect("selected path");
        assert_eq!(
            Path::new(&result),
            super::super::normalize(&selected.canonicalize().unwrap())
        );
    }
}
