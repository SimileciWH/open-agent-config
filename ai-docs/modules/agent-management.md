---
id: ui.agent-management
level: L2
status: runtime-verified
verified_commit: bc352a314ab14101bd518aae19de3350cbb98828
last_verified: 2026-08-19
source_paths:
  - src/pages/agents.tsx
  - src/components/agents/agent-list.tsx
  - src/components/agents/agent-detail.tsx
  - src/components/agents/__tests__/agent-list-controls.test.tsx
  - src/stores/agent-store.ts
  - src/stores/agent-config-store.ts
  - src/stores/ui-store.ts
  - crates/oac-web/src/handlers/agents.rs
  - crates/oac-desktop/src/commands/agents.rs
  - crates/oac-core/src/store.rs
stable_anchors:
  - src/components/agents/agent-list.tsx::AgentList
  - src/components/agents/agent-detail.tsx::AgentDetail
  - src/stores/agent-config-store.ts::addCustomPath
  - src/stores/ui-store.ts::useUIStore
  - crates/oac-web/src/handlers/agents.rs::list_agents
  - crates/oac-desktop/src/commands/agents.rs::list_agents
  - crates/oac-core/src/store.rs::set_agent_enabled
known_gaps:
  - A full Agent-home override is not supported because Adapter detection and scan paths are still declared by each concrete Adapter.
  - Legacy agent_settings.custom_path values remain in SQLite for compatibility but are not presented as active scan overrides.
  - Native Tauri file and directory picking for additional config locations still needs a desktop acceptance pass.
---

# Agent 显示、启停与配置位置

## 职责

Agents 页面集中管理 Agent 列表过滤、单 Agent 启停、Adapter 默认目录和附加配置位置。独立 Settings 页面不再承载 Agent 配置。

## 关键事实

- `All / Detected` 只是列表显示过滤器，写入 `ui-store.agentVisibility`；它不会再调用 `set_agent_enabled`，也不会暗中改变未安装 Agent 的状态。
- 每行 Agent 的 switch 才是启停入口。该状态写入 `agent_settings.enabled`，并影响 Overview、扩展筛选和安装目标。
- 未检测到的 Agent 在 `All` 模式下仍可选择；详情页会明确显示 `Not detected`、默认 Adapter 目录及空状态。
- `list_agents` 始终返回 `AgentAdapter::base_dir()` 作为真实检测/扫描目录。旧 `custom_path` 记录不再覆盖显示，避免把未接入 Adapter 的值误报为生效配置。
- “添加配置位置”走 `custom_config_paths`，支持文件或文件夹并实际进入 `list_agent_configs`；它不是 Agent 根目录覆盖。
- Agent 的默认目录只读。若未来支持根目录覆盖，必须先为每个 Adapter 建立统一 override 契约，使 detection、Skills、MCP、Hooks、Plugins 和 config-file 扫描全部使用同一来源。

## 数据流

```text
All / Detected
  → ui-store.agentVisibility
  → AgentList frontend filter only

row switch
  → agentStore.setEnabled
  → Web/Tauri set_agent_enabled
  → Store::set_agent_enabled

add config location
  → agentConfigStore.addCustomPath
  → custom_config_paths
  → list_agent_configs merge
```
