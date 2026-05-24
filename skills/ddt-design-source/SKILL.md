---
name: ddt-design-source
description: Use ONCE for the whole frontend (not per-slice) — after requirements/briefs and before per-slice frontend implementation, batch ALL frontend material to an external AI design tool (v0/figma/claude-design), get back one coherent bundle (design system + page designs), and ingest it as the frontend design SSoT. Per-slice frontend then implements against the bundle instead of re-designing. Re-run only to incrementally add missing pages.
---

# ddt-design-source — 外部收敛回路（整盘前端一次性出 bundle）

## 第一性原理

审美/UX 收敛是**感知-交互问题**，不是文本推理问题。LLM 在文本里推理；"这界面我满不满意"由人在感知反馈回路里判定（实时渲染、局部微调、无盲盒）。现代在线 AI 设计工具是这类子问题的**正确模态**。

**且必须整盘出一次**：前端实现分散在多个切片里，但若各切片各自外部设计 = 拼凑、视觉语言不一致。所以**设计整体出一次（bundle），切片只消费、不重新设计**。

## 何时启用（整盘一次，不是每切片）

**时机**：`大需求变小`产出 requirements/briefs（页面/功能已清晰）之后、**首个前端切片实现之前**，做一次整盘前端整体设计。

**做法**：把整盘前端物料**一次性批量** Export 给外部 AI 设计工具，换回**一个连贯 bundle**（设计系统 tokens/组件/布局语言 + 各关键页面设计）。**别让模型默认选个组件库（如 Ant Design Pro）就码。**

**切片消费**：bundle = 后续所有前端切片的**设计 SSoT**。各前端切片实现时**引用 bundle 对应页面 + 共享设计系统**码，**不再单独外部设计**。

**增量补充**：后续切片发现 bundle 缺某页面/组件 → 回本 skill **增量补一批**（仍批量，不是每切片都来）。

**contract-driven 页面**（纯表单/表格/CRUD/后台）在 bundle 里用设计系统标准组件覆盖即可，不必精雕；纯内部后台若整域无审美诉求，可整域 opt-out。

## 四步操作

### 1. Export 交接包（整盘批量）

把**整盘前端**的确定性约束一次性投影给外部工具：
- **prompt**：全部页面/模块清单（来自 briefs）+ 全部 API 契约约束（引 `docs/api/` 的 endpoint/schema）+ design tokens/品牌 + 全局不可违反不变量（loading/empty/error/success 态、响应式断点、无障碍）
- **附件**：契约摘录、token 规格、参考图/品牌素材、页面清单
- **通道等价对待**：claude-design / figma / v0——prompt + 附件结构一致

### 2. 外部回路

人在外部工具实时渲染、局部微调、AI 驱动迭代到整盘满意。**DDT 不试图替代它**——充分利用其无盲盒优势。

### 3. Ingest（bundle 作前端设计 SSoT）

收敛结果（代码导出 / 分享 URL / figma 文件）作为前端设计 SSoT 摄取：
- 落到 `docs/design/frontend-bundle/`（或就近有意义的路径）——后续所有前端切片引用它
- provenance 记到 `.ddt/changelog.jsonl`（经 `ddt-changelog-append.mjs`）：`{kind:"design-ingest", scope:"frontend-bundle", tool:"v0|figma|claude-design", by:"<人名>", at:"<ISO8601>", source:"<URL/路径>"}`
- 重要决策经 `ddt-decisions-append.mjs` 追加 `.ddt/decisions.jsonl`
- **摄入后**：走 `ddt-brainstorming` 把 bundle 落成前端 design spec（`docs/specs/`），作为各切片实现依据

### 4. Reconcile（与已有契约对齐）

摄取物与上游 API 契约（`docs/api/`）核对：
- 设计字段是否都在 API 契约里（设计常加契约没有的字段）
- 设计状态是否覆盖契约定义的全部错误码与边界
- 发现不对齐 → 要么更新契约（走 `ddt-design-checkpoint` → docs/api/），要么调整设计

**两种判断各归其主**：外部回路收敛"美学/UX"；契约治理"正确性/一致性"。

## 与其他 skill 的关系

- 上游：`大需求变小`链路产出 requirements/briefs（页面清单）
- 摄入 bundle 后：`ddt-brainstorming` 把 bundle 落成前端 design spec → 各前端切片 `ddt-writing-plans` + `ddt-subagent-driven` 实现（**消费 bundle，不重新设计**）
- 契约对齐：`ddt-design-checkpoint`（Reconcile 时更新 docs/api/）
- 审查：`ddt-requesting-review`

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
