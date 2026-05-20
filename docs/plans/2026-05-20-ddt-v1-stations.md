## DDT v1.0 五站 skill 落地（Plan 3）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans。Steps 用 checkbox 跟踪。

**Goal:** 落地 spec §4/§9 中尚未建的 5 个 DDT 原生 skill——契约站 `ddt-design`、实现站 spec 步 `ddt-impl-spec`、外部收敛回路 `ddt-design-source`、前端直出 `ddt-frontend-craft`、交付站 `ddt-deliver`。每个 skill 按 superpowers CSO 规约写（description 触发式不写 workflow summary、含 hook 缺失降级声明、与 vendored 纪律 skill 互引）。激活待 Plan 4 提供的 bin 承重件（契约 lint）与 Plan 5 的 ROI 度量——在 SKILL.md 内**诚实标注**这些激活依赖，与 Plan 1/2 处理 IL-7/IL-2 的非 hook 归属同型。

**Architecture:** 纯 markdown skill 文件，平铺于 `skills/` 同级（Claude 可发现）。每个 SKILL.md 由 frontmatter（name=目录名/description=触发式）+ 正文（适用场景/纪律要点/与其他 skill 互引/已知激活依赖）构成。集成测试断言每个 skill 文件就位+frontmatter 合法+关键节存在+对其他 skill 与 vendored skill 的命名引用一致。

**Tech Stack:** Markdown only，无新代码。测试用既有 `node --test` + `node:fs`，集成测试新建 `tests/integration/ddt-stations.test.mjs`。

**Spec 来源：** spec v5 §4（五站脊柱）、§5（实现站三步含 refine 子句）、§9（目录布局：5 原生 skill）、§10（外部收敛回路四步纪律）、§11（ROI 报告——归 Plan 5 激活）、§15.3.3（CSO 规约——description 不写 workflow summary）。

**前置（Plan 1+2 已就位）：** ddt-charter（宪法注入）+ 9 vendored 纪律 skill（ddt-brainstorming/writing-plans/subagent-driven/executing-plans/tdd/systematic-debugging/verification/requesting-review/receiving-review）+ ddt-enforce IL-1/3/4/5/6 文件事实强制。当前测试 49/49 全绿。

---

### 文件结构

| 文件 | 责任 |
|------|------|
| `skills/ddt-design/SKILL.md` | 契约站：PRD → 架构+OpenAPI+数据模型。引用 ddt-subagent-driven 的 Spec Reviewer 做 PRD↔契约核对；契约 lint 硬门（bin 待 Plan 4 接入，本 plan 内文档化为待激活）|
| `skills/ddt-impl-spec/SKILL.md` | 实现站 spec 步：契约+PRD 切片 → 切片实现 spec。含**重构子句**（绿灯前置 + 行为保持，spec §5 已说明无独立 ddt-refine skill）；前端切片可选组合 ddt-design-source（spec §10）|
| `skills/ddt-design-source/SKILL.md` | 外部收敛回路（spec §10 四步纪律）：Export 交接包→外部回路→Ingest→Reconcile；判据 "感知收敛非文本推理" |
| `skills/ddt-frontend-craft/SKILL.md` | 外部回路未启用时直出生产前端：契约绑定+状态完备+无障碍+反"AI 通用感" |
| `skills/ddt-deliver/SKILL.md` | 交付站：README/部署/演示脚本。AI 效能 ROI 报告归 Plan 5 度量层激活——本 plan 文档化为待激活 |
| `tests/integration/ddt-stations.test.mjs` | 端到端：5 站 skill 文件就位 + frontmatter 合法 + 关键节存在 + 互引一致 |

不动 ddt-charter、vendored 9 skill 与 ddt-enforce/ddt-facts/hooks.json/preflight。

---

### Task 1: `ddt-design`（契约站）

**Files:** Create `skills/ddt-design/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**（逐字）

```markdown
---
name: ddt-design
description: Use whenever building or revising the system contract (architecture decisions, OpenAPI spec, data model) from an approved PRD — the 契约 station of DDT's 5-station spine. Invoke before any build-stage slice begins.
---

