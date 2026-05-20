// DDT 确定性事实提取器。纯函数，无副作用、不调 git，可单测。
export function parseTrailers(commitMessage) {
  const out = {};
  const parts = String(commitMessage).split('\n\n');
  if (parts.length < 2) return out; // 没有 body 部分，无 trailer
  
  // 取最后一个部分作为 trailer 候选
  const lastPart = parts[parts.length - 1];
  for (const line of lastPart.split('\n')) {
    const m = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/.exec(line);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}
export function hasEvidenceRef(commitMessage) {
  const t = parseTrailers(commitMessage);
  return typeof t['evidence-ref'] === 'string' && t['evidence-ref'].length > 0;
}
export function readDecisions(jsonlText) {
  const rows = [];
  for (const line of String(jsonlText).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch { /* 跳过坏行 */ }
  }
  return rows;
}
export function hasUnresolvedPending(decisions) {
  const resolved = new Set(
    decisions.filter(d => d && d.status === 'resolved' && d.ref != null).map(d => String(d.ref))
  );
  return decisions.some(d => d && d.status === 'pending' && !resolved.has(String(d.ts)));
}
export function pathTouchesProtected(changedPaths, protectedPrefixes) {
  return changedPaths.some(p => protectedPrefixes.some(pre => String(p).startsWith(pre)));
}
/** 切片是否已有 spec 闸门"resolved + approve"决策（IL-3）。 */
export function hasResolvedSpecApproval(decisions, slice) {
  return decisions.some(d =>
    d && d.gate === 'spec' && d.slice === slice
      && d.status === 'resolved' && d.user_action === 'approve'
  );
}
/** changelog 是否含覆盖给定 paths 的 escalation 记录（IL-4）。
 *  接受原始 jsonl 文本或已解析行数组。 */
export function hasEscalationFor(changelogJsonlOrRows, paths) {
  const rows = Array.isArray(changelogJsonlOrRows)
    ? changelogJsonlOrRows
    : readDecisions(changelogJsonlOrRows); // 同 jsonl 解析逻辑
  const want = new Set(paths.map(String));
  return rows.some(r =>
    r && r.kind === 'escalation' && Array.isArray(r.paths) &&
    r.paths.some(p => want.has(String(p)))
  );
}
/** 校验 reviewer 输出对象是否符合 `.ddt/reviews/*.json` 约定（IL-5）。
 *  返回 {ok:boolean, reason?:string}。手工实现保零依赖。 */
export function isValidReviewOutput(obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, reason: '非对象' };
  for (const k of ['task_id', 'reviewer_role', 'verdict', 'ts']) {
    if (typeof obj[k] !== 'string' || obj[k].length === 0) {
      return { ok: false, reason: `缺/空必填字段 ${k}` };
    }
  }
  if (!['spec', 'quality', 'final'].includes(obj.reviewer_role)) {
    return { ok: false, reason: '非法 reviewer_role' };
  }
  if (!['PASS', 'FAIL'].includes(obj.verdict)) {
    return { ok: false, reason: '非法 verdict' };
  }
  if (obj.verdict === 'PASS') {
    if (!Array.isArray(obj.cited_evidence) || obj.cited_evidence.length === 0) {
      return { ok: false, reason: 'PASS 须含非空 cited_evidence 数组（IL-5 反乐观）' };
    }
    if (!obj.cited_evidence.every(e => typeof e === 'string' && e.length > 0)) {
      return { ok: false, reason: 'cited_evidence 每项须为非空字符串' };
    }
  }
  return { ok: true };
}
