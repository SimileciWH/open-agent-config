use crate::{OacError, sanitize, store::Store};
use fs2::FileExt;
use std::fs::{self, File, OpenOptions};
use std::path::{Path, PathBuf};

pub const DATA_DIR_NAME: &str = ".open-agent-config";
pub const LEGACY_DATA_DIR_NAME: &str = ".harnesskit";
pub const KIT_SUFFIX: &str = ".oac-kit.zip";
pub const LEGACY_KIT_SUFFIX: &str = ".hk-kit.zip";

/// Return the canonical OAC data path without touching the filesystem.
pub fn data_dir() -> Result<PathBuf, OacError> {
    let home = dirs::home_dir()
        .ok_or_else(|| OacError::Internal("home directory not found".into()))?;
    Ok(home.join(DATA_DIR_NAME))
}

/// Return the canonical OAC data directory after completing any legacy move.
pub fn prepare_data_dir() -> Result<PathBuf, OacError> {
    let home = dirs::home_dir()
        .ok_or_else(|| OacError::Internal("home directory not found".into()))?;
    prepare_data_dir_at(&home)
}

/// Open the canonical store and repair Kit paths left by the directory move.
pub fn open_store() -> Result<Store, OacError> {
    let home = dirs::home_dir()
        .ok_or_else(|| OacError::Internal("home directory not found".into()))?;
    open_store_at(&home)
}

fn open_store_at(home: &Path) -> Result<Store, OacError> {
    let data_dir = prepare_data_dir_at(home)?;
    let store = Store::open(&data_dir.join("metadata.db"))?;
    migrate_kit_paths(&store, &data_dir, &home.join(LEGACY_DATA_DIR_NAME))?;
    migrate_kiro_hook_files(&store, home)?;
    Ok(store)
}

fn open_migration_lock(home: &Path) -> Result<File, OacError> {
    let path = home.join(".open-agent-config.migration.lock");
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    Ok(options.open(path)?)
}

fn prepare_data_dir_at(home: &Path) -> Result<PathBuf, OacError> {
    let lock = open_migration_lock(home)?;
    lock.lock_exclusive()
        .map_err(|e| OacError::Internal(format!("cannot lock OAC data migration: {e}")))?;

    let data_dir = home.join(DATA_DIR_NAME);
    let legacy_dir = home.join(LEGACY_DATA_DIR_NAME);
    let result = match (data_dir.exists(), legacy_dir.exists()) {
        (true, true) => Err(OacError::Conflict(format!(
            "both {} and {} exist; merge or move one directory before starting OAC",
            data_dir.display(),
            legacy_dir.display()
        ))),
        (false, true) => {
            reject_symlink(&legacy_dir, "legacy data directory")?;
            fs::rename(&legacy_dir, &data_dir)?;
            Ok(data_dir)
        }
        (true, false) => {
            reject_symlink(&data_dir, "OAC data directory")?;
            Ok(data_dir)
        }
        (false, false) => {
            fs::create_dir_all(&data_dir)?;
            Ok(data_dir)
        }
    };

    FileExt::unlock(&lock)
        .map_err(|e| OacError::Internal(format!("cannot unlock OAC data migration: {e}")))?;
    result
}

fn reject_symlink(path: &Path, label: &str) -> Result<(), OacError> {
    let metadata = fs::symlink_metadata(path)?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(OacError::PathNotAllowed(format!(
            "{label} must be a real directory: {}",
            path.display()
        )));
    }
    Ok(())
}

fn migrate_kit_paths(
    store: &Store,
    data_dir: &Path,
    legacy_data_dir: &Path,
) -> Result<(), OacError> {
    let kits_dir = data_dir.join("kits");
    for row in store.list_kit_rows()? {
        sanitize::validate_name(&row.id)
            .map_err(|e| OacError::Validation(format!("invalid Kit id in database: {e}")))?;

        let target = kits_dir.join(format!("{}{}", row.id, KIT_SUFFIX));
        if !target.exists() {
            let candidates = [
                kits_dir.join(format!("{}{}", row.id, LEGACY_KIT_SUFFIX)),
                legacy_data_dir
                    .join("kits")
                    .join(format!("{}{}", row.id, LEGACY_KIT_SUFFIX)),
                legacy_data_dir
                    .join("kits")
                    .join(format!("{}{}", row.id, KIT_SUFFIX)),
            ];
            if let Some(source) = candidates.into_iter().find(|path| path.is_file()) {
                fs::create_dir_all(&kits_dir)?;
                fs::rename(source, &target)?;
            }
        }

        if target.exists() && row.zip_path != target.to_string_lossy() {
            store.update_kit_zip_path(&row.id, &target.to_string_lossy())?;
        }
    }
    Ok(())
}

