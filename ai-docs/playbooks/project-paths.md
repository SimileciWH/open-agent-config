# L3：项目添加、管理与递归发现 Playbook

## 实现顺序

1. 先确认 `src/lib/invoke.ts`、Web handler、Tauri command 与 `oac-core::scanner` 使用同一个发现契约。
2. 粘贴路径、Tauri 目录选择和 local Web 宿主目录选择都必须先走 `discover_projects`，兼容 Git/worktree 和已有 Agent marker；不得绕过确认直接写入。
3. 明确最大深度、隐藏/依赖目录和符号链接边界；一次递归只构建一次 Adapter marker 列表。
4. Add/Manage Project 入口放在 Topbar Scope 菜单；“选择工作区文件夹”和粘贴路径始终同时显示。Tauri 走 dialog plugin，Web 走后端 `select_project_directory`。
5. Web 宿主选择器必须覆盖 macOS Finder、Windows PowerShell `FolderBrowserDialog` 和 Linux Zenity/Yad/KDialog；取消不报错，无 GUI 或缺少命令时显示可操作错误并保留粘贴回退。
6. 发现结果必须 canonicalize 并稳定排序，默认勾选新增项，并阻止别名路径或已登记路径重复添加。
7. 批量添加成功后只重扫一次；单项目切到该项目，多项目切到 All scopes。
8. Manage Projects 移除前二次确认，并明确不会删除磁盘文件。

## 验证顺序

```bash
cargo test -p oac-core scanner::tests::test_discover_projects
cargo test -p oac-web
cargo test -p oac-desktop
npx vitest run src/components/projects/__tests__/project-dialogs.test.tsx src/lib/__tests__/scope-switcher.test.tsx
npm run build
npm run lint
npm run check:ai-docs
```

## 手工验收

- 在任意页面打开 Topbar Scope 菜单，确认 Add Project/Manage Projects 不会跳转页面。
- 在 Web 弹窗中分别点击“选择工作区文件夹”和粘贴工作区路径；在 Tauri 中点击同一选择入口，确认三条路径都先进入递归发现清单。
- 在 macOS、Windows、Linux 分别验证宿主选择器；Linux 还要覆盖至少一个可用选择器及无选择器/headless 时的粘贴回退。
- 选择含多个 Git 仓库或 Agent marker 项目的父目录，核对默认全选、已添加路径禁用和批量添加反馈。
- 用含 `.git` 文件的 linked worktree 验证它不会被误判为普通目录。
- 从 Manage Projects 移除当前 scope，确认切回 Global 且磁盘内容保留。
