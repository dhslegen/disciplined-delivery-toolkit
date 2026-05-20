---
name: ddt-frontend-craft
description: Use when the frontend slice does NOT route through ddt-design-source (external loop disabled) — produce production-grade frontend code directly bound to the OpenAPI contract, with full state coverage, accessibility, and resistance to "generic AI aesthetic".
---

# ddt-frontend-craft — 前端直出（外部回路未启用时）

当前端切片不走 `ddt-design-source` 外部收敛回路时，本 skill 是 `ddt-writing-plans` + `ddt-subagent-driven` 在 implement 步实际产出前端代码所遵循的纪律。

## 何时使用

- `tech-stack.json` `ai_design=false` 或切片 spec 判定不需外部回路（如内部管理后台、纯表单页）
- 已有设计 token 体系且页面属"contract-driven 数据展示+交互"非"品牌敏感新视觉"
- 客户无 Figma / v0 偏好，DDT 自行决定如何出前端

## 四项纪律（每项均可被 Spec Reviewer 引证审查）

### 1. 契约绑定

- 所有数据请求/响应类型从 `ddt-design` 产出的 OpenAPI 契约生成（避免手写 TypeScript 类型偏离）
- 字段名严格用契约定义的命名，禁前端层自创字段（IL-4 越级私改：私改即漂移）
- 表单校验规则与契约约束（minLength/format/enum）一致

### 2. 状态完备

每个数据驱动组件**必须**覆盖四态：
- **loading**：未到数据期间的骨架/加载视图，非空白屏
- **empty**：数据空集的明确提示，非 0 行的死表格
- **error**：每个契约错误码对应可恢复或可上报的视觉与文案，非 alert
- **success**：正常数据态

Spec Reviewer 会逐条核四态，缺一即 FAIL。

### 3. 无障碍（WCAG 2.1 AA 起步）

- 语义化 HTML（`button` 用 `<button>` 不 `<div onClick>`）
- 键盘可达（所有交互可 Tab 到+回车/空格触发）
- 颜色对比 AA（4.5:1 文字、3:1 大文字与图形组件）
- 表单 label-input 关联（`for`/`id` 或 ARIA）
- 状态变更的 `aria-live`/`role="status"`/`aria-busy`

### 4. 反"AI 通用感"

防止产出"看起来像 AI 拼的"千篇一律页面：
- **不要默认 shadcn/Material 全套裸用**：在 token 体系（间距、圆角、阴影、颜色）上做项目级一致校准
- **不要 emoji 当图标**：用项目图标集；缺则申请 design-source 流程加入 token
- **不要 lorem ipsum**：占位用真实业务领域词或显式 `TODO: 内容待 PM 补充`
- **不要无信息密度填充**：避免大段无意义介绍文案；尊重 PRD 真实场景的信息层级

## HARD-GATE

- 上游：切片 spec（`ddt-impl-spec` 产物）批准且明确"使用 ddt-frontend-craft 直出"
- 实现：plan 步（`ddt-writing-plans`）的 task 必须以本 skill 四纪律为引证产 task 完整代码
- 下游：implement 步（`ddt-subagent-driven`）的 Quality Reviewer 须按上面四纪律逐条核（cited_evidence 含实际文件:行）

## 与其他 skill 的互引

- 上游：`ddt-design`（契约源）、`ddt-impl-spec`（切片 spec）
- 同位：`ddt-design-source`（外部回路启用时替代本 skill）
- 实现编排：`ddt-writing-plans` + `ddt-subagent-driven`
- 审查：`ddt-requesting-review` + Quality Reviewer prompt

---

> **DDT 强制层声明**：若 DDT 强制层 hook 未注册/未运行，本 skill 纪律降级为建议级（spec 洞4）。完成/通过声明须显式标注「未受强制层校验」。
