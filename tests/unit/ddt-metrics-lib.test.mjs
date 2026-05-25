import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvents, aggregate } from '../../bin/lib/ddt-metrics-lib.mjs';

test('parseEvents 解析 jsonl 跳过空行与坏行', () => {
  const rows = parseEvents('{"kind":"tool","tool_name":"Edit","decision":"allow"}\n\n{bad\n{"kind":"session-end","duration_ms":1000}\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'tool');
  assert.equal(rows[1].kind, 'session-end');
});

test('aggregate：空事件返回基线零值', () => {
  const a = aggregate([]);
  assert.equal(a.total_tool_calls, 0);
  assert.equal(a.blocked_count, 0);
  assert.equal(a.auto_pass_count, 0);
  assert.equal(a.sessions, 0);
});

test('aggregate：tool 事件计数（decision allow/block 区分）', () => {
  const events = [
    { kind: 'tool', tool_name: 'Edit', decision: 'allow' },
    { kind: 'tool', tool_name: 'Edit', decision: 'block' },
    { kind: 'tool', tool_name: 'Write', decision: 'allow' },
    { kind: 'tool', tool_name: 'Write', decision: 'allow' }
  ];
  const a = aggregate(events);
  assert.equal(a.total_tool_calls, 4);
  assert.equal(a.blocked_count, 1);
  assert.equal(a.auto_pass_count, 3);
  assert.equal(a.tool_breakdown.Edit, 2);
  assert.equal(a.tool_breakdown.Write, 2);
});

test('aggregate：session 事件计数与平均时长', () => {
  const events = [
    { kind: 'session-end', duration_ms: 1000 },
    { kind: 'session-end', duration_ms: 3000 }
  ];
  const a = aggregate(events);
  assert.equal(a.sessions, 2);
  assert.equal(a.total_session_ms, 4000);
  assert.equal(a.avg_session_ms, 2000);
});
