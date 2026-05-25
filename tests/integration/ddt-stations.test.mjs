import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Phase D 重设计后：5 站脊柱概念已废。
// DDT 原生 skill 组合为：using-ddt + ddt-design-checkpoint + ddt-deliver + ddt-design-source
// 9 vendored skill 承载主要纪律，5 站测试改为按需 skill 组合测试。
// using-ddt 在 ddt-activation.test.mjs 单独覆盖，此处仅测三个按需 DDT skill

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
    assert.doesNotMatch(s, /强制层/, d + ' 不应再含强制层措辞（IL-5 强制层已拔除）');
  }
});

test('ddt-design-checkpoint 含七问 Design Checkpoint', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(s, /七问 Design Checkpoint|Design Checkpoint/);
  assert.match(s, /writing-plans/);
  assert.match(s, /docs\/api/);
  assert.match(s, /docs\/data/);
  assert.match(s, /docs\/design/);
  // checkpoint 粒度不限：可在大需求级运行（条件触发，只落全局层，不预支各 brief 的 checkpoint）。
  assert.match(s, /大需求级|逐片深做|粒度不限/, 'design-checkpoint 应点明可在大需求级运行（条件触发）');
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

test('前端外部设计：整体出一次 + 切片消费 + 粒度判断 + CRUD 无逃逸口 + using-ddt/checkpoint 路由（防孤儿/防碎片化/防钦定粒度/防 CRUD 逃逸口）', () => {
  // 四重防回归：① design-source 曾是零触发器孤儿；② per-slice 各自外部设计=碎片化（须整体出一次）；
  // ③ 别把粒度（整盘/按域/系统先行）钦定进通用 skill——留给项目判断；
  // ④ contract-driven/CRUD 也必须走外部设计系统——不得开「用标准组件即可」逃逸口
  //    （用户明确：统一走外部设计；设计系统常为竞争力定制原生风格，off-the-shelf 组件会不一致）。
  const ds = readFileSync(path.join(root, 'skills/ddt-design-source/SKILL.md'), 'utf8');
  assert.match(ds, /整体|成批/, 'design-source 应是整体/成批出（求一致）');
  assert.match(ds, /消费/, 'design-source 应说明切片消费、不重复设计');
  assert.match(ds, /粒度/, 'design-source 应把粒度作为判断（不钦定整盘）');
  assert.match(ds, /contract-driven/, 'design-source 应说明 contract-driven 页面处理');
  assert.match(ds, /全部前端|连.*也|不回退/, 'design-source 应说明全部前端（含 CRUD）都走外部设计系统');
  assert.doesNotMatch(ds, /标准组件即可|不必精雕/, 'design-source 不应给 CRUD 开「用标准组件即可」逃逸口');
  // ⑤ 前端设计不吃契约——契约在 brief 的 Design Checkpoint 才出、Reconcile 才对齐
  //    （防回归到"Export 吃契约"的假前提：契约在大需求阶段并不存在）。
  assert.match(ds, /不依赖契约/, 'design-source 应说明前端设计不依赖契约（契约 Reconcile 时才对齐）');
  // ⑥ bundle 的存在/位置/opt-out 钉成单一真相：位置 docs/design/frontend/（test -e 可机判）、支持 opt-out
  //    （防回归到"眼看 docs/design/ 有没有东西"的不稳定判断 + opt-out 缺失）。
  assert.match(ds, /docs\/design\/frontend/, 'design-source 须把 bundle 位置钉死到 docs/design/frontend/（可机判存在）');
  assert.match(ds, /opt-out|不外部设计/, 'design-source 须支持 opt-out（不需外部时的正式态，闸不反复触发）');
  // ⑦ 消费的是 bundle（视觉真相、直接消费），brief 的 spec 只是引用它的"建什么"计划——
  //    防回归到"bundle 转译成文字 design spec 再消费"的自毁式读法（丢视觉保真）。
  assert.match(ds, /直接消费/, 'design-source 应说明 bundle 被直接消费（视觉真相，非转译成文字 spec）');
  assert.match(ds, /引用/, 'design-source 应说明 brief 的 spec 引用 bundle（非替代/转译）');
  // ⑧ 外部工具是审美保真的推荐、非强制；bundle 谁做都行（外部或 LLM 自做整盘）——
  //    防回归到"必须外部工具"，也防"LLM 自己处理"退化成每切片抓组件库（红线仍在 ④）。
  assert.match(ds, /谁设计的不重要/, 'design-source 应说明 bundle 谁设计的不重要（外部是推荐非强制、LLM 自做也算）');
  // ⑨ Ingest 产出 SOURCE.md 消费入口、Reconcile 在推翻上游假设时记 supersede 决策——
  //    把这两个曾靠模型悟性补出的好模式钉成 skill 保证（不私改上游，账本即真相）。
  assert.match(ds, /SOURCE\.md/, 'design-source Ingest 应产出 SOURCE.md 消费入口');
  assert.match(ds, /supersedes/, 'design-source Reconcile 应在推翻上游假设时记 supersede 决策');
  // ⑩ Export 给约束别给解法、留白给外部工具发挥——防 over-fill 在文字里把设计做完、封顶竞争力/辨识度。
  //    留白只碰"视觉身份+签名页布局"，绝不碰一致性（色彩/菜单/组件仍是一套系统覆盖全部表面含 CRUD）。
  assert.match(ds, /留白/, 'design-source Export 应留白：给约束别给解法，别在文字里把设计做完');
  for (const f of ['skills/using-ddt/SKILL.md', 'skills/ddt-design-checkpoint/SKILL.md']) {
    const s = readFileSync(path.join(root, f), 'utf8');
    assert.match(s, /ddt-design-source/, f + ' 应把前端路由到 ddt-design-source');
    assert.match(s, /前端/, f + ' 应含前端分流');
  }
  const cp = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(cp, /docs\/design\/frontend/, 'design-checkpoint 前端分流须按 docs/design/frontend/ 判断触发（确定性，非眼看）');
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
