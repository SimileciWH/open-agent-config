use crate::{OacError, app_paths};
use std::path::PathBuf;

/// Canonical directory holding all Kit zip files: `~/.open-agent-config/kits/`.
pub fn kits_dir() -> Result<PathBuf, OacError> {
    Ok(app_paths::data_dir()?.join("kits"))
}

/// Ensure `~/.open-agent-config/kits/` exists; idempotent.
pub fn ensure_kits_dir() -> Result<PathBuf, OacError> {
    let dir = kits_dir()?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Build the canonical zip path for a Kit id.
pub fn zip_path_for(kit_id: &str) -> Result<PathBuf, OacError> {
    Ok(kits_dir()?.join(format!("{kit_id}{}", app_paths::KIT_SUFFIX)))
}
