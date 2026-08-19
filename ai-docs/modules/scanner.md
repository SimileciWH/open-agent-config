---
id: core.scanner
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - crates/hk-core/src/scanner.rs
stable_anchors:
  - crates/hk-core/src/scanner.rs::scan_all
  - crates/hk-core/src/scanner.rs::scan_adapter
  - crates/hk-core/src/scanner.rs::scan_skill_dir
  - crates/hk-core/src/scanner.rs::scan_mcp_servers
  - crates/hk-core/src/scanner.rs::skill_locations
  - crates/hk-core/src/scanner.rs::discover_projects
  - crates/hk-core/src/scanner.rs::discover_git_repositories
  - crates/hk-core/src/scanner.rs::is_git_repository
  - crates/hk-core/src/scanner.rs::is_project_dir
known_gaps:
  - Kimi's nearest-project-root precedence is represented by project scope discovery; a future runtime acceptance should verify nested working-directory behavior against the installed CLI.
  - Git repository discovery intentionally stops at the first repository, skips hidden/dependency directories, and caps recursion at the caller-provided depth.
---

# Scanner 与发现模型

## 职责

Scanner 通过 Adapter 读取 Agent 配置，把 Skills、MCP、Hooks、Plugins 和 CLI 统一转换成 `models::Extension`，再交给 Store 同步；同时提供项目路径识别与 Git 仓库递归发现。

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
- `is_project_dir()` 接受 Git 仓库（`.git` 目录或 worktree `.git` 文件）以及已有 Agent project marker，因此单路径添加不会破坏非 Git 项目。
- `discover_git_repositories()` 是批量路径选择的专用入口：按路径排序，遇到仓库后停止向下递归，并跳过隐藏目录、依赖目录和符号链接目录。
- Web/Tauri 的 `discover_projects` 命令使用最大深度 12；输入目录本身是 Git 仓库时只返回它自身，避免重复枚举嵌套 checkout。
- Kimi 全局 MCP 位于 `$KIMI_CODE_HOME/mcp.json`（未设置时 `~/.kimi-code/mcp.json`），项目 MCP 位于 `.kimi-code/mcp.json`；项目层同名条目覆盖用户层由 Kimi 自身解释。

## 新增 Agent 必须检查

- Adapter 返回的 skill dirs 是否会被 `scan_all()` 遍历。
- MCP config path 是否与 global/project scope 一致。
- disabled Skill 文件是否能被重新发现。
- flat Skill 在 `.md` 与 `.md.disabled` 间切换后是否能被重新发现。
- MCP native disabled 状态能否从目标 Agent 配置读回。
- stable ID 是否不会和现有 Agent 或 scope 冲突。
