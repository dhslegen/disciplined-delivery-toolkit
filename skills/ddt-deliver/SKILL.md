---
name: ddt-deliver
description: Use at the 交付 (delivery) station of DDT's 5-station spine, after 验证 station passes — produces README, deployment guide, demo script, and (via Plan 5 metrics layer) the AI efficiency ROI report. Final IL-6 evidence gate is enforced before this step.
---

# ddt-deliver — 交付站（最后一站）

五站脊柱终点。前置：`验证` 站三角双审通过 + 真实栈 smoke 通过 + 强制层 IL-6 扫描无未 resolved 漂移/pending。

## 触发场景

- 验证站通过且交付决策门弹起（人工签收"准备出包"）
- `/ddt-rerun` 仅交付物变更（如 README 修订），不重跑验证

## 必产产物

### 1. README.md（项目顶层）

- 项目定位（5 行内）
- 适用场景（与不适用场景同列，spec §0 同型诚实）
- 5 分钟快速上手（含先决条件、命令、预期输出）
- 链接到 deploy 与 demo 文档

### 2. docs/deploy.md（部署指南）

- 环境矩阵（生产/预生产/本地）
- 依赖版本钉死（Node/数据库/中间件）
- 一键部署脚本（或步骤精确到命令）
- 回滚指引

### 3. docs/demo.md（演示脚本）

- 演示数据集 seed 命令
- 演示流程 step-by-step（每步可观测的预期输出）
- 已知限制与展示边界

### 4. AI 效能 ROI 报告（spec §11）

**激活状态（Plan 5 已落地）**：报告生成由 `bin/ddt-report.mjs` 实现，读 `.ddt/metrics/*.jsonl`（被动埋点 hook 采集）+ `.ddt/decisions.jsonl`（人工决策）→ 渲染 `docs/efficiency-report.md`。命令调用：`node bin/ddt-report.mjs`（exit 0 写报告，不读 agent 自报）。报告结构：

- 报告路径：`docs/efficiency-report.md`
- 报告章节：项目周期 / 人工省时 / 质量指标 / 与基线对比 / 降低保障级交付清单（IL waiver 汇总）
- 受众：政企领导/审计方——回答"省了多少 / 质量如何 / 为何可信"

## IL-6 终极证据门（spec §3.5 反技术债兜底）

进交付站前的证据门**汇总扫描**：
- 所有 `pending` 决策须 resolved
- 所有 `accept-drift` 须有显式署名理由
- 所有"纳入本批却未实现"的 user story 须降级为 deferred 并留痕

任一未通过 → 强制层 IL-6 hook 硬拒交付。

## 降低保障级交付（spec §13 风险 #8）

断网/受限基建下若真实栈 smoke 未跑通：
- decisions.jsonl 记一条**署名 waiver**（含基建原因）
- README 与 ROI 报告**显式标注"本交付为降低保障级"**并列明哪些证据缺失
- 客户须知情接受（决策门追一条 acknowledgment）

**绝不假装跑过**。

## 与其他 skill 的互引

- 上游：`ddt-verification`（验证站证据）、`ddt-requesting-review`/`ddt-receiving-review`（评审证据）
- 度量：Plan 5 度量层（hook 被动采集，agent 禁自夸）
- 强制层：`ddt-enforce.mjs` IL-6 在 PreToolUse `enter-deliver` 时点拦截

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
