import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('2 个命令文件就位且 frontmatter 合法', () => {
  for (const c of ['ddt.md', 'ddt-status.md']) {
    const f = path.join(root, 'commands', c);
    assert.ok(existsSync(f), c + ' 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, c + ' 无 frontmatter');
    assert.match(m[1], /description:\s*\S/, c + ' 缺 description');
  }
});

test('5 个 bin 承重件就位', () => {
  for (const b of ['ddt-status.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs', 'resolve-tech-stack.mjs', 'ddt-contract-lint.mjs']) {
    assert.ok(existsSync(path.join(root, 'bin', b)), 'bin/' + b + ' 缺失');
  }
});

test('/ddt 命令含 state 桥与意图分类引用', () => {
  const s = readFileSync(path.join(root, 'commands/ddt.md'), 'utf8');
  assert.match(s, /\.ddt\/state\/current\.json/);
  assert.match(s, /ddt-charter/);
  assert.match(s, /意图/);
});

test('/ddt-status 命令含 IL-7 反推语义', () => {
  const s = readFileSync(path.join(root, 'commands/ddt-status.md'), 'utf8');
  assert.match(s, /反推|从 repo 事实/);
  assert.match(s, /git trailer|git log/);
  assert.match(s, /仅读不写|不推进、不改|绝不/);
});

test('ddt-design 契约 lint 引用 bin/ddt-contract-lint.mjs（已激活）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design/SKILL.md'), 'utf8');
  assert.match(s, /ddt-contract-lint\.mjs/);
  assert.match(s, /exit=0/);
  assert.doesNotMatch(s, /待激活/);
});
