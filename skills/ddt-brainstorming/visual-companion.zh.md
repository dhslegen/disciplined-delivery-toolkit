# Visual Companion 使用指南

基于浏览器的可视化头脑风暴助手，用来展示 mockup、图表和选项。

## 何时使用

**按问题决定**，不要按会话决定。判据：**用户"看见"会比"读到"更容易理解吗？**

**走浏览器** —— 当内容本身是视觉的：

- **UI mockup** —— 线框、布局、导航结构、组件设计
- **架构图** —— 系统组件、数据流、关系图
- **并列视觉对比** —— 两个布局、两套配色、两种设计方向之间的对比
- **设计打磨** —— 问题是关于"观感、间距、视觉层级"
- **空间关系** —— 状态机、流程图、ER 图等需要图形渲染的内容

**走终端** —— 当内容是文本或表格类：

- **需求与范围类问题** —— "X 是什么意思？"、"哪些功能在范围内？"
- **概念性 A/B/C 选择** —— 在用文字描述的方案之间选
- **权衡列表** —— 优缺点、对比表
- **技术决策** —— API 设计、数据建模、架构方案选择
- **澄清问题** —— 任何答案是"文字"而非"视觉偏好"的内容

一个"关于 UI 话题"的问题不自动是"视觉问题"。"你想要哪种向导？"是概念问题——用终端。"哪种向导布局感觉对？"是视觉问题——用浏览器。

## 工作原理

服务器监听一个目录里的 HTML 文件，并把"最新的那个"提供给浏览器。你把 HTML 写到 `screen_dir`，用户在浏览器里看到并可以点击选择；选择会被记录到 `state_dir/events`，你在下一轮读它。

**内容片段 vs 完整文档：** 如果你的 HTML 文件以 `<!DOCTYPE` 或 `<html` 开头，服务器原样提供（只注入 helper script）。否则，服务器会自动用 frame 模板包裹你的内容——加上 header、CSS 主题、选择指示器以及所有交互所需基础设施。**默认写内容片段。** 只有在需要完全控制整页时才写完整文档。

## 启动会话

```bash
# Start server with persistence (mockups saved to project)
scripts/start-server.sh --project-dir /path/to/project

# Returns: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/content",
#           "state_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/state"}
```

从返回中取出 `screen_dir` 和 `state_dir` 保存好。让用户打开 URL。

**查找连接信息：** 服务器会把启动 JSON 写到 `$STATE_DIR/server-info`。如果你把服务器放到后台运行且没捕获 stdout，去读这个文件就能拿到 URL 和端口。用了 `--project-dir` 时，session 目录在 `<project>/.superpowers/brainstorm/` 下。

**注意：** 用 `--project-dir` 把项目根传进去，mockup 才会持久化到 `.superpowers/brainstorm/` 并能在服务器重启后保留。不传它时文件会落到 `/tmp` 并被清理。提醒用户把 `.superpowers/` 加进 `.gitignore`（如果还没加过）。

**按平台启动服务器：**

**Claude Code (macOS / Linux)：**
```bash
# Default mode works — the script backgrounds the server itself
scripts/start-server.sh --project-dir /path/to/project
```

**Claude Code (Windows)：**
```bash
# Windows auto-detects and uses foreground mode, which blocks the tool call.
# Use run_in_background: true on the Bash tool call so the server survives
# across conversation turns.
scripts/start-server.sh --project-dir /path/to/project
```
通过 Bash 工具调用时，把 `run_in_background: true` 打开。下一轮再读 `$STATE_DIR/server-info` 拿 URL 和端口。

**Codex：**
```bash
# Codex reaps background processes. The script auto-detects CODEX_CI and
# switches to foreground mode. Run it normally — no extra flags needed.
scripts/start-server.sh --project-dir /path/to/project
```

**Gemini CLI：**
```bash
# Use --foreground and set is_background: true on your shell tool call
# so the process survives across turns
scripts/start-server.sh --project-dir /path/to/project --foreground
```

**其他环境：** 服务器必须能跨对话轮次保持在后台运行。如果你所在环境会回收分离进程，用 `--foreground` 并用你平台特有的后台执行机制启动这条命令。

如果浏览器从你的网络访问不到该 URL（远程 / 容器化环境很常见），绑定一个非 loopback host：

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

用 `--url-host` 控制返回的 URL JSON 里打印的 hostname。

## 主循环

1. **确认服务器还活着**，再**写 HTML** 到 `screen_dir` 里的新文件：
   - 写之前确认 `$STATE_DIR/server-info` 存在。如果不在（或 `$STATE_DIR/server-stopped` 存在），说明服务器已停——先用 `start-server.sh` 重启再继续。服务器空闲 30 分钟后会自动退出。
   - 用语义化文件名：`platform.html`、`visual-style.html`、`layout.html`
   - **永远不要复用文件名** —— 每个画面用新文件
   - 用 Write 工具 —— **永远不要用 cat/heredoc**（会把垃圾刷到终端）
   - 服务器自动提供最新文件

