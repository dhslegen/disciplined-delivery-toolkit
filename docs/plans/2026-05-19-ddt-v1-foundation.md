## DDT v1.0 地基（Plan 1：宪法 + 强制层 + Vendored 纪律）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 DDT v1.0 地基子系统——SessionStart 注入《DDT 宪法》、hook-preflight 防静默降级、确定性事实提取器、IL-1/IL-6 两条拱顶 Iron Law 的文件事实强制 hook、9 个 superpowers 纪律 skill 原文照搬平铺。

**Architecture:** 纯 Node ESM、零运行时依赖（`dependencies:{}`）。事实提取器是纯函数库，hook 处理器是读 stdin/写 stdout 的瘦脚本，宪法是 `skills/ddt-charter/SKILL.md` 由 SessionStart hook 注入。**本仓为干净另起的独立 plugin `ddt/`（v0.x 在 `digital-delivery-team/` 冻结不动），无 v0/v1 树内并存——无需保留/迁就任何旧文件。**

**前置（已由搭建步完成，非本计划任务）**：`ddt/` 骨架已就位——`package.json`（`npm test`=`node --test 'tests/**/*.test.mjs'`，node≥22，零依赖）、`.claude-plugin/{plugin.json,marketplace.json}`（id=`ddt`）、空 `hooks/hooks.json`（内容 `{"hooks":{}}`）、目录 `skills/ bin/lib/ hooks/handlers/ tests/{unit,integration,fixtures/ddt}/ docs/{specs,plans,research}/`、git 已 init。Plan 从 Task 1 开始。

**Tech Stack:** Node `node --test`、`node:test`、`node:assert/strict`、`node:child_process`（spawn 测 hook 脚本，全程用安全的 spawnSync/execFileSync，无 shell exec）、ESM `.mjs`。测试落 `tests/unit/`、`tests/integration/`、`tests/fixtures/`。

**Spec 来源:** `docs/specs/2026-05-18-ddt-v1-redesign-design.md` v5（§8 强制层判据、§15 第一批、决策#3/#4/#7）。

---

### 文件结构

| 文件 | 责任 |
|------|------|
| `skills/ddt-charter/SKILL.md` | 《DDT 宪法》：Iron Laws + Skill 优先级 + 5 站链图 + 意图分类 + SSoT 铁律链 + Rationalization 表 + hook 缺失降级声明 |
| `bin/lib/ddt-facts.mjs` | 纯确定性事实提取器：解析 git trailer、读 decisions.jsonl、判受保护路径 |
| `bin/ddt-hook-preflight.mjs` | 校验 DDT hook 已注册；未注册 exit 3 + 修复指引（spec 洞4）|
| `hooks/handlers/ddt-charter-inject.mjs` | SessionStart：读宪法注入 additionalContext |
| `hooks/handlers/ddt-enforce.mjs` | PreToolUse/Stop：IL-1（无证据不得声明完成）/ IL-6（漂移不可出包）|
| `hooks/hooks.json` | 从空骨架 `{"hooks":{}}` 注册 3 个 hook（本仓无 v0.x，无需保留旧条目）|
| `tests/unit/ddt-facts.test.mjs` | 纯函数单测 |
| `tests/unit/ddt-charter-inject.test.mjs` | 注入脚本子进程测 |
| `tests/unit/ddt-hook-preflight.test.mjs` | preflight 子进程测 |
| `tests/unit/ddt-enforce.test.mjs` | IL-1/IL-6 子进程测 |
| `tests/unit/ddt-hooks-registered.test.mjs` | hooks.json 注册校验 |
| `tests/integration/ddt-vendored-skills.test.mjs` | 9 vendored skill 可发现性 |
| `tests/fixtures/ddt/*` | enforce 夹具 |
| `skills/ddt-{brainstorming,writing-plans,subagent-driven,executing-plans,tdd,systematic-debugging,verification,requesting-review,receiving-review}/` | 9 个 superpowers 纪律 skill 原文照搬 |