# ddt-design — 契约站（PRD → 系统级 SSoT）

契约站是 DDT 五站脊柱 `需求 → 契约 → 实现 → 验证 → 交付` 的第二站。它把上游 ddt-brainstorming 站批准的 PRD 翻译成可被下游 ddt-impl-spec 站绑定的**系统级 SSoT**：架构决策 + OpenAPI 契约 + 数据模型。

## 触发场景

- 已有 approved PRD（decisions.jsonl 含 `gate:'product' status:'resolved' user_action:'approve'`），开始构造系统契约
- 上游需求变更后，对受影响契约部分修订（同站 re-entry）
- 实现/验证站抛出 IL-4 escalation（下层发现契约错），返回契约站走变更门

## 纪律要点

### 1. 强制 Spec Reviewer 对 PRD 核对（无引证不得通过——同 IL-5 反乐观）

契约稿完成后**必须**派一次 Spec Reviewer subagent（用 ddt-subagent-driven/spec-reviewer-prompt.md 模板）对照 PRD 逐条核：
- 每个 PRD user story 至少对应 OpenAPI 一组 endpoint
- 每个 Given/When/Then 验收标准在数据模型或 endpoint 行为里有可观测落点
- 反向：契约里没有"凭空字段"——每个字段都能追溯到 PRD 某条需求或 ddt-brainstorming 期间确认的 ASSUMPTION

Reviewer 输出按 `docs/conventions/reviewer-output.md` 写到 `.ddt/reviews/<task>-spec.json`，PASS 必须含非空 `cited_evidence`（强制层 IL-5 会硬拦截无引证 PASS）。

### 2. 契约 lint 硬门

OpenAPI 合法性 + 字段命名一致 + 必填字段标注 + 错误码与状态码对齐——经 `bin/ddt-contract-lint.mjs` 检查 exit=0 才进入下游。

> **已知激活依赖（spec 洞4 同型诚实标注）**：`bin/ddt-contract-lint.mjs` 由 Plan 4 实现并接入 `/ddt` 命令。在 Plan 4 落地前，本硬门**降级为人工检查 + ddt-requesting-review 当面要求 lint 通过证据**——属"未受强制层校验"状态，进 ddt-impl-spec 前必须显式声明。

### 3. SSoT 铁律链上游（PRD > 契约 > 代码）

契约**不得自创 PRD 没有的需求**（IL-4 越级反向：上层无依据写下层）；若需补充必须 escalate 回 ddt-brainstorming 站。

### 4. 外部 API 依赖处理

PRD intake 阶段（ddt-brainstorming 本土化输入 taxonomy）已把外部 API 文档标为"契约站外部不变量"。本站必须：
- 我方 OpenAPI 与外部 API 文档兼容性核对
- 不兼容处 escalate 回 ddt-brainstorming 走变更门，绝不让我方契约偷偷迁就

## 产物

- `openapi/*.yaml`（或等价 schema 文件）
- `docs/architecture/*.md`（架构决策记录）
- 数据模型 schema
- `.ddt/reviews/<task>-spec.json`（Spec Reviewer 引证）

## 与其他 skill 的互引

- 上游：`ddt-brainstorming`（需求站，提供 approved PRD + 输入 taxonomy 元数据）
- Reviewer：`ddt-subagent-driven`（提供 Spec Reviewer subagent 协议与 prompt 模板）
- Review 输出约定：`docs/conventions/reviewer-output.md` + `bin/schema/review-output.schema.json`
- 下游：`ddt-impl-spec`（实现站 spec 步，逐切片绑定本站产物）

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
```

- [ ] **Step 2: 校验 frontmatter** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && node -e "const f=require('fs').readFileSync('skills/ddt-design/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-design/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('ddt-design frontmatter OK')"` → 预期打印 `ddt-design frontmatter OK`

- [ ] **Step 3: 提交**

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
git add skills/ddt-design/SKILL.md
git -c commit.gpgsign=false commit -m "feat(stations): ddt-design 契约站 skill（含强制 Spec Reviewer + 契约 lint 硬门待激活）"
```

---

### Task 2: `ddt-impl-spec`（实现站 spec 步，含 refine 子句）

**Files:** Create `skills/ddt-impl-spec/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**（逐字）

