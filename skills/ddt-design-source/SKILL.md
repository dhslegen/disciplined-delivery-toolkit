---
name: ddt-design-source
description: Use for the project's user-facing frontend — converge the aesthetics in an external AI design tool (v0/figma/claude-design) instead of picking a component library and coding. Design the frontend coherently as a batch (not per-slice, which fragments the look), ingest the result as a frontend design input, and have per-slice frontend implement against it. Batch granularity (whole frontend / per UI-domain / design-system-first) is a judgment call.
---

# ddt-design-source — 前端审美的外部收敛回路

## 原则

审美/UX 收敛是**感知-交互问题**，不是文本推理。"这界面满不满意"由人在外部 AI 设计工具里实时渲染、微调、迭代判定——这是正确模态。**别让模型选个组件库（如 Ant Design Pro）就码。**

两条不变量：

- **整体出一次求一致**：前端实现分散在多切片，但设计若每切片各自外部出 = 拼凑、视觉不一致。所以**设计成批出**（产物即 bundle），**切片只消费、不重新设计**。
- **粒度是判断**：整盘一次 / 按 UI 域 / 设计系统先行——按项目选，**不钦定**。

## 何时

`大需求变小`产出 requirements/briefs（页面清晰）后、对应前端切片实现前，做一次（一批）整体前端设计；后续缺页面再增量补一批。纯 contract-driven 页面（表单/表格/CRUD/后台）用设计系统标准组件即可，不必精雕。

## 大致回路（不是死仪式，按所用工具调整）

1. **Export**：把这批前端物料一次性投给外部工具——页面清单 + `docs/api/` 契约 + design tokens/品牌 + 状态规范（loading/empty/error/success、响应式、无障碍）。
2. **外部回路**：人在工具里迭代到满意。DDT 不替代它。
3. **Ingest**：产物（代码/URL/figma）落 `docs/design/`（前端设计依据），在 `.ddt/changelog.jsonl` 记一条来源（工具/来源/人/时间），再走 `ddt-brainstorming` 把它落成前端 design spec。
4. **Reconcile**：与 `docs/api/` 契约对齐（设计字段/状态是否都在契约里）；不一致就更新契约或调设计。

## 关系

上游 `大需求变小`（页面清单）→ 本回路出 bundle → `ddt-brainstorming` 落前端 spec → 各前端切片 `ddt-writing-plans` / `ddt-subagent-driven` **消费 bundle** 实现 → `ddt-requesting-review`。

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
