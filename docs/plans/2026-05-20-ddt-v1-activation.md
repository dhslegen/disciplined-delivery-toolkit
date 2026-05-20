## DDT v1.0 激活枢纽（Plan 4）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans。Steps 用 checkbox 跟踪。

**Goal:** 把 Plan 1/2/3 的"待激活"全部转生产生效——实现 2 薄闸门命令（`/ddt`、`/ddt-status`）+ bin 承重件（事实提取/追加器/tech-stack 单点写入/契约 lint）+ 引入 `.ddt/state/current.json` 工作态文件作为命令→hook 的字段桥（解 Plan 1/2 中 ddt_intent 注入缺口 K-1）。Plan 4 结束 v1.0 首次能自驱动跑起来。

**Architecture：**
- 命令 = Claude Code commands/ 下 markdown 文件，frontmatter+正文，指引 Claude 路由
- bin 承重件 = 纯 Node ESM 零依赖小脚本，确定性事实提取与文件追加
- 命令→hook 字段桥 = `.ddt/state/current.json`（**第四类工作态文件，非 SSoT 三件真相**——transient，每次 `/ddt` 覆盖；hook 缺 stdin 字段时 fallback 读它）
- ddt-enforce.mjs 改加 fallback 逻辑（不破坏 Plan 1/2 现有 stdin 测试路径——双源兼容）
- ddt-design "契约 lint 硬门" 段从"待激活"改为"已激活，调 bin/ddt-contract-lint.mjs"

**Tech Stack:** Node `node --test`、零运行时依赖、ESM `.mjs`、Markdown 命令。

**Spec 来源：** spec v5 §3.2（三件真相）/§4（剪枝依赖 tech-stack.json）/§7（2 命令 + 闸门挣打断权）/§8（hook 判文件事实，但实际 stdin 字段缺口由 state 文件桥补）/§9（bin 承重件清单）/§11（ROI 路径预留）/§15（vendoring）。Plan 1 Final Reviewer K-1（ddt_intent 注入缺口）+ Plan 3 ddt-design 待激活 + ddt-deliver 第 4 节 ROI 占位（归 Plan 5）。

**前置（Plan 1+2+3 已就位）：** 宪法注入 + IL-1/3/4/5/6 文件事实 hook（测试路径）+ 5 站 native skill + 9 vendored 纪律 skill + 56 测试全绿。

---

### 文件结构（本计划新增/修改）

| 文件 | 责任 |
|------|------|
| `.ddt/state/current.json`（runtime，不入 git；本计划仅约定 schema） | 工作态文件。`{ddt_intent, ddt_slice?, set_by:"/ddt", at:<ISO8601>}`。每次 `/ddt` 覆盖。本计划只产 schema 与 hook fallback 代码；实际写文件由 `/ddt` 命令实现期间触发 |
| `hooks/handlers/ddt-enforce.mjs` | **改**：加 `readCurrentState()` 在 ev 缺 ddt_intent/ddt_slice 时从 `.ddt/state/current.json` fallback；测试路径优先 stdin（保持 Plan 1/2 测试兼容） |
| `bin/ddt-status.mjs` | 事实提取：解析 git trailer + 列 decisions pending + 列存在的 spec/plan 文件 → JSON 给 `/ddt-status` 命令读 |
| `bin/ddt-decisions-append.mjs` | 追加 jsonl：保证 JSON 合法 + 自动加 ts |
| `bin/ddt-changelog-append.mjs` | 同上但写 changelog.jsonl |
| `bin/resolve-tech-stack.mjs` | 单点写入 `.ddt/tech-stack.json`（spec §4 剪枝依据，agent 禁改） |
| `bin/ddt-contract-lint.mjs` | OpenAPI 契约 lint：JSON 形式做完整 schema 校验；YAML 形式做完整性扫描（含 openapi/info/paths 等必填段存在）。零依赖（不引 yaml 库；YAML 用 regex 扫描） |
| `commands/ddt.md` | 万能驱动闸门：解析自由文本→意图分类→写 .ddt/state/current.json→装载对应 skill |
| `commands/ddt-status.md` | 只读重算：调 bin/ddt-status.mjs 读事实→人话摘要输出 |
| `skills/ddt-design/SKILL.md` | **改**：把契约 lint 段从"待激活"改为"已激活，调 bin/ddt-contract-lint.mjs" |
| 新增测试：unit 与 integration 多份 | 各 bin 单测 + 命令存在性集成测试 + ddt-enforce fallback 单测 |

不动：ddt-charter / 9 vendored skill / Plan 3 其他 4 个 native skill / Plan 1+2 的 ddt-facts 等。

---

### Task 1: `.ddt/state/current.json` schema + ddt-enforce fallback（TDD）

