// Manifest 描述事实契约。
//
// .claude-plugin/plugin.json 与 marketplace.json 的 description 是面向用户/市场的活表面，
// 但它们曾长期游离在所有扫描之外（5 站固定链 / subagent 三角 / Iron Law 文件事实强制 /
// 唯一真相源 等旧架构陈述一直残留）。本测试把 manifest 描述纳入"无旧概念"守卫，防回退。
//
// 当前权威心智模型：四项治理增强 + 三种入口 + 兑现守恒 Checkpoint。无强制层、无拦截 hook，纪律靠 skill 被 invoke（同 superpowers）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

// 收集所有 manifest 里的 description 字符串（带来源标签便于报错定位）。
function manifestDescriptions() {
  const out = [];
  const plugin = readJson('.claude-plugin/plugin.json');
  if (plugin.description) out.push(['plugin.json:description', plugin.description]);

  const mkt = readJson('.claude-plugin/marketplace.json');
  if (mkt.metadata?.description) out.push(['marketplace.json:metadata.description', mkt.metadata.description]);
  for (const p of mkt.plugins ?? []) {
    if (p.description) out.push([`marketplace.json:plugins[${p.name}].description`, p.description]);
  }
  return out;
}

// 已废弃的旧架构概念 / 已删名字 / 旧路径——manifest 描述里出现即回退。
const STALE = [
  { re: /5 ?站|五站|固定链/, why: '旧「5 站固定链」' },
  { re: /三角/, why: '旧「subagent 三角」支柱提法' },
  { re: /唯一真相源/, why: '旧 SSoT 铁律「唯一真相源」' },
  { re: /文件事实强制/, why: '旧「Iron Law 文件事实强制」' },
  { re: /契约站|需求站|验证站|交付站/, why: '旧 5 站站点概念' },
  { re: /ddt-charter|ddt-impl-spec|ddt-frontend-craft|charter-inject|enforce-stop|enforce-pre/, why: '已删除的 skill/hook 名' },
  { re: /IL-?5|强制层|硬闸|无引证不得 PASS/, why: '已拔除的 IL-5 强制层' },
  { re: /docs\/ssot|docs\/architecture/, why: '旧 SSoT 路径' },
  { re: /\bPRD\b/, why: '已撤回的 PRD 概念' },
];

test('契约 manifest · 所有 description 非空', () => {
  const descs = manifestDescriptions();
  assert.ok(descs.length >= 2, 'plugin.json 与 marketplace.json 至少应有 description');
  for (const [where, text] of descs) {
    assert.ok(typeof text === 'string' && text.trim().length > 0, `${where} description 非空`);
  }
});

test('契约 manifest · description 不含旧架构概念（盲区回归守卫）', () => {
  for (const [where, text] of manifestDescriptions()) {
    for (const { re, why } of STALE) {
      assert.doesNotMatch(text, re, `${where} 含旧架构陈述：${why}——应对齐当前心智模型`);
    }
  }
});
