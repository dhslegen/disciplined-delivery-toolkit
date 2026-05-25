---
name: ddt-design-checkpoint
description: Use after brainstorming and before writing-plans — the design-tidy / Design Checkpoint gate. Runs the seven-question checkpoint, and on demand lands important design into docs/api, docs/data, docs/design. Not a design generator and not a brainstorming replacement; skip it if the Checkpoint is already done.
---

# ddt-design-checkpoint — 设计闸（brainstorming 后、推进到下一阶段前）

**它不是设计生成器**——设计本身在 brainstorming/spec 阶段已产出。
**它不是 brainstorming 替代**——brainstorming 才是探索、发散、产 spec 的场所。
**它不强制生成 API 文档或固定文件**——不是流水线的一个必经站点。

它是一道快速判断门：一份设计准备**推进到下一落地阶段**之前，问七个问题，留下最小判断记录，让设计资产以对的形态就位。下一阶段对单个 brief 是 `writing-plans`，对大需求是逐片深做（见「在什么粒度运行」）。

## 七问 Design Checkpoint

任何设计推进到下一落地阶段前，留下最小判断：

1. **是否可推进到下一阶段？**（brief 的 `writing-plans` / 大需求的逐片深做）设计是否足够清晰、风险是否已识别？
2. **影响 `docs/api/`？** 是否需要新增或修订 API 契约（OpenAPI / RPC schema 等）？
3. **影响 `docs/data/`？** 是否需要新增或修订数据模型、迁移说明？
4. **影响 `docs/design/`？** 是否需要记录架构决策（ADR）或重要设计说明？
5. **需写 `.ddt/decisions.jsonl`？** 是否有需要持久化的决策条目（经 `ddt-decisions-append.mjs` 追加）？
6. **需写 `.ddt/changelog.jsonl`？** 是否有显著变更需要入账（经 `ddt-changelog-append.mjs` 追加）？
7. **有未解决冲突/开放问题？** 如果有，是否阻断进入下一阶段，还是可以带着已知开放项继续？

## 在什么粒度运行

七问对"任何推进到下一落地阶段的设计"都适用，**粒度不限**：

- **单 brief（默认）**：一份 design spec 进 `writing-plans` 前过。
- **大需求级**：brainstorming 把大需求拆成架构 + 切片方案后、逐片深做之前过——**仅当**有跨切片、无单 brief 归属的全局决策（总体架构、技术栈、实时通道选型等）时才过，且**只落全局层**（架构落 `docs/design/`、全局决策落账）。api/data 契约与各切片的局部判断**留给各 brief 自己的 Checkpoint**，不在此预支。

## 前端分流

含前端的切片，先看前端设计状态——`docs/design/frontend/` 非空否、有无 opt-out decision：

- **空且无 opt-out** → 先 `ddt-design-source` 外部整体设计一次（粒度按项目判断）；
- **非空** → 按 bundle 实现；
- **有 opt-out** → 用设计系统直接实现。

详见 `ddt-design-source`。

## 最小留痕就近原则

- **简单工作**：七问答案直接几行写进当前 spec 文件末尾，无需额外文件。
- **复杂工作**（涉及跨模块契约变更、重要架构决策、数据迁移）：
  - API 契约变更 → 落 `docs/api/`
  - 数据模型变更 → 落 `docs/data/`
  - 架构/设计决策 → 落 `docs/design/`
  - 重要决策 → 经 `ddt-decisions-append.mjs` 追加 `.ddt/decisions.jsonl`

路径没有固定命名规范——按内容含义取有意义的文件名即可。

## 何时可跳过

- **已完成 Checkpoint**：若 spec 本身已包含七问的判断（如 brainstorming 产出的 spec 已明确说明影响面和决策），不必为了形式再走一遍。
- **局部小改**（单函数改动、文档修订、配置调整）：直接进 writing-plans，无需 Checkpoint。
- **探索/原型工作**：优先用 brainstorming，Checkpoint 在确定要实现时再用。

判据是**有无实质判断需要留痕**，不是是否走了流程。

## 与其他 skill 的关系

- 上游：`ddt-brainstorming`（产设计 spec）
- 下游：`ddt-writing-plans`（Checkpoint 后进入）
- 留痕工具：`ddt-decisions-append.mjs`、`ddt-changelog-append.mjs`
- 路径权威：`ddt-doctor.mjs` [B] 段——路径不确定时跑 doctor 查
