// PostToolUse + SessionEnd hook (ddt-metrics.mjs) 协议契约测试。
// 协议：https://code.claude.com/docs/en/hooks
//
// metrics handler 是"被动埋点"——只写 .ddt/metrics/*.jsonl，不输出 stdout，不阻断。
// 协议契约：任何输入下都 exit 0、stdout 为空（或合法）、不出现非法字段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-metrics.mjs');

function run(stdinObj) {
  // metrics 写文件到 cwd 的 .ddt/metrics/——用 tmp dir 避免污染 plugin 仓库
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-metrics-contract-'));
  const r = spawnSync('node', [script], {
    input: JSON.stringify(stdinObj),
    cwd: dir,
    encoding: 'utf8'
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

const TOP_LEVEL_ALLOWED = new Set([
  'continue', 'suppressOutput', 'stopReason', 'decision', 'reason',
  'systemMessage', 'terminalSequence', 'permissionDecision', 'hookSpecificOutput'
]);

function assertNoSchemaViolation(stdout) {
  // stdout 可以为空（metrics 设计意图）；若非空，必须是合法 JSON 且字段在白名单
  if (!stdout || stdout.trim().length === 0) return;
  let parsed;
  try { parsed = JSON.parse(stdout); }
  catch { assert.fail(`stdout 若非空必须是合法 JSON，实际：${stdout.slice(0, 100)}`); }
  if (typeof parsed === 'object' && parsed !== null) {
    for (const key of Object.keys(parsed)) {
      assert.ok(TOP_LEVEL_ALLOWED.has(key), `非法顶层字段 "${key}"`);
    }
  }
}

test('契约 PostToolUse · 任何 tool 输入下 exit 0 + 不阻断', () => {
  const { status, stdout } = run({
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: 'x.ts' },
    tool_response: { decision: 'allow' }
  });
  assert.equal(status, 0, 'metrics 永不 exit !=0');
  assertNoSchemaViolation(stdout);
});

test('契约 SessionEnd · exit 0 + 不阻断（SessionEnd 协议不可 block）', () => {
  const { status, stdout } = run({
    hook_event_name: 'SessionEnd',
    session_id: 'test-session',
    duration_ms: 12345
  });
  assert.equal(status, 0);
  assertNoSchemaViolation(stdout);
});

test('契约 metrics · 坏 stdin 仍 exit 0（不阻断会话）', () => {
  const r = spawnSync('node', [script], { input: 'not-json', cwd: '/tmp', encoding: 'utf8' });
  assert.equal(r.status, 0, 'metrics 必须 graceful，绝不因坏 stdin 阻断会话');
});

test('契约 metrics · 未知事件名也 exit 0（不阻断未来扩展）', () => {
  const { status } = run({ hook_event_name: 'UnknownFutureEvent', some_field: 'whatever' });
  assert.equal(status, 0);
});

test('契约 metrics · 不输出非法 decision="allow" 顶层字段', () => {
  // 反向回归：早期某 hook 曾输出协议非法的 {decision:"allow"} 被 Claude Code 丢弃；
  // 确保 metrics（被动埋点）不会同样犯错
  const { stdout } = run({ hook_event_name: 'PostToolUse', tool_name: 'X', tool_input: {} });
  if (stdout && stdout.trim()) {
    try {
      const parsed = JSON.parse(stdout);
      if (parsed && parsed.decision !== undefined) {
        assert.notEqual(parsed.decision, 'allow', '不能输出协议非法值 decision="allow"');
      }
    } catch { /* stdout 不是 JSON，OK */ }
  }
});
