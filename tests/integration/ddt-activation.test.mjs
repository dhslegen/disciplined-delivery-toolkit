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

test('3 个 bin 承重件就位', () => {
  for (const b of ['ddt-status.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs']) {
    assert.ok(existsSync(path.join(root, 'bin', b)), 'bin/' + b + ' 缺失');
  }
});

test('/ddt 命令为可选向导（给建议不拦截）', () => {
  const s = readFileSync(path.join(root, 'commands/ddt.md'), 'utf8');
  // 向导语义：含三种入口 + 建议/不拦截口吻，不含强制意图分类
  assert.match(s, /三种入口|entry point/i);
  assert.match(s, /建议|suggest|不拦截|可无视|直接动手/);
  assert.doesNotMatch(s, /按宪法.*意图分类|5 站脊柱/);
});

test('/ddt-status 命令含 IL-7 反推语义', () => {
  const s = readFileSync(path.join(root, 'commands/ddt-status.md'), 'utf8');
  assert.match(s, /反推|从 repo 事实/);
  assert.match(s, /git trailer|git log/);
  assert.match(s, /仅读不写|不推进、不改|绝不/);
});

test('ddt-design-checkpoint 含兑现守恒清单（消费契约 + 职责守恒）且路径引用正确', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(s, /兑现守恒|完成清单/);
  // 两道核心闸的标记：消费契约（横向）+ 职责守恒（纵向）
  assert.match(s, /消费契约/);
  assert.match(s, /职责守恒/);
  // consumer-pull 取舍语义（叶子内部 rationale 不强制）
  assert.match(s, /consumer-pull/);
  assert.match(s, /writing-plans/);
  assert.match(s, /docs\/api/);
  assert.doesNotMatch(s, /待激活/);
});
