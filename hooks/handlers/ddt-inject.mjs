#!/usr/bin/env node
// SessionStart hook：读 using-ddt 取向注入会话首条 prompt。零依赖。
// 找不到 skill 文件时静默退出 0（不阻断会话，符合 v0/v1 并存迁移期）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const charterPath = path.resolve(here, '../../skills/using-ddt/SKILL.md');

let charter;
try {
  charter = readFileSync(charterPath, 'utf8');
} catch {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
  process.exit(0);
}
const wrapped = '<EXTREMELY_IMPORTANT>\n' + charter + '\n</EXTREMELY_IMPORTANT>';
process.stdout.write(JSON.stringify({
  continue: true,
  suppressOutput: true,
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: wrapped }
}));
process.exit(0);
