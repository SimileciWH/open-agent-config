---
id: core.adapter
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/adapter/mod.rs
  - crates/oac-core/src/adapter/*.rs
stable_anchors:
  - crates/oac-core/src/adapter/mod.rs::AgentAdapter
  - crates/oac-core/src/adapter/mod.rs::AgentCapabilities::from_adapter
  - crates/oac-core/src/adapter/mod.rs::all_adapters
  - crates/oac-core/src/adapter/kimi.rs::KimiAdapter
known_gaps:
  - Kimi lifecycle hooks in config.toml are intentionally not managed in v1.
---

# Adapter 与能力模型

## 职责

`AgentAdapter` 是每个代码 Agent 的配置差异适配层，声明发现路径、配置格式、Skills/MCP/Hook/Plugin 能力和 scope 行为。`all_adapters()` 是后端的统一注册表，并要求与前端 `AGENT_ORDER` 保持顺序一致。

## 关键事实

- MCP 格式由 `McpFormat` 声明，远程 MCP 形态由 `RemoteMcpSchema` 声明；Kimi 使用 `mcpServers` + `url`/ `transport: sse`。
- `AgentCapabilities::from_adapter` 从 Adapter 声明推导前端安装门控，避免前后端各自维护矩阵。
- 原生 MCP enable/disable 由 `supports_native_mcp_toggle()` 声明；声明为 true 后必须在 `manager::toggle_mcp` 中有对应 writer 分支。
- Adapter 的 `read_mcp_servers()` 是 scanner 的读取入口，部署器根据 Adapter 的格式执行写入。
- Kimi 的 `KIMI_CODE_HOME` 默认为 `~/.kimi-code`；Skills 还读取共享的 `~/.agents/skills`，项目级读取 `.kimi-code/skills` 和 `.agents/skills`。
- Kimi 的 `enabled` 状态进入 `McpServerEntry.enabled`；`cwd`、工具过滤、超时和 token 环境变量等专属字段由 `McpServerEntry::extra` 进入中间模型。部署回 Kimi 时保留，部署到其他 Agent 时显式拒绝不可逆转换。

## 新增 Agent 必须检查

1. 新增 `crates/oac-core/src/adapter/<agent>.rs`。
2. 在 `adapter/mod.rs` 声明模块并加入 `all_adapters()`。
3. 明确 Skills、MCP、Hook、Plugin、Project 和 CLI 能力。
4. 明确远程 MCP transport、unknown fields 和 secret 处理。
5. 更新前端显示名、`AGENT_ORDER`、能力测试和 mascot（如果需要）。
6. 更新对应 L2/L3/L4 文档。

## 当前风险

MCP 配置格式不是统一 JSON。新增 Agent 不能复用相似 Agent 的 writer，必须验证目标 Agent 的真实 schema，并保证开关前后未知字段和敏感字段的处理符合该 Agent 语义。
