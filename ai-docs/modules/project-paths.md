---
id: core.project-paths
level: L2
status: runtime-verified
verified_commit: bc352a314ab14101bd518aae19de3350cbb98828
last_verified: 2026-08-19
source_paths:
  - crates/oac-core/src/scanner.rs
  - crates/oac-web/src/handlers/projects.rs
  - crates/oac-desktop/src/commands/projects.rs
  - src/lib/invoke.ts
  - src/lib/dialog.ts
  - src/lib/types.ts
  - src/stores/project-store.ts
  - src/components/layout/scope-switcher.tsx
  - src/components/layout/scope-switcher-menu.tsx
  - src/components/projects/project-dialogs.tsx
  - src/components/projects/__tests__/project-dialogs.test.tsx
stable_anchors:
  - crates/oac-core/src/scanner.rs::discover_projects
  - crates/oac-core/src/scanner.rs::discover_git_repositories
  - crates/oac-core/src/scanner.rs::is_git_repository
  - crates/oac-core/src/scanner.rs::is_project_dir
  - crates/oac-web/src/handlers/projects.rs::add_project
  - crates/oac-web/src/handlers/projects.rs::discover_projects
  - crates/oac-web/src/handlers/projects.rs::select_project_directory
  - crates/oac-web/src/handlers/projects.rs::select_project_directory_native
  - crates/oac-desktop/src/commands/projects.rs::add_project
  - crates/oac-desktop/src/commands/projects.rs::discover_projects
  - src/lib/invoke.ts::discoverProjects
  - src/lib/invoke.ts::selectProjectDirectory
  - src/stores/project-store.ts::addProjects
  - src/components/projects/project-dialogs.tsx::AddProjectDialog
  - src/components/projects/project-dialogs.tsx::ManageProjectsDialog
known_gaps:
  - The local macOS Web host picker is runtime-verified; Tauri and native Windows/Linux runtime execution still require acceptance on those target operating systems.
  - Linux Web mode requires zenity, yad, or kdialog and a graphical session; headless or picker-less hosts explicitly fall back to pasted paths.
  - The runtime command caps recursion at depth 12 and skips hidden/dependency directories; this is a safety boundary rather than an unbounded filesystem crawl.

---

# 项目路径与工作区发现

## 职责

项目管理位于 Topbar 的 Scope 菜单，不再占用独立 Settings 页面。用户选择工作区目录或粘贴路径后，系统先递归发现 Git 仓库和已有 Agent project marker，再让用户批量确认。

## 关键流程

```text
ScopeSwitcher → Add Project
  → 选择工作区文件夹
       ├─ Tauri：跨平台 dialog plugin
       └─ local Web：宿主选择器（macOS Finder / Windows FolderBrowserDialog / Linux zenity|yad|kdialog）
     或粘贴路径
  → api.discoverProjects
  → discover_projects(root, 12)
       ├─ Git repository (.git dir/file)
       └─ AgentAdapter::project_markers
  → 勾选结果
  → projectStore.addProjects（批量写入，一次重扫）
  → 单个成功：切到该 project；多个成功：切到 All scopes
```

## 关键事实

- Git 仓库由 `.git` 目录或 worktree `.git` 文件识别；非 Git 目录也可由任一 Adapter 的稳定 project marker 识别。
- 找到一个项目根后停止继续向下搜索，避免把项目内部目录重复列为候选。
- 扫描入口先 canonicalize 所选根目录，再递归跳过隐藏目录、`node_modules`、`target`、`vendor`、构建产物、虚拟环境和符号链接目录；路径结果按规范绝对路径排序，避免 macOS `/tmp` 与 `/private/tmp` 等别名重复出现。
- Add Project 弹窗默认勾选所有新增发现项，已经登记的路径不可重复勾选；用户可逐项取消后再确认。
- 无论粘贴还是选择文件夹都先发现、后写入，不会把父目录未经确认直接登记为项目。
- Tauri 通过 `openDirectoryPicker()` 使用插件提供的 macOS/Windows/Linux 原生选择器；Web 通过 `select_project_directory` 在本地后端打开宿主操作系统选择器，浏览器本身不读取绝对路径。
- Web 后端在 macOS 使用 Finder/AppleScript，在 Windows 使用 PowerShell `FolderBrowserDialog`，在 Linux 依次尝试 Zenity、Yad 和 KDialog；取消返回空结果，命令不可用或无图形会显示错误，此时仍可粘贴路径继续。
- Manage Projects 弹窗显示缺失路径并要求二次确认；移除只删除 OAC 登记和关联数据库行，不删除磁盘文件。
