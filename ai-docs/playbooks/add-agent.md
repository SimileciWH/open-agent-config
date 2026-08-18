# L3：新增 Agent Playbook

## 前置条件

- 先通过 `AI-DOCS-READY`。
- 阅读 `modules/adapter.md`、`scanner.md`、`manager-deployer.md`、`service-install.md`、`frontend-extension-control.md` 和 `runtime-boundaries.md`。
- 为新 Agent 建立或更新对应 L2 卡片。

## 实施顺序

1. 记录官方配置路径、scope、Skills 发现规则、MCP schema、Hook/Plugin 能力和原生启用机制。
2. 新建 `crates/hk-core/src/adapter/<agent>.rs`，实现 `AgentAdapter`。
3. 在 `adapter/mod.rs` 注册模块和 `all_adapters()`。
4. 若支持 native MCP toggle，在 `manager::toggle_mcp` 增加显式 writer 分支，并增加 round-trip 测试。
5. 检查 `deployer.rs` 的格式、transport、未知字段和 secret 处理。
6. 检查 `service.rs` 的 global/project install 解析和 capability gating。
7. 更新前端 `AGENT_ORDER`、显示名、能力测试、i18n 和 mascot（若需要）。
8. 更新 Web/Tauri 入口测试或契约（只有核心语义变化时才增加运行时层代码）。
9. 同步更新所有受影响 L0-L4 卡片、`MAP.json`、`COVERAGE.md` 和 `SYNC_LOG.md`。

## 验收

- Adapter registry、frontend order、capability matrix 一致。
- scanner 能发现 global/project Skills 和 MCP。
- enable/disable 可 round-trip，重扫后状态一致。
- secret 不进入 DB 明文 snapshot。
- 若目标 Agent 有专属 MCP 字段，将其纳入中间模型或在跨 Agent 转换时显式拒绝，禁止静默丢弃。
- 前端分组 toggle 对多个 Agent 实例生效并正确报告 partial failure。
- 所有相关测试、构建和 lint 通过。
