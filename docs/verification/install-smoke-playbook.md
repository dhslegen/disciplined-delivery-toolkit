# DDT 安装冒烟测试剧本（轻量）

> 目标：真实安装最新 DDT 后，~5 分钟验证三大机制成立：
> ① using-ddt 取向注入（经 SessionStart hook 注入）
> ② bin 脚本裸名执行（plugin bin/ 自动入 PATH，cwd 无关）
> ③ hook 注册 + 被动度量埋点。
>
> DDT 无强制层、不拦截任何工具调用——纪律靠 skill 被 invoke，同 superpowers。
>
> 关键：**全程在一个"全新的测试项目目录"里做，不是在插件仓库里**——只有这样才能真正验证"用户项目 cwd 没有 bin/"的部署场景。

---

## 0. 安装 / 更新到最新版

在任意 Claude Code 会话里：

```
# 首次：注册 marketplace
/plugin marketplace add dhslegen/disciplined-delivery-toolkit
# 已装过：更新到最新
/plugin marketplace update disciplined-delivery-toolkit

/plugin install disciplined-delivery-toolkit@disciplined-delivery-toolkit
```

装完 **务必重启 Claude Code 会话**——SessionStart hook 注入与 plugin bin/ 的 PATH 注入都在会话启动时生效。

```
/plugin list
```
确认列表里 `disciplined-delivery-toolkit` 为 enabled。

> ⚠️ 若装过 v0.x 的 `digital-delivery-team`，先 `/plugin uninstall digital-delivery-team`（它会在 cwd 偷写 `.ddt/progress.json` 污染）。

---

## 1. 验证 using-ddt 取向注入

新建并进入一个**全新测试目录**（终端里）：

```bash
mkdir -p /tmp/ddt-smoke && cd /tmp/ddt-smoke && git init -q && echo "ok" > README.md
```

在该目录启动 Claude Code，第一句问它（**让它别调工具，直接答**）：

> 「不调用任何工具，直接回答：DDT 的四句北极星是什么？」

- ✅ **通过**：它能背出「大需求先变小 / 小问题用 superpowers 做深 / 设计进计划前过闸 / 需要交付时再收口」。它没读任何文件就知道 = SessionStart 注入的 using-ddt 在工作（using-ddt 里有自证句"你能读到这段话 = inject 在工作"）。
- ❌ **失败**：它说不知道 / 要去读文件 → 注入没生效。排查：`/plugin list` 是否 enabled、是否重启了会话。

---

## 2. 验证 bin 脚本裸名执行（cwd 无关）

仍在 `/tmp/ddt-smoke`（注意：这里**没有** `bin/` 目录）。让 Claude 用 Bash 执行：

```bash
ddt-doctor.mjs
```

- ✅ **通过**：输出健康报告。重点看 [A] 段列出 **3 个 hook**：`ddt:inject` / `ddt:metrics-post` / `ddt:metrics-end`；[B] 段输出 SSoT 路径地图（`.ddt/decisions.jsonl`、`docs/api`、`docs/data`、`docs/design` 等）。
  → 证明：插件 `bin/` 已在 PATH，**裸名 cwd 无关可执行**（不需要 `node`、不需要 `bin/` 路径）。

```bash
ddt-status.mjs
```

- ✅ **通过**：输出 JSON（`pending_decisions` / `slice_specs` / `slice_plans` / `in_progress_slices`）。
- ❌ **失败**：`command not found` → PATH 没注入。排查：确认是 `install` 了插件（不只是 `marketplace add`）、重启会话。

---

## 3. 验证 hook 注册 + 度量埋点

```bash
ddt-hook-preflight.mjs ; echo "exit=$?"
```

- ✅ **通过**：`exit=0`（3 个必需 hook 全注册：inject + 2 被动度量）。

让 Claude 随便跑一两个工具调用（如读个文件），然后：

```bash
ls -la /tmp/ddt-smoke/.ddt/metrics/ 2>/dev/null && tail -n 3 /tmp/ddt-smoke/.ddt/metrics/*.jsonl
```

- ✅ **通过**：有当天 `<YYYY-MM-DD>.jsonl` 且在增长 → PostToolUse / SessionEnd 度量 hook 在工作。

---

## 4. 清理

```bash
cd / && rm -rf /tmp/ddt-smoke
```

（可选）卸载：`/plugin uninstall disciplined-delivery-toolkit`

---

## 判定

| 检查 | 机制 |
|---|---|
| §1 它没读文件就知道四北极星 | using-ddt 取向注入（SessionStart → using-ddt） |
| §2 测试项目里裸名跑通 ddt-doctor/ddt-status | bin/ 自动入 PATH，裸名 cwd 无关 |
| §3 preflight exit=0 + metrics 在增长 | hook 注册 + 被动度量埋点 |

三项全 ✅ = using-ddt 注入 + 脚本执行 + 被动度量 三大机制在真实安装下成立。
