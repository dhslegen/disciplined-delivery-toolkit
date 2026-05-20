## DDT v1.0 强制层补完（Plan 2：IL-2/3/4/5/7）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (推荐) 或 superpowers:executing-plans。Steps 用 checkbox (`- [ ]`) 跟踪。

**Goal:** 完成 spec §8 强制层 Iron Law 全集的文件事实判据落地。IL-3/IL-4 加 PreToolUse 文件事实 hook；IL-5 引入 reviewer 输出结构约定 + PostToolUse 校验；IL-2 / IL-7 经诚实评估为**非 hook**——分别归 skill-level 纪律（IL-2，含 commit `root-cause-ref:` trailer 约定）与 Plan 4 `/ddt-status` 职责（IL-7）。Plan 2 结束时 Iron Law 在结构上"能强制的全部强制、不能强制的明确归属"。

**Architecture:** 沿 Plan 1 形态——纯 Node ESM 零依赖、TDD、ddt-facts 扩展承担确定性事实提取、ddt-enforce 扩展承担多 IL 判据派发。新增 reviewer 输出约定 `.ddt/reviews/<id>.json`（含 `cited_evidence: string[]` 等字段）+ JSON Schema 文件用于人/机两可读。所有新 hook 仍由 `hooks/hooks.json` 已注册的 `ddt:enforce-pre`/`ddt:enforce-stop` 单点处理器分发，不加新 hook id（按 ddt_intent / tool_input 字段路由）。

**Tech Stack:** Node `node --test`、`node:test`、`node:assert/strict`、`node:child_process`（spawn 测脚本，全程 spawnSync/execFileSync 安全 API）、ESM `.mjs`。沿用 `tests/unit/`、`tests/integration/`、`tests/fixtures/`。

**Spec 来源：** `docs/specs/2026-05-18-ddt-v1-redesign-design.md` v5 §8（IL 判据表）、§13#4（强制层单点）、Plan 1 Final Reviewer K-1/K-3/K-4 归属备忘。

**前置（Plan 1 已就位）：** ddt-facts 纯函数库 / ddt-charter 宪法 / ddt-charter-inject SessionStart hook / ddt-hook-preflight / ddt-enforce（IL-1/IL-6）+ hooks.json 注册三 id / 9 vendored 纪律 skill 平铺；18 测试全绿。Plan 2 在 Plan 1 上增量。

---

### 文件结构

| 文件 | 责任 |
|------|------|
| `bin/lib/ddt-facts.mjs` | **扩展**：新增 `hasResolvedSpecApproval(decisions, slice)`（IL-3）、`hasEscalationFor(changelog, paths)`（IL-4）、`isValidReviewOutput(jsonObj)`（IL-5 schema 校验）—— 纯函数 |
| `hooks/handlers/ddt-enforce.mjs` | **扩展**：在 `decide(ev)` 内追加 IL-3/IL-4/IL-5 分支，按 `ddt_intent` 与 `tool_name`/`tool_input` 路由 |
| `docs/conventions/reviewer-output.md` | **新增**：reviewer 输出约定（路径、schema、`cited_evidence` 字段语义）+ JSON Schema 内联 |
| `bin/schema/review-output.schema.json` | **新增**：reviewer 输出的 JSON Schema（精简、零依赖手工解析） |
| `skills/ddt-charter/SKILL.md` | **扩展**：Rationalization 表追加 IL-3/IL-4/IL-5 反驳条目；IL-7 段加注"由 /ddt-status 反推强制（Plan 4）"；IL-2 段加 commit trailer 约定 `root-cause-ref:` |
| `skills/ddt-systematic-debugging/SKILL.md` | **不改原文，文末追加 DDT 本土化层**：IL-2 commit trailer 约定（`root-cause-ref: <调查记录路径>` 或 `root-cause: <一句话归因>`）—— 与 Plan 1 `DDT 强制层声明` 平行的独立可 diff 改动 |
| `tests/fixtures/ddt/changelog-no-escalation.jsonl` | IL-4 夹具：无 escalation |
| `tests/fixtures/ddt/changelog-with-escalation.jsonl` | IL-4 夹具：有 escalation |
| `tests/fixtures/ddt/decisions-spec-approved.jsonl` | IL-3 夹具：spec 已批准 |
| `tests/fixtures/ddt/review-output-valid.json` | IL-5 夹具：合规输出 |
| `tests/fixtures/ddt/review-output-no-cited.json` | IL-5 夹具：缺 cited_evidence |
| `tests/unit/ddt-facts.test.mjs` | **扩展**：新增 3 纯函数单测组 |
| `tests/unit/ddt-enforce.test.mjs` | **扩展**：追加 IL-3、IL-4、IL-5 子进程测试 |
| `tests/integration/ddt-il-completion.test.mjs` | **新增**：端到端：宪法 Rationalization 表含 IL-3/4/5 反驳；charter 含 IL-7 反推注与 IL-2 trailer 约定；ddt-systematic-debugging 本土化追加段存在 |

