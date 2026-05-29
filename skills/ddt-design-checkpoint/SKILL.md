---
name: ddt-design-checkpoint
description: Use after ddt-brainstorming and before ddt-writing-plans — the design landing gate. Trigger when a design spec is about to enter ddt-writing-plans, or when a large requirement has been split into slices and each slice is about to be deep-designed. Also trigger whenever about to advance a design by self-answering a yes/no checklist at the end of a spec — that does not pass this gate.
---

# ddt-design-checkpoint — 设计落地闸

设计本身在 brainstorming/spec 阶段已产出；这道闸只核「设计碰到的每种真相是否都锚在真实之物上」——不是设计生成器、不是判断题答卷。

## 守的是「兑现守恒」，不是「产物存在」

**存在 ≠ 兑现**：契约 doc 在盘上 ≠ 它和真 provider 一致；"前端走 bundle"答了"长什么样" ≠ 答了"谁写实现代码"。度量"存在"两头出病——给没人消费的内部细节堆文档（过产），又对消费的契约、继承的职责放任不核（欠产）。

闸核三种真相，每种锚到真实之物，不停在 spec 的自我声明：

- **我产出的** → 资产文件就位（Q1-5：契约/数据触及即强制，设计按 consumer-pull）
- **我消费的** → 对真 provider 源/样本核过（Q6 · 消费契约纲领）
- **我继承的** → 上游派的职责逐条有归属（Q7 · 职责守恒纲领）

两条纲领见 `using-ddt`。

## 完成清单

> 留痕规则：`docs/api`/`docs/data` **触及即强制**——只要本切片新增/修订/触及接口契约或数据模型就必须落资产，**不论是否被别切片消费**（执行人/toB/评审都看）；资产可 amend 别切片的，前提是追加决策记录 + 同步代码级真相。**只有 `docs/design/` 按 consumer-pull**（Q3）。

**簇一 · 我产出的资产**
1. **`docs/api/`** — 触及 API 契约（OpenAPI/RPC schema/接口签名）→ 写入或 amend `docs/api/<name>.{yaml,md}`，含调用方/被调方约定。
2. **`docs/data/`** — 数据模型新增/修订/迁移 → 写入或 amend `docs/data/<name>.md`，含字段/约束/迁移路径。
3. **`docs/design/`（consumer-pull）** — 仅当**有下游切片/接手人/reviewer 会据此对齐、且代码里读不出来**才产：跨切片架构、跨模块流程/时序、复用的难点算法、影响多处的选型 ADR。只记"为什么"；纯本切片内部 rationale 不强制；代码读得出来的实现细节抄进来 = 会漂的废纸。（`docs/design/` 下还可能有 `docs/design/frontend/` 的前端 bundle——那是**视觉真相**，归"前端分流 / `ddt-design-source`"管，**不走** Q3 的 consumer-pull 取舍。）
4. **`.ddt/decisions.jsonl`** — 需固化为团队决策的，经 `ddt-decisions-append.mjs` 追加（写 spec 里不算）。
5. **`.ddt/changelog.jsonl`** — 显著变更经 `ddt-changelog-append.mjs` 入账。

**簇二 · 我消费的 + 我继承的**
6. **消费契约对真源核过？** 消费别切片/外部 provider 的接口/事件/数据 → 有一份从**真 provider 源或真样本**核出的 `observed` 契约（`docs/api/<x>-observed.md`，或 spec 内贴源码关键签名：路径/字段/帧 type/鉴权），且 mock 派生自它并标来源。脑补形状、漂移旧 doc、自写 stub 都不许。真 backend 跑不起 → 读 in-repo 源贴签名；连源都没有 → 记 deferral。
7. **上游职责守恒？** 对着 brief 正文逐条勾，每条职责（含最常被静默丢的前端 UI / 登录 / 权限）都有归属：设计了 / 建 Task / 显式 deferral / 划给别切片。**静默丢 = 不通过**，别只盯后端。
8. **开放问题已表态？** 未解冲突/待协同项写明，且**显式判"放行（带已知开放项）"或"阻断"**——含糊不算。

