# DDT v1.0 重设计 — 设计规格（Spec v5·定稿候选）

> 日期：2026-05-18（v5：洞1 wrapper 坍缩 / 洞2 契约站补纪律 / 洞3 WBS 降级为工作量基线 / 洞4 强制层单点披露+缓解 / 洞5 真实栈降级路径 / 易用校准）
> 状态：待用户最终评审 → 通过即转 writing-plans（作者建议：通过后停止 spec 迭代，再迭代为负收益）
> 范围：DDT 推倒重来到 v1.0 的目标架构。进实施计划的唯一前置，"是什么/为什么"，不含逐步代码。
> 六诉求验收锚：大型项目 · 流程标准化 · 风格一致化 · 链路清晰化 · 纪律 superpowers 化 · 团队合作无压化

---

## 0. 定位

> **身份**：插件 id `ddt`，"DDT" 从 *digital-delivery-team*（v0.x）重定义为 **Disciplined Delivery Toolkit**（v1.0）——纪律优先，非 agent 团队。命令品牌 `/ddt`、`/ddt-status` 不变。v1.0 在独立目录 `ddt/` 干净开发；v0.x 仍在 `digital-delivery-team/`，冻结、不动、零扰动。

> **DDT v1.0 = superpowers 纪律基底 ⊕ toB 交付治理。**
> **DDT 五站脊柱本身 = superpowers 验证过的 brainstorm→plan→implement 弧线，外包一层 toB 治理（固定链 + SSoT 问责 + 审计 + 效能 ROI）**。DDT 自创最少，基底保真最高。
>
> 适用：团队 + 政企交付 + 要审计/问责/ROI + 需求会变。**不适用**：单人开放式造代码（superpowers 更优，不抢）。
>
> 真实前提：项目**不可能**提前备好合格 PRD。流水线前门即"模糊多源输入 → 专业 PRD"的纪律（vendored brainstorming），非"假设已有干净 PRD"的 intake。

## 1. 锁定决策

| # | 决策 | 锁定值 |
|---|------|--------|
| 1 | 改造激进度 | 推倒重来到 v1.0，旧实现仅作迁移参考 |
| 2 | 原语模型 | Skill 第一等公民；command 退化为薄闸门；废固定 9 agent，改用 subagent 三角 |
| 3 | 真相源 | 仅三件纯文本：`PRD` + `decisions.jsonl` + `changelog.jsonl`；git 历史即进度账本；边界处重算，不存可重算的派生真相 |
| 4 | 验证硬度 | Iron Law 全程硬；SessionStart 注入《DDT 宪法》；hook 校验文件事实强制纪律 |
| 5 | 流程形态 | **5 站固定链**（需求→契约→实现→验证→交付）；需求站≡本土化 vendored brainstorming；+ tech-stack 确定性剪枝 |
| 6 | 协作模型 | Repo 为中心；闸门=`decisions.jsonl` 持久待决记录；可换人异步解；无共享服务器 |
| 7 | 自包含 | 零外部插件依赖。所需 superpowers 纪律 skill **原文照搬**进 `skills/` 平铺同级（Claude 可发现；不做 license/provenance 仪式，按需本土化为独立可 diff 改动） |

## 2. 五层架构

```
① 宪法层  SessionStart hook 无条件注入《DDT 宪法》：Iron Laws + Skill 优先级 + 5 站链图 + 意图分类规则 + SSoT 铁律链
② 脊柱层  PRD + decisions.jsonl + changelog.jsonl（真相仅此三件）；5 站链是宪法内不变量，不落配置文件
③ 能力层  skills/（每站一 skill + 纪律 skill 平铺同级，know-how 全在此）+ commands/（2 个薄闸门）
④ 强制层  PreToolUse/PostToolUse/Stop hooks，判**文件事实**（git trailer / decisions.jsonl / diff 路径），不信会话自述（判据见 §8）
⑤ 度量层  hook 被动采集（agent 禁自夸）→ AI 效能 ROI 报告
```

意图分类规则**驻于宪法**（§2①），非独立 skill。层间只经文件契约通信，任一层可独立替换、独立单测。

## 3. 治理脊柱（极简，第一性原理）

