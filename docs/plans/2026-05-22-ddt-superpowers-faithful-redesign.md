# DDT superpowers-faithful 重设计 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: 用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按 task 逐项实现。步骤用 checkbox（`- [ ]`）跟踪。

**Goal:** 把 DDT 从「带 Iron Laws 宪法 + 5 站 + 多强制 hook 的流程引擎」收敛为「对标 using-superpowers 的注入式心智模型 + 极轻增强」，纪律强度不降（回归 vendored skill 承载）。

**Architecture:** charter 宪法 → `using-ddt` 薄取向 skill；强制层收敛到 L2（4 hooks：inject + metrics×2 + enforce-pre 仅 IL-5）；SSoT 真相文件迁回 `.ddt/`（外科 gitignore）；docs 结构扁平化（新增 requirements/briefs/api/data/design/verification/delivery，取消 ssot/ 嵌套）；删 `ddt-impl-spec`/`ddt-frontend-craft`，`ddt-design`→`ddt-design-checkpoint`，`ddt-deliver`/`ddt-design-source` 转按需；`/ddt` 降可选向导。

**Tech Stack:** Node.js ESM（`.mjs`）、node:test 测试、Claude Code plugin（hooks/skills/commands）、Markdown skill 文档。

**依据 spec:** `docs/specs/2026-05-22-ddt-superpowers-faithful-redesign-design.md`（commit `c4a0f1c`）。**严守 spec §13 Non-Goals 负面清单。**

**测试命令:** 全量 `npm test`；单文件 `node --test tests/<path>.test.mjs`。每个 commit 前跑相关测试；每阶段末尾跑全量 + `node bin/ddt-doctor.mjs` 必须全绿。

---

## 路径迁移映射表（贯穿全程的唯一权威）

| 旧路径字面量 | 新路径字面量 | 说明 |
|---|---|---|
| `docs/ssot/decisions.jsonl` | `.ddt/decisions.jsonl` | SSoT 迁回 .ddt（仍入 git，白名单） |
| `docs/ssot/changelog.jsonl` | `.ddt/changelog.jsonl` | 同上 |
| `docs/ssot/openapi/` | `docs/api/` | 契约 |
| `docs/architecture/` | `docs/design/` | 架构/设计 |
| `docs/reviews/` | `docs/reviews/`（**不变**） | reviewer 证据 |
| `.ddt/state/`、`.ddt/metrics/`、`.ddt/tech-stack.json` | 不变 | transient |
| `.ddt/prd/`、`.ddt/progress.json` | 仅作 doctor「残留检测」字样，不作正常路径 | v0.x/已撤回残留 |

**不存在 `docs/ssot/` 目录概念了**——任何残留 `docs/ssot` 字样都是 bug。

---

## File Structure（决策锁定）

**新增/重写（高判断，本计划给完整内容）：**
- `skills/using-ddt/SKILL.md`（由 `skills/ddt-charter/` 重命名 + 整篇重写）
- `hooks/handlers/ddt-enforce.mjs`（删 IL-1/3/4/6，留 IL-5）
- `hooks/handlers/ddt-inject.mjs`（由 `ddt-charter-inject.mjs` 重命名 + 改读路径）
- `commands/ddt.md`（路由器 → 可选向导）
- `.gitignore`、`.gitattributes`

**重命名 + 重定义（给新 frontmatter + 角色，body 按 spec 写）：**
- `skills/ddt-design/` → `skills/ddt-design-checkpoint/`
- `skills/ddt-deliver/`、`skills/ddt-design-source/`（reframe 按需）

**删除：**
- `skills/ddt-impl-spec/`、`skills/ddt-frontend-craft/`
- `hooks` 中 `Stop`(`ddt:enforce-stop`) 注册

**机械迁移（按映射表，给文件清单 + 验证命令）：**
- bins：`ddt-decisions-append`、`ddt-changelog-append`、`ddt-status`、`ddt-report`、`ddt-contract-lint`、`ddt-doctor`、`ddt-hook-preflight`、`lib/ddt-facts`
- tests：unit/integration/contract 中断言旧路径/旧行为者
- fixtures：含旧路径字面量者

---

## Phase 0：基线确认

### Task 0.1：确认基线全绿

- [ ] **Step 1：跑全量测试基线**

Run: `cd <repo> && npm test 2>&1 | tail -20`
Expected: 全部 PASS（基线 159 测试，记下确切数字）。

- [ ] **Step 2：跑 doctor 基线**

Run: `node bin/ddt-doctor.mjs`
Expected: 全绿。记下当前 [B] 段 SSoT 路径地图原文（后续对照重写）。

- [ ] **Step 3：确认在重设计分支**

Run: `git rev-parse --abbrev-ref HEAD`
Expected: `redesign/superpowers-faithful`。若不是，`git checkout redesign/superpowers-faithful`。

---

## Phase A：SSoT 路径迁移（bins + facts + fixtures + 测试 + gitignore/gitattributes + doctor 路径地图）

> 目标：把映射表全部落地，本阶段末全量 + doctor 全绿。charter/skills 文本里的旧路径**本阶段不动**（Phase B/D 重写时一并清除）。

### Task A.1：外科 .gitignore + .gitattributes

**Files:**
- Modify: `.gitignore`
- Modify: `.gitattributes`

- [ ] **Step 1：改 `.gitignore` 的 `.ddt` 段为外科白名单**

把现有 `/.ddt/` 段替换为：

```gitignore
# .ddt/ 默认 transient（state / metrics / v0.x 残留 progress.json 等），
# 但 SSoT 真相 decisions.jsonl / changelog.jsonl 必入 git——外科白名单放行这两个。
# 用 .ddt/ 不带前导斜杠以同时兜住任意嵌套位置（如误写到 skills/.ddt/）。
.ddt/*
!.ddt/decisions.jsonl
!.ddt/changelog.jsonl
```

