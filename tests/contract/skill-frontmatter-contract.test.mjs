// SKILL.md frontmatter 协议契约测试。
// 协议来源：https://code.claude.com/docs/en/skills#frontmatter-reference
//
// 关键约束：
// - YAML frontmatter 用 --- 分隔，必须可解析
// - name 字段（如有）：lowercase letters, numbers, hyphens only, max 64 chars
// - description 字段（recommended）：非空字符串
// - 整个 description+when_to_use 文本在 skill listing 中被截断到 1536 字符（Claude Code 内部限制）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skillsDir = path.join(root, 'skills');

// 列出所有 skill（plugin 自带，扫描 skills/ 下所有含 SKILL.md 的子目录）
function allSkills() {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => {
      try { readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8'); return true; }
      catch { return false; }
    });
}

// 简易 YAML frontmatter 解析（不引第三方依赖，只解析 key: value 行）
function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return null;
  const result = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([a-zA-Z][a-zA-Z0-9_-]*?):\s*(.*)$/.exec(line);
    if (kv) {
      let value = kv[2].trim();
      if (/^".*"$/.test(value)) value = value.slice(1, -1);
      if (/^'.*'$/.test(value)) value = value.slice(1, -1);
      result[kv[1]] = value;
    }
  }
  return result;
}

const NAME_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

test('契约 skills/* · 全部含合法 YAML frontmatter（--- 分隔）', () => {
  for (const skill of allSkills()) {
    const md = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(md);
    assert.ok(fm !== null, `skills/${skill}/SKILL.md 必须含 --- 包裹的 YAML frontmatter`);
  }
});

test('契约 skills/* · description 字段存在且非空', () => {
  for (const skill of allSkills()) {
    const md = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(md);
    assert.ok(fm.description !== undefined, `skills/${skill} 必须有 description`);
    assert.ok(fm.description.length > 0, `skills/${skill} description 非空`);
  }
});

test('契约 skills/* · name 字段（如存在）符合 lowercase-numbers-hyphens 格式', () => {
  for (const skill of allSkills()) {
    const md = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(md);
    if (fm.name) {
      assert.match(fm.name, NAME_PATTERN,
        `skills/${skill} name "${fm.name}" 必须符合 lowercase letters/numbers/hyphens, max 64 chars`);
    }
  }
});

test('契约 skills/* · name 与目录名一致（如存在 name）', () => {
  for (const skill of allSkills()) {
    const md = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(md);
    if (fm.name) {
      assert.equal(fm.name, skill,
        `skills/${skill}/SKILL.md frontmatter name "${fm.name}" 必须等于目录名 "${skill}"`);
    }
  }
});

test('契约 skills/* · 全部以 ddt- 前缀或已知例外命名（plugin namespace 一致性）', () => {
  // using-ddt 是取向 skill，不以 ddt- 前缀，是已知例外
  const exceptions = new Set(['using-ddt']);
  for (const skill of allSkills()) {
    if (!exceptions.has(skill)) {
      assert.match(skill, /^ddt-/, `skills/${skill} 必须以 ddt- 前缀命名（避免与其它 plugin 冲突）`);
    }
  }
});

test('契约 skills/* · description 总长 ≤ 1536 字符（Claude Code skill listing 上限）', () => {
  // 超过 1536 会被截断，关键 trigger 词可能丢失
  for (const skill of allSkills()) {
    const md = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(md);
    const total = (fm.description || '').length + (fm.when_to_use || '').length;
    assert.ok(total <= 1536,
      `skills/${skill} description+when_to_use 长度 ${total} > 1536（会被截断）`);
  }
});

test('契约 skills/* · 至少包含 using-ddt（plugin 取向 skill 必需）', () => {
  const skills = allSkills();
  assert.ok(skills.includes('using-ddt'), 'plugin 必须含 using-ddt skill');
});
