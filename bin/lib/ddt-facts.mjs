// DDT 确定性事实提取器。纯函数，无副作用、不调 git，可单测。
export function readDecisions(jsonlText) {
  const rows = [];
  for (const line of String(jsonlText).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch { /* 跳过坏行 */ }
  }
  return rows;
}
/** 校验 reviewer 输出对象是否符合 `docs/reviews/*.json` 约定（IL-5）。
 *  返回 {ok:boolean, reason?:string}。手工实现保零依赖。
 *  路径决策：reviewer 输出是 SSoT 衍生制品，住 docs/reviews/（git 跟踪），不在 .ddt/ transient。 */
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
