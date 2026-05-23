import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-enforce.mjs');

// 按事件类型断言 wire format 是否表达"通过 / 阻断"。
// PreToolUse 协议：hookSpecificOutput.permissionDecision === 'allow' | 'deny'。
function isAllow(out, evt) {
  if (evt === 'PreToolUse') return out?.hookSpecificOutput?.permissionDecision === 'allow';
  return out !== null && typeof out === 'object' && !('decision' in out);
}
function isBlock(out, evt) {
  if (evt === 'PreToolUse') return out?.hookSpecificOutput?.permissionDecision === 'deny';
  return out?.decision === 'block';
}
function reasonOf(out, evt) {
  if (evt === 'PreToolUse') return out?.hookSpecificOutput?.permissionDecisionReason ?? '';
  return out?.reason ?? '';
}

function run(stdinObj) {
  const r = spawnSync('node', [script], { input: JSON.stringify(stdinObj), cwd: root, encoding: 'utf8' });
  const out = r.stdout ? JSON.parse(r.stdout) : null;
  const evt = stdinObj.hook_event_name;
  return {
    status: r.status,
    out,
    isAllow: () => isAllow(out, evt),
    isBlock: () => isBlock(out, evt),
    reason: () => reasonOf(out, evt)
  };
}

// === IL-5：reviewer 写 docs/reviews/*.json 时 PASS 无 cited_evidence → deny ===

test('IL-5：写 reviews/*.json PASS 无 cited_evidence → block', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isBlock(), 'should block');
  assert.match(r.reason(), /IL-5/);
});

test('IL-5：写 reviews/*.json PASS 含 cited_evidence → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":["foo.test.mjs:1 pass=1"],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：FAIL 无须 cited_evidence → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"FAIL","issues":[{"severity":"important","where":"x:1","note":"y"}],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：非 reviews 路径不触发 → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'src/x.ts', content: 'hello' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：非 JSON 内容 → block', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'docs/reviews/T1-spec.json', content: 'not json at all' }
  });
  assert.ok(r.isBlock(), 'should block');
  assert.match(r.reason(), /IL-5/);
});

test('IL-5 加固：MultiEdit/NotebookEdit 写 reviews PASS 无 cited 同样 block', () => {
  for (const tool of ['MultiEdit', 'NotebookEdit']) {
    const r = run({
      hook_event_name: 'PreToolUse',
      tool_name: tool,
      tool_input: { file_path: 'docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
    });
    assert.ok(r.isBlock(), `${tool} 应被 block`);
    assert.match(r.reason(), /IL-5/);
  }
});

// === 非 reviews 路径全部 allow（不误伤）===

test('Read/普通工具调用不触发 IL-5 → allow（不误伤）', () => {
  const r = run({ hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'src/foo.ts' } });
  assert.ok(r.isAllow(), 'should allow');
});

test('Edit 普通文件 → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: 'src/bar.ts' }
  });
  assert.ok(r.isAllow(), 'should allow');
});
