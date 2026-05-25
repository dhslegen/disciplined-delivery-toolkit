---
name: ddt-design-source
description: Use for the project's user-facing frontend — converge the aesthetics in an external AI design tool (v0/figma/claude-design) instead of picking a component library and coding. Design the frontend coherently as a batch (not per-slice, which fragments the look), ingest the result as a frontend design input, and have per-slice frontend implement against it. Batch granularity (whole frontend / per UI-domain / design-system-first) is a judgment call.
---

# ddt-design-source — 前端审美的外部收敛回路

## 整体设计一次，出一个 bundle

前端实现分散在多切片，但设计若每切片各自出，拼起来视觉不一致。所以**整体设计一次**，产出一个连贯 bundle——**一套设计系统（色彩 / 导航菜单 / 组件 / 间距统一）+ 各页面**，切片只消费。色彩、菜单、组件都出自这一套，所以切片间不会跑偏：**一致性靠"整盘一套系统"，不靠逐页对齐**。哪怕外部回路把系统调得风格迥异、结构大改，它仍是整套一起变、仍是一套。粒度——整盘一次 / 按 UI 域 / 设计系统先行——按项目判断。

全部前端同出这一套语言，**含 CRUD、表格、后台**：设计系统常为竞争力定制过原生风格，现成组件库会与它不一致。感知型页面（大屏、动态可视化、首屏）逐页 bespoke，contract-driven 页面套这套系统装配标准的列表 / 表单 / 详情——都从这一套来，不回退现成组件库。

## 在外部做是推荐，不是强制

审美/UX 是感知-交互问题，不是文本推理——在外部 AI 设计工具（v0/figma/claude-design）里实时渲染、人来判定，审美保真最好，所以**推荐**走外部。但要求的只是"整盘出一个连贯 bundle"，**谁设计的不重要**：外部工具出的、或 LLM 自己整盘出的，落 `docs/design/frontend/` 后一视同仁。

LLM 自做也行——前提是**认真做一次整盘**（一套统一语言、设计系统 + 各页），不是每切片抓个组件库就码：那是本回路要避免的病，换 LLM 来犯不会变好。

## 回路（按所用工具调整，不是死仪式）

1. **Export** — 给外部工具**问题与约束，不给解法**。给：页面清单 + 各页意图（来自 requirements/briefs）+ 状态规范（loading/empty/error/success、响应式、无障碍）+ 领域硬需求（如告警一眼可见、地图坐标系）+ 调性方向与**仅真正固定的**品牌锚点。**留白给它发挥**：解析后的色阶 / 字体 / 布局 / 组件样式是它的交付物，别在文字里先做完——那会把竞争力和辨识度封顶在你已想到的范围里。留白只碰两处、**绝不碰一致性**：签名页（大屏 / 首屏）给足意图、布局留空让它探索；CRUD 一句"套同一套系统的标准列表 / 表单 / 详情"即可。设计只依赖这些，**不依赖契约**——契约（`docs/api`/`docs/data`）在各 brief 的 Design Checkpoint 才出，留到 Reconcile。
2. **外部回路** — 人在工具里渲染、迭代到满意（LLM 自做时：LLM 整盘生成、你 review 到满意）。DDT 不替代这一步。
3. **Ingest** — 产物（代码 / URL / figma）落 `docs/design/frontend/`，同目录写一份 `SOURCE.md` 当消费入口：声明这是全平台视觉真相、来源（工具 / 人 / 时间）、各文件对应哪些切片消费、怎么落地。`.ddt/changelog.jsonl` 记一条来源。
4. **Reconcile** — 把定稿与它牵动的两头对齐。**向上**：外部回路常改掉 Export 时的假设（这正是让人判定的价值）；凡推翻了上游前提（受理书的范式 / 范围假设等），记一条带 `supersedes` 的 decision 写明覆盖了什么——不私改上游文档（IL-4），账本即真相。**向下**：各切片落地时把设计的字段 / 状态与该切片 Design Checkpoint 产出的 `docs/api`/`docs/data` 契约对齐，不一致就改契约或调设计。

## bundle 是前端的视觉真相

- **位置** `docs/design/frontend/`：目录固定，内部文件自由命名；非空即"有 bundle"（可机判，不靠眼看 `docs/design/`）。
- **消费**：各前端切片直接消费 bundle 实现（来 `docs/design/frontend/` 读、入口 `SOURCE.md`、照着做）。切片的 design spec 是"建什么"的计划——**引用** bundle、补数据 / 状态 / 集成，不替代也不转译它（转成文字就丢了视觉）。
- **opt-out**：没有前端 / 前端极简到不值得整盘设计时，记一条 decision 说明本期不做整盘设计。据此判定：目录空且无此 decision = 走本回路（外部或 LLM 自做）；非空 = 消费；有此 decision = 用设计系统直接实现。（"没有外部工具" 不属 opt-out——LLM 自做整盘即可。）

## 在 DDT 里的位置

`大需求变小` 给出页面清单 → 本回路出 bundle 落 `docs/design/frontend/`（视觉真相）→ 各前端 brief 的 `ddt-brainstorming` 引用 bundle 出该切片 spec → `ddt-writing-plans` / `ddt-subagent-driven` 直接消费 bundle 实现 → `ddt-requesting-review`。
