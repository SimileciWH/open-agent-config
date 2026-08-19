# L4 Golden QA Results

## Verification context

- Source baseline: `4321a802c021736592ba408b5ff913cff3919053` plus the current working-tree UI, project-path, documentation and test-infrastructure changes.
- Node: `v26.3.0`
- npm: `11.16.0`
- Rust: `rustc/cargo 1.97.1` from Homebrew
- Result: all twelve Golden QA cases answered with source anchors.

## Results

### Q-001 — Agent registry and frontend order

The backend registry is `adapter::all_adapters`; the frontend display order is `AGENT_ORDER`. Their order is an explicit cross-layer invariant.

Anchors: `crates/hk-core/src/adapter/mod.rs::all_adapters`, `src/lib/types.ts::AGENT_ORDER`.

### Q-002 — Scan to Store path

`scanner::scan_all` scans each registered Adapter, global extensions, project extensions and CLI children, then `Store::sync_extensions` reconciles the result. Project scope is resolved through `scan_project_extensions` and remains distinct from global scope. Kimi contributes both its KIMI_CODE_HOME-backed paths and the shared `.agents/skills` path.

Anchors: `crates/hk-core/src/scanner.rs::scan_all`, `crates/hk-core/src/scanner.rs::scan_project_extensions`, `crates/hk-core/src/store.rs::sync_extensions`.

### Q-003 — Skill Enable/Disable

The frontend toggles every instance in a logical group. Core Manager resolves locations with `skill_locations`, then renames directory-form `SKILL.md` to `SKILL.md.disabled` or flat `.md` to `.md.disabled`, and restores the original filename within the target scope.

Anchors: `src/stores/extension-store.ts::toggle`, `crates/hk-core/src/manager.rs::toggle_skill`, `crates/hk-core/src/scanner.rs::skill_locations`.

### Q-004 — MCP secret protection and restore

`manager::toggle_mcp` dispatches native per-Agent writers when supported. Kimi's writer changes only `enabled`, preserving advanced fields in place. Otherwise the manager reads the entry, redacts secret-bearing blocks before writing a DB snapshot, removes the entry, and uses the Deployer restore path on enable.

Anchors: `crates/hk-core/src/manager.rs::toggle_mcp`, `crates/hk-core/src/manager.rs::redact_mcp_env`, `crates/hk-core/src/deployer.rs::restore_mcp_server`.

### Q-005 — Frontend group toggle

`buildGroups` creates logical groups. `extensionStore::toggle` collects all instances in the selected group and calls `api.toggleExtension` for each instance with `Promise.allSettled`, so partial failures can be surfaced without losing successful results.

Anchors: `src/stores/extension-store.ts::toggle`, `src/stores/extension-helpers.ts::buildGroups`, `src/lib/invoke.ts::api`.

### Q-006 — Web and Tauri semantics

The Web handler and Tauri command are separate transport wrappers, but both delegate to the shared core manager semantics. Browser mode uses HTTP; desktop mode uses Tauri IPC.

Anchors: `crates/hk-web/src/handlers/extensions.rs::toggle_extension`, `crates/hk-desktop/src/commands/extensions.rs::toggle_extension`, `crates/hk-core/src/manager.rs::toggle_extension_with_adapters`.

### Q-007 — Kimi change surface

Kimi now has an Adapter and registration, aligned frontend order/capabilities and mascot, scanner/install paths, native MCP handling, explicit advanced-field conversion policy, round-trip tests, and synchronized affected L0-L4 cards.

Anchors: `crates/hk-core/src/adapter/mod.rs::AgentAdapter`, `crates/hk-core/src/adapter/mod.rs::all_adapters`, `src/lib/types.ts::AGENT_ORDER`, `crates/hk-core/src/manager.rs::toggle_mcp`, `AGENTS.md`.

### Q-008 — Completion evidence

Completion requires source anchors, synchronized AI Docs, `npm run check:ai-docs`, relevant frontend and Rust tests, build/lint results, and explicit reporting of any unverified item.

