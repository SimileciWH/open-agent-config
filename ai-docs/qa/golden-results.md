# L4 Golden QA Results

## Verification context

- Source baseline: `6567543deb124c3e871665334b9d972f1aa7c879` plus the current OAC refactor working tree.
- Node: `v26.3.0`
- npm: `11.16.0`
- Rust: `rustc/cargo 1.97.1` from Homebrew
- Result: all fifteen Golden QA cases answered with source anchors.

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

### Q-014 — Project path discovery

单路径添加保留 Git 仓库和 Agent marker 兼容性；选择工作区文件夹时，Web/Tauri handler 调用核心 `discover_git_repositories`，递归识别 `.git` 目录和 worktree `.git` 文件，跳过隐藏/依赖/构建目录和符号链接目录，并按路径稳定排序后交给前端批量确认。

Anchors: `crates/oac-core/src/scanner.rs::discover_git_repositories`, `crates/oac-core/src/scanner.rs::is_git_repository`, `crates/oac-web/src/handlers/projects.rs::discover_projects`, `crates/oac-desktop/src/commands/projects.rs::discover_projects`, `src/pages/settings.tsx::handleBrowseProject`.

### Q-015 — Blue-white shell and compact preferences

`AppShell`、Sidebar、Topbar 和 `QuickPreferences` 组成蓝白工作区；右上角常驻显示 `EN`、`简中`、`繁中`、太阳、月亮和 `auto`，其中 `auto` 同时恢复语言和外观的系统状态。设置页不再重复放置大块语言/外观/主题设置，主题只保留蓝白基础主题。

Anchors: `src/components/layout/app-shell.tsx::AppShell`, `src/components/layout/topbar.tsx::Topbar`, `src/components/layout/quick-preferences.tsx::QuickPreferences`, `src/stores/ui-store.ts::useUIStore`, `src/components/layout/__tests__/quick-preferences.test.tsx::auto restores both language and appearance system`.

## Automated verification

- `npm run check:release-channel` passed with the application update channel disabled and no upstream release source configured.
- `npm run check:ai-docs` passed: 11 module cards and 370 indexed source/docs files.
- Cold `npm ci` passed; `npm audit --audit-level=high` reports 0 vulnerabilities after removing the unused Puppeteer production dependency and applying non-major lockfile updates.
- `npm test` passed: 35 files, 290 tests; `npm run lint` passed: 188 files.
- `npm run build` passed with 2104 modules transformed; the existing 818.36 kB main-chunk warning and Node deprecation warning remain.
- `cargo clippy --workspace --all-targets -- -D warnings` passed after clearing 16 pre-existing mechanical lints.
- `cargo test --workspace` passed: oac-cli 17, oac-core 622, toggle integration 9, oac-desktop 3, oac-web unit 3, oac-web API 8, doctests 0 failures.
- An isolated-home `oac status` smoke test created only `.open-agent-config`, `.open-agent-config.migration.lock`, and its SQLite files; the real user home was not touched.
- `git diff --check` passed.
- `cargo fmt --all -- --check` still reports repository-wide pre-existing formatting drift; no full-tree formatter rewrite was applied.
- Manual acceptance remains outside automation: launch the rebuilt desktop UI, verify the two OAC icon choices, exercise migration against a disposable copy of real legacy state, and validate signed packages when an OAC release/signing channel exists.