**Files:** Modify `hooks/handlers/ddt-enforce.mjs`; Create `tests/fixtures/ddt/state-build-edit.json`、`state-enter-plan.json`; Modify `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写夹具**

Create `tests/fixtures/ddt/state-build-edit.json`:
```json
{ "ddt_intent": "build-edit", "set_by": "/ddt", "at": "2026-05-20T10:00:00Z" }
```

Create `tests/fixtures/ddt/state-enter-plan.json`:
```json
{ "ddt_intent": "enter-plan", "ddt_slice": "us-3", "set_by": "/ddt", "at": "2026-05-20T10:00:00Z" }
```

- [ ] **Step 2: 写失败测试** — 在 `tests/unit/ddt-enforce.test.mjs` 末尾追加：

```javascript
test('Plan 4 fallback：stdin 缺 ddt_intent，从 .ddt/state/current.json 读', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: 'openapi/user.yaml' },
    ddt_test_changelog: fx('changelog-no-escalation.jsonl'),
    ddt_test_state: fx('state-build-edit.json')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-4/);
});
test('Plan 4 fallback：state 注入 enter-plan + slice，IL-3 生效', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    ddt_test_decisions: fx('decisions-no-spec.jsonl'),
    ddt_test_state: fx('state-enter-plan.json')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-3/);
});
test('Plan 4 fallback：stdin 显式 ddt_intent 优先于 state（兼容性）', () => {
  // stdin 给 claim-complete 但 state 给 enter-plan → stdin 胜出，触发 IL-1 而非 IL-3
  const { out } = run({
    hook_event_name: 'Stop',
    ddt_intent: 'claim-complete',
    ddt_test_head: fx('git-head-no-evidence.txt'),
    ddt_test_state: fx('state-enter-plan.json')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-1/);
});
```

- [ ] **Step 3: 运行确认失败** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && npm test -- tests/unit/ddt-enforce.test.mjs` → 预期前 2 测试 FAIL（fallback 未实现，state 字段被忽略，IL-3/IL-4 不触发）

- [ ] **Step 4: 修改 `hooks/handlers/ddt-enforce.mjs`**

(a) 在文件 import 区下方、`readStdin` 函数附近新增：

```javascript
function readStateFile(ev) {
  if (typeof ev.ddt_test_state === 'string') {
    try { return JSON.parse(ev.ddt_test_state); } catch { return null; }
  }
  try {
    const raw = readFileSync('.ddt/state/current.json', 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

function mergeStateFallback(ev) {
  // stdin 字段优先，state 文件兜底
  if (typeof ev.ddt_intent === 'string' && ev.ddt_intent.length > 0) return ev;
  const st = readStateFile(ev);
  if (!st || typeof st !== 'object') return ev;
  const merged = { ...ev };
  if (typeof st.ddt_intent === 'string') merged.ddt_intent = st.ddt_intent;
  if (typeof st.ddt_slice === 'string') merged.ddt_slice = st.ddt_slice;
  return merged;
}
```

(b) 在 `const ev = readStdin();` 与 `process.stdout.write(JSON.stringify(decide(ev)));` 之间插入：

```javascript
const evMerged = mergeStateFallback(ev);
process.stdout.write(JSON.stringify(decide(evMerged)));
```

并把原 `decide(ev)` 调用删除（避免重复）。

- [ ] **Step 5: 运行确认通过** — `npm test -- tests/unit/ddt-enforce.test.mjs` → 预期全绿（含原既有 + 3 新 fallback 测试）

- [ ] **Step 6: 提交**

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/fixtures/ddt/state-build-edit.json tests/fixtures/ddt/state-enter-plan.json
git -c commit.gpgsign=false commit -m "feat(activation): ddt-enforce 加 .ddt/state/current.json fallback（命令→hook 字段桥）"
```

---

### Task 2: `bin/ddt-status.mjs` 事实提取器（TDD，子进程测）

**Files:** Create `bin/ddt-status.mjs`; Create `tests/unit/ddt-status.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-status.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-status.mjs');

function runIn(setup) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-st-'));
  mkdirSync(path.join(dir, '.ddt'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/specs'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/plans'), { recursive: true });
  if (setup) setup(dir);
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, err: r.stderr };
}

test('ddt-status：空仓返回基线结构', () => {
  const { status, out } = runIn(() => {});
  assert.equal(status, 0);
  assert.equal(Array.isArray(out.pending_decisions), true);
  assert.equal(out.pending_decisions.length, 0);
  assert.equal(Array.isArray(out.slice_specs), true);
  assert.equal(Array.isArray(out.slice_plans), true);
});

test('ddt-status：列 pending decisions（未 resolved）', () => {
  const { out } = runIn(dir => {
    writeFileSync(path.join(dir, '.ddt/decisions.jsonl'),
      '{"status":"pending","gate":"design","ts":"t1"}\n{"status":"resolved","ref":"t1","ts":"t2"}\n{"status":"pending","gate":"build","ts":"t3"}\n');
  });
  assert.equal(out.pending_decisions.length, 1);
  assert.equal(out.pending_decisions[0].gate, 'build');
});

