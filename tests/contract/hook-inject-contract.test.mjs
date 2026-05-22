// SessionStart hook (ddt-inject.mjs) 输出协议契约测试。
// 协议：https://code.claude.com/docs/en/hooks
//
// SessionStart 用 hookSpecificOutput 注入 additionalContext（不能阻断会话）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-inject.mjs');

function run(stdinObj) {
  const r = spawnSync('node', [script], { input: JSON.stringify(stdinObj), cwd: root, encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null };
}

// === Schema 校验器 ===
const TOP_LEVEL_ALLOWED = new Set([
  'continue', 'suppressOutput', 'stopReason', 'decision', 'reason',
  'systemMessage', 'terminalSequence', 'permissionDecision', 'hookSpecificOutput'
]);

function assertSchemaValid(out, evtName) {
  assert.ok(out !== null && typeof out === 'object', 'output must be JSON object');
  for (const key of Object.keys(out)) {
    assert.ok(TOP_LEVEL_ALLOWED.has(key), `top-level key "${key}" not allowed`);
  }
  if ('hookSpecificOutput' in out) {
    const hso = out.hookSpecificOutput;
    assert.ok(hso && typeof hso === 'object', 'hookSpecificOutput must be object');
    assert.equal(hso.hookEventName, evtName, `hookEventName must echo "${evtName}"`);
  }
}

test('契约 SessionStart · 默认输出严格符合 schema', () => {
  const { status, out } = run({ hook_event_name: 'SessionStart' });
  assert.equal(status, 0, 'exit 0');
  assertSchemaValid(out, 'SessionStart');
});

test('契约 SessionStart · 输出 hookSpecificOutput 含 additionalContext', () => {
  const { out } = run({ hook_event_name: 'SessionStart' });
  assert.ok(out.hookSpecificOutput, 'must have hookSpecificOutput');
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok(
    typeof out.hookSpecificOutput.additionalContext === 'string',
    'additionalContext must be string'
  );
  assert.ok(
    out.hookSpecificOutput.additionalContext.length > 0,
    'additionalContext must be non-empty'
  );
});

test('契约 SessionStart · additionalContext 含 using-ddt 关键指纹', () => {
  // 这是 using-ddt 注入有效性的契约保证——下游 LLM 必须能读到这些指纹。
  // 如果未来 using-ddt 文本重构丢失这些字符串，本测试立刻报错。
  const { out } = run({ hook_event_name: 'SessionStart' });
  const ac = out.hookSpecificOutput.additionalContext;
  for (const fingerprint of ['<EXTREMELY_IMPORTANT>', '北极星', '三种入口', 'Design Checkpoint']) {
    assert.ok(ac.includes(fingerprint), `using-ddt 必须含指纹 "${fingerprint}"`);
  }
});

test('契约 SessionStart · 不输出顶层 decision（SessionStart 不能阻断）', () => {
  const { out } = run({ hook_event_name: 'SessionStart' });
  assert.ok(!('decision' in out), 'SessionStart 不可阻断，不能输出顶层 decision');
});

test('契约 SessionStart · 设 suppressOutput=true（避免污染会话开始）', () => {
  // using-ddt 注入应静默：用户看不到 hook 输出，只看到 LLM 响应
  const { out } = run({ hook_event_name: 'SessionStart' });
  assert.equal(out.suppressOutput, true, 'using-ddt 注入须静默');
});

test('契约 SessionStart · continue=true（明确允许会话继续）', () => {
  const { out } = run({ hook_event_name: 'SessionStart' });
  assert.equal(out.continue, true, '应显式 continue=true');
});
