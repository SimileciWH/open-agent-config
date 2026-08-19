---
id: ui.frontend-shell
level: L2
status: runtime-verified
verified_commit: 6567543deb124c3e871665334b9d972f1aa7c879
last_verified: 2026-08-19
source_paths:
  - src/components/layout/app-shell.tsx
  - src/components/layout/sidebar.tsx
  - src/components/layout/topbar.tsx
  - src/components/layout/quick-preferences.tsx
  - src/components/layout/__tests__/quick-preferences.test.tsx
  - src/components/layout/scope-switcher.tsx
  - src/components/layout/scope-switcher-menu.tsx
  - src/pages/settings.tsx
  - src/stores/ui-store.ts
  - src/index.css
  - src/lib/i18n/locales/*/*.json
stable_anchors:
  - src/components/layout/app-shell.tsx::AppShell
  - src/components/layout/sidebar.tsx::Sidebar
  - src/components/layout/topbar.tsx::Topbar
  - src/components/layout/quick-preferences.tsx::QuickPreferences
  - src/components/layout/scope-switcher.tsx::ScopeSwitcher
  - src/pages/settings.tsx::SettingsPage
  - src/stores/ui-store.ts::useUIStore
  - src/index.css::workspace-shell
known_gaps:
  - Visual acceptance covered the live browser UI in light/dark/system modes; a native Tauri window and narrow viewport still need a manual desktop pass.
  - The internal `tiesen` DOM theme name remains as a compatibility identifier, but the user-facing surface exposes only the blue-white base theme.

---

# 前端 Shell 与快速偏好

## 职责

Frontend Shell 负责 Jira/Wiki 风格的蓝白工作区框架：深蓝侧栏、纸张感主内容、顶部工作区/作用域切换，以及右上角语言和外观快速偏好。设置页只保留路径与 Agent 运行配置，不再重复放置外观、主题和语言大块设置。

## 关键事实

- `AppShell` 把侧栏、Topbar 和圆角主面板组合成稳定的工作区层，并在页面切换时提供轻量进入动效。
- `QuickPreferences` 只显示 `EN`、`简中`、`繁中`、太阳、月亮和 `auto` 六个短控件；不再展示语言/外观对应翻译，也不再单独展示系统外观选项。
- `auto` 是语言与外观的联合系统状态：点击后同时写入语言 `system` 和外观 `system`；主题只保留一套 blue-white base theme，不占用用户偏好条空间。
- `ui-store` 会把旧版持久化的 `claude` 值回退为 `tiesen`，避免升级后出现无效主题。
- ScopeSwitcher 从侧栏移到 Topbar，保留 All scopes、Global、项目和 Add Project 的键盘/鼠标交互。
- CSS token 在 light/dark 下仍共享蓝色语义，避免单独的主题选择器造成视觉语言分裂。
