---
id: ui.extension-control
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - src/stores/extension-store.ts
  - src/stores/extension-helpers.ts
  - src/lib/invoke.ts
  - src/lib/transport.ts
  - src/lib/types.ts
  - src/lib/storage.ts
  - src/components/agents/__tests__/memory-grouping.test.ts
  - src/components/extensions/extension-table.tsx
  - src/components/shared/agent-card.tsx
  - src/components/extensions/extension-filters.tsx
  - src/components/onboarding/onboarding.tsx
  - src/components/shared/agent-mascot/agent-mascot.tsx
  - src/components/shared/agent-mascot/kimi-mascot.tsx
  - src/index.css
stable_anchors:
  - src/stores/extension-store.ts::toggle
  - src/stores/extension-helpers.ts::buildGroups
  - src/lib/invoke.ts::api
  - src/lib/transport.ts::transport
  - src/lib/types.ts::AGENT_ORDER
  - src/lib/agent-capabilities.ts::canInstallAtScope
  - src/lib/storage.ts::readMigratedStorage
known_gaps:
  - Kimi does not yet have a dedicated visual browser acceptance screenshot; the component is covered by the production TypeScript build.
---

# 前端 Extension 控制

## 职责

Extension Store 负责列表加载、分组、选择、全局 UI 状态和扩展开关。一个逻辑扩展可包含多个 Agent 实例，分组开关会向每个实例调用后端 toggle。

## 关键流程

```text
api.listExtensions
  → buildGroups
  → extension group UI
  → extensionStore.toggle(groupKey, enabled)
  → Promise.allSettled(api.toggleExtension(instance.id, enabled))
  → rescan/list refresh
```

## 关键事实

- `groupKey` 是逻辑扩展分组标识，不是单个 DB Extension ID。
- 当前 UI 已具备多 Agent 实例的批量开关能力，V1 不需要另建一套同步引擎。
- `transport.ts` 在 Tauri 使用 IPC，在浏览器使用 `POST /api/{command}`。
- `AGENT_ORDER` 必须与后端 `all_adapters()` 顺序保持一致。
  - `AgentCapabilities` 用于安装 scope 和远程 MCP transport gating。
- Kimi 已加入 `AGENT_ORDER`、显示名、onboarding 布局和独立的原创 mascot；后端能力矩阵会将其标记为支持 Skills/MCP、不支持 Hooks。
- Kimi 还拥有独立的 filter token 颜色，浅色/深色主题均在 `src/index.css` 注册，避免 Agent 过滤项回退到未定义的 Tailwind token。
- 前端 lint 规则也是交付门禁；测试中的非空断言、无效 suppression 和格式漂移不能留到人工验收阶段。

## 新增 Agent 必须检查

- 类型、显示名、排序、能力测试和所有需要的 mascot/i18n。
- 分组逻辑不会把 Kimi 实例与其他 Agent 错误合并或拆分。
- 批量 toggle 的 partial failure、错误提示和刷新逻辑有测试。
