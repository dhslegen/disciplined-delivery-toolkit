# DDT Reviewer Output 约定（IL-5 文件事实判据基础）

每次 reviewer subagent 给出 PASS/FAIL 判定时，**必须**把判定写入：

`.ddt/reviews/<task-id>-<reviewer-role>.json`

其中 `<reviewer-role>` ∈ `spec` | `quality` | `final`。

## Schema（JSON）

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

## IL-5（反乐观）强制

- `verdict=PASS` 时 `cited_evidence` 必须为非空数组（长度 ≥ 1），每条须含具体证据（文件路径、行号、命令输出片段或测试名）。
- IL-5 hook 校验：每次 reviewer 输出文件写入时（PostToolUse Write/Edit on `.ddt/reviews/*.json`），若 PASS 但 cited_evidence 缺失/空 → block 该 Write 并要求 reviewer 补证据。
- `verdict=FAIL` 时 `issues` 应非空（缺则 reviewer 失职，但不属 IL-5 范围，留 reviewer 自律）。

## 与 spec §8.3 IL-5 判据表的对应

spec §8.3 IL-5 hook 判据：`reviewer 输出无 cited-evidence 结构 → PASS 无效退回`。本约定把"cited-evidence 结构"具体化为 `.ddt/reviews/*.json` 文件的 `cited_evidence` 字段。
