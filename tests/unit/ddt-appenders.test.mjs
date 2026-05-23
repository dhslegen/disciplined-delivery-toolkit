import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const decAppender = path.join(root, 'bin/ddt-decisions-append.mjs');
const clAppender = path.join(root, 'bin/ddt-changelog-append.mjs');

// SSoT 路径决策：SSoT 真相住 .ddt/，appender 会自己 mkdir .ddt，测试无需预建。
function newRepo() {
  return mkdtempSync(path.join(os.tmpdir(), 'ddt-ap-'));
}

test('decisions-append：单条 JSON 写入 .ddt/decisions.jsonl 并自动加 ts', () => {
  const dir = newRepo();
  const r = spawnSync('node', [decAppender], {
    input: JSON.stringify({ status: 'pending', gate: 'design', owner_role: 'architect' }),
    cwd: dir, encoding: 'utf8'
  });
  assert.equal(r.status, 0);
  const lines = readFileSync(path.join(dir, '.ddt/decisions.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  const row = JSON.parse(lines[0]);
  assert.equal(row.status, 'pending');
  assert.match(row.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('decisions-append：多次追加成多行 jsonl', () => {
  const dir = newRepo();
  for (let i = 0; i < 3; i++) {
    spawnSync('node', [decAppender], { input: JSON.stringify({ idx: i }), cwd: dir, encoding: 'utf8' });
  }
  const lines = readFileSync(path.join(dir, '.ddt/decisions.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 3);
});

test('decisions-append：坏 JSON exit 非 0 不写文件', () => {
  const dir = newRepo();
  const r = spawnSync('node', [decAppender], { input: 'not-json', cwd: dir, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /JSON/);
});

test('changelog-append：写 .ddt/changelog.jsonl 自动加 ts', () => {
  const dir = newRepo();
  const r = spawnSync('node', [clAppender], {
    input: JSON.stringify({ kind: 'amend', intent: 'add field', paths: ['.ddt/decisions.jsonl'] }),
    cwd: dir, encoding: 'utf8'
  });
  assert.equal(r.status, 0);
  const row = JSON.parse(readFileSync(path.join(dir, '.ddt/changelog.jsonl'), 'utf8').trim().split('\n')[0]);
  assert.equal(row.kind, 'amend');
  assert.ok(row.ts);
});