不动 hooks.json（继续复用 `ddt:enforce-pre`/`ddt:enforce-stop` 单点处理器）。不创建新 hook id。

---

### Task 1: ddt-facts 扩展 `hasResolvedSpecApproval`（IL-3 纯函数，TDD）

**Files:** Modify `bin/lib/ddt-facts.mjs`; Modify `tests/unit/ddt-facts.test.mjs`

- [ ] **Step 1: 写失败测试** — 在 `tests/unit/ddt-facts.test.mjs` 末尾追加：

```javascript
import { hasResolvedSpecApproval } from '../../bin/lib/ddt-facts.mjs';

test('hasResolvedSpecApproval：切片有 approved spec 闸门为真', () => {
  const rows = readDecisions('{"gate":"spec","slice":"us-3","status":"resolved","user_action":"approve","ref":"t1"}');
  assert.equal(hasResolvedSpecApproval(rows, 'us-3'), true);
});
test('hasResolvedSpecApproval：拒绝/挂起/异切片均为假', () => {
  const reject = readDecisions('{"gate":"spec","slice":"us-3","status":"resolved","user_action":"reject","ref":"t1"}');
  const pending = readDecisions('{"gate":"spec","slice":"us-3","status":"pending","ts":"t1"}');
  const otherSlice = readDecisions('{"gate":"spec","slice":"us-9","status":"resolved","user_action":"approve","ref":"t1"}');
  assert.equal(hasResolvedSpecApproval(reject, 'us-3'), false);
  assert.equal(hasResolvedSpecApproval(pending, 'us-3'), false);
  assert.equal(hasResolvedSpecApproval(otherSlice, 'us-3'), false);
});
```

- [ ] **Step 2: 运行确认失败** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && npm test -- tests/unit/ddt-facts.test.mjs` → 预期 FAIL（`hasResolvedSpecApproval` 未导出）

- [ ] **Step 3: 写最小实现** — 在 `bin/lib/ddt-facts.mjs` 末尾追加：

```javascript
/** 切片是否已有 spec 闸门"resolved + approve"决策（IL-3）。 */
export function hasResolvedSpecApproval(decisions, slice) {
  return decisions.some(d =>
    d && d.gate === 'spec' && d.slice === slice
      && d.status === 'resolved' && d.user_action === 'approve'
  );
}
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-facts.test.mjs` → 预期 PASS（原 6 + 新 2 = 8 测试绿）

- [ ] **Step 5: 提交**

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
git add bin/lib/ddt-facts.mjs tests/unit/ddt-facts.test.mjs
git -c commit.gpgsign=false commit -m "feat(il-completion): ddt-facts 加 hasResolvedSpecApproval (IL-3)"
```

---

### Task 2: ddt-facts 扩展 `hasEscalationFor`（IL-4 纯函数，TDD）

**Files:** Modify `bin/lib/ddt-facts.mjs`; Modify `tests/unit/ddt-facts.test.mjs`

- [ ] **Step 1: 写失败测试** — 在 `tests/unit/ddt-facts.test.mjs` 末尾追加：

```javascript
import { hasEscalationFor } from '../../bin/lib/ddt-facts.mjs';

test('hasEscalationFor：changelog 含 escalation 且覆盖路径为真', () => {
  const cl = '{"kind":"escalation","paths":["openapi/user.yaml"],"reason":"add field","ts":"t1"}';
  assert.equal(hasEscalationFor(cl, ['openapi/user.yaml']), true);
});
test('hasEscalationFor：changelog 无 escalation 或路径不匹配为假', () => {
  assert.equal(hasEscalationFor('', ['openapi/user.yaml']), false);
  const wrongKind = '{"kind":"amend","paths":["openapi/user.yaml"],"ts":"t1"}';
  assert.equal(hasEscalationFor(wrongKind, ['openapi/user.yaml']), false);
  const wrongPath = '{"kind":"escalation","paths":["openapi/other.yaml"],"ts":"t1"}';
  assert.equal(hasEscalationFor(wrongPath, ['openapi/user.yaml']), false);
});
test('hasEscalationFor：路径集合任一被覆盖即为真', () => {
  const cl = '{"kind":"escalation","paths":["openapi/a.yaml"],"ts":"t1"}\n{"kind":"escalation","paths":["openapi/b.yaml"],"ts":"t2"}';
  assert.equal(hasEscalationFor(cl, ['openapi/b.yaml']), true);
});
```

