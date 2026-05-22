import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDecisions, isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';
import { readFileSync as rfs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const fxRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/ddt');
const loadFx = (n) => JSON.parse(rfs(path.join(fxRoot, n), 'utf8'));

test('readDecisions 解析 jsonl，跳过空行与坏行', () => {
  const rows = readDecisions('{"status":"pending"}\n\n{bad\n{"status":"resolved","ref":"t1"}\n');
  assert.equal(rows.length, 2);
});

test('isValidReviewOutput：合规 PASS 含非空 cited_evidence 为真', () => {
  const r = isValidReviewOutput(loadFx('review-output-valid.json'));
  assert.equal(r.ok, true);
});
test('isValidReviewOutput：PASS 但 cited_evidence 为空数组为假', () => {
  const r = isValidReviewOutput(loadFx('review-output-pass-no-cited.json'));
  assert.equal(r.ok, false);
  assert.match(r.reason, /cited_evidence/);
});
test('isValidReviewOutput：FAIL 无须 cited_evidence 为真', () => {
  const r = isValidReviewOutput(loadFx('review-output-fail-ok.json'));
  assert.equal(r.ok, true);
});
test('isValidReviewOutput：缺必填字段为假', () => {
  assert.equal(isValidReviewOutput({}).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1' }).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'spec', verdict: 'PASS' }).ok, false);
});
test('isValidReviewOutput：非法 verdict / reviewer_role 为假', () => {
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'bad', verdict: 'PASS', cited_evidence: ['x'], ts: '2026-05-20T00:00:00Z' }).ok, false);
  assert.equal(isValidReviewOutput({ task_id: 'T1', reviewer_role: 'spec', verdict: 'MAYBE', cited_evidence: ['x'], ts: '2026-05-20T00:00:00Z' }).ok, false);
});
