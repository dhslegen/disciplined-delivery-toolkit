import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V = ['ddt-brainstorming','ddt-writing-plans','ddt-subagent-driven','ddt-executing-plans','ddt-tdd','ddt-systematic-debugging','ddt-verification','ddt-requesting-review','ddt-receiving-review'];

test('9 vendored skill 平铺且 Claude 可发现（SKILL.md + name 匹配目录）', () => {
  for (const d of V) {
    const f = path.join(root, 'skills', d, 'SKILL.md');
    assert.ok(existsSync(f), d + '/SKILL.md 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, d + ' 无 frontmatter');
    assert.match(m[1], new RegExp('name:\\s*' + d + '\\b'), d + ' name 未改为目录名');
    assert.doesNotMatch(s, /强制层/, d + ' 不应再含强制层措辞（IL-5 强制层已拔除）');
  }
});
test('using-ddt skill 含取向核心内容', () => {
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /北极星/, 'using-ddt 缺「北极星」段');
  assert.match(s, /三种入口/, 'using-ddt 缺「三种入口」段');
  assert.match(s, /Design Checkpoint/, 'using-ddt 缺 Design Checkpoint 段');
});
test('ddt-brainstorming 含大需求入口分流（产 requirements/briefs 而非单一 design spec）', () => {
  // 接缝防回归：vendored brainstorming 原生终点是 design spec，但 DDT 大需求入口要先产
  // requirements/briefs。此引导若被删/上游覆盖，大需求会被写成一份大 spec（没"变小"）。
  const s = readFileSync(path.join(root, 'skills/ddt-brainstorming/SKILL.md'), 'utf8');
  assert.match(s, /大需求入口分流|大需求/, 'ddt-brainstorming 缺大需求入口分流段');
  assert.match(s, /docs\/requirements\//, '大需求分流须指向 docs/requirements/');
  assert.match(s, /docs\/briefs\//, '大需求分流须指向 docs/briefs/');
  assert.match(s, /bite-size/, '大需求分流须要求 briefs 为 bite-size');
});
test('skill 未嵌套 _vendored（决策#7）', () => {
  assert.ok(!existsSync(path.join(root, 'skills/_vendored')));
});
