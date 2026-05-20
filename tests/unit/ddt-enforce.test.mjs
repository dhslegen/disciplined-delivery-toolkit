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
test('IL-4 加固：MultiEdit/NotebookEdit 同等保护', () => {
  for (const tool of ['MultiEdit', 'NotebookEdit']) {
    const { out } = run({
      hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
      tool_name: tool, tool_input: { file_path: 'openapi/user.yaml' },
      ddt_test_changelog: fx('changelog-no-escalation.jsonl')
    });
    assert.equal(out.decision, 'block', `${tool} 应被 block`);
    assert.match(out.reason, /IL-4/);
  }
});
test('IL-4 加固：大小写变体（PRD.MD/OPENAPI/）应 block', () => {
  for (const p of ['PRD.MD', 'OPENAPI/user.yaml']) {
    const { out } = run({
      hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
      tool_name: 'Edit', tool_input: { file_path: p },
      ddt_test_changelog: fx('changelog-no-escalation.jsonl')
    });
    assert.equal(out.decision, 'block', `${p} 应被 block`);
    assert.match(out.reason, /IL-4/);
  }
});
test('IL-4 加固：./openapi/ 前缀变体应 block', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Edit', tool_input: { file_path: './openapi/user.yaml' },
    ddt_test_changelog: fx('changelog-no-escalation.jsonl')
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-4/);
});
test('IL-4 不误伤：subdir/openapi/x（子目录下 openapi）应 allow', () => {
  // subdir/openapi/x.yaml 不是 SSoT 根目录的 openapi/，是子目录下另一个名为 openapi 的目录——正确应 allow
  const { out } = run({
    hook_event_name: 'PreToolUse', ddt_intent: 'build-edit',
    tool_name: 'Edit', tool_input: { file_path: 'subdir/openapi/x.yaml' },
    ddt_test_changelog: ''
  });
  assert.equal(out.decision, 'allow');
});
test('IL-5：PostToolUse 写 reviews/*.json 但 PASS 无 cited_evidence → block', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /IL-5/);
});
test('IL-5：PostToolUse 写 reviews/*.json PASS 含 cited_evidence → allow', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":["foo.test.mjs:1 pass=1"],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'allow');
});
test('IL-5：FAIL 无须 cited_evidence → allow', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"FAIL","issues":[{"severity":"important","where":"x:1","note":"y"}],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.equal(out.decision, 'allow');
});
test('IL-5：非 reviews 路径不触发', () => {
  const { out } = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'src/x.ts', content: 'hello' }
  });
  assert.equal(out.decision, 'allow');
});

test('IL-5 加固：MultiEdit/NotebookEdit 写 reviews PASS 无 cited 同样 block', () => {
  for (const tool of ['MultiEdit', 'NotebookEdit']) {
    const { out } = run({
      hook_event_name: 'PreToolUse',
      tool_name: tool,
      tool_input: { file_path: '.ddt/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
    });
    assert.equal(out.decision, 'block', `${tool} 应被 block`);
    assert.match(out.reason, /IL-5/);
  }
});
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
test('Plan 4 fallback 对称性：stdin 已有 ddt_slice，state ddt_slice 不得覆盖', () => {
  // 构造：stdin 给 ddt_intent='' 触发 fallback 分支，但带 ddt_slice='us-1'；
  // state 给 ddt_intent='enter-plan' 与 ddt_slice='us-5'；
  // decisions 含 us-1 的 approved spec，无 us-5 的 spec。
  // 期望：merged 应保留 stdin 的 us-1 slice，IL-3 查 us-1 → 有 approved → allow。
  // 现 bug：state 的 us-5 覆盖 stdin 的 us-1，IL-3 查 us-5 → 无 approved → block。
  const stateText = JSON.stringify({ ddt_intent: 'enter-plan', ddt_slice: 'us-5' });
  const decisionsText = '{"gate":"spec","slice":"us-1","status":"resolved","user_action":"approve","ref":"t1"}';
  const { out } = run({
    hook_event_name: 'PreToolUse',
    ddt_intent: '',
    ddt_slice: 'us-1',
    ddt_test_decisions: decisionsText,
    ddt_test_state: stateText
  });
  assert.equal(out.decision, 'allow', 'stdin ddt_slice 应优先于 state');
});