**为什么不是依赖图**：传统流水线执行器是无理解力机器，须靠 hash 图判过期；DDT 执行器是 LLM，天生能读 PRD+代码直接判一致。content_hash/脏位/状态机是在 LLM 上重造 build system，删。**执行器换 LLM ⇒ 状态追踪坍缩成"边界处重判"。**

- **真相三件**：PRD（需求+Given/When/Then）；`decisions.jsonl`（决策+异步闸门 pending/resolved，append-only）；`changelog.jsonl`（变更意图+LLM 一句"影响到 X"，append-only）。git commit 带 trailer `stage/slice/task/evidence-ref`。
- **SSoT 铁律链**：`PRD > 契约 > 代码`。下层发现上层错**绝不私改**，只能 escalate 弹回上游走变更门（强制层 hook 守护）。
- **变更两条对称路径**（即此机制本身，无独立 skill）：① 改/删需求 → 改 PRD + changelog 追一行 → 下一闸门 Spec Reviewer 只核对受影响切片 → 三选项：重生/手改/记录漂移并署理由；② 新增需求 → PRD 追一节 + changelog → 范围决策门：纳入本批/排下批(deferred)/拒绝(rejected+理由)。新需求只从需求站注入，provenance 从源头可溯。
- **反技术债兜底**：进交付站前的证据门汇总扫描未调和漂移与"纳入本批却未实现"的 story，硬拒出包。

**第四类——transient 工作态文件（非 SSoT，每次覆盖）**：v1.0 实施中诚实承认两个 transient 工作态文件，**不入 SSoT 三件真相**，每次相关命令覆盖：

- `.ddt/state/current.json`（Plan 4 引入）：`/ddt` 命令写入当前意图（`ddt_intent`/`ddt_slice`），供强制层 hook 在 stdin 缺字段时 fallback 读——命令→hook 字段桥。
- `.ddt/metrics/<date>.jsonl`（Plan 5 引入）：度量埋点 hook 被动追加；每日一文件。聚合源，非审计源（审计仍依 decisions.jsonl + git）。

二者**不入 git**（`.gitignore` 含 `/.ddt/`），属运行时工作态。审计/问责仍只看三件 SSoT + git 历史；transient 文件仅服务运行时机制，不参与可追溯链。

## 4. 五站固定链（= superpowers 弧线 + 治理外壳）

链是宪法内固定不变量，五站不可增删、不落配置文件。每站后一道人工闸门：

| 站 | 纪律来源 | 本质 | 产物 |
|----|---------|------|------|
| **需求** | 本土化 vendored `ddt-brainstorming`（深度随输入清晰度伸缩，洞校准） | 模糊多源输入 → 专业 PRD（HARD-GATE 自带"没批准不前进"） | project-brief + PRD（每条 user story 可寻址）+ **工作量基线**（历史工时种子的轻量估算，喂 ROI 对比，**非完整 WBS/PM 排程**，洞3） |
| **契约** | DDT 原生 `ddt-design` + **强制 Spec Reviewer 对 PRD 核对 + 契约 lint 硬门**（洞2） | PRD → 系统级 SSoT（最高杠杆节点，纪律不低于实现站） | 架构 + OpenAPI 契约 + 数据模型 |
| **实现** | vendored writing-plans + subagent-driven（见 §5） | 逐切片 spec→plan→implement | 切片代码 + 切片 spec/plan + checkpoint commit |
| **验证** | vendored tdd + verification | 真实栈+migrate+smoke+测试+双审，一道生产级证据硬门 | 测试/覆盖率/评审证据 |
| **交付** | DDT 原生 `ddt-deliver` | 收尾 | README/部署/演示 + AI 效能 ROI 报告 |

**契约站纪律（洞2）**：契约是 `PRD>契约>代码` 的 SSoT，契约错则所有切片忠实实现错的契约且 Spec Reviewer 对错契约还判过——最高杠杆节点不可是最薄站。故进契约闸门前**强制**：① 契约过 Spec Reviewer 对 PRD 逐条核对（同 §5 一致性核对者）；② 契约 lint 硬门（exit≠0 阻断）；③ 外部 API 文档作外部不变量，Spec Reviewer 加核"我方契约 vs 外部 API 一致"，不符 escalate。

