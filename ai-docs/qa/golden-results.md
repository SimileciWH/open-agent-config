# L4 Golden QA Results

## Verification context

- Source commit: `bc352a314ab14101bd518aae19de3350cbb98828` plus the current development-orchestration working tree.
- Node: `v26.3.0`
- npm: `11.16.0`
- Rust: `rustc/cargo 1.97.1` from Homebrew
- Result: all seventeen Golden QA cases answered with source anchors.

## Results

### Q-001 — Agent registry and frontend order

The backend registry is `adapter::all_adapters`; the frontend display order is `AGENT_ORDER`. Their order is an explicit cross-layer invariant.

Anchors: `crates/oac-core/src/adapter/mod.rs::all_adapters`, `src/lib/types.ts::AGENT_ORDER`.

### Q-002 — Scan to Store path

`scanner::scan_all` scans each registered Adapter, global extensions, project extensions and CLI children, then `Store::sync_extensions` reconciles the result. Project scope is resolved through `scan_project_extensions` and remains distinct from global scope. Kimi contributes both its KIMI_CODE_HOME-backed paths and the shared `.agents/skills` path.

Anchors: `crates/oac-core/src/scanner.rs::scan_all`, `crates/oac-core/src/scanner.rs::scan_project_extensions`, `crates/oac-core/src/store.rs::sync_extensions`.

### Q-003 — Skill Enable/Disable

The frontend toggles every instance in a logical group. Core Manager resolves locations with `skill_locations`, then renames directory-form `SKILL.md` to `SKILL.md.disabled` or flat `.md` to `.md.disabled`, and restores the original filename within the target scope.

Anchors: `src/stores/extension-store.ts::toggle`, `crates/oac-core/src/manager.rs::toggle_skill`, `crates/oac-core/src/scanner.rs::skill_locations`.

### Q-004 — MCP secret protection and restore

`manager::toggle_mcp` dispatches native per-Agent writers when supported. Kimi's writer changes only `enabled`, preserving advanced fields in place. Otherwise the manager reads the entry, redacts secret-bearing blocks before writing a DB snapshot, removes the entry, and uses the Deployer restore path on enable.

Anchors: `crates/oac-core/src/manager.rs::toggle_mcp`, `crates/oac-core/src/manager.rs::redact_mcp_env`, `crates/oac-core/src/deployer.rs::restore_mcp_server`.

### Q-005 — Frontend group toggle

`buildGroups` creates logical groups. `extensionStore::toggle` collects all instances in the selected group and calls `api.toggleExtension` for each instance with `Promise.allSettled`, so partial failures can be surfaced without losing successful results.

Anchors: `src/stores/extension-store.ts::toggle`, `src/stores/extension-helpers.ts::buildGroups`, `src/lib/invoke.ts::api`.

### Q-006 — Web and Tauri semantics

The Web handler and Tauri command are separate transport wrappers, but both delegate to the shared core manager semantics. Browser mode uses HTTP; desktop mode uses Tauri IPC.

Anchors: `crates/oac-web/src/handlers/extensions.rs::toggle_extension`, `crates/oac-desktop/src/commands/extensions.rs::toggle_extension`, `crates/oac-core/src/manager.rs::toggle_extension_with_adapters`.

### Q-007 — Kimi change surface

Kimi now has an Adapter and registration, aligned frontend order/capabilities and mascot, scanner/install paths, native MCP handling, explicit advanced-field conversion policy, round-trip tests, and synchronized affected L0-L4 cards.

Anchors: `crates/oac-core/src/adapter/mod.rs::AgentAdapter`, `crates/oac-core/src/adapter/mod.rs::all_adapters`, `src/lib/types.ts::AGENT_ORDER`, `crates/oac-core/src/manager.rs::toggle_mcp`, `AGENTS.md`.

### Q-008 — Completion evidence

Completion requires source anchors, synchronized AI Docs, `npm run check:ai-docs`, relevant frontend and Rust tests, build/lint results, and explicit reporting of any unverified item.

Anchors: `AGENTS.md`, `ai-docs/WORKFLOW.md`, `ai-docs/SYNC_LOG.md`.

### Q-009 — Kimi MCP paths and schema

Kimi resolves its user data directory from `KIMI_CODE_HOME` or `~/.kimi-code`, reads user MCP from `mcp.json`, and reads project MCP from `.kimi-code/mcp.json`. HTTP entries use `url`; SSE entries use `transport: "sse"` plus `url`; native enablement is the per-entry `enabled` field. Kimi-specific fields are retained when deploying to Kimi and rejected with an explicit validation error for incompatible targets.

