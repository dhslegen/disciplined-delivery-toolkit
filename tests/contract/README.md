# tests/contract/ — 协议契约测试层

## 与 tests/unit/ 的边界

| 测试层 | 测什么 | 例子 |
|--------|-------|------|
| **tests/unit/** | "我们写的代码内部逻辑对" | `decide(ev)` 函数返回 `{decision: 'block'}` 时输入是对的 |
| **tests/contract/** | "我们的输出符合外部协议" | hook stdout 严格符合 [Claude Code hook schema](https://code.claude.com/docs/en/hooks) |
| **tests/integration/** | "几个组件协同 OK" | charter 文本含 IL-3/4/5 反驳条目 |

## 为什么必须分开

v1.0 之前测试只测字段：
```js
assert.equal(out.decision, 'block');  // 我们自己定义的字段
```

测试 104/104 全过 → dogfood 第一刻 hook 协议错误整个输出被丢弃。原因：`{decision: 'allow'}` 是协议非法值，但单元测试不知道这个外部约束。

契约测试守门员是**外部协议**（Claude Code hook schema、Plugin spec、Skill frontmatter spec 等），从此 protocol 变化或我们写错都会立刻报错。

## 当前覆盖

| 文件 | 覆盖对象 | 协议来源 |
|------|---------|---------|
| `hook-enforce-contract.test.mjs` | `hooks/handlers/ddt-enforce.mjs` 的 PreToolUse + Stop 输出 | Claude Code hook schema |
| `hook-charter-inject-contract.test.mjs` | `hooks/handlers/ddt-charter-inject.mjs` 的 SessionStart 输出 | Claude Code hook schema |
| `hook-metrics-contract.test.mjs` | `hooks/handlers/ddt-metrics.mjs` 的 PostToolUse + SessionEnd 行为（静默 exit 0） | Claude Code hook schema |
| `bin-stdout-contract.test.mjs` | 7 个 bin CLI 工具的 stdout/stderr/exit code | DDT 内部约定 |
| `skill-frontmatter-contract.test.mjs` | 15 个 SKILL.md 的 YAML frontmatter | Claude Code Skill spec |
| `command-prompt-contract.test.mjs` | 2 个 command md 的结构 | Claude Code Command spec |

## 添加新契约测试

Skill / command 新增 → 加进对应契约测试的循环列表。任何对外接口（hook 输出、bin stdout、skill frontmatter）变更**必须**先更新契约测试。
