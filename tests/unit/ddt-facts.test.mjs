import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDecisions } from '../../bin/lib/ddt-facts.mjs';

test('readDecisions 解析 jsonl，跳过空行与坏行', () => {
  const rows = readDecisions('{"status":"pending"}\n\n{bad\n{"status":"resolved","ref":"t1"}\n');
  assert.equal(rows.length, 2);
});
