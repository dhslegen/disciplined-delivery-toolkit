#!/usr/bin/env node
// DDT 度量被动埋点 hook。注册到 PostToolUse + SessionEnd。
// 纯被动：只读 hook stdin 真实字段，不调 LLM、不读 agent 自报。
// 坏 stdin 安全 exit 0 不写文件（不阻断会话）。
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let ev = {};
try { ev = JSON.parse(raw); } catch { process.exit(0); }
if (!ev || typeof ev !== 'object') process.exit(0);

const ts = new Date().toISOString();
const dateKey = ts.slice(0, 10);

let row = null;
if (ev.hook_event_name === 'PostToolUse') {
  row = { kind: 'tool', ts, tool_name: typeof ev.tool_name === 'string' ? ev.tool_name : null };
  if (ev.tool_response && typeof ev.tool_response === 'object') {
    if (typeof ev.tool_response.decision === 'string') row.decision = ev.tool_response.decision;
    if (typeof ev.tool_response.reason === 'string') row.reason = ev.tool_response.reason;
  }
} else if (ev.hook_event_name === 'SessionEnd') {
  row = { kind: 'session-end', ts };
  if (typeof ev.session_id === 'string') row.session_id = ev.session_id;
  if (typeof ev.duration_ms === 'number') row.duration_ms = ev.duration_ms;
}

if (row) {
  mkdirSync('.ddt/metrics', { recursive: true });
  appendFileSync(`.ddt/metrics/${dateKey}.jsonl`, JSON.stringify(row) + '\n', 'utf8');
}
process.exit(0);
