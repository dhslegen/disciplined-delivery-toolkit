#!/usr/bin/env node
// preflight：校验 DDT hook 已注册（using-ddt 注入 + 被动度量）。未注册 exit 3 + 修复指引。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.DDT_PLUGIN_ROOT || path.resolve(here, '..');
// 与 hooks/hooks.json 注册的 3 个 hook id 一致；与 bin/ddt-doctor.mjs REQUIRED_HOOKS 一致。
// DDT 无强制层/拦截 hook——这些都是注入与被动度量，不改 superpowers 原生体验。
const REQUIRED = ['ddt:inject', 'ddt:metrics-post', 'ddt:metrics-end'];

let hooksJson;
try {
  hooksJson = JSON.parse(readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
} catch {
  process.stderr.write('[DDT preflight] hooks/hooks.json 不可读；DDT hook 未注册。\n');
  process.exit(3);
}
const ids = new Set();
for (const arr of Object.values(hooksJson.hooks || {})) {
  for (const entry of arr || []) if (entry && entry.id) ids.add(entry.id);
}
const missing = REQUIRED.filter(id => !ids.has(id));
if (missing.length) {
  process.stderr.write(
    '[DDT preflight] DDT hook 未注册：' + missing.join(', ') + '。\n' +
    '修复：确认 hooks/hooks.json 含上述 id 条目并重启会话。\n'
  );
  process.exit(3);
}
process.stdout.write('[DDT preflight] DDT hook 已注册。\n');
process.exit(0);
