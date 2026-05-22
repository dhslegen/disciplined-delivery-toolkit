#!/usr/bin/env node
// 强制层 hook（L2 唯一一颗牙）：仅 IL-5——reviewer 写 docs/reviews/*.json 时，
// PASS 必须带 cited_evidence，否则 deny。其余 Iron Law 已回归 vendored skill 行为承载。
// 仅注册于 PreToolUse。
import { readFileSync } from 'node:fs';
import { isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function allow() { return { decision: 'allow' }; }
function block(reason) { return { decision: 'block', reason }; }

// 转 Claude Code 协议：PreToolUse 用 hookSpecificOutput.permissionDecision。
export function formatOutput(ev, decided) {
  const eventName = ev && typeof ev.hook_event_name === 'string' ? ev.hook_event_name : '';
  if (eventName === 'PreToolUse') {
    if (decided.decision === 'block') {
      return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: decided.reason } };
    }
    return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
  }
  // 防御性兜底：本 hook 仅注册于 PreToolUse，此分支理论不可达
  if (decided.decision === 'block') return { decision: 'block', reason: decided.reason };
  return {};
}

export function decide(ev) {
  if (ev.hook_event_name === 'PreToolUse' && ['Edit','Write','MultiEdit','NotebookEdit'].includes(ev.tool_name)) {
    const fp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? ev.tool_input.file_path : '';
    if (/^docs\/reviews\/.+\.json$/.test(fp)) {
      const raw = ev.tool_input && typeof ev.tool_input.content === 'string' ? ev.tool_input.content : '';
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { return block(`IL-5 违规：reviewer 输出 ${fp} 非合法 JSON。`); }
      const v = isValidReviewOutput(parsed);
      if (!v.ok) return block(`IL-5 违规：reviewer 输出 ${fp} 不合规——${v.reason}。无引证不得 PASS。`);
    }
  }
  return allow();
}

const ev = readStdin();
const decided = decide(ev);
process.stdout.write(JSON.stringify(formatOutput(ev, decided)));
process.exit(0);
