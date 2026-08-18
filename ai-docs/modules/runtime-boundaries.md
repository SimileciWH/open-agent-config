---
id: runtime.boundaries
level: L2
status: runtime-verified
verified_commit: 4321a802c021736592ba408b5ff913cff3919053
last_verified: 2026-08-18
source_paths:
  - crates/hk-cli/src/main.rs
  - crates/hk-web/src/lib.rs
  - crates/hk-web/src/router.rs
  - crates/hk-web/src/handlers/extensions.rs
  - crates/hk-desktop/src/main.rs
  - crates/hk-desktop/src/commands/extensions.rs
  - crates/hk-desktop/tauri.conf.json
  - crates/hk-desktop/capabilities/default.json
  - src/config/release-channel.json
  - src/lib/app-update-policy.ts
  - vitest.config.ts
  - src/test-storage-setup.ts
  - scripts/check-release-channel.mjs
  - .github/workflows/pr-checks.yml
  - .github/workflows/release.yml
stable_anchors:
  - crates/hk-cli/src/main.rs::main
  - crates/hk-web/src/lib.rs::serve
  - crates/hk-web/src/router.rs::build_router
  - crates/hk-web/src/handlers/extensions.rs::toggle_extension
  - crates/hk-desktop/src/main.rs::main
  - crates/hk-desktop/src/main.rs::app_update_enabled
  - crates/hk-desktop/src/commands/extensions.rs::toggle_extension
  - src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime
  - scripts/check-release-channel.mjs::validateReleaseChannel
known_gaps:
  - Local macOS runtime is available for static inspection, but desktop runtime acceptance remains a later manual step.
  - Release metadata still contains upstream HarnessKit identity and must be handled before publishing the fork.
  - Application self-update remains intentionally disabled until the fork owns its release feed and signing key.
---

# CLI、Web、Tauri 与 CI 边界

## 运行模式

- CLI 非 `serve` 命令：打开 `~/.harnesskit/metadata.db`，创建 adapters，扫描并同步，然后执行命令。
- CLI `serve`：启动 `hk-web`，Web server 打开 Store 并构造 WebState。
- Web：Axum 路由把 `/api/toggle_extension` 等请求放到 blocking pool，再调用核心 manager。
- Tauri：桌面入口构造 AppState，IPC command 调用相同核心 manager/service。
- Frontend：同一套 React 页面通过 transport 在 IPC 和 HTTP 两条通道运行。

## 关键不变量

- Web handler 和 Tauri command 必须调用相同的核心语义，不能各自实现 Agent 特殊逻辑。
- 阻塞的文件系统、SQLite 和 shell 操作要在 blocking pool 中执行。
- CI 至少覆盖 frontend test/build 和 Rust workspace test；发布工作流还覆盖 macOS、Linux 和 Windows CLI/desktop 目标。
- 应用自身升级与扩展更新是两个独立边界；关闭 Release Channel 不得关闭 Skills/MCP 的更新功能。
- fork 未拥有 Release feed 和签名密钥时，Web/Tauri 都不得查询或安装上游应用版本。
- `check-release-channel.mjs` 必须同时约束策略、Tauri endpoint/公钥、artifact、capability 和上游 URL。
- Vitest 的 jsdom 环境必须配置非 opaque URL，否则 Node 26 下 `localStorage` 不可用，所有依赖浏览器存储的测试都会在 setup 前失败。
- 新 Agent 业务代码通常应集中在 `hk-core`，运行时层只做注册和通道接线。
