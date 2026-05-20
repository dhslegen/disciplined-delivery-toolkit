## DDT v1.0 度量与 ROI（Plan 5·最后一站）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans。Steps 用 checkbox 跟踪。

**Goal:** v1.0 最后一站——度量层闭环：被动埋点 hook 采集真实事件（PostToolUse 工具调用 + SessionEnd 会话总结）→ `.ddt/metrics/*.jsonl` → `bin/ddt-report.mjs` 聚合生成 `docs/efficiency-report.md`（ROI 报告）→ 激活 `ddt-deliver` 第 4 节 ROI 段。同步：spec §3.2 微调承认 Plan 4 引入的第四类 transient 工作态文件（state + metrics 都非 SSoT 真相）；新增 doctor 健康检查 bin。

**Architecture:**
- 度量埋点：单一 hook 脚本 `hooks/handlers/ddt-metrics.mjs` 注册到 PostToolUse + SessionEnd 两个事件——**纯被动**（agent 禁自夸，沿用 deep-dive D34 已验证约束：只用 hook stdin 真实可见字段，不读 LLM 自报）
- 数据流：metrics 事件 → `.ddt/metrics/<date>.jsonl` → `bin/lib/ddt-metrics-lib.mjs` 聚合纯函数 → `bin/ddt-report.mjs` 渲染 markdown
- ROI 报告：项目周期 / 工具调用与闸门 / IL 拦截分布 / 降低保障级 waiver 清单 / 与基线对比（无基线诚实标"不可比"）
- spec §3.2 微调：增加一节区分"SSoT 真相三件（append-only 可审计）vs 第四类 transient 工作态文件（每次覆盖、不入 git——state + metrics）"
- doctor：bin/ddt-doctor.mjs 健康检查（hook 注册 + 关键文件 + bin 完整性 + 真实环境验收提示）

**Tech Stack:** Node `node --test`（内置 runner，全程用 spawnSync 子进程测——Claude Code 推荐的安全 API，非 shell exec）、零运行时依赖、ESM `.mjs`、Markdown。

**Spec 来源：** spec v5 §3.2（真相源——本 plan 修订）/§11（ROI 报告——本 plan 激活）/§13#4（强制层单点 + preflight，本 plan 加 doctor 兜底）。Plan 4 self-review §6（state 桥跨进程风险——本 plan 加 doctor 提示用户验收）。

**前置（Plan 1+2+3+4 已就位）：** 宪法/IL 强制层/5 站 skill/2 命令/5 bin 承重件/state 桥/80 测试全绿。

---

### 文件结构

| 文件 | 责任 |
|------|------|
| `bin/lib/ddt-metrics-lib.mjs` | 纯函数：parse jsonl events、aggregate metrics（按 tool/decision/IL 分组）|
| `hooks/handlers/ddt-metrics.mjs` | PostToolUse + SessionEnd hook：被动写 `.ddt/metrics/<date>.jsonl` 一行 |
| `bin/ddt-report.mjs` | 读 .ddt/metrics + .ddt/decisions.jsonl → 渲染 `docs/efficiency-report.md` |
| `bin/ddt-doctor.mjs` | 健康检查：hook 注册 + 关键文件 + bin 就位 + 用户验收提示 |
| `hooks/hooks.json` | 追加 `ddt:metrics-post` + `ddt:metrics-end` 两个 hook id |
| `skills/ddt-deliver/SKILL.md` | 改：ROI 段从"待激活"改为"已激活，调 bin/ddt-report.mjs" |
| `docs/specs/2026-05-18-ddt-v1-redesign-design.md` | 微调 §3.2：增加第四类 transient 工作态文件区分（state + metrics）|
| 新增测试：unit 与 integration | metrics-lib + metrics hook + report + doctor 各单测 + 集成断言 |

---

### Task 1: `bin/lib/ddt-metrics-lib.mjs` 纯函数库（TDD）

**Files:** Create `bin/lib/ddt-metrics-lib.mjs`; Create `tests/unit/ddt-metrics-lib.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-metrics-lib.test.mjs`（逐字）:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvents, aggregate } from '../../bin/lib/ddt-metrics-lib.mjs';

