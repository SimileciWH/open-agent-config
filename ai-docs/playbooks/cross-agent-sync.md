# L3：跨 Agent 同步 Playbook

## V1 已有能力

前端按逻辑扩展分组，把同一 Skill/MCP 的多个已安装实例逐个调用 `api.toggleExtension`。这已经覆盖“在 UI 中对多个 Agent 同步开关”的基础需求。

## V1 边界

- 同步对象是已存在的物理实例，不负责凭空创建缺失实例。
- 不同 Agent 的 MCP schema 不保证可逆转换；Kimi 的基本 command/args/env/url/headers 可转换，Kimi 专属字段只在目标仍为 Kimi 时保留。
- Kimi 专属 unknown fields、secret、transport 和 Agent 专属字段不能静默丢弃；无法转换时 deployer 必须返回明确失败原因。
- 目标 Agent 不支持某 transport 时必须显示失败或跳过原因。
- 外部直接修改配置后的 drift detection、adopt policy 和冲突解决属于后续阶段。

## 验收顺序

1. 对同名 Skill 生成正确 groupKey 和实例集合。
2. 批量 toggle 的成功、失败和 partial failure 状态可见。
3. 每个目标 Agent 的 on-disk 配置被正确更新。
4. rescan 后 DB 与文件系统状态一致。
5. Kimi 原生 `enabled` 开关保留高级字段；跨到不兼容 Agent 时出现明确错误而非丢字段。
