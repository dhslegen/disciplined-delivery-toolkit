#!/usr/bin/env node
// /ddt-status 用：从 cwd 提取事实（decisions pending、spec/plan 文件存在性、git 切片 branch）。
// 纯确定性事实镜头，不做判断/不写文件。
//
// v1.1 多人协作 Tier 1：增 in_progress_slices 字段，从 git for-each-ref 反推
// "谁在做什么切片"（按 slice/<id> branch 命名约定，详见 charter）。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

// 从 git for-each-ref 输出解析切片 branches（slice/<id> 命名约定）。
// 测试可通过环境变量 DDT_TEST_GIT_BRANCHES 注入 mock 数据，避免依赖真实 git。
export function parseSliceBranches(rawOutput) {
  if (!rawOutput) return [];
  // map：slice id → {branch, is_remote, last_commit, author}
  // 同切片有 local + remote 两份时，remote 优先（remote 是团队共享真相）
  const map = new Map();
  for (const line of String(rawOutput).split('\n')) {
    if (!line.trim()) continue;
    const [ref, dateRel, author] = line.split('|');
    if (!ref) continue;
    // 匹配 slice/<id>（含 origin/slice/<id> 这类 remote 形式）
    const m = /(?:^|\/)slice\/(.+)$/.exec(ref);
    if (!m) continue;
    const slice = m[1];
    const isRemote = ref.startsWith('origin/') || (ref.includes('/slice/') && ref !== `slice/${slice}`);
    const entry = {
      slice,
      branch: ref,
      is_remote: isRemote,
      last_commit_relative: dateRel || '',
      author: author || ''
    };
    const existing = map.get(slice);
    // remote 优先；同档先到先得
    if (!existing || (isRemote && !existing.is_remote)) {
      map.set(slice, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.slice.localeCompare(b.slice));
}

function getGitBranches() {
  // 测试 hook：环境变量 mock，避免测试依赖真实 git 仓库
  if (process.env.DDT_TEST_GIT_BRANCHES != null) {
    return process.env.DDT_TEST_GIT_BRANCHES;
  }
  try {
    return execFileSync('git', [
      'for-each-ref',
      '--format=%(refname:short)|%(committerdate:relative)|%(authorname)',
      'refs/heads/',
      'refs/remotes/'
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return ''; // 无 git 或失败：空（graceful 降级）
  }
}

let decisionsText = '';
try { decisionsText = readFileSync('docs/ssot/decisions.jsonl', 'utf8'); } catch { /* 空仓 */ }

const out = {
  pending_decisions: pendingDecisions(decisionsText),
  slice_specs: listFiles('docs/specs'),
  slice_plans: listFiles('docs/plans'),
  in_progress_slices: parseSliceBranches(getGitBranches())
};
process.stdout.write(JSON.stringify(out));
process.exit(0);