fn migrate_kiro_hook_files(store: &Store, home: &Path) -> Result<(), OacError> {
    migrate_kiro_hook_file(&home.join(".kiro/hooks"))?;
    for project in store.list_projects()? {
        migrate_kiro_hook_file(&PathBuf::from(project.path).join(".kiro/hooks"))?;
    }
    Ok(())
}

fn migrate_kiro_hook_file(hooks_dir: &Path) -> Result<(), OacError> {
    let legacy = hooks_dir.join("harnesskit.json");
    let current = hooks_dir.join("open-agent-config.json");
    match (legacy.exists(), current.exists()) {
        (true, false) => {
            if fs::symlink_metadata(&legacy)?.file_type().is_symlink() {
                return Err(OacError::PathNotAllowed(format!(
                    "legacy Kiro hook file must not be a symlink: {}",
                    legacy.display()
                )));
            }
            fs::rename(legacy, current)?;
        }
        (true, true) => {
            return Err(OacError::Conflict(format!(
                "both legacy and OAC Kiro hook files exist in {}; merge them before starting OAC",
                hooks_dir.display()
            )));
        }
        _ => {}
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::KitRow;
    use chrono::Utc;
    use tempfile::TempDir;

    #[test]
    fn creates_new_data_directory() {
        let home = TempDir::new().unwrap();
        let data_dir = prepare_data_dir_at(home.path()).unwrap();
        assert_eq!(data_dir, home.path().join(DATA_DIR_NAME));
        assert!(data_dir.is_dir());
    }

    #[test]
    fn moves_legacy_directory_once() {
        let home = TempDir::new().unwrap();
        let legacy = home.path().join(LEGACY_DATA_DIR_NAME);
        fs::create_dir(&legacy).unwrap();
        fs::write(legacy.join("web-token"), "token").unwrap();

        let first = prepare_data_dir_at(home.path()).unwrap();
        let second = prepare_data_dir_at(home.path()).unwrap();

        assert_eq!(first, second);
        assert_eq!(fs::read_to_string(first.join("web-token")).unwrap(), "token");
        assert!(!legacy.exists());
    }

    #[test]
    fn refuses_split_brain_directories() {
        let home = TempDir::new().unwrap();
        fs::create_dir(home.path().join(DATA_DIR_NAME)).unwrap();
        fs::create_dir(home.path().join(LEGACY_DATA_DIR_NAME)).unwrap();

        let error = prepare_data_dir_at(home.path()).unwrap_err();
        assert!(matches!(error, OacError::Conflict(_)));
    }

    #[test]
    fn migrates_legacy_kit_file_and_database_path() {
        let home = TempDir::new().unwrap();
        let legacy = home.path().join(LEGACY_DATA_DIR_NAME);
        let legacy_kits = legacy.join("kits");
        fs::create_dir_all(&legacy_kits).unwrap();
        let legacy_zip = legacy_kits.join("kit-1.hk-kit.zip");
        fs::write(&legacy_zip, b"zip").unwrap();

        let store = Store::open(&legacy.join("metadata.db")).unwrap();
        let now = Utc::now();
        store
            .insert_kit(&KitRow {
                id: "kit-1".into(),
                name: "Kit".into(),
                description: String::new(),
                zip_path: legacy_zip.to_string_lossy().into_owned(),
                created_at: now,
                updated_at: now,
            })
            .unwrap();
        drop(store);

        let store = open_store_at(home.path()).unwrap();
        let row = store.get_kit_row("kit-1").unwrap().unwrap();
        let expected = home
            .path()
            .join(DATA_DIR_NAME)
            .join("kits/kit-1.oac-kit.zip");

        assert!(expected.is_file());
        assert_eq!(row.zip_path, expected.to_string_lossy());
        assert!(!legacy.exists());
    }

    #[test]
    fn migrates_legacy_kiro_hook_filename() {
        let home = TempDir::new().unwrap();
        let hooks = home.path().join(".kiro/hooks");
        fs::create_dir_all(&hooks).unwrap();
        fs::write(hooks.join("harnesskit.json"), b"{}").unwrap();

        migrate_kiro_hook_file(&hooks).unwrap();

        assert!(!hooks.join("harnesskit.json").exists());
        assert_eq!(
            fs::read(hooks.join("open-agent-config.json")).unwrap(),
            b"{}"
        );
    }
}