---

### Task 1: 事实提取器 `ddt-facts.mjs`（纯函数，先测）

**Files:** Create `bin/lib/ddt-facts.mjs`; Test `tests/unit/ddt-facts.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-facts.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrailers, hasEvidenceRef, readDecisions, hasUnresolvedPending, pathTouchesProtected } from '../../bin/lib/ddt-facts.mjs';

test('parseTrailers 提取 trailer 键值', () => {
  const t = parseTrailers('feat: x\n\nbody\n\nstage: build\nslice: us-3\nevidence-ref: run/1.json');
  assert.equal(t.stage, 'build');
  assert.equal(t['evidence-ref'], 'run/1.json');
});
test('parseTrailers 无 trailer 返回空对象', () => {
  assert.deepEqual(parseTrailers('feat: x\n\njust body'), {});
});
test('hasEvidenceRef 仅当非空为真', () => {
  assert.equal(hasEvidenceRef('x\n\nevidence-ref: a.json'), true);
  assert.equal(hasEvidenceRef('x\n\nstage: build'), false);
  assert.equal(hasEvidenceRef('x\n\nevidence-ref: '), false);
});
test('readDecisions 解析 jsonl，跳过空行与坏行', () => {
  const rows = readDecisions('{"status":"pending"}\n\n{bad\n{"status":"resolved","ref":"t1"}\n');
  assert.equal(rows.length, 2);
});
test('hasUnresolvedPending：pending 无对应 resolved 为真', () => {
  assert.equal(hasUnresolvedPending(readDecisions('{"status":"pending","ts":"t1"}')), true);
  assert.equal(hasUnresolvedPending(readDecisions('{"status":"pending","ts":"t1"}\n{"status":"resolved","ref":"t1"}')), false);
});
test('pathTouchesProtected：命中受保护前缀为真', () => {
  assert.equal(pathTouchesProtected(['src/a.ts','openapi/u.yaml'], ['openapi/','PRD.md']), true);
  assert.equal(pathTouchesProtected(['src/a.ts'], ['openapi/','PRD.md']), false);
});
```

- [ ] **Step 2: 运行确认失败** — Run: `npm test -- tests/unit/ddt-facts.test.mjs` — Expected: FAIL `Cannot find module '.../bin/lib/ddt-facts.mjs'`

- [ ] **Step 3: 写最小实现** — Create `bin/lib/ddt-facts.mjs`:

```javascript
// DDT 确定性事实提取器。纯函数，无副作用、不调 git，可单测。
export function parseTrailers(commitMessage) {
  const out = {};
  for (const line of String(commitMessage).split('\n')) {
    const m = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/.exec(line);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}
export function hasEvidenceRef(commitMessage) {
  const t = parseTrailers(commitMessage);
  return typeof t['evidence-ref'] === 'string' && t['evidence-ref'].length > 0;
}
export function readDecisions(jsonlText) {
  const rows = [];
  for (const line of String(jsonlText).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch { /* 跳过坏行 */ }
  }
  return rows;
}
export function hasUnresolvedPending(decisions) {
  const resolved = new Set(
    decisions.filter(d => d && d.status === 'resolved' && d.ref != null).map(d => String(d.ref))
  );
  return decisions.some(d => d && d.status === 'pending' && !resolved.has(String(d.ts)));
}
export function pathTouchesProtected(changedPaths, protectedPrefixes) {
  return changedPaths.some(p => protectedPrefixes.some(pre => String(p).startsWith(pre)));
}
```

