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
//
// ⚠️ 下面所有 file_path 用【绝对路径】——Claude Code 的 Write/Edit 按协议传绝对路径。
// 冒烟测试曾逮到真 bug：hook 正则原为 ^docs/reviews/ 只认相对路径，绝对路径恒放行 → IL-5 形同虚设，
// 而旧测试全用相对路径 → 假绿。测试必须镜像真实调用方的输入格式，否则又是「测字段没测协议」。

test('IL-5 回归（冒烟逮到）：绝对/相对路径 PASS 无 cited 都必须 block', () => {
  for (const fp of ['/Users/dev/anyproject/docs/reviews/smoke-spec.json', 'docs/reviews/smoke-spec.json']) {
    const r = run({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: fp, content: '{"task_id":"smoke","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"issues":[],"ts":"2026-05-22T00:00:00Z"}' }
    });
    assert.ok(r.isBlock(), `${fp} 下 PASS 无引证必须 block（IL-5 真实生效）`);
    assert.match(r.reason(), /IL-5/);
  }
});

test('IL-5：写 reviews/*.json PASS 无 cited_evidence → block', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isBlock(), 'should block');
  assert.match(r.reason(), /IL-5/);
});

test('IL-5：写 reviews/*.json PASS 含 cited_evidence → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":["foo.test.mjs:1 pass=1"],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：FAIL 无须 cited_evidence → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', content: '{"task_id":"T1","reviewer_role":"spec","verdict":"FAIL","issues":[{"severity":"important","where":"x:1","note":"y"}],"ts":"2026-05-20T00:00:00Z"}' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：非 reviews 路径不触发 → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/repo/src/x.ts', content: 'hello' }
  });
  assert.ok(r.isAllow(), 'should allow');
});

test('IL-5：非 JSON 内容 → block', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', content: 'not json at all' }
  });
  assert.ok(r.isBlock(), 'should block');
  assert.match(r.reason(), /IL-5/);
});

test('IL-5 回归（冒烟逮到）：Edit/MultiEdit/NotebookEdit 改 reviewer 文件 → block 且要求用 Write', () => {
  // 真实 tool_input 形态：Edit 有 old/new_string、MultiEdit 有 edits[]、NotebookEdit 有 new_source——
  // 都没有完整 content。曾因强行 JSON.parse(content) 误报「非合法 JSON」。reviewer 输出须 Write 整份提交。
  const cases = [
    { tool_name: 'Edit', tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', old_string: 'a', new_string: 'b' } },
    { tool_name: 'MultiEdit', tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', edits: [{ old_string: 'a', new_string: 'b' }] } },
    { tool_name: 'NotebookEdit', tool_input: { file_path: '/repo/docs/reviews/T1-spec.json', new_source: 'x' } }
  ];
  for (const c of cases) {
    const r = run({ hook_event_name: 'PreToolUse', ...c });
    assert.ok(r.isBlock(), `${c.tool_name} 改 reviewer 文件应被 block`);
    assert.match(r.reason(), /Write|整份/, `${c.tool_name} block 理由应指明用 Write 整份`);
    assert.doesNotMatch(r.reason(), /非合法 JSON/, `${c.tool_name} 不应误报「非合法 JSON」`);
  }
});

// === 非 reviews 路径全部 allow（不误伤）===

test('Read/普通工具调用不触发 IL-5 → allow（不误伤）', () => {
  const r = run({ hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: '/repo/src/foo.ts' } });
  assert.ok(r.isAllow(), 'should allow');
});

test('Edit 普通文件 → allow', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: '/repo/src/bar.ts' }
  });
  assert.ok(r.isAllow(), 'should allow');
});
