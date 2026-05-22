# DDT 重设计：从「流程引擎」收敛为 superpowers-faithful 心智模型

- 日期：2026-05-22
- 状态：设计稿（待 writing-plans）
- 范围：DDT 插件全局架构重设计（charter / skills / hooks / docs 结构 / bins / commands / tests）

---

## 1. 背景与动机

DDT 自 v1.0 起累积了一套自造的「流程引擎」：带 7 条 Iron Law 的 charter 宪法、5 站固定链、意图分类强制路由、PreToolUse/Stop 硬拦 hook、切片 spec 机制（ddt-impl-spec）。多轮 dogfood 暴露出它在「增加概念、制造流程官僚」上的代价。

对照基底 superpowers 的真实机制（已读源码确认）：

- **1 个 hook**：仅 `SessionStart`，作用是把 `using-superpowers` 全文注入上下文。
- **0 个强制闸**：无 PreToolUse / Stop / PostToolUse / SessionEnd 强制。零硬拦。
- **无 charter、无宪法、无「法律」、commands 目录为空。**
- 纪律住在：① 注入的元规则（"1% 可能某 skill 适用就必须 invoke"）；② 每个 skill 自带强硬语气；③ skill 结尾主动 invoke 下一个 skill 完成链式接力。

**关键洞察**：DDT 的 7 条 Iron Law 大半是 vendored skill 已承载行为的「重新立法」——

| DDT Iron Law | 已被这个 vendored skill 承载 |
|---|---|
| IL-1 无证据不声明完成 | `verification`（evidence over claims） |
| IL-2 无根因不修 | `systematic-debugging` |
| IL-3 无 spec 不 plan/impl | `brainstorming`（HARD-GATE）→ `writing-plans` |
| IL-5 reviewer 无引证不 PASS | `requesting-review` + `receiving-review` |
| IL-6 漂移不出包 | `verification` + `finishing-a-development-branch` |
| IL-7 进度不自报 | DDT 工具 `/ddt-status`（非"法律"） |
| IL-4 不私改上层 SSoT | DDT docs 路径约定（非 hook） |

7 条里 5 条是复述。把它们再立成「绝对法典」正是「第二套项目管理系统」。

**北极星**：

> DDT 不垄断入口。DDT 不替代 superpowers。
> DDT 只让大需求更容易进入 superpowers，让 design spec 进入 planning 前有最小留痕，让真正需要交付的工作有验收和交付证据。

---

## 2. 心智模型（DDT 的全部）

> superpowers 的 `brainstorming → writing-plans → implementation → review` 是微观主链路。
> DDT 不垄断入口、不替代它、不发明第二套项目管理。DDT 只在它边上做四件轻活：
> **大需求先变小 · 小问题用 superpowers 做深 · 设计进计划前过闸 · 需要交付时再收口。**

DDT 的净增量被诚实收敛为三样它真正独有的东西：

1. 四个/三个增强 skill（其中两件本质是用现有链路）。
2. `docs/` + `.ddt/` 协作约定（toB / 多人）。
3. 被动 ROI 度量 + 唯一一颗 IL-5 牙。

---

## 3. 设计原则（借鉴 superpowers，而非发明）

- **纪律靠注入元规则 + 把 skill 写硬，而非靠 hook。** hook 只能拦「可机械验证」的东西；软件纪律 99% 是语义判断，硬拦必然既误杀又被绕，反造「被流程管着」的幻觉。
- **减法即价值。** 删掉宪法 + 法典 + 强制 hook 后纪律强度不下降——纪律本就由 vendored skill 承载。
- **路径即最强指令。** 目录命名（`docs/api/`、`.ddt/`）比 charter 文字更能稳定塑造 LLM 行为。
- **按需启用。** 除主链路常用的 `specs/`/`plans/`/`reviews/` 外，其余目录与收口能力都是「需要时才用」，不是每个任务的义务。

---

## 4. 三种入口（文档解释，绝不硬编码为强制路由）

| 入口 | 链路 | 落产物 |
|------|------|--------|
| ① 开发者局部想法 | 直接 superpowers 原生链路 | 代码（bug / 重构 / 测试补强 / 性能 / 探索 / 本地想法都走这条） |
| ② 大需求 | 先跑一条 superpowers 链路把它当**文档资产**实现 → 再逐个处理 | `docs/requirements/` + `docs/briefs/` |
| ③ brief 驱动局部交付 | brief → brainstorming → **Design Checkpoint** → writing-plans → implementation → review | 代码 / 契约 / 设计资产 |

