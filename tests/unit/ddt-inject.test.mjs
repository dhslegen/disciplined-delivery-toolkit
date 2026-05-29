import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-inject.mjs');

test('注入 SessionStart additionalContext 含 using-ddt 内容', () => {
  const out = execFileSync('node', [script], { input: '{}', cwd: root, encoding: 'utf8' });
  const json = JSON.parse(out);
  assert.equal(json.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(json.hookSpecificOutput.additionalContext, /四项治理增强/);
  assert.match(json.hookSpecificOutput.additionalContext, /三种入口/);
  assert.match(json.hookSpecificOutput.additionalContext, /<EXTREMELY_IMPORTANT>/);
});
