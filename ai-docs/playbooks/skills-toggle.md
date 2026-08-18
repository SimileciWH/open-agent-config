# L3：Skills Enable/Disable Playbook

## 调用链

```text
UI group toggle
→ src/stores/extension-store.ts::toggle
→ src/lib/invoke.ts::api.toggleExtension
→ Tauri command or POST /api/toggle_extension
→ manager::toggle_extension_with_adapters
→ manager::toggle_skill
→ scanner::skill_locations
→ SKILL.md ↔ SKILL.md.disabled（目录型）或 .md ↔ .md.disabled（flat 型）
→ Store::set_enabled
```

## 检查项

- 先确认 Extension scope，不能把 global 和 project 的同名 Skill 混合切换。
- 通过 Adapter 定位物理 Skill 路径，只有无结果时才使用 stored `source_path` fallback。
- 禁用和恢复必须保持目录内容不变，只改变文件名。
- Kimi flat Skill 的逻辑 source_path 保持 enabled 文件名，实际禁用文件使用同级 `.md.disabled`，这样 scanner 和 toggle 能互相找到。
- 完成后重新扫描，确认 disabled Skill 仍被发现且 enabled=false。
- 更新 `modules/scanner.md`、`modules/manager-deployer.md`、`modules/store-models.md` 和本剧本涉及的 L4 QA。
