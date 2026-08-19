# L3：验证 Playbook

## 静态验证

```bash
npm run check:ai-docs
npm run check:release-channel
git diff --check
```

确认每张模块卡的 source path、stable anchor、状态和 verified commit 完整。

## 前端验证

```bash
npm ci
npm test
npm run build
npm run lint
npm audit --audit-level=high
```

## Rust 验证

```bash
cargo test --workspace
cargo metadata --no-deps --format-version 1
```

涉及 Web/CLI 时补充：

```bash
cargo test -p oac-web
cargo test -p oac-cli
```

涉及 Tauri 时在具备 Tauri CLI 和平台依赖后运行：

```bash
cargo tauri dev
```

涉及 UI Shell 或项目路径时补充：

```bash
cargo test -p oac-core scanner::tests::test_discover_git_repositories_finds_directories_and_worktrees
cargo test -p oac-web
cargo test -p oac-desktop
```

并在真实浏览器回读 Topbar 的语言/外观快捷菜单、Settings 的路径粘贴入口和 Git 仓库发现列表；Tauri 原生 Browse 仍需在桌面窗口中单独验收。

## 结果记录

每次验证必须在 `ai-docs/SYNC_LOG.md` 记录命令、结果、环境和未验证项。没有执行过的命令不能写成通过。

身份迁移变更还必须运行旧目录、Kit、Kiro、Codex、DSH 和 localStorage 的兼容测试与残留字符串扫描。残留项只能属于明确记录的迁移输入或上游隔离门禁，Desktop bundle ID 和用户可见发布说明必须使用 OAC 身份。