test('ddt-status：列存在的 spec/plan 文件', () => {
  const { out } = runIn(dir => {
    writeFileSync(path.join(dir, 'docs/specs/us-3-spec.md'), '# us-3');
    writeFileSync(path.join(dir, 'docs/plans/us-3-plan.md'), '# us-3 plan');
  });
  assert.deepEqual(out.slice_specs.sort(), ['us-3-spec.md']);
  assert.deepEqual(out.slice_plans.sort(), ['us-3-plan.md']);
});
```

- [ ] **Step 2: 运行确认失败** — `npm test -- tests/unit/ddt-status.test.mjs` → FAIL（ENOENT）

- [ ] **Step 3: 写最小实现** — Create `bin/ddt-status.mjs`:

```javascript
#!/usr/bin/env node
// /ddt-status 用：从 cwd 提取事实（decisions pending、spec/plan 文件存在性）。
// 纯确定性事实镜头，不做判断/不写文件。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { readDecisions, hasUnresolvedPending } from '../bin/lib/ddt-facts.mjs';
import path from 'node:path';

function pendingDecisions(jsonlText) {
  const rows = readDecisions(jsonlText);
  const resolved = new Set(
    rows.filter(d => d && d.status === 'resolved' && d.ref != null).map(d => String(d.ref))
  );
  return rows.filter(d => d && d.status === 'pending' && !resolved.has(String(d.ts)));
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  try { return readdirSync(dir).filter(f => f.endsWith('.md')); }
  catch { return []; }
}

let decisionsText = '';
try { decisionsText = readFileSync('.ddt/decisions.jsonl', 'utf8'); } catch { /* 空仓 */ }

const out = {
  pending_decisions: pendingDecisions(decisionsText),
  slice_specs: listFiles('docs/specs'),
  slice_plans: listFiles('docs/plans')
};
process.stdout.write(JSON.stringify(out));
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-status.test.mjs` → PASS（3 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/ddt-status.mjs tests/unit/ddt-status.test.mjs
git -c commit.gpgsign=false commit -m "feat(activation): bin/ddt-status 事实提取器"
```

---

### Task 3: `bin/ddt-decisions-append.mjs` + `bin/ddt-changelog-append.mjs`（TDD，子进程测）

**Files:** Create `bin/ddt-decisions-append.mjs`、`bin/ddt-changelog-append.mjs`; Create `tests/unit/ddt-appenders.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-appenders.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const decAppender = path.join(root, 'bin/ddt-decisions-append.mjs');
const clAppender = path.join(root, 'bin/ddt-changelog-append.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-ap-'));
  mkdirSync(path.join(dir, '.ddt'), { recursive: true });
  return dir;
}

test('decisions-append：单条 JSON 写入 .ddt/decisions.jsonl 并自动加 ts', () => {
  const dir = newRepo();
  const r = spawnSync('node', [decAppender], {
    input: JSON.stringify({ status: 'pending', gate: 'design', owner_role: 'architect' }),
    cwd: dir, encoding: 'utf8'
  });
  assert.equal(r.status, 0);
  const lines = readFileSync(path.join(dir, '.ddt/decisions.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  const row = JSON.parse(lines[0]);
  assert.equal(row.status, 'pending');
  assert.match(row.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('decisions-append：多次追加成多行 jsonl', () => {
  const dir = newRepo();
  for (let i = 0; i < 3; i++) {
    spawnSync('node', [decAppender], { input: JSON.stringify({ idx: i }), cwd: dir, encoding: 'utf8' });
  }
  const lines = readFileSync(path.join(dir, '.ddt/decisions.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 3);
});

test('decisions-append：坏 JSON exit 非 0 不写文件', () => {
  const dir = newRepo();
  const r = spawnSync('node', [decAppender], { input: 'not-json', cwd: dir, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /JSON/);
});

test('changelog-append：写 .ddt/changelog.jsonl 自动加 ts', () => {
  const dir = newRepo();
  const r = spawnSync('node', [clAppender], {
    input: JSON.stringify({ kind: 'amend', intent: 'add field', paths: ['PRD.md'] }),
    cwd: dir, encoding: 'utf8'
  });
  assert.equal(r.status, 0);
  const row = JSON.parse(readFileSync(path.join(dir, '.ddt/changelog.jsonl'), 'utf8').trim().split('\n')[0]);
  assert.equal(row.kind, 'amend');
  assert.ok(row.ts);
});
```

- [ ] **Step 2: 运行确认失败** — `npm test -- tests/unit/ddt-appenders.test.mjs` → FAIL（ENOENT）

