import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

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

// === dogfood 回归测试：v1.0 doctor 路径依赖 cwd 的 bug ===

test('ddt-doctor 在非 plugin root 跑：plugin 自身健康段 [A] 应全 ✓', () => {
  // 模拟 dogfood 真实场景：用户在 alv-ops-v1 cwd 下，doctor 仍应报告 plugin 健康
  const tmp = mkdtempSync(path.join(tmpdir(), 'ddt-doctor-test-'));
  try {
    const r = spawnSync('node', [script], { cwd: tmp, encoding: 'utf8' });
    assert.equal(r.status, 0);
    // plugin 自身 5 个 hook id 仍应被识别（路径解析靠 __dirname 而非 cwd）
    for (const id of ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end']) {
      assert.match(r.stdout, new RegExp(`✓ ${id}`), `[A] 段应识别 ${id}（不受 cwd 影响）`);
    }
    // plugin bin 全部 ✓
    for (const b of ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs']) {
      assert.match(r.stdout, new RegExp(`✓ bin/${b}`), `[A] 段应识别 bin/${b}（不受 cwd 影响）`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ddt-doctor 在非 plugin root 跑：项目状态段 [B] 应反映 cwd 实际', () => {
  // 空临时目录：[B] 段所有项目骨架应是 ✗
  const tmp = mkdtempSync(path.join(tmpdir(), 'ddt-doctor-test-'));
  try {
    const r = spawnSync('node', [script], { cwd: tmp, encoding: 'utf8' });
    assert.equal(r.status, 0);
    // 空目录下应明确报告 .git/ + SSoT 4 件 + 衍生制品 + transient 都 ✗
    assert.match(r.stdout, /✗ \.git\//);
    // SSoT 路径（v1.1，撤回 PRD 仪式后）：framework-recommended core
    //   - docs/specs/（设计 spec 集合）
    //   - docs/ssot/{decisions,changelog}.jsonl
    //   - docs/ssot/openapi/
    assert.match(r.stdout, /✗ docs\/specs/);
    assert.match(r.stdout, /✗ docs\/ssot\/decisions\.jsonl/);
    assert.match(r.stdout, /✗ docs\/ssot\/changelog\.jsonl/);
    assert.match(r.stdout, /✗ docs\/ssot\/openapi/);
    // 衍生
    assert.match(r.stdout, /✗ docs\/plans/);
    // transient
    assert.match(r.stdout, /✗ \.ddt\/state\/current\.json/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ddt-doctor 输出 LLM 必读段，明确禁止看 settings.local.json 判定降级', () => {
  // 防 v1.1 dogfood 回归：LLM 误把 .claude/settings.local.json 当作 hook 注册位置
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /LLM 必读/);
  assert.match(r.stdout, /settings\.local\.json/, '必须显式提到 settings.local.json 警告');
  assert.match(r.stdout, /误报|看错位置/, '必须明确这是误报路径');
});

test('ddt-doctor 输出 node 版本与 plugin/cwd 路径（便于 dogfood 排查）', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /plugin root\s*:\s*\S+/);
  assert.match(r.stdout, /current cwd\s*:\s*\S+/);
  assert.match(r.stdout, /node version\s*:\s*v\d+/);
});
