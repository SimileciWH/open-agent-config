# AI Docs Coverage

## 当前基线

- 源码基线：`bc352a314ab14101bd518aae19de3350cbb98828`
- 源码与项目配置文件：347（不含 `ai-docs/` 和根目录 `AGENTS.md`）
- Rust 文件：90
- TypeScript/TSX 文件：162
- CI workflow：4
- 当前覆盖策略：全仓 L0/L1，Kimi 影响面的 L2-L4

## 模块覆盖

| 模块 | L0 | L1 | L2 | L3 | L4 | 当前状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `core.adapter` | yes | yes | yes | yes | yes | runtime-verified |
| `core.scanner` | yes | yes | yes | yes | yes | runtime-verified |
| `core.project-paths` | yes | yes | yes | yes | yes | runtime-verified |
| `core.manager-deployer` | yes | yes | yes | yes | yes | runtime-verified |
| `core.store-models` | yes | yes | yes | yes | yes | runtime-verified |
| `core.service-install` | yes | yes | yes | yes | yes | runtime-verified |
| `ui.extension-control` | yes | yes | yes | yes | yes | runtime-verified |
| `ui.frontend-shell` | yes | yes | yes | yes | yes | runtime-verified |
| `ui.agent-management` | yes | yes | yes | yes | yes | runtime-verified |
| `runtime.boundaries` | yes | yes | yes | yes | yes | runtime-verified |
| `runtime.app-update-channel` | yes | yes | yes | yes | yes | runtime-verified |
| `runtime.identity-migration` | yes | yes | yes | yes | yes | runtime-verified |
| `core.kits` | yes | yes | yes | yes | yes | runtime-verified |
| `core.marketplace` | yes | yes | yes | yes | yes | runtime-verified |

## 已分类但非首批 L2 深卡模块

以下模块已纳入 L1 边界，后续按功能变更补充 L2-L4：

- `core.auditor`：安全审计规则和权限推断。
- `core.config`：配置路径和应用级配置。
- `core.sanitize`：路径和输入清理。
- `core.skills-cli`：外部 skills CLI 集成。
- `ui.pages`：路由页面和页面级数据编排。
- `ui.shared`：共享 UI、错误边界和 Agent mascot。

本轮新增 Kimi 适配涉及 `core.adapter`、`core.scanner`、`core.manager-deployer`、`core.store-models`、`core.service-install`、`ui.extension-control` 和 `runtime.boundaries`，均已同步到 L2/L3/L4。

应用自身升级隔离涉及 `runtime.app-update-channel` 和 `runtime.boundaries`；默认关闭策略、Tauri 配置和 CI 门禁已同步到 L2-L4。

OAC 身份重构涉及所有运行时 crate、持久化路径、Kit、managed marker、前端存储、Marketplace 来源、视觉资产、Desktop bundle ID 和发布资产；新增的 `runtime.identity-migration`、`core.kits` 与 `core.marketplace` 已同步到 L2-L4。旧身份只作为迁移输入或上游隔离门禁保留。

本轮 UI 与项目路径改造涉及 `ui.frontend-shell`、`core.project-paths`、`core.scanner` 和 `runtime.boundaries`；快速偏好、Tauri 文件夹选择、递归 Git/worktree 发现及相关前端/Rust 回归测试已同步到 L2-L4。

本地开发编排涉及 `runtime.boundaries`：`npm run dev` 负责等待 Web API 后再启动 Vite，Tauri 使用 frontend-only 命令以避免重复后端；启动器、端口覆盖、退出清理和运行态 smoke 已同步到 L2-L4。

本轮 Settings 收口涉及 `ui.frontend-shell`、`ui.agent-management`、`core.project-paths`、`core.scanner` 和 `runtime.boundaries`：项目添加/管理进入 Scope 菜单，Agent 过滤/启停/配置位置进入 Agents，默认 Agent 路径改为只读 Adapter 真值，旧 Settings 路由仅保留兼容重定向。

项目目录选择补全涉及 `core.project-paths` 与 `runtime.boundaries`：Tauri dialog 与 Web 宿主选择器都保留粘贴路径并汇入同一递归发现流；macOS 已完成真实运行验收，Windows/Linux 分支纳入测试构建但仍需目标系统运行验收。

## 进入 runtime-verified 的条件

模块卡必须满足：

1. 稳定源码锚点存在。
2. 相关单元或集成测试通过。
3. 关键行为已经由 Golden QA 覆盖。
4. 当前验证命令和结果写入 `SYNC_LOG.md`。
