import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'bin/ddt-doctor.mjs');

test('ddt-doctor：仓内运行 exit 0 + 输出 doctor 标题', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /DDT doctor/);
  assert.match(r.stdout, /hooks\.json/);
  assert.match(r.stdout, /bin\//);
});

test('ddt-doctor：列出 3 个关键 hook id 注册状态（无强制层，仅注入+被动度量）', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const id of ['ddt:inject', 'ddt:metrics-post', 'ddt:metrics-end']) {
    assert.match(r.stdout, new RegExp(id));
  }
  assert.doesNotMatch(r.stdout, /ddt:enforce-pre/, 'enforce-pre 已拔除，doctor 不应再列');
});

test('ddt-doctor：列出关键 bin 文件就位状态', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  for (const b of ['ddt-status.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs']) {
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
    // plugin 自身 3 个 hook id 仍应被识别（路径解析靠 __dirname 而非 cwd）
    for (const id of ['ddt:inject', 'ddt:metrics-post', 'ddt:metrics-end']) {
      assert.match(r.stdout, new RegExp(`✓ ${id}`), `[A] 段应识别 ${id}（不受 cwd 影响）`);
    }
    // plugin bin 全部 ✓
    for (const b of ['ddt-status.mjs', 'ddt-report.mjs', 'ddt-changelog-append.mjs']) {
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
    // 空目录下应明确报告 .git/ + SSoT 件 + 衍生制品 + transient 都 ✗
    assert.match(r.stdout, /✗ \.git\//);
    // SSoT 路径（新结构）：SSoT 真相住 .ddt/；设计 spec 在 docs/specs/
    assert.match(r.stdout, /✗ docs\/specs/);
    assert.match(r.stdout, /✗ \.ddt\/decisions\.jsonl/);
    assert.match(r.stdout, /✗ \.ddt\/changelog\.jsonl/);
    // 衍生：docs/plans + docs/api
    assert.match(r.stdout, /✗ docs\/plans/);
    assert.match(r.stdout, /✗ docs\/api/);
    // transient
    assert.match(r.stdout, /✗ \.ddt\/state\/current\.json/);
    // .gitattributes 缺失时应输出缺失提示
    assert.match(r.stdout, /缺失|建议从 plugin 复制/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ddt-doctor .gitattributes union merge 检查：decisions + changelog 均配置时显示 ✓', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ddt-doctor-ga-test-'));
  try {
    // 写含两条 merge=union 的 .gitattributes
    writeFileSync(path.join(tmp, '.gitattributes'), [
      '.ddt/decisions.jsonl merge=union',
      '.ddt/changelog.jsonl merge=union',
    ].join('\n'));
    const r = spawnSync('node', [script], { cwd: tmp, encoding: 'utf8' });
    assert.equal(r.status, 0);
    // 两条 union 都配置时，doctor 应显示 ✓ 且输出中含 union 标记
    assert.match(r.stdout, /✓.*\.gitattributes.*merge=union|✓.*\.jsonl.*union/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ddt-doctor 输出 DDT 纪律取向段（无强制层）', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /纪律取向|无强制层/);
  assert.doesNotMatch(r.stdout, /IL-5|强制层 hook|降级/, '已拔除强制层，doctor 不应再提 IL-5/降级');
});

test('ddt-doctor 输出 node 版本与 plugin/cwd 路径（便于 dogfood 排查）', () => {
  const r = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  assert.match(r.stdout, /plugin root\s*:\s*\S+/);
  assert.match(r.stdout, /current cwd\s*:\s*\S+/);
  assert.match(r.stdout, /node version\s*:\s*v\d+/);
});
