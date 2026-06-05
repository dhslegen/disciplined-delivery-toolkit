import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Phase D 重设计后：5 站脊柱概念已废。
// DDT 原生 skill 组合为：using-ddt + ddt-design-checkpoint + ddt-deliver + ddt-design-source
// 13 vendored skill 承载主要纪律，5 站测试改为按需 skill 组合测试。
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

test('ddt-design-checkpoint 含兑现守恒 Checkpoint 概念', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(s, /兑现守恒|完成清单|landing gate/);
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
  assert.match(ds, /整盘|整体|成批/, 'design-source 应是整盘/整体出（求一致）');
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
  assert.match(ds, /不转译|直接消费/, 'design-source 应说明 bundle 被直接消费/不转译（视觉真相，非转译成文字 spec）');
  assert.match(ds, /引用/, 'design-source 应说明 brief 的 spec 引用 bundle（非替代/转译）');
  // ⑧ 外部工具是审美保真的推荐、非强制；bundle 谁做都行（外部或 LLM 自做整盘）——
  //    防回归到"必须外部工具"，也防"LLM 自己处理"退化成每切片抓组件库（红线仍在 ④）。
  assert.match(ds, /谁做不重要|谁设计的不重要/, 'design-source 应说明 bundle 谁做不重要（外部是推荐非强制、LLM 自做也算）');
  // ⑨ Ingest 的消费入口是 bundle 自带的 handoff（源权威）、项目侧不写任何导览 md
  //    （SOURCE.md/INDEX.md 等）——否则 LLM 停在转译层不读真源（兑现守恒①）；
  //    Reconcile 在推翻上游假设时记 supersede 决策（不私改上游，账本即真相）。
  //    注意：此处锁"禁止产出导览 md"的反向语义，不能锁 /SOURCE\.md/ 字面量——
  //    它在禁令句里也出现，会假绿且把已根除的反模式当成正确行为。
  assert.match(ds, /handoff/, 'design-source 消费入口须是 bundle 自带 handoff（源权威）');
  assert.match(ds, /不写任何导览|不写.*导览 md/, 'design-source 须明令项目侧不写导览 md（SOURCE.md/INDEX.md），否则 LLM 停在转译层');
  assert.doesNotMatch(ds, /产出.{0,4}SOURCE\.md|SOURCE\.md.{0,6}消费入口/, 'design-source 不得把 SOURCE.md 当产出的消费入口（防回归到项目侧造导览）');
  assert.match(ds, /supersedes/, 'design-source Reconcile 应在推翻上游假设时记 supersede 决策');
  // ⑩ Export 给约束别给解法、留白给外部工具发挥——防 over-fill 在文字里把设计做完、封顶竞争力/辨识度。
  //    留白只碰"视觉身份+签名页布局"，绝不碰一致性（色彩/菜单/组件仍是一套系统覆盖全部表面含 CRUD）。
  assert.match(ds, /不给解法|留白/, 'design-source Export 应给约束别给解法（留白给外部工具发挥），别在文字里把设计做完');
  for (const f of ['skills/using-ddt/SKILL.md', 'skills/ddt-design-checkpoint/SKILL.md']) {
    const s = readFileSync(path.join(root, f), 'utf8');
    assert.match(s, /ddt-design-source/, f + ' 应把前端路由到 ddt-design-source');
    assert.match(s, /前端/, f + ' 应含前端分流');
  }
  const cp = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(cp, /docs\/design\/frontend/, 'design-checkpoint 前端分流须按 docs/design/frontend/ 判断触发（确定性，非眼看）');
});

