---
name: ddt-design-checkpoint
description: Use after ddt-brainstorming and before ddt-writing-plans — the design landing gate. Each "yes" in the seven-item checklist binds to a real artifact (a file under docs/api,data,design or a decisions.jsonl deferral entry) that MUST exist before ddt-writing-plans starts. Writing a Q&A table at the end of a spec is NOT passing this gate; the artifacts have to be on disk.
---

# ddt-design-checkpoint — 设计落地闸（资产就位，不是答完表）

**它不是设计生成器**——设计本身在 ddt-brainstorming/spec 阶段已产出。
**它不是 ddt-brainstorming 替代**——发散与设计探索在 ddt-brainstorming 里做。
**它不是判断题答卷**——七问每个"是"都必须有**对应的真实落地资产**就位，否则闸不算通过。

## 为什么这道闸必须真的落地

`ddt-writing-plans` 的输入应该是**已锁定的设计**。若契约、数据模型、架构决策仅以"七问答表"形式停在 spec 末尾，会发生三件事：

- plan 基于纸面承诺推任务（"实现 X 接口"，但 X 的契约根本不存在）；
- 实现阶段在没有锁定契约的情况下自由发挥；
- reviewer 阶段没有锁定的契约可依，**证据先于断言**的原则被破坏。

所以闸的判据不是"答完七问"，而是"资产真的存在或推迟决策真的入账"。

## 七问完成清单

设计推进到下一落地阶段（单 brief → `ddt-writing-plans`，或大需求 → 逐切片深做）之前，**逐条核对每条的状态**：

1. **`docs/api/` 资产已就位？** 本次设计若新增或修订 API 契约（OpenAPI / RPC schema / 接口签名），对应文件已写入 `docs/api/<name>.{yaml,md}`，内容含调用方/被调方约定。
2. **`docs/data/` 资产已就位？** 若涉及数据模型新增/修订/迁移，对应文件已写入 `docs/data/<name>.md`，内容含字段、约束、迁移路径。
3. **`docs/design/` 资产已就位？** 若有重要架构决策（选型、模式、跨模块边界），ADR 已写入 `docs/design/<topic>.md`，内容含决策与理由。
4. **`.ddt/decisions.jsonl` 已追加？** 凡需要持久化为团队决策的条目，已经 `ddt-decisions-append.mjs` 追加（写在 spec 里不算）。
5. **`.ddt/changelog.jsonl` 已追加？** 凡构成显著变更的事项，已经 `ddt-changelog-append.mjs` 入账。
6. **开放问题已表态？** 未解决冲突 / 待协同确认项已写明（spec 内或 `docs/design/<topic>-open-questions.md`），且**显式判断为"放行（带已知开放项）"还是"阻断（暂不进 writing-plans）"**——含糊不算表态。
7. **可推进闸：** 上面 1-5 每条为 ✅（已落地）/ ⏸（已记 deferral）/ ➖（不适用），且 Q6 表态为"放行"，方可进 `ddt-writing-plans`。

## 三种合法状态（其它状态都不通过）

每条清单项**只能**处于以下三种状态之一：

- **✅ 已落地**：对应文件已存在并包含设计内容（不是空壳，不是占位）。
- **⏸ 已推迟**：当下无法完整落地（需协同方确认 / 信息未齐），**已用 `ddt-decisions-append.mjs` 追加一条决策**，body 显式标 `deferral` + 推迟原因 + 何时/何条件下补。这条 decision 本身就是闸的证据。
- **➖ 不适用**：本次设计完全不触及该方面（例如纯前端体验调整不动 `docs/api/`）。

**不允许的状态**：在 spec 末尾写"影响 docs/api：是"但 `docs/api/<name>` 不存在且无 deferral decision——这是**纸面承诺**，闸不通过。

判断现在是哪种状态，靠**查文件系统**（文件在不在、内容空不空）和**查 `.ddt/decisions.jsonl`**（deferral 条目在不在），不靠 LLM 主观回忆。

## 在什么粒度运行

- **单 brief（默认）**：一份 design spec 进 `ddt-writing-plans` 前过。
- **大需求级**：ddt-brainstorming 把大需求拆成架构 + 切片方案后、逐片深做之前过——**仅当**有跨切片、无单 brief 归属的全局判断（总体架构、技术栈、实时通道选型等）时才过，且**只落全局层**（架构落 `docs/design/`、全局决策落 `.ddt/decisions.jsonl`）。各切片的局部 API/data 契约**留给各 brief 自己的 Checkpoint**，不在此预支。

## 前端分流

含前端的切片，先看 `docs/design/frontend/` 状态：

- **空且无 opt-out decision** → 先 `ddt-design-source` 外部整体设计一次（粒度按项目判断）；
- **非空** → 按 bundle 实现；
- **有 opt-out decision** → 用设计系统直接实现。

详见 `ddt-design-source`。

## 通过自检

Checkpoint 通过**前**，跑一次 `ddt-doctor.mjs` 看 [B] 段——doctor 知道当前 repo 里哪些路径已就位。把七问清单的 ✅ 项对照 doctor 输出确认文件真的存在；把 ⏸ 项对照 `.ddt/decisions.jsonl` 末尾几条确认 deferral 真的入账。这是最后一道客观自检。

路径按内容含义命名，没有固定模板，但**必须真的存在**且**内容非空**。

## 常见反模式（自我警觉清单）

| 反模式 | 为什么不通过 | 正确做法 |
|---|---|---|
| 在 spec 末尾写"七问答表"，每条答"是/否"就推进 | 答表不是资产 | 每个"是"要么产出文件，要么写 deferral decision |
| "本次改动较小，写答表就够了" | "小"是逃逸口；只要进 writing-plans 就过同一道闸 | 真的小到清单全为 ➖，自然零产出；不是简化版闸 |
| "契约还要和上游确认，先进 plan 再说" | plan 会基于不存在的契约推任务 | 显式写 deferral decision，或暂不进 plan |
| "设计写在 spec 里也算落地" | spec 是脉络，不是契约；下游 reviewer 找不到锁定点 | 资产单独落 `docs/api,data,design` 对应路径 |
| 创建空文件 `docs/design/<topic>.md` 占位 | 空壳骗通过 | 文件必须含决策内容；doctor 只查存在性，内容空否要自检 |
| 自我授权"我已经做过 Checkpoint 了" | 没有客观证据 | 通过判据是文件存在 + deferral 入账，不是 LLM 主观判断 |
| 把 ddt-brainstorming 输出的"影响面分析"段当成 Checkpoint 完成 | brainstorming 产的是设计 spec，不是落地资产 | spec 里的影响面分析是 Checkpoint 的**输入**，不是其**输出** |
| "已在 spec 里答完七问，invoke 是复读 / 浪费 token" | spec 七问是 LLM 主观判断；checkpoint 是文件系统 + `.ddt/decisions.jsonl` 客观核验。**两件事，不重复** | 用 `ls` / `tail` / `ddt-doctor.mjs` 拿真实状态，不靠回放七问表 |

## 与其他 skill 的关系

- 上游：`ddt-brainstorming`（产设计 spec）
- 下游：`ddt-writing-plans`（Checkpoint 通过后进入）
- 落地工具：`ddt-decisions-append.mjs`、`ddt-changelog-append.mjs`
- 路径权威：`ddt-doctor.mjs` [B] 段