- [ ] **Step 2: 运行确认失败** — `npm test -- tests/unit/ddt-facts.test.mjs` → 预期 FAIL（`hasEscalationFor` 未导出）

- [ ] **Step 3: 写最小实现** — 在 `bin/lib/ddt-facts.mjs` 末尾追加：

```javascript
/** changelog 是否含覆盖给定 paths 的 escalation 记录（IL-4）。
 *  接受原始 jsonl 文本或已解析行数组。 */
export function hasEscalationFor(changelogJsonlOrRows, paths) {
  const rows = Array.isArray(changelogJsonlOrRows)
    ? changelogJsonlOrRows
    : readDecisions(changelogJsonlOrRows); // 同 jsonl 解析逻辑
  const want = new Set(paths.map(String));
  return rows.some(r =>
    r && r.kind === 'escalation' && Array.isArray(r.paths) &&
    r.paths.some(p => want.has(String(p)))
  );
}
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-facts.test.mjs` → 预期 PASS（原 8 + 新 3 = 11 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/lib/ddt-facts.mjs tests/unit/ddt-facts.test.mjs
git -c commit.gpgsign=false commit -m "feat(il-completion): ddt-facts 加 hasEscalationFor (IL-4)"
```

---

### Task 3: reviewer 输出约定文档 + JSON Schema

**Files:** Create `docs/conventions/reviewer-output.md`; Create `bin/schema/review-output.schema.json`

- [ ] **Step 1: 写约定文档** — Create `docs/conventions/reviewer-output.md`：

````markdown
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
````

- [ ] **Step 2: 写 JSON Schema** — Create `bin/schema/review-output.schema.json`：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ddt.local/schema/review-output.json",
  "title": "DDT Reviewer Output",
  "type": "object",
  "required": ["task_id", "reviewer_role", "verdict", "ts"],
  "properties": {
    "task_id": { "type": "string", "minLength": 1 },
    "reviewer_role": { "enum": ["spec", "quality", "final"] },
    "verdict": { "enum": ["PASS", "FAIL"] },
    "cited_evidence": { "type": "array", "items": { "type": "string", "minLength": 1 } },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "where", "note"],
        "properties": {
          "severity": { "enum": ["critical", "important", "minor"] },
          "where": { "type": "string", "minLength": 1 },
          "note": { "type": "string", "minLength": 1 }
        }
      }
    },
    "ts": { "type": "string", "format": "date-time" }
  },
  "allOf": [
    {
      "if": { "properties": { "verdict": { "const": "PASS" } } },
      "then": {
        "required": ["cited_evidence"],
        "properties": {
          "cited_evidence": { "type": "array", "minItems": 1, "items": { "type": "string", "minLength": 1 } }
        }
      }
    }
  ]
}
```

- [ ] **Step 3: 提交**

```bash
git add docs/conventions/reviewer-output.md bin/schema/review-output.schema.json
git -c commit.gpgsign=false commit -m "feat(il-completion): reviewer 输出约定 + JSON Schema (IL-5 基础)"
```

---

### Task 4: ddt-facts 扩展 `isValidReviewOutput`（IL-5 纯函数，TDD，手工 schema 校验保零依赖）

**Files:** Modify `bin/lib/ddt-facts.mjs`; Modify `tests/unit/ddt-facts.test.mjs`; Create `tests/fixtures/ddt/review-output-valid.json`、`review-output-pass-no-cited.json`、`review-output-fail-ok.json`

- [ ] **Step 1: 写夹具**

Create `tests/fixtures/ddt/review-output-valid.json`:
```json
{ "task_id": "T1", "reviewer_role": "spec", "verdict": "PASS", "cited_evidence": ["tests/unit/foo.test.mjs:12 pass=6"], "ts": "2026-05-20T00:00:00Z" }
```

Create `tests/fixtures/ddt/review-output-pass-no-cited.json`:
```json
{ "task_id": "T1", "reviewer_role": "spec", "verdict": "PASS", "cited_evidence": [], "ts": "2026-05-20T00:00:00Z" }
```

Create `tests/fixtures/ddt/review-output-fail-ok.json`:
```json
{ "task_id": "T1", "reviewer_role": "spec", "verdict": "FAIL", "issues": [{ "severity": "important", "where": "src/x.ts:10", "note": "missing branch" }], "ts": "2026-05-20T00:00:00Z" }
```

- [ ] **Step 2: 写失败测试** — 在 `tests/unit/ddt-facts.test.mjs` 末尾追加：