- [ ] **Step 4: 运行确认通过** — Run: `npm test -- tests/unit/ddt-facts.test.mjs` — Expected: PASS（6 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/lib/ddt-facts.mjs tests/unit/ddt-facts.test.mjs
git commit -m "feat(foundation): 确定性事实提取器 ddt-facts"
```

---

### Task 2: 《DDT 宪法》skill

**Files:** Create `skills/ddt-charter/SKILL.md`

- [ ] **Step 1: 写宪法文件** — Create `skills/ddt-charter/SKILL.md`:

```markdown
---
name: ddt-charter
description: Use at the start of every DDT session and before any DDT pipeline action — the DDT constitution governing Iron Laws, skill priority, the 5-station spine, intent classification, and the SSoT hierarchy.
---

# DDT 宪法（强制层注入源）

本文件由 SessionStart hook 无条件注入每会话首条 prompt。离开该 hook，本宪法仅为磁盘文本。

## Iron Laws（绝对，不可合理化绕过）

- IL-1 无新鲜执行证据不得声明完成
- IL-2 无根因调查不得修复
- IL-3 无批准 spec 不得实现；无 spec 不得 plan
- IL-4 下层不得私改上层 SSoT（PRD > 契约 > 代码；越级只能 escalate）
- IL-5 reviewer 无引证不得 PASS（反乐观）
- IL-6 漂移不可出包
- IL-7 进度不自报（从 git + 证据反推）

## Skill 优先级

DDT vendored 纪律 skill 与本宪法覆盖默认行为，但低于用户显式指令。若 1% 可能某纪律 skill 适用，必须先 invoke 它。

## 5 站固定链（不变量，不可增删）

需求 → 契约 → 实现 → 验证 → 交付。每站后一道人工闸门。需求站等同本土化 ddt-brainstorming。

## 意图分类（/ddt 自由文本路由规则）

归类为：起项目 / 改需求 / 新需求 / bug / 重构 / 局部重跑。bug 走 ddt-systematic-debugging；其余进同一 spec→plan→implement 循环，证据量按风险右尺寸化，触及 认证/授权/资金/数据迁移/契约/用户数据删除/部署配置 任一恒最高硬度。

## SSoT 铁律链

真相仅三件：PRD、decisions.jsonl、changelog.jsonl。git 历史即进度账本。下层发现上层错只能 escalate，绝不私改。

## Rationalization 反驳表

- 先不做也能演示 → 演示不等于交付；纳入本批未实现即出包等于交付欺诈。
- 契约写错顺手改 → IL-4 越级私改即漂移，escalate 走变更门。
- reviewer 觉得行 → IL-5 无引证只是乐观，非 review。
- 都手测过了 → ad-hoc 不等于系统化；无新鲜证据即未完成。

## hook 缺失降级声明（spec 洞4）

若强制层 hook 未注册或未运行，以上 Iron Laws 自动降级为建议级（行为塑造层仍在，结构强制消失）。此时任何完成/通过声明必须显式标注「未受强制层校验」。绝不在 hook 缺失时静默以演示级冒充生产级。
```

- [ ] **Step 2: 校验 frontmatter** — Run: `node -e "const f=require('fs').readFileSync('skills/ddt-charter/SKILL.md','utf8');const m=f.match(/^---\n([\s\S]*?)\n---/);if(!m)throw 0;if(!/name:\s*ddt-charter/.test(m[1]))throw 1;if(!/description:\s*Use /.test(m[1]))throw 2;console.log('charter OK')"` — Expected: 打印 `charter OK`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-charter/SKILL.md
git commit -m "feat(foundation): DDT 宪法 skill"
```

---

### Task 3: 宪法注入 hook

**Files:** Create `hooks/handlers/ddt-charter-inject.mjs`; Test `tests/unit/ddt-charter-inject.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-charter-inject.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-charter-inject.mjs');

test('注入 SessionStart additionalContext 含宪法', () => {
  const out = execFileSync('node', [script], { input: '{}', cwd: root, encoding: 'utf8' });
  const json = JSON.parse(out);
  assert.equal(json.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(json.hookSpecificOutput.additionalContext, /DDT 宪法/);
  assert.match(json.hookSpecificOutput.additionalContext, /IL-1 无新鲜执行证据不得声明完成/);
  assert.match(json.hookSpecificOutput.additionalContext, /<EXTREMELY_IMPORTANT>/);
});
```

