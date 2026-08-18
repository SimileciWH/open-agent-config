use crate::models::{ConfigCategory, ExtensionKind};
use crate::OacError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const KIT_FORMAT_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KitManifest {
    pub kit_format_version: u32,
    pub kit_id: String,
    pub name: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub exported_from: String,
    pub extensions: Vec<ManifestExtension>,
    pub config_files: Vec<ManifestConfigFile>,
    #[serde(default)]
    pub secrets_stripped: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestExtension {
    pub name: String,
    pub kind: ExtensionKind,
    pub source_extension_id: String,
    pub source_url: Option<String>,
    pub content_hash: String,
    pub asset_path: String,
    pub position: i64,
    /// Git revision (`install_meta.revision`) captured from the source
    /// at pack time. Propagated to the deployed copy's install_meta so
    /// the Extensions detail panel shows the same version hash across the
    /// original and Kit-installed scope. (Semver `source.version` is also
    /// shown by `instanceVersion` when present, but lives inside the
    /// source_json blob and has no Store setter yet — not propagated here;
    /// deferred to a follow-up that adds a Store API for it.)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_revision: Option<String>,
    /// Git branch (`install_meta.branch`); preserved so the deployed copy
    /// tracks the same upstream.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestConfigFile {
    pub agent: String,
    pub category: ConfigCategory,
    pub filename: String,
    pub asset_path: String,
    pub position: i64,
}

/// Validate every manifest-controlled value that can influence a filesystem
/// path. ZIP entry names are checked separately as the archive is read, but
/// extension names and config filenames are later joined to a project root and
/// therefore need their own single-component validation.
pub fn validate_manifest_paths(manifest: &KitManifest) -> Result<(), OacError> {
    for extension in &manifest.extensions {
        crate::kits::zip_io::validate_entry_path(&extension.asset_path)?;
        if matches!(extension.kind, ExtensionKind::Skill | ExtensionKind::Cli) {
            crate::sanitize::validate_name(&extension.name).map_err(|error| {
                OacError::Validation(format!(
                    "Invalid Kit extension name '{}': {error}",
                    extension.name
                ))
            })?;
        }
    }

    for config in &manifest.config_files {
        crate::kits::zip_io::validate_entry_path(&config.asset_path)?;
        crate::sanitize::validate_name(&config.filename).map_err(|error| {
            OacError::Validation(format!(
                "Invalid Kit config filename '{}': {error}",
                config.filename
            ))
        })?;
    }

    Ok(())
}

/// Hash of arbitrary bytes, returned as `"sha256:<hex>"`.
pub fn sha256_of_bytes(bytes: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(bytes);
    format!("sha256:{:x}", h.finalize())
}

/// Hash of all files in a directory tree (skill folders).
/// Order is determined by sorted relative path; each entry contributes
/// `<relpath>\0<bytes>` to the hasher.
pub fn sha256_of_dir(root: &std::path::Path) -> std::io::Result<String> {
    let mut entries: Vec<(String, std::path::PathBuf)> = Vec::new();
    crate::kits::util::walk_dir(root, &mut |path, rel| {
        entries.push((rel.to_string(), path.to_path_buf()));
        Ok(())
    })?;
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    let mut h = Sha256::new();
    for (rel, full) in entries {
        h.update(rel.as_bytes());
        h.update(b"\0");
        let bytes = std::fs::read(&full)?;
        h.update(&bytes);
    }
    Ok(format!("sha256:{:x}", h.finalize()))
}