```javascript
import { isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';
import { readFileSync as rfs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const fxRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/ddt');
const loadFx = (n) => JSON.parse(rfs(path.join(fxRoot, n), 'utf8'));

test('isValidReviewOutput：合规 PASS 含非空 cited_evidence 为真', () => {
  const r = isValidReviewOutput(loadFx('review-output-valid.json'));
  assert.equal(r.ok, true);
});
test('isValidReviewOutput：PASS 但 cited_evidence 为空数组为假', () => {
  const r = isValidReviewOutput(loadFx('review-output-pass-no-cited.json'));
  assert.equal(r.ok, false);
  assert.match(r.reason, /cited_evidence/);
});
test('isValidReviewOutput：FAIL 无须 cited_evidence 为真', () => {
  const r = isValidReviewOutput(loadFx('review-output-fail-ok.json'));
  assert.equal(r.ok, true);
});
test('isValidReviewOutput：缺必填字段为假', () => {
  assert.equal(isValidReviewOutput({}).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1' }).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'spec', verdict: 'PASS' }).ok, false); // 缺 ts
});
test('isValidReviewOutput：非法 verdict / reviewer_role 为假', () => {
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'bad', verdict: 'PASS', cited_evidence: ['x'], ts: '2026-05-20T00:00:00Z' }).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'spec', verdict: 'MAYBE', cited_evidence: ['x'], ts: '2026-05-20T00:00:00Z' }).ok, false);
});
```

- [ ] **Step 3: 运行确认失败** — `npm test -- tests/unit/ddt-facts.test.mjs` → 预期 FAIL（`isValidReviewOutput` 未导出）

- [ ] **Step 4: 写最小实现** — 在 `bin/lib/ddt-facts.mjs` 末尾追加：

```javascript
/** 校验 reviewer 输出对象是否符合 `.ddt/reviews/*.json` 约定（IL-5）。
 *  返回 {ok:boolean, reason?:string}。手工实现保零依赖。 */
export function isValidReviewOutput(obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, reason: '非对象' };
  for (const k of ['task_id', 'reviewer_role', 'verdict', 'ts']) {
    if (typeof obj[k] !== 'string' || obj[k].length === 0) {
      return { ok: false, reason: `缺/空必填字段 ${k}` };
    }
  }
  if (!['spec', 'quality', 'final'].includes(obj.reviewer_role)) {
    return { ok: false, reason: '非法 reviewer_role' };
  }
  if (!['PASS', 'FAIL'].includes(obj.verdict)) {
    return { ok: false, reason: '非法 verdict' };
  }
  if (obj.verdict === 'PASS') {
    if (!Array.isArray(obj.cited_evidence) || obj.cited_evidence.length === 0) {
      return { ok: false, reason: 'PASS 须含非空 cited_evidence 数组（IL-5 反乐观）' };
    }
    if (!obj.cited_evidence.every(e => typeof e === 'string' && e.length > 0)) {
      return { ok: false, reason: 'cited_evidence 每项须为非空字符串' };
    }
  }
  return { ok: true };
}
```

- [ ] **Step 5: 运行确认通过** — `npm test -- tests/unit/ddt-facts.test.mjs` → 预期 PASS（原 11 + 新 5 = 16 测试绿）

- [ ] **Step 6: 提交**

```bash
git add bin/lib/ddt-facts.mjs tests/unit/ddt-facts.test.mjs tests/fixtures/ddt/review-output-valid.json tests/fixtures/ddt/review-output-pass-no-cited.json tests/fixtures/ddt/review-output-fail-ok.json
git -c commit.gpgsign=false commit -m "feat(il-completion): ddt-facts 加 isValidReviewOutput (IL-5)"
```

---

### Task 5: ddt-enforce 追加 IL-3 分支（PreToolUse on intent=enter-plan|enter-impl）

**Files:** Modify `hooks/handlers/ddt-enforce.mjs`; Create `tests/fixtures/ddt/decisions-spec-approved.jsonl`、`decisions-no-spec.jsonl`; Modify `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写夹具**

Create `tests/fixtures/ddt/decisions-spec-approved.jsonl`:
```
{"gate":"spec","slice":"us-3","status":"pending","ts":"2026-05-20T01:00:00Z"}
{"gate":"spec","slice":"us-3","status":"resolved","user_action":"approve","ref":"2026-05-20T01:00:00Z","ts":"2026-05-20T02:00:00Z"}
```

Create `tests/fixtures/ddt/decisions-no-spec.jsonl`:
```
{"gate":"spec","slice":"us-3","status":"pending","ts":"2026-05-20T01:00:00Z"}
```

- [ ] **Step 2: 写失败测试** — 在 `tests/unit/ddt-enforce.test.mjs` 末尾追加：