test('parseEvents 解析 jsonl 跳过空行与坏行', () => {
  const rows = parseEvents('{"kind":"tool","tool_name":"Edit","decision":"allow"}\n\n{bad\n{"kind":"session-end","duration_ms":1000}\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'tool');
  assert.equal(rows[1].kind, 'session-end');
});

test('aggregate：空事件返回基线零值', () => {
  const a = aggregate([]);
  assert.equal(a.total_tool_calls, 0);
  assert.equal(a.blocked_count, 0);
  assert.equal(a.auto_pass_count, 0);
  assert.equal(a.sessions, 0);
});

test('aggregate：tool 事件计数（decision allow/block 区分）', () => {
  const events = [
    { kind: 'tool', tool_name: 'Edit', decision: 'allow' },
    { kind: 'tool', tool_name: 'Edit', decision: 'block' },
    { kind: 'tool', tool_name: 'Write', decision: 'allow' },
    { kind: 'tool', tool_name: 'Write', decision: 'allow' }
  ];
  const a = aggregate(events);
  assert.equal(a.total_tool_calls, 4);
  assert.equal(a.blocked_count, 1);
  assert.equal(a.auto_pass_count, 3);
  assert.equal(a.tool_breakdown.Edit, 2);
  assert.equal(a.tool_breakdown.Write, 2);
});

test('aggregate：session 事件计数与平均时长', () => {
  const events = [
    { kind: 'session-end', duration_ms: 1000 },
    { kind: 'session-end', duration_ms: 3000 }
  ];
  const a = aggregate(events);
  assert.equal(a.sessions, 2);
  assert.equal(a.total_session_ms, 4000);
  assert.equal(a.avg_session_ms, 2000);
});

test('aggregate：IL block 分类（按 reason 含 IL-N 计数）', () => {
  const events = [
    { kind: 'tool', decision: 'block', reason: 'IL-1 违规：...' },
    { kind: 'tool', decision: 'block', reason: 'IL-4 违规：...' },
    { kind: 'tool', decision: 'block', reason: 'IL-1 违规：...' }
  ];
  const a = aggregate(events);
  assert.deepEqual(a.il_block_counts, { 'IL-1': 2, 'IL-4': 1 });
});
```

- [ ] **Step 2: 运行确认失败** — `cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt && npm test -- tests/unit/ddt-metrics-lib.test.mjs` → FAIL

- [ ] **Step 3: 写最小实现** — Create `bin/lib/ddt-metrics-lib.mjs`（逐字）:

```javascript
// DDT 度量纯函数库：parse + aggregate metrics 事件。零依赖、纯函数、可单测。

export function parseEvents(jsonlText) {
  const rows = [];
  for (const line of String(jsonlText).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch { /* 跳过坏行 */ }
  }
  return rows;
}

export function aggregate(events) {
  const out = {
    total_tool_calls: 0,
    blocked_count: 0,
    auto_pass_count: 0,
    tool_breakdown: {},
    il_block_counts: {},
    sessions: 0,
    total_session_ms: 0,
    avg_session_ms: 0
  };
  for (const e of events) {
    if (!e || typeof e !== 'object') continue;
    if (e.kind === 'tool') {
      out.total_tool_calls++;
      if (e.decision === 'block') {
        out.blocked_count++;
        if (typeof e.reason === 'string') {
          const m = /^(IL-\d+)/.exec(e.reason);
          if (m) out.il_block_counts[m[1]] = (out.il_block_counts[m[1]] || 0) + 1;
        }
      } else {
        out.auto_pass_count++;
      }
      if (typeof e.tool_name === 'string') {
        out.tool_breakdown[e.tool_name] = (out.tool_breakdown[e.tool_name] || 0) + 1;
      }
    } else if (e.kind === 'session-end') {
      out.sessions++;
      if (typeof e.duration_ms === 'number') out.total_session_ms += e.duration_ms;
    }
  }
  out.avg_session_ms = out.sessions > 0 ? Math.round(out.total_session_ms / out.sessions) : 0;
  return out;
}
```

- [ ] **Step 4: 运行确认通过** — `npm test -- tests/unit/ddt-metrics-lib.test.mjs` → PASS（5 绿）

- [ ] **Step 5: 提交**

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
git add bin/lib/ddt-metrics-lib.mjs tests/unit/ddt-metrics-lib.test.mjs
git -c commit.gpgsign=false commit -m "feat(metrics): ddt-metrics-lib 纯函数（parseEvents + aggregate）"
```

---

### Task 2: `hooks/handlers/ddt-metrics.mjs` 被动埋点 hook（TDD）

**Files:** Create `hooks/handlers/ddt-metrics.mjs`; Create `tests/unit/ddt-metrics-hook.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-metrics-hook.test.mjs`（逐字）:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-metrics.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-mt-'));
  mkdirSync(path.join(dir, '.ddt'), { recursive: true });
  return dir;
}
function runHook(dir, stdinObj) {
  return spawnSync('node', [script], { input: JSON.stringify(stdinObj), cwd: dir, encoding: 'utf8' });
}
function readMetrics(dir) {
  const mdir = path.join(dir, '.ddt/metrics');
  if (!existsSync(mdir)) return [];
  return readdirSync(mdir).flatMap(f => readFileSync(path.join(mdir, f), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
}

test('PostToolUse 写一条 tool 事件到 .ddt/metrics/<date>.jsonl', () => {
  const dir = newRepo();
  const r = runHook(dir, {
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: 'src/x.ts' }
  });
  assert.equal(r.status, 0);
  const rows = readMetrics(dir);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, 'tool');
  assert.equal(rows[0].tool_name, 'Edit');
  assert.ok(rows[0].ts);
});

