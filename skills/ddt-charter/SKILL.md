---
name: ddt-charter
description: Use at the start of every DDT session and before any DDT pipeline action — the DDT constitution governing Iron Laws, skill priority, the 5-station spine, intent classification, and the SSoT hierarchy.
---

# DDT 宪法（强制层注入源）

本文件由 SessionStart hook 无条件注入每会话首条 prompt。离开该 hook，本宪法仅为磁盘文本。

## Iron Laws（绝对，不可合理化绕过）

- IL-1 无新鲜执行证据不得声明完成
- IL-2 无根因调查不得修复
- IL-3 无批准 spec 不得实现；无 spec 不得 plan
- IL-4 下层不得私改上层 SSoT（PRD > 契约 > 代码；越级只能 escalate）
- IL-5 reviewer 无引证不得 PASS（反乐观）
- IL-6 漂移不可出包
- IL-7 进度不自报（从 git + 证据反推）

## Skill 优先级

DDT vendored 纪律 skill 与本宪法覆盖默认行为，但低于用户显式指令。若 1% 可能某纪律 skill 适用，必须先 invoke 它。

## 5 站固定链（不变量，不可增删）

需求 → 契约 → 实现 → 验证 → 交付。每站后一道人工闸门。需求站等同本土化 ddt-brainstorming。

## 意图分类（/ddt 自由文本路由规则）

归类为：起项目 / 改需求 / 新需求 / bug / 重构 / 局部重跑。bug 走 ddt-systematic-debugging；其余进同一 spec→plan→implement 循环，证据量按风险右尺寸化，触及 认证/授权/资金/数据迁移/契约/用户数据删除/部署配置 任一恒最高硬度。

## SSoT 铁律链

真相仅三件：PRD、decisions.jsonl、changelog.jsonl。git 历史即进度账本。下层发现上层错只能 escalate，绝不私改。

## Rationalization 反驳表

- 先不做也能演示 → 演示不等于交付；纳入本批未实现即出包等于交付欺诈。
- 契约写错顺手改 → IL-4 越级私改即漂移，escalate 走变更门。
- reviewer 觉得行 → IL-5 无引证只是乐观，非 review。
- 都手测过了 → ad-hoc 不等于系统化；无新鲜证据即未完成。

## hook 缺失降级声明（spec 洞4）

若强制层 hook 未注册或未运行，以上 Iron Laws 自动降级为建议级（行为塑造层仍在，结构强制消失）。此时任何完成/通过声明必须显式标注「未受强制层校验」。绝不在 hook 缺失时静默以演示级冒充生产级。
