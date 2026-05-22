import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Phase D 重设计后：5 站脊柱概念已废。
// DDT 原生 skill 组合为：using-ddt + ddt-design-checkpoint + ddt-deliver + ddt-design-source
// 9 vendored skill 承载主要纪律，5 站测试改为按需 skill 组合测试。

const DDT_NATIVE_SKILLS = ['ddt-design-checkpoint', 'ddt-deliver', 'ddt-design-source'];

test('DDT 原生 skill（design-checkpoint/deliver/design-source）平铺且 frontmatter 合法', () => {
  for (const d of DDT_NATIVE_SKILLS) {
    const f = path.join(root, 'skills', d, 'SKILL.md');
    assert.ok(existsSync(f), d + '/SKILL.md 缺失');
    const s = readFileSync(f, 'utf8');
    const m = s.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, d + ' 无 frontmatter');
    assert.match(m[1], new RegExp('name:\\s*' + d + '\\b'), d + ' name 不匹配目录');
    assert.match(m[1], /description:\s*Use /, d + ' description 须以 "Use" 起首（CSO 触发式）');
    assert.match(s, /DDT 强制层声明/, d + ' 缺降级声明');
  }
});

test('ddt-design-checkpoint 含七问 Design Checkpoint', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(s, /七问 Design Checkpoint|Design Checkpoint/);
  assert.match(s, /writing-plans/);
  assert.match(s, /docs\/api/);
  assert.match(s, /docs\/data/);
  assert.match(s, /docs\/design/);
});

test('ddt-deliver 含按需收口语义', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-deliver/SKILL.md'), 'utf8');
  assert.match(s, /按需|on demand/i);
  assert.match(s, /docs\/verification|docs\/delivery/);
});

test('ddt-design-source 含外部收敛回路四步', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-source/SKILL.md'), 'utf8');
  for (const step of ['Export', '外部回路', 'Ingest', 'Reconcile']) {
    assert.match(s, new RegExp(step), 'design-source 缺四步之 ' + step);
  }
});

test('DDT 原生 skill 集合引用 vendored skill 名精确', () => {
  const allText = DDT_NATIVE_SKILLS.map(d => readFileSync(path.join(root, 'skills', d, 'SKILL.md'), 'utf8')).join('\n---FILE---\n');
  // 各 skill 引用的 vendored skill 名应精确存在
  for (const ref of ['ddt-brainstorming', 'ddt-writing-plans']) {
    assert.match(allText, new RegExp(ref), 'DDT 原生 skill 集合缺 ' + ref + ' 引用');
  }
  // 无已删除 skill 的引用
  assert.doesNotMatch(allText, /ddt-impl-spec/, 'DDT 原生 skill 集合不应引用已删除的 ddt-impl-spec');
  assert.doesNotMatch(allText, /ddt-frontend-craft/, 'DDT 原生 skill 集合不应引用已删除的 ddt-frontend-craft');
});
