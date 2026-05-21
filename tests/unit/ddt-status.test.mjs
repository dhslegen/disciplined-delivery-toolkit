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
  // SSoT 路径（v1.1）：framework-recommended SSoT 在 docs/ssot/；衍生制品在 docs/{specs,plans,reviews}
  mkdirSync(path.join(dir, 'docs/ssot'), { recursive: true });
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
    writeFileSync(path.join(dir, 'docs/ssot/decisions.jsonl'),
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

// === v1.1 多人协作 Tier 1：in_progress_slices 字段（从 git for-each-ref 反推）===

function runWithMockBranches(branchesRaw) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-st-mp-'));
  mkdirSync(path.join(dir, 'docs/specs'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/plans'), { recursive: true });
  const r = spawnSync('node', [script], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, DDT_TEST_GIT_BRANCHES: branchesRaw }
  });
  return r.stdout ? JSON.parse(r.stdout) : null;
}

test('ddt-status：无 git 环境 in_progress_slices 为空数组（graceful）', () => {
  const out = runWithMockBranches('');
  assert.equal(Array.isArray(out.in_progress_slices), true);
  assert.equal(out.in_progress_slices.length, 0);
});

test('ddt-status：单个 local slice/<id> branch 被识别', () => {
  const out = runWithMockBranches('slice/us-3|2 hours ago|alice');
  assert.equal(out.in_progress_slices.length, 1);
  const s = out.in_progress_slices[0];
  assert.equal(s.slice, 'us-3');
  assert.equal(s.branch, 'slice/us-3');
  assert.equal(s.is_remote, false);
  assert.equal(s.author, 'alice');
  assert.match(s.last_commit_relative, /2 hours/);
});

test('ddt-status：origin/slice/<id> remote 被识别为 is_remote', () => {
  const out = runWithMockBranches('origin/slice/us-5|15 minutes ago|bob');
  assert.equal(out.in_progress_slices.length, 1);
  assert.equal(out.in_progress_slices[0].slice, 'us-5');
  assert.equal(out.in_progress_slices[0].is_remote, true);
});

test('ddt-status：同切片有 local + remote 时取 remote（团队共享真相优先）', () => {
  const out = runWithMockBranches(
    'slice/us-3|3 hours ago|alice\norigin/slice/us-3|1 hour ago|alice'
  );
  assert.equal(out.in_progress_slices.length, 1);
  // 应取 origin 那条
  assert.equal(out.in_progress_slices[0].branch, 'origin/slice/us-3');
  assert.equal(out.in_progress_slices[0].is_remote, true);
});

test('ddt-status：非 slice/* branch 被过滤（main/feature/release 等不进 in_progress_slices）', () => {
  const out = runWithMockBranches(
    'main|10 minutes ago|alice\nfeature/auth|2 hours ago|bob\nrelease/v1.0|1 day ago|alice\nslice/us-3|1 hour ago|bob'
  );
  assert.equal(out.in_progress_slices.length, 1);
  assert.equal(out.in_progress_slices[0].slice, 'us-3');
});

test('ddt-status：多个 slice 按 slice id 字典序排列', () => {
  const out = runWithMockBranches(
    'slice/us-5|2 hours ago|charlie\nslice/us-3|1 hour ago|alice\nslice/auth-jwt|30 min ago|bob'
  );
  assert.deepEqual(
    out.in_progress_slices.map(s => s.slice),
    ['auth-jwt', 'us-3', 'us-5']
  );
});