**右尺寸原则**：不是所有工作都必须有 requirements/briefs，也不是所有工作都必须 verification/delivery。

---

## 5. 四项增强详解

### 5.1 大需求变小

当需求模糊、跨模块、规模大、需要多人/多切片协作时，先用一条 superpowers 链路产出 `docs/requirements/` + `docs/briefs/`。这条链路本质是**「文档资产实现」**：

- `brainstorming` 理解大需求和切片思路；
- `writing-plans` 计划如何产出 requirements/briefs；
- implementation 实际写出 requirements/briefs；
- review 审查 requirements 是否准确、briefs 是否 bite-size。

**不新增任何 skill**——纯用现有 vendored 链路。这依赖下面的 implementation 重定义。

### 5.2 implementation 重定义

implementation 的对象**不一定是代码**，也可以是文档、契约、设计资产、测试资产。因此「用 superpowers 链路产出 requirements/briefs」是合法的 implementation。

### 5.3 小问题做深

每个 brief，或开发者自己的局部想法，都可直接进入 superpowers 原生链路 `brainstorming → writing-plans → implementation → review`。

### 5.4 设计进计划前过闸（Design Checkpoint）

见 §6。

### 5.5 需要交付时再收口

`verification/` 与 `delivery/` 只在需要时启用，例如：多个局部实现完成、toB 验收、部署、数据迁移、API/data/design 变更、客户或业务方需要交付说明、需要回滚说明或交付证据。小修小改不强制。

---

## 6. ddt-design-checkpoint 与 Design Checkpoint

`ddt-design-checkpoint`（原 `ddt-design` 重命名 + 重定义）：

- **不是**设计方案生成器（那是 brainstorming），**不是** brainstorming 替代品，**不是**契约站。
- **是** brainstorming 之后、writing-plans 之前的**设计整理 / 过闸 / 按需落地**能力。
- 它帮助完成 Design Checkpoint，也可按需把重要设计落到 `docs/api/`、`docs/data/`、`docs/design/`。
- **如果当前流程已完成 Design Checkpoint，不必为了调用它而调用它。**

**Design Checkpoint = 一张 7 问检查习惯**（不是新流程系统、无固定模板、无固定文件名）：

1. 是否允许进入 writing-plans？
2. 是否影响 `docs/api/`？
3. 是否影响 `docs/data/`？
4. 是否影响 `docs/design/`？
5. 是否需要写入 `.ddt/decisions.jsonl`？
6. 是否需要写入 `.ddt/changelog.jsonl`？
7. 是否存在未解决冲突或开放问题？

**最小留痕（就近原则，无固定文件）**：

- 简单工作：几行写进 design spec（`docs/specs/*-design.md`）末尾，或写进 commit message。
- 复杂工作：更完整地检查 API/数据/流程/权限/安全/测试/风险；重要结论落 `docs/design/`，契约落 `docs/api/`，数据落 `docs/data/`，决策入 `.ddt/decisions.jsonl`。

---

## 7. 物理结构

```
docs/
  requirements/   # 大需求受理        ┐
  briefs/         # bite-size 切片输入  │ 按需
  specs/          # brainstorming 输出的 design spec（主链路常用）
  plans/          # writing-plans 输出（主链路常用）
  api/            # API 契约          ┐
  data/           # 数据设计           │ 按需
  design/         # 架构/流程/算法/难点/Design Checkpoint 结论 ┘
  reviews/        # reviewer 证据（IL-5 校验对象）
  verification/   # 验收收口          ┐ 按需
  delivery/       # 交付包             ┘
.ddt/
  decisions.jsonl # 入 git，append-only
  changelog.jsonl # 入 git，append-only
  state/          # transient，不入 git
  metrics/        # transient，不入 git
```

相对当前 `docs/ssot/` 结构的硬反转：

- `decisions.jsonl` / `changelog.jsonl`：`docs/ssot/` → **`.ddt/`**（仍入 git）。
- `docs/ssot/openapi/` → **`docs/api/`**；`docs/architecture/` → **`docs/design/`**；`ssot/` 嵌套层取消。
- 新增 `docs/{requirements, briefs, data, verification, delivery}/`。

