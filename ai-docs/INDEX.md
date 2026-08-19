# AI Docs Index

## 快速路由

| 任务 | 首选文档 | 关键源码入口 |
| --- | --- | --- |
| 新增 Agent | `playbooks/add-agent.md` | `crates/hk-core/src/adapter/mod.rs::AgentAdapter` |
| 扫描 Skills/MCP | `modules/scanner.md` | `crates/hk-core/src/scanner.rs::scan_all` |
| 项目路径与 Git 仓库发现 | `modules/project-paths.md` | `crates/hk-core/src/scanner.rs::discover_git_repositories` |
| Skills 开关 | `playbooks/skills-toggle.md` | `crates/hk-core/src/manager.rs::toggle_skill` |
| MCP 开关 | `playbooks/mcp-toggle.md` | `crates/hk-core/src/manager.rs::toggle_mcp` |
| MCP 部署/恢复 | `modules/manager-deployer.md` | `crates/hk-core/src/deployer.rs::deploy_mcp_server` |
| UI 跨 Agent 分组控制 | `modules/frontend-extension-control.md` | `src/stores/extension-store.ts::toggle` |
| UI Shell、快速偏好与设置页 | `modules/frontend-shell.md` | `src/components/layout/app-shell.tsx::AppShell` |
| Web/Tauri/CLI 行为差异 | `modules/runtime-boundaries.md` | `crates/hk-web/src/router.rs::build_router` |
| 数据库和扫描同步 | `modules/store-models.md` | `crates/hk-core/src/store.rs::Store::sync_extensions` |
| 安装和能力门控 | `modules/service-install.md` | `crates/hk-core/src/service.rs::install_to_agent` |
| 应用自身升级/发布通道 | `modules/app-update-channel.md` | `src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime` |
| 最终验证 | `playbooks/verification.md` | `.github/workflows/pr-checks.yml` |

## 分层入口

### L0

- [`README.md`](README.md)：知识层合同、当前基线和状态定义。
- [`MAP.json`](MAP.json)：机器可读仓库地图、模块依赖和支持矩阵。
- [`COVERAGE.md`](COVERAGE.md)：扫描范围、模块覆盖和验证状态。

### L1

- [`ROADMAP.md`](ROADMAP.md)：`AI-DOCS-READY` 门禁和阶段路线。
- [`WORKFLOW.md`](WORKFLOW.md)：代码与 L0-L4 同步流程。
- [`MAP.json`](MAP.json)：Workspace、运行时和主数据流。

### L2

- [`modules/adapter.md`](modules/adapter.md)
- [`modules/scanner.md`](modules/scanner.md)
- [`modules/project-paths.md`](modules/project-paths.md)
- [`modules/manager-deployer.md`](modules/manager-deployer.md)
- [`modules/store-models.md`](modules/store-models.md)
- [`modules/service-install.md`](modules/service-install.md)
- [`modules/frontend-extension-control.md`](modules/frontend-extension-control.md)
- [`modules/frontend-shell.md`](modules/frontend-shell.md)
- [`modules/runtime-boundaries.md`](modules/runtime-boundaries.md)
- [`modules/app-update-channel.md`](modules/app-update-channel.md)

### L3

- [`playbooks/add-agent.md`](playbooks/add-agent.md)
- [`playbooks/skills-toggle.md`](playbooks/skills-toggle.md)
- [`playbooks/mcp-toggle.md`](playbooks/mcp-toggle.md)
- [`playbooks/cross-agent-sync.md`](playbooks/cross-agent-sync.md)
- [`playbooks/verification.md`](playbooks/verification.md)
- [`playbooks/project-paths.md`](playbooks/project-paths.md)
- [`playbooks/app-update-channel.md`](playbooks/app-update-channel.md)

### L4

- [`qa/golden.yaml`](qa/golden.yaml)：可重复的源码导航和行为问题集。
- [`qa/golden-results.md`](qa/golden-results.md)：当前基线的逐题验证结果。
- [`SYNC_LOG.md`](SYNC_LOG.md)：源码、文档和验证记录。

## Kimi Code 任务读取顺序

```text
README.md
→ MAP.json
→ modules/adapter.md
→ modules/scanner.md
→ modules/manager-deployer.md
→ modules/store-models.md
→ modules/service-install.md
→ modules/frontend-extension-control.md
→ playbooks/add-agent.md
→ playbooks/mcp-toggle.md
→ qa/golden.yaml
```