```javascript
test('IL-3：进 plan 步但切片无 approved spec → block', () => {
  const { out } = run({ hook_event_name: 'PreToolUse', ddt_intent: 'enter-plan', ddt_slice: 'us-3', ddt_test_decisions: fx('decisions-no-spec.jsonl') });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-3/);
});
test('IL-3：进 plan 步切片已 approved → allow', () => {
  const { out } = run({ hook_event_name: 'PreToolUse', ddt_intent: 'enter-plan', ddt_slice: 'us-3', ddt_test_decisions: fx('decisions-spec-approved.jsonl') });
  assert.equal(out.decision, 'allow');
});
test('IL-3：enter-impl 同理需 approved spec', () => {
  const { out } = run({ hook_event_name: 'PreToolUse', ddt_intent: 'enter-impl', ddt_slice: 'us-3', ddt_test_decisions: fx('decisions-no-spec.jsonl') });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-3/);
});
```

- [ ] **Step 3: 运行确认失败** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期：3 新用例 FAIL（enter-plan/enter-impl 当前无分支处理，返回 allow）

- [ ] **Step 4: 修改 `hooks/handlers/ddt-enforce.mjs`**

(a) import 行追加 `hasResolvedSpecApproval`：
```javascript
import { hasEvidenceRef, hasUnresolvedPending, readDecisions, hasResolvedSpecApproval } from '../../bin/lib/ddt-facts.mjs';
```

(b) 在 `decide(ev)` 内的 `return allow();` 前插入：
```javascript
  if ((ev.ddt_intent === 'enter-plan' || ev.ddt_intent === 'enter-impl') && typeof ev.ddt_slice === 'string') {
    if (!hasResolvedSpecApproval(readDecisions(decisionsText(ev)), ev.ddt_slice)) {
      return block(`IL-3 违规：切片 ${ev.ddt_slice} 无 approved spec 决策（gate=spec & status=resolved & user_action=approve），禁止进 ${ev.ddt_intent === 'enter-plan' ? 'plan' : 'implement'}。先走 spec 闸门批准。`);
    }
  }
```

- [ ] **Step 5: 运行确认通过** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期 PASS（原 5 + 新 3 = 8 测试绿）

- [ ] **Step 6: 提交**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/fixtures/ddt/decisions-spec-approved.jsonl tests/fixtures/ddt/decisions-no-spec.jsonl
git -c commit.gpgsign=false commit -m "feat(il-completion): 强制层补 IL-3 (无批准 spec 不得 plan/impl)"
```

---

### Task 6: ddt-enforce 追加 IL-4 分支（PreToolUse on Edit/Write 触及受保护路径）

**Files:** Modify `hooks/handlers/ddt-enforce.mjs`; Create `tests/fixtures/ddt/changelog-no-escalation.jsonl`、`changelog-with-escalation.jsonl`; Modify `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写夹具**

Create `tests/fixtures/ddt/changelog-no-escalation.jsonl`:
```
{"kind":"amend","intent":"补需求","paths":["PRD.md"],"ts":"2026-05-20T01:00:00Z"}
```

Create `tests/fixtures/ddt/changelog-with-escalation.jsonl`:
```
{"kind":"escalation","paths":["openapi/user.yaml"],"reason":"契约缺字段，弹回设计","ts":"2026-05-20T01:00:00Z"}
```

- [ ] **Step 2: 写失败测试** — 在 `tests/unit/ddt-enforce.test.mjs` 末尾追加：

```javascript
test('IL-4：build 上下文 Edit openapi/** 且 changelog 无 escalation → block', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Edit', tool_input: { file_path: 'openapi/user.yaml' },
    ddt_test_changelog: fx('changelog-no-escalation.jsonl')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-4/);
});
test('IL-4：build 上下文 Edit openapi/** 且 changelog 有 escalation → allow', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Edit', tool_input: { file_path: 'openapi/user.yaml' },
    ddt_test_changelog: fx('changelog-with-escalation.jsonl')
  });
  assert.equal(out.decision, 'allow');
});
test('IL-4：非受保护路径 → allow', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Write', tool_input: { file_path: 'src/foo.ts' },
    ddt_test_changelog: fx('changelog-no-escalation.jsonl')
  });
  assert.equal(out.decision, 'allow');
});
test('IL-4：build 上下文 Write PRD.md 且无 escalation → block', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Write', tool_input: { file_path: 'PRD.md' },
    ddt_test_changelog: fx('changelog-no-escalation.jsonl')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-4/);
});
```

- [ ] **Step 3: 运行确认失败** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期：4 新用例中至少 2 个 FAIL（block 用例期望 block 但当前返回 allow）

