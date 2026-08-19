---
id: runtime.identity-migration
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - Cargo.toml
  - crates/oac-core/src/app_paths.rs
  - crates/oac-core/src/adapter/codex.rs
  - crates/oac-core/src/adapter/kiro.rs
  - crates/oac-core/src/deployer.rs
  - crates/oac-cli/src/main.rs
  - crates/oac-web/src/lib.rs
  - crates/oac-desktop/src/main.rs
  - crates/oac-desktop/tauri.conf.json
  - src/lib/storage.ts
  - src/stores/*.ts
  - public/icons/*.png
  - crates/oac-desktop/icons/*
  - .github/workflows/release.yml
  - scripts/check-oac-identity.mjs
stable_anchors:
  - crates/oac-core/src/app_paths.rs::data_dir
  - crates/oac-core/src/app_paths.rs::prepare_data_dir
  - crates/oac-core/src/app_paths.rs::open_store
  - crates/oac-core/src/deployer.rs::split_dsh_managed_block
  - src/lib/storage.ts::readMigratedStorage
  - src/lib/storage.ts::writeMigratedStorage
  - scripts/check-oac-identity.mjs::validateIdentity
known_gaps:
  - The OAC Tauri identifier is a new application identity, so legacy desktop installations are not upgraded in place.
  - The old CLI command is intentionally not shipped as a shim; scripts must migrate to oac.
  - When both legacy and OAC data directories or Kiro managed files exist, startup stops with a conflict instead of attempting an unsafe merge.
---

# OAC 身份与兼容迁移

## 职责

本模块定义 Open Agent Config 的唯一新写入身份，以及从旧身份到 OAC 的一次性、幂等迁移。CLI、Web 和 Tauri 必须通过相同入口完成迁移，不能各自拼接数据路径。

## OAC 新写入合同

- 命令和 Rust package：`oac`、`oac-core`、`oac-cli`、`oac-web`、`oac-desktop`。
- 数据目录和 Kit：`~/.open-agent-config`、`.oac-kit.zip`。
- Kiro managed hook：`open-agent-config.json`。
- Codex 元数据和 DSH marker：`_oac_name` 与 OAC managed block。
- 浏览器状态键、release 资产、安装说明和图标只使用 OAC 身份。

## 旧输入兼容边界

- `app_paths::prepare_data_dir()` 在进程锁下把旧目录原子移动为 OAC 目录，并拒绝符号链接及双目录 split-brain。
- `app_paths::open_store()` 修复 Kit 文件后缀、数据库 `zip_path` 和 Kiro managed 文件名；所有运行时入口必须调用它。
- Codex、DSH、Kit import 和 localStorage 只读取旧标识以迁移；后续写入会规范化为 OAC 标识。
- 历史 release note 的用户可见品牌、命令和资产名同步重写为 OAC；Tauri identifier 使用 `com.openagentconfig.app`，不再保留旧产品运行时身份。
- 身份门禁扫描 tracked/untracked 的现存文件，并跳过工作树中已删除但尚未提交的 tracked 文件，保证页面或资源删除不会让本地 pre-commit 检查误报 `ENOENT`。

## 不变量

```text
legacy input -> one migration -> OAC output
new operation -> OAC output only
ambiguous dual state -> explicit conflict, no merge
```