Anchors: `crates/oac-core/src/adapter/kimi.rs::KimiAdapter`, `crates/oac-core/src/deployer.rs::set_kimi_mcp_enabled`, `crates/oac-core/src/adapter/mod.rs::RemoteMcpSchema`.

### Q-010 — Fork application update isolation

Application self-update is independent from Skills/MCP extension updates. `release-channel.json` is disabled, so the frontend policy blocks startup checks and update UI in both Web and desktop modes. Tauri also has no updater endpoint/public key, no updater artifacts, no updater/restart capabilities, and conditionally skips plugin registration. Re-enabling requires the fork's own HTTPS feed and instructions, a repository public key plus CI-held private key, restored capabilities/artifacts, the release-channel check, and signed cross-platform canary evidence.

Anchors: `src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime`, `crates/oac-desktop/src/main.rs::app_update_enabled`, `scripts/check-release-channel.mjs::validateReleaseChannel`.

### Q-011 — OAC identity migration

`prepare_data_dir` serializes migration with a per-home lock, rejects symlinks and ambiguous dual directories, and atomically moves the old directory to `~/.open-agent-config`. `open_store` then repairs Kit filenames/database paths and Kiro managed filenames. CLI, Web and Tauri all use that entrypoint. Frontend reads old localStorage keys once, writes the OAC key, and removes the old key; all new operations write OAC identity only.

Anchors: `crates/oac-core/src/app_paths.rs::prepare_data_dir`, `crates/oac-core/src/app_paths.rs::open_store`, `src/lib/storage.ts::readMigratedStorage`.

### Q-012 — Kit path containment

ZIP entry paths reject absolute, parent, Windows-prefixed and NUL-bearing paths. `validate_manifest_paths` also constrains manifest-controlled Skill/CLI names and config filenames to one safe component. Install planning, import, sync and unsync repeat validation near I/O, and final targets must pass project-root containment. Regression tests cover traversal, absolute paths, symlink targets, malicious import, out-of-root unsync, and an existing external record when the project root is missing. Entry-count, expanded-size and compression-ratio limits remain open.

Anchors: `crates/oac-core/src/kits/manifest.rs::validate_manifest_paths`, `crates/oac-core/src/kits/install_plan.rs::compute_kit_install_plan`, `crates/oac-core/src/kits/service.rs::sync_kit_to_project`.

### Q-013 — Marketplace source ownership

CLI listing and executable lookup both resolve from the embedded OAC registry, so discovery cannot advertise an entry the executor does not allow. Overview tips are loaded from same-origin `/tips.json`. Skills and MCP search retain their documented third-party sources; a future remote CLI registry requires OAC ownership, integrity verification, cache policy and an execution-consistency design.

Anchors: `crates/oac-core/src/marketplace.rs::list_cli_registry`, `crates/oac-core/src/marketplace.rs::get_embedded_cli_entry`, `src/pages/overview.tsx::fetchTips`.

### Q-014 — Project discovery and confirmation

Add Project 位于 Topbar Scope 菜单，“选择工作区文件夹”和粘贴路径始终同时显示。Tauri 使用跨平台 dialog plugin；local Web 通过后端在 macOS 调 Finder、Windows 调 PowerShell `FolderBrowserDialog`、Linux 依次尝试 Zenity/Yad/KDialog，无图形或选择器不可用时显示错误并保留粘贴回退。所有入口都先调用核心 `discover_projects`，递归识别 Git 目录、worktree `.git` 文件和 Adapter project markers，跳过隐藏/依赖/构建目录与符号链接并稳定排序。弹窗默认选择新增项、禁用已登记项，`addProjects` 批量写入后只重扫一次；单个成功项目切到该 project，多个成功项目切到 All scopes。

Anchors: `crates/oac-core/src/scanner.rs::discover_projects`, `crates/oac-core/src/scanner.rs::discover_git_repositories`, `crates/oac-core/src/scanner.rs::is_git_repository`, `crates/oac-web/src/handlers/projects.rs::discover_projects`, `crates/oac-web/src/handlers/projects.rs::select_project_directory`, `crates/oac-desktop/src/commands/projects.rs::discover_projects`, `src/components/projects/project-dialogs.tsx::AddProjectDialog`, `src/stores/project-store.ts::addProjects`.

### Q-015 — Blue-white shell and compact preferences

