# L3：Agent 管理与配置位置 Playbook

## 修改规则

1. `All / Detected` 必须保持纯显示过滤；不得在过滤切换时调用 Agent enable/disable API。
2. Agent 启停只通过明确的单 Agent switch 或显式批量动作写入 `agent_settings.enabled`。
3. 未检测到的 Agent 必须在 `All` 模式下可选择，并显示准确的默认 Adapter 目录和未检测状态。
4. 默认目录只能来自 `AgentAdapter::base_dir()`。除非 detection、scanner、manager 和 deployer 全部接入同一 override，否则不得提供“自定义 Agent 根目录”编辑器。
5. 非默认配置文件或文件夹使用 `custom_config_paths`；文案必须称为“附加配置位置”，不能暗示它会改变 Agent Home。
6. Settings 页面保持删除状态；旧 `#/settings` 只做兼容重定向，不恢复新的配置入口。

## 定向验证

```bash
npx vitest run src/components/agents/__tests__/agent-list-controls.test.tsx
npx tsc --noEmit
npm run lint
npm run build
```

## 运行态验收

- 在 Agents 页面切换 `All / Detected`，确认未检测项仅隐藏/显示，Agent 的 enabled 状态不变化。
- 在 `All` 下选择未检测 Agent，确认详情页显示默认位置、未检测说明和“添加配置位置”。
- 点击行内 switch，确认该 Agent 在 Overview、Extensions filter 和安装目标中的可见性按 enabled 状态变化。
- 添加一个真实配置文件或目录，确认它出现在对应 Agent 的配置列表；不要把该动作写成 Agent 根目录替换。
