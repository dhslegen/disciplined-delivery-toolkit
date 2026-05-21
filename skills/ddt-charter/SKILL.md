---
name: ddt-charter
description: Use at the start of every DDT session and before any DDT pipeline action — the DDT constitution governing Iron Laws, skill priority, the 5-station spine, intent classification, and the SSoT hierarchy.
---

# DDT 宪法（强制层注入源）

本文件由 SessionStart hook 无条件注入每会话首条 prompt。离开该 hook，本宪法仅为磁盘文本。

## Iron Laws（绝对，不可合理化绕过）

- IL-1 无新鲜执行证据不得声明完成
- IL-2 无根因调查不得修复
  - IL-2 本土化：bug 修复 commit 必含 trailer `root-cause-ref:<调查记录路径>` 或 `root-cause:<一句话归因>`；缺则视为未做根因（建议级——本宪法当前无 IL-2 hook，靠 ddt-systematic-debugging skill 与 review 强制）。
- IL-3 无批准 spec 不得实现；无 spec 不得 plan
- IL-4 下层不得私改上层 SSoT（设计 spec > 契约 > 代码；越级只能 escalate）
- IL-5 reviewer 无引证不得 PASS（反乐观）
- IL-6 漂移不可出包
- IL-7 进度不自报（从 git + 证据反推）
  - IL-7 落点：进度反推由 `/ddt-status` 命令实现，读 git trailer + decisions.jsonl + spec/plan 文件存在性算下一步，不信会话自述。本宪法当前无 IL-7 hook，进度声明须显式标注「未受 /ddt-status 校验」。

## Skill 优先级

DDT vendored 纪律 skill 与本宪法覆盖默认行为，但低于用户显式指令。若 1% 可能某纪律 skill 适用，必须先 invoke 它。

## 5 站固定链（不变量，不可增删）

需求 → 契约 → 实现 → 验证 → 交付。每站后一道人工闸门。需求站等同本土化 ddt-brainstorming。

## 意图分类（/ddt 自由文本路由规则）

归类为：起项目 / 改需求 / 新需求 / bug / 重构 / 局部重跑。bug 走 ddt-systematic-debugging；其余进同一 spec→plan→implement 循环，证据量按风险右尺寸化，触及 认证/授权/资金/数据迁移/契约/用户数据删除/部署配置 任一恒最高硬度。

## SSoT 铁律链 + 路径硬清单

真相核心：**设计 spec 集合**（多文件平等组成）、decisions.jsonl、changelog.jsonl，外加契约（docs/ssot/openapi/）。git 历史即进度账本。下层发现上层错只能 escalate，绝不私改。

**SSoT 路径地图**（**唯一权威位置**，LLM 禁止自由发挥到别处）：

| 类型 | 路径 | 性质 | 写入方式 |
|------|------|------|---------|
| 设计 spec 集合（项目级 + 切片级，平等） | `docs/specs/YYYY-MM-DD-<slug>-design.md` | SSoT 真相 | ddt-brainstorming（项目级/topic 级）或 ddt-impl-spec（切片级）写 |
| 决策账本 | `docs/ssot/decisions.jsonl` | SSoT 真相 | 仅经 `bin/ddt-decisions-append.mjs` append |
| 变更账本 | `docs/ssot/changelog.jsonl` | SSoT 真相 | 仅经 `bin/ddt-changelog-append.mjs` append |
| 契约 | `docs/ssot/openapi/*.yaml` | SSoT 铁律链次层 | ddt-design 写；变更走 changelog escalation |
| 架构决策 | `docs/architecture/YYYY-MM-DD-<topic>.md` | SSoT 派生 | ddt-design 写；与契约同期产出 |
| 数据模型 schema | `docs/ssot/openapi/components/schemas/<entity>.yaml`（内嵌于 OpenAPI components） 或 `schemas/<entity>.json`（独立 JSON Schema 时） | SSoT 派生 | ddt-design 写 |
| 切片 plan（衍生） | `docs/plans/YYYY-MM-DD-<slug>-plan.md` | SSoT 派生 | ddt-writing-plans 写 |
| reviewer 输出（衍生） | `docs/reviews/<task-id>-<reviewer-role>.json` | SSoT 派生 | reviewer subagent 写（IL-5 校验对象） |
| 命令→hook 字段桥 | `.ddt/state/current.json` | **transient**（不入 git） | `/ddt` 命令覆盖写 |
| 度量埋点 | `.ddt/metrics/YYYY-MM-DD.jsonl` | **transient**（不入 git） | PostToolUse/SessionEnd hook append |

**LLM 严禁创造的错误路径**：

- ❌ `.ddt/prd/*.md` / `docs/ssot/prd.md`（PRD 仪式已撤回，需求站产物是设计 spec，不是 PRD）
- ❌ `.ddt/decisions.jsonl` / `.ddt/changelog.jsonl`（SSoT 真相必入 git，住 docs/ssot/）
- ❌ `.ddt/reviews/*.json`（reviewer 输出需 git 跟踪，住 docs/reviews/）
- ❌ `docs/superpowers/specs/` / `docs/superpowers/plans/`（vendoring 原路径，已本土化）
- ❌ 项目根 `openapi/` / `prd.md` / `schemas/`（SSoT 必须在 docs/ 下，与 docs/ssot/ 边界一致）

**如果你不确定该写哪**：跑 `ddt-doctor.mjs` 看 [B] 段输出的 SSoT 路径清单——doctor 是真相，charter 是规则。

## Rationalization 反驳表

