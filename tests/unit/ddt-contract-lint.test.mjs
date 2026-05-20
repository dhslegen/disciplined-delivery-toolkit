import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-contract-lint.mjs');
const fxPath = (n) => path.join(root, 'tests/fixtures/ddt', n);

function run(file) { return spawnSync('node', [script, file], { encoding: 'utf8' }); }

test('contract-lint：JSON 合法 OpenAPI exit 0', () => {
  const r = run(fxPath('openapi-valid.json'));
  assert.equal(r.status, 0);
});
test('contract-lint：JSON 缺必填段（openapi/paths）exit 非 0', () => {
  const r = run(fxPath('openapi-bad.json'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /openapi|paths/);
});
test('contract-lint：YAML 完整性扫描通过', () => {
  const r = run(fxPath('openapi-valid.yaml'));
  assert.equal(r.status, 0);
});
test('contract-lint：YAML 缺 paths/info.version exit 非 0', () => {
  const r = run(fxPath('openapi-incomplete.yaml'));
  assert.notEqual(r.status, 0);
});
test('contract-lint：文件不存在 exit 非 0', () => {
  const r = run('/nonexistent-xyz.yaml');
  assert.notEqual(r.status, 0);
});
