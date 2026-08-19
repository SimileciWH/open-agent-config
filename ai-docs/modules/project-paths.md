---
id: core.project-paths
level: L2
status: runtime-verified
verified_commit: f37cfb93920740d24dfcfb00581e95ecb1d4b608
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/scanner.rs
  - crates/oac-web/src/handlers/projects.rs
  - crates/oac-desktop/src/commands/projects.rs
  - src/lib/invoke.ts
  - src/lib/dialog.ts
  - src/lib/types.ts
  - src/stores/project-store.ts
  - src/pages/settings.tsx
stable_anchors:
  - crates/oac-core/src/scanner.rs::discover_git_repositories
  - crates/oac-core/src/scanner.rs::is_git_repository
  - crates/oac-core/src/scanner.rs::is_project_dir
  - crates/oac-web/src/handlers/projects.rs::add_project
  - crates/oac-web/src/handlers/projects.rs::discover_projects
  - crates/oac-desktop/src/commands/projects.rs::add_project
  - crates/oac-desktop/src/commands/projects.rs::discover_projects
  - src/lib/invoke.ts::discoverProjects
  - src/stores/project-store.ts::addProject
  - src/pages/settings.tsx::handleAddPath
  - src/pages/settings.tsx::handleBrowseProject
known_gaps:
  - The native Tauri folder picker still needs a manual desktop acceptance pass; browser mode intentionally keeps paste/manual path entry because it has no native picker.
  - The runtime command caps recursion at depth 12 and skips hidden/dependency directories; this is a safety boundary rather than an unbounded filesystem crawl.

---

# 项目路径与 Git 仓库发现

## 职责

项目路径设置同时支持单项目添加和工作区批量发现。单路径添加接受 Git 仓库或已有 Agent project marker；用户选择一个非项目目录时，系统递归枚举其中的 Git 仓库并让用户批量确认。

## 关键流程

```text
输入框粘贴 / Tauri Browse
  → 输入框：settings::handleAddPath
       ├─ api.addProject
       └─ 失败后 api.discoverProjects
  → Tauri Browse：settings::handleBrowseProject
       └─ 始终 api.discoverProjects
  → discover_git_repositories(root, 12)
  → 勾选结果
  → projectStore.addProject（逐项）
```

## 关键事实

- Git 仓库由 `.git` 目录或 worktree `.git` 文件识别。
- 找到仓库后停止继续向下搜索，避免把仓库内的依赖目录或嵌套 checkout 当成同一批默认项目。
- 递归跳过隐藏目录、`node_modules`、`target`、`vendor`、构建产物、虚拟环境和符号链接目录；路径结果按绝对路径排序，便于稳定回读。
- 设置页默认勾选所有新增发现项，已经登记的路径显示为不可重复添加；用户可以逐项取消后再批量添加。
- 点击“选择文件夹”不会把父目录直接登记为单个项目，而是始终进入递归发现结果，适合选择工作区根目录。
- `openDirectoryPicker()` 只在 Tauri runtime 调用原生目录选择器；Web 端仍支持直接粘贴路径并调用同一 HTTP API。
