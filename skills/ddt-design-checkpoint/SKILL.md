---
name: ddt-design-checkpoint
description: Use after brainstorming and before writing-plans — the design-tidy / Design Checkpoint gate. Runs the seven-question checkpoint, and on demand lands important design into docs/api, docs/data, docs/design. Not a design generator and not a brainstorming replacement; skip it if the Checkpoint is already done.
---

# ddt-design-checkpoint — 设计闸（brainstorming 后、writing-plans 前）

**它不是设计生成器**——设计本身在 brainstorming/spec 阶段已产出。
**它不是 brainstorming 替代**——brainstorming 才是探索、发散、产 spec 的场所。
**它不强制生成 API 文档或固定文件**——不是流水线的一个必经站点。

它是一道快速判断门：在 spec 写好、准备进 writing-plans 之前，问七个问题，留下最小判断记录，让设计资产以对的形态就位。

## 七问 Design Checkpoint

任何 design spec 进 `writing-plans` 前，留下最小判断：

1. **是否允许进入 writing-plans？** 设计是否足够清晰、风险是否已识别？
2. **影响 `docs/api/`？** 是否需要新增或修订 API 契约（OpenAPI / RPC schema 等）？
3. **影响 `docs/data/`？** 是否需要新增或修订数据模型、迁移说明？
4. **影响 `docs/design/`？** 是否需要记录架构决策（ADR）或重要设计说明？
5. **需写 `.ddt/decisions.jsonl`？** 是否有需要持久化的决策条目（经 `ddt-decisions-append.mjs` 追加）？
6. **需写 `.ddt/changelog.jsonl`？** 是否有显著变更需要入账（经 `ddt-changelog-append.mjs` 追加）？
7. **有未解决冲突/开放问题？** 如果有，是否阻断进入 writing-plans，还是可以带着已知开放项继续？

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

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
