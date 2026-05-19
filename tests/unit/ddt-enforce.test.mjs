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
