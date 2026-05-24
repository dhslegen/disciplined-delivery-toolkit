---
name: ddt-design-source
description: Use for the project's user-facing frontend — converge the aesthetics in an external AI design tool (v0/figma/claude-design) instead of picking a component library and coding. Design the frontend coherently as a batch (not per-slice, which fragments the look), ingest the result as a frontend design input, and have per-slice frontend implement against it. Batch granularity (whole frontend / per UI-domain / design-system-first) is a judgment call.
---

# ddt-design-source — 前端审美的外部收敛回路

## 为什么在外部做

审美/UX 是感知-交互问题，不是文本推理——界面好不好，要由人在外部 AI 设计工具（v0/figma/claude-design）里实时渲染、迭代判定。所以前端先在外部把审美收敛成一个 bundle，再据此实现，而不是让模型选个组件库就码。

## 整体设计一次，出一个 bundle

前端实现分散在多切片，但设计若每切片各自外部出，拼起来视觉不一致。所以**整体设计一次**，产出一个连贯 bundle（设计系统 + 各页面），切片只消费。粒度——整盘一次 / 按 UI 域 / 设计系统先行——按项目判断。

全部前端同出这一套设计语言，**含 CRUD、表格、后台**：设计系统常为竞争力定制过原生风格，现成组件库会与它不一致。感知型页面（大屏、动态可视化、首屏）逐页 bespoke，contract-driven 页面用设计系统装配，但都从这一套来，不回退现成组件库。

## 回路（按所用工具调整，不是死仪式）

1. **Export** — 把整盘物料一次投给外部工具：页面清单 + 各页意图（来自 requirements/briefs）+ 品牌 / design tokens + 状态规范（loading/empty/error/success、响应式、无障碍）。设计只依赖这些，**不依赖契约**——契约（`docs/api`/`docs/data`）在各 brief 的 Design Checkpoint 才出，留到 Reconcile。
2. **外部回路** — 人在工具里渲染、迭代到满意。DDT 不替代这一步。
3. **Ingest** — 产物（代码 / URL / figma）落 `docs/design/frontend/`，`.ddt/changelog.jsonl` 记一条来源（工具 / 来源 / 人 / 时间）。
4. **Reconcile** — 落地时把设计的字段 / 状态与该切片 Design Checkpoint 产出的契约对齐；不一致就改契约或调设计。

## bundle 是前端的视觉真相

- **位置** `docs/design/frontend/`：目录固定，内部文件自由命名；非空即"有 bundle"（可机判，不靠眼看 `docs/design/`）。
- **消费**：各前端切片直接消费 bundle 实现（来 `docs/design/frontend/` 读、照着做）。切片的 design spec 是"建什么"的计划——**引用** bundle、补数据 / 状态 / 集成，不替代也不转译它（转成文字就丢了视觉）。
- **opt-out**：没有前端 / 前端极简 / 没有外部设计工具时，记一条 decision 说明本期不外部设计。据此判定：目录空且无此 decision = 走本回路；非空 = 消费；有此 decision = 用设计系统直接实现。

## 在 DDT 里的位置

`大需求变小` 给出页面清单 → 本回路出 bundle 落 `docs/design/frontend/`（视觉真相）→ 各前端 brief 的 `ddt-brainstorming` 引用 bundle 出该切片 spec → `ddt-writing-plans` / `ddt-subagent-driven` 直接消费 bundle 实现 → `ddt-requesting-review`。

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
