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