**需求站冷启动纪律**（brainstorming 本土化配置，非新机制）——`/ddt <任意混杂输入>` 第一步"探索上下文"按 DDT 输入 taxonomy 分类，且 brainstorming 深度按输入清晰度伸缩（清晰→快路确认即过；模糊→全苏格拉底一次一问）：

```
需求源（功能清单 / 纪要里的需求）  → PRD 草案，每条须 cite 源 或 标 ASSUMPTION-待确认
约束源（外部 API 文档）            → 标【契约站外部不变量】随产物前传（落点见上）
基线源（历史工时记录）            → 标【工作量基线/ROI 基线源】随产物前传；无则 ROI 显式标"无历史基线不可比"
噪声 / 多源冲突                    → brainstorming 一次一问澄清时暴露给人裁决，不静默合并
```

> **无源不入 PRD**：brainstorming 的"不臆造 + HARD-GATE + explore-context"天然堵死"输入不全就幻觉补全"——toB 最致命失败的结构性堵口，收编为 brainstorming 本土化子句，不另造 IL。

**剪枝唯一依据 `.ddt/tech-stack.json`**（`resolve-tech-stack` 单点写、全程只读、agent 禁改）：`frontend.type=none`→实现无前端切片；`server-side`→前端切片 SSR；`backend.type=none`→无后端切片、验证无 db/migrate；`ai_design`→仅前端切片是否走外部设计回路的输入开关（§10）。剪枝后仍同一条五站链，被剪切片标 `pruned` 记理由。

**验证站真实栈降级路径（洞5）**：真实栈跑通是硬门条件；起栈失败时**绝不静默跳过**——decisions.jsonl 记一条署名 waiver（含基建原因，如断网/受限 docker），ROI/审计报告显式标本交付为**"降低保障级"**并列明哪些证据缺失。卡不死流水线，但绝不假装跑过。

> "真实栈跑通"是验证站硬门条件，非单独一站——把硬条件误升成站正是旧链路不清根源。

## 5. 实现站内部：spec → plan → implement

旧 6-phase 病根：探索/计划/实现/验证挤在一个 skill 一次会话，上下文越滚越脏，验证时模型已自证清白。v1.0 拆成三个独立会话边界 + 一次性可丢弃 subagent。每个范围内切片（后端/前端/aspect 同形）跑：

```
spec   ddt-impl-spec（DDT 原生：无干净 vendored 对应）：实现什么/为什么/接口契约/边界与错误/不做什么
       重构意图：本 skill 内"绿灯前置 + 行为保持"子句（无独立 refine skill）
       前端切片可选组合 ddt-design-source（外部设计源作 spec 输入之一，受 SSoT 链约束）
       HARD-GATE：spec 未批准 → 禁止进 plan
plan   本土化 vendored ddt-writing-plans（洞1：plan 步≡该 skill 本身，非壳调用）
       No-Placeholders：每 task=完整代码+明确路径+可执行命令
       禁 TBD/笼统错误处理/无测试码/"类似 Task N"/未定义符号；读者假定为零背景 junior
       HARD-GATE：plan 未批准 → 禁止进 implement
impl   本土化 vendored ddt-subagent-driven（洞1：impl 步≡该 skill 本身，非壳调用）
       main thread=Controller，逐 task：提取 task 全文（喂全文不喂 plan）
         → dispatch Implementer（全新上下文）
         → dispatch Spec Reviewer + Quality Reviewer（二者不互通，只经 Controller）
         → 任一不过：Controller 令 Implementer 修 → 再审
       Final 核验：全 task 完成后 Spec+Quality 在全部 commit 复跑（非第 4 角色，无第 4 template）
       Implementer 四态 DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED → 各有处置
```

**唯一命名集**：Implementer + Spec Reviewer + Quality Reviewer。**Spec Reviewer ≡ §3 一致性核对者 ≡ §4 契约站核对者**——同一角色四处复用（变更/契约/验证/代码落地）。一个系统只有一种判断对错的机制。
**反乐观铁律**：任何 reviewer `NO PASS WITHOUT CITED EVIDENCE`，禁"看起来没问题"，逐条引证。直击 B 级"温柔乐观"。
**模型分级控成本**：机械实施→便宜模型；集成判断→标准；spec/plan/评审→最强。
**降级**：subagent 不可用 → 退化为照搬的 `ddt-executing-plans`（Controller 自执+自检证据门），能力降级纪律不降级。

