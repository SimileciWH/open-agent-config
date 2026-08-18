---
id: runtime.boundaries
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-cli/src/main.rs
  - crates/oac-web/src/lib.rs
  - crates/oac-web/src/router.rs
  - crates/oac-web/src/handlers/extensions.rs
  - crates/oac-desktop/src/main.rs
  - crates/oac-desktop/src/commands/extensions.rs
  - crates/oac-desktop/tauri.conf.json
  - crates/oac-desktop/capabilities/default.json
  - crates/oac-core/src/app_paths.rs
  - src/config/release-channel.json
  - src/lib/app-update-policy.ts
  - vitest.config.ts
  - src/test-storage-setup.ts
  - scripts/check-release-channel.mjs
  - scripts/check-oac-identity.mjs
  - package.json
  - package-lock.json
  - .github/workflows/pr-checks.yml
  - .github/workflows/release.yml
stable_anchors:
  - crates/oac-cli/src/main.rs::main
  - crates/oac-web/src/lib.rs::serve
  - crates/oac-web/src/router.rs::build_router
  - crates/oac-web/src/handlers/extensions.rs::toggle_extension
  - crates/oac-desktop/src/main.rs::main
  - crates/oac-desktop/src/main.rs::app_update_enabled
  - crates/oac-desktop/src/commands/extensions.rs::toggle_extension
  - src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime
  - scripts/check-release-channel.mjs::validateReleaseChannel
  - scripts/check-oac-identity.mjs::validateIdentity
known_gaps:
  - Local macOS runtime is available for static inspection, but desktop runtime acceptance remains a later manual step.
  - Application self-update remains intentionally disabled until the fork owns its release feed and signing key.
  - The OAC Tauri identifier is a new application identity; coexistence and legacy desktop cleanup require manual acceptance on each platform.
---

# CLI、Web、Tauri 与 CI 边界

## 运行模式

- CLI 非 `serve` 命令：经 `app_paths::open_store()` 打开 `~/.open-agent-config/metadata.db`，创建 adapters，扫描并同步，然后执行命令。
- CLI `serve`：启动 `oac-web`，Web server 打开 Store 并构造 WebState。
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
- Desktop bundle identifier 必须固定为 `com.openagentconfig.app`，不能退回旧产品身份。
- `check-oac-identity.mjs` 必须拒绝未登记的旧产品名、CLI 和资产标识，只允许精确列出的迁移输入及上游隔离签名。
- Vitest 的 jsdom 环境必须配置非 opaque URL，否则 Node 26 下 `localStorage` 不可用，所有依赖浏览器存储的测试都会在 setup 前失败。
- 新 Agent 业务代码通常应集中在 `oac-core`，运行时层只做注册和通道接线。
- CLI、Web、Tauri 必须共享 `app_paths::open_store()`；绕过它会跳过旧数据迁移并产生分裂状态。
- 生产依赖不得包含未引用的浏览器自动化工具；lockfile 更新后必须通过冷 `npm ci`、全套前端验证和 `npm audit`。
