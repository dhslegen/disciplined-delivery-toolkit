import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrailers, hasEvidenceRef, readDecisions, hasUnresolvedPending, pathTouchesProtected, hasResolvedSpecApproval, hasEscalationFor, isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';
import { readFileSync as rfs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const fxRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/ddt');
const loadFx = (n) => JSON.parse(rfs(path.join(fxRoot, n), 'utf8'));

test('parseTrailers 提取 trailer 键值', () => {
  const t = parseTrailers('feat: x\n\nbody\n\nstage: build\nslice: us-3\nevidence-ref: run/1.json');
  assert.equal(t.stage, 'build');
  assert.equal(t['evidence-ref'], 'run/1.json');
});
test('parseTrailers 无 trailer 返回空对象', () => {
  assert.deepEqual(parseTrailers('feat: x\n\njust body'), {});
});
test('hasEvidenceRef 仅当非空为真', () => {
  assert.equal(hasEvidenceRef('x\n\nevidence-ref: a.json'), true);
  assert.equal(hasEvidenceRef('x\n\nstage: build'), false);
  assert.equal(hasEvidenceRef('x\n\nevidence-ref: '), false);
});
test('readDecisions 解析 jsonl，跳过空行与坏行', () => {
  const rows = readDecisions('{"status":"pending"}\n\n{bad\n{"status":"resolved","ref":"t1"}\n');
  assert.equal(rows.length, 2);
});
test('hasUnresolvedPending：pending 无对应 resolved 为真', () => {
  assert.equal(hasUnresolvedPending(readDecisions('{"status":"pending","ts":"t1"}')), true);
  assert.equal(hasUnresolvedPending(readDecisions('{"status":"pending","ts":"t1"}\n{"status":"resolved","ref":"t1"}')), false);
});
test('pathTouchesProtected：命中受保护前缀为真', () => {
  assert.equal(pathTouchesProtected(['src/a.ts','openapi/u.yaml'], ['openapi/','PRD.md']), true);
  assert.equal(pathTouchesProtected(['src/a.ts'], ['openapi/','PRD.md']), false);
});
test('hasResolvedSpecApproval：切片有 approved spec 闸门为真', () => {
  const rows = readDecisions('{"gate":"spec","slice":"us-3","status":"resolved","user_action":"approve","ref":"t1"}');
  assert.equal(hasResolvedSpecApproval(rows, 'us-3'), true);
});
test('hasResolvedSpecApproval：拒绝/挂起/异切片均为假', () => {
  const reject = readDecisions('{"gate":"spec","slice":"us-3","status":"resolved","user_action":"reject","ref":"t1"}');
  const pending = readDecisions('{"gate":"spec","slice":"us-3","status":"pending","ts":"t1"}');
  const otherSlice = readDecisions('{"gate":"spec","slice":"us-9","status":"resolved","user_action":"approve","ref":"t1"}');
  assert.equal(hasResolvedSpecApproval(reject, 'us-3'), false);
  assert.equal(hasResolvedSpecApproval(pending, 'us-3'), false);
  assert.equal(hasResolvedSpecApproval(otherSlice, 'us-3'), false);
});
test('hasEscalationFor：changelog 含 escalation 且覆盖路径为真', () => {
  const cl = '{"kind":"escalation","paths":["openapi/user.yaml"],"reason":"add field","ts":"t1"}';
  assert.equal(hasEscalationFor(cl, ['openapi/user.yaml']), true);
});
test('hasEscalationFor：changelog 无 escalation 或路径不匹配为假', () => {
  assert.equal(hasEscalationFor('', ['openapi/user.yaml']), false);
  const wrongKind = '{"kind":"amend","paths":["openapi/user.yaml"],"ts":"t1"}';
  assert.equal(hasEscalationFor(wrongKind, ['openapi/user.yaml']), false);
  const wrongPath = '{"kind":"escalation","paths":["openapi/other.yaml"],"ts":"t1"}';
  assert.equal(hasEscalationFor(wrongPath, ['openapi/user.yaml']), false);
});
test('hasEscalationFor：路径集合任一被覆盖即为真', () => {
  const cl = '{"kind":"escalation","paths":["openapi/a.yaml"],"ts":"t1"}\n{"kind":"escalation","paths":["openapi/b.yaml"],"ts":"t2"}';
  assert.equal(hasEscalationFor(cl, ['openapi/b.yaml']), true);
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