## 6. 大型项目 / 跨会话 / 跨人（团队合作无压化）

第一性原理在时间维度的平移：**不存可重算的进度真相，repo 即真相，边界处重算。**

- subagent 永不继承会话上下文（喂 task 全文）→ 会话边界对其透明 → 没有任何单会话需装下整个项目。Controller 只持当前切片 plan+当前 task，工作集与项目规模无关。
- **无状态恢复**：`/ddt` 不恢复记忆，从 git trailer + 存在的 spec/plan 文件 + decisions.jsonl + PRD 重算下一步。崩在任何处=重推，永不凭记忆，根治幻觉进度。
- **重算职责切分**：bin 只做确定性事实提取（解析 trailer/列 pending/列文件），返回原始事实无推断；判断是 LLM 在 skill 内做。bin 是事实镜头不是决策器。
- **零交接协作**：repo 即真相 → 任何人/任何 AI `cd` 进 repo 敲 `/ddt` 即无缝续上，无接力 prompt、无交接文档。异步闸门=`decisions.jsonl` 一条 `{status:pending,gate,owner_role,decision_criteria,ts}`，他人 `/ddt-status` 可见，按 criteria 异步裁决追 `{status:resolved,ref,user_action,note,ts}`；强制层：存在未 resolved pending → 阻断该门下游。
- **宏观把控在切片批次门**（非 task 级，防认知过载）：系统按关键路径列切片，人选本批推哪几个、其余 defer。人管批次，机器管 task 有序。

## 7. 命令面（2 个，终）

| 命令 | 行为 |
|------|------|
| `/ddt [自由文本]` | 无文本：重算 → 推进到下一个该打断真人的闸门（低风险全绿自动越过留痕）。有文本：LLM 依宪法分类意图（起项目/改需求/新需求/bug/重构/局部重跑）→ 装载对应纪律 skill → 跑同一 spec→plan→implement 循环，证据量按风险右尺寸化 |
| `/ddt-status` | 只读重算：在哪/下一步/谁该决策什么/挂着哪些 pending/效能快照。不推进不改 |

起项目由"无 `.ddt/`"自动检测。意图分类/风险评级/切片定位驻宪法，不写进命令分类法。
**闸门挣打断权**：自动放行有硬证据地板（切片自测绿+契约 lint 绿，evidence-ref 入 trailer），自动放行≠无证据，被豁免的是人工打断不是证据，IL-1 永不破。
**比例原则 + 结构地板**：Iron Law 绝对不松；证据量随爆炸半径成正比，但**分类器只能升档、永不降到地板下**——触及 `认证/授权/资金/数据迁移/契约/用户数据删除/部署配置` 任一恒最高硬度；**验证站永不自动放行**。把"评级失准"从祈祷变成有界。

## 8. 宪法与 Iron Laws + 强制层判据（纪律 superpowers 化的拱顶石）

SessionStart 注入《DDT 宪法》全文（机制源 superpowers：离开此 hook，skill 就是死在磁盘的 markdown）。

```
IL-1 无新鲜执行证据不得声明完成        IL-5 reviewer 无引证不得 PASS（反乐观）
IL-2 无根因调查不得修复                IL-6 漂移不可出包
IL-3 无批准 spec 不得实现/无 spec 不得 plan   IL-7 进度不自报（从 git+证据反推）
IL-4 下层不得私改上层 SSoT（越级只能 escalate）
```

每条配 Rationalization 反驳表（旧 DDT 反模式 D34/D35/D36 + 照搬 `ddt-tdd` 样板）：「先不做也能演示」→演示≠交付，纳入本批未实现即出包=交付欺诈；「契约写错顺手改」→IL-4 越级私改=漂移，escalate；「reviewer 觉得行」→IL-5 无引证只是乐观。

