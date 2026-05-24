---
name: ddt-design-source
description: Use BY DEFAULT for any user-facing frontend slice — route the aesthetic/perceptual design to an external AI design tool (v0/figma/claude-design) and ingest the result, instead of just picking a component library and coding. Opt out only for explicitly trivial contract-driven UI (plain forms/tables/CRUD/internal admin).
---

# ddt-design-source — 外部收敛回路（用户可见前端默认走）

## 第一性原理

审美/UX 收敛是**感知-交互问题**，不是文本推理问题。LLM 在文本里推理；"这界面我满不满意"由人在感知反馈回路里判定（实时渲染、局部微调、无盲盒）。现代在线 AI 设计工具是这类子问题的**正确模态**。

## 何时启用（默认启用，反向 opt-out）

**默认**：任何用户可见前端切片都先走本回路求审美/感知收敛——这是感知-交互问题，不是文本推理，外部 AI 设计工具（v0/figma/claude-design）是正确模态。**别默认选个组件库（如 Ant Design Pro）就码。**

**仅在明确判定为 trivial contract-driven 时 opt-out 直接实现**：纯表单 / 表格 / CRUD / 内部后台，且无审美 / 品牌 / 首屏 / 关键交互诉求。opt-out 是有意识的判断，不是默认。

客户强制 Figma / 已有设计师交付物 → 摄取为 spec 输入（同样走本回路的 Ingest / Reconcile）。

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
- provenance 记到 `.ddt/changelog.jsonl`（经 `ddt-changelog-append.mjs`）：`{kind:"design-ingest", slice, tool:"v0|figma|claude-design", by:"<人名>", at:"<ISO8601>", source:"<URL/路径>"}`
- 重要决策经 `ddt-decisions-append.mjs` 追加 `.ddt/decisions.jsonl`

### 4. Reconcile（与已有契约对齐）

摄取物与上游 API 契约（`docs/api/`）核对：
- 设计字段是否都在 API 契约里（设计师常加契约没有的字段）
- 设计状态是否覆盖契约定义的全部错误码与边界
- 发现不对齐 → 要么更新契约（走 ddt-design-checkpoint → docs/api/），要么调整设计

**两种判断各归其主**：外部回路收敛"美学/UX"；契约治理"正确性/一致性"。

## 与其他 skill 的关系

- 上游：`ddt-brainstorming`（产 spec）
- 可选参考：`ddt-design-checkpoint`——如已完成 Checkpoint，其 `docs/api/` 产物作为 Export 步的约束输入
- 摄取后继续：`ddt-writing-plans` + `ddt-subagent-driven`
- 审查：`ddt-requesting-review`

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
