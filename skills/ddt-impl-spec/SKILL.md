---
name: ddt-impl-spec
description: Use to write a per-slice implementation spec before invoking ddt-writing-plans — the spec step of DDT's 实现 station. Required before any plan/impl can start (IL-3 will block otherwise).
---

# ddt-impl-spec — 实现站 spec 步

实现站三步循环 `spec → plan → implement` 的第一步。给一个 build 切片（后端/前端/aspect）写**实现 spec**，绑定上游 ddt-design 站产物（契约/数据模型）和 PRD 切片，作为 ddt-writing-plans（plan 步）的唯一输入。

## 触发场景

- 进入 build 站某切片，IL-3 强制要求"无批准 spec 不得 plan/impl"——必须先产 approved spec
- 重构意图（行为不变内部改善）——本 skill 内 §refine 子句覆盖，无独立 ddt-refine skill
- 局部二次拉起（`/ddt-rerun <slice>` Plan 4 命令）某切片

## spec 必含内容

每份切片 spec 写到 `docs/specs/<slice>-spec.md`，**必须**含：

1. **实现什么 / 为什么**：1-2 段，绑定 PRD user story id + 上游契约 endpoint id
2. **接口契约（引证不重述）**：明确引上游 ddt-design 产物（`openapi/*.yaml` 哪个 endpoint、哪个 schema），**不抄一遍**——抄一遍 = 漂移源
3. **边界与错误**：边界输入、错误码、降级策略
4. **不做什么**：显式声明本切片不涵盖的相邻功能（防 scope creep）
5. **测试纲要**：列要覆盖的 PRD Given/When/Then + 边界用例（详测在 ddt-writing-plans plan 步给完整测试码）

## 重构子句（spec §5 已说明无独立 ddt-refine skill）

若切片意图为重构（行为不变内部改善），本 skill 强制：

- **绿灯前置**：进 spec 前现有切片测试套件必须全绿（IL-1 同型——无前置证据不得开工）
- **行为保持**：spec 段须显式声明"无行为变更"，列出"哪些公共接口不变 / 哪些内部接口允许变 / 哪些测试期望不变"
- **后置硬门**：重构后**测试套件全绿 + 覆盖率不降 + 契约 lint 不报新警告**才算完成。否则按 IL-1 拒绝完成声明

若过程中发现行为必须变 → 不是重构 → 弹回 ddt-design 走变更门。

## 前端切片可选组合 ddt-design-source

前端切片 spec 步可按需组合 `ddt-design-source` skill 走外部收敛回路（v0/figma/claude-design）——见 spec §10 判据：当切片收敛目标由人感知判定而非文本推理判定时启用。外部回路未启用时，plan/implement 步用 `ddt-frontend-craft` 直出。

## HARD-GATE

- 上游：spec 未经过 Spec Reviewer subagent（用 ddt-subagent-driven/spec-reviewer-prompt.md）核对 PRD 一致性并产生 `.ddt/reviews/<slice>-spec.json`（PASS+非空 cited_evidence），**不得进 ddt-writing-plans**（IL-3+IL-5）
- 下游：每条切片 spec 须由人显式批准（写入 decisions.jsonl：`gate:'spec' slice:<id> status:'resolved' user_action:'approve'`），否则强制层 IL-3 hook 会硬拦截 plan/impl 启动

## 与其他 skill 的互引

- 上游：`ddt-design`（契约+数据模型 SSoT）、`ddt-brainstorming`（PRD 切片）
- Reviewer：`ddt-subagent-driven`（Spec Reviewer 模板）
- 下游：`ddt-writing-plans`（按本 spec 出 bite-sized plan）→ `ddt-subagent-driven`（按 plan 跑三角）
- 重构场景：本 skill 自身重构子句 + `ddt-tdd`（绿灯前置）
- 前端切片：`ddt-design-source`（外部回路）或 `ddt-frontend-craft`（直出）

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
