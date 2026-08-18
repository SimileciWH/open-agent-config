# L3：MCP Enable/Disable Playbook

## 调用链

```text
UI group toggle
→ API/IPC toggle_extension
→ manager::toggle_mcp
→ native writer OR read/redact/snapshot/remove
→ deployer restore/remove/config writer
→ rescan and Store reconciliation
```

## 两类语义

### Native toggle

目标 Agent 自己支持 per-server enabled/disabled 语义时，原地修改配置，保留 secret 和未知字段，不建立 DB snapshot。新增 Agent 必须有专用 writer 和 round-trip 测试。

Kimi 的 global 文件是 `$KIMI_CODE_HOME/mcp.json`（默认 `~/.kimi-code/mcp.json`），project 文件是 `.kimi-code/mcp.json`。HTTP 使用 `url`，SSE 使用 `transport: "sse"` + `url`；开关只修改 `enabled`。

### Snapshot toggle

目标 Agent 没有 native enabled 字段时，先读取完整 server entry，脱敏 secret 后保存到 SQLite，删除原 entry；恢复时写回，并对 redacted 值明确告警。

## Kimi 前置检查

- 确认 Kimi 使用的 MCP 顶层结构、transport 字段和 native `enabled` 语义。
- 确认 `enabledTools`、`disabledTools`、timeout、cwd 和 token 相关字段是否必须保留。
- Kimi 高级字段进入 `McpServerEntry::extra`；部署回 Kimi 时保留，发往其他 Agent 时由 `deployer::deploy_mcp_server` 返回明确的不可转换错误。
- 不能直接复用 Claude/Codex writer，除非 schema 逐项核验一致。
