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
