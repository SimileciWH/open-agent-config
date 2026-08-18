use crate::kits::paths::{kits_dir, zip_path_for};

#[test]
fn zip_path_for_uses_oac_kit_zip_suffix() {
    let p = zip_path_for("abc-123").unwrap();
    assert!(p.to_string_lossy().ends_with("abc-123.oac-kit.zip"));
}

#[test]
fn kits_dir_is_under_home() {
    let dir = kits_dir().unwrap();
    let home = dirs::home_dir().unwrap();
    assert!(dir.starts_with(home));
    assert!(
        dir.ends_with(".open-agent-config/kits")
            || dir.ends_with(r".open-agent-config\kits")
    );
}
