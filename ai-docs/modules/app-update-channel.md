---
id: runtime.app-update-channel
level: L2
status: runtime-verified
verified_commit: 4321a802c021736592ba408b5ff913cff3919053
last_verified: 2026-08-19
source_paths:
  - src/config/release-channel.json
  - src/lib/app-update-policy.ts
  - src/App.tsx
  - src/stores/update-store.ts
  - src/stores/web-update-store.ts
  - src/components/layout/*update*.tsx
  - src/components/layout/sidebar.tsx
  - src/pages/settings.tsx
  - crates/hk-desktop/src/main.rs
  - crates/hk-desktop/tauri.conf.json
  - crates/hk-desktop/capabilities/default.json
  - scripts/check-release-channel.mjs
  - .github/workflows/pr-checks.yml
  - .github/workflows/release.yml
stable_anchors:
  - src/lib/app-update-policy.ts::isAppUpdateEnabledForRuntime
  - src/stores/update-store.ts::checkForUpdate()
  - src/stores/web-update-store.ts::checkForUpdate(force = false)
  - crates/hk-desktop/src/main.rs::app_update_enabled
  - scripts/check-release-channel.mjs::validateReleaseChannel
known_gaps:
  - The fork does not yet own a published updater feed or Tauri signing key, so application self-update must remain disabled.
  - A signed canary update has not been validated on macOS, Windows, or Linux.
---

# 应用升级通道

## 职责与边界

本模块只管理 open-agent-config 应用自身的版本升级。Skills、MCP 和其他扩展的来源检查与更新属于 Extension Manager，不能因关闭应用升级而被关闭。

## 当前策略

- `src/config/release-channel.json` 是 Web 与 Tauri 共用的发布通道开关，当前固定为 `enabled: false`。
- Web Release API 和升级说明 URL 当前必须为 `null`，因此不会发起 Release 查询。
- Tauri 配置不包含 updater endpoint 或公钥，不生成 updater artifacts，也不授予 updater/restart capability。
- 桌面入口仅在策略开启时注册 updater 和 process 插件；关闭状态下对应命令不存在。
- App、Sidebar、Settings 和 Store 都通过 `isAppUpdateEnabledForRuntime` 二次门控，既不自动检查，也不显示升级入口。
- PR 和 tag release workflow 均运行 `scripts/check-release-channel.mjs`，防止状态不完整或重新指向 `RealZST/HarnessKit`。

## 关键不变量

```text
disabled
  => no Web release URLs
  AND no Tauri endpoint/public key
  AND no updater artifacts
  AND no updater/restart capabilities
  AND no startup check or update UI
```

只有自有 Release、HTTPS 更新源、Tauri 公钥、CI 私钥和跨平台签名验收全部就绪后，才能按 L3 剧本一次性打开所有门。
