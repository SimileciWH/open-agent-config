---
id: core.kits
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/kits/*.rs
  - crates/oac-core/src/kits/tests/*.rs
  - crates/oac-core/src/app_paths.rs
  - src/pages/kits.tsx
stable_anchors:
  - crates/oac-core/src/kits/manifest.rs::validate_manifest_paths
  - crates/oac-core/src/kits/install_plan.rs::compute_kit_install_plan
  - crates/oac-core/src/kits/service.rs::sync_kit_to_project
  - crates/oac-core/src/kits/service.rs::unsync_kit_from_project
  - crates/oac-core/src/kits/service.rs::import_kit
  - crates/oac-core/src/kits/zip_io.rs::validate_entry_path
known_gaps:
  - ZIP entry count, total expanded size, per-entry size, and compression-ratio limits are not yet enforced.
  - Kit format_version remains 1; the filename identity changed without changing manifest schema.
---

# Kit 生命周期与路径安全

## 职责

Kit 层负责打包、导出、导入、预览、项目同步、反同步、冲突计划和安装记录。OAC 新包使用 `.oac-kit.zip`，导入仍接受旧后缀作为迁移输入。

## 路径安全合同

- ZIP entry 名先经 `validate_entry_path()` 拒绝绝对路径、父目录、Windows prefix 和 NUL。
- manifest 中会被拼入目标路径的 Skill/CLI 名称与配置文件名必须经 `validate_manifest_paths()` 做单组件校验。
- 安装计划、同步和反同步在实际读写前再次调用同一校验，并用 `validate_path_within()` 证明最终目标仍位于项目根目录。
- 删除和覆盖不得信任数据库或 manifest 中未经重验的路径。

## 兼容与验证

- 新建、更新和导出只写 `.oac-kit.zip`；旧包导入成功后以 OAC 后缀持久化。
- 路径穿越、绝对路径、符号链接目标、越界反同步，以及项目根目录缺失时仍存在的外部记录路径都有回归测试。
- 资源耗尽防护仍是已记录缺口，不能把路径测试通过等同于完整 ZIP 安全。
