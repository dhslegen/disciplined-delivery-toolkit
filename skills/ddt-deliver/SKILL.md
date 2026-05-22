---
name: ddt-deliver
description: Use on demand to close out delivery — produces verification/acceptance records (docs/verification/) and delivery packages (docs/delivery/) when work genuinely needs sign-off (multi-impl convergence, toB acceptance, deploy, data migration, API/data/design change, customer delivery docs, rollback/evidence). Small changes do not need it.
---

# ddt-deliver — 按需收口

## 何时使用

收口不是每次工作的必须步骤。当工作**确实需要交付签收**时再用：

- 多个实现切片汇合，需要统一收口的验收记录
- toB 客户验收场景，需要正式交付包与接收确认
- 部署到生产环境，需要部署指南与回滚方案
- 数据迁移，需要迁移验证与回滚证据
- `docs/api/`、`docs/data/`、`docs/design/` 发生变更，需要更新说明
- 客户交付说明、演示脚本
- 降低保障级交付（断网/受限基建）需要显式标注

**小修小改不强制走本 skill**——合并一个 bug fix、更新文档、补测试，通常直接完成即可。

## 按需产物

根据实际场景选择需要的产物，不强制全套：

### 验收记录（`docs/verification/`）

记录验收过程与结论：
- 哪些场景经过人工或自动化验证，以什么方式
- 验收通过的证据（测试结果、截图、日志片段）
- 已知局限与边界

### 交付包（`docs/delivery/`）

根据交付类型选择：
- **README / 发布说明**：面向接收方的项目定位、快速上手、版本变更
- **部署指南**：环境矩阵、依赖版本、部署步骤、回滚指引
- **演示脚本**：seed 数据命令、演示步骤、预期输出、已知限制
- **客户交付说明**：面向 toB 客户的接收确认材料

### AI 效能 ROI 报告（按需）

由 `bin/ddt-report.mjs` 产出，读 `.ddt/metrics/*.jsonl` 与 `.ddt/decisions.jsonl`，渲染 `docs/efficiency-report.md`。需要度量数据时按需运行：`node bin/ddt-report.mjs`。

## 降低保障级交付

断网/受限基建下若完整验收未跑通：
- `.ddt/decisions.jsonl` 记一条**署名 waiver**（含基建原因，经 `bin/ddt-decisions-append.mjs` 追加）
- 交付文档**显式标注"本交付为降低保障级"**并列明哪些证据缺失
- 接收方须知情接受

**绝不假装跑过**。

## 与其他 skill 的关系

- 上游：`ddt-verification`（验证证据）、`ddt-requesting-review` / `ddt-receiving-review`（评审证据）
- 度量：`bin/ddt-report.mjs`（被动采集，按需产报告）
- 留痕：`bin/ddt-decisions-append.mjs`、`bin/ddt-changelog-append.mjs`

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级。完成/通过声明须显式标注「未受强制层校验」。
