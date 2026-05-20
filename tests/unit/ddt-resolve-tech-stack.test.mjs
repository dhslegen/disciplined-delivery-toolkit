import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/resolve-tech-stack.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-ts-'));
  return dir;
}

test('resolve-tech-stack：stdin 含完整 tech-stack 对象，写入 .ddt/tech-stack.json', () => {
  const dir = newRepo();
  const input = JSON.stringify({ frontend: { type: 'spa' }, backend: { type: 'node' }, ai_design: true });
  const r = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const written = JSON.parse(readFileSync(path.join(dir, '.ddt/tech-stack.json'), 'utf8'));
  assert.equal(written.frontend.type, 'spa');
  assert.equal(written.backend.type, 'node');
  assert.equal(written.ai_design, true);
  assert.ok(written.resolved_at);
});

test('resolve-tech-stack：tech-stack.json 已存在则拒绝二次写入（单点写入约束）', () => {
  const dir = newRepo();
  const input = JSON.stringify({ frontend: { type: 'none' }, backend: { type: 'node' } });
  const r1 = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.equal(r1.status, 0);
  const r2 = spawnSync('node', [script], { input, cwd: dir, encoding: 'utf8' });
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /已存在|单点|exists/i);
});

test('resolve-tech-stack：缺必填字段 frontend/backend exit 非 0', () => {
  const dir = newRepo();
  const r = spawnSync('node', [script], { input: JSON.stringify({ ai_design: true }), cwd: dir, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /frontend|backend/);
});
