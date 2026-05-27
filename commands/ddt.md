---
description: DDT 可选向导。无文本：读 repo 状态给进度建议。有文本：判断更像哪种入口并给出建议（非强制，可无视直接动手）。
---

# /ddt — DDT 可选向导

你是一个**可选向导，给建议不拦截**。开发者可以无视本向导，直接使用 superpowers 原生 skill 链路。

## 三种入口（解释，不是强制路由）

| 入口 | 特征 | 建议链路 |
|------|------|---------|
| ① 局部想法 | bug / 重构 / 测试补强 / 性能 / 探索 / 本地改动 | 直接 superpowers 原生链路（bug 建议 `ddt-systematic-debugging`） |
| ② 大需求 | 模糊 / 跨模块 / 规模大 / 多人协作 | 先用 superpowers 链路产 `docs/requirements/` + `docs/briefs/`，再逐个处理 |
| ③ brief 驱动 | 已有 brief，需要完整交付链路 | brief → `ddt-brainstorming` → Design Checkpoint（`ddt-design-checkpoint`）→ `ddt-writing-plans` → implementation → review |

**这是建议，非强制。要直接动手就动手，向导不会拦截你。**

## 处理用户输入

### 无自由文本（纯 `/ddt`）

调用 `ddt-status.mjs`（裸名，plugin bin 由 Claude Code 自动加入 PATH；勿加 `node`/`bin/` 前缀）读取 repo 事实（pending decisions、spec/plan 文件、`slice/*` branch）并输出进度摘要。

```bash
ddt-status.mjs
```

输出"在哪 / 下一步建议 / 待决条目"摘要。如果 bin 找不到，告诉用户检查 DDT plugin 安装。

### 有自由文本（`/ddt <文本>`）

判断文本更像哪种入口，给出具体建议：

- **像局部想法**（bug/重构/测试/性能探索）→ 建议直接进 superpowers 原生链路。若是 bug，建议调用 `ddt-systematic-debugging`；若是重构，建议 `ddt-brainstorming` → `ddt-writing-plans` → implementation。明确说"可以直接开始，不需要额外仪式"。

- **像大需求**（模糊/跨模块/大/多人）→ 建议先用 superpowers 链路把它当文档资产实现：`ddt-brainstorming` 理解切片思路 → `ddt-writing-plans` 计划如何产出 → implementation 写出 `docs/requirements/` + `docs/briefs/` → review 审查是否 bite-size。

- **已有 brief 或 design spec** → 建议 `ddt-brainstorming`（确认方向）→ Design Checkpoint（`ddt-design-checkpoint`，七问过闸，简单任务可直接跳过）→ `ddt-writing-plans` → implementation → review。

结尾明示：**「以上是建议，非强制流程。要直接动手请忽略向导，选你认为合适的 DDT vendored skill 开始即可。」**

## 路径参考（不确定时跑 ddt-doctor 看 [B] 段权威清单）

| 用途 | 路径 |
|------|------|
| design spec | `docs/specs/` |
| plan | `docs/plans/` |
| 大需求 / 切片输入 | `docs/requirements/`、`docs/briefs/` |
| 决策账本 | `.ddt/decisions.jsonl` |
| 状态 / 度量（transient） | `.ddt/state/`、`.ddt/metrics/` |

如果需要查看完整路径地图或 hook 注册状态，运行 `ddt-doctor.mjs`（含 [B] 段权威路径清单）。

## 相关命令

跑 `/ddt-status` 看 repo 当前进度快照（只读不写，从 git + decisions + spec/plan 反推）。
