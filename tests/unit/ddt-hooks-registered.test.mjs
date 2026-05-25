import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hj = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
function ids() {
  const s = new Set();
  for (const arr of Object.values(hj.hooks || {})) for (const e of arr || []) if (e && e.id) s.add(e.id);
  return s;
}
test('三个 DDT hook 已注册（无强制层：注入 + 被动度量）', () => {
  const s = ids();
  assert.ok(s.has('ddt:inject'));
  assert.ok(s.has('ddt:metrics-post'));
  assert.ok(s.has('ddt:metrics-end'));
  assert.ok(!s.has('ddt:enforce-pre'), 'ddt:enforce-pre 已拔除（IL-5 强制层移除）');
  assert.ok(!s.has('ddt:enforce-stop'), 'ddt:enforce-stop 应已删除');
  assert.equal(s.size, 3, '应恰好有 3 个 hook id');
});
