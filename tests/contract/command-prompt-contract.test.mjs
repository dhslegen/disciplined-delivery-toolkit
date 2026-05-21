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

test('契约 commands/ddt.md · 必须含元命令短路识别段（v1.1 dogfood 第 6 条修复）', () => {
  const md = readCmd('ddt');
  assert.match(md, /元命令短路识别|selfcheck|自检/,
    '/ddt 必须能识别"自检/doctor/preflight"元命令，直接路由 ddt-doctor.mjs');
});

test('契约 commands/ddt.md · 必须引用 charter SSoT 路径地图', () => {
  const md = readCmd('ddt');
  assert.match(md, /SSoT 路径|charter.*路径/,
    '/ddt 必须引用 charter 的 SSoT 路径硬清单，禁止 LLM 自由发挥');
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
