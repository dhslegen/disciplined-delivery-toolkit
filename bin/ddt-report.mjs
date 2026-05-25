#!/usr/bin/env node
// ddt-deliver 的 ROI 报告生成器。读 .ddt/metrics + .ddt/decisions.jsonl → docs/efficiency-report.md
// SSoT 路径：decisions/changelog 住 .ddt/（入 git 外科白名单）；metrics/state 仍 transient。
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEvents, aggregate } from './lib/ddt-metrics-lib.mjs';

function readAllMetrics() {
  const dir = '.ddt/metrics';
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.jsonl'))
    .flatMap(f => parseEvents(readFileSync(`${dir}/${f}`, 'utf8')));
}

function readDecisions() {
  try {
    return readFileSync('.ddt/decisions.jsonl', 'utf8')
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

const events = readAllMetrics();
const agg = aggregate(events);
const decisions = readDecisions();
const waivers = decisions.filter(d => d && d.user_action === 'accept-drift');
const passRate = agg.total_tool_calls > 0
  ? ((agg.auto_pass_count / agg.total_tool_calls) * 100).toFixed(1) + '%'
  : 'n/a';

const toolBreakdown = Object.entries(agg.tool_breakdown)
  .map(([t, n]) => `  - ${t}：${n} 次`).join('\n') || '  - 无工具调用';

const waiversSection = waivers.length === 0
  ? '本交付无降低保障级 waiver。'
  : '本交付含降低保障级 waiver 清单：\n' +
    waivers.map(w => `- [${w.ts}] ${w.note || '(无理由)'} — 由 ${w.owner_role || '(未署名)'}`).join('\n');

const noDataNote = events.length === 0 && decisions.length === 0
  ? '\n> **说明**：本仓尚未积累度量数据；首次跑通后报告将含真实指标。无历史基线不可比。\n'
  : '';

const md = `# AI 效能 ROI 报告

> 生成时间：${new Date().toISOString()}
> 数据源：\`.ddt/metrics/*.jsonl\`（hook 被动采集 transient）+ \`.ddt/decisions.jsonl\`（人工决策 SSoT）
${noDataNote}

## 项目周期

- 会话数：${agg.sessions}
- 总会话时长：${(agg.total_session_ms / 1000).toFixed(1)}s
- 平均会话时长：${(agg.avg_session_ms / 1000).toFixed(1)}s

## 工具调用与闸门

- 工具调用：${agg.total_tool_calls} 次
- 通过：${agg.auto_pass_count} 次（${passRate}）
- 拦截：${agg.blocked_count} 次

工具分布：
${toolBreakdown}

## 降低保障级交付（waiver 汇总）

${waiversSection}

## 与基线对比

> 本字段需 baseline 数据；当前仓无历史基线，显示"无历史基线不可比"。后续可扩展基线导入工具。

---

*由 \`bin/ddt-report.mjs\` 生成。指标全部来自 hook 被动埋点与 decisions.jsonl，agent 禁自夸。*
`;

mkdirSync('docs', { recursive: true });
writeFileSync('docs/efficiency-report.md', md, 'utf8');
process.stdout.write('[ddt-report] wrote docs/efficiency-report.md\n');
process.exit(0);
