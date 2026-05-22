import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Plan 5 文件结构就位（metrics-lib/hook/report/doctor）', () => {
  for (const f of ['bin/lib/ddt-metrics-lib.mjs', 'hooks/handlers/ddt-metrics.mjs', 'bin/ddt-report.mjs', 'bin/ddt-doctor.mjs']) {
    assert.ok(existsSync(path.join(root, f)), f + ' 缺失');
  }
});

test('hooks.json 注册了 metrics-post + metrics-end', () => {
  const hj = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
  const ids = new Set();
  for (const arr of Object.values(hj.hooks || {})) for (const e of arr || []) if (e && e.id) ids.add(e.id);
  assert.ok(ids.has('ddt:metrics-post'));
  assert.ok(ids.has('ddt:metrics-end'));
});

test('ddt-deliver SKILL.md ROI 段已激活（Plan 5 已落地）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-deliver/SKILL.md'), 'utf8');
  assert.match(s, /激活状态.*Plan 5 已落地/);
  assert.doesNotMatch(s, /\*\*待激活\*\*：报告生成由 Plan 5 度量层实现/);
});

test('spec §3.2 含第四类 transient 工作态文件区分', () => {
  const s = readFileSync(path.join(root, 'docs/specs/2026-05-18-ddt-v1-redesign-design.md'), 'utf8');
  assert.match(s, /第四类.*transient 工作态文件/);
  assert.match(s, /\.ddt\/state\/current\.json.*Plan 4 引入/);
  assert.match(s, /\.ddt\/metrics.*Plan 5 引入/);
});

test('ddt-doctor 输出可解析的健康报告（5 关键 hook）', () => {
  const r = spawnSync('node', [path.join(root, 'bin/ddt-doctor.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /DDT doctor/);
  for (const id of ['ddt:inject', 'ddt:enforce-pre', 'ddt:metrics-post', 'ddt:metrics-end']) {
    assert.match(r.stdout, new RegExp(id));
  }
});
