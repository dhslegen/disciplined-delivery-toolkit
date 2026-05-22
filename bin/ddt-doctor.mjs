#!/usr/bin/env node
// DDT v1.0 doctor：健康检查。分两段：
//   [A] plugin 自身健康（hooks.json 注册 / bin 文件 / skill 文件）—— 路径用 __dirname 解析，不依赖 cwd
//   [B] 当前项目 DDT 状态（cwd 下 .git / .ddt/ / metrics 文件）—— 路径用 cwd
// 零依赖。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REQUIRED_HOOKS = ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end'];
const REQUIRED_BINS = ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs', 'resolve-tech-stack.mjs', 'ddt-hook-preflight.mjs'];
const KEY_SKILLS = ['ddt-charter', 'ddt-brainstorming', 'ddt-design', 'ddt-impl-spec', 'ddt-deliver'];

// 解析 plugin root（bin/ 的父目录）——不依赖 cwd
const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = process.cwd();

console.log('DDT doctor — 健康检查');
console.log('=================================');
console.log(`plugin root : ${pluginRoot}`);
console.log(`current cwd : ${cwd}`);
console.log(`node version: ${process.version}`);
console.log('');

// ============================================================================
// [A] plugin 自身健康（与 cwd 无关）
// ============================================================================
console.log('## [A] plugin 自身健康（与你在哪个目录跑无关）');
console.log('');

console.log('### hooks.json 注册的 hook ID');
let registered = new Set();
let hooksJsonPath = path.join(pluginRoot, 'hooks/hooks.json');
try {
  const hj = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
  for (const arr of Object.values(hj.hooks || {})) {
    for (const e of arr || []) if (e && e.id) registered.add(e.id);
  }
} catch (e) {
  console.log(`  ✗ hooks.json 不可读 (${hooksJsonPath}): ${e.message}`);
}
for (const id of REQUIRED_HOOKS) {
  console.log(`  ${registered.has(id) ? '✓' : '✗'} ${id}`);
}
console.log('');

console.log('### bin/ 承重件就位');
for (const b of REQUIRED_BINS) {
  console.log(`  ${existsSync(path.join(pluginRoot, 'bin', b)) ? '✓' : '✗'} bin/${b}`);
}
console.log('');

console.log('### 关键 skill 就位（采样）');
for (const s of KEY_SKILLS) {
  console.log(`  ${existsSync(path.join(pluginRoot, 'skills', s, 'SKILL.md')) ? '✓' : '✗'} skills/${s}/SKILL.md`);
}
console.log('');

// ============================================================================
// [B] 当前项目 DDT 状态（与 cwd 强相关）
// ============================================================================
console.log('## [B] 当前项目 DDT 状态（cwd: ' + cwd + '）');
console.log('');