- [ ] **Step 2: 运行确认失败** — Run: `npm test -- tests/unit/ddt-charter-inject.test.mjs` — Expected: FAIL（ENOENT）

- [ ] **Step 3: 写最小实现** — Create `hooks/handlers/ddt-charter-inject.mjs`:

```javascript
#!/usr/bin/env node
// SessionStart hook：读《DDT 宪法》注入会话首条 prompt。零依赖。
// 找不到宪法文件时静默退出 0（不阻断会话，符合 v0/v1 并存迁移期）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const charterPath = path.resolve(here, '../../skills/ddt-charter/SKILL.md');

let charter;
try {
  charter = readFileSync(charterPath, 'utf8');
} catch {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
  process.exit(0);
}
const wrapped = '<EXTREMELY_IMPORTANT>\n' + charter + '\n</EXTREMELY_IMPORTANT>';
process.stdout.write(JSON.stringify({
  continue: true,
  suppressOutput: true,
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: wrapped }
}));
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — Run: `npm test -- tests/unit/ddt-charter-inject.test.mjs` — Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add hooks/handlers/ddt-charter-inject.mjs tests/unit/ddt-charter-inject.test.mjs
git commit -m "feat(foundation): SessionStart 宪法注入 hook"
```

---

### Task 4: hook-preflight（防静默降级，spec 洞4）

**Files:** Create `bin/ddt-hook-preflight.mjs`; Test `tests/unit/ddt-hook-preflight.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-hook-preflight.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-hook-preflight.mjs');

function runWith(hooksJson) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-pf-'));
  mkdirSync(path.join(dir, 'hooks'));
  writeFileSync(path.join(dir, 'hooks/hooks.json'), hooksJson);
  return spawnSync('node', [script], { env: { ...process.env, DDT_PLUGIN_ROOT: dir }, encoding: 'utf8' });
}

test('hook 已注册 → exit 0', () => {
  const r = runWith(JSON.stringify({ hooks: { SessionStart: [{ hooks: [{}], id: 'ddt:charter-inject' }], PreToolUse: [{ id: 'ddt:enforce-pre' }], Stop: [{ id: 'ddt:enforce-stop' }] } }));
  assert.equal(r.status, 0);
});
test('hook 未注册 → exit 3 且打印修复指引', () => {
  const r = runWith(JSON.stringify({ hooks: {} }));
  assert.equal(r.status, 3);
  assert.match(r.stderr, /未注册|preflight/);
});
```

- [ ] **Step 2: 运行确认失败** — Run: `npm test -- tests/unit/ddt-hook-preflight.test.mjs` — Expected: FAIL（ENOENT）

- [ ] **Step 3: 写最小实现** — Create `bin/ddt-hook-preflight.mjs`:

```javascript
#!/usr/bin/env node
// preflight：校验 DDT 强制层/宪法 hook 已注册。未注册 exit 3 + 修复指引。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.DDT_PLUGIN_ROOT || path.resolve(here, '..');
const REQUIRED = ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop'];

let hooksJson;
try {
  hooksJson = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
} catch {
  process.stderr.write('[DDT preflight] hooks/hooks.json 不可读；强制层未注册，DDT 拒绝以演示级静默启动。\n');
  process.exit(3);
}
const ids = new Set();
for (const arr of Object.values(hooksJson.hooks || {})) {
  for (const entry of arr || []) if (entry && entry.id) ids.add(entry.id);
}
const missing = REQUIRED.filter(id => !ids.has(id));
if (missing.length) {
  process.stderr.write(
    '[DDT preflight] 强制层 hook 未注册：' + missing.join(', ') + '。\n' +
    '修复：确认 hooks/hooks.json 含上述 id 条目并重启会话。修复前 DDT 不以演示级静默运行。\n'
  );
  process.exit(3);
}
process.stdout.write('[DDT preflight] 强制层 hook 已注册。\n');
process.exit(0);
```