- 先不做也能演示 → 演示不等于交付；纳入本批未实现即出包等于交付欺诈。
- 契约写错顺手改 → IL-4 越级私改即漂移，escalate 走变更门。
- reviewer 觉得行 → IL-5 无引证只是乐观，非 review。
- 都手测过了 → ad-hoc 不等于系统化；无新鲜证据即未完成。
- 反正 plan/impl 没人查 spec 是否真批了 → IL-3 hook 查 decisions.jsonl，无 approved 即 block。
- 这个契约小改我顺手就行 → IL-4 hook 查 diff 路径与 changelog escalation，无即 block；私改即漂移。
- reviewer 说 PASS 就完事 → IL-5 hook 校验 docs/reviews/*.json 的 cited_evidence，PASS 无引证即 block。

## IL-5 Reviewer 输出规范（内嵌，无需外部文件引用）

每次 reviewer subagent 给出 PASS/FAIL 判定时，**必须**把判定写入：

`docs/reviews/<task-id>-<reviewer-role>.json`

其中 `<reviewer-role>` ∈ `spec` | `quality` | `final`。

### Schema

```json
{
  "task_id": "<plan 文件里的 Task N 标识>",
  "reviewer_role": "spec | quality | final",
  "verdict": "PASS | FAIL",
  "cited_evidence": [
    "<引证 1：行号/文件/实跑输出片段，至少 1 条；verdict=PASS 时必填非空>",
    "..."
  ],
  "issues": [
    { "severity": "critical | important | minor", "where": "<文件:行>", "note": "<问题描述>" }
  ],
  "ts": "<ISO8601 UTC>"
}
```

### IL-5 强制规则

- `verdict=PASS` 时 `cited_evidence` 必须为非空数组（长度 ≥ 1），每条须含具体证据（文件路径、行号、命令输出片段或测试名）。
- IL-5 hook 校验：PreToolUse Write/Edit on `docs/reviews/*.json` 时，若 PASS 但 cited_evidence 缺失/空 → block 写入并要求 reviewer 补证据。
- `verdict=FAIL` 时 `issues` 应非空。

## 切片 branch 命名约定（多人协作）

每个切片在独立 git branch 上开发，命名为 **`slice/<slice-id>`**（如 `slice/us-3`、`slice/auth-jwt`）。

- **起手**：`git checkout -b slice/us-3` 然后立刻 `git push -u origin slice/us-3` —— push 让团队成员通过 `/ddt-status` 看见这个切片已被你 claim。
- **进行中**：所有该切片的 commit 都在 `slice/<id>` branch 上。`/ddt-status` 跑 `git for-each-ref` 反推所有 `slice/*` branch 输出"在做谁"。
- **收尾**：merge 到 main 后删除 branch（`git branch -d slice/us-3` + `git push origin --delete slice/us-3`）—— branch 消失 = release。
- **可见性**：`/ddt-status` 输出 `in_progress_slices` 字段，列出所有当前 slice/* branch 的 author/last commit。

**这不是强制约定**——但用了它 `/ddt-status` 会自动给团队看到 in-progress 切片，无需新 SSoT 文件。git branch 是 ground truth。

**append-only 文件并发追加**：`docs/ssot/decisions.jsonl`、`docs/ssot/changelog.jsonl`、`.ddt/metrics/*.jsonl` 已通过 `.gitattributes merge=union` 自动合并双方追加内容，不产生 git conflict。**确保项目根有 `.gitattributes` 文件含 union merge 配置**（从 DDT plugin 仓库复制模板）。

## hook 工作状态判定

判定 hook 是否在工作的**唯一权威**手段：

1. **你能读到本 charter 本身 = SessionStart hook (ddt:charter-inject) 在工作** —— 这是自证。如果 SessionStart hook 没工作，你根本读不到这段话。
2. **跑 `bin/ddt-doctor.mjs`** —— 它列出 plugin 内 `hooks/hooks.json` 真实注册的 hook ID 与 plugin 自身健康。用 PATH 调 `ddt-doctor.mjs` 或 `node "${CLAUDE_PLUGIN_ROOT}/bin/ddt-doctor.mjs"`。
3. **观察 `.ddt/metrics/YYYY-MM-DD.jsonl` 是否在增长** —— PostToolUse / SessionEnd hook 在工作的硬证据。
4. **触发已知会被 IL 拦的动作**（如 build 上下文 Edit `docs/ssot/openapi/`），看是否收到 `permissionDecisionReason: IL-4 ...` —— PreToolUse hook 在工作的硬证据。

**绝对禁止**的误判路径：

- ❌ **看用户的 `.claude/settings.local.json` 是否有 `hooks` 段** —— plugin hooks 注册在 plugin 自己的 `hooks/hooks.json`（不在用户 settings），看错位置 = 必然误报"全部未注册"。
- ❌ **看 Claude Code session 的 "Is a git repository: false" 字段就推断 hook 失效** —— 这是 cwd 状态，与 plugin hook 注册无关。
- ❌ **看不到 hook 输出就当 hook 没跑** —— 大多数 hook 的输出是 `suppressOutput: true` 静默注入/拦截，UI 上看不到不代表没跑。

## hook 缺失降级声明

**只有**经过上一节"判定"步骤实证某 hook 缺失或挂掉时，对应 Iron Law 才降级为建议级（行为塑造层仍在，结构强制消失）。此时任何完成/通过声明必须显式标注「未受 IL-X hook 校验」，并具体到失效的那一条 IL，**不可笼统说"全部降级"**。

绝不在 hook 缺失时静默以演示级冒充生产级。
绝不在 hook **工作但被误判失效**时合理化绕过——这会让本能拦下的违规畅通无阻。
