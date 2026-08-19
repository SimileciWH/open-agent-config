# L3：项目路径与递归 Git 发现 Playbook

## 实现顺序

1. 先确认 `src/lib/invoke.ts`、Web handler、Tauri command 与 `hk-core::scanner` 使用同一个发现契约。
2. 单路径添加继续走 `is_project_dir`，兼容 Git 仓库和已有 Agent marker。
3. 批量发现只走 `discover_git_repositories`，明确最大深度、隐藏/依赖目录和符号链接边界。
4. 设置页保留可粘贴输入；仅在 Tauri runtime 显示原生“选择文件夹”按钮，点击它始终走批量递归发现。
5. 发现结果必须稳定排序，默认勾选新增项，并阻止已登记路径重复添加。

## 验证顺序

```bash
cargo test -p hk-core scanner::tests::test_discover_git_repositories_finds_directories_and_worktrees
cargo test -p hk-web
cargo test -p hk-desktop
npm test
npm run build
npm run lint
npm run check:ai-docs
```

## 手工验收

- 在设置页 Topbar 直接核对 `EN`、`简中`、`繁中`、`Auto`，以及太阳/月亮/Auto 的可见状态，不需要打开弹窗。
- 在 Web 浏览器中把工作区路径粘贴进输入框；在 Tauri 中点击“选择文件夹”，确认直接进入递归发现清单。
- 选择含多个 Git 仓库的父目录，核对递归结果、默认全选、已添加路径禁用和批量添加反馈。
- 用含 `.git` 文件的 linked worktree 验证它不会被误判为普通目录。
