// Claude Code hook 输出协议契约测试。
// 不测业务，只测"hook 的 stdout 是否严格符合 Claude Code wire format"。
// 这层测试存在的理由：v1.0 之前测试只断言 out.decision === 'block'，
// 但实际协议要求 PreToolUse 用 hookSpecificOutput.permissionDecision，
// 这层断空白导致 IL-5 在 dogfood 真实环境完全失效。
//
// 协议来源：https://code.claude.com/docs/en/hooks（2026 起版本）
// Phase C 起：enforce 仅处理 PreToolUse + IL-5，Stop 注册已删除。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-enforce.mjs');

function run(stdinObj) {
  const r = spawnSync('node', [script], { input: JSON.stringify(stdinObj), cwd: root, encoding: 'utf8' });
  return r.stdout ? JSON.parse(r.stdout) : null;
}

// === Schema 校验器（手工实现，零依赖） ===

// 顶层合法字段（来自官方 schema）
const TOP_LEVEL_ALLOWED = new Set([
  'continue', 'suppressOutput', 'stopReason', 'decision', 'reason',
  'systemMessage', 'terminalSequence', 'permissionDecision', 'hookSpecificOutput'
]);
// 顶层 decision 唯一合法值
const TOP_LEVEL_DECISION_VALUES = new Set(['approve', 'block']);

function assertSchemaValid(out, evtName) {
  assert.ok(out !== null && typeof out === 'object', `output must be a JSON object, got ${typeof out}`);

  // 1. 顶层只能含合法字段
  for (const key of Object.keys(out)) {
    assert.ok(TOP_LEVEL_ALLOWED.has(key), `top-level key "${key}" not in allowed set`);
  }

  // 2. 顶层 decision 字段值合法性
  if ('decision' in out) {
    assert.ok(
      TOP_LEVEL_DECISION_VALUES.has(out.decision),
      `top-level decision must be one of ${[...TOP_LEVEL_DECISION_VALUES].join('|')}, got "${out.decision}"`
    );
  }

  // 3. hookSpecificOutput 结构按事件类型
  if ('hookSpecificOutput' in out) {
    const hso = out.hookSpecificOutput;
    assert.ok(hso && typeof hso === 'object', 'hookSpecificOutput must be object');
    assert.equal(hso.hookEventName, evtName, `hookSpecificOutput.hookEventName must echo "${evtName}"`);
    if (evtName === 'PreToolUse' && 'permissionDecision' in hso) {
      assert.ok(
        ['allow', 'deny', 'ask', 'defer'].includes(hso.permissionDecision),
        `PreToolUse permissionDecision must be allow|deny|ask|defer, got "${hso.permissionDecision}"`
      );
    }
  }
}

test('契约 PreToolUse · allow 路径输出严格合法', () => {
  const out = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'src/foo.ts' }
  });
  assertSchemaValid(out, 'PreToolUse');
  // 必须用 hookSpecificOutput.permissionDecision 而非顶层 decision
  assert.equal(out.hookSpecificOutput?.permissionDecision, 'allow');
  assert.ok(!('decision' in out), 'PreToolUse allow 不应有顶层 decision 字段');
});

test('契约 PreToolUse · deny 路径输出严格合法（IL-5 PASS 无 cited_evidence）', () => {
  const out = run({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: 'docs/reviews/T1-spec.json',
      content: '{"task_id":"T1","reviewer_role":"spec","verdict":"PASS","cited_evidence":[],"ts":"2026-05-20T00:00:00Z"}'
    }
  });
  assertSchemaValid(out, 'PreToolUse');
  assert.equal(out.hookSpecificOutput?.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput?.permissionDecisionReason ?? '', /IL-5/);
  assert.ok(!('decision' in out), 'PreToolUse deny 不应有顶层 decision 字段');
});

test('契约 · 不输出非法 "allow" 顶层 decision 值', () => {
  // 这是 v1.0 之前的 bug：return { decision: 'allow' } 不被 Claude Code 接受。
  // 反向测：扫描多种 allow 场景，确认无一返回 { decision: 'allow' }。
  const cases = [
    { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'x' } },
    { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: 'normal/file.ts' } }
  ];
  for (const ev of cases) {
    const out = run(ev);
    if (out && 'decision' in out) {
      assert.notEqual(out.decision, 'allow', `event ${ev.hook_event_name}: 不得返回 { decision: 'allow' }（协议不支持）`);
    }
  }
});
