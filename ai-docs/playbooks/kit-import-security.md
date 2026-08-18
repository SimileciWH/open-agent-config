# L3：Kit 导入与路径安全 Playbook

## 修改合同

1. 找出所有由 ZIP entry、manifest 名称、数据库路径或用户输入影响的目标路径。
2. 归档 entry 先校验归一化路径；manifest 单组件字段再做名称校验。
3. 在预览、同步、反同步、导入和删除的最终 I/O 点重新验证，不能只依赖早期校验。
4. 用项目根目录约束最终目标；拒绝绝对路径、父目录、Windows prefix、NUL、符号链接逃逸和数据库越界路径。

## 验证

```bash
cargo test -p oac-core kits::tests
cargo test -p oac-core malicious
cargo test -p oac-core outside
```

至少覆盖安全名称、`../`、Unix/Windows 绝对路径、符号链接目标、恶意 import 和越界 unsync。另行跟踪 ZIP 数量、解压总量和压缩比限制。
