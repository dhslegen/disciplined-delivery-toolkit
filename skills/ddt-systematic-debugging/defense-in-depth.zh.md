# 纵深防御式校验（Defense-in-Depth Validation）

## 概述

当你修一个由"非法数据"引起的 bug 时，单点加校验感觉够用。但那个单点会被不同代码路径、被重构、被 mock 绕过去。

**核心原则：** 在数据流经的**每一层**都做校验。让 bug 在结构上不可能发生。

## 为什么要多层

单层校验：" We fixed the bug."
多层校验：" We made the bug impossible."

每一层抓到的是不同情况：
- 入口校验抓住绝大多数 bug
- 业务逻辑抓住边界 case
- 环境守卫挡住上下文相关的危险
- Debug 日志在其他层失守时兜底

## 四层

### 第 1 层：入口校验
**目的：** 在 API 边界拒掉明显非法的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}
```

### 第 2 层：业务逻辑校验
**目的：** 确保数据对当前操作"讲得通"

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ... proceed
}
```

### 第 3 层：环境守卫
**目的：** 在特定上下文里挡住危险操作

```typescript
async function gitInit(directory: string) {
  // In tests, refuse git init outside temp directories
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }
  // ... proceed
}
```

### 第 4 层：调试探针
**目的：** 留下"取证"用的上下文

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

## 怎么用这个模式

发现 bug 时：

1. **追踪数据流** —— 坏值从哪里产生？在哪里被用？
2. **画出所有检查点** —— 列出数据流经的每一处
3. **在每层加校验** —— 入口、业务、环境、调试
4. **每层都测一遍** —— 试着绕过第 1 层，验证第 2 层能否兜住

## 真实示例

Bug：空 `projectDir` 导致在源码里执行了 `git init`

**数据流：**
1. 测试 setup → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 跑在 `process.cwd()` 下

**加上的四层防御：**
- 第 1 层：`Project.create()` 校验非空 / 存在 / 可写
- 第 2 层：`WorkspaceManager` 校验 projectDir 非空
- 第 3 层：`WorktreeManager` 在测试环境下拒绝 tmpdir 之外的 git init
- 第 4 层：git init 前打 stack trace 日志

**结果：** 1847 个测试全过，bug 不可能复现

## 关键洞察

四层缺一不可。测试阶段，每一层都抓到了别人漏掉的 bug：
- 不同代码路径绕过了入口校验
- mock 绕过了业务逻辑校验
- 不同平台的边界 case 需要环境守卫
- 调试日志暴露了结构性的误用

**不要止于单点校验。** 每一层都加上检查。
