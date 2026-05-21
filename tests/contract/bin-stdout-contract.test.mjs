// bin/*.mjs CLI 工具 stdout / stderr / exit code 协议契约测试。
//
// 协议（DDT 内部约定）：
// 1. exit 0 = 成功；exit !=0 = 错误，stderr 含人类可读说明
// 2. 如果工具声明输出 JSON（doc 头注释说明），stdout 必须是合法 JSON
// 3. stdout 不夹杂调试/日志信息（错误走 stderr）
// 4. 不打印控制字符 / ANSI escape（管道安全）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bin = (name) => path.join(root, 'bin', name);

function freshDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'ddt-bin-contract-'));
}

// === ddt-status.mjs：声明输出 JSON，必含特定字段 ===

test('契约 bin/ddt-status.mjs · 输出合法 JSON', () => {
  const r = spawnSync('node', [bin('ddt-status.mjs')], { cwd: freshDir(), encoding: 'utf8' });
  assert.equal(r.status, 0, 'exit 0');
  assert.doesNotThrow(() => JSON.parse(r.stdout), 'stdout 必须是合法 JSON');
});

test('契约 bin/ddt-status.mjs · JSON 含必需字段', () => {
  const r = spawnSync('node', [bin('ddt-status.mjs')], { cwd: freshDir(), encoding: 'utf8' });
  const out = JSON.parse(r.stdout);
  for (const field of ['pending_decisions', 'slice_specs', 'slice_plans', 'in_progress_slices']) {
    assert.ok(field in out, `输出必须含字段 "${field}"`);
    assert.ok(Array.isArray(out[field]), `字段 "${field}" 必须是数组`);
  }
});

// === ddt-doctor.mjs：声明输出文本，含特定标题 ===

test('契约 bin/ddt-doctor.mjs · exit 0 + stdout 非空', () => {
  const r = spawnSync('node', [bin('ddt-doctor.mjs')], { cwd: freshDir(), encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.length > 100, 'doctor 输出应丰富（>100 字符）');
});

test('契约 bin/ddt-doctor.mjs · 三段标题结构稳定', () => {
  const r = spawnSync('node', [bin('ddt-doctor.mjs')], { cwd: freshDir(), encoding: 'utf8' });
  assert.match(r.stdout, /DDT doctor/);
  assert.match(r.stdout, /\[A\] plugin 自身健康/);
  assert.match(r.stdout, /\[B\] 当前项目 DDT 状态/);
  assert.match(r.stdout, /\[C\] LLM 必读/);
});

// === ddt-report.mjs：写文件 + 退出码 ===

test('契约 bin/ddt-report.mjs · exit 0 + 写 docs/efficiency-report.md', () => {
  const dir = freshDir();
  mkdirSync(path.join(dir, '.ddt/metrics'), { recursive: true });
  mkdirSync(path.join(dir, 'docs/ssot'), { recursive: true });
  const r = spawnSync('node', [bin('ddt-report.mjs')], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /wrote docs\/efficiency-report\.md/, 'stdout 必须告知写文件路径');
});

// === ddt-decisions-append.mjs + ddt-changelog-append.mjs：append 协议 ===

test('契约 bin/ddt-decisions-append.mjs · 合法 JSON stdin → exit 0', () => {
  const r = spawnSync('node', [bin('ddt-decisions-append.mjs')], {
    input: JSON.stringify({ kind: 'test', note: 'contract' }),
    cwd: freshDir(),
    encoding: 'utf8'
  });
  assert.equal(r.status, 0);
});

test('契约 bin/ddt-decisions-append.mjs · 坏 JSON stdin → exit !=0 + stderr 含 "JSON"', () => {
  const r = spawnSync('node', [bin('ddt-decisions-append.mjs')], {
    input: 'not-json',
    cwd: freshDir(),
    encoding: 'utf8'
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /JSON/i, '错误必须含明确 reason 在 stderr');
});

test('契约 bin/ddt-decisions-append.mjs · 非对象 JSON (array/string) → exit !=0', () => {
  for (const bad of ['[1,2]', '"string"', 'null', '42']) {
    const r = spawnSync('node', [bin('ddt-decisions-append.mjs')], {
      input: bad, cwd: freshDir(), encoding: 'utf8'
    });
    assert.notEqual(r.status, 0, `输入 ${bad} 必须 exit !=0`);
  }
});

test('契约 bin/ddt-changelog-append.mjs · 协议同 decisions-append', () => {
  const r = spawnSync('node', [bin('ddt-changelog-append.mjs')], {
    input: JSON.stringify({ kind: 'amend', paths: ['x.md'] }),
    cwd: freshDir(),
    encoding: 'utf8'
  });
  assert.equal(r.status, 0);
});

// === resolve-tech-stack.mjs：单点写入约束 ===

test('契约 bin/resolve-tech-stack.mjs · 缺必填字段 → exit !=0', () => {
  const r = spawnSync('node', [bin('resolve-tech-stack.mjs')], {
    input: JSON.stringify({ preset: 'foo' }), // 缺 frontend/backend
    cwd: freshDir(),
    encoding: 'utf8'
  });
  assert.notEqual(r.status, 0);
});

// === ddt-contract-lint.mjs：lint 协议 ===

test('契约 bin/ddt-contract-lint.mjs · 缺文件 → exit !=0 + stderr 含说明', () => {
  const r = spawnSync('node', [bin('ddt-contract-lint.mjs')], { cwd: freshDir(), encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.ok(r.stderr.length > 0, 'lint 失败必须有 stderr 解释');
});

// === ddt-hook-preflight.mjs：preflight 协议 ===

test('契约 bin/ddt-hook-preflight.mjs · plugin 仓内跑应 exit 0（所有 hook 注册）', () => {
  const r = spawnSync('node', [bin('ddt-hook-preflight.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, 'plugin 仓内 hook 都注册，应 exit 0');
});

// === 通用契约：所有 bin 不输出 ANSI escape（管道安全）===

test('契约 bin/* · 默认输出不含 ANSI 控制序列（管道安全）', () => {
  const binsToCheck = ['ddt-status.mjs', 'ddt-doctor.mjs'];
  for (const b of binsToCheck) {
    const r = spawnSync('node', [bin(b)], { cwd: freshDir(), encoding: 'utf8' });
    // ANSI escape 通常以 \x1b[ 开头
    assert.ok(!r.stdout.includes('\x1b['), `${b} 输出不应含 ANSI escape（破坏管道）`);
  }
});
