# DDT — Disciplined Delivery Toolkit

> **superpowers 纪律基底 ⊕ toB 交付治理**
> Claude Code plugin for disciplined, auditable, multi-stakeholder AI-assisted delivery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-43853d.svg)](./package.json)
[![Status](https://img.shields.io/badge/Status-v1.0--alpha-blue.svg)](./docs/specs/2026-05-18-ddt-v1-redesign-design.md)
[![Tests](https://img.shields.io/badge/Tests-104%2F104%20passing-brightgreen.svg)](./tests)

---

## 是什么

DDT 是一个 [Claude Code](https://claude.com/claude-code) 插件，把 **[obra/superpowers](https://github.com/obra/superpowers) 的工程纪律基底**（brainstorm → plan → implement，TDD，subagent 评审三角）和**面向政企/团队交付的治理外壳**（5 站固定链、唯一真相源、Iron Law 文件事实强制、AI 效能 ROI）合在同一条流水线里。

**一句话**：让任意 toB 项目，**任何团队成员**在 Claude Code 里敲下 `/ddt <一句话需求>`，得到一条**可复现、可问责、有文档留痕**的端到端交付流——而不是一次性的"看起来能跑的 demo"。

```
需求 ────► 契约 ────► 实现 ────► 验证 ────► 交付
（PRD）   （OpenAPI    （spec→plan   （评审+测试   （ROI 报告+
          /Schema）    →implement）  门控）        效能复盘）
```

---

## 适合谁

- ✅ **政企/B 端交付团队**：客户多角色、需求易变、要求过程可审计、强调质量门禁。
- ✅ **小到 10 人内、大到几十人协作的开发者**：需要让"AI 写的代码"和"人写的代码"接受同一套纪律。
- ✅ **想用 AI 提效但不愿牺牲工程质量的工程师**：想要 LLM 速度，但需要 hook 文件事实强制兜底防漂移。
- ⚠️ **不适合**：一次性脚本、个人玩具项目（用 superpowers 即可，DDT 的治理外壳是过度工程）。

---

## 为什么不直接用 Claude Code / superpowers

| 维度 | 裸 Claude Code | superpowers | **DDT** |
|------|---------------|-------------|---------|
| 写代码节奏 | 自由（容易跳过测试） | TDD 纪律（spec→plan→implement） | TDD 纪律（**继承 superpowers**） |
| 团队协作 | 无规约 | 弱（个人开发友好） | **强：5 站固定链 + SSoT 三档文件** |
| 决策可追溯 | 散落在对话里 | 部分 | **decisions.jsonl + changelog.jsonl 强制写入** |
| 多角色变更管控 | 无 | 无 | **Iron Law IL-1 ~ IL-7（hook 强制）** |
| 跳过质量门? | 一句话就跳过 | 弱告警 | **PreToolUse hook 真的拦下（IL-3）** |
| 契约稳定性 | 易漂移 | 弱 | **OpenAPI 唯一来源 + 写保护（IL-4）** |
| 效能复盘 | 无 | 无 | **被动埋点 + ROI 报告（/ddt 交付）** |

**DDT ≠ superpowers + 一堆 agents**。v1.0 推倒重来后，DDT 不再是"团队 agent 编排"，而是**纪律 + 治理的最薄外壳**：只有 2 个命令，所有"做事"都委托给 17 个 skill（其中 9 个直接 vendoring superpowers），所有"强制"都委托给 hook。

---

## 安装

需要 [Claude Code](https://claude.com/claude-code) ≥ 2.x，Node ≥ 22。

在 Claude Code 会话里：

```
/plugin marketplace add https://github.com/dhslegen/disciplined-delivery-toolkit
/plugin install disciplined-delivery-toolkit@disciplined-delivery-toolkit
/reload-plugins
```

安装后会出现两条命令：

- `/ddt <需求一句话或意图>` —— 总驱动闸门（路由到 5 站）
- `/ddt-status` —— 只读重算当前项目状态（IL-7 推理承载体）

---

## 5 分钟上手

在**任何一个项目目录**（不是 DDT 自己的目录！）打开 Claude Code，敲：

```
/ddt 我想给部门做一个会议室预订小工具，避免冲突，支持周期性预订
```

DDT 会**自动**：

1. **第 1 站 — 需求**：调用 `ddt-brainstorming` 头脑风暴 → 输出 `docs/specs/<日期>-<主题>-design.md`，等你审批；
2. **第 2 站 — 契约**：调用 `ddt-design` 落 OpenAPI / data model 到 `openapi/` 与 `schemas/`，hook 锁住写保护；
3. **第 3 站 — 实现**：调用 `ddt-writing-plans` 拆 WBS → `ddt-subagent-driven` 派发 **Implementer + Spec Reviewer + Quality Reviewer** 三角逐任务执行，TDD 强制；
4. **第 4 站 — 验证**：所有任务完成后 `ddt-verification` 跑 Final Reviewer + 全量测试；
5. **第 5 站 — 交付**：`ddt-deliver` 生成 ROI 报告 `docs/efficiency-report.md` 并归档 changelog。

任何时候敲 `/ddt-status` 看当前位置：

```
/ddt-status
→ 当前站：实现
→ 进行中任务：3/8（Task 4 BLOCKED：缺 schema 决策 D-2026-05-20-003）
→ 待决策：1 条（pending）
→ Iron Law 状态：IL-3 ✅  IL-4 ✅  IL-5 ⚠ 1 条 PASS 未引证
```

---

## 5 站脊柱

```
┌──────────┐   ┌──────────┐   ┌──────────────────────────────┐   ┌──────────┐   ┌──────────┐
│   需求    │   │   契约    │   │           实现                │   │   验证    │   │   交付    │
│          │──►│          │──►│  spec→plan→implement 弧线     │──►│          │──►│          │
│ PRD/SSoT │   │ OpenAPI  │   │  (subagent 三角 + TDD)         │   │ 评审+测试 │   │ ROI+归档 │
└──────────┘   └──────────┘   └──────────────────────────────┘   └──────────┘   └──────────┘
   ddt-brain    ddt-design     ddt-impl-spec → ddt-writing-plans   ddt-verifica  ddt-deliver
   storming                    → ddt-subagent-driven → ddt-tdd      tion
```

**站之间靠文件衔接，不靠对话记忆**。这是 toB 团队协作的根本：任何成员、任何时间、任何分支恢复，都能从文件状态精确算出"我在哪、下一步是什么"。

---

## Iron Laws（铁律）

7 条强制规则。**前 5 条由 hook 在 PreToolUse / Stop 时刻执行文件事实校验**，第 6/7 条由 charter skill 持续约束。违反时 hook 会**真的拦下工具调用**，不是温柔提示。

| ID | 规则 | 强制方式 | 文件来源 |
|----|------|---------|---------|
| IL-1 | 任何 commit 必须有 PRD/spec 引证 trailer | PreToolUse hook 校验 `Spec-Ref:` trailer | git log |
| IL-2 | 决策必须双向闭环（pending → resolved） | charter skill + `/ddt-status` 持续暴露 | `decisions.jsonl` |
| IL-3 | 待决策未解决时禁止进入下一站 | PreToolUse hook 阻断 | `decisions.jsonl` + `state/current.json` |
| IL-4 | OpenAPI / schema 路径写保护 | PreToolUse hook 阻断 `Write/Edit/MultiEdit/NotebookEdit` | 路径前缀 |
| IL-5 | 评审 PASS 输出必须引证文件 + 行号 | PreToolUse hook 校验 reviewer 输出格式 | review 文件结构 |
| IL-6 | Session 结束时必须更新 changelog 或显式跳过 | Stop hook 提醒 | `changelog.jsonl` |
| IL-7 | `/ddt-status` 必须基于**重算事实**，不基于记忆 | charter skill 约束 + 命令实现 | 所有 SSoT 文件 |

**为什么是文件事实？** LLM 上下文会丢、会幻觉、会自圆其说。文件不会。hook 只读文件、不读对话，所以**判定不可争辩**。

---

## SSoT 三档（唯一真相源层级）

| 档位 | 文件 | 谁能写 | 用途 |
|------|------|-------|------|
| 一档（永久） | `docs/specs/*.md`, `docs/plans/*.md`, `openapi/`, `schemas/` | 人工 + 经审批的 AI | 跨人跨时间的契约真相 |
| 二档（append-only 流水） | `.ddt/decisions.jsonl`, `.ddt/changelog.jsonl` | `bin/ddt-decisions-append.mjs` / `bin/ddt-changelog-append.mjs` | 决策 + 变更审计追溯 |
| 三档（工作态） | `.ddt/state/current.json`, `.ddt/metrics/<date>.jsonl` | command/hook 自动写 | 当前位置 + 被动度量埋点 |
| 衍生（不入库） | `docs/efficiency-report.md` | `bin/ddt-report.mjs` 重算生成 | ROI 视图（运行产物） |

**核心约束**：衍生信息**永远从一档+二档重算**，不持久化。这避免"派生数据腐烂"问题——LLM 重新打开项目时不会被过期摘要误导。

---

## 命令与 Skill 清单

### 命令（2 个，故意只有这么少）

- **`/ddt [一句话意图]`** —— 总驱动闸门。读 charter，分类意图，写 `.ddt/state/current.json`，路由到对应站的 discipline skill。
- **`/ddt-status`** —— 只读重算，调用 `bin/ddt-status.mjs` 输出当前事实快照。

### Skill 清单（17 个，3 组）

**治理外壳（DDT 原生，6 个）**：

- `ddt-charter` —— 宪法（Iron Laws、5 站地图、意图分类、SSoT 链、合理化反模式表）
- `ddt-design` —— 第 2 站契约（OpenAPI / data model 设计）
- `ddt-impl-spec` —— 第 3 站入口（把 spec 切片成可被 writing-plans 吃的 implement-spec）
- `ddt-design-source` —— 外部 UI 设计回环（v0/figma/claude.ai/design 集成）
- `ddt-frontend-craft` —— 前端直构（Lovable 风的本地路线，与 design-source 互补）
- `ddt-deliver` —— 第 5 站交付（ROI 报告 + 归档）

**纪律基底（vendoring superpowers，9 个）**：

- `ddt-brainstorming` ← brainstorming
- `ddt-writing-plans` ← writing-plans
- `ddt-subagent-driven` ← subagent-driven-development
- `ddt-executing-plans` ← executing-plans
- `ddt-tdd` ← test-driven-development
- `ddt-systematic-debugging` ← systematic-debugging
- `ddt-verification` ← verification-before-completion
- `ddt-requesting-review` ← requesting-code-review
- `ddt-receiving-review` ← receiving-code-review

> Vendoring 而非依赖：用户只装 DDT 一个 plugin 就能用全套，不需要先装 superpowers。每个 vendored skill 顶部都加了"DDT 强制层声明"段落，说明 hook 缺席时如何降级。原文照搬，授权保留（见 [LICENSE](./LICENSE) Third-Party Notices）。

**入口（开发者直接调用，1 个）**：

- `ddt-status-recompute` —— 内部供 `/ddt-status` 命令 dispatch（薄壳）

### Hooks（5 个）

| Hook ID | 触发时机 | 作用 |
|---------|---------|------|
| `ddt:charter-inject` | SessionStart | 把 charter 注入会话（让 LLM "记得" 宪法） |
| `ddt:enforce-pre` | PreToolUse `*` | 执行 IL-3 / IL-4 / IL-5 / IL-1 兜底 |
| `ddt:enforce-stop` | Stop | 执行 IL-1（commit trailer） / IL-6（changelog 提醒） |
| `ddt:metrics-post` | PostToolUse `*` | 被动埋点（工具调用计数、耗时、文件改动） |
| `ddt:metrics-end` | SessionEnd | 落 `.ddt/metrics/<date>.jsonl` |

---

## 项目结构

```
disciplined-delivery-toolkit/
├── .claude-plugin/
│   ├── marketplace.json     ← marketplace 注册
│   └── plugin.json          ← plugin 元数据
├── commands/                ← /ddt, /ddt-status
├── skills/                  ← 17 个 SKILL.md（6 原生 + 9 vendoring + 1 入口）
├── hooks/
│   ├── hooks.json           ← 注册 5 个 hook
│   └── handlers/            ← *.mjs handler 实现
├── bin/                     ← 7 个承重 CLI 工具
│   ├── ddt-status.mjs       ← /ddt-status 数据源
│   ├── ddt-decisions-append.mjs
│   ├── ddt-changelog-append.mjs
│   ├── resolve-tech-stack.mjs
│   ├── ddt-contract-lint.mjs
│   ├── ddt-hook-preflight.mjs
│   ├── ddt-report.mjs       ← ROI 报告生成
│   └── ddt-doctor.mjs       ← 健康检查
├── tests/                   ← node --test，零依赖，104 用例
│   ├── unit/
│   └── integration/
├── docs/
│   ├── specs/               ← v1.0 设计 SSoT
│   ├── plans/               ← 5 个实施计划
│   └── research/            ← 背景调研
├── LICENSE
├── README.md
└── package.json
```

---

## 技术原则

1. **零依赖**：`bin/`、`hooks/handlers/` 只用 Node 内置模块（`node:fs`、`node:path`、`node:child_process`）。`package.json` `dependencies: {}` `devDependencies: {}`。
2. **零网络**：DDT 运行时不联网。所有强制和决策来自本地文件。
3. **ESM `.mjs`**：所有脚本 ECMAScript Modules，Node ≥ 22。
4. **测试用 `node --test`**：不引第三方测试框架。
5. **Hook 只读文件、不读对话**：判定不可被对话上下文影响。
6. **`${CLAUDE_PLUGIN_ROOT}` 占位**：hooks.json 用占位符引用 handler，跨用户、跨安装目录、跨 plugin 名字都能工作。

---

## 配置与扩展

### 项目级技术栈

第一次跑时 DDT 会询问技术栈预设，写入 `.ddt/tech-stack.json`。后续直接复用。手动重置：

```bash
rm .ddt/tech-stack.json
# 下次 /ddt 会重新询问
```

### 自定义 Iron Law

`hooks/handlers/ddt-enforce.mjs` 是单文件 ~300 行。`bin/lib/ddt-facts.mjs` 是纯函数事实抽取。fork 后修改即可加自定义铁律。

### 添加新 skill

把新的 `SKILL.md` 扔进 `skills/<slug>/`，Claude Code 会自动发现。命名建议加 `ddt-` 前缀避免和其他 plugin 冲突。

---

## 已知边界（v1.0 → v1.x 待补）

诚实声明，避免"形似神异"：

- ⚠️ **`.ddt/state/current.json` 跨进程一致性未做真实环境验收**：在并发会话场景（两个 Claude Code 同时开）可能存在 race condition。当前实现是 last-write-wins。
- ⚠️ **`ddt-contract-lint` 对 YAML OpenAPI 仅做 scan，未做 schema 全验证**：JSON 是完整 lint，YAML 走的是简化路径。
- ⚠️ **Baseline 导入工具未做**：从历史项目导入 baseline 工时还需要手工编辑 `.ddt/metrics/`。
- ⚠️ **TDD-for-skills 对抗测试未做**：vendoring 的 9 个 superpowers skill 在 DDT 环境下的实际效果还需要 dogfood 验证。
- ⚠️ **多 harness 适配未做**：当前只验证过 Claude Code。Codex / Cursor / Gemini CLI 适配未做。

---

## 致谢

- **[Jesse Vincent (obra) & superpowers contributors](https://github.com/obra/superpowers)** —— 没有 superpowers 的纪律基底（brainstorm/plan/implement、TDD、subagent triangle、verification-before-completion），DDT 不会有这条脊柱。DDT v1.0 直接 vendoring 了 9 个 superpowers skill 原文（见 [LICENSE](./LICENSE) Third-Party Notices）。**DDT 是站在 superpowers 肩膀上**。
- **[ECC (Everything Claude Code)](https://github.com/anthropics/claude-code)** —— Claude Code plugin / hooks / skills / subagents 系统提供了治理外壳能挂载的基础设施。
- **DDT v0.x（digital-delivery-team）** —— 走过 6 阶段团队 agent 编排的路线，v1.0 是它的彻底重构。v0.x 在 `../digital-delivery-team` 保留不动。

---

## 协议

[MIT](./LICENSE) © 2026 赵文昊。

vendoring 的 superpowers skill 保留原 [MIT License](./LICENSE) Copyright (c) 2025 Jesse Vincent and superpowers contributors。

---

## 进一步阅读

- 设计 SSoT：[`docs/specs/2026-05-18-ddt-v1-redesign-design.md`](./docs/specs/2026-05-18-ddt-v1-redesign-design.md) —— v1.0 完整设计规格（247 行）
- 实施计划（5 个）：[`docs/plans/`](./docs/plans/) —— 从 Foundation 到 Metrics+ROI
- 背景调研：[`docs/research/`](./docs/research/) —— superpowers 深度调研 + 领导愿景
