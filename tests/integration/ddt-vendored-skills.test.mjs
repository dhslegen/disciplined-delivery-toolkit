import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V = ['ddt-brainstorming','ddt-writing-plans','ddt-subagent-driven','ddt-executing-plans','ddt-tdd','ddt-systematic-debugging','ddt-verification','ddt-requesting-review','ddt-receiving-review'];

test('9 vendored skill 平铺且 Claude 可发现（SKILL.md + name 匹配目录 + 降级声明）', () => {
  for (const d of V) {
    const f = path.join(root, 'skills', d, 'SKILL.md');
    assert.ok(existsSync(f), d + '/SKILL.md 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, d + ' 无 frontmatter');
    assert.match(m[1], new RegExp('name:\\s*' + d + '\\b'), d + ' name 未改为目录名');
    assert.match(s, /DDT 强制层声明/, d + ' 缺降级声明');
  }
});
test('宪法含 7 条 Iron Law', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  for (const il of ['IL-1','IL-2','IL-3','IL-4','IL-5','IL-6','IL-7']) assert.match(s, new RegExp(il));
});
test('skill 未嵌套 _vendored（决策#7）', () => {
  assert.ok(!existsSync(path.join(root, 'skills/_vendored')));
});