**`.gitignore`（外科式，顺带解决 v0.x 残留污染）**：

```
/.ddt/*
!/.ddt/decisions.jsonl
!/.ddt/changelog.jsonl
```

`.ddt/` 下除两个白名单文件外全部 ignore（state / metrics / v0.x 的 progress.json 都被 `/.ddt/*` 兜住）。比整目录 ignore 更优：精确白名单 SSoT 文件，其余继续不入 git。

**`.gitattributes`** union merge 路径相应改为 `.ddt/decisions.jsonl`、`.ddt/changelog.jsonl`、`.ddt/metrics/*.jsonl`。

---

## 8. 强制层（L2：4 hooks）

| hook | 现状 | 新形态 |
|------|------|--------|
| `ddt:charter-inject` → `ddt:using-ddt-inject` (SessionStart) | 注入重型宪法 | **保留**，注入 `using-ddt`（薄取向 skill 全文） |
| `ddt:enforce-pre` (PreToolUse) | 硬拦 IL-3/IL-4/IL-5 | **收窄为只 IL-5**（reviewer 写 `docs/reviews/*.json` 时 PASS 无 `cited_evidence` → block） |
| `ddt:enforce-stop` (Stop) | IL-1/IL-6 | **删除**（每回合 turn-end 摩擦，违背极少硬闸；IL-1/IL-6 回归 vendored skill） |
| `ddt:metrics-post` (PostToolUse) | 被动埋点 | **保留**（ROI 观测，非强制） |
| `ddt:metrics-end` (SessionEnd) | 被动埋点 | **保留** |

唯一一颗结构性的牙是 IL-5——因为它有可机械验证的产物（`docs/reviews/*.json` 的 `cited_evidence`）。其余 Iron Law 全部回归 vendored skill 的行为承载，不在注入内容里另立法典。

---

## 9. Skill 集合（13）

**9 vendored superpowers（微观主链路，原样保留）**：
`ddt-brainstorming` · `ddt-writing-plans` · `ddt-executing-plans` · `ddt-subagent-driven` · `ddt-tdd` · `ddt-systematic-debugging` · `ddt-verification` · `ddt-requesting-review` · `ddt-receiving-review`。

**4 DDT 原创**：

- `using-ddt`（原 `ddt-charter` 重命名 + 重写）：对标 `using-superpowers` 的注入式薄取向 skill。内容只剩——四句北极星 + 三种入口（解释非硬编码）+ 四增强各指向哪个 skill/链路 + 瘦身 docs/.ddt 路径地图 + Design Checkpoint 七问习惯 + 按需协作（`slice/*` branch）/收口指针。原则用 superpowers 口吻点名并**指向承载它的 skill**，不另立法。删 Rationalization 反驳表、hook 判定/降级声明。
- `ddt-design-checkpoint`（原 `ddt-design` 重命名 + 重定义）：见 §6。
- `ddt-deliver`（按需收口）：覆盖 `docs/verification/` + `docs/delivery/`，去掉「IL-6 硬门」口吻，改「需要交付时再收口」。
- `ddt-design-source`（前端切片可选增强）：剥离 5 站/契约站框架，改「感知设计外包给 v0/figma/claude-design 再吸收，按需」。

**删除**：

- `ddt-impl-spec`（切片 spec 机制，与「不是所有工作都要 spec」冲突）。
- `ddt-frontend-craft`（DDT 自己产前端代码 = 流程引擎做实现；前端需求走原生链路即可）。

---

## 10. Command

- `/ddt` → **可选向导**：解释三种入口、根据自由文本给「建议下一步」（如「这像大需求，建议先 brainstorming 产 requirements/briefs」「这是 bug，直接 systematic-debugging」），**给建议不拦截**，开发者可无视直接用原生 skill。
- `/ddt-status` → **保留**：只读，从 git trailer + `.ddt/decisions.jsonl` + spec/plan 文件 + `slice/*` branch 反推进度与「在做谁」。`slice/*` branch 协作约定是 git-native、非流程引擎，保留。

---

## 11. bins / doctor / tests 连带改动