- [ ] **Step 4: 修改 `hooks/handlers/ddt-enforce.mjs`**

(a) import 行追加 `hasEscalationFor, pathTouchesProtected`：
```javascript
import { hasEvidenceRef, hasUnresolvedPending, readDecisions, hasResolvedSpecApproval, hasEscalationFor, pathTouchesProtected } from '../../bin/lib/ddt-facts.mjs';
```

(b) 在 `decisionsText` 函数下方加 `changelogText`：
```javascript
function changelogText(ev) {
  if (typeof ev.ddt_test_changelog === 'string') return ev.ddt_test_changelog;
  try { return readFileSync('.ddt/changelog.jsonl', 'utf8'); } catch { return ''; }
}
```

(c) 在 `decide(ev)` 内的 `return allow();` 前插入：
```javascript
  if (ev.ddt_intent === 'build-edit' && (ev.tool_name === 'Edit' || ev.tool_name === 'Write')) {
    const tp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? [ev.tool_input.file_path] : [];
    const PROTECTED = ['openapi/', 'PRD.md'];
    if (pathTouchesProtected(tp, PROTECTED)) {
      if (!hasEscalationFor(changelogText(ev), tp)) {
        return block(`IL-4 违规：build 上下文试图修改受保护路径 ${tp.join(',')}（属 PRD/契约 SSoT），且 changelog.jsonl 无对应 escalation 记录。下层不得私改上层 SSoT——先写 escalation 走变更门。`);
      }
    }
  }
```

- [ ] **Step 5: 运行确认通过** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期 PASS（原 8 + 新 4 = 12 测试绿）