test('视觉真相操作闭环：bundle 消费手册 + 翻译保真 + 视觉×数据组合规则 + Q8 提取闸（防视觉每过一道边界蒸发成"功能对但廉价"）', () => {
  // 背景：兑现守恒三真相里，数据真相（Q6/observed/红旗）与职责真相（Q7/逐条勾）都有完整操作链，
  // 视觉真相长期只有"必读 bundle"一句原则，无提取物/无闸/无验收 → B11 落地功能对但视觉廉价。
  // 本 test 锁住补上的对称操作链。注意：锁语义不锁脆弱子串（易变散文留弹性）。

  // ① 手册是单一真相源：reference 文件存在且非空，承载翻译保真 + 组合规则 + 抽象条件 + 截图验收
  const bk = readFileSync(path.join(root, 'skills/ddt-design-source/references/consuming-a-bundle.md'), 'utf8');
  assert.ok(bk.length > 800, 'consuming-a-bundle.md 应是实质手册（非占位）');
  assert.match(bk, /源代码|逐行翻译|复刻.*渲染|渲染输出/, '手册须确立"bundle 是源代码、复刻渲染输出"（翻译非重新实现）');
  assert.match(bk, /只换数据源|替换数据源|换掉数据/, '手册须确立翻译=只替换数据源');
  assert.match(bk, /条件|当且仅当|匹配 bundle/, '手册须把抽象层框为条件（输出匹配 bundle 才用），非禁令');
  // 视觉×数据组合规则：零数据依赖的视觉模式永远保留，只砍数据驱动列（防"裁数据偷换成裁视觉"）
  assert.match(bk, /数据依赖/, '手册须用"数据依赖"作砍/留判据');
  assert.match(bk, /永远保留|不受.*裁剪|砍不得/, '手册须明令零数据依赖的视觉模式永远保留');
  assert.match(bk, /avatar|pill|toolbar/i, '手册须点名具体视觉模式（avatar/pill/toolbar 等）');
  // 截图验收：tests 绿不证明视觉达标（验收标准在渲染结果，不在代码）
  assert.match(bk, /截图/, '手册须要求截图与 bundle 对比验收');
  assert.match(bk, /不证明|不充分|不在代码里/, '手册须说明 tsc/测试绿不证明视觉达标');
  // 前向链路：提取入 spec → 传递 plan/subagent → 截图验收（让纪律穿过下游 vendored 阶段）
  assert.match(bk, /提取/, '手册须有"提取视觉规格入 spec"环');
  assert.match(bk, /plan|基建/i, '手册须把视觉基建传递到 plan 阶段');

  // ② using-ddt 视觉真相纲领升级为对称操作纲领（非仅"必读 bundle"）
  const u = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(u, /源代码|翻译保真|复刻渲染/, 'using-ddt 视觉真相须升级为"bundle 是源代码、翻译保真"');
  assert.match(u, /数据驱动列|裁视觉|视觉模式/, 'using-ddt 须含视觉×数据组合规则（别把裁数据偷换成裁视觉）');
  assert.match(u, /consuming-a-bundle/, 'using-ddt 视觉真相须指向操作手册');

  // ③ design-source 消费段指向手册（手册是被引用的单一源，非散落重述）
  const ds = readFileSync(path.join(root, 'skills/ddt-design-source/SKILL.md'), 'utf8');
  assert.match(ds, /consuming-a-bundle/, 'design-source 消费段须指向 consuming-a-bundle 手册');
  assert.match(ds, /翻译保真|只换数据源|复刻.*渲染|渲染输出/, 'design-source 消费段须含翻译保真语义');

  // ④ checkpoint 有 Q8 视觉提取闸（仅消费 bundle 切片）：spec 须有非空视觉章节，"读过了"不算
  const cp = readFileSync(path.join(root, 'skills/ddt-design-checkpoint/SKILL.md'), 'utf8');
  assert.match(cp, /视觉真相|视觉规格/, 'checkpoint 须把视觉真相列为受核的一种（对称消费契约/职责守恒）');
  assert.match(cp, /视觉规格.*提取|提取.*视觉规格/, 'checkpoint Q8 须要求从 bundle 提取视觉规格入 spec');
  assert.match(cp, /非空视觉章节|视觉章节/, 'checkpoint Q8 须要 spec 有非空视觉章节（"读过 handoff"不算）');
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
