# DDT — Disciplined Delivery Toolkit

> superpowers 纪律基底 ⊕ toB 交付治理。
> 命令品牌 `/ddt`、`/ddt-status` 保持不变；"DDT" 三字母从 *digital-delivery-team*（v0.x）重定义为 **Disciplined Delivery Toolkit**（v1.0）——纪律优先，非 agent 团队。

v1.0 是对 v0.x（`../digital-delivery-team`，独立 plugin，保持不动）的**推倒重来**，在本独立目录干净开发，零扰动 v0.x。

## 状态

- 设计规格（SSoT，已定稿评审通过）：`docs/specs/2026-05-18-ddt-v1-redesign-design.md` v5
- 实施计划：`docs/plans/2026-05-19-ddt-v1-foundation.md`（Plan 1 地基）
- 设计血脉：`docs/research/`（superpowers 深调 + 领导愿景报告）

## 核心

5 站固定链：**需求 → 契约 → 实现 → 验证 → 交付**（= superpowers brainstorm→plan→implement 弧线 + 治理外壳）。2 命令：`/ddt`、`/ddt-status`。纪律来自原文照搬的 superpowers skill，由 SessionStart 注入宪法 + hook 判文件事实强制。

## 开发

```bash
npm test            # node --test 'tests/**/*.test.mjs'（零依赖）
```

Node ≥ 22。零运行时依赖。
