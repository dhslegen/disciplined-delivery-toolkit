import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('宪法 Rationalization 表含 IL-3/IL-4/IL-5 反驳条目', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /IL-3 hook 查 decisions\.jsonl/);
  assert.match(s, /IL-4 hook 查 diff 路径与 changelog escalation/);
  assert.match(s, /IL-5 hook 校验 docs\/reviews\/\*\.json/);
});

test('宪法 IL-2 段含 commit trailer root-cause-ref 约定', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /root-cause-ref/);
});

test('宪法 IL-7 段标注由 /ddt-status 反推', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(s, /\/ddt-status/);
  assert.match(s, /IL-7/);
});

test('ddt-systematic-debugging 含 IL-2 本土化层 trailer 约定', () => {
  const s = readFileSync(path.join(root, 'skills/ddt-systematic-debugging/SKILL.md'), 'utf8');
  assert.match(s, /DDT 本土化层（IL-2 commit 约定）/);
  assert.match(s, /root-cause-ref/);
  // 原 Plan 1 降级声明仍在
  assert.match(s, /DDT 强制层声明/);
});

test('reviewer 输出规范内嵌于 charter（无外部 conventions/ 引用）', () => {
  // v1.2：docs/conventions/reviewer-output.md 已删，内容内嵌到 charter §IL-5 Reviewer 输出规范
  // 用户项目里 LLM 能直接通过 charter 读到规范，无失效引用
  const charter = readFileSync(path.join(root, 'skills/ddt-charter/SKILL.md'), 'utf8');
  assert.match(charter, /IL-5 Reviewer 输出规范/, 'charter 必须含 IL-5 Reviewer 输出规范段');
  assert.match(charter, /docs\/reviews\/<task-id>-<reviewer-role>\.json/, 'charter 必须含 reviewer 输出路径');
  assert.match(charter, /cited_evidence/, 'charter 必须含 cited_evidence 字段约束');
  // JSON Schema 仍保留供运行时校验工具用
  assert.ok(existsSync(path.join(root, 'bin/schema/review-output.schema.json')));
  const sch = JSON.parse(readFileSync(path.join(root, 'bin/schema/review-output.schema.json'), 'utf8'));
  assert.equal(sch.title, 'DDT Reviewer Output');
});
