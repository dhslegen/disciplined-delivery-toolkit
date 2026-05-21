import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-report.mjs');

function newRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ddt-rp-'));
  // SSoT 路径（v1.1）：decisions 在 docs/ssot/；metrics 仍在 .ddt/（transient）
  mkdirSync(path.join(dir, '.ddt/metrics'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/ssot'), { recursive: true });
  return dir;
}

test('ddt-report：空 metrics 生成基线报告（无基线诚实标注）', () => {
  const dir = newRepo();
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok(existsSync(path.join(dir, 'docs/efficiency-report.md')));
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /AI 效能 ROI 报告/);
  assert.match(md, /无历史基线不可比|无度量数据/);
});

test('ddt-report：聚合 metrics 渲染指标段', () => {
  const dir = newRepo();
  writeFileSync(path.join(dir, '.ddt/metrics/2026-05-20.jsonl'),
    '{"kind":"tool","tool_name":"Edit","decision":"allow","ts":"2026-05-20T01:00:00Z"}\n' +
    '{"kind":"tool","tool_name":"Edit","decision":"block","reason":"IL-4 违规","ts":"2026-05-20T01:01:00Z"}\n' +
    '{"kind":"session-end","duration_ms":60000,"ts":"2026-05-20T02:00:00Z"}\n');
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /工具调用：2/);
  assert.match(md, /拦截：1/);
  assert.match(md, /IL-4/);
  assert.match(md, /会话数：1/);
});

test('ddt-report：含降低保障级 waiver 清单段', () => {
  const dir = newRepo();
  writeFileSync(path.join(dir, 'docs/ssot/decisions.jsonl'),
    '{"status":"resolved","user_action":"accept-drift","note":"断网受限基建","ts":"2026-05-20T01:00:00Z"}\n');
  const r = spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });
  const md = readFileSync(path.join(dir, 'docs/efficiency-report.md'), 'utf8');
  assert.match(md, /降低保障级|accept-drift|waiver/);
  assert.match(md, /断网受限基建/);
});
