import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-status.mjs');

function runIn(setup) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-st-'));
  mkdirSync(path.join(dir, '.ddt'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/specs'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/plans'), { recursive: true });
  if (setup) setup(dir);
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, err: r.stderr };
}

test('ddt-status：空仓返回基线结构', () => {
  const { status, out } = runIn(() => {});
  assert.equal(status, 0);
  assert.equal(Array.isArray(out.pending_decisions), true);
  assert.equal(out.pending_decisions.length, 0);
  assert.equal(Array.isArray(out.slice_specs), true);
  assert.equal(Array.isArray(out.slice_plans), true);
});

test('ddt-status：列 pending decisions（未 resolved）', () => {
  const { out } = runIn(dir => {
    writeFileSync(path.join(dir, '.ddt/decisions.jsonl'),
      '{"status":"pending","gate":"design","ts":"t1"}\n{"status":"resolved","ref":"t1","ts":"t2"}\n{"status":"pending","gate":"build","ts":"t3"}\n');
  });
  assert.equal(out.pending_decisions.length, 1);
  assert.equal(out.pending_decisions[0].gate, 'build');
});

test('ddt-status：列存在的 spec/plan 文件', () => {
  const { out } = runIn(dir => {
    writeFileSync(path.join(dir, 'docs/specs/us-3-spec.md'), '# us-3');
    writeFileSync(path.join(dir, 'docs/plans/us-3-plan.md'), '# us-3 plan');
  });
  assert.deepEqual(out.slice_specs.sort(), ['us-3-spec.md']);
  assert.deepEqual(out.slice_plans.sort(), ['us-3-plan.md']);
});
