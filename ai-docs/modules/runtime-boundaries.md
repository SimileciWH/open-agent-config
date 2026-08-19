---
id: runtime.boundaries
level: L2
status: runtime-verified
verified_commit: bc352a314ab14101bd518aae19de3350cbb98828
last_verified: 2026-08-19
source_paths:
  - crates/oac-cli/src/main.rs
  - crates/oac-web/src/lib.rs
  - crates/oac-web/src/router.rs
  - crates/oac-web/src/handlers/extensions.rs
  - crates/oac-web/src/handlers/projects.rs
  - crates/oac-desktop/src/main.rs
  - crates/oac-desktop/src/commands/extensions.rs
  - crates/oac-desktop/src/commands/projects.rs
  - crates/oac-core/src/scanner.rs
  - crates/oac-desktop/tauri.conf.json
  - crates/oac-desktop/capabilities/default.json
  - crates/oac-core/src/app_paths.rs
  - src/config/release-channel.json
  - src/lib/app-update-policy.ts
  - vitest.config.ts
  - src/test-storage-setup.ts
  - scripts/check-release-channel.mjs
  - scripts/check-oac-identity.mjs
  - scripts/check-ai-docs.mjs
  - scripts/dev.mjs
  - vite.config.ts
  - package.json
  - package-lock.json
  - .github/workflows/pr-checks.yml
  - .github/workflows/release.yml
stable_anchors:
  - crates/oac-cli/src/main.rs::main
  - crates/oac-web/src/lib.rs::serve
  - crates/oac-web/src/router.rs::build_router
  - crates/oac-web/src/handlers/extensions.rs::toggle_extension
  - crates/oac-web/src/handlers/projects.rs::discover_projects
  - crates/oac-web/src/handlers/projects.rs::select_project_directory
  - crates/oac-web/src/handlers/projects.rs::select_project_directory_native
  - crates/oac-desktop/src/main.rs::main
  - crates/oac-desktop/src/main.rs::app_update_enabled
  - crates/oac-desktop/src/commands/extensions.rs::toggle_extension
  - crates/oac-desktop/src/commands/projects.rs::discover_projects
  - crates/oac-core/src/scanner.rs::discover_projects
  - src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime
  - scripts/check-release-channel.mjs::validateReleaseChannel
  - scripts/check-oac-identity.mjs::validateIdentity
  - scripts/check-ai-docs.mjs::repositoryFiles
  - scripts/dev.mjs::startDevelopmentEnvironment
  - vite.config.ts::readPort
known_gaps:
  - Local macOS runtime is available for static inspection, but desktop runtime acceptance remains a later manual step.
  - One-command Web startup and cleanup are runtime-verified on macOS only; Windows and Linux paths remain implementation-reviewed but not runtime-verified.
  - The local Web host folder picker is runtime-verified on macOS; Windows and Linux implementations are test-compiled on macOS but still need native target runtime acceptance.
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

## 本地源码开发

- `npm run dev` 调用 `scripts/dev.mjs::startDevelopmentEnvironment`，在 `127.0.0.1:7070` 启动 `oac-cli serve --no-token`，确认 `/api/server_info` 可用后再启动 Vite `1420`。
- 若默认端口已有无鉴权 OAC Web API，启动器复用该服务；若端口被其他进程或鉴权服务占用，则明确失败而不是静默连接错误目标。
- `OAC_BACKEND_PORT` 与 `OAC_FRONTEND_PORT` 可覆盖默认端口，Vite proxy 与启动器必须读取同一组值。
- `Ctrl+C` 或任一受管子进程异常退出时，启动器会关闭本轮创建的其余进程；复用的外部后端不属于其生命周期。
- Tauri `beforeDevCommand` 固定调用 `npm run dev:frontend`。桌面模式使用 IPC，不应额外占用 `7070` 或启动 Web backend。
- 一键 Web 开发使用 `--no-token`，只允许绑定 loopback 并用于可信单用户开发机；生产或共享主机继续使用 `oac serve` 的默认 token。

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
- Web 与 Tauri 的项目路径添加共享 `oac-core::scanner::discover_projects`；它识别 Git/worktree 与 Agent marker，同时限制递归深度并跳过隐藏目录、依赖目录和符号链接目录。
- Tauri 目录选择由 dialog plugin 在客户端完成；local Web 的浏览器不能返回绝对路径，因此 `/api/select_project_directory` 在 blocking pool 调用宿主选择器：macOS Finder、Windows `FolderBrowserDialog`、Linux Zenity/Yad/KDialog。远程、headless 或无选择器环境必须保留粘贴路径回退。
- 生产依赖不得包含未引用的浏览器自动化工具；lockfile 更新后必须通过冷 `npm ci`、全套前端验证和 `npm audit`。
- `check-ai-docs` 的 inventory 只统计当前实际存在的 tracked/untracked 文件，必须排除工作树中已删除但尚未提交的索引条目，确保变更提交前后计数一致。
