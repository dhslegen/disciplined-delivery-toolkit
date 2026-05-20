#!/usr/bin/env node
// 强制层 hook：读 stdin 事件，用 ddt-facts 判 Iron Law，输出 {decision, reason}。
// 本计划落 IL-1；IL-6 在 Task 6 追加；IL-2..5/7 在 Plan 2。
// 测试注入 ddt_test_head 免依赖真实 git；生产路径用 git log -1。
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hasEvidenceRef, hasUnresolvedPending, readDecisions, hasResolvedSpecApproval } from '../../bin/lib/ddt-facts.mjs';

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function headMessage(ev) {
  if (typeof ev.ddt_test_head === 'string') return ev.ddt_test_head;
  try { return execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' }); } catch { return ''; }
}
function decisionsText(ev) {
  if (typeof ev.ddt_test_decisions === 'string') return ev.ddt_test_decisions;
  try { return readFileSync('.ddt/decisions.jsonl', 'utf8'); } catch { return ''; }
}
function allow() { return { decision: 'allow' }; }
function block(reason) { return { decision: 'block', reason }; }

function decide(ev) {
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
  return allow();
}

const ev = readStdin();
process.stdout.write(JSON.stringify(decide(ev)));
process.exit(0);
