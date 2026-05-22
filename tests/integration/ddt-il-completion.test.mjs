import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('using-ddt 含 IL-5 reviewer 输出规范（唯一硬骨头）', () => {
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /cited_evidence/, 'using-ddt 必须含 cited_evidence 约束');
  assert.match(s, /verdict.*PASS|PASS.*verdict/, 'using-ddt 必须含 verdict=PASS 约束');
  assert.match(s, /docs\/reviews/, 'using-ddt 必须含 reviewer 输出路径');
});

test('using-ddt 含 /ddt-status 反推引用', () => {
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /\/ddt-status/, 'using-ddt 必须引用 /ddt-status');
});

test('using-ddt 含 ddt-systematic-debugging 原则引用', () => {
  const s = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(s, /ddt-systematic-debugging/, 'using-ddt 必须引用 ddt-systematic-debugging');
});

test('reviewer 输出规范：using-ddt 含 cited_evidence 字段约束 + JSON Schema 仍就位', () => {
  // reviewer 规范通过 using-ddt 传达，JSON Schema 用于运行时校验工具
  const usingDdt = readFileSync(path.join(root, 'skills/using-ddt/SKILL.md'), 'utf8');
  assert.match(usingDdt, /cited_evidence/, 'using-ddt 必须含 cited_evidence 字段约束');
  assert.match(usingDdt, /docs\/reviews\/<task-id>-<role>\.json|docs\/reviews\/.*json/, 'using-ddt 必须含 reviewer 输出路径');
  // JSON Schema 仍保留供运行时校验工具用
  assert.ok(existsSync(path.join(root, 'bin/schema/review-output.schema.json')));
  const sch = JSON.parse(readFileSync(path.join(root, 'bin/schema/review-output.schema.json'), 'utf8'));
  assert.equal(sch.title, 'DDT Reviewer Output');
});