- [ ] **Step 6: 提交**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/fixtures/ddt/changelog-no-escalation.jsonl tests/fixtures/ddt/changelog-with-escalation.jsonl
git -c commit.gpgsign=false commit -m "feat(il-completion): 强制层补 IL-4 (下层不得私改 PRD/契约)"
```

---

### Task 7: ddt-enforce 追加 IL-5 分支（PostToolUse on Write/Edit to `.ddt/reviews/*.json`）

**Files:** Modify `hooks/handlers/ddt-enforce.mjs`; Modify `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写失败测试** — 在 `tests/unit/ddt-enforce.test.mjs` 末尾追加：

```javascript
test('IL-5：PostToolUse 写 reviews/*.json 但 PASS 无 cited_evidence → block', () => {
  const { out } = run({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-5/);
});
test('IL-5：PostToolUse 写 reviews/*.json PASS 含 cited_evidence → allow', () => {
  const { out } = run({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":["foo.test.mjs:1 pass=1"],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'allow');
});
test('IL-5：FAIL 无须 cited_evidence → allow', () => {
  const { out } = run({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"FAIL","issues":[{"severity":"important","where":"x:1","note":"y"}],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'allow');
});
test('IL-5：非 reviews 路径不触发', () => {
  const { out } = run({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'src/x.ts', content: 'hello' }
  });
  assert.equal(out.decision, 'allow');
});
```

- [ ] **Step 2: 运行确认失败** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期至少 1 用例 FAIL

- [ ] **Step 3: 修改 `hooks/handlers/ddt-enforce.mjs`**

(a) import 行追加 `isValidReviewOutput`：
```javascript
import { hasEvidenceRef, hasUnresolvedPending, readDecisions, hasResolvedSpecApproval, hasEscalationFor, pathTouchesProtected, isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';
```

(b) 在 `decide(ev)` 内的 `return allow();` 前插入：
```javascript
  if (ev.hook_event_name === 'PostToolUse' && (ev.tool_name === 'Write' || ev.tool_name === 'Edit')) {
    const fp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? ev.tool_input.file_path : '';
    if (/^\.ddt\/reviews\/.+\.json$/.test(fp)) {
      const raw = ev.tool_input && typeof ev.tool_input.content === 'string' ? ev.tool_input.content : '';
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { return block(`IL-5 违规：reviewer 输出 ${fp} 非合法 JSON。`); }
      const v = isValidReviewOutput(parsed);
      if (!v.ok) return block(`IL-5 违规：reviewer 输出 ${fp} 不合规——${v.reason}。无引证不得 PASS。`);
    }
  }
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期 PASS（原 12 + 新 4 = 16 测试绿）

- [ ] **Step 5: 提交**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs
git -c commit.gpgsign=false commit -m "feat(il-completion): 强制层补 IL-5 (reviewer PASS 须有 cited_evidence)"
```

---

### Task 8: 宪法 + ddt-systematic-debugging 本土化扩展（IL-2 trailer 约定 / IL-7 归属 / Rationalization 表）

**Files:** Modify `skills/ddt-charter/SKILL.md`; Modify `skills/ddt-systematic-debugging/SKILL.md`

- [ ] **Step 1: 修改 `skills/ddt-charter/SKILL.md`** — 在 Rationalization 反驳表中追加 3 行；并在 IL-2 段后/IL-7 段后各加注一行。具体编辑：

(a) 在原 Rationalization 反驳表（4 条「先不做也能演示」等）末尾追加：

```markdown
- 反正 plan/impl 没人查 spec 是否真批了 → IL-3 hook 查 decisions.jsonl，无 approved 即 block。
- 这个契约小改我顺手就行 → IL-4 hook 查 diff 路径与 changelog escalation，无即 block；私改即漂移。
- reviewer 说 PASS 就完事 → IL-5 hook 校验 .ddt/reviews/*.json 的 cited_evidence，PASS 无引证即 block。
```

(b) 在 Iron Laws 区块的 `- IL-2 ...` 行下追加（作为 IL-2 段的本土化注脚，缩进列表项）：

```markdown
  - IL-2 本土化：bug 修复 commit 必含 trailer `root-cause-ref:<调查记录路径>` 或 `root-cause:<一句话归因>`；缺则视为未做根因（建议级——本宪法当前无 IL-2 hook，靠 ddt-systematic-debugging skill 与 review 强制）。
```

(c) 在 Iron Laws 区块的 `- IL-7 ...` 行下追加：

```markdown
  - IL-7 落点：进度反推由 `/ddt-status` 命令实现（Plan 4），读 git trailer + decisions.jsonl + spec/plan 文件存在性算下一步，不信会话自述。本宪法当前无 IL-7 hook，进度声明须显式标注「未受 /ddt-status 校验」。
```

- [ ] **Step 2: 修改 `skills/ddt-systematic-debugging/SKILL.md`** — 在文末已有的「DDT 强制层声明」段**之前**追加一个新段（独立可 diff 改动）：

```markdown


---

> **DDT 本土化层（IL-2 commit 约定）**：bug 修复 commit message body 须含以下 trailer 之一：
> - `root-cause-ref: <调查记录路径或 issue 链接>` —— 指向独立的根因分析文档
> - `root-cause: <一句话归因>` —— 简单 bug 内联归因
>
> 缺则 ddt-requesting-review 会在 review 时打 IL-2 警告，视为未完成根因调查。该约定为 skill-level 纪律（DDT 当前无 IL-2 hook，spec §8.3 判据表诚实不含 IL-2——见 Plan 2 设计说明）。
```

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-charter/SKILL.md skills/ddt-systematic-debugging/SKILL.md
git -c commit.gpgsign=false commit -m "feat(il-completion): 宪法+ddt-systematic-debugging 本土化 IL-2 trailer/IL-7 归属/Rationalization 补充"
```

---

### Task 9: 端到端集成测试

**Files:** Create `tests/integration/ddt-il-completion.test.mjs`

- [ ] **Step 1: 写测试** — Create `tests/integration/ddt-il-completion.test.mjs`：

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('宪法 Rationalization 表含 IL-3/IL-4/IL-5 反驳条目', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /IL-3 hook 查 decisions\.jsonl/);
  assert.match(s, /IL-4 hook 查 diff 路径与 changelog escalation/);
  assert.match(s, /IL-5 hook 校验 \.ddt\/reviews\/\*\.json/);
});

test('宪法 IL-2 段含 commit trailer root-cause-ref 约定', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /root-cause-ref/);
});

test('宪法 IL-7 段标注由 /ddt-status (Plan 4) 反推', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /\/ddt-status/);
  assert.match(s, /Plan 4/);
});

test('ddt-systematic-debugging 含 IL-2 本土化层 trailer 约定', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-systematic-debugging/SKILL.md'), 'utf8');
  assert.match(s, /DDT 本土化层（IL-2 commit 约定）/);
  assert.match(s, /root-cause-ref/);
  // 原 Plan 1 降级声明仍在
  assert.match(s, /DDT 强制层声明/);
});

test('reviewer 输出约定文档与 JSON Schema 就位', () => {
  assert.ok(existsSync(path.join(root, 'docs/conventions/reviewer-output.md')));
  assert.ok(existsSync(path.join(root, 'bin/schema/review-output.schema.json')));
  const sch = JSON.parse(readFileSync(path.join(root, 'bin/schema/review-output.schema.json'), 'utf8'));
  assert.equal(sch.title, 'DDT Reviewer Output');
});
```

- [ ] **Step 2: 运行通过** — `npm test -- tests/integration/ddt-il-completion.test.mjs` → 预期 PASS（5 测试绿）

- [ ] **Step 3: 全量回归** — `npm test` → 预期：本计划全部新增 + Plan 1 全部测试绿（无回归）。具体应达到约 18（Plan 1）+ 新增（本计划 ≈ 16 enforce + facts 单测 + 5 集成）= 39 左右；以实跑数为准。

- [ ] **Step 4: 提交**

```bash
git add tests/integration/ddt-il-completion.test.mjs
git -c commit.gpgsign=false commit -m "test(il-completion): 宪法/skill 本土化/约定文档端到端集成测试"
```

---

### 后续计划（不在本 Plan 实现）

- **Plan 3**：五站 skill（ddt-design 含强制 Spec Reviewer+lint 硬门 / ddt-impl-spec 含 refine 子句 / ddt-deliver / ddt-frontend-craft / ddt-design-source）。
- **Plan 4（激活 Plan 1+2）**：`/ddt` 与 `/ddt-status` 两薄闸门 + bin 承重件（resolve-tech-stack / 契约 lint / status 事实提取 / decisions·changelog 追加器）。**这是把 Plan 1+2 全部 hook 从"待激活"变"真生效"的关键节点**——`/ddt` 注入 `ddt_intent`/`ddt_slice` 字段，`/ddt-status` 实现 IL-7 反推。
- **Plan 5**：度量 + 交付站 ROI 报告（含 §11 降低保障级标记）。

---

### Self-Review

**1. Spec 覆盖**（spec §8.3 IL 判据表）：
- IL-1 → Plan 1 已落 ✓
- IL-3 → Task 5（PreToolUse + decisions.jsonl 查 approved spec）✓
- IL-4 → Task 6（PreToolUse + diff 路径 + changelog escalation）✓
- IL-5 → Task 3+4+7（reviewer 输出约定 + Schema + 纯函数 + PostToolUse hook）✓
- IL-6 → Plan 1 已落 ✓
- IL-2 → Task 8（明列 spec §8.3 表本就不含 IL-2 hook，落 skill-level + trailer 约定，**诚实非 hook**）✓
- IL-7 → Task 8（文档化为 /ddt-status 反推职责，明列 Plan 4 接入）✓
- Plan 1 Final Reviewer K-1 ddt_intent 注入缺口：本 Plan 仍依赖 ddt_intent 字段（IL-3/IL-4 hook），与 K-1 一致——明列 Plan 4 是激活点。

**2. 占位符扫描**：每代码步含完整可运行代码 + 确切命令 + 预期输出。IL-2/IL-7 未写"留待将来"，而是**明确归属并落实可验证产物**（IL-2 有 trailer 约定 + skill 文本可被集成测试断言；IL-7 有宪法注脚 + 集成测试断言）——非占位。

**3. 类型/签名一致性**：
- `ddt-facts.mjs` 新增 3 函数 `hasResolvedSpecApproval(rows, slice)` / `hasEscalationFor(jsonlOrRows, paths)` / `isValidReviewOutput(obj) → {ok, reason?}`，每个都被对应 enforce 分支 import 与单测覆盖，签名一致。
- `ddt-enforce.mjs` 4 处新增分支均按 `ev.hook_event_name` + `ev.ddt_intent` + `ev.tool_name` + `ev.tool_input.file_path` 路由——四个分支互不重叠（IL-3 看 enter-plan/enter-impl；IL-4 看 build-edit+Edit/Write；IL-5 看 PostToolUse+Write/Edit+`.ddt/reviews/`；既有 IL-1 看 claim-complete、IL-6 看 enter-deliver）。
- 测试 `run()` 工具函数（Task 5 中既有）spawn ddt-enforce.mjs 并解析 stdout JSON，签名沿用 Plan 1；fx 工具沿用 Plan 1（读 fixtures）。

**4. 与既有代码的连接缝**：
- 不改 hooks.json（沿用 Plan 1 注册的 `ddt:enforce-pre`/`ddt:enforce-stop`，单点处理器按 `hook_event_name` 与 `ddt_intent` 路由）。
- 不改 charter `name:` 或开头 frontmatter（仅在 Rationalization 表追加 + Iron Laws 段加缩进子项）。
- 不改 vendored skill 原文（系统性调试 SKILL.md 仅在末尾追加新段，与 Plan 1 降级声明并存，独立可 diff）。

**5. 诚实标注的非 hook 项**：IL-2/IL-7 不假装造 hook（与 spec §13#0 "不为不变量造机器"同源原则）；如未来发现 IL-2 有可文件事实化的判据（例如 commit message lint），可再起 Plan 单独追加，不在本 Plan 透支。
