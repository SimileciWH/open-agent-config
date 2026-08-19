# AI Docs Sync Log

## 2026-08-18 — Initial repository knowledge layer

- Source commit: `4321a802c021736592ba408b5ff913cff3919053`
- Change: created repository-level `AGENTS.md` and `ai-docs/` L0-L4 skeleton.
- Inventory: 328 tracked files, 88 Rust files, 151 TypeScript/TSX files, 4 workflows.
- Static evidence: adapter registry, scanner, manager/deployer, store/models, service/install, frontend transport, Web API, Tauri IPC, CLI and CI boundaries inspected.
- Current status: `static-verified`; runtime test gate remains pending until dependencies are available.
- Kimi status: planned only; no Kimi adapter or business code changed.
- Next verification: `npm run check:ai-docs`, `npm test`, `npm run build`, `npm run lint`, `cargo test --workspace`.

## 2026-08-18 — Frontend test environment compatibility

- Source change: configured `vitest.config.ts` jsdom URL as `http://localhost/`.
- Evidence: Node 26 + jsdom 29 uses an opaque default origin, so `localStorage` was undefined and 70 tests failed before exercising assertions; a non-opaque URL makes jsdom storage available.
- Documentation: updated `modules/runtime-boundaries.md` and this log in the same change set.
- Next verification: rerun `npm test`, then `npm run build` and `npm run lint`.

## 2026-08-18 — AI-DOCS-READY achieved

- Documentation status: all seven Kimi-impact L2 cards promoted to `runtime-verified`.
- L4 evidence: added `qa/golden-results.md` with answers and source anchors for Q-001 through Q-008.
- Verification passed: `npm run check:ai-docs`, `npm test` (286/286), `npm run build`, `npm run lint`, `cargo test --workspace` (all workspace tests passed), and `git diff --check`.
- Gate result: `AI-DOCS-READY=PASS`.
- Kimi status: implementation may now begin; no Kimi business code has been changed yet.

## 2026-08-18 — Frontend baseline cleanup

- Source change: fixed the Node 26 jsdom global type bridge, removed an obsolete Biome suppression, replaced a test non-null assertion with an explicit guard, and applied the existing formatter output to the Agent card.
- Documentation: updated `modules/frontend-extension-control.md`, `MAP.json`, and `COVERAGE.md` in the same change set.
- Next verification: rerun `npm run check:ai-docs`, `npm test`, `npm run build`, and `npm run lint`.

## 2026-08-18 — Vitest storage bridge

- Source change: added `src/test-storage-setup.ts` before the existing i18n setup and explicitly mapped jsdom `window.localStorage`/`sessionStorage` onto the test global.
- Reason: Node 26 exposes a separate experimental global storage surface; Vitest tests use bare `localStorage` and require the jsdom storage object.
- Documentation: updated `modules/runtime-boundaries.md` in the same change set.
- Next verification: rerun `npm test`, then `npm run build` and `npm run lint`.

## 2026-08-18 — Kimi Code first adapter slice

- Source change: added `KimiAdapter`, registered Kimi in the backend/frontend order, added the original Kimi-inspired mascot, implemented Kimi global/project Skills and MCP discovery, native MCP `enabled` toggling, and Kimi remote HTTP/SSE serialization.
- Kimi paths: `$KIMI_CODE_HOME` or `~/.kimi-code`; global `mcp.json` and Skills; project `.kimi-code/mcp.json`, `.kimi-code/skills`, plus shared `.agents/skills`.
- Safety boundary: Kimi-specific MCP fields are carried through `McpServerEntry::extra`; same-agent deployment preserves them, while incompatible cross-agent deployment returns an explicit validation error.
- Skill behavior: scanner and manager now round-trip both directory-form `SKILL.md`/`.disabled` and flat `.md`/`.md.disabled` entries.
- Targeted verification passed: `cargo test -p hk-core kimi`, flat Skill scanner/manager tests, and `cargo check -p hk-core`.
- Full automated verification is recorded below; manual acceptance remains for the user.

## 2026-08-18 — Kimi Code final verification

- Documentation gate: `npm run check:ai-docs` passed with 7 module cards and 354 indexed source/docs files.
- Frontend: `npm test` passed with 33 files and 286 tests; `npm run lint` passed for 183 files; `npm run build` passed with 2101 modules transformed.
- UI completeness: added Kimi filter colors to all six light/dark theme variants and registered the corresponding Tailwind color token.
- Rust: `cargo test --workspace` passed with hk-cli 17, hk-core 609, toggle integration 9, hk-desktop 2, hk-web unit 3, hk-web API 8, and no doctest failures.
- Local runtime read check: `hk status` detected 9 agents including Kimi and reported 160 extensions; no Kimi, Claude, or Codex configuration file was written by this check.
- Hygiene: `git diff --check` passed; unrelated full-repository formatter churn was removed before final verification.
- Gate result: `AI-DOCS-READY=PASS`; implementation is ready for manual desktop acceptance.
- Manual boundary: real local Kimi/Codex/Claude config files and the desktop UI still require user acceptance; Kimi lifecycle hooks remain intentionally out of v1.

## 2026-08-19 — Fork application update channel disabled