Anchors: `AGENTS.md`, `ai-docs/WORKFLOW.md`, `ai-docs/SYNC_LOG.md`.

### Q-009 — Kimi MCP paths and schema

Kimi resolves its user data directory from `KIMI_CODE_HOME` or `~/.kimi-code`, reads user MCP from `mcp.json`, and reads project MCP from `.kimi-code/mcp.json`. HTTP entries use `url`; SSE entries use `transport: "sse"` plus `url`; native enablement is the per-entry `enabled` field. Kimi-specific fields are retained when deploying to Kimi and rejected with an explicit validation error for incompatible targets.

Anchors: `crates/hk-core/src/adapter/kimi.rs::KimiAdapter`, `crates/hk-core/src/deployer.rs::set_kimi_mcp_enabled`, `crates/hk-core/src/adapter/mod.rs::RemoteMcpSchema`.

### Q-010 — Fork application update isolation

Application self-update is independent from Skills/MCP extension updates. `release-channel.json` is disabled, so the frontend policy blocks startup checks and update UI in both Web and desktop modes. Tauri also has no updater endpoint/public key, no updater artifacts, no updater/restart capabilities, and conditionally skips plugin registration. Re-enabling requires the fork's own HTTPS feed and instructions, a repository public key plus CI-held private key, restored capabilities/artifacts, the release-channel check, and signed cross-platform canary evidence.

Anchors: `src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime`, `crates/hk-desktop/src/main.rs::app_update_enabled`, `scripts/check-release-channel.mjs::validateReleaseChannel`.

### Q-011 — Recursive Git project discovery

`discover_git_repositories` recognizes both a `.git` directory and a linked-worktree `.git` file. The Browse folder action enters this discovery path directly instead of first registering the selected parent, then the scanner stops descending once a repository is found, skips hidden/dependency/symlink directories, sorts by path, and is called by both Web and Tauri project commands with a depth limit of 12.

Anchors: `crates/hk-core/src/scanner.rs::discover_git_repositories`, `crates/hk-core/src/scanner.rs::is_git_repository`, `crates/hk-web/src/handlers/projects.rs::discover_projects`, `crates/hk-desktop/src/commands/projects.rs::discover_projects`, `src/pages/settings.tsx::handleBrowseProject`.

### Q-012 — Blue-white frontend shell and quick preferences

`Topbar` places a permanently visible, flat `QuickPreferences` group at the upper right. It exposes only `EN`, `简中`, `繁中`, sun, moon, and lowercase `auto`; the `auto` action jointly restores the language and appearance system states, without showing duplicate translations or a separate system-mode control. Appearance and language controls were removed from Settings, and the blue-white base theme remains internal rather than occupying the preference bar.

Anchors: `src/components/layout/quick-preferences.tsx::QuickPreferences`, `src/components/layout/topbar.tsx::Topbar`, `src/stores/ui-store.ts::useUIStore`, `src/index.css::workspace-shell`.

## Automated verification

- `npm run check:release-channel` passed with the application update channel disabled and no upstream release source configured.
- `npm run check:ai-docs` passed: 10 module cards and 366 indexed source/docs files.
- `npm test` passed: 35 files, 289 tests.
- `npm run lint` passed: 189 files.
- `npm run build` passed with 2105 modules transformed; only the existing chunk-size and Node deprecation warnings remain.
- `cargo test -p hk-core scanner::tests::test_discover_git_repositories_finds_directories_and_worktrees` passed: 1 test.
- `cargo test --workspace` passed: hk-cli 17, hk-core 610, toggle integration 9, hk-desktop 3, hk-web unit 3, hk-web API 8, doctests 0 failures.
- Local runtime read check passed: `hk status` detected 9 agents including Kimi and reported 160 extensions; the check did not write Kimi, Claude, or Codex configuration files.
- `git diff --check` passed.
- Manual acceptance: browser UI visual/interaction checks passed for the compact six-control Topbar strip, including Dark → Auto restoring both system states; native Tauri folder Browse, narrow viewport, and real local configuration writes remain outside this run.
