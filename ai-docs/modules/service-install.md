---
id: core.service-install
level: L2
status: runtime-verified
verified_commit: 4321a802c021736592ba408b5ff913cff3919053
last_verified: 2026-08-18
source_paths:
  - crates/hk-core/src/service.rs
  - crates/hk-core/src/kits/*.rs
stable_anchors:
  - crates/hk-core/src/service.rs::install_to_agent
  - crates/hk-core/src/service.rs::delete_extension
  - crates/hk-core/src/service.rs::get_extension_content
  - crates/hk-core/src/kits/service.rs::sync_kit_to_project
known_gaps:
  - Kimi lifecycle hooks are not installable in v1 because the adapter advertises HookFormat::None.
---

# Service 与安装层

## 职责

Service 连接 marketplace、kits、scanner、deployer 和 Store，处理安装到 Agent、删除、内容读取、项目 scope 以及安装记录。

## 关键事实

- Adapter 的 capability 声明是安装路径和前端 gating 的共同来源。
- 安装 Skills、MCP、Hooks 和 CLI 时，目标 Agent 的路径和格式必须由 Adapter 解析。
- Kits 复用核心安装和项目同步能力，新增 Agent 时必须确认 kit asset/config 候选不会误写目标路径。

## 新增 Agent 必须检查

- `project_skill_dirs()`、`project_mcp_config_relpath()`、`project_hook_config_relpath()` 与 `install_to_agent` 的实际写入路径一致。
- 远程 MCP 的 transport 能力与 UI 的安装过滤一致。
- Kimi 专属 MCP 字段在目标仍为 Kimi 时保留；跨到其他 Agent 时由 deployer 明确拒绝不可逆转换，不静默丢失。
