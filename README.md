# DDT — Disciplined Delivery Toolkit

> **superpowers 纪律基底 ⊕ toB 交付治理**
> Claude Code plugin for disciplined, auditable, multi-stakeholder AI-assisted delivery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-43853d.svg)](./package.json)
[![Status](https://img.shields.io/badge/Status-v1.0--alpha-blue.svg)](./docs/specs/2026-05-22-ddt-superpowers-faithful-redesign-design.md)
[![Tests](https://img.shields.io/badge/Tests-130%2F130%20passing-brightgreen.svg)](./tests)

---

## 是什么

DDT 是一个 [Claude Code](https://claude.com/claude-code) 插件，在 **[obra/superpowers](https://github.com/obra/superpowers) 工程纪律基底**旁边增加四项轻量治理增强：大需求先变小、小问题用 superpowers 做深、设计进计划前过闸、需要交付时再收口。

**DDT 在 superpowers 边上，不替代它，不垄断入口。** superpowers 的 `brainstorming → writing-plans → implementation → review` 是微观主链路，DDT 不打断它。

**四句北极星**：

- 大需求先变小。
- 小问题用 superpowers 做深。
- 设计进计划前过闸。
- 需要交付时再收口。

---

## 适合谁

- ✅ **政企/B 端交付团队**：客户多角色、需求易变、要求过程可审计、强调质量门禁。
- ✅ **小到 10 人内、大到几十人协作的开发者**：需要让"AI 写的代码"和"人写的代码"接受同一套纪律。
- ✅ **想用 AI 提效但不愿牺牲工程质量的工程师**：想要 LLM 速度，但需要 hook 文件事实强制兜底。
- ⚠️ **不适合**：一次性脚本、个人玩具项目（用 superpowers 即可，DDT 的治理外壳是过度工程）。

---

## 与裸 Claude Code / superpowers 的区别

| 维度 | 裸 Claude Code | superpowers | **DDT** |
|------|---------------|-------------|---------|
| 写代码节奏 | 自由（容易跳过测试） | TDD 纪律（brainstorm → plan → implement → review） | TDD 纪律（**继承 superpowers**） |
| 团队协作 | 无规约 | 弱（个人开发友好） | **决策/变更账本 + 多切片协作** |
| 决策可追溯 | 散落在对话里 | 部分 | **`.ddt/decisions.jsonl` + `.ddt/changelog.jsonl`** |
| 设计进计划前 | 无门控 | 无 | **Design Checkpoint（七问习惯）** |
| 评审引证强制 | 无 | 弱告警 | **IL-5：PreToolUse hook 真的拦下** |
| 收口证据 | 无 | 无 | **`ddt-deliver`（按需）ROI 报告** |

**DDT ≠ superpowers + 一堆 agents**。v1.0 是最薄治理外壳：2 个命令、13 个 skill（9 个直接 vendoring superpowers）、4 个 hook、所有"做事"委托给 skill。

---

## 安装

需要 [Claude Code](https://claude.com/claude-code) ≥ 2.x，Node ≥ 22。

在 Claude Code 会话里：

```
/plugin marketplace add https://github.com/dhslegen/disciplined-delivery-toolkit
/plugin install disciplined-delivery-toolkit@disciplined-delivery-toolkit
/reload-plugins
```

> ⚠️ **如果你之前装过 `digital-delivery-team`（v0.x DDT，schema_version 1）必须先卸载**：v0.x 的 hook 仍会在 cwd 偷偷写 `.ddt/progress.json` 污染所有项目。`/ddt 自检` 会检测此残留并提示。卸载方式：`/plugin uninstall digital-delivery-team`。

安装后会出现两条命令：

- `/ddt [一句话意图]` —— 向导闸门，按上下文引导下一步
- `/ddt-status` —— 只读重算当前项目状态

### 如何确认拿到最新版本

**alpha 阶段不使用语义版本**，`.claude-plugin/plugin.json` 不设 `version` 字段——Claude Code [官方策略](https://code.claude.com/docs/en/plugins-reference#version-management)：未设 version 时用 git commit SHA 作为版本，**每个 commit 都是新版**，`/plugin marketplace update` 一定能拿到最新。

确认当前装的是哪个 commit：

```
/plugin                    # 进 plugin 管理界面
# 选 Installed → disciplined-delivery-toolkit
# Version 行显示的就是 commit SHA（短 hash）
```

对照 GitHub 当前 main 的 HEAD：

```bash
gh api repos/dhslegen/disciplined-delivery-toolkit/commits/main --jq .sha[0:7]
# 或浏览器打开 https://github.com/dhslegen/disciplined-delivery-toolkit/commits/main
```

两者一致 = 你装的就是 main 最新。不一致 = 需要：

```
/plugin marketplace update disciplined-delivery-toolkit
/reload-plugins
```

> alpha 阶段高频更新。如发现 hook 报错或 IL-5 失效，先 `/plugin marketplace update` + `/reload-plugins` 再排查。stable 发布时切回语义版本（`1.0.0`、`1.0.1`...），届时 bump 才意味着新版。

---

## 5 分钟上手

在**任何一个项目目录**（不是 DDT 自己的目录！）打开 Claude Code，敲：

```
/ddt 我想给部门做一个会议室预订小工具，避免冲突，支持周期性预订
```

DDT 会根据当前项目状态**向导**：

- 无 spec → 引导调用 `ddt-brainstorming`，产 `docs/specs/` 设计文档，等你审批；
- 有 spec 未过闸 → 引导 `ddt-design-checkpoint`（七问），判定是否进入 planning；
- 过闸后 → 引导 `ddt-writing-plans` 拆任务 → `ddt-subagent-driven` 三角执行（TDD 强制）；
- 完成后 → 按需用 `ddt-deliver` 收口，生成 ROI 报告。

任何时候敲 `/ddt-status` 看当前位置：

```
/ddt-status
→ 当前阶段：实现
→ 进行中任务：3/8
→ 待决策：1 条（pending）
→ IL-5 hook 状态：✅ 已注册
```

---

## 三种入口（解释，不是强制路由）

1. **开发者局部想法** → 直接 superpowers 原生链路。bug / 重构 / 测试补强 / 性能 / 探索都走这条。
2. **大需求** → 先跑一条 superpowers 链路把它当**文档资产**实现，产 `docs/requirements/` + `docs/briefs/`，再逐个处理。
3. **brief 驱动** → brief → brainstorming → Design Checkpoint → writing-plans → implementation → review。

不是所有工作都要 requirements/briefs，也不是所有工作都要 verification/delivery。右尺寸。

---

## 命令与 Skill 清单

### 命令（2 个，故意只有这么少）

- **`/ddt [一句话意图]`** —— 向导闸门。读取项目状态，按上下文引导下一步；不拦截自由工作。
- **`/ddt-status`** —— 只读重算，调用 `bin/ddt-status.mjs` 输出当前事实快照。

### Skill 清单（13 个，2 组）

**治理外壳（DDT 原生，4 个）**：

- `using-ddt` —— 取向文档（SessionStart 注入；四句北极星、三种入口、路径即指令）
- `ddt-design-checkpoint` —— 设计过闸（七问习惯，设计进计划前的最小留痕）
- `ddt-deliver` —— 收口（按需：ROI 报告 + 决策/变更归档）
- `ddt-design-source` —— 外部 UI 设计回环（v0/figma/claude.ai/design 集成，按需）

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

### Hooks（4 个，L2 强制层）

| Hook ID | 触发时机 | 作用 |
|---------|---------|------|
| `ddt:inject` | SessionStart | 把 `using-ddt` 注入会话（取向、路径规约） |
| `ddt:enforce-pre` | PreToolUse `*` | **唯一硬闸**：IL-5 reviewer 输出须含引证才能通过 |
| `ddt:metrics-post` | PostToolUse `*` | 被动埋点（工具调用计数、耗时、文件改动） |
| `ddt:metrics-end` | SessionEnd | 落 `.ddt/metrics/YYYY-MM-DD.jsonl` |

**强制层定位（L2）**：行为为主 + 唯一 IL-5 牙。纪律主要由 vendored skill 内容承载；IL-5 是唯一 hook 硬拦的规则（reviewer PASS 必须有 cited_evidence）。其余原则由 skill 原文和 using-ddt 约束，不靠闸机强制。

---

## 唯一引证规则（IL-5）

reviewer（spec / quality / final）写 `docs/reviews/<task-id>-<role>.json` 时，结构须为：

```json
{ "task_id": "...", "reviewer_role": "spec|quality|final", "verdict": "PASS|FAIL",
  "cited_evidence": ["文件:行 / 命令输出 / 测试名，PASS 时 ≥1 条"],
  "issues": [{ "severity": "critical|important|minor", "where": "文件:行", "note": "..." }],
  "ts": "ISO8601" }
```

`verdict=PASS` 时 `cited_evidence` 必须非空，否则 PreToolUse hook 拦截写入。其余都是原则，不是闸机。

---

## 物理结构

```
disciplined-delivery-toolkit/
├── .claude-plugin/
│   ├── marketplace.json     ← marketplace 注册
│   └── plugin.json          ← plugin 元数据
├── commands/                ← /ddt, /ddt-status
├── skills/                  ← 13 个 SKILL.md（4 原生 + 9 vendoring）
├── hooks/
│   ├── hooks.json           ← 注册 4 个 hook
│   └── handlers/            ← *.mjs handler 实现
├── bin/                     ← 承重 CLI 工具（零依赖）
│   ├── ddt-status.mjs       ← /ddt-status 数据源
│   ├── ddt-decisions-append.mjs
│   ├── ddt-changelog-append.mjs
│   ├── resolve-tech-stack.mjs
│   ├── ddt-contract-lint.mjs
│   ├── ddt-hook-preflight.mjs
│   ├── ddt-report.mjs       ← ROI 报告生成
│   └── ddt-doctor.mjs       ← 健康检查
├── tests/                   ← node --test，零依赖，130 用例
│   ├── unit/
│   └── integration/
├── docs/
│   ├── specs/               ← design spec 集合
│   ├── plans/               ← 实施计划
│   └── research/            ← 背景调研
├── LICENSE
├── README.md
└── package.json
```

**项目 docs/.ddt 路径规约**（以你自己的项目为例）：

```
<your-project>/
├── docs/
│   ├── requirements/        ← 大需求切片输入（按需）
│   ├── briefs/              ← 切片 brief（按需）
│   ├── specs/               ← design spec
│   ├── plans/               ← writing-plans 产出
│   ├── reviews/             ← reviewer 证据（IL-5 校验对象）
│   ├── api/                 ← OpenAPI / 契约（按需）
│   ├── data/                ← data model（按需）
│   ├── design/              ← UI/架构设计（按需）
│   ├── verification/        ← 验收证据（按需）
│   └── delivery/            ← 交付说明（按需）
└── .ddt/
    ├── decisions.jsonl      ← 人工决策账本（入 git）
    ├── changelog.jsonl      ← 变更账本（入 git）
    ├── state/               ← 工作态（transient，不入 git）
    └── metrics/             ← 被动度量（transient，不入 git）
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

### 多人协作

DDT 用 **git native 能力** + 2 个轻约定支持团队多人协作，**不自创新机制**：

**1. `.gitattributes` union merge driver**：解决两人并发 append `decisions.jsonl`/`changelog.jsonl` 时的 git conflict。**复制 plugin 仓库根的 `.gitattributes` 到你项目根**即可：

```bash
# 在你的项目根
curl -O https://raw.githubusercontent.com/dhslegen/disciplined-delivery-toolkit/main/.gitattributes
# 或手动创建，内容见 plugin 仓库根的 .gitattributes
```

`/ddt 自检` 会检测项目根有没有 union merge 配置，缺失时提示你加。

**2. 切片 branch 命名约定 `slice/<slice-id>`**：每个切片在独立 git branch 上开发：

```bash
git checkout -b slice/us-3       # 起切片
git push -u origin slice/us-3    # push 让团队看见 = claim
# ... 开发 ...
# merge 回 main 后删 branch = release
```

`/ddt-status` 会自动 `git for-each-ref` 列出所有 `slice/*` branch，**输出"谁在做什么切片"给团队**——不需要新 SSoT 文件，git branch 本身就是 ground truth。

> ⚠️ **多人协作的局限**：当前只做了基础协作支持（避免 jsonl 冲突 + 切片可见性）。**未做**：跨 plugin 版本协商、共享 review 状态、错误恢复协调。stable 阶段补足。

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

- 重设计规格：[`docs/specs/2026-05-22-ddt-superpowers-faithful-redesign-design.md`](./docs/specs/2026-05-22-ddt-superpowers-faithful-redesign-design.md) —— v1.0 完整设计规格
- 实施计划：[`docs/plans/`](./docs/plans/)
- 背景调研：[`docs/research/`](./docs/research/) —— superpowers 深度调研 + 领导愿景