- [ ] **Step 3: 写最小实现**

Create `bin/ddt-decisions-append.mjs`:

```javascript
#!/usr/bin/env node
// 追加一条 JSON 到 .ddt/decisions.jsonl。stdin 读对象，自动补 ts。
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let obj;
try { obj = JSON.parse(raw); }
catch { process.stderr.write('[ddt-decisions-append] stdin 非合法 JSON\n'); process.exit(2); }
if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  process.stderr.write('[ddt-decisions-append] stdin 须为 JSON 对象\n'); process.exit(2);
}
if (!obj.ts) obj.ts = new Date().toISOString();

mkdirSync('.ddt', { recursive: true });
appendFileSync('.ddt/decisions.jsonl', JSON.stringify(obj) + '\n', 'utf8');
process.exit(0);
```

Create `bin/ddt-changelog-append.mjs`：内容与 decisions-append 相同但写到 `.ddt/changelog.jsonl`：

```javascript
#!/usr/bin/env node
// 追加一条 JSON 到 .ddt/changelog.jsonl。stdin 读对象，自动补 ts。
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let obj;
try { obj = JSON.parse(raw); }
catch { process.stderr.write('[ddt-changelog-append] stdin 非合法 JSON\n'); process.exit(2); }
if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  process.stderr.write('[ddt-changelog-append] stdin 须为 JSON 对象\n'); process.exit(2);
}
if (!obj.ts) obj.ts = new Date().toISOString();

mkdirSync('.ddt', { recursive: true });
appendFileSync('.ddt/changelog.jsonl', JSON.stringify(obj) + '\n', 'utf8');
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-appenders.test.mjs` → PASS（4 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/ddt-decisions-append.mjs bin/ddt-changelog-append.mjs tests/unit/ddt-appenders.test.mjs
git -c commit.gpgsign=false commit -m "feat(activation): decisions/changelog jsonl 追加器"
```

---

### Task 4: `bin/resolve-tech-stack.mjs`（TDD，单点写入 .ddt/tech-stack.json）

**Files:** Create `bin/resolve-tech-stack.mjs`; Create `tests/unit/ddt-resolve-tech-stack.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-resolve-tech-stack.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/resolve-tech-stack.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-ts-'));
  return dir;
}

test('resolve-tech-stack：stdin 含完整 tech-stack 对象，写入 .ddt/tech-stack.json', () => {
  const dir = newRepo();
  const input = JSON.stringify({ frontend: { type: 'spa' }, backend: { type: 'node' }, ai_design: true });
  const r = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const written = JSON.parse(readFileSync(path.join(dir, '.ddt/tech-stack.json'), 'utf8'));
  assert.equal(written.frontend.type, 'spa');
  assert.equal(written.backend.type, 'node');
  assert.equal(written.ai_design, true);
  assert.ok(written.resolved_at);
});

test('resolve-tech-stack：tech-stack.json 已存在则拒绝二次写入（单点写入约束）', () => {
  const dir = newRepo();
  const input = JSON.stringify({ frontend: { type: 'none' }, backend: { type: 'node' } });
  const r1 = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.equal(r1.status, 0);
  const r2 = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /已存在|单点|exists/i);
});

test('resolve-tech-stack：缺必填字段 frontend/backend exit 非 0', () => {
  const dir = newRepo();
  const r = spawnSync('node', [script], { input: JSON.stringify({ ai_design: true }), cwd: dir, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /frontend|backend/);
});
```

- [ ] **Step 2: 运行确认失败** — `npm test -- tests/unit/ddt-resolve-tech-stack.test.mjs` → FAIL（ENOENT）

- [ ] **Step 3: 写最小实现** — Create `bin/resolve-tech-stack.mjs`:

```javascript
#!/usr/bin/env node
// resolve-tech-stack：单点写入 .ddt/tech-stack.json。已存在则拒绝（spec §4 单点写约束）。
// stdin 接收 {frontend:{type}, backend:{type}, ai_design?:boolean} JSON。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let obj;
try { obj = JSON.parse(raw); }
catch { process.stderr.write('[resolve-tech-stack] stdin 非合法 JSON\n'); process.exit(2); }

if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  process.stderr.write('[resolve-tech-stack] stdin 须为 JSON 对象\n'); process.exit(2);
}
if (!obj.frontend || typeof obj.frontend.type !== 'string') {
  process.stderr.write('[resolve-tech-stack] 缺必填字段 frontend.type\n'); process.exit(2);
}
if (!obj.backend || typeof obj.backend.type !== 'string') {
  process.stderr.write('[resolve-tech-stack] 缺必填字段 backend.type\n'); process.exit(2);
}
if (existsSync('.ddt/tech-stack.json')) {
  process.stderr.write('[resolve-tech-stack] .ddt/tech-stack.json 已存在；本工具是单点写入（spec §4），拒绝二次写入\n');
  process.exit(3);
}