`AppShell`、Sidebar、Topbar 和 `QuickPreferences` 组成蓝白工作区；右上角常驻显示 `EN`、`简中`、`繁中`、太阳、月亮和 `auto`，其中 `auto` 同时恢复语言和外观的系统状态。独立 Settings 导航和页面已删除，主题只保留蓝白基础主题。

Anchors: `src/components/layout/app-shell.tsx::AppShell`, `src/components/layout/topbar.tsx::Topbar`, `src/components/layout/quick-preferences.tsx::QuickPreferences`, `src/stores/ui-store.ts::useUIStore`, `src/components/layout/__tests__/quick-preferences.test.tsx::auto restores both language and appearance system`.

### Q-016 — One-command Web development

`npm run dev` calls `startDevelopmentEnvironment`, which starts the loopback `oac-cli serve --no-token` backend, waits for `/api/server_info`, and only then starts Vite. The launcher and Vite share `OAC_BACKEND_PORT`/`OAC_FRONTEND_PORT`, and one shutdown path owns both child processes. Tauri calls `npm run dev:frontend` instead because desktop requests use IPC and do not need the Web API process.

Anchors: `scripts/dev.mjs::startDevelopmentEnvironment`, `package.json::node scripts/dev.mjs`, `vite.config.ts::OAC_BACKEND_PORT`, `crates/oac-desktop/tauri.conf.json::npm run dev:frontend`.

### Q-017 — Agent management after Settings removal

Agent 的 `All / Detected` 过滤、行内启停和位置说明都在 Agents 页面。过滤器只改前端可见列表，不再暗中调用 enable/disable；未检测 Agent 在 All 下仍可选择。行内 switch 才写入 `agent_settings.enabled`。Web/Tauri `list_agents` 显示 `AgentAdapter::base_dir()` 这一真实检测/扫描来源；旧 `agent_settings.custom_path` 不再伪装成生效的根目录覆盖。真正会进入 Agent 配置列表的非默认文件或目录通过 `agentConfigStore.addCustomPath` 写入 `custom_config_paths`。旧 `#/settings` 只重定向到 Agents。

Anchors: `src/App.tsx::Navigate to="/agents"`, `src/components/agents/agent-list.tsx::AgentList`, `src/components/agents/agent-detail.tsx::AgentDetail`, `src/stores/agent-config-store.ts::addCustomPath`, `crates/oac-web/src/handlers/agents.rs::list_agents`, `crates/oac-desktop/src/commands/agents.rs::list_agents`.

## Automated verification

- `npm run check:release-channel` passed with the application update channel disabled and no upstream release source configured.
- `npm run check:oac-identity` passed with 66 legacy migration or upstream-guard lines allowlisted; the gate now ignores tracked files deleted in the current working tree. `npm run check:ai-docs` passed with 14 module cards and 382 indexed source/docs files.
- `npm test` passed with 38 files and 299 tests; `npx tsc --noEmit` and `npm run lint` passed, with lint covering 193 files. The project dialog suite covers local Web host selection, Tauri dialog routing, pasted-path scanning and removal confirmation.
- `npm run build` passed with 2106 modules transformed. The existing 819.71 kB main-chunk warning and Node `module.register()` deprecation warning remain.
- `cargo test --workspace` passed with 667 tests across CLI, core, toggle integration, desktop and Web/API suites; `cargo clippy --workspace --all-targets -- -D warnings` passed. The Web tests compile all macOS, Windows and Linux picker implementations and cover cancel output plus canonical paths with spaces.
- An isolated macOS Web run on ports `17071/1423` opened the frontmost Finder folder chooser, selected a two-project workspace, automatically scanned and selected both Git projects, batch-added them, and switched to All scopes. A second real chooser run verified Cancel returns without an error; pasted `/tmp` input remained usable and resolved to canonical `/private/tmp` projects marked Added/disabled.
- The same browser run verified the Settings navigation is absent, legacy `#/settings` redirects to `#/agents?scope=all`, All/Detected is display-only, undetected Kimi remains selectable, and its real default adapter location is shown. No Vite overlay or browser console error was present.
- One `Ctrl+C` released both launcher-owned ports. The isolated HOME, project fixtures, screenshots and browser session were then moved to the system Trash; the real HOME and real Agent configurations were not touched.
- `git diff --check` passed.
- Tauri dialog runtime and native Windows/Linux Web picker execution remain outside this macOS Web acceptance run; their TypeScript/Rust paths are covered by frontend tests, cross-platform test compilation, workspace tests and Clippy.
