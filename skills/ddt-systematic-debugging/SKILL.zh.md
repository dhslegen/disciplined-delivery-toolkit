---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# 系统化调试（Systematic Debugging）

## 概述

随手乱修浪费时间，还会制造新 bug。快速补丁会掩盖背后的真问题。

**核心原则：** **永远**先找到根因，再尝试修复。修症状 = 失败。

**违反这套流程的"字面"，就是在违反调试的"精神"。**

## 铁律

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

没完成 Phase 1，你不许提出修复方案。

## 何时使用

任何技术问题都用：
- 测试失败
- 生产 bug
- 行为异常
- 性能问题
- 构建失败
- 集成问题

****特别**适合在这些时候用：**
- 时间压力大时（紧急关头最容易诱发瞎猜）
- "就这么一个快修"看起来很显然
- 你已经试过多次修复
- 上一次修复没奏效
- 你对问题理解还没到位

**这些时候**不要**跳过：**
- 问题看起来简单（简单 bug 也有根因）
- 你在赶时间（赶时间保证返工）
- 经理要求"现在"修好（系统化比胡冲胡撞快）

## 四个阶段

每一阶段都**必须**完成，才能进下一阶段。

### Phase 1：根因调查

**在尝试任何修复之前：**

1. **仔细读错误信息**
   - 不要跳过错误或警告
   - 它们经常**直接**给出答案
   - 把 stack trace 读完
   - 记下行号、文件路径、错误码

2. **稳定复现**
   - 你能可靠触发它吗？
   - 精确步骤是什么？
   - 每次都会出现吗？
   - 不能复现 → 多搜集证据，**不要瞎猜**

3. **看近期改动**
   - 哪些改动可能导致它？
   - git diff、最近的 commits
   - 新依赖、配置变更
   - 环境差异

4. **多组件系统里搜集证据**

   **当系统含多个组件时（CI → build → signing，API → service → database）：**

   **在提修复之前，先加诊断探针：**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **示例（多层系统）：**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **这会暴露：** 哪一层失败（secrets → workflow ✓，workflow → build ✗）

5. **追踪数据流**

   **当错误埋在调用栈深处时：**

   完整的反向追溯技巧见本目录 `root-cause-tracing.md`。

   **简版：**
   - 坏值从哪里产生？
   - 谁带着坏值调用了它？
   - 一直往上追，找到源头
   - 在源头修，而不是在症状处修

### Phase 2：模式分析

**先找模式，再动手修：**

1. **找正常的样例**
   - 在同一代码库里找类似的"工作正常"的代码
   - 与现在坏掉的部分类似、但能跑的部分是什么？

2. **对照参考实现**
   - 在套用某种 pattern 时，**完整**读参考实现
   - 不要扫读——每一行都读
   - 完全理解模式之后再应用

3. **找差异**
   - 能跑 vs 不能跑，差别在哪？
   - 每一处差异都列出来，再小也列
   - 不要假设"那不可能有影响"

4. **理解依赖**
   - 它还需要哪些组件？
   - 它需要哪些设置 / 配置 / 环境？
   - 它做了哪些假设？

### Phase 3：假设与测试

**科学方法：**

1. **形成**单个**假设**
   - 清楚陈述："I think X is the root cause because Y"
   - 写下来
   - 具体，不要含糊

2. **以最小变更测试**
   - 做**最小**的改动来验证假设
   - 一次只改一个变量
   - 不要一次性修一堆东西

3. **继续之前先验证**
   - 起效了？是 → 进 Phase 4
   - 没起效？提**新**假设
   - **不要**在上头再叠修复

4. **当你不懂时**
   - 直说："I don't understand X"
   - 不要装懂
   - 求助
   - 多研究

### Phase 4：实施

**修根因，不修症状：**

1. **写一个失败的测试用例**
   - 最简化的复现
   - 能自动化就自动化
   - 没框架就写一次性脚本
   - 修之前**必须**有它
   - 用 `superpowers:test-driven-development` skill 来写正经的失败测试

2. **实施单一修复**
   - 针对已识别的根因
   - 一次**一个**改动
   - 没有"反正我都在这了"顺手改
   - 不许打包式重构

3. **验证修复**
   - 测试现在过了？
   - 其它测试没被搞坏？
   - 问题真的被解决了？

