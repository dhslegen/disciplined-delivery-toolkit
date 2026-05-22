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
  // preflight 检查全部 5 个 hook id（与 hooks/hooks.json 注册一致）
  const r = runWith(JSON.stringify({
    hooks: {
      SessionStart: [{ id: 'ddt:inject' }],
      PreToolUse: [{ id: 'ddt:enforce-pre' }],
      Stop: [{ id: 'ddt:enforce-stop' }],
      PostToolUse: [{ id: 'ddt:metrics-post' }],
      SessionEnd: [{ id: 'ddt:metrics-end' }]
    }
  }));
  assert.equal(r.status, 0);
});
test('hook 未注册 → exit 3 且打印修复指引', () => {
  const r = runWith(JSON.stringify({ hooks: {} }));
  assert.equal(r.status, 3);
  assert.match(r.stderr, /未注册|preflight/);
});
