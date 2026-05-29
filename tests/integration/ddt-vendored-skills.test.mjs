import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V = ['ddt-brainstorming','ddt-writing-plans','ddt-subagent-driven','ddt-executing-plans','ddt-tdd','ddt-systematic-debugging','ddt-verification','ddt-requesting-review','ddt-receiving-review','ddt-dispatching-parallel-agents','ddt-finishing-a-development-branch','ddt-using-git-worktrees','ddt-writing-skills'];

test('13 vendored skill 平铺且 Claude 可发现（SKILL.md + name 匹配目录）', () => {
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
  assert.match(s, /四项治理增强/, 'using-ddt 缺「四项治理增强」段');
  assert.match(s, /三种入口/, 'using-ddt 缺「三种入口」段');
  assert.match(s, /ddt-design-checkpoint/, 'using-ddt 缺 ddt-design-checkpoint 段');
});
test('ddt-large-requirement 承担大需求入口分流（产 requirements/briefs + 设计留痕 而非单一 design spec）', () => {
  // 接缝防回归：大需求入口要先产 requirements/briefs + 设计留痕，把巨型 spec 切小。
  // 此契约从 ddt-brainstorming 迁到独立 ddt-large-requirement skill（ddt-brainstorming
  // 回滚至与 superpowers 原版同构）。若 ddt-large-requirement 被删或 anchor 被移除，
  // 大需求会被写成一份大 spec（没"变小"）。
  const f = path.join(root, 'skills/ddt-large-requirement/SKILL.md');
  assert.ok(existsSync(f), 'ddt-large-requirement/SKILL.md 缺失');
  const s = readFileSync(f, 'utf8');
  assert.match(s, /docs\/requirements\//, 'ddt-large-requirement 须指向 docs/requirements/');
  assert.match(s, /docs\/briefs\//, 'ddt-large-requirement 须指向 docs/briefs/');
  assert.match(s, /bite-size/, 'ddt-large-requirement 须要求 briefs 为 bite-size');
  assert.match(s, /docs\/design\//, 'ddt-large-requirement 须指向 docs/design/（设计留痕落地）');
});
test('using-ddt 指明大需求入口走 ddt-large-requirement（LLM 可被路由到大需求 skill）', () => {
  // ddt-brainstorming 回滚至 superpowers 原版同构后，不再含大需求分流提示。
  // LLM 看到大需求时找入口的唯一锚点是 using-ddt 的触发点列表。此引导若被删，
  // 大需求会默认进 ddt-brainstorming，绕过 ddt-large-requirement 的拆分。
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /ddt-large-requirement/, 'using-ddt 须明确点名 ddt-large-requirement 作为大需求入口');
});
test('skill 未嵌套 _vendored（决策#7）', () => {
  assert.ok(!existsSync(path.join(root, 'skills/_vendored')));
});
