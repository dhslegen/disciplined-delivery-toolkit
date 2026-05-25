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
