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
