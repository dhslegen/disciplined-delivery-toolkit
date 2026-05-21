---
description: DDT v1.0 万能驱动闸门。无文本：重算 repo 状态推进到下一闸门。有文本：分类意图后路由到对应纪律 skill。
---

# /ddt — DDT 万能驱动闸门

你的任务是处理用户的 `/ddt [自由文本]` 调用，按下面流程执行：

## 0. 元命令短路识别（先做，不进意图分类）

如果用户的自由文本是以下"元命令"之一（包括同义词、中英文混用），**直接路由到对应 bin，不进 charter 意图分类**：

| 用户文本含 | 路由到 |
|------------|--------|
| `自检` / `doctor` / `preflight` / `check` / `health` / `体检` / `selfcheck` | `bin/ddt-doctor.mjs`（参 ddt-status.md 路径策略，优先 PATH，fallback `node "${CLAUDE_PLUGIN_ROOT}/bin/ddt-doctor.mjs"`） |
| `状态` / `status` / `where am I` / `在哪` | 提示用户改敲 `/ddt-status` 命令（独立命令更准确） |
| `report` / `效能` / `ROI` / `度量` | `bin/ddt-report.mjs` |

**关键约束**：元命令路由后，**完全照搬 bin 的 stdout 给用户**，不要自由发挥、不要自己扫文件、不要自己判定 hook 注册状态。如果 bin 找不到，明确告诉用户："plugin bin 不可用，请检查安装 / `/plugin marketplace update`"——**禁止降级到 LLM 自己模拟事实**，这会破坏 IL-7。

## 1. 读 ddt-charter

先 invoke 名为 `ddt-charter` 的 skill 读宪法（如未注入 SessionStart 路径）。宪法定义 Iron Laws / 5 站脊柱 / 意图分类规则 / SSoT 铁律链。

## 2. 处理两种调用形态

### A. 无自由文本（纯 `/ddt`）

调 `bin/ddt-status.mjs` 重算 repo 事实（pending decisions、存在的 spec/plan 文件）→ 按 5 站脊柱判定**下一个该打断真人的闸门**：
- 有 pending decisions：报告人需异步裁决哪条
- 切片有 spec 但无 plan：可能推进到 plan 步
- 全绿低风险段：自动放行并记审计痕（不打断人）
- 其他：根据脊柱拓扑判定下一阶段

输出"在哪 / 下一步 / 谁该决策什么"摘要给用户。

### B. 带自由文本（`/ddt <文本>`）

按宪法"意图分类规则"将文本归类为：
- `genesis`（无 .ddt/ 时自动判定为起项目）
- `amend`（改/删需求）
- `new-feature`（新增需求）
- `bug`（bug 修复）
- `refactor`（重构）
- `rerun-slice`（局部重跑某切片）

**为各意图配 ddt_intent 字段**（强制层 hook 读这个字段判 IL）：
- `genesis` / `new-feature` / `amend` → `ddt_intent` 暂不设（属需求站，不在 build 上下文）
- `bug` → 装载 `ddt-systematic-debugging` skill 并设 `ddt_intent='debug'`
- `refactor` → `ddt_intent='refactor'`，进 `ddt-impl-spec` 走重构子句
- `rerun-slice` → `ddt_intent='enter-spec'` 或 `'enter-plan'`/`'enter-impl'`（视用户文本中是否提到具体阶段）+ 设 `ddt_slice=<切片 id>`

## 3. 写 `.ddt/state/current.json`（命令→hook 字段桥）

每次 `/ddt` 路由完意图后，**必须写一次** `.ddt/state/current.json`：

```json
{ "ddt_intent": "<分类结果>", "ddt_slice": "<可选，切片 id>", "set_by": "/ddt", "at": "<ISO8601>" }
```

此文件供 hook 在 stdin 缺字段时 fallback 读取（Plan 4 Task 1）。这是 transient 工作态文件，**不是 SSoT 真相**，下次 `/ddt` 覆盖。

## 4. 装载对应纪律 skill 并开始工作

按意图分类装载 skill 并按其纪律开展工作循环。所有重大决策点（spec/plan/契约/出包等）由对应 skill 内置的人工闸门驱动。

## 5. 风险地板与右尺寸化

按宪法比例原则：分类器只能升档不能降档；触及 `认证/授权/资金/数据迁移/契约/用户数据删除/部署配置` 任一恒最高硬度；验证/交付永不自动放行。

## 失败模式

- preflight 检查失败（hook 未注册）→ 拒绝启动并提示运行 `bin/ddt-hook-preflight.mjs` 修复
- 意图分类不确定时主动问用户而非猜测
- 任何 hook 阻断须以 IL 引用回报用户
