#!/usr/bin/env node
// OpenAPI 契约 lint。JSON：完整 schema 校验；YAML：完整性扫描（regex 找必填段）。
// 零依赖（不引 yaml lib，限本 v1.0 起步够用——Plan 5+ 可升级真 yaml 解析）。
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  process.stderr.write('[ddt-contract-lint] 用法：node ddt-contract-lint.mjs <openapi.json|.yaml>\n');
  process.exit(2);
}
if (!existsSync(file)) {
  process.stderr.write(`[ddt-contract-lint] 文件不存在：${file}\n`);
  process.exit(2);
}
const raw = readFileSync(file, 'utf8');
const isYaml = /\.ya?ml$/i.test(file);
const errors = [];

if (isYaml) {
  // YAML 完整性扫描：grep 必填段在第 0 列出现
  if (!/^openapi:\s*\S/m.test(raw)) errors.push('YAML 缺 openapi 字段');
  if (!/^info:/m.test(raw)) errors.push('YAML 缺 info 段');
  if (!/^\s+title:\s*\S/m.test(raw)) errors.push('YAML 缺 info.title');
  if (!/^\s+version:\s*\S/m.test(raw)) errors.push('YAML 缺 info.version');
  if (!/^paths:/m.test(raw)) errors.push('YAML 缺 paths 段');
} else {
  let obj;
  try { obj = JSON.parse(raw); }
  catch { errors.push('非合法 JSON'); }
  if (obj && typeof obj === 'object') {
    if (typeof obj.openapi !== 'string') errors.push('缺 openapi 字段');
    if (!obj.info || typeof obj.info !== 'object') errors.push('缺 info 段');
    else {
      if (typeof obj.info.title !== 'string') errors.push('缺 info.title');
      if (typeof obj.info.version !== 'string') errors.push('缺 info.version');
    }
    if (!obj.paths || typeof obj.paths !== 'object') errors.push('缺 paths 段');
  }
}

if (errors.length) {
  process.stderr.write('[ddt-contract-lint] FAIL:\n  - ' + errors.join('\n  - ') + '\n');
  process.exit(1);
}
process.stdout.write(`[ddt-contract-lint] PASS: ${file}\n`);
process.exit(0);
