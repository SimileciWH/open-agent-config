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
```

## Rust 验证

```bash
cargo test --workspace
```

涉及 Web/CLI 时补充：

```bash
cargo test -p hk-web
cargo test -p hk-cli
```

涉及 Tauri 时在具备 Tauri CLI 和平台依赖后运行：

```bash
cargo tauri dev
```

## 结果记录

每次验证必须在 `ai-docs/SYNC_LOG.md` 记录命令、结果、环境和未验证项。没有执行过的命令不能写成通过。
