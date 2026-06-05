---
name: ddt-design-source
description: Use before implementing any frontend in a slice — building UI, pages, components, dashboards, forms, or tables, or picking a component library — even when just told to "build the page" and you already have a layout in mind.
---

# ddt-design-source — 前端审美的外部收敛回路

## 何时进入

含前端实现的切片，进实现前过本闸。去向**机判**（查 `docs/design/frontend/` + `.ddt/decisions.jsonl`，不靠回忆）：

- 空 且 无 opt-out → **走本回路**（外部工具或 LLM 整盘出 bundle）
- 非空 → **消费现有 bundle**
- 空 且 有 opt-out decision → **用设计系统直接实现**
- 不含前端 → 跳过

> 非空即"有 bundle"；别建空目录占位（会被当"非空"误导下游消费空 bundle）。

## 核心：整盘设计一次，出一套系统

前端散在多切片，各自出设计则拼起来不一致。所以**整盘一次**，产一个连贯 bundle——**一套设计系统（色彩 / 导航 / 组件 / 间距）+ 各页面**，切片只消费。一致性靠"一套系统"、不靠逐页对齐。

这套语言**覆盖全部前端，含 CRUD / 表格 / 后台**（设计系统常定制过原生风格，组件库与它不一致）：感知页（大屏 / 可视化 / 首屏）逐页 bespoke，contract-driven 页套系统装配标准列表 / 表单 / 详情——**都从这一套来，不回退组件库**。

**谁做不重要**：外部 AI 设计工具实时渲染、人来判，审美保真最好，故**推荐**外部；LLM 自做也行，前提是真整盘（非每切片抓组件库就码）。**"没有外部工具"≠opt-out**——LLM 整盘自做即可。**粒度**（整盘 / 按 UI 域 / 系统先行）按项目判，right-size 只给粒度、不给"是否整盘"开洞。

## 回路四步（按工具调整，非死仪式）

1. **Export** — 给**问题与约束，不给解法**：页面清单 + 各页意图 + 状态规范（loading/empty/error/success、响应式、无障碍）+ 领域硬需求 + **仅真正固定的**品牌锚点。别把色阶 / 字体 / 布局写死——那会把辨识度封顶；解析后的视觉是它的交付物。**设计只依赖意图与状态，不依赖契约**（契约在各 brief Checkpoint 才出，留到 Reconcile）。
2. **迭代** — 人在工具里渲染到满意（LLM 自做：生成 + review 到满意）。DDT 不替代这步。
3. **Ingest** — 产物原样落 `docs/design/frontend/<root>/`，**外部工具自带的 handoff 入口保留不动**（它是源权威）。**项目侧不写任何导览 md**（`SOURCE.md`/`INDEX.md` 等）——LLM 会停在转译层不读真源，原理见 `using-ddt` 兑现守恒①。`.ddt/changelog.jsonl` 记一条 `frontend-design-bundle-ingested`（含 bundle 根 + handoff 路径）。
4. **Reconcile** — **向上**：外部回路若推翻 Export 的上游前提，记一条带 `supersedes` 的 decision，**不私改上游文档**（IL-4）。**向下**：切片落地把设计字段 / 状态与该切片 `docs/api`/`docs/data` 契约对齐，不一致就改契约或调设计。

## 消费与 opt-out

- **消费**：入口是 bundle 自带的 handoff（非项目侧导览），实现前必读再按其指引读源码。切片 spec **引用** bundle 源码路径、补数据 / 状态 / 集成，**不转译**它（转成文字就丢视觉）。
- **翻译保真，不是重新实现**：bundle 是源代码不是参考图——复刻渲染输出、只换数据源（代码型直接导入它的 CSS、保留 class）。抽象组件（CrudScaffold）仅当输出匹配 bundle 才用，否则是信息丢失层。视觉模式（avatar/pill/card/间距/icon/toolbar，零数据依赖）永远保留，只砍数据驱动列——别把"裁数据"偷换成"裁视觉"。提取入 spec、随 plan/subagent 传递、截图验收。手册：`references/consuming-a-bundle.md`。
- **opt-out 必入账**：前端极简到不值得整盘时，把 JSON 喂给 `ddt-decisions-append.mjs`（读 stdin、补 `ts`、append）。写在 spec/brief/PR 里**都不算**——下游机判 `.ddt/decisions.jsonl` 末尾有无该条目。

  ```bash
  cat <<'EOF' | ddt-decisions-append.mjs
  {"type":"opt-out","scope":"frontend-design","reason":"前端极简，不值得整盘设计","note":"切片实现可直接套设计系统或 inline 样式"}
  EOF
  ```

## 在 DDT 里的位置

`ddt-large-requirement`（页面清单）→ **本回路**出 bundle 落 `docs/design/frontend/` → 各前端 brief：`ddt-brainstorming`（引用 handoff + 源文件出 spec）→ `ddt-design-checkpoint` → `ddt-writing-plans` / `ddt-subagent-driven`（按协议读源码）→ `ddt-requesting-review`。