- [ ] **Step 4: 运行确认通过** — Run: `npm test -- tests/unit/ddt-hook-preflight.test.mjs` — Expected: PASS（2 测试绿）

- [ ] **Step 5: 提交**

```bash
git add bin/ddt-hook-preflight.mjs tests/unit/ddt-hook-preflight.test.mjs
git commit -m "feat(foundation): hook-preflight 防静默降级"
```

---

### Task 5: 强制层 hook — IL-1（无证据不得声明完成）

**Files:** Create `hooks/handlers/ddt-enforce.mjs`; Create `tests/fixtures/ddt/git-head-no-evidence.txt`、`tests/fixtures/ddt/git-head-with-evidence.txt`; Test `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写夹具** — Create `tests/fixtures/ddt/git-head-no-evidence.txt`:

```
feat: 实现导出
body 无 trailer
stage: build
slice: us-3
```

Create `tests/fixtures/ddt/git-head-with-evidence.txt`:

```
feat: 实现导出

stage: build
slice: us-3
task: t1
evidence-ref: .ddt/runs/2026-05-19-export.json
```

- [ ] **Step 2: 写失败测试** — Create `tests/unit/ddt-enforce.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-enforce.mjs');
const fx = (n) => readFileSync(path.join(root, 'tests/fixtures/ddt', n), 'utf8');

