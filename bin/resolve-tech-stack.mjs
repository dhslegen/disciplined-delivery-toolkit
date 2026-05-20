#!/usr/bin/env node
// resolve-tech-stack：单点写入 .ddt/tech-stack.json。已存在则拒绝（spec §4 单点写约束）。
// stdin 接收 {frontend:{type}, backend:{type}, ai_design?:boolean} JSON。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let obj;
try { obj = JSON.parse(raw); }
catch { process.stderr.write('[resolve-tech-stack] stdin 非合法 JSON\n'); process.exit(2); }

if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  process.stderr.write('[resolve-tech-stack] stdin 须为 JSON 对象\n'); process.exit(2);
}
if (!obj.frontend || typeof obj.frontend.type !== 'string') {
  process.stderr.write('[resolve-tech-stack] 缺必填字段 frontend.type\n'); process.exit(2);
}
if (!obj.backend || typeof obj.backend.type !== 'string') {
  process.stderr.write('[resolve-tech-stack] 缺必填字段 backend.type\n'); process.exit(2);
}
if (existsSync('.ddt/tech-stack.json')) {
  process.stderr.write('[resolve-tech-stack] .ddt/tech-stack.json 已存在；本工具是单点写入（spec §4），拒绝二次写入\n');
  process.exit(3);
}

obj.resolved_at = new Date().toISOString();
mkdirSync('.ddt', { recursive: true });
writeFileSync('.ddt/tech-stack.json', JSON.stringify(obj, null, 2), 'utf8');
process.stdout.write('[resolve-tech-stack] wrote .ddt/tech-stack.json\n');
process.exit(0);
