#!/usr/bin/env node
// 追加一条 JSON 到 .ddt/decisions.jsonl。stdin 读对象，自动补 ts。
// SSoT 路径：SSoT 真相住 .ddt/，与 transient state/metrics 同目录但入 git（白名单）。
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch {}
let obj;
try { obj = JSON.parse(raw); }
catch { process.stderr.write('[ddt-decisions-append] stdin 非合法 JSON\n'); process.exit(2); }
if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  process.stderr.write('[ddt-decisions-append] stdin 须为 JSON 对象\n'); process.exit(2);
}
if (!obj.ts) obj.ts = new Date().toISOString();

mkdirSync('.ddt', { recursive: true });
appendFileSync('.ddt/decisions.jsonl', JSON.stringify(obj) + '\n', 'utf8');
process.exit(0);