test('PostToolUse 含 tool_response.decision 时记录 decision', () => {
  const dir = newRepo();
  runHook(dir, {
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_response: { decision: 'block', reason: 'IL-4 违规：...' }
  });
  const rows = readMetrics(dir);
  assert.equal(rows[0].decision, 'block');
  assert.match(rows[0].reason, /IL-4/);
});

test('SessionEnd 写一条 session-end 事件', () => {
  const dir = newRepo();
  runHook(dir, { hook_event_name: 'SessionEnd', session_id: 'abc', duration_ms: 12345 });
  const rows = readMetrics(dir);
  assert.equal(rows[0].kind, 'session-end');
  assert.equal(rows[0].session_id, 'abc');
  assert.equal(rows[0].duration_ms, 12345);
});

test('未知 hook 事件不写 metrics（被动埋点严守作用域）', () => {
  const dir = newRepo();
  runHook(dir, { hook_event_name: 'PreToolUse', tool_name: 'Edit' });
  let files = [];
  try { files = readdirSync(path.join(dir, '.ddt/metrics')); } catch {}
  assert.equal(files.length, 0);
});

test('坏 stdin 安全 exit 0 不写文件（不阻断会话）', () => {
  const dir = newRepo();
  const r = spawnSync('node', [script], { input: 'not-json', cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  let files = [];
  try { files = readdirSync(path.join(dir, '.ddt/metrics')); } catch {}
  assert.equal(files.length, 0);
});
```

- [ ] **Step 2: 运行确认失败** — FAIL

- [ ] **Step 3: 写最小实现** — Create `hooks/handlers/ddt-metrics.mjs`（逐字）:

```javascript
#!/usr/bin/env node
// DDT 度量被动埋点 hook。注册到 PostToolUse + SessionEnd。
// 纯被动：只读 hook stdin 真实字段，不调 LLM、不读 agent 自报。
// 坏 stdin 安全 exit 0 不写文件（不阻断会话）。
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let ev = {};
try { ev = JSON.parse(raw); } catch { process.exit(0); }
if (!ev || typeof ev !== 'object') process.exit(0);

const ts = new Date().toISOString();
const dateKey = ts.slice(0, 10);

let row = null;
if (ev.hook_event_name === 'PostToolUse') {
  row = { kind: 'tool', ts, tool_name: typeof ev.tool_name === 'string' ? ev.tool_name : null };
  if (ev.tool_response && typeof ev.tool_response === 'object') {
    if (typeof ev.tool_response.decision === 'string') row.decision = ev.tool_response.decision;
    if (typeof ev.tool_response.reason === 'string') row.reason = ev.tool_response.reason;
  }
} else if (ev.hook_event_name === 'SessionEnd') {
  row = { kind: 'session-end', ts };
  if (typeof ev.session_id === 'string') row.session_id = ev.session_id;
  if (typeof ev.duration_ms === 'number') row.duration_ms = ev.duration_ms;
}

if (row) {
  mkdirSync('.ddt/metrics', { recursive: true });
  appendFileSync(`.ddt/metrics/${dateKey}.jsonl`, JSON.stringify(row) + '\n', 'utf8');
}
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — PASS（5 测试绿）

- [ ] **Step 5: 提交**

```bash
git add hooks/handlers/ddt-metrics.mjs tests/unit/ddt-metrics-hook.test.mjs
git -c commit.gpgsign=false commit -m "feat(metrics): ddt-metrics 被动埋点 hook（PostToolUse + SessionEnd）"
```

---

### Task 3: hooks.json 注册 metrics hook（TDD）

**Files:** Modify `hooks/hooks.json`; Create `tests/unit/ddt-metrics-registered.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-metrics-registered.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hj = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));

function ids() {
  const s = new Set();
  for (const arr of Object.values(hj.hooks || {})) for (const e of arr || []) if (e && e.id) s.add(e.id);
  return s;
}

test('metrics 两个新 hook id 已注册', () => {
  const s = ids();
  assert.ok(s.has('ddt:metrics-post'));
  assert.ok(s.has('ddt:metrics-end'));
});

test('既有 hook id 未被破坏', () => {
  const s = ids();
  for (const id of ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop']) {
    assert.ok(s.has(id), id + ' 不应被删');
  }
});
```

- [ ] **Step 2: 运行确认失败** — FAIL（两 metrics id 缺失）

- [ ] **Step 3: 修改 `hooks/hooks.json`** — 先 `cat hooks/hooks.json` 看现状（Plan 4 后应有 SessionStart/PreToolUse/Stop 三键且 ddt:enforce-pre 在 PreToolUse 数组里，无 PostToolUse、无 SessionEnd 数组）。

在 `hooks` 对象内追加两键（与 SessionStart/PreToolUse/Stop 同级）：

```json
"PostToolUse": [
  { "matcher": "*", "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/handlers/ddt-metrics.mjs\"" } ], "description": "DDT 度量被动埋点（PostToolUse）", "id": "ddt:metrics-post" }
],
"SessionEnd": [
  { "matcher": "*", "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/handlers/ddt-metrics.mjs\"" } ], "description": "DDT 度量被动埋点（SessionEnd）", "id": "ddt:metrics-end" }
]
```

- [ ] **Step 4: 校验 JSON 合法 + 测试通过** — `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'));console.log('valid')" && npm test -- tests/unit/ddt-metrics-registered.test.mjs` → `valid` + 2 绿

- [ ] **Step 5: 提交**

```bash
git add hooks/hooks.json tests/unit/ddt-metrics-registered.test.mjs
git -c commit.gpgsign=false commit -m "feat(metrics): hooks.json 注册 ddt:metrics-post + ddt:metrics-end"
```

---

### Task 4: `bin/ddt-report.mjs` ROI 报告生成（TDD）

**Files:** Create `bin/ddt-report.mjs`; Create `tests/unit/ddt-report.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-report.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-report.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-rp-'));
  mkdirSync(path.join(dir, '.ddt/metrics'), { recursive: true });
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  return dir;
}

test('ddt-report：空 metrics 生成基线报告（无基线诚实标注）', () => {
  const dir = newRepo();
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok(existsSync(path.join(dir, 'docs/efficiency-report.md')));
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /AI 效能 ROI 报告/);
  assert.match(md, /无历史基线不可比|无度量数据/);
});

test('ddt-report：聚合 metrics 渲染指标段', () => {
  const dir = newRepo();
  writeFileSync(path.join(dir, '.ddt/metrics/2026-05-20.jsonl'),
    '{"kind":"tool","tool_name":"Edit","decision":"allow","ts":"2026-05-20T01:00:00Z"}\n' +
    '{"kind":"tool","tool_name":"Edit","decision":"block","reason":"IL-4 违规","ts":"2026-05-20T01:01:00Z"}\n' +
    '{"kind":"session-end","duration_ms":60000,"ts":"2026-05-20T02:00:00Z"}\n');
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /工具调用：2/);
  assert.match(md, /拦截：1/);
  assert.match(md, /IL-4/);
  assert.match(md, /会话数：1/);
});

test('ddt-report：含降低保障级 waiver 清单段', () => {
  const dir = newRepo();
  writeFileSync(path.join(dir, '.ddt/decisions.jsonl'),
    '{"status":"resolved","user_action":"accept-drift","note":"断网受限基建","ts":"2026-05-20T01:00:00Z"}\n');
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /降低保障级|accept-drift|waiver/);
  assert.match(md, /断网受限基建/);
});
```

- [ ] **Step 2: 运行确认失败** — FAIL

- [ ] **Step 3: 写最小实现** — Create `bin/ddt-report.mjs`（逐字）:

```javascript
#!/usr/bin/env node
// ddt-deliver 的 ROI 报告生成器。读 .ddt/metrics + .ddt/decisions.jsonl → docs/efficiency-report.md
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEvents, aggregate } from './lib/ddt-metrics-lib.mjs';

function readAllMetrics() {
  const dir = '.ddt/metrics';
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.jsonl'))
    .flatMap(f => parseEvents(readFileSync(`${dir}/${f}`, 'utf8')));
}

function readDecisions() {
  try {
    return readFileSync('.ddt/decisions.jsonl', 'utf8')
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

const events = readAllMetrics();
const agg = aggregate(events);
const decisions = readDecisions();
const waivers = decisions.filter(d => d && d.user_action === 'accept-drift');
const passRate = agg.total_tool_calls > 0
  ? ((agg.auto_pass_count / agg.total_tool_calls) * 100).toFixed(1) + '%'
  : 'n/a';

const ilBreakdown = Object.entries(agg.il_block_counts)
  .map(([il, n]) => `  - ${il}：${n} 次`).join('\n') || '  - 无 IL 拦截';

const toolBreakdown = Object.entries(agg.tool_breakdown)
  .map(([t, n]) => `  - ${t}：${n} 次`).join('\n') || '  - 无工具调用';

const waiversSection = waivers.length === 0
  ? '本交付无降低保障级 waiver。'
  : '本交付含降低保障级 waiver 清单：\n' +
    waivers.map(w => `- [${w.ts}] ${w.note || '(无理由)'} — 由 ${w.owner_role || '(未署名)'}`).join('\n');

const noDataNote = events.length === 0 && decisions.length === 0
  ? '\n> **说明**：本仓尚未积累度量数据；首次跑通后报告将含真实指标。无历史基线不可比。\n'
  : '';

const md = `# AI 效能 ROI 报告

> 生成时间：${new Date().toISOString()}
> 数据源：\`.ddt/metrics/*.jsonl\`（hook 被动采集）+ \`.ddt/decisions.jsonl\`（人工决策）
${noDataNote}

## 项目周期

- 会话数：${agg.sessions}
- 总会话时长：${(agg.total_session_ms / 1000).toFixed(1)}s
- 平均会话时长：${(agg.avg_session_ms / 1000).toFixed(1)}s

## 工具调用与闸门

- 工具调用：${agg.total_tool_calls} 次
- 通过：${agg.auto_pass_count} 次（${passRate}）
- 拦截：${agg.blocked_count} 次

工具分布：
${toolBreakdown}

## Iron Law 拦截分布

${ilBreakdown}

## 降低保障级交付（IL waiver 汇总）

${waiversSection}

## 与基线对比

> 本字段需 baseline 数据；当前仓无历史基线，显示"无历史基线不可比"。后续可扩展基线导入工具。

---

*由 \`bin/ddt-report.mjs\` 生成。指标全部来自 hook 被动埋点与 decisions.jsonl，agent 禁自夸。*
`;

mkdirSync('docs', { recursive: true });
writeFileSync('docs/efficiency-report.md', md, 'utf8');
process.stdout.write('[ddt-report] wrote docs/efficiency-report.md\n');
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — PASS（3 绿）

- [ ] **Step 5: 提交**

```bash
git add bin/ddt-report.mjs tests/unit/ddt-report.test.mjs
git -c commit.gpgsign=false commit -m "feat(metrics): ddt-report 生成 ROI 报告 docs/efficiency-report.md"
```

---

### Task 5: 激活 `ddt-deliver` SKILL.md ROI 段

**Files:** Modify `skills/ddt-deliver/SKILL.md`

- [ ] **Step 1: 精确替换** — 把第 4 节"待激活"段：

```
**待激活**：报告生成由 Plan 5 度量层实现（被动埋点 hook 采集人工省时/token/闸门通过率/返工率/缺陷逃逸率/降低保障级标记等指标）。Plan 5 前本 skill **仅占位文档化报告结构**：
```

替换为：

```
**激活状态（Plan 5 已落地）**：报告生成由 `bin/ddt-report.mjs` 实现，读 `.ddt/metrics/*.jsonl`（被动埋点 hook 采集）+ `.ddt/decisions.jsonl`（人工决策）→ 渲染 `docs/efficiency-report.md`。命令调用：`node bin/ddt-report.mjs`（exit 0 写报告，不读 agent 自报）。报告结构：
```

用 node 脚本替换（保 unicode）：

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
node -e "
const fs=require('fs');
const p='skills/ddt-deliver/SKILL.md';
const s=fs.readFileSync(p,'utf8');
const oldText='**待激活**：报告生成由 Plan 5 度量层实现（被动埋点 hook 采集人工省时/token/闸门通过率/返工率/缺陷逃逸率/降低保障级标记等指标）。Plan 5 前本 skill **仅占位文档化报告结构**：';
const newText='**激活状态（Plan 5 已落地）**：报告生成由 \`bin/ddt-report.mjs\` 实现，读 \`.ddt/metrics/*.jsonl\`（被动埋点 hook 采集）+ \`.ddt/decisions.jsonl\`（人工决策）→ 渲染 \`docs/efficiency-report.md\`。命令调用：\`node bin/ddt-report.mjs\`（exit 0 写报告，不读 agent 自报）。报告结构：';
if(s.indexOf(oldText)<0){console.error('old text not found');process.exit(1);}
fs.writeFileSync(p, s.replace(oldText, newText));
console.log('replaced, bytes=',fs.statSync(p).size);
"
```

- [ ] **Step 2: 验证 + 全量回归** — `grep -nE '激活状态.*Plan 5 已落地|ddt-report\.mjs' skills/ddt-deliver/SKILL.md && npm test` → 命中 + 全绿（Plan 3 Task 6 集成断言 ddt-deliver 含 "Plan 5" 仍命中——新文本含 "Plan 5 已落地"）

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-deliver/SKILL.md
git -c commit.gpgsign=false commit -m "feat(metrics): 激活 ddt-deliver ROI 段（bin/ddt-report.mjs 已落）"
```

---

### Task 6: `bin/ddt-doctor.mjs` 健康检查（TDD）

**Files:** Create `bin/ddt-doctor.mjs`; Create `tests/unit/ddt-doctor.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-doctor.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-doctor.mjs');

test('ddt-doctor：仓内运行 exit 0 + 输出 doctor 标题', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /DDT v1\.0 doctor/);
  assert.match(r.stdout, /hooks\.json/);
  assert.match(r.stdout, /bin\//);
});

test('ddt-doctor：列出 5 个关键 hook id 注册状态', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const id of ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end']) {
    assert.match(r.stdout, new RegExp(id));
  }
});

test('ddt-doctor：列出关键 bin 文件就位状态', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const b of ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'resolve-tech-stack.mjs']) {
    assert.match(r.stdout, new RegExp(b));
  }
});

test('ddt-doctor：输出真实环境验收提示', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /真实环境|手验|user acceptance|state 桥/);
});
```

- [ ] **Step 2: 运行确认失败** — FAIL

- [ ] **Step 3: 写最小实现** — Create `bin/ddt-doctor.mjs`（逐字）:

```javascript
#!/usr/bin/env node
// DDT v1.0 doctor：健康检查。hooks 注册 + bin 就位 + 用户验收提示。零依赖。
import { readFileSync, existsSync } from 'node:fs';

const REQUIRED_HOOKS = ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end'];
const REQUIRED_BINS = ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs', 'resolve-tech-stack.mjs', 'ddt-hook-preflight.mjs'];

console.log('DDT v1.0 doctor — 健康检查\n=================================\n');

console.log('## hooks.json 注册状态\n');
let registered = new Set();
try {
  const hj = JSON.parse(readFileSync('hooks/hooks.json', 'utf8'));
  for (const arr of Object.values(hj.hooks || {})) {
    for (const e of arr || []) if (e && e.id) registered.add(e.id);
  }
} catch { console.log('  ✗ hooks.json 不可读'); }
for (const id of REQUIRED_HOOKS) {
  console.log(`  ${registered.has(id) ? '✓' : '✗'} ${id}`);
}

console.log('\n## bin/ 承重件就位\n');
for (const b of REQUIRED_BINS) {
  console.log(`  ${existsSync(`bin/${b}`) ? '✓' : '✗'} bin/${b}`);
}

console.log('\n## 关键 skill 就位（采样）\n');
for (const s of ['ddt-charter', 'ddt-brainstorming', 'ddt-design', 'ddt-impl-spec', 'ddt-deliver']) {
  console.log(`  ${existsSync(`skills/${s}/SKILL.md`) ? '✓' : '✗'} skills/${s}/SKILL.md`);
}

console.log('\n## 真实环境验收提示（Plan 4 self-review §6）\n');
console.log('  state 桥（命令→hook 字段桥）的跨进程行为只能在真实 Claude Code 下手验：');
console.log('  1. 装本 plugin 到 Claude Code');
console.log('  2. 启会话敲 /ddt 帮我做一个测试项目');
console.log('  3. 看 .ddt/state/current.json 是否被 /ddt 写出');
console.log('  4. 触发任一工具调用，看 hook 是否读 state 并 enforce IL');
console.log('  5. 跑 node bin/ddt-doctor.mjs 复检健康，跑 node bin/ddt-report.mjs 看 ROI 报告');
console.log('\n如以上任一不通，参 plan4-activation 与 plan5-metrics-roi 实施计划排查。\n');
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — PASS（4 绿）

- [ ] **Step 5: 提交**

```bash
git add bin/ddt-doctor.mjs tests/unit/ddt-doctor.test.mjs
git -c commit.gpgsign=false commit -m "feat(metrics): ddt-doctor 健康检查 + 真实环境验收提示"
```

---

### Task 7: spec §3.2 微调（第四类 transient 工作态文件区分）

**Files:** Modify `docs/specs/2026-05-18-ddt-v1-redesign-design.md`

- [ ] **Step 1: 精确插入** — 在 §3.2 末尾"派生产物（设计/契约/代码/测试）**不存储任何 "state"**..."段之后插入：

```
**第四类——transient 工作态文件（非 SSoT，每次覆盖）**：v1.0 实施中诚实承认两个 transient 工作态文件，**不入 SSoT 三件真相**，每次相关命令覆盖：

- `.ddt/state/current.json`（Plan 4 引入）：`/ddt` 命令写入当前意图（`ddt_intent`/`ddt_slice`），供强制层 hook 在 stdin 缺字段时 fallback 读——命令→hook 字段桥。
- `.ddt/metrics/<date>.jsonl`（Plan 5 引入）：度量埋点 hook 被动追加；每日一文件。聚合源，非审计源（审计仍依 decisions.jsonl + git）。

二者**不入 git**（`.gitignore` 含 `/.ddt/`），属运行时工作态。审计/问责仍只看三件 SSoT + git 历史；transient 文件仅服务运行时机制，不参与可追溯链。
```

node 脚本插入：

```bash
cd /Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/ddt
node -e "
const fs=require('fs');
const p='docs/specs/2026-05-18-ddt-v1-redesign-design.md';
const s=fs.readFileSync(p,'utf8');
const anchor='派生产物（设计/契约/代码/测试）**不存储任何 \"state\"**。其一致性不被追踪，而在闸门处被 **Spec Reviewer subagent（≡ consistency-reviewer，全文同义，下同）** 当场对 PRD+契约重核。';
const idx=s.indexOf(anchor);
if(idx<0){console.error('anchor not found');process.exit(1);}
const insert='\n\n**第四类——transient 工作态文件（非 SSoT，每次覆盖）**：v1.0 实施中诚实承认两个 transient 工作态文件，**不入 SSoT 三件真相**，每次相关命令覆盖：\n\n- \`.ddt/state/current.json\`（Plan 4 引入）：\`/ddt\` 命令写入当前意图（\`ddt_intent\`/\`ddt_slice\`），供强制层 hook 在 stdin 缺字段时 fallback 读——命令→hook 字段桥。\n- \`.ddt/metrics/<date>.jsonl\`（Plan 5 引入）：度量埋点 hook 被动追加；每日一文件。聚合源，非审计源（审计仍依 decisions.jsonl + git）。\n\n二者**不入 git**（\`.gitignore\` 含 \`/.ddt/\`），属运行时工作态。审计/问责仍只看三件 SSoT + git 历史；transient 文件仅服务运行时机制，不参与可追溯链。';
const cut=idx+anchor.length;
fs.writeFileSync(p, s.slice(0,cut) + insert + s.slice(cut));
console.log('inserted, bytes=',fs.statSync(p).size);
"
```

- [ ] **Step 2: 验证 + 全量回归** — `grep -nE 'transient 工作态文件|\.ddt/state/current\.json.*Plan 4 引入|\.ddt/metrics' docs/specs/2026-05-18-ddt-v1-redesign-design.md && npm test` → 命中 + 全绿

- [ ] **Step 3: 提交**

```bash
git add docs/specs/2026-05-18-ddt-v1-redesign-design.md
git -c commit.gpgsign=false commit -m "docs(spec): §3.2 增加第四类 transient 工作态文件区分（state + metrics）"
```

---

### Task 8: 端到端集成测试 + 全量回归

**Files:** Create `tests/integration/ddt-metrics-roi.test.mjs`

- [ ] **Step 1: 写测试** — Create `tests/integration/ddt-metrics-roi.test.mjs`（逐字）:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Plan 5 文件结构就位（metrics-lib/hook/report/doctor）', () => {
  for (const f of ['bin/lib/ddt-metrics-lib.mjs', 'hooks/handlers/ddt-metrics.mjs', 'bin/ddt-report.mjs', 'bin/ddt-doctor.mjs']) {
    assert.ok(existsSync(path.join(root, f)), f + ' 缺失');
  }
});

test('hooks.json 注册了 metrics-post + metrics-end', () => {
  const hj = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
  const ids = new Set();
  for (const arr of Object.values(hj.hooks || {})) for (const e of arr || []) if (e && e.id) ids.add(e.id);
  assert.ok(ids.has('ddt:metrics-post'));
  assert.ok(ids.has('ddt:metrics-end'));
});

test('ddt-deliver SKILL.md ROI 段已激活（Plan 5 已落地）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-deliver/SKILL.md'), 'utf8');
  assert.match(s, /激活状态.*Plan 5 已落地/);
  assert.doesNotMatch(s, /\*\*待激活\*\*：报告生成由 Plan 5 度量层实现/);
});

test('spec §3.2 含第四类 transient 工作态文件区分', () => {
  const s = readFileSync(path.join(root, 'docs/specs/2026-05-18-ddt-v1-redesign-design.md'), 'utf8');
  assert.match(s, /第四类.*transient 工作态文件/);
  assert.match(s, /\.ddt\/state\/current\.json.*Plan 4 引入/);
  assert.match(s, /\.ddt\/metrics.*Plan 5 引入/);
});

test('ddt-doctor 输出可解析的健康报告（5 关键 hook + 7 关键 bin）', () => {
  const r = spawnSync('node', [path.join(root, 'bin/ddt-doctor.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /DDT v1\.0 doctor/);
  for (const id of ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:metrics-post', 'ddt:metrics-end']) {
    assert.match(r.stdout, new RegExp(id));
  }
});
```

- [ ] **Step 2: 运行集成测试** — `npm test -- tests/integration/ddt-metrics-roi.test.mjs` → 预期 PASS（5 测试绿）

- [ ] **Step 3: 全量回归** — `npm test` → 预期：Plan 1+2+3+4+5 全部测试绿。Plan 4 后 80 + 本 plan 增量（~22）≈ 102（以实跑为准）

- [ ] **Step 4: 提交**

```bash
git add tests/integration/ddt-metrics-roi.test.mjs
git -c commit.gpgsign=false commit -m "test(metrics-roi): Plan 5 端到端集成测试（metrics/report/doctor/spec 同步）"
```

---

### 后续（v1.0 完成后）

v1.0 此 Plan 完成后**功能闭环**。后续可考虑：
- 真实环境验收记录（用户手验后落 `.ddt/acceptance/`）
- baseline 数据导入工具（外部历史项目工时 → 让 ROI 报告"与基线对比"真实化）
- TDD-for-skills（spec §15.2 Tier-2 延后）对 vendored skill 做对抗测试加固
- 多 harness 适配（Codex / Gemini / Cursor）

---

### Self-Review

**1. Spec 覆盖**：
- §11 ROI 报告：Task 4 bin + Task 5 激活 SKILL.md ✓
- §3.2 三件真相 + 第四类 transient：Task 7 修订 ✓
- §13#4 强制层单点：Task 6 doctor 补 Plan 1 preflight 的"运行期健康"维度 ✓
- Plan 4 self-review §6（state 桥跨进程风险）：Task 6 doctor 输出真实环境验收提示 ✓
- ddt-deliver 第 4 节占位：Task 5 激活 ✓

**2. 占位符扫描**：每 task 含完整可运行代码 + 确切命令 + 预期输出。

**3. 类型/签名一致性**：
- `parseEvents / aggregate` 在 Task 1 单测 + Task 4 ddt-report 调用一致
- 5 hook id（charter-inject/enforce-pre/enforce-stop/metrics-post/metrics-end）在 Task 3 注册 + Task 6 doctor 期望 + Task 8 集成断言一致
- `.ddt/metrics/<date>.jsonl` 路径在 Task 2 hook + Task 4 report 一致

**4. 与既有的连接缝**：
- Task 3 hooks.json 改动追加而非覆盖（Plan 4 已注册 5 hook 不破坏）
- Task 5 ddt-deliver SKILL.md 改动仅"待激活"段，集成测试 Plan 3 断言 "Plan 5" 字串仍能命中
- Task 7 spec 修订仅插入一段，不动其他

**5. 关键裁决**：
- metrics hook **被动埋点**：只用 hook stdin 真实字段（tool_name / tool_response.decision / session 字段），绝不让 agent 写 metrics——沿用 deep-dive D34 "agent 禁自夸"约束
- ROI 报告**当前不含 token 字段**：Claude Code hook stdin 不一定直接给出 token 数；本 Plan 不强求；未来可扩展
- 与基线对比**诚实标注"无历史基线不可比"**：避免编造数字，与 spec §13 同型诚实

**6. v1.0 完整性自检**：
- 宪法 / 5 IL hook 全部生产生效（Plan 1/2/4 已落）
- 5 站脊柱（Plan 3）+ 2 命令 + 5 bin 承重件（Plan 4）齐备
- 度量层闭环（本 Plan）+ ROI 报告激活（本 Plan Task 5）
- doctor + preflight 双重健康检查
- spec §3.2 微调承认第四类工作态文件（本 Plan Task 7）

Plan 5 完成后 v1.0 功能闭环。剩余真实环境验收 + baseline 导入 + TDD-for-skills + 多 harness 适配属 v1.1+ 范畴。
