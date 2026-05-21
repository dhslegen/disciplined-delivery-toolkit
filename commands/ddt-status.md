---
description: DDT v1.0 只读重算。从 repo 事实（git 历史+decisions+文件存在性）计算"在哪/下一步/挂着哪些 pending/当前效能快照"，不推进不改任何东西。
---

# /ddt-status — 只读状态重算

执行以下流程，**仅读不写**。

## 1. 重算事实

**调 plugin 内置 `ddt-status.mjs`**（DDT 把 `bin/` 自动加入 Bash PATH，并设置 `$CLAUDE_PLUGIN_ROOT`）。

按以下优先级用 Bash 工具执行（哪个跑通用哪个）：

```bash
# 优先：plugin bin 已注入 PATH，直接调用
ddt-status.mjs 2>/dev/null \
  || node "${CLAUDE_PLUGIN_ROOT:?需 plugin 环境}/bin/ddt-status.mjs"
```

输出 JSON 结构：
- `pending_decisions`：未 resolved 的 pending 决策记录
- `slice_specs`：`docs/specs/` 下存在的 spec 文件
- `slice_plans`：`docs/plans/` 下存在的 plan 文件

**如果都失败**（找不到 plugin bin），明确告诉用户："DDT plugin 未正确安装或未启用。检查 `/plugin list` 是否含 `disciplined-delivery-toolkit`"，**不要降级到自己读 repo 模拟事实**——那会让 IL-7（事实不可篡改）失去意义。

## 2. 反推进度（IL-7 落点）

按 spec §3：进度从 git trailer + decisions + spec/plan 文件存在性**反推**，不信会话自述。

用 Bash 工具调 `git log --pretty='%B' -n 20` 解析最近 commit 的 trailer（`stage:`、`slice:`、`task:`、`evidence-ref:`），归纳"最近活动落在哪个站、哪个切片、哪个任务"。

## 3. 人话摘要

按以下结构输出：

```
DDT v1.0 状态（从 repo 事实反推）
=================================
最近活动：<stage>/<slice>/<task>（commit <SHA> at <date>）
待决闸门（<n> 条）：
  - <gate> 由 <owner_role> 裁决，criteria: <decision_criteria>
切片 spec：<n> 份（<列表>）
切片 plan：<n> 份（<列表>）
下一步建议：<根据脊柱推理>
效能快照（待 Plan 5 激活完整 ROI）：本 plan 仅显示 "metrics layer pending"
```

## 4. 不推进、不改、不打断

本命令**绝不**写任何文件、绝不调 `.ddt/state/current.json`、绝不路由到 skill。仅输出文本给用户。
