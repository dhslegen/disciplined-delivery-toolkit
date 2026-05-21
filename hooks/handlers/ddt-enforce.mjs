#!/usr/bin/env node
// 强制层 hook：读 stdin 事件，用 ddt-facts 判 Iron Law，输出 {decision, reason}。
// 本计划落 IL-1；IL-6 在 Task 6 追加；IL-2..5/7 在 Plan 2。
// 测试注入 ddt_test_head 免依赖真实 git；生产路径用 git log -1。
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hasEvidenceRef, hasUnresolvedPending, readDecisions, hasResolvedSpecApproval, hasEscalationFor, pathTouchesProtected, isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function readStateFile(ev) {
  if (typeof ev.ddt_test_state === 'string') {
    try { return JSON.parse(ev.ddt_test_state); } catch { return null; }
  }
  try {
    const raw = readFileSync('.ddt/state/current.json', 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}
function mergeStateFallback(ev) {
  // stdin 字段优先，state 文件兜底
  if (typeof ev.ddt_intent === 'string' && ev.ddt_intent.length > 0) return ev;
  const st = readStateFile(ev);
  if (!st || typeof st !== 'object') return ev;
  const merged = { ...ev };
  if (typeof st.ddt_intent === 'string') merged.ddt_intent = st.ddt_intent;
  if (typeof st.ddt_slice === 'string' && typeof ev.ddt_slice !== 'string') merged.ddt_slice = st.ddt_slice;
  return merged;
}
function headMessage(ev) {
  if (typeof ev.ddt_test_head === 'string') return ev.ddt_test_head;
  try { return execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' }); } catch { return ''; }
}
function decisionsText(ev) {
  if (typeof ev.ddt_test_decisions === 'string') return ev.ddt_test_decisions;
  // SSoT 路径决策（v1.1）：framework-recommended SSoT 住 docs/ssot/；.ddt/ 仅 transient
  try { return readFileSync('docs/ssot/decisions.jsonl', 'utf8'); } catch { return ''; }
}
function changelogText(ev) {
  if (typeof ev.ddt_test_changelog === 'string') return ev.ddt_test_changelog;
  try { return readFileSync('docs/ssot/changelog.jsonl', 'utf8'); } catch { return ''; }
}
// 内部决定结构（便于 decide() 单元可读 + 测试），不是 Claude Code wire format。
// wire format 由 formatOutput(ev, decided) 按 hook_event_name 适配输出。
function allow() { return { decision: 'allow' }; }
function block(reason) { return { decision: 'block', reason }; }

// 把内部 decided 转 Claude Code 协议合法输出。
// 协议（2026 起）：
//   - PreToolUse：用 hookSpecificOutput.permissionDecision = "allow"|"deny"|"ask"|"defer"，
//     reason 走 hookSpecificOutput.permissionDecisionReason。顶层 decision 字段无效。
//   - Stop / PostToolUse / UserPromptSubmit / SubagentStop：顶层 decision 字段唯一合法值 "block"，
//     省略表示 allow。reason 走顶层 reason。
//   - 其他事件（SessionStart/SessionEnd）：不支持 decision；本 handler 不应被注册到这些事件。
// 详见：https://code.claude.com/docs/en/hooks
export function formatOutput(ev, decided) {
  const eventName = ev && typeof ev.hook_event_name === 'string' ? ev.hook_event_name : '';
  if (eventName === 'PreToolUse') {
    if (decided.decision === 'block') {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: decided.reason
        }
      };
    }
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow'
      }
    };
  }
  // Stop / PostToolUse / UserPromptSubmit / SubagentStop / PreCompact 等顶层 decision 事件
  if (decided.decision === 'block') {
    return { decision: 'block', reason: decided.reason };
  }
  // allow = 省略 decision（空对象即可，Claude Code 默认放行）
  return {};
}

export function decide(ev) {
  if (ev.ddt_intent === 'claim-complete' && !hasEvidenceRef(headMessage(ev))) {
    return block('IL-1 违规：声明完成但 git HEAD 无 evidence-ref trailer。需先产新鲜执行证据并 commit 带 evidence-ref 方可声明完成。');
  }
  if (ev.ddt_intent === 'enter-deliver' && hasUnresolvedPending(readDecisions(decisionsText(ev)))) {
    return block('IL-6 违规：存在未 resolved 的 pending 闸门/漂移，禁止进入交付站出包。先 resolve 全部 pending 或显式 accept-drift 署理由。');
  }
  if ((ev.ddt_intent === 'enter-plan' || ev.ddt_intent === 'enter-impl') && typeof ev.ddt_slice === 'string') {
    if (!hasResolvedSpecApproval(readDecisions(decisionsText(ev)), ev.ddt_slice)) {
      return block(`IL-3 违规：切片 ${ev.ddt_slice} 无 approved spec 决策（gate=spec & status=resolved & user_action=approve），禁止进 ${ev.ddt_intent === 'enter-plan' ? 'plan' : 'implement'}。先走 spec 闸门批准。`);
    }
  }
  if (ev.ddt_intent === 'build-edit' && ['Edit','Write','MultiEdit','NotebookEdit'].includes(ev.tool_name)) {
    let fp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? ev.tool_input.file_path : '';
    if (fp.startsWith('./')) fp = fp.slice(2); // 剥 ./ 前缀
    const fpLower = fp.toLowerCase();
    // SSoT 路径硬清单（v1.1）：与 charter §SSoT 路径地图一一对应
    //   docs/ssot/prd.md       —— PRD（SSoT 三件之一）
    //   docs/ssot/openapi/     —— 契约（SSoT 铁律链）
    //   docs/specs/            —— 切片 spec（衍生设计，仍属 SSoT 铁律链下层不私改）
    //   docs/plans/            —— 切片 plan（同上）
    // decisions.jsonl / changelog.jsonl 走 append-only 专用 bin，不直接 Edit/Write，不在此清单
    const PROTECTED = ['docs/ssot/prd.md', 'docs/ssot/openapi/', 'docs/specs/', 'docs/plans/'];
    if (fp && PROTECTED.some(pre => fpLower.startsWith(pre))) {
      const tp = [fp];
      if (!hasEscalationFor(changelogText(ev), tp)) {
        return block(`IL-4 违规：build 上下文试图修改受保护路径 ${tp.join(',')}（属 PRD/契约/spec/plan SSoT），且 docs/ssot/changelog.jsonl 无对应 escalation 记录。下层不得私改上层 SSoT——先写 escalation 走变更门。`);
      }
    }
  }
  if (ev.hook_event_name === 'PreToolUse' && ['Edit','Write','MultiEdit','NotebookEdit'].includes(ev.tool_name)) {
    const fp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? ev.tool_input.file_path : '';
    // IL-5 reviewer 输出路径（v1.1）：reviewer 是 SSoT 衍生制品，住 docs/reviews/（git 跟踪），不在 .ddt/ transient
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
const evMerged = mergeStateFallback(ev);
const decided = decide(evMerged);
process.stdout.write(JSON.stringify(formatOutput(evMerged, decided)));
process.exit(0);