obj.resolved_at = new Date().toISOString();
mkdirSync('.ddt', { recursive: true });
writeFileSync('.ddt/tech-stack.json', JSON.stringify(obj, null, 2), 'utf8');
process.stdout.write('[resolve-tech-stack] wrote .ddt/tech-stack.json\n');
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — PASS（3 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/resolve-tech-stack.mjs tests/unit/ddt-resolve-tech-stack.test.mjs
git -c commit.gpgsign=false commit -m "feat(activation): resolve-tech-stack 单点写入 .ddt/tech-stack.json"
```

---

### Task 5: `bin/ddt-contract-lint.mjs`（TDD，OpenAPI lint）

**Files:** Create `bin/ddt-contract-lint.mjs`; Create `tests/fixtures/ddt/openapi-valid.json`、`openapi-bad.json`、`openapi-valid.yaml`、`openapi-incomplete.yaml`; Create `tests/unit/ddt-contract-lint.test.mjs`

- [ ] **Step 1: 写夹具**

Create `tests/fixtures/ddt/openapi-valid.json`:
```json
{
  "openapi": "3.0.3",
  "info": { "title": "T", "version": "1.0.0" },
  "paths": {
    "/users": {
      "get": {
        "responses": { "200": { "description": "ok" }, "400": { "description": "bad" } }
      }
    }
  }
}
```

Create `tests/fixtures/ddt/openapi-bad.json`:
```json
{ "info": { "title": "T" } }
```

Create `tests/fixtures/ddt/openapi-valid.yaml`:
```
openapi: 3.0.3
info:
  title: T
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: ok
```

Create `tests/fixtures/ddt/openapi-incomplete.yaml`:
```
openapi: 3.0.3
info:
  title: T
```

- [ ] **Step 2: 写失败测试** — Create `tests/unit/ddt-contract-lint.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-contract-lint.mjs');
const fxPath = (n) => path.join(root, 'tests/fixtures/ddt', n);

function run(file) { return spawnSync('node', [script, file], { encoding: 'utf8' }); }

test('contract-lint：JSON 合法 OpenAPI exit 0', () => {
  const r = run(fxPath('openapi-valid.json'));
  assert.equal(r.status, 0);
});
test('contract-lint：JSON 缺必填段（openapi/paths）exit 非 0', () => {
  const r = run(fxPath('openapi-bad.json'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /openapi|paths/);
});
test('contract-lint：YAML 完整性扫描通过', () => {
  const r = run(fxPath('openapi-valid.yaml'));
  assert.equal(r.status, 0);
});
test('contract-lint：YAML 缺 paths/info.version exit 非 0', () => {
  const r = run(fxPath('openapi-incomplete.yaml'));
  assert.notEqual(r.status, 0);
});
test('contract-lint：文件不存在 exit 非 0', () => {
  const r = run('/nonexistent-xyz.yaml');
  assert.notEqual(r.status, 0);
});
```

- [ ] **Step 3: 运行确认失败** — FAIL（ENOENT）

- [ ] **Step 4: 写最小实现** — Create `bin/ddt-contract-lint.mjs`:

```javascript
#!/usr/bin/env node
// OpenAPI 契约 lint。JSON：完整 schema 校验；YAML：完整性扫描（regex 找必填段）。
// 零依赖（不引 yaml lib，限本 v1.0 起步够用——Plan 5+ 可升级真 yaml 解析）。
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  process.stderr.write('[ddt-contract-lint] 用法：node ddt-contract-lint.mjs <openapi.json|.yaml>\n');
  process.exit(2);
}
if (!existsSync(file)) {
  process.stderr.write(`[ddt-contract-lint] 文件不存在：${file}\n`);
  process.exit(2);
}
const raw = readFileSync(file, 'utf8');
const isYaml = /\.ya?ml$/i.test(file);
const errors = [];

if (isYaml) {
  // YAML 完整性扫描：grep 必填段在第 0 列出现
  if (!/^openapi:\s*\S/m.test(raw)) errors.push('YAML 缺 openapi 字段');
  if (!/^info:/m.test(raw)) errors.push('YAML 缺 info 段');
  if (!/^\s+title:\s*\S/m.test(raw)) errors.push('YAML 缺 info.title');
  if (!/^\s+version:\s*\S/m.test(raw)) errors.push('YAML 缺 info.version');
  if (!/^paths:/m.test(raw)) errors.push('YAML 缺 paths 段');
} else {
  let obj;
  try { obj = JSON.parse(raw); }
  catch { errors.push('非合法 JSON'); }
  if (obj && typeof obj === 'object') {
    if (typeof obj.openapi !== 'string') errors.push('缺 openapi 字段');
    if (!obj.info || typeof obj.info !== 'object') errors.push('缺 info 段');
    else {
      if (typeof obj.info.title !== 'string') errors.push('缺 info.title');
      if (typeof obj.info.version !== 'string') errors.push('缺 info.version');
    }
    if (!obj.paths || typeof obj.paths !== 'object') errors.push('缺 paths 段');
  }
}