function run(stdinObj) {
  const r = spawnSync('node', [script], { input: JSON.stringify(stdinObj), cwd: root, encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null };
}

test('IL-1：声明完成但 HEAD 无 evidence-ref → block', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_test_head: fx('git-head-no-evidence.txt'), ddt_intent: 'claim-complete' });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-1/);
});
test('IL-1：HEAD 带 evidence-ref → allow', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_test_head: fx('git-head-with-evidence.txt'), ddt_intent: 'claim-complete' });
  assert.equal(out.decision, 'allow');
});
test('非完成声明事件 → allow（不误伤）', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_test_head: fx('git-head-no-evidence.txt') });
  assert.equal(out.decision, 'allow');
});
```

- [ ] **Step 3: 运行确认失败** — Run: `npm test -- tests/unit/ddt-enforce.test.mjs` — Expected: FAIL（ENOENT）

- [ ] **Step 4: 写最小实现（仅 IL-1）** — Create `hooks/handlers/ddt-enforce.mjs`:

```javascript
#!/usr/bin/env node
// 强制层 hook：读 stdin 事件，用 ddt-facts 判 Iron Law，输出 {decision, reason}。
// 本计划落 IL-1；IL-6 在 Task 6 追加；IL-2..5/7 在 Plan 2。
// 测试注入 ddt_test_head 免依赖真实 git；生产路径用 git log -1。
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hasEvidenceRef } from '../../bin/lib/ddt-facts.mjs';

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function headMessage(ev) {
  if (typeof ev.ddt_test_head === 'string') return ev.ddt_test_head;
  try { return execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' }); } catch { return ''; }
}
function allow() { return { decision: 'allow' }; }
function block(reason) { return { decision: 'block', reason }; }

function decide(ev) {
  if (ev.ddt_intent === 'claim-complete' && !hasEvidenceRef(headMessage(ev))) {
    return block('IL-1 违规：声明完成但 git HEAD 无 evidence-ref trailer。需先产新鲜执行证据并 commit 带 evidence-ref 方可声明完成。');
  }
  return allow();
}

const ev = readStdin();
process.stdout.write(JSON.stringify(decide(ev)));
process.exit(0);
```

- [ ] **Step 5: 运行确认通过** — Run: `npm test -- tests/unit/ddt-enforce.test.mjs` — Expected: PASS（3 测试绿）

- [ ] **Step 6: 提交**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/fixtures/ddt/git-head-no-evidence.txt tests/fixtures/ddt/git-head-with-evidence.txt
git commit -m "feat(foundation): 强制层 hook + IL-1 文件事实判据"
```

---

### Task 6: 强制层补 IL-6（漂移不可出包）

**Files:** Modify `hooks/handlers/ddt-enforce.mjs`; Create `tests/fixtures/ddt/decisions-open.jsonl`、`tests/fixtures/ddt/decisions-closed.jsonl`; Modify `tests/unit/ddt-enforce.test.mjs`

- [ ] **Step 1: 写夹具** — Create `tests/fixtures/ddt/decisions-open.jsonl`:

```
{"status":"pending","gate":"design","owner_role":"architect","decision_criteria":"契约对 PRD 一致","ts":"2026-05-19T01:00:00Z"}
```

Create `tests/fixtures/ddt/decisions-closed.jsonl`:

```
{"status":"pending","gate":"design","ts":"2026-05-19T01:00:00Z"}
{"status":"resolved","ref":"2026-05-19T01:00:00Z","user_action":"accept","ts":"2026-05-19T02:00:00Z"}
```

- [ ] **Step 2: 追加失败测试** — 在 `tests/unit/ddt-enforce.test.mjs` 末尾追加：

```javascript
test('IL-6：进交付且有未 resolved pending → block', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_intent: 'enter-deliver', ddt_test_decisions: fx('decisions-open.jsonl') });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-6/);
});
test('IL-6：pending 已 resolved → allow', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_intent: 'enter-deliver', ddt_test_decisions: fx('decisions-closed.jsonl') });
  assert.equal(out.decision, 'allow');
});
```

- [ ] **Step 3: 运行确认新测试失败** — Run: `npm test -- tests/unit/ddt-enforce.test.mjs` — Expected: FAIL（enter-deliver 未判，新增 2 测试期望 block 但得 allow）

- [ ] **Step 4: 修改 `hooks/handlers/ddt-enforce.mjs`** — import 行改为：

```javascript
import { hasEvidenceRef, hasUnresolvedPending, readDecisions } from '../../bin/lib/ddt-facts.mjs';
```

在 `headMessage` 下方加：

```javascript
function decisionsText(ev) {
  if (typeof ev.ddt_test_decisions === 'string') return ev.ddt_test_decisions;
  try { return readFileSync('.ddt/decisions.jsonl', 'utf8'); } catch { return ''; }
}
```

在 `decide` 的 `return allow();` 前插入：

```javascript
  if (ev.ddt_intent === 'enter-deliver' && hasUnresolvedPending(readDecisions(decisionsText(ev)))) {
    return block('IL-6 违规：存在未 resolved 的 pending 闸门/漂移，禁止进入交付站出包。先 resolve 全部 pending 或显式 accept-drift 署理由。');
  }
```

- [ ] **Step 5: 运行确认全绿** — Run: `npm test -- tests/unit/ddt-enforce.test.mjs` — Expected: PASS（5 测试绿）

- [ ] **Step 6: 提交**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/fixtures/ddt/decisions-open.jsonl tests/fixtures/ddt/decisions-closed.jsonl
git commit -m "feat(foundation): 强制层补 IL-6 漂移不可出包"
```

---

### Task 7: hooks.json 注册 3 个 hook（从空骨架，本仓无 v0.x）

**Files:** Modify `hooks/hooks.json`; Test `tests/unit/ddt-hooks-registered.test.mjs`

- [ ] **Step 1: 写失败测试** — Create `tests/unit/ddt-hooks-registered.test.mjs`:

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
test('三个 DDT hook 已注册', () => {
  const s = ids();
  assert.ok(s.has('ddt:charter-inject'));
  assert.ok(s.has('ddt:enforce-pre'));
  assert.ok(s.has('ddt:enforce-stop'));
});
```

- [ ] **Step 2: 运行确认失败** — Run: `npm test -- tests/unit/ddt-hooks-registered.test.mjs` — Expected: FAIL（三新 id 缺失）

- [ ] **Step 3: 写完整 `hooks/hooks.json`** — 骨架现为 `{"hooks":{}}`，整体覆盖为：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [
      { "matcher": "*", "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/handlers/ddt-charter-inject.mjs\"" } ], "description": "DDT 宪法注入", "id": "ddt:charter-inject" }
    ],
    "PreToolUse": [
      { "matcher": "*", "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/handlers/ddt-enforce.mjs\"" } ], "description": "DDT 强制层 PreToolUse", "id": "ddt:enforce-pre" }
    ],
    "Stop": [
      { "matcher": "*", "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/handlers/ddt-enforce.mjs\"" } ], "description": "DDT 强制层 Stop（IL-1/IL-6）", "id": "ddt:enforce-stop" }
    ]
  }
}
```

- [ ] **Step 4: 校验 JSON 合法 + 测试通过** — Run: `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'));console.log('valid')" && npm test -- tests/unit/ddt-hooks-registered.test.mjs` — Expected: 打印 `valid`，1 测试绿