**纪律双重激活，缺一不可**：① 自治触发（宪法"1% 可能适用即 invoke skill"，行为塑造层）；② 结构强制——每条 IL 配 hook 判**文件事实**：

| IL | hook | 判据（机器可判，对象=三件 SSoT+git+diff） |
|----|------|------|
| IL-1 | Stop/PreToolUse | 声明完成时 git 须有匹配 evidence-ref 的 commit trailer 指向真实产物，无→阻断 |
| IL-3 | PreToolUse | 进 plan/impl 前 decisions.jsonl 须有该切片 spec-approved，无→阻断 |
| IL-4 | PreToolUse | build 上下文 diff 触及 `openapi/**` 或 PRD 且 changelog 无 escalation→判违规阻断 |
| IL-5 | PostToolUse | reviewer 输出无 cited-evidence 结构→PASS 无效退回 |
| IL-6 | Stop（交付前）| 扫描未 resolved drift/pending→硬拒 deliver |
| IL-7 | 全程 | 进度声明只采信 git trailer 反推值，与自述冲突以前者为准 |

hook 判文件事实（trailer 在不在、decisions 有没有、diff 碰没碰受保护路径），不解析 LLM 自述——"文本约定"升为"结构强制"的唯一可靠途径。

**强制层单点的诚实披露与缓解（洞4）**：全系统正确性押在 hook 注册并运行；hook 未注册 / 换 harness 不跑 → IL 全静默退化。superpowers 深调原话："不知道有没有在 SessionStart 加载，那就是没有。" 双重缓解：① 每个 skill 文本内**自陈纪律**——hook 缺失时纪律降级为"建议级"而非"零"（行为塑造层仍在）；② **preflight**：`/ddt` 启动先验 hook 已注册，未注册则拒绝启动并明示如何修复（不静默跑成演示级）。本风险写入 §13。本土化保留 superpowers 原文行为塑造措辞，配套对抗测试。

## 9. 目录布局

```
ddt/                                     # 独立 plugin（id=ddt），与 v0.x digital-delivery-team/ 同级互不干扰
├── .claude-plugin/{plugin.json,marketplace.json}   # 5 站链是宪法不变量，不落配置文件
├── commands/  ddt.md（万能驱动）  ddt-status.md（只读重算）
├── skills/                              # 全部平铺同级，Claude 可发现（决策#7：不嵌套）
│   ├── ddt-charter/                     # 宪法 + 意图分类规则（DDT 原生；intent-router 折入此）
│   ├── ddt-design/                      # 契约站（DDT 原生，含强制 Spec Reviewer+lint 硬门）
│   ├── ddt-impl-spec/                   # 实现站 spec 步（DDT 原生，含 refine 子句）
│   ├── ddt-design-source/               # 外部收敛回路技术 skill（非站，§10）
│   ├── ddt-frontend-craft/              # 外部回路未启用时直出生产前端（DDT 原生）
│   ├── ddt-deliver/                     # 交付站（DDT 原生）
│   ├── ddt-brainstorming/               # ← 需求站 ≡ 照搬 superpowers brainstorming 本土化（Tier-1）
│   ├── ddt-writing-plans/               # ← 实现站 plan 步本身（照搬，本土化；非壳，洞1）
│   ├── ddt-subagent-driven/             # ← 实现站 impl 步本身（照搬，本土化；非壳，洞1）
│   ├── ddt-executing-plans/             # ← subagent 不可用时降级（照搬）
│   ├── ddt-tdd/ ddt-systematic-debugging/ ddt-verification/   # 照搬，按需本土化
│   └── ddt-requesting-review/ ddt-receiving-review/           # bug 场景即触发 ddt-systematic-debugging
├── agents/  implementer-prompt.md  spec-reviewer-prompt.md  quality-reviewer-prompt.md
│            # 三角 prompt template（非常驻 agent）；Final 核验复用后二者，无第 4 个
├── hooks/   hooks.json（SessionStart 注宪法 + Pre/Post/Stop §8 判据 + preflight + 度量埋点） handlers/
├── bin/     仅承重件（确定性可单测）：resolve-tech-stack / 契约 lint / 度量聚合 /
│            status 事实提取(非决策器) / decisions·changelog 追加器 / hook-preflight   + lib/
└── docs/    specs/(本 spec + 切片 spec)  plans/(切片 bite-sized plan)  research/
```

