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
test('using-ddt skill 含取向核心内容', () => {
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /北极星/, 'using-ddt 缺「北极星」段');
  assert.match(s, /三种入口/, 'using-ddt 缺「三种入口」段');
  assert.match(s, /Design Checkpoint/, 'using-ddt 缺 Design Checkpoint 段');
});
test('skill 未嵌套 _vendored（决策#7）', () => {
  assert.ok(!existsSync(path.join(root, 'skills/_vendored')));
});
