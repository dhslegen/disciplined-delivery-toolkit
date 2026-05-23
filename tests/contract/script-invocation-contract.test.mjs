// 脚本调用机制契约。
//
// DDT 的 bin 脚本靠「shebang + 可执行位 + Claude Code 自动把 plugin bin/ 注入 PATH」三件套，
// 在用户项目 cwd 里以**裸名**直接执行（cwd 无关）。这是唯一可靠机制：
//   - `CLAUDE_PLUGIN_ROOT` 只在 hooks.json 被替换，**不导出到 Bash 工具环境**；
//   - 用户项目 cwd 里没有 `bin/`，相对路径 `bin/X.mjs` / `node bin/X.mjs` 必断；
//   - `node X.mjs` 也断（node 不搜 PATH 找脚本参数，只找 cwd）。
//
// 本测试锁死该机制，防止未来 skill/command 编辑回退到会断的写法。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('契约 bin/*.mjs · 每个都有 shebang + 可执行位（裸名可跑的前提）', () => {
  const binDir = path.join(root, 'bin');
  const scripts = readdirSync(binDir).filter(f => f.endsWith('.mjs'));
  assert.ok(scripts.length > 0, 'bin/ 应有 .mjs 脚本');
  for (const s of scripts) {
    const fp = path.join(binDir, s);
    const first = readFileSync(fp, 'utf8').split('\n', 1)[0];
    assert.ok(first.startsWith('#!'), `bin/${s} 首行须是 shebang（裸名执行靠它）`);
    assert.ok((statSync(fp).mode & 0o111) !== 0, `bin/${s} 须有可执行位（chmod +x）`);
  }
});

// 会在用户项目 cwd 里断裂的调用写法——skill/command 文档一律不许出现。
const BROKEN = [
  { re: /node\s+bin\//, why: 'node bin/X.mjs（相对路径，用户 cwd 无 bin/）' },
  { re: /bin\/ddt-[a-z-]+\.mjs/, why: 'bin/ddt-X.mjs（相对路径，用户 cwd 无 bin/）' },
  { re: /node\s+ddt-[a-z-]+\.mjs/, why: 'node ddt-X.mjs（node 不搜 PATH，只找 cwd）' },
  { re: /CLAUDE_PLUGIN_ROOT[^\n]*\/bin/, why: '用 ${CLAUDE_PLUGIN_ROOT} 拼 bin 路径（该变量不在 Bash 环境）' },
];

function docFiles() {
  const files = [];
  const skillsDir = path.join(root, 'skills');
  for (const d of readdirSync(skillsDir)) {
    const fp = path.join(skillsDir, d, 'SKILL.md');
    try { statSync(fp); files.push(fp); } catch { /* 无 SKILL.md 的目录跳过 */ }
  }
  const cmdDir = path.join(root, 'commands');
  for (const f of readdirSync(cmdDir)) {
    if (f.endsWith('.md')) files.push(path.join(cmdDir, f));
  }
  return files;
}

test('契约 skill/command · 无断裂的 bin 调用写法（只许裸名 ddt-X.mjs）', () => {
  for (const fp of docFiles()) {
    const text = readFileSync(fp, 'utf8');
    for (const { re, why } of BROKEN) {
      assert.doesNotMatch(text, re,
        `${path.relative(root, fp)} 含断裂调用：${why}——应改为裸名直接执行`);
    }
  }
});