**照搬清单**（原文拷贝，无 license/provenance 仪式，按需本土化为独立可 diff 改动）：
- **Tier-1 v1.0 承重核心**：`ddt-brainstorming`（=需求站）`ddt-writing-plans`（=实现 plan 步）`ddt-subagent-driven`（=实现 impl 步）`ddt-executing-plans` `ddt-tdd` `ddt-systematic-debugging`（=bug 场景）`ddt-verification` `ddt-requesting-review` `ddt-receiving-review`
- **延后按需再拷**：dispatching-parallel / writing-skills（非首版阻塞）
- **原生自著**：`ddt-charter`（含意图分类）`ddt-design`（契约站）`ddt-impl-spec`（含 refine 子句）`ddt-design-source` `ddt-frontend-craft` `ddt-deliver`

> 已坍缩为本土化实例（不另起壳，洞1）：需求站≡`ddt-brainstorming`；实现 plan 步≡`ddt-writing-plans`；实现 impl 步≡`ddt-subagent-driven`；bug 场景≡`ddt-systematic-debugging`。已删独立 skill：`ddt-intake`/`ddt-product`（并入需求站）、`ddt-intent-router`（折入 charter）、`ddt-change`（即 §3 机制）、`ddt-refine`（impl-spec 子句）、`ddt-impl-plan`/`ddt-impl-execute`（壳，坍缩入对应 vendored）。

## 10. 外部收敛回路：AI 设计源（非站，一等技术）

**第一性原理**：审美/UX 收敛是感知-交互问题，非文本推理问题。在线 AI 设计工具不是补 LLM 弱点的拐杖，是这类子问题的正确模态——但不该是流水线站。升维为通用模式：**当切片收敛目标由人感知判定（非文本推理），其 spec 步可交外部交互工具收敛**。UI 是首要实例，非专属机制。

四步纪律（`ddt-design-source`，被实现站 spec 步按需组合）：① **Export 交接包**——从 SSoT 确定性投影 prompt（PRD 切片意图+契约约束+tokens/品牌+不可违反不变量）+附件，v0/figma/claude-design 等价无"通道"机器；② **外部回路**——人实时渲染微调到满意，DDT 不替代；③ **Ingest**——结果作一等 spec 输入摄取，provenance 记"由 X 工具/Y 人/Z 时"，changelog 留痕；④ **Reconcile**——仍过 Spec Reviewer 对 PRD+契约核对，**美但违约仍是漂移**（加了契约没有的字段→IL-4 escalate）。外部回路收敛美学，SSoT 链治理正确性，各归其主。未启用时实现站用 `ddt-frontend-craft` 直出。

## 11. AI 效能 ROI 报告（交付站，第一等公民）

向政企领导/审计证明 ROI 的依据，非虚荣仪表盘。**hook 被动采集**（agent 禁自夸）：人工省时（人天）、token、闸门通过率、自动放行段数（留痕可审）、**返工率**（Spec Reviewer 抓漂移频次=质量信号）、缺陷逃逸率、需求变更次数与零技术债逃逸证明、相对历史/行业基线（基线源自需求站工作量基线；无则显式标不可比）、**降低保障级交付标记**（洞5 waiver 汇总）。须直接回答"省了多少/质量如何/为何可信"。

## 12. 六诉求 + 痛点目标 → 设计映射（验收）

