# AI Docs Roadmap

## 目标

在 Kimi Code 接入前，完成仓库边界、核心 Agent 管理链路和验证合同的可追溯建库，并通过 `AI-DOCS-READY` 门禁。

## 阶段

### Phase 0A：全仓盘点

- [x] 获取当前源码基线和 Git 提交。
- [x] 统计受版本控制文件、Rust crate、前端模块、CI workflow 和测试入口。
- [x] 建立 Workspace、运行时入口和主数据流地图。
- [x] 对 Auditor、Kits、Marketplace、Config、Sanitize 等非 Kimi 主路径完成 L1 分类。

### Phase 0B：关键路径 L2

- [x] Adapter 与能力模型。
- [x] Scanner 与 Skills/MCP 发现。
- [x] Manager/Deployer 与开关写入。
- [x] Store/Models 与 scope、禁用快照、重扫同步。
- [x] Service/Install 与能力门控。
- [x] 前端 Extension Store、分组和 transport。
- [x] CLI/Web/Tauri/CI 边界。

### Phase 0C：L3/L4 验收

- [x] 新增 Agent 剧本。
- [x] Skills 开关剧本。
- [x] MCP 开关剧本。
- [x] 跨 Agent 同步边界剧本。
- [x] 测试、构建和发布验证剧本。
- [x] Golden QA 问题集。
- [x] 安装依赖并执行文档锚点检查。
- [x] 执行前端测试、构建和 lint。
- [x] 执行 Rust workspace 测试。
- [x] 解决验证失败并标记 `AI-DOCS-READY`。

### Phase 1：Kimi Code 接入

Phase 0C 已闭环；只有后续 Kimi 变更对应的 L0-L4 卡片同步完成后，才能结束 Phase 1。

- [x] Kimi adapter 与注册。
- [x] Kimi Skills 路径和 scope。
- [x] Kimi MCP 配置读取、原生 enable/disable 和高级字段保留。
- [x] 前端显示名、顺序、能力门控和 mascot。
- [x] 跨 Agent 同步的可转换字段、警告和不支持边界。
- [x] 同步更新受影响 L0-L4 卡片。
- [x] 执行全套测试和人工验收准备（自动化验证已完成；仍需用户进行桌面界面人工验收）。

## AI-DOCS-READY 门禁

```text
全仓 L0/L1 事实存在且有锚点
AND 关键路径 L2 卡片可定位到源码符号
AND Kimi 影响面的 L3 剧本可执行
AND L4 Golden QA 全部能给出源码证据
AND docs anchor check 通过
AND npm test/build/lint 通过
AND cargo test --workspace 通过
```

Kimi 第一版业务代码已完成；若全套验证失败，必须回到对应 L2/L3 卡片修复并重新验证，不能直接交付。

当前结果：`AI-DOCS-READY=PASS`；Kimi 第一版自动化验证已通过，剩余工作是用户对实际本机配置、界面交互和跨 Agent 写入结果进行人工验收。

### Phase 2：Fork 发布隔离

- [x] 默认关闭 Web/Tauri 应用自身升级。
- [x] 移除上游 updater endpoint、公钥、artifact 和 capability。
- [x] 添加 Release Channel 策略与 PR/tag workflow 门禁。
- [ ] 建立 fork 自己的 Release、Tauri 签名密钥和跨平台 canary。
- [ ] 完成上述前置条件后，按 `playbooks/app-update-channel.md` 启用升级通道。

### Phase 3：界面收口与上下文配置

- [x] 删除独立 Settings 导航和页面，保留旧路由兼容重定向。
- [x] 将 Add/Manage Project 合并到 Topbar Scope 菜单，并统一为扫描后确认。
- [x] 将 All/Detected 纯过滤、单 Agent 启停和配置位置合并到 Agents 页面。
- [x] 默认 Agent 目录改为 Adapter 真值只读展示，不再把未接入扫描的 legacy custom path 标成生效覆盖。
- [x] 增加前端定向测试、L2 Agent 管理卡、L3 Playbook 和 L4 Golden QA。
