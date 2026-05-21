#!/usr/bin/env node
// 追加一条 JSON 到 docs/ssot/decisions.jsonl。stdin 读对象，自动补 ts。
// SSoT 路径决策（v1.1）：framework-recommended SSoT 真相住 docs/ssot/，与 .ddt/ transient 分离。
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

mkdirSync('docs/ssot', { recursive: true });
appendFileSync('docs/ssot/decisions.jsonl', JSON.stringify(obj) + '\n', 'utf8');
process.exit(0);
