---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# 执行计划（Executing Plans）

## 概述

加载计划、批判性评审、执行所有任务、完成后报告。

**开始时声明：** "I'm using the executing-plans skill to implement this plan."

**注意：** 告诉你的人类搭档，Superpowers 在能用 subagent 的环境里表现要好得多。在支持 subagent 的平台（如 Claude Code 或 Codex）上跑，质量会明显更高。如果可用 subagent，请改用 superpowers:subagent-driven-development，而不是本 skill。

## 流程

### 第 1 步：加载并评审计划
1. 读计划文件
2. 批判性评审——记下任何问题或顾虑
3. 如有顾虑：开始前先和你的人类搭档提出
4. 如无顾虑：建好 TodoWrite，继续

### 第 2 步：执行任务

对每个任务：
1. 标记为 in_progress
2. 严格按每一步执行（计划已切成一口一个的步骤）
3. 按指定方式跑验证
4. 标记为 completed

### 第 3 步：完成开发

所有任务完成并验证之后：
- 声明："I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- 按该 skill 验证测试、给出选项、执行选择

## 何时停下来求助

**立即停止执行的情况：**
- 撞上阻碍（缺依赖、测试失败、指令不清）
- 计划有关键缺口，导致无法启动
- 你看不懂某条指令
- 验证反复失败

**宁可澄清，也不要瞎猜。**

## 何时回到前面的步骤

**回到评审（第 1 步）的情况：**
- 搭档根据你的反馈更新了计划
- 根本方法需要重新考虑

**不要硬闯阻碍** —— 停下，问。

## 切记
- 先批判性评审计划
- 严格按计划步骤来
- 不要跳过验证
- 计划要求引用某 skill 时，照做
- 卡住就停，不要瞎猜
- 在没有用户明确同意之前，**绝不要**在 main/master 分支上开始实现

## 集成

**必备工作流 skill：**
- **superpowers:using-git-worktrees** —— 保证有隔离的工作区（创建或验证已存在）
- **superpowers:writing-plans** —— 创建本 skill 所执行的计划
- **superpowers:finishing-a-development-branch** —— 任务全部完成后收尾开发
