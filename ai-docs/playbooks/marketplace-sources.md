# L3：Marketplace 来源 Playbook

## 变更前检查

1. 明确来源所有者、URL、数据格式、缓存策略、错误语义和执行权限。
2. CLI 的展示 registry 与实际执行 allowlist 必须来自同一可信集合。
3. 不得以旧项目资源仓库作为 OAC 的隐式在线依赖。

## 验证

```bash
cargo test -p oac-core marketplace
npm test -- src/pages
rg -n -S 'raw.githubusercontent.com' crates/oac-core/src/marketplace.rs src/pages/overview.tsx
```

对每个网络来源确认用途；本地提示和内嵌 CLI registry 不应产生额外网络请求。
