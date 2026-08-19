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
- Targeted verification passed: `cargo test -p oac-core kimi`, flat Skill scanner/manager tests, and `cargo check -p oac-core`.
- Full automated verification is recorded below; manual acceptance remains for the user.

## 2026-08-18 — Kimi Code final verification

- Documentation gate: `npm run check:ai-docs` passed with 7 module cards and 354 indexed source/docs files.
- Frontend: `npm test` passed with 33 files and 286 tests; `npm run lint` passed for 183 files; `npm run build` passed with 2101 modules transformed.
- UI completeness: added Kimi filter colors to all six light/dark theme variants and registered the corresponding Tailwind color token.
- Rust: `cargo test --workspace` passed with oac-cli 17, oac-core 609, toggle integration 9, oac-desktop 2, oac-web unit 3, oac-web API 8, and no doctest failures.
- Local runtime read check: the legacy CLI `status` command detected 9 agents including Kimi and reported 160 extensions; no Kimi, Claude, or Codex configuration file was written by this check.
- Hygiene: `git diff --check` passed; unrelated full-repository formatter churn was removed before final verification.
- Gate result: `AI-DOCS-READY=PASS`; implementation is ready for manual desktop acceptance.
- Manual boundary: real local Kimi/Codex/Claude config files and the desktop UI still require user acceptance; Kimi lifecycle hooks remain intentionally out of v1.

## 2026-08-19 — Fork application update channel disabled

- Source commit: `4321a802c021736592ba408b5ff913cff3919053` plus the current working tree.
- Scope: application self-update only; Skills/MCP extension update behavior remains enabled and unchanged.
- Policy: added `src/config/release-channel.json` with `enabled: false` and no Web release URLs.
- Desktop isolation: removed the upstream updater endpoint/public key, disabled updater artifacts, removed updater/restart capabilities, and made plugin registration conditional on the shared policy.
- Frontend isolation: startup checks, sidebar cards, settings actions, dialogs, and both stores are gated; Settings still displays the local application version.
- Supply-chain gate: added `scripts/check-release-channel.mjs` to PR and tag release workflows; it rejects incomplete states and any updater URL pointing to the legacy upstream repository.
- Targeted verification passed: `npm run check:release-channel`; Web updater tests passed with 2 files and 17 tests, including no network request while disabled.
- Full verification passed: `npm test` (34 files, 287 tests), `npm run build` (2103 modules), `npm run lint` (186 files), `cargo test --workspace` (oac-cli 17, oac-core 609, toggle integration 9, oac-desktop 3, oac-web unit 3, oac-web API 8), `npm run check:ai-docs` (8 module cards, 360 indexed files), and `git diff --check`.
- Known gap: the fork's own Release feed, Tauri signing key, and signed macOS/Windows/Linux canary do not yet exist, so the channel must remain disabled.

## 2026-08-19 — OAC identity refactor and repository review

- Source baseline: `6567543deb124c3e871665334b9d972f1aa7c879` plus the current working tree.
- Identity: renamed Rust crates/modules, CLI binary, package metadata, data directory, Kit suffix, Kiro file, Codex metadata, DSH managed markers, browser storage keys, UI copy, release assets and visual branding to Open Agent Config / OAC.
- Compatibility: centralized migration in `app_paths::open_store()` moves old data under a per-home lock, rejects symlink/split-brain states, repairs Kit DB paths and Kiro filenames, and keeps old Kit/Codex/DSH/localStorage values as read-only migration inputs. Desktop now uses the independent OAC bundle identifier `com.openagentconfig.app`; legacy desktop installations are not upgraded in place.
- Security review: fixed manifest-controlled Kit path escape at planning/import/sync/unsync I/O boundaries and added traversal, absolute-path, symlink, malicious-import, out-of-root and missing-project-root regression tests. ZIP resource-limit hardening remains open.
- Source ownership: removed the old remote CLI registry dependency, made CLI listing/execution use the same embedded registry, and moved Overview tips to same-origin `/tips.json`.
- Release boundary: release jobs emit only `oac-*` assets; installers fail closed until OAC-owned signed artifacts exist; application self-update remains disabled.
- Visuals: replaced README, Settings and Tauri legacy artwork with OAC brand art and regenerated PNG/ICNS/ICO resources.
- Release notes: rebranded user-visible product names, CLI examples, Kit suffixes and asset names to OAC across the repository history files.
- Identity gate: added `check:oac-identity` to PR and release workflows; only exact legacy migration inputs and the upstream isolation signature are allowlisted.
- Dependency review: removed unused Puppeteer and 90 transitives, then applied non-major audit fixes. Cold `npm ci` and `npm audit` passed with 0 vulnerabilities.
- Quality cleanup: removed 16 pre-existing Clippy warnings; `cargo clippy --workspace --all-targets -- -D warnings` now passes.
- Full verification passed: `npm test` (35 files, 290 tests), `npm run build` (2104 modules), `npm run lint` (188 files), `npm audit` (0 vulnerabilities), `cargo test --workspace` (662 tests), `cargo clippy --workspace --all-targets -- -D warnings`, `npm run check:oac-identity` (71 allowlisted migration/guard lines), `npm run check:ai-docs` (11 module cards, 371 indexed files), `npm run check:release-channel`, `cargo metadata`, and `git diff --check`.
- Runtime smoke: isolated-home `oac status` created only `.open-agent-config` state; no real user data was touched.
- Known gaps: `cargo fmt --all -- --check` exposes pre-existing repository-wide formatting drift; main frontend chunk is 818.36 kB; Kit ZIP resource limits, real desktop migration acceptance, OAC signing/release canaries, and the user's unfinished requirement item 2 remain open.

## 2026-08-19 — Blue-white UI and recursive project discovery

- Source change: integrated the Jira/Wiki-inspired blue-white shell, moved the scope switcher to the Topbar, and added the compact right-side preference strip with `EN`, `简中`, `繁中`, sun, moon, and lowercase `auto`. The settings page no longer repeats the language, appearance, or theme blocks.
- Project paths: direct path entry still accepts pasted Git/Agent project paths; Tauri folder selection calls the recursive discovery flow, which finds Git directories and linked worktrees, stops at repositories, skips hidden/dependency/build/symlink directories, and returns stable sorted results for batch confirmation.
- OAC merge boundary: the feature implementation is represented under `crates/oac-core`, `crates/oac-web`, and `crates/oac-desktop`; legacy feature-branch crate names were not carried into the OAC tree.
- Documentation: added `ui.frontend-shell`, `core.project-paths`, and the project-path verification playbook, plus Golden QA cases Q-014 and Q-015.
- Initial feature verification: `npm test`, `npm run lint`, `npm run build`, `npm run check:ai-docs`, targeted Rust scanner tests, workspace Rust tests, browser UI acceptance, and `git diff --check` passed before the main-branch merge. Final post-merge results and merge commit are recorded in the follow-up entry below.
