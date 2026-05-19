# 代码质量审 Subagent Prompt 模板

派发"代码质量审"subagent 时使用此模板。

**用途：** 验证实现是否"做得好"（干净、有测试、可维护）。

**只有 spec 合规审已通过后才能派发本审。**

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

**除了常规代码质量问题，reviewer 还应检查：**
- 每个文件是否只承担一个清晰职责，且接口定义良好？
- 单元是否拆分到可独立理解、独立测试？
- 实现是否遵循计划中的文件结构？
- 这次改动是否制造出"已经很大的新文件"，或让现有文件膨胀显著？（不要去标已存在的文件大小——只关注本次变更的贡献。）

**代码 reviewer 返回：** Strengths、Issues（Critical/Important/Minor）、Assessment
