#!/usr/bin/env node
// preflight：校验 DDT 强制层/宪法 hook 已注册。未注册 exit 3 + 修复指引。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.DDT_PLUGIN_ROOT || path.resolve(here, '..');
const REQUIRED = ['ddt:charter-inject', 'ddt:enforce-pre', 'ddt:enforce-stop'];

let hooksJson;
try {
  hooksJson = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
} catch {
  process.stderr.write('[DDT preflight] hooks/hooks.json 不可读；强制层未注册，DDT 拒绝以演示级静默启动。\n');
  process.exit(3);
}
const ids = new Set();
for (const arr of Object.values(hooksJson.hooks || {})) {
  for (const entry of arr || []) if (entry && entry.id) ids.add(entry.id);
}
const missing = REQUIRED.filter(id => !ids.has(id));
if (missing.length) {
  process.stderr.write(
    '[DDT preflight] 强制层 hook 未注册：' + missing.join(', ') + '。\n' +
    '修复：确认 hooks/hooks.json 含上述 id 条目并重启会话。修复前 DDT 不以演示级静默运行。\n'
  );
  process.exit(3);
}
process.stdout.write('[DDT preflight] 强制层 hook 已注册。\n');
process.exit(0);