- Source commit: `4321a802c021736592ba408b5ff913cff3919053` plus the current working tree.
- Scope: application self-update only; Skills/MCP extension update behavior remains enabled and unchanged.
- Policy: added `src/config/release-channel.json` with `enabled: false` and no Web release URLs.
- Desktop isolation: removed the upstream updater endpoint/public key, disabled updater artifacts, removed updater/restart capabilities, and made plugin registration conditional on the shared policy.
- Frontend isolation: startup checks, sidebar cards, settings actions, dialogs, and both stores are gated; Settings still displays the local application version.
- Supply-chain gate: added `scripts/check-release-channel.mjs` to PR and tag release workflows; it rejects incomplete states and any updater URL pointing to `RealZST/HarnessKit`.
- Targeted verification passed: `npm run check:release-channel`; Web updater tests passed with 2 files and 17 tests, including no network request while disabled.
- Full verification passed: `npm test` (34 files, 287 tests), `npm run build` (2103 modules), `npm run lint` (186 files), `cargo test --workspace` (hk-cli 17, hk-core 609, toggle integration 9, hk-desktop 3, hk-web unit 3, hk-web API 8), `npm run check:ai-docs` (8 module cards, 360 indexed files), and `git diff --check`.
- Known gap: the fork's own Release feed, Tauri signing key, and signed macOS/Windows/Linux canary do not yet exist, so the channel must remain disabled.

## 2026-08-19 — Blue-white UI shell and recursive Git project paths

- Source commit: `6567543deb124c3e871665334b9d972f1aa7c879` plus the current working tree.
- UI scope: replaced the sparse frosted layout with a Jira/Wiki-inspired blue-white workspace shell; moved scope switching to the Topbar; added right-side language and appearance quick preferences; removed duplicate Appearance/Language sections from Settings; kept one user-facing blue-white base theme.
- Project path scope: Settings now keeps paste/manual entry and exposes a Tauri folder picker; direct Git paths are accepted; a selected workspace folder recursively enumerates Git repositories including linked worktrees, with deterministic sorting, dependency/hidden-directory exclusions, and depth 12 protection.
- Documentation: updated `modules/scanner.md`, `modules/runtime-boundaries.md`, added `modules/project-paths.md` and `modules/frontend-shell.md`, added the project-path playbook, and extended Golden QA with Q-011/Q-012.
- Frontend verification passed: `npm test` (34 files, 287 tests), `npm run lint` (188 files), `npm run build` (2105 modules), browser UI snapshot/interaction checks for language and light/dark/system modes, and targeted Rust Git discovery test (1 passed).
- Final verification passed: `cargo test --workspace` (hk-cli 17, hk-core 610, toggle integration 9, hk-desktop 3, hk-web unit 3, hk-web API 8, doctests 0 failures), `npm run check:ai-docs` (10 module cards, 365 indexed files), `npm run check:release-channel`, and final frontend build.
- Native Tauri folder picker, narrow viewport, and real local configuration writes remain manual gaps.

## 2026-08-19 — Flat preference controls and Browse-first project discovery

- Source commit: `6567543deb124c3e871665334b9d972f1aa7c879` plus the current working tree.
- Preference UI: removed the collapsible language/appearance popover. Topbar now permanently lays out `EN`、`简中`、`繁中`、`Auto`, localized language names, and sun/moon/system appearance choices; the blue-white theme indicator remains visible on wide layouts.
- Project Paths: clicking the Tauri “Choose folder” button now always calls recursive Git discovery and presents the selectable project list. Text entry keeps direct single-project add behavior and falls back to discovery for workspace paths.
- Correctness fix: the Browse handler now awaits a single discovery flow and no longer risks duplicate add/discovery calls.
- Documentation: updated `modules/frontend-shell.md`, `modules/project-paths.md`, `playbooks/project-paths.md`, Q-011/Q-012, and this log.
- Reverification passed: `npm run check:ai-docs` (10 module cards, 365 indexed source/docs files), `npm test` (34 files, 287 tests), `npm run build` (2105 modules transformed), `npm run lint` (188 files), `git diff --check`, and the targeted Rust Git discovery test (1 passed). Browser snapshot verification confirmed the permanent flat controls and localized Settings copy. Native Tauri folder Browse, narrow viewport, and real local configuration writes remain manual gaps.
- Formatting note: `cargo fmt --all -- --check` still reports pre-existing repository-wide Rust formatting drift outside this change; no unrelated formatter churn was applied.

## 2026-08-19 — Unified Auto preference strip

- Source commit: `6567543deb124c3e871665334b9d972f1aa7c879` plus the current working tree.
- Preference UI: reduced the Topbar control to exactly `EN`、`简中`、`繁中`、sun、moon、lowercase `auto`; removed visible duplicate language/appearance translations, the standalone system appearance button, and the non-interactive theme pill.
- Auto semantics: clicking `auto` writes both language preference `system` and appearance mode `system`; selecting a language or sun/moon independently clears the combined auto state.
- Regression coverage: added `src/components/layout/__tests__/quick-preferences.test.tsx` for the six-control surface and the combined Auto reset.
- Verification passed: targeted QuickPreferences tests (2/2), `npm test` (35 files, 289 tests), `npm run lint` (189 files), `npm run build` (2105 modules), `npm run check:ai-docs` (10 module cards, 366 indexed source/docs files), and `git diff --check`. Browser snapshot/interaction confirmed Dark → Auto state restoration.
- Manual gaps: native Tauri folder Browse, narrow viewport, and real local configuration writes remain outside this run.