```markdown
---
name: ddt-impl-spec
description: Use to write a per-slice implementation spec before invoking ddt-writing-plans — the spec step of DDT's 实现 station. Required before any plan/impl can start (IL-3 will block otherwise).
---

# ddt-impl-spec — 实现站 spec 步

实现站三步循环 `spec → plan → implement` 的第一步。给一个 build 切片（后端/前端/aspect）写**实现 spec**，绑定上游 ddt-design 站产物（契约/数据模型）和 PRD 切片，作为 ddt-writing-plans（plan 步）的唯一输入。

## 触发场景

- 进入 build 站某切片，IL-3 强制要求"无批准 spec 不得 plan/impl"——必须先产 approved spec
- 重构意图（行为不变内部改善）——本 skill 内 §refine 子句覆盖，无独立 ddt-refine skill
- 局部二次拉起（`/ddt-rerun <slice>` Plan 4 命令）某切片

## spec 必含内容

每份切片 spec 写到 `docs/specs/<slice>-spec.md`，**必须**含：

1. **实现什么 / 为什么**：1-2 段，绑定 PRD user story id + 上游契约 endpoint id
2. **接口契约（引证不重述）**：明确引上游 ddt-design 产物（`openapi/*.yaml` 哪个 endpoint、哪个 schema），**不抄一遍**——抄一遍 = 漂移源
3. **边界与错误**：边界输入、错误码、降级策略
4. **不做什么**：显式声明本切片不涵盖的相邻功能（防 scope creep）
5. **测试纲要**：列要覆盖的 PRD Given/When/Then + 边界用例（详测在 ddt-writing-plans plan 步给完整测试码）

## 重构子句（spec §5 已说明无独立 ddt-refine skill）

若切片意图为重构（行为不变内部改善），本 skill 强制：

- **绿灯前置**：进 spec 前现有切片测试套件必须全绿（IL-1 同型——无前置证据不得开工）
- **行为保持**：spec 段须显式声明"无行为变更"，列出"哪些公共接口不变 / 哪些内部接口允许变 / 哪些测试期望不变"
- **后置硬门**：重构后**测试套件全绿 + 覆盖率不降 + 契约 lint 不报新警告**才算完成。否则按 IL-1 拒绝完成声明

若过程中发现行为必须变 → 不是重构 → 弹回 ddt-design 走变更门。

## 前端切片可选组合 ddt-design-source

前端切片 spec 步可按需组合 `ddt-design-source` skill 走外部收敛回路（v0/figma/claude-design）——见 spec §10 判据：当切片收敛目标由人感知判定而非文本推理判定时启用。外部回路未启用时，plan/implement 步用 `ddt-frontend-craft` 直出。

## HARD-GATE

- 上游：spec 未经过 Spec Reviewer subagent（用 ddt-subagent-driven/spec-reviewer-prompt.md）核对 PRD 一致性并产生 `.ddt/reviews/<slice>-spec.json`（PASS+非空 cited_evidence），**不得进 ddt-writing-plans**（IL-3+IL-5）
- 下游：每条切片 spec 须由人显式批准（写入 decisions.jsonl：`gate:'spec' slice:<id> status:'resolved' user_action:'approve'`），否则强制层 IL-3 hook 会硬拦截 plan/impl 启动

## 与其他 skill 的互引

- 上游：`ddt-design`（契约+数据模型 SSoT）、`ddt-brainstorming`（PRD 切片）
- Reviewer：`ddt-subagent-driven`（Spec Reviewer 模板）
- 下游：`ddt-writing-plans`（按本 spec 出 bite-sized plan）→ `ddt-subagent-driven`（按 plan 跑三角）
- 重构场景：本 skill 自身重构子句 + `ddt-tdd`（绿灯前置）
- 前端切片：`ddt-design-source`（外部回路）或 `ddt-frontend-craft`（直出）

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
```

- [ ] **Step 2: 校验** — `node -e "const f=require('fs').readFileSync('skills/ddt-impl-spec/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-impl-spec/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('ddt-impl-spec frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-impl-spec/SKILL.md
git -c commit.gpgsign=false commit -m "feat(stations): ddt-impl-spec 实现站 spec 步（含 refine 子句）"
```

---

### Task 3: `ddt-design-source`（外部收敛回路四步）

**Files:** Create `skills/ddt-design-source/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**（逐字）

```markdown
---
name: ddt-design-source
description: Use during a frontend slice's spec step when the convergence target is judged perceptually by a human (UI aesthetics/UX) — routes the perceptual problem to an external AI design tool (v0/figma/claude-design) and ingests the result as an SSoT-bound spec input. NOT a pipeline stage.
---

# ddt-design-source — 外部收敛回路

## 第一性原理

审美/UX 收敛是**感知-交互问题**，不是文本推理问题。LLM 在文本里推理；"这界面我满不满意"由人在感知反馈回路里判定（实时渲染、局部微调、无盲盒）。现代在线 AI 设计工具是这类子问题的**正确模态**——但**不该是流水线站**。

升维为通用模式：当一个 build 切片的收敛目标由人**感知/经验**判定（非文本推理），其 `ddt-impl-spec` 步可把问题交给外部交互工具收敛。判据是**收敛模态匹配**，不是"LLM 行不行"的能力对冲。UI 美学/UX 几乎总是；内部 API 形状不是（文本的、契约治理的）。

## 四步纪律

### 1. Export 交接包

从 SSoT 确定性投影：
- **prompt**：PRD 切片意图 + 契约约束（精确引上游 ddt-design 的 endpoint+schema，禁让外部工具编字段）+ design tokens/品牌 + 不可违反不变量（必须覆盖 loading/empty/error/success 态、响应式断点、无障碍）
- **附件**：契约摘录、token 规格、参考图/品牌素材
- **通道等价对待**：claude-design / figma / v0——无"通道"专属机器，prompt+附件结构一致

### 2. 外部回路

人在外部工具实时渲染、局部微调、AI 驱动迭代到满意。**DDT 不试图替代它**——充分利用其无盲盒优势。

### 3. Ingest

收敛结果（代码导出 / 分享 URL / figma 文件）作为一等 spec 输入 artifact 摄取：
- 落到 `.ddt/design-source/<slice>/`
- provenance 记到 `changelog.jsonl`：`{kind:"design-ingest", slice, tool:"v0|figma|claude-design", by:"<人名>", at:"<ISO8601>", source:"<URL/路径>"}`
- decisions.jsonl 也追一条人工签收记录

### 4. Reconcile（与 SSoT 链对齐）

摄取物**必须**过 Spec Reviewer subagent 对 PRD+契约核对：
- 设计字段是否都在 OpenAPI 契约里（设计师常加契约没有的字段）
- 设计状态是否覆盖契约定义的全部错误码与边界
- **美但违约仍是漂移**——加了契约没有的字段 → IL-4 escalate 弹回 ddt-design 走变更门，绝不静默吞下

**两种判断各归其主**：外部回路收敛"美学/UX"；SSoT 链治理"正确性/一致性"。

## 与 relay-prompt（已删）的判据分野

DDT v1.0 删除了人工 relay-prompt（spec 决策：跨会话/跨 AI 续作由 repo 即真相 + 边界重算自动支持）。本 skill 的 Export 交接包形似 relay-prompt 但**神异**：

| | relay-prompt（已删） | design 交接包（本 skill） |
|---|---|---|
| 服务于 | "会话会失忆"——可修架构缺陷 | "感知收敛非文本推理"——不可消模态真理 |
| 本质 | 拐杖 → 删 | 正确工具配正确问题 → 一等支持 |

判据：服务**可修缺陷**=拐杖；服务**不可消模态真理**=一等。

## 何时启用 vs 跳过

由 tech-stack.json `ai_design` 开关与切片 spec 判断：
- `ai_design=false` 或 LLM + `ddt-frontend-craft` 能直出满意 → **零仪式跳过**
- 客户强制 Figma / 已有设计师交付物 → 摄取为 spec 输入
- 设计美学需人感知判断（首屏、关键交互、品牌敏感页）→ 启用

## 与其他 skill 的互引

- 上游：`ddt-impl-spec`（前端切片 spec 步按需组合本 skill）、`ddt-design`（契约约束源）
- Reviewer：`ddt-subagent-driven`（Reconcile 步用 Spec Reviewer）
- Reviewer 输出约定：`docs/conventions/reviewer-output.md`
- 备选：`ddt-frontend-craft`（外部回路不启用时直出）

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
```

- [ ] **Step 2: 校验** — `node -e "const f=require('fs').readFileSync('skills/ddt-design-source/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-design-source/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('ddt-design-source frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-design-source/SKILL.md
git -c commit.gpgsign=false commit -m "feat(stations): ddt-design-source 外部收敛回路 skill"
```

---

### Task 4: `ddt-frontend-craft`（前端直出）

**Files:** Create `skills/ddt-frontend-craft/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**（逐字）

```markdown
---
name: ddt-frontend-craft
description: Use when the frontend slice does NOT route through ddt-design-source (external loop disabled) — produce production-grade frontend code directly bound to the OpenAPI contract, with full state coverage, accessibility, and resistance to "generic AI aesthetic".
---

# ddt-frontend-craft — 前端直出（外部回路未启用时）

当前端切片不走 `ddt-design-source` 外部收敛回路时，本 skill 是 `ddt-writing-plans` + `ddt-subagent-driven` 在 implement 步实际产出前端代码所遵循的纪律。

## 何时使用

- `tech-stack.json` `ai_design=false` 或切片 spec 判定不需外部回路（如内部管理后台、纯表单页）
- 已有设计 token 体系且页面属"contract-driven 数据展示+交互"非"品牌敏感新视觉"
- 客户无 Figma / v0 偏好，DDT 自行决定如何出前端

## 四项纪律（每项均可被 Spec Reviewer 引证审查）

### 1. 契约绑定

- 所有数据请求/响应类型从 `ddt-design` 产出的 OpenAPI 契约生成（避免手写 TypeScript 类型偏离）
- 字段名严格用契约定义的命名，禁前端层自创字段（IL-4 越级私改：私改即漂移）
- 表单校验规则与契约约束（minLength/format/enum）一致

### 2. 状态完备

每个数据驱动组件**必须**覆盖四态：
- **loading**：未到数据期间的骨架/加载视图，非空白屏
- **empty**：数据空集的明确提示，非 0 行的死表格
- **error**：每个契约错误码对应可恢复或可上报的视觉与文案，非 alert
- **success**：正常数据态

Spec Reviewer 会逐条核四态，缺一即 FAIL。

### 3. 无障碍（WCAG 2.1 AA 起步）

- 语义化 HTML（`button` 用 `<button>` 不 `<div onClick>`）
- 键盘可达（所有交互可 Tab 到+回车/空格触发）
- 颜色对比 AA（4.5:1 文字、3:1 大文字与图形组件）
- 表单 label-input 关联（`for`/`id` 或 ARIA）
- 状态变更的 `aria-live`/`role="status"`/`aria-busy`

### 4. 反"AI 通用感"

防止产出"看起来像 AI 拼的"千篇一律页面：
- **不要默认 shadcn/Material 全套裸用**：在 token 体系（间距、圆角、阴影、颜色）上做项目级一致校准
- **不要 emoji 当图标**：用项目图标集；缺则申请 design-source 流程加入 token
- **不要 lorem ipsum**：占位用真实业务领域词或显式 `TODO: 内容待 PM 补充`
- **不要无信息密度填充**：避免大段无意义介绍文案；尊重 PRD 真实场景的信息层级

## HARD-GATE

- 上游：切片 spec（`ddt-impl-spec` 产物）批准且明确"使用 ddt-frontend-craft 直出"
- 实现：plan 步（`ddt-writing-plans`）的 task 必须以本 skill 四纪律为引证产 task 完整代码
- 下游：implement 步（`ddt-subagent-driven`）的 Quality Reviewer 须按上面四纪律逐条核（cited_evidence 含实际文件:行）

## 与其他 skill 的互引

- 上游：`ddt-design`（契约源）、`ddt-impl-spec`（切片 spec）
- 同位：`ddt-design-source`（外部回路启用时替代本 skill）
- 实现编排：`ddt-writing-plans` + `ddt-subagent-driven`
- 审查：`ddt-requesting-review` + Quality Reviewer prompt

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
```

- [ ] **Step 2: 校验** — `node -e "const f=require('fs').readFileSync('skills/ddt-frontend-craft/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-frontend-craft/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('ddt-frontend-craft frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-frontend-craft/SKILL.md
git -c commit.gpgsign=false commit -m "feat(stations): ddt-frontend-craft 前端直出 skill"
```

---

### Task 5: `ddt-deliver`（交付站）

**Files:** Create `skills/ddt-deliver/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**（逐字）

```markdown
---
name: ddt-deliver
description: Use at the 交付 (delivery) station of DDT's 5-station spine, after 验证 station passes — produces README, deployment guide, demo script, and (via Plan 5 metrics layer) the AI efficiency ROI report. Final IL-6 evidence gate is enforced before this step.
---

# ddt-deliver — 交付站（最后一站）

五站脊柱终点。前置：`验证` 站三角双审通过 + 真实栈 smoke 通过 + 强制层 IL-6 扫描无未 resolved 漂移/pending。

## 触发场景

- 验证站通过且交付决策门弹起（人工签收"准备出包"）
- `/ddt-rerun` 仅交付物变更（如 README 修订），不重跑验证

## 必产产物

### 1. README.md（项目顶层）

- 项目定位（5 行内）
- 适用场景（与不适用场景同列，spec §0 同型诚实）
- 5 分钟快速上手（含先决条件、命令、预期输出）
- 链接到 deploy 与 demo 文档

### 2. docs/deploy.md（部署指南）

- 环境矩阵（生产/预生产/本地）
- 依赖版本钉死（Node/数据库/中间件）
- 一键部署脚本（或步骤精确到命令）
- 回滚指引

### 3. docs/demo.md（演示脚本）

- 演示数据集 seed 命令
- 演示流程 step-by-step（每步可观测的预期输出）
- 已知限制与展示边界

### 4. AI 效能 ROI 报告（spec §11）

**待激活**：报告生成由 Plan 5 度量层实现（被动埋点 hook 采集人工省时/token/闸门通过率/返工率/缺陷逃逸率/降低保障级标记等指标）。Plan 5 前本 skill **仅占位文档化报告结构**：

- 报告路径：`docs/efficiency-report.md`
- 报告章节：项目周期 / 人工省时 / 质量指标 / 与基线对比 / 降低保障级交付清单（IL waiver 汇总）
- 受众：政企领导/审计方——回答"省了多少 / 质量如何 / 为何可信"

## IL-6 终极证据门（spec §3.5 反技术债兜底）

进交付站前的证据门**汇总扫描**：
- 所有 `pending` 决策须 resolved
- 所有 `accept-drift` 须有显式署名理由
- 所有"纳入本批却未实现"的 user story 须降级为 deferred 并留痕

任一未通过 → 强制层 IL-6 hook 硬拒交付。

## 降低保障级交付（spec §13 风险 #8）

断网/受限基建下若真实栈 smoke 未跑通：
- decisions.jsonl 记一条**署名 waiver**（含基建原因）
- README 与 ROI 报告**显式标注"本交付为降低保障级"**并列明哪些证据缺失
- 客户须知情接受（决策门追一条 acknowledgment）

**绝不假装跑过**。

## 与其他 skill 的互引

- 上游：`ddt-verification`（验证站证据）、`ddt-requesting-review`/`ddt-receiving-review`（评审证据）
- 度量：Plan 5 度量层（hook 被动采集，agent 禁自夸）
- 强制层：`ddt-enforce.mjs` IL-6 在 PreToolUse `enter-deliver` 时点拦截

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
```

- [ ] **Step 2: 校验** — `node -e "const f=require('fs').readFileSync('skills/ddt-deliver/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-deliver/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('ddt-deliver frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-deliver/SKILL.md
git -c commit.gpgsign=false commit -m "feat(stations): ddt-deliver 交付站 skill（ROI 报告待 Plan 5 激活）"
```

---

### Task 6: 端到端集成测试 + 全量回归

**Files:** Create `tests/integration/ddt-stations.test.mjs`

- [ ] **Step 1: 写测试** — Create `tests/integration/ddt-stations.test.mjs`（逐字）

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATIONS = ['ddt-design', 'ddt-impl-spec', 'ddt-design-source', 'ddt-frontend-craft', 'ddt-deliver'];

test('5 个 DDT 原生站 skill 平铺且 frontmatter 合法（name 匹配目录 + description 触发式 + 含降级声明）', () => {
  for (const d of STATIONS) {
    const f = path.join(root, 'skills', d, 'SKILL.md');
    assert.ok(existsSync(f), d + '/SKILL.md 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, d + ' 无 frontmatter');
    assert.match(m[1], new RegExp('name:\\s*' + d + '\\b'), d + ' name 不匹配目录');
    assert.match(m[1], /description:\s*Use /, d + ' description 须以 "Use" 起首（CSO 触发式）');
    assert.match(s, /DDT 强制层声明/, d + ' 缺降级声明');
  }
});

test('ddt-design 含强制 Spec Reviewer + 契约 lint 硬门 + Plan 4 激活归属', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design/SKILL.md'), 'utf8');
  assert.match(s, /Spec Reviewer/);
  assert.match(s, /契约 lint/);
  assert.match(s, /Plan 4/);
});

test('ddt-impl-spec 含 refine 子句 + IL-3 HARD-GATE 引用', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-impl-spec/SKILL.md'), 'utf8');
  assert.match(s, /重构子句|refine 子句/);
  assert.match(s, /绿灯前置/);
  assert.match(s, /IL-3/);
});

test('ddt-design-source 含外部收敛回路四步 + 形似神异判据', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-source/SKILL.md'), 'utf8');
  for (const step of ['Export', '外部回路', 'Ingest', 'Reconcile']) {
    assert.match(s, new RegExp(step), 'design-source 缺四步之 ' + step);
  }
  assert.match(s, /神异|不可消模态/);
});

test('ddt-frontend-craft 含四项纪律（契约绑定/状态完备/无障碍/反 AI 通用感）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-frontend-craft/SKILL.md'), 'utf8');
  for (const d of ['契约绑定', '状态完备', '无障碍', '反"AI 通用感"']) {
    assert.match(s, new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'frontend-craft 缺纪律之 ' + d);
  }
});

test('ddt-deliver 含 IL-6 终极证据门 + ROI 报告 Plan 5 激活归属 + 降低保障级机制', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-deliver/SKILL.md'), 'utf8');
  assert.match(s, /IL-6/);
  assert.match(s, /Plan 5/);
  assert.match(s, /降低保障级/);
});

test('5 站 skill 互引一致（命名引用未拼错）', () => {
  const allText = STATIONS.map(d => readFileSync(path.join(root, 'skills', d, 'SKILL.md'), 'utf8')).join('\n---FILE---\n');
  // 引用既有 vendored skill 名应精确
  for (const ref of ['ddt-subagent-driven', 'ddt-writing-plans', 'ddt-brainstorming', 'ddt-requesting-review']) {
    assert.match(allText, new RegExp(ref), '站 skill 集合缺 ' + ref + ' 引用');
  }
  // 站间互引
  assert.match(allText, /ddt-design/);
  assert.match(allText, /ddt-impl-spec/);
  assert.match(allText, /ddt-design-source/);
  assert.match(allText, /ddt-frontend-craft/);
});
```

- [ ] **Step 2: 运行集成测试** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && npm test -- tests/integration/ddt-stations.test.mjs` → 预期 PASS（7 测试绿）

- [ ] **Step 3: 全量回归** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && npm test` → 预期 Plan 1+2+3 全部测试绿。当前 49 + 本 plan 7 集成 = 约 56（以实跑为准）。

- [ ] **Step 4: 提交**

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
git add tests/integration/ddt-stations.test.mjs
git -c commit.gpgsign=false commit -m "test(stations): 5 站 skill 端到端集成测试（frontmatter/纪律/互引/激活归属）"
```

---

### 后续计划（不在本 Plan 实现）

- **Plan 4（激活点）**：`/ddt` 与 `/ddt-status` 两薄闸门 + bin 承重件（`ddt-contract-lint.mjs` 激活 ddt-design 契约 lint 硬门 / `resolve-tech-stack` / status 事实提取 / decisions·changelog 追加器 / 注入 `ddt_intent`+`ddt_slice` 字段激活 Plan 1+2 全部 hook）+ IL-7 反推
- **Plan 5（度量+ROI）**：被动埋点 hook + 交付站 ROI 报告生成（激活 ddt-deliver 第 4 节 ROI 占位）+ 降低保障级标记汇总

---

### Self-Review

**1. Spec 覆盖**（spec v5 §4/§5/§9/§10/§11）：
- §4 五站脊柱：需求(Plan 1 已 vendor ddt-brainstorming) / 契约(Task 1) / 实现 spec 步(Task 2) + plan 步(vendor) + impl 步(vendor) / 验证(vendor ddt-verification+ddt-tdd) / 交付(Task 5) ✓
- §5 实现站三步 + refine 子句：Task 2 spec 步含 refine 子句明列；plan/impl 步沿用 vendored ✓
- §9 5 原生 skill：Task 1-5 各对应一个 ✓
- §10 外部收敛回路四步：Task 3 ✓
- §11 ROI 报告：Task 5 文档化为 Plan 5 激活 ✓（与 Plan 1 IL-7/Plan 2 IL-2 同型诚实标注）

**2. 占位符扫描**：每 SKILL.md 内容完整；ROI 报告与契约 lint 的"待激活"是**明确归属下一 Plan + 当前文档化为占位**的诚实标注，非"TBD"——与 spec 反 wrapper/反占位符纪律一致。

**3. 类型/签名一致性**：5 个 skill 互引名（ddt-design / ddt-impl-spec / ddt-design-source / ddt-frontend-craft / ddt-deliver）与目录名严格一致；vendored 引用（ddt-subagent-driven / ddt-writing-plans / ddt-brainstorming / ddt-requesting-review / ddt-tdd / ddt-verification）与 Plan 1 vendored 目录名一致；ROI 路径 `docs/efficiency-report.md` 与 spec §11 一致。

**4. 与既有的连接缝**：
- 不改 ddt-charter（已含 5 站链图）、不改 vendored 9 skill、不改 ddt-enforce/ddt-facts/hooks.json
- 集成测试只断言文件存在/frontmatter/关键节，不耦合到具体行号或排版
- ROI 与契约 lint 的"待激活"在两处一致表述（ddt-design Task 1 + ddt-deliver Task 5）

**5. 关于 spec §9 列出的 `agents/` 顶层目录**：spec §9 在目录布局示意里写了 `agents/{implementer-prompt.md, spec-reviewer-prompt.md, quality-reviewer-prompt.md}`，但 vendored `skills/ddt-subagent-driven/` 已含同名 prompt template（superpowers 原版）。如再在 `agents/` 顶层复制一份会重复维护、易漂移。**本 Plan 决策：不建 `agents/` 顶层**，统一引用 `skills/ddt-subagent-driven/*-prompt.md`——这是 spec 与实际的小偏差，记录于本 self-review，留待 Plan 4 或后续 spec 修订时把 §9 目录示意同步为不含 `agents/`。该决策符合 spec §13 反复出现的"不为同一内容造重复机器"原则（与 Plan 1 决策 #7 反嵌套同源）。

**6. agents/ 不建是否构成 spec 偏离？** 是，但偏离方向是更精简、更自洽（避免 prompt template 双副本），符合 spec 反 wrapper/反重复的元洞察；记录在此供日后 spec 修订时同步。
