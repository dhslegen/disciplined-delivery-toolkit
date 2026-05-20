import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrailers, hasEvidenceRef, readDecisions, hasUnresolvedPending, pathTouchesProtected, hasResolvedSpecApproval } from '../../bin/lib/ddt-facts.mjs';

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
