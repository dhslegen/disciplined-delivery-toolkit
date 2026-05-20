#!/usr/bin/env node
// /ddt-status 用：从 cwd 提取事实（decisions pending、spec/plan 文件存在性）。
// 纯确定性事实镜头，不做判断/不写文件。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { readDecisions } from './lib/ddt-facts.mjs';

function pendingDecisions(jsonlText) {
  const rows = readDecisions(jsonlText);
  const resolved = new Set(
    rows.filter(d => d && d.status === 'resolved' && d.ref != null).map(d => String(d.ref))
  );
  return rows.filter(d => d && d.status === 'pending' && !resolved.has(String(d.ts)));
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  try { return readdirSync(dir).filter(f => f.endsWith('.md')); }
  catch { return []; }
}

let decisionsText = '';
try { decisionsText = readFileSync('.ddt/decisions.jsonl', 'utf8'); } catch { /* 空仓 */ }

const out = {
  pending_decisions: pendingDecisions(decisionsText),
  slice_specs: listFiles('docs/specs'),
  slice_plans: listFiles('docs/plans')
};
process.stdout.write(JSON.stringify(out));
process.exit(0);