**可推进**：Q1-7 每条 ✅/⏸/➖ 且 Q8 为"放行"，方进 `ddt-writing-plans`。

## 三种状态（其它都不通过）

- **✅ 已落地** — 证据已在：资产含真内容 / 决策已入账 / observed 契约已核且 mock 派生自它 / 职责有归属。非空壳、占位、脑补。
- **⏸ 已推迟** — 暂无法落地（待协同确认 / 信息未齐 / 真源够不着），已用 `ddt-decisions-append.mjs` 追一条 `deferral`（原因 + 何时补）。这条 decision 即证据。
- **➖ 不适用** — 门槛随问而异：Q1/Q2 看"触没触及"（触及就必须产，与是否被消费无关）；Q3 看"有没有下游要"；**Q6/Q7 门槛最高——"读过 doc 了""走 bundle 了"都不算 ➖**，必须对真源核、对 brief 勾。

判状态靠**查文件系统 / 查 `.ddt/decisions.jsonl` / 对 brief 正文勾(Q7) / 对真 provider 源核(Q6)**，不靠回忆。

## 粒度

- **单 brief（默认）**：一份 design spec 进 `ddt-writing-plans` 前过。
- **大需求级**：`ddt-large-requirement` 拆出架构 + 切片方案后、逐片深做前过——**仅当**有跨切片、无单 brief 归属的全局判断（总体架构、技术栈、实时通道选型、跨切片流程/时序），且**只落全局层**（落 `docs/design/` + `.ddt/decisions.jsonl`）。各切片局部契约/设计留痕留给各自 Checkpoint，不在此预支。

## 前端分流

含前端的切片先看 `docs/design/frontend/`：**空且无 opt-out** → 先 `ddt-design-source` 整体设计一次；**非空** → 实现前必读 bundle 自带 handoff 入口、按它消费源码；**有 opt-out decision** → 用设计系统直接实现。bundle 解决"长什么样"不解决"谁写实现"——含前端仍要过 Q7。详见 `ddt-design-source`。

## 自检 & deferral

通过**前**跑 `ddt-doctor.mjs` 看 [B] 段对账：✅ 项对 doctor 确认文件真存在、⏸ 项对 `.ddt/decisions.jsonl` 确认 deferral 真入账。**Q6/Q7 doctor 查不到**，靠你对真源、对 brief 勾。路径按内容含义命名，但必须真存在且内容非空。

```bash
cat <<'EOF' | ddt-decisions-append.mjs
{"type":"deferral","scope":"<api|data|design|consumed-contract|responsibility>","item":"<决策点>","reason":"<待确认 / 信息未齐 / 真 provider 够不着>","resolve-by":"<何时/何条件补>"}
EOF
```

## 常见反模式

| 反模式 | 为什么不通过 |
|---|---|
| spec 末尾写"自答表"答完就推进 | 答表是主观判断不是资产；每个"是"要么产文件、要么写 deferral |
| "改动小，写答表就够了" | "小"是逃逸口；进 writing-plans 就过同一道闸（真小到全 ➖ 自然零产出，不是简化版闸） |
| 消费上游只读旧 doc / 脑补就写代码 | doc 漂移、脑补空中楼阁，mock 据此写则一片绿全自证 → Q6 对真源核 observed |
| reviewer 抓到契约对不上，只补 stub 消报错 | 一项被臆想，同源其它项都可疑 → 触发**全量契约复核**，别当孤立 bug |
| brief 派了前端/登录/权限，用"走 bundle"搪塞 | bundle 是视觉真相非实现归属，职责静默蒸发 → Q7 逐条勾 |

## 关系

上游 `ddt-brainstorming`（产 spec；spec 的影响面分析是本闸**输入**非输出）→ 本闸 → 下游 `ddt-writing-plans`。工具：`ddt-decisions-append.mjs` / `ddt-changelog-append.mjs`；路径权威：`ddt-doctor.mjs` [B] 段。