console.log('### 项目骨架');
console.log(`  ${existsSync(path.join(cwd, '.git')) ? '✓' : '✗'} .git/                       （进度反推依赖 git 历史）`);
console.log('');
console.log('  [SSoT 真相 — 入 git，append-only，经专用 bin 追加]');
console.log(`  ${existsSync(path.join(cwd, 'docs/specs')) ? '✓' : '✗'} docs/specs/                 （设计 spec 集合，brainstorming 产物）`);
console.log(`  ${existsSync(path.join(cwd, '.ddt/decisions.jsonl')) ? '✓' : '✗'} .ddt/decisions.jsonl        （决策账本，append-only，入 git 白名单）`);
console.log(`  ${existsSync(path.join(cwd, '.ddt/changelog.jsonl')) ? '✓' : '✗'} .ddt/changelog.jsonl        （变更账本，append-only，入 git 白名单）`);
console.log('');
console.log('  [派生制品 — 多文件，按切片/任务展开]');
console.log(`  ${existsSync(path.join(cwd, 'docs/plans')) ? '✓' : '✗'} docs/plans/                 （切片 plan 目录）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/reviews')) ? '✓' : '✗'} docs/reviews/               （reviewer 输出，IL-5 校验对象）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/api')) ? '✓' : '✗'} docs/api/                   （契约，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/data')) ? '✓' : '✗'} docs/data/                  （数据设计，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/design')) ? '✓' : '✗'} docs/design/                （架构/设计，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/requirements')) ? '✓' : '✗'} docs/requirements/          （大需求切片，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/briefs')) ? '✓' : '✗'} docs/briefs/                （需求 brief，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/verification')) ? '✓' : '✗'} docs/verification/          （验收记录，按需）`);
console.log(`  ${existsSync(path.join(cwd, 'docs/delivery')) ? '✓' : '✗'} docs/delivery/              （交付包，按需）`);
console.log('');
console.log('  [transient 工作态 — 不入 git，每次覆盖]');
console.log(`  ${existsSync(path.join(cwd, '.ddt/state/current.json')) ? '✓' : '✗'} .ddt/state/current.json     （command→hook 字段桥）`);
console.log(`  ${existsSync(path.join(cwd, '.ddt/metrics')) ? '✓' : '✗'} .ddt/metrics/               （hook 被动埋点）`);
console.log('');
console.log('  [多人协作支持]');
const gaPath = path.join(cwd, '.gitattributes');
let gaContent = '';
try { gaContent = readFileSync(gaPath, 'utf8'); } catch { /* 文件不存在 */ }
const hasDdtUnionMerge = gaContent.includes('.ddt/decisions.jsonl') && gaContent.includes('merge=union');
console.log(`  ${hasDdtUnionMerge ? '✓' : '·'} .gitattributes .ddt/decisions.jsonl merge=union  ${hasDdtUnionMerge ? '（jsonl 并发追加自动合并）' : '（缺失：建议从 plugin 复制模板。两人并发 append decisions/changelog 会撞 git conflict）'}`);
console.log('');
console.log('  [.gitignore 外科白名单]');
const giPath = path.join(cwd, '.gitignore');
let giContent = '';
try { giContent = readFileSync(giPath, 'utf8'); } catch { /* 文件不存在 */ }
const hasDdtWhitelist = giContent.includes('!.ddt/decisions.jsonl');
console.log(`  ${hasDdtWhitelist ? '✓' : '·'} .gitignore !.ddt/decisions.jsonl 白名单  ${hasDdtWhitelist ? '（SSoT 入 git，transient 被 ignore）' : '（缺失：.ddt/ 整目录 ignore 但 decisions/changelog 未放行）'}`);
console.log('');
console.log('  [v0.x 残留检测（多插件污染防护）]');
const hasV0Residual = existsSync(path.join(cwd, '.ddt/progress.json'));
if (hasV0Residual) {
  console.log('  ⚠️  发现 .ddt/progress.json — schema_version 1 的 v0.x 残留');
  console.log('     罪魁：digital-delivery-team v0.x 插件仍启用，其 hook 在偷偷写 progress.json');
  console.log('     修复：在 Claude Code 里 /plugin uninstall digital-delivery-team（或 disable）');
  console.log('     v0.x 仍启用会持续污染 cwd，建议立即卸载');
} else {
  console.log('  ✓ 无 v0.x 残留文件');
}
console.log('');

console.log('### hook 实际工作的证据');
// metrics 文件存在 = PostToolUse / SessionEnd hook 至少跑过一次
let metricsCount = 0;
try {
  const fs = await import('node:fs');
  const entries = fs.readdirSync(path.join(cwd, '.ddt/metrics'));
  metricsCount = entries.filter(f => f.endsWith('.jsonl')).length;
} catch { /* 无 metrics 目录 */ }
console.log(`  ${metricsCount > 0 ? '✓' : '·'} .ddt/metrics/*.jsonl     发现 ${metricsCount} 个文件 ${metricsCount > 0 ? '（PostToolUse / SessionEnd hook 已落盘，强制层在工作的硬证据之一）' : '（hook 未触发或本会话尚未产生工具调用）'}`);
console.log('  ·  charter 已注入        = 如果你在 LLM 会话里读到本 doctor 是被路由到 /ddt 自检 触发的，说明 SessionStart hook (ddt:charter-inject) 一定在工作');
console.log('');

// ============================================================================
// [C] 结论与降级判定（LLM 必读，防止误报）
// ============================================================================
console.log('## [C] LLM 必读：hook 工作状态判定');
console.log('');
console.log('  Iron Laws 是否降级，**只看 plugin 自身健康段 [A] 是否齐全**。');
console.log('');
console.log('  ✓ 若 [A] 段全部 ✓ → 强制层 hook 已注册到 Claude Code runtime，Iron Laws 全效。');
console.log('  ✗ 若 [A] 段任一 ✗ → 对应 IL 降级，按 charter 「hook 缺失降级声明」标注。');
console.log('');
console.log('  **绝不**通过看用户的 .claude/settings.local.json 是否有 hooks 段来判定！');
console.log('  plugin hooks 注册在 plugin 自己的 hooks/hooks.json，不在用户 settings。');
console.log('  看错位置 = 误报降级 = 鼓励本不该发生的合理化绕过。');
console.log('');

console.log('## [D] 真实环境验收提示');
console.log('  state 桥（命令→hook 字段桥）的跨进程行为只能在真实 Claude Code 下手验：');
console.log('  1. 装本 plugin 到 Claude Code');
console.log('  2. 启会话敲 /ddt 帮我做一个测试项目');
console.log('  3. 看 .ddt/state/current.json 是否被 /ddt 写出');
console.log('  4. 触发任一工具调用，看 hook 是否读 state 并 enforce IL');
console.log('  5. 跑 ddt-doctor.mjs 复检健康，跑 ddt-report.mjs 看 ROI 报告');
console.log('');
console.log('如以上任一不通，参 plan4-activation 与 plan5-metrics-roi 实施计划排查。');
process.exit(0);