- `ddt-decisions-append` / `ddt-changelog-append` → 写 `.ddt/*.jsonl`。
- `ddt-status` → 读 `.ddt/decisions.jsonl`；保留 slice branch 解析。
- `ddt-enforce` → 删 IL-3 / IL-4 逻辑，留 IL-5；解绑 Stop。
- `ddt-hook-preflight` → REQUIRED 从 5 降为 4（`ddt:using-ddt-inject`, `ddt:enforce-pre`, `ddt:metrics-post`, `ddt:metrics-end`）。
- `ddt-doctor` → [B] 段路径地图改写为新结构；新增校验外科 `.gitignore` + 新 `.gitattributes` 路径。
- `ddt-contract-lint` → 改 `docs/api/`，定位为**按需 helper**（非硬门）。
- `resolve-tech-stack` / `ddt-report` → 保留（后者归 `ddt-deliver` 按需）。
- SessionStart handler（`ddt-charter-inject.mjs`）→ 改读 `skills/using-ddt/SKILL.md`（或重命名 handler）。
- **tests** → 现 159 测试中凡引 `docs/ssot/`、IL-3/IL-4 hook 行为、`ddt-impl-spec` 的，全量同步重写。

---

## 12. 删除清单

- skills：`ddt-impl-spec/`、`ddt-frontend-craft/`。
- charter 注入内容：Iron Laws 法典段、Rationalization 反驳表、hook 判定/降级声明、5 站固定链、意图分类强制路由、SSoT 铁律链（PRD 字样残留）。
- hooks：`ddt:enforce-stop`（Stop）。
- enforce 逻辑：IL-3、IL-4 分支。

---

## 13. Non-Goals（明确不引入 / 不强化）

frontmatter · spec_kind · implementation_slice_spec · `*-slice.md` · ddt-router · ddt-design-materialize · ddt-design-integrate · 强制 baseline · 强制 Arc 编号 · 每个任务都必须 requirements/briefs · 每个任务都必须 verification/delivery · 固定 Design Checkpoint 模板 · 固定 Design Checkpoint 文件名。

---

## 14. 迁移范围概览（细化留给 writing-plans）

大致分组（顺序由 writing-plans 决定）：

1. 物理层：docs 结构 + `.ddt/` 迁移 + 外科 `.gitignore` + `.gitattributes` 路径。
2. 注入层：`ddt-charter` → `using-ddt` 重写 + SessionStart handler 改读。
3. 强制层：`ddt-enforce` 删 IL-3/4 留 IL-5、解绑 Stop；`ddt-hook-preflight` REQUIRED=4。
4. Skill 层：删 2、重命名/重定义 `ddt-design-checkpoint`、重构 `ddt-deliver`/`ddt-design-source`。
5. bins/doctor：路径全迁 + doctor [B] 重写 + contract-lint 改 `docs/api/`。
6. Command 层：`/ddt` 向导化、`/ddt-status` 读 `.ddt/`。
7. 测试层：全量同步重写，全绿。

---

## 15. 验收标准（本重设计实现完成判据）

- [ ] `skills/using-ddt/` 存在；`skills/ddt-charter/` 移除；SessionStart handler 读 `using-ddt`。
- [ ] 注入内容不含 Iron Law 法典 / 反驳表 / 5 站 / 意图强制路由 / PRD 字样；原则以指向 vendored skill 形式存在。
- [ ] hooks = 4；`enforce-pre` 只剩 IL-5；`enforce-stop` 解绑；`ddt-hook-preflight` REQUIRED=4 且通过。
- [ ] docs 结构与 `.ddt/` 迁移完成；`.gitignore` 外科式；`.gitattributes` 路径更新。
- [ ] `ddt-design` → `ddt-design-checkpoint`；`ddt-deliver`/`ddt-design-source` 重构为按需；`ddt-impl-spec`/`ddt-frontend-craft` 删除。
- [ ] 全部 bin 路径迁至 `.ddt/` + `docs/api,data,design`；`ddt-doctor` [B] 重写并全绿；`ddt-contract-lint` 指向 `docs/api/`。
- [ ] `/ddt` 为向导（不拦截）；`/ddt-status` 读 `.ddt/decisions.jsonl`。
- [ ] 测试全量同步，全绿；`ddt-doctor` 全绿。
- [ ] 无任何 Non-Goals 清单中的概念被引入或强化。