> 注：去掉前导斜杠（`/.ddt/` → `.ddt/`）以兼顾嵌套 `.ddt/`（修复 `skills/.ddt/metrics` 漏网）。`docs/efficiency-report.md`、`.idea/`、`.DS_Store` 等其余行保留。

- [ ] **Step 2：改 `.gitattributes` union merge 路径到 .ddt**

把 `docs/ssot/decisions.jsonl`、`docs/ssot/changelog.jsonl` 两行改为 `.ddt/decisions.jsonl`、`.ddt/changelog.jsonl`；`.ddt/metrics/*.jsonl` 行保留。同步更新文件内注释里的 `docs/ssot/` 字样。

- [ ] **Step 3：验证 gitignore 行为**

Run:
```bash
mkdir -p .ddt/metrics .ddt/state && touch .ddt/decisions.jsonl .ddt/changelog.jsonl .ddt/metrics/x.jsonl .ddt/state/current.json
git check-ignore -v .ddt/decisions.jsonl .ddt/changelog.jsonl .ddt/metrics/x.jsonl .ddt/state/current.json; echo "exit=$?"
```
Expected: `metrics/x.jsonl` 与 `state/current.json` 被忽略；`decisions.jsonl`、`changelog.jsonl` **不**被忽略（不出现在 check-ignore 输出，对应行 exit 非 0）。

- [ ] **Step 4：commit**

```bash
git add .gitignore .gitattributes && git commit -m "chore: 外科 .gitignore 白名单 .ddt SSoT + union merge 迁 .ddt 路径"
```

### Task A.2：迁移 append bins（decisions/changelog）

**Files:**
- Modify: `bin/ddt-decisions-append.mjs`（`docs/ssot/decisions.jsonl` → `.ddt/decisions.jsonl`）
- Modify: `bin/ddt-changelog-append.mjs`（`docs/ssot/changelog.jsonl` → `.ddt/changelog.jsonl`）
- Test: `tests/unit/ddt-appenders.test.mjs`

- [ ] **Step 1：先改测试期望（RED）**

读 `tests/unit/ddt-appenders.test.mjs`，把其中断言写入/读取路径为 `docs/ssot/decisions.jsonl`、`docs/ssot/changelog.jsonl` 处全部改为 `.ddt/decisions.jsonl`、`.ddt/changelog.jsonl`（含临时目录拼接处）。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/unit/ddt-appenders.test.mjs`
Expected: FAIL（bin 仍写旧路径，断言新路径）。

- [ ] **Step 3：改 bin 路径（GREEN）**

在两个 append bin 里把目标路径常量从 `docs/ssot/...` 改为 `.ddt/...`；若有「确保父目录存在」的 `mkdirSync`，目标改为 `.ddt`。

- [ ] **Step 4：跑测试确认通过**

Run: `node --test tests/unit/ddt-appenders.test.mjs`
Expected: PASS。

- [ ] **Step 5：commit**

```bash
git add bin/ddt-decisions-append.mjs bin/ddt-changelog-append.mjs tests/unit/ddt-appenders.test.mjs
git commit -m "refactor: decisions/changelog append bins 迁 .ddt 路径"
```

### Task A.3：迁移 ddt-facts + ddt-enforce/ddt-status 的读路径常量

**Files:**
- Modify: `bin/lib/ddt-facts.mjs`、`bin/ddt-status.mjs`、`hooks/handlers/ddt-enforce.mjs`（仅路径字面量，逻辑删减留 Phase C）
- Test: `tests/unit/ddt-facts.test.mjs`、`tests/unit/ddt-status.test.mjs`

- [ ] **Step 1：grep 出全部读路径字面量**

Run: `grep -n "docs/ssot" bin/lib/ddt-facts.mjs bin/ddt-status.mjs hooks/handlers/ddt-enforce.mjs`
记录每处。

- [ ] **Step 2：改测试期望（RED）**

把 `ddt-facts.test.mjs`、`ddt-status.test.mjs` 中断言 `docs/ssot/decisions.jsonl`/`docs/ssot/changelog.jsonl` 的地方改为 `.ddt/...`。

- [ ] **Step 3：跑测试确认失败**

Run: `node --test tests/unit/ddt-facts.test.mjs tests/unit/ddt-status.test.mjs`
Expected: FAIL。

- [ ] **Step 4：改源码路径字面量（GREEN）**

在 `ddt-facts.mjs`、`ddt-status.mjs`、`ddt-enforce.mjs` 的 `decisionsText`/`changelogText`/读 decisions 处，把 `docs/ssot/decisions.jsonl`→`.ddt/decisions.jsonl`、`docs/ssot/changelog.jsonl`→`.ddt/changelog.jsonl`。同步更新这些函数上方注释里的 `docs/ssot/` 说明。

- [ ] **Step 5：跑测试确认通过**

Run: `node --test tests/unit/ddt-facts.test.mjs tests/unit/ddt-status.test.mjs`
Expected: PASS。

- [ ] **Step 6：commit**

```bash
git add bin/lib/ddt-facts.mjs bin/ddt-status.mjs hooks/handlers/ddt-enforce.mjs tests/unit/ddt-facts.test.mjs tests/unit/ddt-status.test.mjs
git commit -m "refactor: facts/status/enforce 读路径迁 .ddt"
```

### Task A.4：迁移契约/架构路径（openapi→api, architecture→design）于 contract-lint + report

**Files:**
- Modify: `bin/ddt-contract-lint.mjs`（`docs/ssot/openapi/` → `docs/api/`）
- Modify: `bin/ddt-report.mjs`（任何 `docs/ssot`/`docs/architecture` 字样）
- Test: `tests/unit/ddt-contract-lint.test.mjs`、`tests/unit/ddt-report.test.mjs`、相关 fixtures

- [ ] **Step 1：改测试 + fixture 期望（RED）**

把 `ddt-contract-lint.test.mjs` 与其 fixture 引用里的 `docs/ssot/openapi/` 改为 `docs/api/`；`ddt-report.test.mjs` 中 `docs/ssot`/`docs/architecture` 字样改为新路径。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/unit/ddt-contract-lint.test.mjs tests/unit/ddt-report.test.mjs`
Expected: FAIL。

