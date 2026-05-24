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

`大需求变小`产出 requirements/briefs（页面清晰）后、对应前端切片实现前，做一次（一批）整体前端设计；后续缺页面再增量补一批。**全部前端都走这套外部设计——连纯 contract-driven 页面（表单/表格/CRUD/后台）也从 bundle 的设计系统装配**：设计系统常为竞争力定制了原生风格，off-the-shelf 标准组件会与它不一致，所以连最简单的页面都不回退到现成组件库。感知型页面（大屏/动态可视化/首屏）做 bespoke 逐页设计，contract-driven 页面用设计系统装配（不必逐页精雕），但二者同出一套外部设计语言。

## 大致回路（不是死仪式，按所用工具调整）

1. **Export**：把这批前端物料一次性投给外部工具——页面清单 + 各页功能意图（来自 requirements/briefs）+ design tokens/品牌 + 状态规范（loading/empty/error/success、响应式、无障碍）。**设计不依赖契约**——契约（`docs/api`/`docs/data`）在各 brief 的 Design Checkpoint 才收敛，此时多半还没有；字段/状态的对齐留到 Reconcile。
2. **外部回路**：人在工具里迭代到满意。DDT 不替代它。
3. **Ingest**：产物（代码/URL/figma）落 `docs/design/frontend/`（bundle 的家，**= 视觉/UX 真相**），在 `.ddt/changelog.jsonl` 记一条来源（工具/来源/人/时间）。之后各前端 brief 的 brainstorming **引用** bundle 对应页面、补该切片的数据/状态/集成——**不把 bundle 转译成文字 spec**（那会丢视觉保真）。
4. **Reconcile**：等各 brief 的 Design Checkpoint 产出 `docs/api`/`docs/data` 契约后，与设计的字段/状态对齐（都在契约里吗）；不一致就更新契约或调设计。

## bundle 的存在 / 位置 / opt-out（单一真相，让触发与消费可机判）

- **位置钉死**：bundle 落 `docs/design/frontend/`（**目录钉死、内部文件自由命名**——只钉一个 SSoT 锚点，不破"文件名不固定"原则）。
- **存在判断**：`docs/design/frontend/` 非空 = 有 bundle（`test -e` 可机判，**别靠眼看 `docs/design/` 里有没有东西**）。
- **消费端**：各前端切片**固定来 `docs/design/frontend/` 直接消费 bundle**（bundle = 视觉/UX 真相，照着实现）；brief 的 design spec 只是"建什么"的计划、**引用** bundle，不替代它、不把它转译成文字。
- **opt-out**：无前端 / 前端极简到不值得外部设计 / 没有外部设计工具 → 记一条 decision「本期前端不外部设计，理由…」。判定：**目录空 + 无 opt-out = 该触发本回路；非空 = 消费；有 opt-out = 用设计系统直接实现**。别假装走过。

## 关系

上游 `大需求变小`（页面清单）→ 本回路出 bundle 落 `docs/design/frontend/`（视觉真相）→ 各前端 brief 的 `ddt-brainstorming` **引用 bundle** 产出该切片 spec（建什么）→ `ddt-writing-plans` / `ddt-subagent-driven` **直接消费 bundle**（长什么样）实现 → `ddt-requesting-review`。

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
