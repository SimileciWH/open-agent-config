---
id: core.scanner
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/scanner.rs
stable_anchors:
  - crates/oac-core/src/scanner.rs::scan_all
  - crates/oac-core/src/scanner.rs::scan_adapter
  - crates/oac-core/src/scanner.rs::scan_skill_dir
  - crates/oac-core/src/scanner.rs::scan_mcp_servers
  - crates/oac-core/src/scanner.rs::skill_locations
known_gaps:
  - Kimi's nearest-project-root precedence is represented by project scope discovery; a future runtime acceptance should verify nested working-directory behavior against the installed CLI.
---

# Scanner 与发现模型

## 职责

Scanner 通过 Adapter 读取 Agent 配置，把 Skills、MCP、Hooks、Plugins 和 CLI 统一转换成 `models::Extension`，再交给 Store 同步。

## 关键流程

```text
scan_all
  → each adapter skill dirs
  → scan_mcp_servers
  → scan_hooks
  → scan_plugins
  → project extensions
  → scan_cli_binaries
  → Store::sync_extensions
```

## 关键事实

- Skill 目录识别 `SKILL.md` 和 `SKILL.md.disabled`；同时识别 Kimi 支持的 flat `.md` 和 `.md.disabled` 文件，disabled 状态由文件名体现。
- MCP 通过 Adapter 的 `read_mcp_servers()` 读取，scanner 记录 transport、scope、source path 和 enabled 状态。
- `skill_locations()` 用于根据名称跨 Agent 找到物理目录或 flat Markdown 文件，是 Skills 开关的文件定位入口。
- `scan_all()` 会结合已登记 project 扫描全局和项目 scope。
- Kimi 全局 MCP 位于 `$KIMI_CODE_HOME/mcp.json`（未设置时 `~/.kimi-code/mcp.json`），项目 MCP 位于 `.kimi-code/mcp.json`；项目层同名条目覆盖用户层由 Kimi 自身解释。

## 新增 Agent 必须检查

- Adapter 返回的 skill dirs 是否会被 `scan_all()` 遍历。
- MCP config path 是否与 global/project scope 一致。
- disabled Skill 文件是否能被重新发现。
- flat Skill 在 `.md` 与 `.md.disabled` 间切换后是否能被重新发现。
- MCP native disabled 状态能否从目标 Agent 配置读回。
- stable ID 是否不会和现有 Agent 或 scope 冲突。
