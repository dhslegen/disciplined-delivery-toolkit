// DDT 度量纯函数库：parse + aggregate metrics 事件。零依赖、纯函数、可单测。

export function parseEvents(jsonlText) {
  const rows = [];
  for (const line of String(jsonlText).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch { /* 跳过坏行 */ }
  }
  return rows;
}

export function aggregate(events) {
  const out = {
    total_tool_calls: 0,
    blocked_count: 0,
    auto_pass_count: 0,
    tool_breakdown: {},
    il_block_counts: {},
    sessions: 0,
    total_session_ms: 0,
    avg_session_ms: 0
  };
  for (const e of events) {
    if (!e || typeof e !== 'object') continue;
    if (e.kind === 'tool') {
      out.total_tool_calls++;
      if (e.decision === 'block') {
        out.blocked_count++;
        if (typeof e.reason === 'string') {
          const m = /^(IL-\d+)/.exec(e.reason);
          if (m) out.il_block_counts[m[1]] = (out.il_block_counts[m[1]] || 0) + 1;
        }
      } else {
        out.auto_pass_count++;
      }
      if (typeof e.tool_name === 'string') {
        out.tool_breakdown[e.tool_name] = (out.tool_breakdown[e.tool_name] || 0) + 1;
      }
    } else if (e.kind === 'session-end') {
      out.sessions++;
      if (typeof e.duration_ms === 'number') out.total_session_ms += e.duration_ms;
    }
  }
  out.avg_session_ms = out.sessions > 0 ? Math.round(out.total_session_ms / out.sessions) : 0;
  return out;
}
