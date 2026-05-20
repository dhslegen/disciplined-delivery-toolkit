---
name: ddt-design
description: Use whenever building or revising the system contract (architecture decisions, OpenAPI spec, data model) from an approved PRD — the 契约 station of DDT's 5-station spine. Invoke before any build-stage slice begins.
---

# ddt-design — 契约站（PRD → 系统级 SSoT）

契约站是 DDT 五站脊柱 `需求 → 契约 → 实现 → 验证 → 交付` 的第二站。它把上游 ddt-brainstorming 站批准的 PRD 翻译成可被下游 ddt-impl-spec 站绑定的**系统级 SSoT**：架构决策 + OpenAPI 契约 + 数据模型。

## 触发场景

- 已有 approved PRD（decisions.jsonl 含 `gate:'product' status:'resolved' user_action:'approve'`），开始构造系统契约
- 上游需求变更后，对受影响契约部分修订（同站 re-entry）
- 实现/验证站抛出 IL-4 escalation（下层发现契约错），返回契约站走变更门

## 纪律要点

### 1. 强制 Spec Reviewer 对 PRD 核对（无引证不得通过——同 IL-5 反乐观）

契约稿完成后**必须**派一次 Spec Reviewer subagent（用 ddt-subagent-driven/spec-reviewer-prompt.md 模板）对照 PRD 逐条核：
- 每个 PRD user story 至少对应 OpenAPI 一组 endpoint
- 每个 Given/When/Then 验收标准在数据模型或 endpoint 行为里有可观测落点
- 反向：契约里没有"凭空字段"——每个字段都能追溯到 PRD 某条需求或 ddt-brainstorming 期间确认的 ASSUMPTION

Reviewer 输出按 `docs/conventions/reviewer-output.md` 写到 `.ddt/reviews/<task>-spec.json`，PASS 必须含非空 `cited_evidence`（强制层 IL-5 会硬拦截无引证 PASS）。

### 2. 契约 lint 硬门

OpenAPI 合法性 + 字段命名一致 + 必填字段标注 + 错误码与状态码对齐——经 `bin/ddt-contract-lint.mjs` 检查 exit=0 才进入下游。

> **已知激活依赖（spec 洞4 同型诚实标注）**：`bin/ddt-contract-lint.mjs` 由 Plan 4 实现并接入 `/ddt` 命令。在 Plan 4 落地前，本硬门**降级为人工检查 + ddt-requesting-review 当面要求 lint 通过证据**——属"未受强制层校验"状态，进 ddt-impl-spec 前必须显式声明。

### 3. SSoT 铁律链上游（PRD > 契约 > 代码）

契约**不得自创 PRD 没有的需求**（IL-4 越级反向：上层无依据写下层）；若需补充必须 escalate 回 ddt-brainstorming 站。

### 4. 外部 API 依赖处理

PRD intake 阶段（ddt-brainstorming 本土化输入 taxonomy）已把外部 API 文档标为"契约站外部不变量"。本站必须：
- 我方 OpenAPI 与外部 API 文档兼容性核对
- 不兼容处 escalate 回 ddt-brainstorming 走变更门，绝不让我方契约偷偷迁就

## 产物

- `openapi/*.yaml`（或等价 schema 文件）
- `docs/architecture/*.md`（架构决策记录）
- 数据模型 schema
- `.ddt/reviews/<task>-spec.json`（Spec Reviewer 引证）

## 与其他 skill 的互引

- 上游：`ddt-brainstorming`（需求站，提供 approved PRD + 输入 taxonomy 元数据）
- Reviewer：`ddt-subagent-driven`（提供 Spec Reviewer subagent 协议与 prompt 模板）
- Review 输出约定：`docs/conventions/reviewer-output.md` + `bin/schema/review-output.schema.json`
- 下游：`ddt-impl-spec`（实现站 spec 步，逐切片绑定本站产物）

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
