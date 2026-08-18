---
id: core.marketplace
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/marketplace.rs
  - crates/oac-core/src/service.rs
  - crates/oac-web/src/handlers/marketplace.rs
  - crates/oac-desktop/src/commands/marketplace.rs
  - src/pages/overview.tsx
  - public/tips.json
stable_anchors:
  - crates/oac-core/src/marketplace.rs::search_skills_async
  - crates/oac-core/src/marketplace.rs::search_servers_async
  - crates/oac-core/src/marketplace.rs::list_cli_registry
  - crates/oac-core/src/marketplace.rs::get_embedded_cli_entry
  - src/pages/overview.tsx::fetchTips
known_gaps:
  - Skills and MCP discovery still depend on third-party skills.sh and Smithery availability.
  - The CLI catalog has no OAC-owned signed remote feed; it is intentionally embedded-only until such a feed exists.
---

# Marketplace 来源策略

## 职责

Marketplace 对 Skills、MCP 和 CLI 做搜索、详情读取和安装元数据解析。Web 与 Tauri 使用同一核心来源策略。

## 当前来源

- Skills 搜索与审计：skills.sh；MCP 搜索：Smithery；GitHub 用于读取明确指向的内容与 stars。
- CLI 列表和实际执行都只从仓库内嵌 registry 解析，避免列表来源与执行 allowlist 分裂。
- Overview 提示读取同源 `/tips.json`，不再访问旧项目资源仓库。

## 安全边界

- 增加远程 CLI registry 前，必须同时定义所有权、签名/完整性、缓存失效、失败回退和执行 allowlist 一致性。
- 外部来源失败必须返回明确的 Network/NotFound 错误，不能静默伪造 marketplace 内容。
