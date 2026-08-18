---
id: core.store-models
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/models.rs
  - crates/oac-core/src/store.rs
  - crates/oac-core/src/app_paths.rs
stable_anchors:
  - crates/oac-core/src/models.rs::Extension
  - crates/oac-core/src/models.rs::ExtensionKind
  - crates/oac-core/src/models.rs::ConfigScope
  - crates/oac-core/src/store.rs::Store::open
  - crates/oac-core/src/store.rs::sync_extensions
  - crates/oac-core/src/store.rs::set_enabled
  - crates/oac-core/src/store.rs::set_disabled_config
  - crates/oac-core/src/store.rs::update_kit_zip_path
  - crates/oac-core/src/app_paths.rs::open_store
known_gaps:
  - Kimi MCP extra fields stay in the in-memory/Kit MCP entry and are not added as a new SQLite column; any future persisted metadata must still go through a schema migration plan.
---

# Models 与 SQLite Store

## 职责

`Extension` 是前后端共享的扩展库存模型，`Store` 负责 SQLite schema、迁移、扫描 upsert、启用状态、disabled snapshot、scope 和 Agent 设置。

## 关键事实

- `ExtensionKind` 当前包含 `skill`、`mcp`、`plugin`、`hook`、`cli`。
- `ConfigScope` 区分 global 与 project；同名 global/project Skill 不应互相改变状态。
- `sync_extensions()` 负责把 scanner 结果 upsert 到 DB，并在存在 OAC-managed disabled snapshot 时保留管理状态。
- MCP disabled snapshot 必须经过 manager 的 secret redaction。
- Kimi native MCP disable 不建立 disabled snapshot；其 `enabled` 状态由配置文件扫描回读。Kimi 专属 extra fields 只随 MCP entry/Kit blob 传递，不改变 Extension 表结构。
- `Store::open()` 会执行 schema migration，并在需要 migration 时尝试先备份数据库。
- 所有运行时入口必须经 `app_paths::open_store()` 打开数据库，以便先完成数据目录、Kit 路径和 Kiro 文件名迁移。

## 新增 Agent 必须检查

- 新 Agent 的 Extension ID、agent 列表和 scope 不会破坏现有 join/upsert 语义。
- native MCP toggle 的 on-disk enabled 状态能覆盖 DB 的旧 snapshot。
- 重扫、外部修改和 OAC 管理修改的优先级有测试证明。