4. **修不好怎么办**
   - 停
   - 数一下：你已经试了多少次？
   - < 3 次：回 Phase 1，带着新信息重新分析
   - **≥ 3 次：停下，质疑架构（见下面第 5 步）**
   - **不要**在没有架构讨论的情况下尝试"第 4 次修复"

5. **3 次以上修复都失败时：质疑架构**

   **架构问题的征兆：**
   - 每次修复都在**不同位置**暴露新的共享状态 / 耦合 / 问题
   - 修复需要"大改"才能落地
   - 每次修复在别处催生新症状

   **停下，质疑根本：**
   - 这个 pattern 本身合理吗？
   - 我们是不是"靠惯性硬撑"？
   - 是该重构架构，还是继续修症状？

   **再尝试更多修复之前，先和你的人类搭档讨论**

   这不是"假设错了"——这是"架构错了"。

## 红旗 —— 停，回到流程

如果你抓到自己在想：
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- 在追踪数据流之前就提方案
- **"再试最后一次修复"（在已经试过 2 次以上时）**
- **每次修复都在**不同位置**暴露新问题**

**这些**全部**意味着：停。回 Phase 1。**

**3 次以上修复都失败：** 质疑架构（见 Phase 4.5）

## 你的"人类搭档"在告诉你"路走偏了"的信号

**留意这些"扭转方向"的提示：**
- "Is that not happening?" —— 你没验证就假设了
- "Will it show us...?" —— 你本该加证据收集
- "Stop guessing" —— 你在不理解的情况下提方案
- "Ultrathink this" —— 质疑根本，而不是症状
- "We're stuck?"（带挫败感）—— 你的路径不奏效

**看到这些：停。回 Phase 1。**

## 常见合理化

| 借口 | 现实 |
|--------|---------|
| "Issue is simple, don't need process" | 简单问题也有根因。流程对简单 bug 也很快。 |
| "Emergency, no time for process" | 系统化调试**比**胡冲胡撞**更快**。 |
| "Just try this first, then investigate" | 第一次修复定了基调。一开始就做对。 |
| "I'll write test after confirming fix works" | 没测过的修复不持久。先写测试才能证明。 |
| "Multiple fixes at once saves time" | 没法判断是哪一项起的作用。还会引入新 bug。 |
| "Reference too long, I'll adapt the pattern" | 半懂不懂就保证出 bug。完整读。 |
| "I see the problem, let me fix it" | 看见症状 ≠ 理解根因。 |
| "One more fix attempt"（已经失败 2+ 次） | 3+ 次失败 = 架构问题。质疑模式，别再叠修复。 |

## 速查

| 阶段 | 关键活动 | 成功标准 |
|-------|---------------|------------------|
| **1. 根因** | 读错误、复现、看改动、收证据 | 弄清楚**是什么**、**为什么** |
| **2. 模式** | 找正常样例、对比 | 找出差异 |
| **3. 假设** | 提理论、最小化测试 | 被证实或得到新假设 |
| **4. 实施** | 写测试、修复、验证 | bug 已解、测试通过 |

## 当流程显示"无根因"时

如果系统调查显示问题确实是环境性、时序性或外部性的：

1. 你已走完流程
2. 把你调查的内容文档化
3. 实施合适的处理（重试、超时、错误信息）
4. 加监控 / 日志为日后调查做准备

**但是：** 95% 的"无根因"案例都是**调查不彻底**。

## 配套技巧

这些技巧属于系统化调试体系，可在本目录中查阅：

- **`root-cause-tracing.md`** —— 沿调用栈反向追溯，找到最初触发点
- **`defense-in-depth.md`** —— 找到根因后在多层加校验
- **`condition-based-waiting.md`** —— 把任意超时替换成"等条件"

**相关 skill：**
- **superpowers:test-driven-development** —— 用于 Phase 4 第 1 步的"写失败测试"
- **superpowers:verification-before-completion** —— 宣告成功之前先验证修复奏效

## 真实战果

来自多次调试场景：
- 系统化路径：15-30 分钟修好
- 乱修路径：2-3 小时打地鼠
- 一次修对率：95% vs 40%
- 引入新 bug：几乎为零 vs 司空见惯