- [ ] **Step 3：改 bin（GREEN）**

`ddt-contract-lint.mjs` 默认契约目录 `docs/ssot/openapi/`→`docs/api/`；`ddt-report.mjs` 同步。

- [ ] **Step 4：跑测试确认通过 + commit**

Run: `node --test tests/unit/ddt-contract-lint.test.mjs tests/unit/ddt-report.test.mjs`
Expected: PASS。
```bash
git add bin/ddt-contract-lint.mjs bin/ddt-report.mjs tests/unit/ddt-contract-lint.test.mjs tests/unit/ddt-report.test.mjs tests/fixtures/
git commit -m "refactor: 契约 lint 与 report 迁 docs/api + docs/design"
```

### Task A.5：重写 ddt-doctor [B] 路径地图 + 校验外科 gitignore/gitattributes

**Files:**
- Modify: `bin/ddt-doctor.mjs`
- Test: `tests/unit/ddt-doctor.test.mjs`

- [ ] **Step 1：改测试期望（RED）**

把 `ddt-doctor.test.mjs` 中对 [B] 段路径地图的断言改为新三层结构：
- SSoT 真相：`.ddt/decisions.jsonl`、`.ddt/changelog.jsonl`、`docs/specs/`
- 派生：`docs/plans/`、`docs/reviews/`、`docs/api/`、`docs/data/`、`docs/design/`、`docs/requirements/`、`docs/briefs/`、`docs/verification/`、`docs/delivery/`
- transient：`.ddt/state/`、`.ddt/metrics/`
新增断言：doctor 检查 `.gitattributes` 含 `.ddt/decisions.jsonl merge=union`；检查 `.gitignore` 含 `!.ddt/decisions.jsonl` 白名单；v0.x 残留检测仍含 `.ddt/progress.json`。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/unit/ddt-doctor.test.mjs`
Expected: FAIL。

- [ ] **Step 3：改 doctor（GREEN）**

重写 [B] 段输出新三层路径地图；`.gitattributes`/`.gitignore` 校验改查 `.ddt/` 路径与白名单；标题若仍含 `docs/ssot` 字样清除。

- [ ] **Step 4：跑测试 + 实跑 doctor + commit**

Run: `node --test tests/unit/ddt-doctor.test.mjs && node bin/ddt-doctor.mjs`
Expected: 测试 PASS；doctor 全绿。
```bash
git add bin/ddt-doctor.mjs tests/unit/ddt-doctor.test.mjs
git commit -m "refactor: doctor [B] 路径地图重写为 .ddt + 扁平 docs 结构"
```

### Task A.6：Phase A 收口——全量扫残留 + 全绿

- [ ] **Step 1：扫描 bin/tests/fixtures 残留旧路径**

Run: `grep -rn -E "docs/ssot|docs/architecture" bin tests | grep -v node_modules`
Expected: **空输出**。非空则逐一按映射表修掉并补到对应测试。

- [ ] **Step 2：全量测试 + doctor**

Run: `npm test 2>&1 | tail -5 && node bin/ddt-doctor.mjs | tail -5`
Expected: 全绿（测试数应等于基线，因为只改路径未增删用例）。

- [ ] **Step 3：commit（若有收尾改动）**

```bash
git add -A && git commit -m "refactor: Phase A 收口——bin/tests 全量迁 .ddt + docs/api/data/design"
```

---

## Phase B：注入层（charter → using-ddt + handler + hook id）

### Task B.1：重命名 skill 目录并整篇重写为 using-ddt

**Files:**
- Rename: `skills/ddt-charter/SKILL.md` → `skills/using-ddt/SKILL.md`（git mv 目录）
- 内容：整篇替换为下方

- [ ] **Step 1：git mv 目录**

Run: `git mv skills/ddt-charter skills/using-ddt`

- [ ] **Step 2：用以下完整内容覆盖 `skills/using-ddt/SKILL.md`**

````markdown
---
name: using-ddt
description: Use at the start of every DDT session — orients you to DDT's place beside superpowers (four lightweight enhancements, three entry points, the docs/.ddt convention). DDT does not replace superpowers or monopolize entry.
---

# using-ddt（DDT 取向）

DDT 在 superpowers 边上：不替代它、不垄断入口、不发明第二套项目管理。
superpowers 的 `brainstorming → writing-plans → implementation → review` 是微观主链路。你能读到这段话 = DDT 的 SessionStart inject 在工作。

## 四句北极星

- 大需求先变小。
- 小问题用 superpowers 做深。
- 设计进计划前过闸。
- 需要交付时再收口。

## 三种入口（解释，不是强制路由）

1. **开发者局部想法** → 直接 superpowers 原生链路。bug / 重构 / 测试补强 / 性能 / 探索都走这条。
2. **大需求** → 先跑一条 superpowers 链路把它当**文档资产**实现，产 `docs/requirements/` + `docs/briefs/`，再逐个处理。
3. **brief 驱动** → brief → brainstorming → Design Checkpoint → writing-plans → implementation → review。

不是所有工作都要 requirements/briefs，也不是所有工作都要 verification/delivery。右尺寸。

## 四项增强 → 用什么

- **大需求变小**：用现有 vendored 链路产 requirements/briefs。**implementation 的对象可以是文档/契约/设计/测试资产，不必是代码。** 无需专门 skill。
- **小问题做深**：直接 vendored 链路。
- **设计进计划前过闸**：`ddt-design-checkpoint`。
- **需要交付时再收口**：`ddt-deliver`（按需）。

## Design Checkpoint（七问习惯，无固定模板/文件名）

任何 design spec 进 `writing-plans` 前，留下最小判断：

1. 是否允许进入 writing-plans？
2. 影响 `docs/api/`？ 3. 影响 `docs/data/`？ 4. 影响 `docs/design/`？
5. 需写 `.ddt/decisions.jsonl`？ 6. 需写 `.ddt/changelog.jsonl`？ 7. 有未解决冲突/开放问题？

简单工作几行写进 spec 末尾即可；复杂工作交 `ddt-design-checkpoint` 整理并按需落 `docs/api,data,design`。**已完成 Checkpoint 就不必为调而调。**

## 路径即指令（唯一权威位置，勿自由发挥）

| 用途 | 路径 | 性质 |
|---|---|---|
| design spec | `docs/specs/` | 主链路常用 |
| plan | `docs/plans/` | 主链路常用 |
| reviewer 证据 | `docs/reviews/*.json` | IL-5 校验对象 |
| 大需求 / 切片输入 | `docs/requirements/`、`docs/briefs/` | 按需 |
| 契约 / 数据 / 设计 | `docs/api/`、`docs/data/`、`docs/design/` | 按需 |
| 验收 / 交付 | `docs/verification/`、`docs/delivery/` | 按需 |
| 决策 / 变更账本 | `.ddt/decisions.jsonl`、`.ddt/changelog.jsonl` | 入 git，仅经 append bin 追加 |
| 状态 / 度量 | `.ddt/state/`、`.ddt/metrics/` | transient，不入 git |

不确定写哪里：跑 `ddt-doctor.mjs` 看 [B] 段——doctor 是真相。

## 原则（superpowers 自带，DDT 不另立法）

纪律住在 vendored skill 里，按需 invoke：

- 证据先于断言 → `ddt-verification`
- 无根因不修 → `ddt-systematic-debugging`
- 未批准设计不实现 → `ddt-brainstorming` → `ddt-writing-plans`
- reviewer 无引证不 PASS → `ddt-requesting-review` / `ddt-receiving-review`

**唯一不可商量的硬骨头**：reviewer 写 `docs/reviews/<task-id>-<role>.json`（role ∈ `spec|quality|final`）时，结构须为

```json
{ "task_id": "...", "reviewer_role": "spec|quality|final", "verdict": "PASS|FAIL",
  "cited_evidence": ["文件:行 / 命令输出 / 测试名，PASS 时 ≥1 条"],
  "issues": [{ "severity": "critical|important|minor", "where": "文件:行", "note": "..." }],
  "ts": "ISO8601" }
```

`verdict=PASS` 时 `cited_evidence` 必须非空，否则 PreToolUse hook 拦截。其余都是原则，不是闸机。

## 按需协作 & 收口

- **多人/多切片**：每切片在 `slice/<id>` branch 开发并 `git push -u`，`/ddt-status` 跑 `git for-each-ref` 反推「在做谁」。git branch 是 ground truth，非强制。
- `.ddt/decisions.jsonl`、`.ddt/changelog.jsonl`、`.ddt/metrics/*.jsonl` 已配 `.gitattributes merge=union` 自动合并并发追加。
- **收口**（`ddt-deliver`）只在需要时：多实现汇合、toB 验收、部署、数据迁移、API/data/design 变更、客户交付说明、回滚/交付证据。小修小改不强制。
````

- [ ] **Step 3：自检不含 Non-Goals 残留**

Run: `grep -nE "Iron Law|5 站|意图分类|docs/ssot|PRD|spec_kind|frontmatter:|impl-spec|Arc 编号" skills/using-ddt/SKILL.md`
Expected: 仅 frontmatter 的 `description` 行可能命中（无关词）；不得出现 Iron Law 法典、5 站、docs/ssot、PRD 等。逐一确认。

### Task B.2：重命名 inject handler + 改读路径 + 改 hook id

**Files:**
- Rename: `hooks/handlers/ddt-charter-inject.mjs` → `hooks/handlers/ddt-inject.mjs`
- Modify: `hooks/hooks.json`（SessionStart command 路径 + `id` `ddt:charter-inject`→`ddt:inject`）

- [ ] **Step 1：git mv handler**

Run: `git mv hooks/handlers/ddt-charter-inject.mjs hooks/handlers/ddt-inject.mjs`

- [ ] **Step 2：改 handler 读路径**

`ddt-inject.mjs` 第 9 行：`'../../skills/ddt-charter/SKILL.md'` → `'../../skills/using-ddt/SKILL.md'`；顶部注释「读《DDT 宪法》」→「读 using-ddt 取向」。

- [ ] **Step 3：改 hooks.json**

SessionStart 项：command 里 `ddt-charter-inject.mjs` → `ddt-inject.mjs`；`"id": "ddt:charter-inject"` → `"id": "ddt:inject"`；`description` 「DDT 宪法注入」→「DDT 取向注入（using-ddt）」。

- [ ] **Step 4：实跑 handler 冒烟**

Run: `echo '{}' | node hooks/handlers/ddt-inject.mjs`
Expected: 输出 JSON 含 `additionalContext`，内含 using-ddt 内容（grep `北极星`）。

### Task B.3：同步注入层相关测试

**Files:**
- Modify: `tests/unit/ddt-charter-inject.test.mjs`（重命名 → `tests/unit/ddt-inject.test.mjs`）
- Modify: `tests/contract/hook-charter-inject-contract.test.mjs`（重命名 → `tests/contract/hook-inject-contract.test.mjs`）
- Modify: `tests/unit/ddt-hooks-registered.test.mjs`、`tests/unit/ddt-metrics-registered.test.mjs`

- [ ] **Step 1：git mv 两个测试文件并更新内容**

Run:
```bash
git mv tests/unit/ddt-charter-inject.test.mjs tests/unit/ddt-inject.test.mjs
git mv tests/contract/hook-charter-inject-contract.test.mjs tests/contract/hook-inject-contract.test.mjs
```
更新内容：handler 路径 `ddt-charter-inject.mjs`→`ddt-inject.mjs`；读 skill 路径 `ddt-charter/SKILL.md`→`using-ddt/SKILL.md`；断言注入内容的关键字从「宪法/Iron Law」改为 using-ddt 实际含有的字样（如 `北极星`、`三种入口`）；hook id 断言 `ddt:charter-inject`→`ddt:inject`。

- [ ] **Step 2：改 hooks-registered / metrics-registered 测试**

把 `ddt-hooks-registered.test.mjs` 与 `ddt-metrics-registered.test.mjs` 中对 hook id 集合的断言：`ddt:charter-inject`→`ddt:inject`（Stop 注册的删除留 Phase C）。

- [ ] **Step 3：跑相关测试**

Run: `node --test tests/unit/ddt-inject.test.mjs tests/contract/hook-inject-contract.test.mjs tests/unit/ddt-hooks-registered.test.mjs tests/unit/ddt-metrics-registered.test.mjs`
Expected: PASS。

- [ ] **Step 4：Phase B 全量 + commit**

Run: `npm test 2>&1 | tail -5 && node bin/ddt-doctor.mjs | tail -5`
Expected: 全绿（doctor 注册 hook 列表里应已显示 `ddt:inject`）。
```bash
git add -A && git commit -m "refactor: charter → using-ddt 注入式取向 skill + inject handler/id 重命名"
```

---

## Phase C：强制层（enforce 删 IL-1/3/4/6 留 IL-5 + 解绑 Stop + facts 清理）

### Task C.1：重写 ddt-enforce.mjs 只留 IL-5

**Files:**
- Modify: `hooks/handlers/ddt-enforce.mjs`
- Test: `tests/unit/ddt-enforce.test.mjs`、`tests/contract/hook-enforce-contract.test.mjs`

- [ ] **Step 1：改测试期望（RED）**

更新 `ddt-enforce.test.mjs`：删除断言 IL-1（claim-complete）、IL-3（enter-plan/impl）、IL-4（build-edit protected）、IL-6（enter-deliver）会 block 的用例；**保留并强化** IL-5 用例（PASS 无 cited_evidence → deny；FAIL → allow；非 JSON → deny；合规 PASS → allow）。更新 `hook-enforce-contract.test.mjs`：协议断言只覆盖 PreToolUse 的 IL-5 deny/allow 形状。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/unit/ddt-enforce.test.mjs tests/contract/hook-enforce-contract.test.mjs`
Expected: FAIL（旧 handler 仍含 IL-1/3/4/6）。

- [ ] **Step 3：用以下完整内容覆盖 `hooks/handlers/ddt-enforce.mjs`**

```javascript
#!/usr/bin/env node
// 强制层 hook（L2 唯一一颗牙）：仅 IL-5——reviewer 写 docs/reviews/*.json 时，
// PASS 必须带 cited_evidence，否则 deny。其余 Iron Law 已回归 vendored skill 行为承载。
// 仅注册于 PreToolUse。
import { readFileSync } from 'node:fs';
import { isValidReviewOutput } from '../../bin/lib/ddt-facts.mjs';

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function allow() { return { decision: 'allow' }; }
function block(reason) { return { decision: 'block', reason }; }

// 转 Claude Code 协议：PreToolUse 用 hookSpecificOutput.permissionDecision。
export function formatOutput(ev, decided) {
  const eventName = ev && typeof ev.hook_event_name === 'string' ? ev.hook_event_name : '';
  if (eventName === 'PreToolUse') {
    if (decided.decision === 'block') {
      return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: decided.reason } };
    }
    return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
  }
  if (decided.decision === 'block') return { decision: 'block', reason: decided.reason };
  return {};
}

export function decide(ev) {
  if (ev.hook_event_name === 'PreToolUse' && ['Edit','Write','MultiEdit','NotebookEdit'].includes(ev.tool_name)) {
    const fp = ev.tool_input && typeof ev.tool_input.file_path === 'string' ? ev.tool_input.file_path : '';
    if (/^docs\/reviews\/.+\.json$/.test(fp)) {
      const raw = ev.tool_input && typeof ev.tool_input.content === 'string' ? ev.tool_input.content : '';
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { return block(`IL-5 违规：reviewer 输出 ${fp} 非合法 JSON。`); }
      const v = isValidReviewOutput(parsed);
      if (!v.ok) return block(`IL-5 违规：reviewer 输出 ${fp} 不合规——${v.reason}。无引证不得 PASS。`);
    }
  }
  return allow();
}

const ev = readStdin();
const decided = decide(ev);
process.stdout.write(JSON.stringify(formatOutput(ev, decided)));
process.exit(0);
```

- [ ] **Step 4：跑测试确认通过**

Run: `node --test tests/unit/ddt-enforce.test.mjs tests/contract/hook-enforce-contract.test.mjs`
Expected: PASS。

- [ ] **Step 5：commit**

```bash
git add hooks/handlers/ddt-enforce.mjs tests/unit/ddt-enforce.test.mjs tests/contract/hook-enforce-contract.test.mjs
git commit -m "refactor: enforce hook 收敛为唯一 IL-5 牙，IL-1/3/4/6 回归 vendored skill"
```

### Task C.2：解绑 Stop hook + 更新 preflight REQUIRED=4

**Files:**
- Modify: `hooks/hooks.json`（删除整个 `Stop` 段）
- Modify: `bin/ddt-hook-preflight.mjs`（REQUIRED 列表）
- Test: `tests/unit/ddt-hook-preflight.test.mjs`、`tests/unit/ddt-hooks-registered.test.mjs`

- [ ] **Step 1：改测试期望（RED）**

`ddt-hook-preflight.test.mjs` 把 REQUIRED 期望集合改为正好 4 个：`ddt:inject`、`ddt:enforce-pre`、`ddt:metrics-post`、`ddt:metrics-end`（删 `ddt:enforce-stop`）。`ddt-hooks-registered.test.mjs` 断言不再包含 `Stop`/`ddt:enforce-stop`。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/unit/ddt-hook-preflight.test.mjs tests/unit/ddt-hooks-registered.test.mjs`
Expected: FAIL。

- [ ] **Step 3：改 hooks.json + preflight（GREEN）**

`hooks.json`：删除 `"Stop": [...]` 整段。`ddt-hook-preflight.mjs`：`REQUIRED` 数组改为 `['ddt:inject','ddt:enforce-pre','ddt:metrics-post','ddt:metrics-end']`。

- [ ] **Step 4：跑测试 + preflight 实跑**

Run: `node --test tests/unit/ddt-hook-preflight.test.mjs tests/unit/ddt-hooks-registered.test.mjs && node bin/ddt-hook-preflight.mjs; echo "exit=$?"`
Expected: 测试 PASS；preflight exit 0。

- [ ] **Step 5：commit**

```bash
git add hooks/hooks.json bin/ddt-hook-preflight.mjs tests/unit/ddt-hook-preflight.test.mjs tests/unit/ddt-hooks-registered.test.mjs
git commit -m "refactor: 解绑 Stop hook，强制层降为 4 hooks（L2）"
```

### Task C.3：清理 ddt-facts 失引用的纯函数 + 测试

**Files:**
- Modify: `bin/lib/ddt-facts.mjs`、`tests/unit/ddt-facts.test.mjs`

- [ ] **Step 1：逐函数 grep 引用面**

Run:
```bash
for fn in hasEvidenceRef hasUnresolvedPending hasResolvedSpecApproval hasEscalationFor readDecisions parseTrailers pathTouchesProtected isValidReviewOutput; do
  echo "== $fn =="; grep -rn "$fn" bin hooks | grep -v "ddt-facts.mjs:" | grep -v node_modules;
done
```
记录每个函数在 `ddt-facts.mjs` 之外的真实引用。

- [ ] **Step 2：判定去留**

- 仍被 bin/hook 引用的（如 `isValidReviewOutput` 被 enforce 用；`hasUnresolvedPending`/`readDecisions` 若被 `ddt-status` 用）→ **保留**。
- 完全无外部引用的（IL-1/3/4/6 删除后的 `hasEvidenceRef`/`hasResolvedSpecApproval`/`hasEscalationFor` 等）→ **删除函数 + 删除其在 `ddt-facts.test.mjs` 的对应 describe/test 块**。
- `pathTouchesProtected`：若已无引用则一并删（含其测试）。

> 注：仅删「确认零外部引用」者。删函数同时删其测试，避免引用未定义符号。

- [ ] **Step 3：跑测试确认通过**

Run: `node --test tests/unit/ddt-facts.test.mjs`
Expected: PASS（用例数下降，因删了无用函数的测试）。

- [ ] **Step 4：Phase C 全量 + commit**

Run: `npm test 2>&1 | tail -5 && node bin/ddt-doctor.mjs | tail -5`
Expected: 全绿。
```bash
git add bin/lib/ddt-facts.mjs tests/unit/ddt-facts.test.mjs && git commit -m "refactor: 清理 IL 降级后失引用的 facts 纯函数及其测试"
```

---

## Phase D：Skill 层（删 2 + 重命名/重定义 + reframe + frontmatter 测试）

### Task D.1：删除 ddt-impl-spec 与 ddt-frontend-craft

**Files:**
- Delete: `skills/ddt-impl-spec/`、`skills/ddt-frontend-craft/`

- [ ] **Step 1：确认无 SKILL.md 互相引用**

Run: `grep -rln -E "ddt-impl-spec|ddt-frontend-craft" skills commands hooks bin tests | grep -v node_modules`
记录引用处（预期：被删两者自身、charter 已重写不含、可能有 ddt-design/ddt-design-source 互引、测试 frontmatter 清单）。

- [ ] **Step 2：git rm 两目录**

Run: `git rm -r skills/ddt-impl-spec skills/ddt-frontend-craft`

- [ ] **Step 3：清理残留引用**

把 Step 1 找到的其它文件里对这两个 skill 的引用删除/改写（如 `ddt-design-source` 描述里「不走 ddt-design-source 时用 ddt-frontend-craft」一句删掉）。

### Task D.2：重命名 ddt-design → ddt-design-checkpoint 并重定义

**Files:**
- Rename: `skills/ddt-design/` → `skills/ddt-design-checkpoint/`
- Rewrite: `skills/ddt-design-checkpoint/SKILL.md`

- [ ] **Step 1：git mv**

Run: `git mv skills/ddt-design skills/ddt-design-checkpoint`

- [ ] **Step 2：替换 frontmatter description（契约，被 frontmatter 测试校验）**

```yaml
name: ddt-design-checkpoint
description: Use after brainstorming and before writing-plans — the design-tidy / Design Checkpoint gate. Runs the seven-question checkpoint, and on demand lands important design into docs/api, docs/data, docs/design. Not a design generator and not a brainstorming replacement; skip it if the Checkpoint is already done.
```

- [ ] **Step 3：重写 body（按 spec §6）**

body 必须涵盖：① 它不是设计生成器/不是 brainstorming 替代/不是契约站；② 七问 Design Checkpoint 清单（与 using-ddt 一致）；③ 最小留痕就近原则（简单→spec 末尾；复杂→落 docs/design,api,data + `.ddt/decisions.jsonl`）；④ 已完成 Checkpoint 则不必调用；⑤ 路径用新结构（`docs/api/`、`docs/data/`、`docs/design/`）。**不得**出现 5 站/契约站/impl-spec/spec_kind/固定模板/固定文件名字样。

- [ ] **Step 4：自检**

Run: `grep -nE "契约站|5 站|impl-spec|spec_kind|固定模板|docs/ssot" skills/ddt-design-checkpoint/SKILL.md`
Expected: 空。

### Task D.3：reframe ddt-deliver（按需收口）与 ddt-design-source（前端可选增强）

**Files:**
- Modify: `skills/ddt-deliver/SKILL.md`、`skills/ddt-design-source/SKILL.md`

- [ ] **Step 1：改 ddt-deliver frontmatter description**

```yaml
description: Use on demand to close out delivery — produces verification/acceptance records (docs/verification/) and delivery packages (docs/delivery/) when work genuinely needs sign-off (multi-impl convergence, toB acceptance, deploy, data migration, API/data/design change, customer delivery docs, rollback/evidence). Small changes do not need it.
```
body：删除「5 站交付站」「IL-6 硬门口前置」框架口吻；改为「按需收口」；路径用 `docs/verification/`、`docs/delivery/`；ROI 报告仍可由 `ddt-report` 产出（按需）。

- [ ] **Step 2：改 ddt-design-source frontmatter description**

```yaml
description: Use on demand for a frontend slice whose convergence target is judged perceptually by a human — routes the perceptual problem to an external AI design tool (v0/figma/claude-design) and ingests the result. Optional enhancement, not a pipeline stage.
```
body：剥离「契约站/5 站/绑定 OpenAPI」框架；改「按需可选增强」；删对已删除 `ddt-frontend-craft` 的引用；契约路径若提及改 `docs/api/`。

- [ ] **Step 3：自检两文件无残留**

Run: `grep -nE "ddt-frontend-craft|5 站|契约站|docs/ssot|IL-6 硬门" skills/ddt-deliver/SKILL.md skills/ddt-design-source/SKILL.md`
Expected: 空。

### Task D.4：同步 skill-frontmatter 契约 + 集成测试

**Files:**
- Modify: `tests/contract/skill-frontmatter-contract.test.mjs`
- Modify: `tests/integration/ddt-vendored-skills.test.mjs`、`tests/integration/ddt-stations.test.mjs`、`tests/integration/ddt-activation.test.mjs`

- [ ] **Step 1：改 frontmatter 契约测试**

skill 期望清单更新为 13：9 vendored + `using-ddt` + `ddt-design-checkpoint` + `ddt-deliver` + `ddt-design-source`。删除 `ddt-charter`、`ddt-design`、`ddt-impl-spec`、`ddt-frontend-craft`。若测试断言每个 skill 的 description 关键词，更新为新 description。

- [ ] **Step 2：改集成测试**

`ddt-stations.test.mjs`：若断言「5 站」/特定 skill 名（ddt-design/ddt-impl-spec）→ 改为新结构断言或删除已不成立的「5 站」用例（spec 已废 5 站）。`ddt-vendored-skills.test.mjs`：确认 9 vendored 仍在。`ddt-activation.test.mjs`：若引用 `ddt-charter`/旧路径 → 改 `using-ddt`/新路径。

- [ ] **Step 3：跑相关测试**

Run: `node --test tests/contract/skill-frontmatter-contract.test.mjs tests/integration/`
Expected: PASS。

- [ ] **Step 4：Phase D 全量 + commit**

Run: `npm test 2>&1 | tail -5 && node bin/ddt-doctor.mjs | tail -5`
Expected: 全绿。
```bash
git add -A && git commit -m "refactor: skill 集合收敛为 13（删 impl-spec/frontend-craft，design→design-checkpoint，deliver/design-source 转按需）"
```

---

## Phase E：Command 层（/ddt 向导化 + /ddt-status）

### Task E.1：重写 commands/ddt.md 为可选向导

**Files:**
- Modify: `commands/ddt.md`
- Test: `tests/contract/command-prompt-contract.test.mjs`

- [ ] **Step 1：改 command-prompt 契约测试期望（RED）**

更新 `command-prompt-contract.test.mjs`：`/ddt` 期望不再含「强制路由/意图分类必须归类」字样；改为断言含「三种入口」「建议」「不拦截/可跳过」「指向 superpowers 原生链路」等向导语义关键词；任何旧路径 `docs/ssot` 字样断言改新路径。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tests/contract/command-prompt-contract.test.mjs`
Expected: FAIL。

- [ ] **Step 3：重写 `commands/ddt.md`（GREEN）**

新 prompt 要点（保留原 frontmatter 的 name/description 字段格式，按现有 command 文件约定）：
- 角色：**可选向导，给建议不拦截**。开发者可无视，直接用 superpowers 原生 skill。
- 解释三种入口（同 using-ddt）。
- 对用户自由文本：判断它更像 ① 局部想法（bug/重构/测试/性能/探索）→ 建议直接 `superpowers` 原生链路（bug 建议 `systematic-debugging`）；② 大需求（模糊/跨模块/大/多人）→ 建议先用 superpowers 链路产 `docs/requirements/` + `docs/briefs/`；③ 已有 brief → 建议 brainstorming → Design Checkpoint(`ddt-design-checkpoint`) → writing-plans。
- 明示「这是建议，非强制；要直接动手就动手」。
- 末尾建议跑 `/ddt-status` 看进度。
- **不得**出现「意图分类强制路由」「5 站」「必须先 spec」等强制流程口吻；不得出现 `docs/ssot`。

- [ ] **Step 4：跑测试确认通过 + commit**

Run: `node --test tests/contract/command-prompt-contract.test.mjs`
Expected: PASS。
```bash
git add commands/ddt.md tests/contract/command-prompt-contract.test.mjs
git commit -m "refactor: /ddt 路由器降为可选向导（不垄断入口）"
```

### Task E.2：核对 /ddt-status 命令读 .ddt 路径

**Files:**
- Modify（按需）: `commands/ddt-status.md`、`bin/ddt-status.mjs`（路径已在 A.3 迁移，这里只核对命令文档）
- Test: `tests/contract/command-prompt-contract.test.mjs`、`tests/unit/ddt-status.test.mjs`

- [ ] **Step 1：核对 ddt-status.md 无旧路径**

Run: `grep -nE "docs/ssot|docs/architecture" commands/ddt-status.md`
Expected: 空；非空则改为 `.ddt/decisions.jsonl` 等新路径。

- [ ] **Step 2：实跑 status 冒烟**

Run: `node bin/ddt-status.mjs 2>&1 | head -20`
Expected: 输出合法 JSON（`pending_decisions`/`slice_specs`/`slice_plans`/`in_progress_slices` 字段），读 `.ddt/decisions.jsonl` 不报错。

- [ ] **Step 3：commit（若有改动）**

```bash
git add commands/ddt-status.md && git commit -m "chore: /ddt-status 命令文档对齐 .ddt 路径"
```

---

## Phase F：最终校验（验收标准 §15 + Non-Goals §13）

### Task F.1：全量绿 + doctor 绿 + preflight 绿

- [ ] **Step 1：全量测试**

Run: `npm test 2>&1 | tail -10`
Expected: 全部 PASS（用例数 = 基线 − 删除的失效用例数；记录最终数字）。

- [ ] **Step 2：doctor + preflight**

Run: `node bin/ddt-doctor.mjs && echo "---" && node bin/ddt-hook-preflight.mjs; echo "exit=$?"`
Expected: doctor 全绿；preflight exit 0；doctor 注册 hook 列表 = `ddt:inject`/`ddt:enforce-pre`/`ddt:metrics-post`/`ddt:metrics-end`（4 个，无 Stop、无 charter-inject）。

### Task F.2：Non-Goals 负面清单机械扫描（§13）

- [ ] **Step 1：扫禁止概念**

Run:
```bash
grep -rniE "spec_kind|implementation_slice_spec|[a-z]+-slice\.md|ddt-router|ddt-design-materialize|ddt-design-integrate|强制 baseline|Arc 编号|ddt-impl-spec|ddt-frontend-craft|ddt-charter|docs/ssot|docs/architecture|5 站固定链|Iron Law" skills commands hooks bin docs/specs docs/plans | grep -v node_modules | grep -v "2026-05-22-ddt-superpowers-faithful-redesign"
```
Expected: **空输出**（spec/plan 文档自身在描述「删除」时会命中，已用 grep -v 排除本计划与设计 spec 文件名；若仍有命中，须为「解释性提及」而非「活引用」，逐条人工确认）。

- [ ] **Step 2：确认 13 skill 准确**

Run: `ls -1 skills/ | sort`
Expected: 恰好 13 个：9 vendored + `using-ddt` + `ddt-design-checkpoint` + `ddt-deliver` + `ddt-design-source`。无 `ddt-charter`/`ddt-design`/`ddt-impl-spec`/`ddt-frontend-craft`。

### Task F.3：验收标准逐条核对（§15）

- [ ] **Step 1：对照 spec §15 checklist 逐条打勾**

逐条核对 spec `docs/specs/2026-05-22-ddt-superpowers-faithful-redesign-design.md` §15 的 9 项，每项给出验证命令/文件证据。任何不满足项回到对应 Phase 修复。

- [ ] **Step 2：最终 commit + 汇报**

```bash
git add -A && git commit -m "test: Phase F 重设计全量验收通过（13 skills / 4 hooks / .ddt SSoT / 扁平 docs）" || echo "无待提交改动"
git log --oneline redesign/superpowers-faithful ^main | cat
```
向用户汇报：最终测试数、doctor 状态、提交列表、§15 验收逐条结果。**完成声明须基于实跑输出（IL-1 行为：evidence over claims）。**

---

## Self-Review（计划 vs spec 覆盖核对）

**1. Spec 覆盖：**
- §6 物理结构 + .ddt 迁移 → Phase A（A.1 gitignore/gitattributes，A.2–A.4 bins，A.5 doctor）✅
- §8 强制层 L2（4 hooks）→ Phase B（inject）+ Phase C（enforce IL-5 only，解绑 Stop，preflight=4）✅
- §2 charter→using-ddt + 法典解散 → Phase B.1 ✅
- §9 skill 13 + 删 2 + 重命名/reframe → Phase D ✅
- §6 ddt-design-checkpoint + 七问 → Phase D.2 + using-ddt（B.1）✅
- §10 command 向导化 → Phase E ✅
- §11 bins/doctor/contract-lint/preflight 连带 → Phase A/C/E ✅
- §13 Non-Goals → Phase F.2 机械扫描 ✅
- §15 验收 → Phase F.3 ✅

**2. Placeholder 扫描：** 无 TBD/TODO；机械迁移用「映射表 + 文件清单 + grep 验证」而非含糊措辞；高判断文件给完整内容（using-ddt、enforce、inject handler）。skill body 重写给「必含要点 + 自检 grep」约束（body 为有界 prose，frontmatter description 为被测契约已给定）。

**3. 类型/命名一致性：** hook id 全程 `ddt:inject`（非 charter-inject）；REQUIRED=4 集合在 C.2 与 F.1 一致；skill 数 13 在 D.4 与 F.2 一致；路径映射表全程唯一权威。

**已知风险（执行者注意）：**
- 测试用例数会**下降**（删了 IL-1/3/4/6 用例、失效 facts 用例、5 站用例）——这是预期，不是回归。F.1 记录最终数即可。
- Phase A 阶段 charter 文本仍含 `docs/ssot`（B 才重写）——只要 Phase A 的测试不断言 charter 路径即绿；若 `hook-charter-inject-contract` 断言了 charter 内具体路径，把该断言更新推迟到 Phase B.3 处理。
- 删 facts 函数前**必须** grep 确认零外部引用（C.3 Step 1），勿凭记忆删。

---

## Execution Handoff

计划已存到 `docs/plans/2026-05-22-ddt-superpowers-faithful-redesign.md`。两种执行方式：

**1. Subagent-Driven（推荐）** — 每 task 派新 subagent，task 间两段式 review（spec 合规 + 代码质量），快速迭代。

**2. Inline Execution** — 本会话内用 executing-plans，分批执行带人工 checkpoint。

选哪种？