- [ ] **Step 5: 提交**

```bash
git add hooks/hooks.json tests/unit/ddt-hooks-registered.test.mjs
git commit -m "feat(foundation): 注册 charter-inject/enforce-pre/enforce-stop"
```

---

### Task 8: 照搬 9 个 superpowers 纪律 skill（原文，平铺）

**Files:** Create `skills/ddt-{brainstorming,writing-plans,subagent-driven,executing-plans,tdd,systematic-debugging,verification,requesting-review,receiving-review}/`

源根：`/Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/superpowers/skills/`

- [ ] **Step 1: 原文复制并改 frontmatter name** — Run:

```bash
SP=/Users/zhaowenhao/Developer/Personal/ddt-plugin-dev/superpowers/skills
for pair in "brainstorming:ddt-brainstorming" "writing-plans:ddt-writing-plans" "subagent-driven-development:ddt-subagent-driven" "executing-plans:ddt-executing-plans" "test-driven-development:ddt-tdd" "systematic-debugging:ddt-systematic-debugging" "verification-before-completion:ddt-verification" "requesting-code-review:ddt-requesting-review" "receiving-code-review:ddt-receiving-review"; do
  s="${pair%%:*}"; d="${pair##*:}"
  rm -rf "skills/$d"; cp -R "$SP/$s" "skills/$d"
  node -e "const f='skills/$d/SKILL.md',fs=require('fs');let x=fs.readFileSync(f,'utf8');x=x.replace(/^(---[\s\S]*?\nname:\s*)[^\n]+/,'\$1$d');fs.writeFileSync(f,x)"
done
echo "vendored 9 skills done"
```

Expected: 打印 `vendored 9 skills done`；`skills/ddt-*` 9 目录各含 `SKILL.md`

- [ ] **Step 2: 追加 hook 缺失降级声明** — Run:

```bash
for d in ddt-brainstorming ddt-writing-plans ddt-subagent-driven ddt-executing-plans ddt-tdd ddt-systematic-debugging ddt-verification ddt-requesting-review ddt-receiving-review; do
  printf '\n\n---\n\n> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。\n' >> "skills/$d/SKILL.md"
done
echo "downgrade notice appended"
```

Expected: 打印 `downgrade notice appended`

- [ ] **Step 3: 提交**

```bash
git add skills/ddt-brainstorming skills/ddt-writing-plans skills/ddt-subagent-driven skills/ddt-executing-plans skills/ddt-tdd skills/ddt-systematic-debugging skills/ddt-verification skills/ddt-requesting-review skills/ddt-receiving-review
git commit -m "feat(foundation): 照搬 9 个 superpowers 纪律 skill（原文平铺 + 降级声明）"
```

---

### Task 9: vendored skill 可发现性集成测试 + 全量回归

