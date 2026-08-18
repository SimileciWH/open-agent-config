---
id: core.manager-deployer
level: L2
status: runtime-verified
verified_commit: 4321a802c021736592ba408b5ff913cff3919053
last_verified: 2026-08-18
source_paths:
  - crates/hk-core/src/manager.rs
  - crates/hk-core/src/deployer.rs
stable_anchors:
  - crates/hk-core/src/manager.rs::toggle_extension_with_adapters
  - crates/hk-core/src/manager.rs::toggle_skill
  - crates/hk-core/src/manager.rs::toggle_mcp
  - crates/hk-core/src/deployer.rs::deploy_mcp_server
  - crates/hk-core/src/deployer.rs::restore_mcp_server
  - crates/hk-core/src/deployer.rs::set_kimi_mcp_enabled
known_gaps:
  - Kimi lifecycle hook writing is not part of v1.
---

# Manager 与 Deployer

## 职责

Manager 负责按 ExtensionKind 分派 enable/disable；Deployer 负责 Skills、MCP、Hooks 和 Plugins 的格式化写入、删除、恢复和路径处理。

## 开关语义

- Skill：在同一 scope 下把目录型 `SKILL.md`/`SKILL.md.disabled` 或 flat `.md`/`.md.disabled` 改名，并更新同名 DB 行。
- MCP：Kimi、Hermes、Kiro、OMP、DSH 等原生 toggle Agent 直接修改 Agent 配置；其他 Agent 删除配置前把经过脱敏的配置存进 DB，恢复时再写回。
- Kimi 原生 writer 只修改 `enabled`，保留 `cwd`、工具过滤、超时和 token 环境变量等未知字段；跨到其他 Agent 时，若存在 Kimi 专属字段则由 deployer 显式返回转换错误。
- Hook/Plugin：按 Adapter 的配置格式执行对应读写。
- CLI：只修改 CLI 自身状态，子扩展由前端独立控制。

## 安全不变量

- MCP `env`、`environment`、`headers`、`http_headers` 的值不能以明文进入 SQLite disabled snapshot。
- `PATH` 是运行变量，不应被当作 secret；需要 PATH 注入的 Agent 必须按 Adapter 声明处理。
- 目标 Agent 不支持远程 transport 时，部署必须硬失败，不能写入空 command 或不合法配置。
- 任何新的 native toggle 声明都必须有显式 dispatch 分支，不能落入默认分支。
- Kimi SSE 必须写 `transport: "sse"`；HTTP 使用 `url` 默认语义，不能套用 Claude 的 `type` 字段。
