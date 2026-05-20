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
test('IL-6：进交付且有未 resolved pending → block', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_intent: 'enter-deliver', ddt_test_decisions: fx('decisions-open.jsonl') });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-6/);
});
test('IL-6：pending 已 resolved → allow', () => {
  const { out } = run({ hook_event_name: 'Stop', ddt_intent: 'enter-deliver', ddt_test_decisions: fx('decisions-closed.jsonl') });
  assert.equal(out.decision, 'allow');
});
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
