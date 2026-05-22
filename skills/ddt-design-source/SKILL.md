---
name: ddt-design-source
description: Use on demand for a frontend slice whose convergence target is judged perceptually by a human — routes the perceptual problem to an external AI design tool (v0/figma/claude-design) and ingests the result. Optional enhancement, not a pipeline stage.
---

# ddt-design-source — 外部收敛回路（按需可选增强）

## 第一性原理

审美/UX 收敛是**感知-交互问题**，不是文本推理问题。LLM 在文本里推理；"这界面我满不满意"由人在感知反馈回路里判定（实时渲染、局部微调、无盲盒）。现代在线 AI 设计工具是这类子问题的**正确模态**。

这是一个**按需可选增强**，不是实现流水线的固定站点。

## 何时启用

由切片 spec 的收敛判据决定：

- 收敛目标由人**感知/经验**判定（非文本推理）→ 启用（UI 美学、品牌敏感页、首屏视觉、关键交互）
- 客户强制 Figma / 已有设计师交付物 → 摄取为 spec 输入
- 内部管理后台、纯表单页、数据展示页等 contract-driven 场景 → **直接走实现，无需本 skill**

## 四步操作

### 1. Export 交接包

从已有 spec 提炼确定性约束投影给外部工具：
- **prompt**：切片意图 + API 契约约束（引上游 `docs/api/` 的 endpoint/schema）+ design tokens/品牌 + 不可违反不变量（loading/empty/error/success 态、响应式断点、无障碍）
- **附件**：契约摘录、token 规格、参考图/品牌素材
- **通道等价对待**：claude-design / figma / v0——无"通道"专属机器，prompt+附件结构一致

### 2. 外部回路

人在外部工具实时渲染、局部微调、AI 驱动迭代到满意。**DDT 不试图替代它**——充分利用其无盲盒优势。

### 3. Ingest

收敛结果（代码导出 / 分享 URL / figma 文件）作为 spec 输入摄取：
- 落到 `docs/design/<slice>/` 或就近有意义的路径
- provenance 记到 `.ddt/changelog.jsonl`（经 `bin/ddt-changelog-append.mjs`）：`{kind:"design-ingest", slice, tool:"v0|figma|claude-design", by:"<人名>", at:"<ISO8601>", source:"<URL/路径>"}`
- 重要决策经 `bin/ddt-decisions-append.mjs` 追加 `.ddt/decisions.jsonl`

### 4. Reconcile（与已有契约对齐）

摄取物与上游 API 契约（`docs/api/`）核对：
- 设计字段是否都在 API 契约里（设计师常加契约没有的字段）
- 设计状态是否覆盖契约定义的全部错误码与边界
- 发现不对齐 → 要么更新契约（走 ddt-design-checkpoint → docs/api/），要么调整设计

**两种判断各归其主**：外部回路收敛"美学/UX"；契约治理"正确性/一致性"。

## 与其他 skill 的关系

- 上游：`ddt-brainstorming`（产 spec）、`ddt-design-checkpoint`（契约影响面判断）
- 摄取后继续：`ddt-writing-plans` + `ddt-subagent-driven`
- 审查：`ddt-requesting-review`

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