if (errors.length) {
  process.stderr.write('[ddt-contract-lint] FAIL:\n  - ' + errors.join('\n  - ') + '\n');
  process.exit(1);
}
process.stdout.write(`[ddt-contract-lint] PASS: ${file}\n`);
process.exit(0);
```

- [ ] **Step 5: 运行确认通过** — PASS（5 测试绿）

- [ ] **Step 6: 提交**

```bash
git add bin/ddt-contract-lint.mjs tests/unit/ddt-contract-lint.test.mjs tests/fixtures/ddt/openapi-valid.json tests/fixtures/ddt/openapi-bad.json tests/fixtures/ddt/openapi-valid.yaml tests/fixtures/ddt/openapi-incomplete.yaml
git -c commit.gpgsign=false commit -m "feat(activation): ddt-contract-lint OpenAPI 契约 lint（JSON 完整+YAML 完整性扫描）"
```

---

### Task 6: `commands/ddt.md`（万能驱动闸门）

**Files:** Create `commands/ddt.md`

- [ ] **Step 1: 写命令** — Create `commands/ddt.md`（逐字）

```markdown
---
description: DDT v1.0 万能驱动闸门。无文本：重算 repo 状态推进到下一闸门。有文本：分类意图后路由到对应纪律 skill。
---

# /ddt — DDT 万能驱动闸门

你的任务是处理用户的 `/ddt [自由文本]` 调用，按下面流程执行：

## 1. 读 ddt-charter

先 invoke 名为 `ddt-charter` 的 skill 读宪法（如未注入 SessionStart 路径）。宪法定义 Iron Laws / 5 站脊柱 / 意图分类规则 / SSoT 铁律链。

## 2. 处理两种调用形态

### A. 无自由文本（纯 `/ddt`）

调 `bin/ddt-status.mjs` 重算 repo 事实（pending decisions、存在的 spec/plan 文件）→ 按 5 站脊柱判定**下一个该打断真人的闸门**：
- 有 pending decisions：报告人需异步裁决哪条
- 切片有 spec 但无 plan：可能推进到 plan 步
- 全绿低风险段：自动放行并记审计痕（不打断人）
- 其他：根据脊柱拓扑判定下一阶段

输出"在哪 / 下一步 / 谁该决策什么"摘要给用户。

### B. 带自由文本（`/ddt <文本>`）

按宪法"意图分类规则"将文本归类为：
- `genesis`（无 .ddt/ 时自动判定为起项目）
- `amend`（改/删需求）
- `new-feature`（新增需求）
- `bug`（bug 修复）
- `refactor`（重构）
- `rerun-slice`（局部重跑某切片）

**为各意图配 ddt_intent 字段**（强制层 hook 读这个字段判 IL）：
- `genesis` / `new-feature` / `amend` → `ddt_intent` 暂不设（属需求站，不在 build 上下文）
- `bug` → 装载 `ddt-systematic-debugging` skill 并设 `ddt_intent='debug'`
- `refactor` → `ddt_intent='refactor'`，进 `ddt-impl-spec` 走重构子句
- `rerun-slice` → `ddt_intent='enter-spec'` 或 `'enter-plan'`/`'enter-impl'`（视用户文本中是否提到具体阶段）+ 设 `ddt_slice=<切片 id>`

## 3. 写 `.ddt/state/current.json`（命令→hook 字段桥）

每次 `/ddt` 路由完意图后，**必须写一次** `.ddt/state/current.json`：

```json
{ "ddt_intent": "<分类结果>", "ddt_slice": "<可选，切片 id>", "set_by": "/ddt", "at": "<ISO8601>" }
```

此文件供 hook 在 stdin 缺字段时 fallback 读取（Plan 4 Task 1）。这是 transient 工作态文件，**不是 SSoT 真相**，下次 `/ddt` 覆盖。

## 4. 装载对应纪律 skill 并开始工作

按意图分类装载 skill 并按其纪律开展工作循环。所有重大决策点（spec/plan/契约/出包等）由对应 skill 内置的人工闸门驱动。

## 5. 风险地板与右尺寸化

按宪法比例原则：分类器只能升档不能降档；触及 `认证/授权/资金/数据迁移/契约/用户数据删除/部署配置` 任一恒最高硬度；验证/交付永不自动放行。

## 失败模式

