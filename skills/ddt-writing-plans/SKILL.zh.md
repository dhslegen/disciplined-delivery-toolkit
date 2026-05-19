---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# 编写计划（Writing Plans）

## 概述

编写全面的实现计划时，要假设接手的工程师对我们的代码库一无所知，品味也未必靠谱。把他们需要知道的一切都写进文档：每个任务要改哪些文件、代码长什么样、怎么测试、可能要查阅哪些文档、怎么验证。把整份计划切成一口一个的小任务交给他们。遵循 DRY、YAGNI、TDD、频繁提交。

假设他们是熟练的开发者，但对我们的工具链和问题领域几乎一无所知；也假设他们并不太懂好的测试设计。

**开始时声明：** "I'm using the writing-plans skill to create the implementation plan."

**上下文：** 如果在隔离的 worktree 中工作，应该已经在执行时通过 `superpowers:using-git-worktrees` 技能创建好了。

**计划保存位置：** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- （用户自定义的计划位置偏好优先于此默认值）

## 范围检查

如果 spec 覆盖了多个独立的子系统，本应在头脑风暴阶段就被拆成子项目 spec。如果没拆，建议把它分成多个独立的计划——每个子系统一份。每份计划都应能独立产出可运行、可测试的软件。

## 文件结构

定义任务之前，先梳理清楚哪些文件会被创建或修改，以及每个文件各自负责什么。这一步把分解决策锁定下来。

- 划分单元时要有清晰边界和明确接口。每个文件只承担一个职责。
- 你对能一次装进上下文的代码推理得最好，文件聚焦时编辑也更可靠。优先选用小而专的文件，避免一个文件做太多事。
- 一起变化的文件要放在一起。按职责拆分，而非按技术分层拆分。
- 在已有代码库中，遵循既有模式。如果代码库习惯用大文件，不要单方面重构——但如果你正在修改的文件已经膨胀到难以管理，把拆分纳入计划是合理的。

这个结构会指导任务分解。每个任务应产出自洽的变更，单独看也讲得通。

## 一口一个的任务粒度

**每一步都是一个动作（2-5 分钟）：**
- "写一个会失败的测试" - 一步
- "运行它，确认它确实失败" - 一步
- "实现让测试通过的最小代码" - 一步
- "再次运行测试，确认通过" - 一步
- "提交" - 一步

## 计划文档头

**每份计划都必须以这个头开头：**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## 任务结构

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## 不许有占位符

每一步都必须包含工程师真正需要的内容。以下这些都是**计划写废的信号**——绝对不要写：
- "TBD"、"TODO"、"implement later"、"fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above"（却不给出具体测试代码）
- "Similar to Task N"（重复写出代码——工程师可能不按顺序读任务）
- 只描述要做什么、却不展示怎么做的步骤（涉及代码的步骤必须给出代码块）
- 引用了任何任务里都没定义过的类型、函数或方法

## 切记
- 始终给出精确的文件路径
- 每一步都包含完整的代码——如果某步要改代码，就把代码摆出来
- 精确的命令和预期输出
- DRY、YAGNI、TDD、频繁提交

## 自审

完整写好计划后，用新鲜的眼睛回看 spec，并对照计划检查。这是你自己跑的清单——不要派 subagent 去做。

**1. Spec 覆盖：** 通读 spec 的每个章节/需求。能否指出某个任务在实现它？把缺口列出来。

**2. 占位符扫描：** 在计划里搜索红旗——上面"不许有占位符"一节列出的所有模式。找到就改。

**3. 类型一致性：** 后续任务里用的类型、方法签名、属性名是否和早先任务定义的一致？Task 3 里叫 `clearLayers()`、Task 7 里却写成 `clearFullLayers()` 就是 bug。

如果发现问题，就地修复。不必再走一轮 review——改完往下走即可。如果发现某条 spec 需求没有对应任务，加上这个任务。

## 执行交接

保存计划后，给出执行方式的选择：

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**如果选 Subagent-Driven：**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- 每个任务派一个全新 subagent + 两阶段评审

**如果选 Inline Execution：**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- 批量执行，在 checkpoint 处做评审
