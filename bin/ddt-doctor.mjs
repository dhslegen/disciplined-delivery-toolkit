#!/usr/bin/env node
// DDT v1.0 doctor：健康检查。hooks 注册 + bin 就位 + 用户验收提示。零依赖。
import { readFileSync, existsSync } from 'node:fs';

const REQUIRED_HOOKS = ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop', 'ddt:metrics-post', 'ddt:metrics-end'];
const REQUIRED_BINS = ['ddt-status.mjs', 'ddt-contract-lint.mjs', 'ddt-report.mjs', 'ddt-decisions-append.mjs', 'ddt-changelog-append.mjs', 'resolve-tech-stack.mjs', 'ddt-hook-preflight.mjs'];

console.log('DDT v1.0 doctor — 健康检查\n=================================\n');

console.log('## hooks.json 注册状态\n');
let registered = new Set();
try {
  const hj = JSON.parse(readFileSync('hooks/hooks.json', 'utf8'));
  for (const arr of Object.values(hj.hooks || {})) {
    for (const e of arr || []) if (e && e.id) registered.add(e.id);
  }
} catch { console.log('  ✗ hooks.json 不可读'); }
for (const id of REQUIRED_HOOKS) {
  console.log(`  ${registered.has(id) ? '✓' : '✗'} ${id}`);
}

console.log('\n## bin/ 承重件就位\n');
for (const b of REQUIRED_BINS) {
  console.log(`  ${existsSync(`bin/${b}`) ? '✓' : '✗'} bin/${b}`);
}

console.log('\n## 关键 skill 就位（采样）\n');
for (const s of ['ddt-charter', 'ddt-brainstorming', 'ddt-design', 'ddt-impl-spec', 'ddt-deliver']) {
  console.log(`  ${existsSync(`skills/${s}/SKILL.md`) ? '✓' : '✗'} skills/${s}/SKILL.md`);
}

console.log('\n## 真实环境验收提示（Plan 4 self-review §6）\n');
console.log('  state 桥（命令→hook 字段桥）的跨进程行为只能在真实 Claude Code 下手验：');
console.log('  1. 装本 plugin 到 Claude Code');
console.log('  2. 启会话敲 /ddt 帮我做一个测试项目');
console.log('  3. 看 .ddt/state/current.json 是否被 /ddt 写出');
console.log('  4. 触发任一工具调用，看 hook 是否读 state 并 enforce IL');
console.log('  5. 跑 node bin/ddt-doctor.mjs 复检健康，跑 node bin/ddt-report.mjs 看 ROI 报告');
console.log('\n如以上任一不通，参 plan4-activation 与 plan5-metrics-roi 实施计划排查。\n');
process.exit(0);
