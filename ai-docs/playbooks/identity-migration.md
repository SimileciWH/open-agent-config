# L3：OAC 身份迁移 Playbook

## 修改前

1. 列出产品名、CLI/crate、数据目录、Kit 后缀、Agent managed marker、浏览器存储、桌面标识和 release 资产。
2. 将每个旧标识分类为新写入、迁移输入、不可变历史或必须另行批准的兼容身份。
3. 任何持久化路径变更都先设计集中式、幂等、可冲突退出的迁移，再改调用方。

## 实施

1. 所有新写入切到 OAC 名称。
2. CLI、Web、Tauri 统一调用 `app_paths::open_store()`。
3. 旧目录、Kit、Kiro、Codex、DSH 和 localStorage 只在迁移读取路径出现。
4. 双份持久化状态、符号链接或未知路径必须显式失败，不猜测合并。
5. 桌面 bundle ID 固定为 `com.openagentconfig.app`；变更后验证与旧安装并存、签名和用户数据位置。

## 验证

```bash
cargo test -p oac-core app_paths
cargo test -p oac-core legacy
npm test -- src/lib/__tests__/storage.test.ts
cargo metadata --no-deps --format-version 1
npm run check:oac-identity
```

身份门禁只允许显式登记的一次性迁移输入和上游隔离签名；其他旧身份结果必须清零。
删除已跟踪的品牌资源后，应在未提交状态直接运行该门禁，确认它会跳过已删除文件并继续检查其余工作树内容。
