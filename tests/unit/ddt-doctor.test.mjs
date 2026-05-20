import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-doctor.mjs');

test('ddt-doctor：仓内运行 exit 0 + 输出 doctor 标题', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /DDT v1\.0 doctor/);
  assert.match(r.stdout, /hooks\.json/);
  assert.match(r.stdout, /bin\//);
});

test('ddt-doctor：列出 5 个关键 hook id 注册状态', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const id of ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end']) {
    assert.match(r.stdout, new RegExp(id));
  }
});

test('ddt-doctor：列出关键 bin 文件就位状态', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const b of ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'resolve-tech-stack.mjs']) {
    assert.match(r.stdout, new RegExp(b));
  }
});

test('ddt-doctor：输出真实环境验收提示', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /真实环境|手验|user acceptance|state 桥/);
});
