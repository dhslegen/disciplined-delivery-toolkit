import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATIONS = ['ddt-design', 'ddt-impl-spec', 'ddt-design-source', 'ddt-frontend-craft', 'ddt-deliver'];

test('5 个 DDT 原生站 skill 平铺且 frontmatter 合法（name 匹配目录 + description 触发式 + 含降级声明）', () => {
  for (const d of STATIONS) {
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

test('ddt-design 含强制 Spec Reviewer + 契约 lint 硬门', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design/SKILL.md'), 'utf8');
  assert.match(s, /Spec Reviewer/);
  assert.match(s, /契约 lint/);
  assert.match(s, /ddt-contract-lint\.mjs/);
});

test('ddt-impl-spec 含 refine 子句 + IL-3 HARD-GATE 引用', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-impl-spec/SKILL.md'), 'utf8');
  assert.match(s, /重构子句|refine 子句/);
  assert.match(s, /绿灯前置/);
  assert.match(s, /IL-3/);
});

test('ddt-design-source 含外部收敛回路四步纪律', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-source/SKILL.md'), 'utf8');
  for (const step of ['Export', '外部回路', 'Ingest', 'Reconcile']) {
    assert.match(s, new RegExp(step), 'design-source 缺四步之 ' + step);
  }
});

test('ddt-frontend-craft 含四项纪律（契约绑定/状态完备/无障碍/反 AI 通用感）', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-frontend-craft/SKILL.md'), 'utf8');
  for (const d of ['契约绑定', '状态完备', '无障碍', '反"AI 通用感"']) {
    assert.match(s, new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'frontend-craft 缺纪律之 ' + d);
  }
});

test('ddt-deliver 含 IL-6 终极证据门 + ROI 报告 Plan 5 激活归属 + 降低保障级机制', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-deliver/SKILL.md'), 'utf8');
  assert.match(s, /IL-6/);
  assert.match(s, /Plan 5/);
  assert.match(s, /降低保障级/);
});

test('5 站 skill 互引一致（命名引用未拼错）', () => {
  const allText = STATIONS.map(d => readFileSync(path.join(root, 'skills', d, 'SKILL.md'), 'utf8')).join('\n---FILE---\n');
  // 引用既有 vendored skill 名应精确
  for (const ref of ['ddt-subagent-driven', 'ddt-writing-plans', 'ddt-brainstorming', 'ddt-requesting-review']) {
    assert.match(allText, new RegExp(ref), '站 skill 集合缺 ' + ref + ' 引用');
  }
  // 站间互引
  assert.match(allText, /ddt-design/);
  assert.match(allText, /ddt-impl-spec/);
  assert.match(allText, /ddt-design-source/);
  assert.match(allText, /ddt-frontend-craft/);
});