- preflight 检查失败（hook 未注册）→ 拒绝启动并提示运行 `bin/ddt-hook-preflight.mjs` 修复
- 意图分类不确定时主动问用户而非猜测
- 任何 hook 阻断须以 IL 引用回报用户
```

- [ ] **Step 2: 校验 frontmatter** — `node -e "const f=require('fs').readFileSync('commands/ddt.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/description:\s*\S/.test(m[1]))throw 1;console.log('ddt command frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add commands/ddt.md
git -c commit.gpgsign=false commit -m "feat(activation): /ddt 万能驱动闸门（意图分类+state 桥+skill 路由）"
```

---

### Task 7: `commands/ddt-status.md`（只读重算）

**Files:** Create `commands/ddt-status.md`

- [ ] **Step 1: 写命令** — Create `commands/ddt-status.md`（逐字）

```markdown
---
description: DDT v1.0 只读重算。从 repo 事实（git 历史+decisions+文件存在性）计算"在哪/下一步/挂着哪些 pending/当前效能快照"，不推进不改任何东西。
---

# /ddt-status — 只读状态重算

执行以下流程，**仅读不写**：

## 1. 重算事实

调 `bin/ddt-status.mjs` 输出 JSON：
- `pending_decisions`：未 resolved 的 pending 决策记录
- `slice_specs`：`docs/specs/` 下存在的 spec 文件
- `slice_plans`：`docs/plans/` 下存在的 plan 文件

## 2. 反推进度（IL-7 落点）

按 spec §3：进度从 git trailer + decisions + spec/plan 文件存在性**反推**，不信会话自述。

调 `git log --pretty='%B' -n 20` 解析最近 commit 的 trailer（`stage:`、`slice:`、`task:`、`evidence-ref:`），归纳"最近活动落在哪个站、哪个切片、哪个任务"。

## 3. 人话摘要

按以下结构输出：

```
DDT v1.0 状态（从 repo 事实反推）
=================================
最近活动：<stage>/<slice>/<task>（commit <SHA> at <date>）
待决闸门（<n> 条）：
  - <gate> 由 <owner_role> 裁决，criteria: <decision_criteria>
切片 spec：<n> 份（<列表>）
切片 plan：<n> 份（<列表>）
下一步建议：<根据脊柱推理>
效能快照（待 Plan 5 激活完整 ROI）：本 plan 仅显示 "metrics layer pending"
```

## 4. 不推进、不改、不打断

本命令**绝不**写任何文件、绝不调 .ddt/state/current.json、绝不路由到 skill。仅输出文本给用户。
```

- [ ] **Step 2: 校验** — `node -e "const f=require('fs').readFileSync('commands/ddt-status.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/description:/.test(m[1]))throw 1;console.log('ddt-status command frontmatter OK')"`

- [ ] **Step 3: 提交**

```bash
git add commands/ddt-status.md
git -c commit.gpgsign=false commit -m "feat(activation): /ddt-status 只读重算命令（IL-7 反推承载者）"
```

---

### Task 8: 激活 `ddt-design` 契约 lint 硬门段

**Files:** Modify `skills/ddt-design/SKILL.md`

- [ ] **Step 1: 修改 SKILL.md** — 把：

```markdown
> **已知激活依赖（spec 洞4 同型诚实标注）**：`bin/ddt-contract-lint.mjs` 由 Plan 4 实现并接入 `/ddt` 命令。在 Plan 4 落地前，本硬门**降级为人工检查 + ddt-requesting-review 当面要求 lint 通过证据**——属"未受强制层校验"状态，进 ddt-impl-spec 前必须显式声明。
```

替换为：

```markdown
> **激活状态（Plan 4 已落地）**：`bin/ddt-contract-lint.mjs` 已实现，命令调用：`node bin/ddt-contract-lint.mjs openapi/<file>.yaml` exit=0 才算通过。建议在 `/ddt` 路由进 ddt-impl-spec 前自动跑一次 lint 并附结果到 Spec Reviewer 的 cited_evidence 数组。
```

- [ ] **Step 2: 提交**

```bash
git add skills/ddt-design/SKILL.md
git -c commit.gpgsign=false commit -m "feat(activation): 激活 ddt-design 契约 lint 硬门（bin/ddt-contract-lint.mjs 已落）"
```

---

### Task 9: 端到端集成测试 + 全量回归

**Files:** Create `tests/integration/ddt-activation.test.mjs`

- [ ] **Step 1: 写测试** — Create `tests/integration/ddt-activation.test.mjs`（逐字）

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('2 个命令文件就位且 frontmatter 合法', () => {
  for (const c of ['ddt.md', 'ddt-status.md']) {
    const f = path.join(root, 'commands', c);
    assert.ok(existsSync(f), c + ' 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, c + ' 无 frontmatter');
    assert.match(m[1], /description:\s*\S/, c + ' 缺 description');
  }
});

test('5 个 bin 承重件就位', () => {
  for (const b of ['ddt-status.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs', 'resolve-tech-stack.mjs', 'ddt-contract-lint.mjs']) {
    assert.ok(existsSync(path.join(root, 'bin', b)), 'bin/' + b + ' 缺失');
  }
});

test('/ddt 命令含 state 桥与意图分类引用', () => {
  const s = readFileSync(path.join(root, 'commands/ddt.md'), 'utf8');
  assert.match(s, /\.ddt\/state\/current\.json/);
  assert.match(s, /ddt-charter/);
  assert.match(s, /意图/);
});

test('/ddt-status 命令含 IL-7 反推语义', () => {
  const s = readFileSync(path.join(root, 'commands/ddt-status.md'), 'utf8');
  assert.match(s, /反推|从 repo 事实/);
  assert.match(s, /git trailer|git log/);
  assert.match(s, /仅读不写|不推进、不改|绝不/);
});

test('ddt-design 契约 lint 硬门已激活（不再含"待激活"）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design/SKILL.md'), 'utf8');
  assert.match(s, /激活状态.*Plan 4 已落地|已实现/);
  assert.doesNotMatch(s, /已知激活依赖.*Plan 4 实现并接入/);
});
```

