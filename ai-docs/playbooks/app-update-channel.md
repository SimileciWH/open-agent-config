# L3：应用升级通道启用 Playbook

## 适用范围

用于未来启用 open-agent-config 应用自身的 Web/Tauri 升级通道，不适用于 Skills/MCP 扩展更新。

## 启用前置条件

1. 已建立 fork 自己的 Release 仓库、发布流程和稳定下载地址。
2. 已生成专属 Tauri updater 密钥；私钥及密码仅保存在 CI Secret，仓库只保存公钥。
3. macOS、Windows、Linux 的目标包、命名、版本号和签名策略已确定。
4. 已准备 fork 自己的 Web 升级说明页面，不能复用 `RealZST/HarnessKit` 的升级地址。

## 同一变更集内的启用步骤

1. 在 `src/config/release-channel.json` 中填写 fork 自己的 HTTPS Release API、升级说明 URL，并把 `enabled` 改为 `true`。
2. 在 `crates/hk-desktop/tauri.conf.json` 中添加 fork 自己的 updater endpoint 和公钥，并设置 `createUpdaterArtifacts: true`。
3. 在 `crates/hk-desktop/capabilities/default.json` 中恢复 `updater:default` 和 `process:allow-restart`。
4. 确认 `crates/hk-desktop/src/main.rs::app_update_enabled` 注册 updater/process 插件。
5. 更新本模块卡、runtime boundary、Golden QA、Coverage 和 Sync Log。

## 验证顺序

```bash
npm run check:release-channel
npx vitest run src/stores/__tests__/web-update-store.test.ts
npm test
npm run build
npm run lint
cargo test -p hk-desktop
cargo test --workspace
npm run check:ai-docs
git diff --check
```

随后用隔离安装执行签名 canary：旧版本发现新版本、下载、验签、安装、重启、版本回读和失败回滚均须在目标平台留证。任一平台或签名证据缺失时，不得把通道标为可发布。

## 回退

如果发布源、签名或 canary 失败，把策略恢复为 `enabled: false`，清空 Web URL，移除 Tauri updater 配置和 capability，并把 `createUpdaterArtifacts` 恢复为 `false`。再次运行上述静态与自动化检查。
