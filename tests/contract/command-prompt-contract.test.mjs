// commands/*.md 结构契约测试。
// 注意：这是"弱契约"——只测 markdown 结构和关键短语，不测 LLM 行为。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const commandsDir = path.join(root, 'commands');

function allCommands() {
  return readdirSync(commandsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

function readCmd(name) {
  return readFileSync(path.join(commandsDir, `${name}.md`), 'utf8');
}

function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return null;
  const result = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([a-zA-Z][a-zA-Z0-9_-]*?):\s*(.*)$/.exec(line);
    if (kv) result[kv[1]] = kv[2].trim();
  }
  return result;
}

test('契约 commands/* · 全部含合法 YAML frontmatter', () => {
  for (const cmd of allCommands()) {
    const fm = parseFrontmatter(readCmd(cmd));
    assert.ok(fm !== null, `commands/${cmd}.md 必须含 frontmatter`);
  }
});

test('契约 commands/* · description 字段存在且非空', () => {
  for (const cmd of allCommands()) {
    const fm = parseFrontmatter(readCmd(cmd));
    assert.ok(fm.description, `commands/${cmd}.md 必须有 description`);
    assert.ok(fm.description.length > 0);
  }
});

test('契约 commands/* · 当前 plugin 只暴露 ddt 和 ddt-status 两条命令', () => {
  const cmds = allCommands().sort();
  assert.deepEqual(cmds, ['ddt', 'ddt-status'],
    'plugin "2 命令" 设计原则：只允许 ddt + ddt-status');
});

test('契约 commands/ddt.md · 必须解释三种入口（向导语义）', () => {
  const md = readCmd('ddt');
  assert.match(md, /三种入口|三类入口|entry point/i,
    '/ddt 向导必须解释三种入口，而非强制路由');
});

test('契约 commands/ddt.md · 必须含向导建议语义（不拦截）', () => {
  const md = readCmd('ddt');
  assert.match(md, /建议|suggest|不拦截|可跳过|可无视|直接动手/,
    '/ddt 必须明示这是建议而非强制拦截');
});

test('契约 commands/ddt.md · 必须指向 superpowers 原生链路', () => {
  const md = readCmd('ddt');
  assert.match(md, /superpowers|原生链路|systematic-debugging/,
    '/ddt 向导应指引开发者使用 superpowers 原生链路');
});

test('契约 commands/ddt.md · 不得含强制意图分类路由口吻', () => {
  const md = readCmd('ddt');
  assert.doesNotMatch(md, /按宪法.*意图分类|意图分类强制|必须先 spec|5 站脊柱/,
    '/ddt 不得有"按宪法意图分类"或"5 站脊柱"等强制流程口吻');
});

test('契约 commands/ddt.md · 不得含 docs/ssot 旧路径', () => {
  const md = readCmd('ddt');
  assert.doesNotMatch(md, /docs\/ssot/,
    '/ddt 不得含 docs/ssot 旧路径');
});

test('契约 commands/ddt-status.md · 必须说明 plugin bin 路径策略', () => {
  const md = readCmd('ddt-status');
  assert.match(md, /CLAUDE_PLUGIN_ROOT/,
    '/ddt-status 路径策略：先用 plugin bin PATH，fallback CLAUDE_PLUGIN_ROOT');
});

test('契约 commands/ddt-status.md · 必须声明只读不写', () => {
  const md = readCmd('ddt-status');
  assert.match(md, /只读|不写|绝不/,
    '/ddt-status 必须显式声明只读语义');
});

test('契约 commands/ddt-status.md · 必须含 in_progress_slices 字段说明', () => {
  const md = readCmd('ddt-status');
  assert.match(md, /in_progress_slices|切片进行中|git branch/,
    '/ddt-status 输出必须含 v1.1 多人协作 slice branch 视图');
});