- [ ] **Step 2: 运行集成测试** — `npm test -- tests/integration/ddt-activation.test.mjs` → PASS（5 测试绿）

- [ ] **Step 3: 全量回归** — `npm test` → Plan 1+2+3+4 全部测试绿。Plan 3 后 56 + 本 plan 增量（~20 测试）= 约 76（以实跑为准）。

- [ ] **Step 4: 提交**

```bash
git add tests/integration/ddt-activation.test.mjs
git -c commit.gpgsign=false commit -m "test(activation): 命令文件+bin 承重件+激活归属端到端集成测试"
```

---

### 后续计划

- **Plan 5（最后一站）**：度量层 hook 被动埋点 + ddt-deliver 第 4 节 ROI 报告生成 + 降低保障级标记汇总 + spec/skill 已激活归属同步更新。

---

### Self-Review

**1. Spec 覆盖**：
- spec §7 2 命令 → Task 6/7 ✓
- spec §9 bin 承重件（resolve-tech-stack/契约 lint/status 事实提取/decisions·changelog 追加器）→ Task 2-5 ✓
- spec §4 剪枝依赖 tech-stack.json 单点写 → Task 4 ✓
- spec §8 IL hook 在生产路径生效（K-1 ddt_intent 注入缺口）→ Task 1 state 桥 + Task 6 命令写 state ✓
- Plan 3 ddt-design 契约 lint 激活 → Task 8 ✓
- IL-7 反推由 /ddt-status 实现（Plan 1+2 Final Reviewer 备忘）→ Task 7 ✓

**2. 占位符扫描**：所有 task 含完整代码 + 具体命令 + 预期输出。Plan 5 项目（ROI 报告生成、被动埋点）明列归属，非占位。

**3. 类型/签名一致性**：
- `.ddt/state/current.json` schema `{ddt_intent, ddt_slice?, set_by, at}` 在 Task 1（hook fallback 读取）、Task 6（命令写入）一致
- 5 个 bin 承重件 stdin/argv 约定与 Task 6/7 命令调用方式一致
- IL hook ev 字段（ddt_intent/ddt_slice）跨 Task 1 fallback 与 Plan 1/2 既有 enforce 分支一致

**4. 决策记录（spec 偏离待后续修订）**：
- 引入 `.ddt/state/current.json` 第四类 transient 工作态文件（非 SSoT），spec §3.2 当前文本只说"三件真相"，应在 Plan 5 spec 修订时补一句区分 transient working state vs SSoT
- 与 Plan 3 决策（不建 agents/ 顶层）同型——必要实现层裁决，避免架构空想阻塞落地

**5. 已知限制**：
- contract-lint 对 YAML 仅完整性扫描，不解析嵌套结构。Plan 5+ 可升级到真 yaml 解析（引入零依赖 yaml 解析器或诚实加 yaml 依赖）
- /ddt 命令的"意图分类"由 Claude 解读宪法+命令文本完成，质量取决于宪法措辞——属 prompt engineering 维度，可被 TDD-for-skills（spec §15.2 Tier-2 延后）后续加固

**6. 端到端最大风险**：state 桥在生产路径生效**前**已有 Plan 1/2 hook 测试就绪，故 Plan 4 完成时 hook 在测试与生产都可用——但**真实 Claude Code 环境下 `/ddt` 命令能否如期写 state、hook 能否如期 fallback 读，须等用户在真实 Claude Code 下手验**（spec §13#4 强制层单点风险——preflight 已防 hook 缺失，但 state 桥的运行时表现需真实环境验收）。集成测试覆盖了文件结构与单元层 fallback，但跨进程实际跑跑只能在 Plan 5 阶段或用户验收阶段进行。