2. **告知用户要看什么，并结束这一轮：**
   - 提醒 URL（每一步都提醒，不是只提一次）
   - 简短文字概括屏幕上的内容（例："Showing 3 layout options for the homepage"）
   - 让用户在终端回复："Take a look and let me know what you think. Click to select an option if you'd like."

3. **下一轮** —— 用户在终端回复之后：
   - 如果存在 `$STATE_DIR/events`，读它——里面是用户在浏览器里的交互（点击、选择），按 JSON Lines 一行一条
   - 把它和用户的终端文字合起来形成完整画面
   - 终端消息是主要反馈；`state_dir/events` 提供结构化交互数据

4. **迭代或推进** —— 若反馈是要改当前屏幕，写新文件（如 `layout-v2.html`）。只有当前步骤确认通过，才进入下一个问题。

5. **回到终端时卸载** —— 当下一步不再需要浏览器（例如澄清问题、讨论权衡），推一个等候屏来清掉残留内容：

   ```html
   <!-- filename: waiting.html (or waiting-2.html, etc.) -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">Continuing in terminal...</p>
   </div>
   ```

   这样用户不会盯着一个已经定下来的选择看，而对话却往后走了。下一次出现视觉问题时，照常推新的内容文件即可。

6. 重复直到结束。

## 编写内容片段

只写"页面里的内容"。服务器会自动把它包进 frame 模板（header、主题 CSS、选择指示器、所有交互基础设施）。

**最简示例：**

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

就这样。**不需要** `<html>`、CSS、`<script>` 标签。服务器全包了。

## 可用的 CSS 类

frame 模板为你的内容提供了这些 CSS 类：

### Options（A/B/C 选项）

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

**多选：** 给容器加 `data-multiselect`，用户就能多选。点一次切换一次。指示器条会显示当前选数。

```html
<div class="options" data-multiselect>
  <!-- same option markup — users can select/deselect multiple -->
</div>
```

### Cards（视觉设计）

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup content --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### Mockup 容器

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body"><!-- your mockup HTML --></div>
</div>
```

### Split view（并列视图）

```html
<div class="split">
  <div class="mockup"><!-- left --></div>
  <div class="mockup"><!-- right --></div>
</div>
```

### Pros/Cons

```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div>
</div>
```

### Mock elements（线框积木）

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display: flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
<div class="placeholder">Placeholder area</div>
```

### 排版与板块

- `h2` —— 页面标题
- `h3` —— 章节标题
- `.subtitle` —— 标题下方的副标题文本
- `.section` —— 带下边距的内容块
- `.label` —— 小号大写标签文字

## 浏览器事件格式

用户在浏览器里点击选项时，他们的交互会被记录到 `$STATE_DIR/events`（每行一个 JSON 对象）。你每次推一个新画面时，文件会被自动清空。

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Complex Grid","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

完整事件流揭示了用户的探索轨迹——在敲定前他们可能点过好几个选项。最后一条 `choice` 事件通常是最终选择，但点击的模式能透露出值得追问的"犹豫"或"偏好"。

如果 `$STATE_DIR/events` 不存在，说明用户没和浏览器交互——只用他们的终端文字即可。

## 设计建议

- **把保真度匹配到问题** —— 布局问题用线框，打磨问题做精细
- **每页都写清问题** —— "Which layout feels more professional?" 而不是只写 "Pick one"
- **推进前先迭代** —— 反馈是要改当前屏幕，就写新版本
- 每屏**最多 2-4 个选项**
- **关键处用真实内容** —— 摄影作品集就用真图（如 Unsplash）。占位内容会掩盖设计问题。
- **mockup 保持简洁** —— 关注布局与结构，而不是像素级完美

## 文件命名

- 用语义化名字：`platform.html`、`visual-style.html`、`layout.html`
- 永远不要复用文件名 —— 每个画面必须是新文件
- 迭代时附版本后缀，如 `layout-v2.html`、`layout-v3.html`
- 服务器按修改时间提供"最新"文件

## 收尾清理

```bash
scripts/stop-server.sh $SESSION_DIR
```

如果会话用了 `--project-dir`，mockup 文件会保留在 `.superpowers/brainstorm/` 供后续参考。只有 `/tmp` 的会话在停止时被删除。

## 参考

- Frame 模板（CSS 参考）：`scripts/frame-template.html`
- Helper 脚本（客户端）：`scripts/helper.js`
