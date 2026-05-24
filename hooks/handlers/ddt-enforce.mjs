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
    // Claude Code 的 Write/Edit 工具按协议传【绝对路径】（/Users/.../docs/reviews/x.json），
    // 极少数情况才是相对路径。故必须用 (^|/) 同时匹配「相对开头」与「绝对路径中的 /docs/reviews/ 段」，
    // 否则 ^docs/reviews/ 永不匹配绝对路径 → IL-5 恒放行（曾发生：冒烟测试逮到的真 bug）。
    if (/(^|\/)docs\/reviews\/.+\.json$/.test(fp)) {
      // reviewer 输出必须用 Write 整份写入——hook 只能校验完整 content。
      // Edit/MultiEdit/NotebookEdit 是增量改，tool_input 无完整 content（Edit 是 old/new_string、
      // MultiEdit 是 edits[]、NotebookEdit 是 new_source）→ 强行 JSON.parse 会误报「非合法 JSON」，
      // 且增量结果无法可靠校验。故一律要求 Write 整份提交（曾发生：冒烟测试逮到的 Edit 误报 bug）。
      if (ev.tool_name !== 'Write') {
        return block(`IL-5：reviewer 输出 ${fp} 必须用 Write 整份写入，不能用 ${ev.tool_name} 增量改（hook 只能校验完整 content，无法可靠校验增量结果）。`);
      }
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