| 锚 | 落点 |
|----|------|
| 大型项目 | §6 切片作业 + 无状态恢复 + 工作集恒定 |
| 流程标准化 | §4 五站固定链，每站一闸门 |
| 风格一致化 | §5 单一 spec→plan→implement 循环跑遍所有切片 + 宪法注入约定 |
| 链路清晰化 | §4 五站=superpowers 弧线，无特殊阶段，站≡skill≡闸门≡产物 1:1 |
| 纪律 superpowers 化 | 脊柱即 superpowers 弧线；§5/§8 三角+Iron Law+文件事实判据+照搬纪律 skill |
| 团队合作无压化 | §6 repo 即真相，零交接，异步闸门 |
| 痛点#1 AI 设计 | §10 外部收敛回路 |
| #2 命令/skill 界限 | §7 命令 2 个，know-how 全在 skill |
| #3 强行凑 agent | §5/§9 废固定 agent，三角 prompt template |
| #4 落地粗无验证 | §5 三角 + §8 IL-1/IL-5 + §4 契约站纪律 + 验证站真实栈硬门 |
| #5 演示级 | §4 验证站强制真实栈(+诚实降级) + §8 Iron Laws + §3 漂移不可出包 + §4 无源不入 PRD |
| 反悔/越改越乱/技术债 | §3 极简治理 + 变更对称路径 + 兜底 |
| 终极#5 需求变更 / #7 二次拉起 | §3 变更路径 / §7 `/ddt <意图>` 切片定位 |
| 终极#8 可追溯 / #9 唯一真相源 | §3 三件纯文本+git / SSoT 铁律链 |
| 终极#11 人工深度决策 | §7 闸门挣打断权 + 需求站 brainstorming HARD-GATE |
| 冷启动（混杂模糊输入） | §4 需求站≡brainstorming + 输入 taxonomy + 无源不入 PRD |

## 13. 诚实风险与边界

1. **不为单人开放式造代码设计**——superpowers 更优，不抢。
2. **可复现的是过程/闸门/产物结构/质量门，非产物文本逐字一致**——LLM 物理限制，承诺即演示级谎言。
3. **比例原则风险评级器**：已加结构地板，残余风险收窄为"地板域外误评"，有界，列重点测试。
4. **强制层单点（洞4）**：hook 不注册/不跑则 IL 静默退化。已缓解（skill 自陈纪律降级为建议级 + preflight 拒绝静默启动），但缓解后"建议级"仍弱于"强制级"——属已知有界残差，列重点验收。
5. **迁移（干净另起，非树内并存）**：v1.0 是独立 plugin `ddt/`，v0.x `digital-delivery-team/` 冻结不动——无树内 v0/v1 文件级嫁接，迁移=用户切换所装插件，老项目存量留在 v0.x 收尾。消除了原"同目录并存"的污染与回归风险。
6. **ECC parity 缺口**：终极#2 要 ECC 作底座，本 spec 仅基于 superpowers 深调——列独立调研后回填，不在此虚构对应。
7. **brainstorming 本土化保真**：需求站冷启动质量取决于 vendored brainstorming 本土化是否丢失行为塑造力——须配对抗测试，重点验收。
8. **真实栈降级（洞5）**：断网/受限基建下走 waiver 即"降低保障级"交付——诚实但非满保障，ROI 须显式标，客户须知情接受。

## 14. 元洞察（压缩）

- 一条纪律若无法被还原成"读哪个文件的哪个事实"，它就还停在演示级（§8 判据表即此分水岭）。
- 反复同型纠偏：要为"输入不全/状态会乱/会话会忘/再发明轮子"造新机制前，先问 superpowers 是否已有该纪律；优雅 = 多少东西能归约为同一已验证纪律的本土化实例（需求站≡brainstorming，plan≡writing-plans，impl≡subagent-driven，bug≡systematic-debugging）。
- 最简 ≠ 最少字数 = 刚好覆盖、零冗余、零缺口；编排砍冗余 + 冷启动补缺口 + 最高杠杆节点（契约站）加纪律，三处校准齐了才是最简最准。
- 当一轮自查只查出"校准"而非"重想"，架构已收敛；此后再迭代为负收益——这是诚实判断，不是敷衍。

## 15. 转 plan 的交接

通过评审后转 writing-plans。实施第一批（其余一切的地基，先落）：
1. 照搬 Tier-1 九个 superpowers 纪律 skill 平铺进 `skills/`（含 `ddt-brainstorming`=需求站、`ddt-writing-plans`=plan 步、`ddt-subagent-driven`=impl 步），原文拷入，按需本土化为独立改动 + 对抗测试。
2. `ddt-charter`（含意图分类）+ SessionStart 注入 + hook-preflight。
3. §8 强制层 hook（判文件事实，逐 IL 落判据）+ skill 自陈纪律降级文案。
