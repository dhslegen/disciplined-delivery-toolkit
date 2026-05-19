import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'hooks/handlers/ddt-charter-inject.mjs');

test('注入 SessionStart additionalContext 含宪法', () => {
  const out = execFileSync('node', [script], { input: '{}', cwd: root, encoding: 'utf8' });
  const json = JSON.parse(out);
  assert.equal(json.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(json.hookSpecificOutput.additionalContext, /DDT 宪法/);
  assert.match(json.hookSpecificOutput.additionalContext, /IL-1 无新鲜执行证据不得声明完成/);
  assert.match(json.hookSpecificOutput.additionalContext, /<EXTREMELY_IMPORTANT>/);
});
