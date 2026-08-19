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

涉及本地开发启动编排时，使用备用端口避免干扰现有服务：

```bash
OAC_BACKEND_PORT=17070 OAC_FRONTEND_PORT=1422 npm run dev
curl --fail -X POST -H 'content-type: application/json' -d '{}' http://127.0.0.1:17070/api/server_info
curl --fail -X POST -H 'content-type: application/json' -d '{}' http://localhost:1422/api/server_info
```

确认启动顺序为 backend ready 后再启动 Vite，并确认一次 `Ctrl+C` 会终止本轮创建的两个子进程。Windows 还需在 PowerShell/CMD、Linux 还需在目标发行版 shell 中验证相同 npm script 的进程清理行为。

涉及 Tauri 时在具备 Tauri CLI 和平台依赖后运行：

```bash
cargo tauri dev
```

涉及 UI Shell 或项目路径时补充：

```bash
cargo test -p oac-core scanner::tests::test_discover_projects
cargo test -p oac-web
cargo test -p oac-desktop
```

并在真实浏览器回读 Topbar 的语言/外观快捷菜单、Scope 菜单的 Add/Manage Project 弹窗、Agents 的 All/Detected 纯过滤和行内启停。项目目录选择需确认选择器和粘贴两条入口并存、选择完成自动扫描、取消不报错；macOS/Windows/Linux 的 Web 宿主选择器以及 Tauri dialog plugin 需分别在对应桌面环境验收。Linux 无 GUI 或 Zenity/Yad/KDialog 均不可用时，应显示错误且仍允许粘贴路径。

## 结果记录

每次验证必须在 `ai-docs/SYNC_LOG.md` 记录命令、结果、环境和未验证项。没有执行过的命令不能写成通过。

身份迁移变更还必须运行旧目录、Kit、Kiro、Codex、DSH 和 localStorage 的兼容测试与残留字符串扫描。残留项只能属于明确记录的迁移输入或上游隔离门禁，Desktop bundle ID 和用户可见发布说明必须使用 OAC 身份。