**Files:** Create `tests/integration/ddt-vendored-skills.test.mjs`

- [ ] **Step 1: 写测试** — Create `tests/integration/ddt-vendored-skills.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V = ['ddt-brainstorming','ddt-writing-plans','ddt-subagent-driven','ddt-executing-plans','ddt-tdd','ddt-systematic-debugging','ddt-verification','ddt-requesting-review','ddt-receiving-review'];

test('9 vendored skill 平铺且 Claude 可发现（SKILL.md + name 匹配目录 + 降级声明）', () => {
  for (const d of V) {
    const f = path.join(root, 'skills', d, 'SKILL.md');
    assert.ok(existsSync(f), d + '/SKILL.md 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, d + ' 无 frontmatter');
    assert.match(m[1], new RegExp('name:\\s*' + d + '\\b'), d + ' name 未改为目录名');
    assert.match(s, /DDT 强制层声明/, d + ' 缺降级声明');
  }
});
test('宪法含 7 条 Iron Law', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  for (const il of ['IL-1','IL-2','IL-3','IL-4','IL-5','IL-6','IL-7']) assert.match(s, new RegExp(il));
});
test('skill 未嵌套 _vendored（决策#7）', () => {
  assert.ok(!existsSync(path.join(root, 'skills/_vendored')));
});
```

- [ ] **Step 2: 运行确认通过** — Run: `npm test -- tests/integration/ddt-vendored-skills.test.mjs` — Expected: PASS（3 测试绿）

- [ ] **Step 3: 全量回归** — Run: `npm test` — Expected: 本计划全部新增测试绿（干净仓，全部测试均本计划产出，无历史回归面）

- [ ] **Step 4: 提交**

```bash
git add tests/integration/ddt-vendored-skills.test.mjs
git commit -m "test(foundation): vendored 可发现性 + 宪法完整性"
```

---

### 后续计划（本计划不实现，决策用）

- **Plan 2**：IL-2/3/4/5/7 各自文件事实判据 + skill 自陈降级联动 + preflight 接入 `/ddt` 启动。
- **Plan 3**：五站 skill（ddt-design 契约站含强制 Spec Reviewer+lint 硬门 / ddt-impl-spec 含 refine 子句 / ddt-deliver / ddt-frontend-craft / ddt-design-source）。
- **Plan 4**：`/ddt`、`/ddt-status` 两薄闸门 + bin 承重件（resolve-tech-stack / 契约 lint / status 事实提取 / decisions·changelog 追加器）。
- **Plan 5**：被动埋点 + 交付站 ROI 报告（含降低保障级标记）。

---

### Self-Review

**1. Spec 覆盖**（spec v5 §15 第一批）：照搬 9 Tier-1 → Task 8/9；ddt-charter+SessionStart 注入+preflight → Task 2/3/4；§8 强制层文件事实 hook → Task 1/5/6/7（IL-1/IL-6 落地，IL-2..5/7 明列 Plan 2 为独立后续，非占位）；决策#7 平铺不嵌套/无 license 仪式 → Task 8 + Task 9 断言无 `_vendored`；spec 洞4 防静默降级 → Task 4 + Task 8 Step2。✓

**2. 占位符扫描**：无 TBD/TODO；每代码步含完整可运行代码与确切命令；IL-2..7 非"类似"而是明列 Plan 2 独立任务。✓

**3. 类型/签名一致**：`ddt-facts.mjs` 导出 `parseTrailers/hasEvidenceRef/readDecisions/hasUnresolvedPending/pathTouchesProtected`，Task 5/6 import 与之逐一对应；ESM 无 `require`，Task 5/6 实现统一用 `import {readFileSync} from 'node:fs'` 且 `readFileSync(0,'utf8')` 读 stdin（不用 `require`）；hook id `ddt:charter-inject/enforce-pre/enforce-stop` 在 Task 4 REQUIRED、Task 7 注册、Task 7 测试三处一致。✓
