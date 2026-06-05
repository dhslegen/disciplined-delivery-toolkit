# 消费 bundle：翻译保真手册

视觉真相操作闭环的唯一的家。`using-ddt` 兑现守恒①、design-source 消费段、checkpoint Q8 都指向这里——改这一份，别在别处重述。

数据真相有 observed 链、职责真相有逐条勾，视觉真相长期只有"必读 bundle"一句——无提取、无闸、无验收，于是每过一道边界蒸发一层，落地"功能对但廉价"。这份补上对称的操作链。

## 翻译，不是重新实现

bundle 是**源代码不是参考图**：它的样式产物（色值/间距/类名/结构）就是视觉规格，比文字精确。

- **翻译**＝复刻它的渲染输出、只换数据源（假数据→真 API、假 onClick→真逻辑）。代码型 bundle：导入它的 CSS 为项目样式、保留 class、对着源码逐行译成目标框架。
- **重新实现**＝读个大意、用自选组件库从零搭个"类似"页再覆盖样式——丢全部保真，消费 bundle 最常见的失败。
- 不是所有 bundle 出 `.css`（Figma 给 token+截图+规格）。通用原则是"复刻渲染输出、样式产物即规格"，按形态取保真手段。

**抽象层是条件不是禁令**：CrudScaffold 等仅当输出 DOM 匹配 bundle 才用，否则是信息丢失层（精确的 avatar/pill/icon 在"columns 配置"里没有表达位）。无 bundle 的切片用抽象是对的——别回头否定。

## 砍前先问：依赖后端数据吗

bundle 有后端不支持的元素，只砍**数据不支持的**，别连视觉一起砍。判据唯一——数据依赖：

| | 例 | 处置 |
|---|---|---|
| **视觉模式**（零数据依赖） | avatar、pill、card、间距、icon 按钮、toolbar、发光态、页头 | **永远保留** |
| **数据驱动列/字段** | siteCount 聚合列、后端不存在的 status | 后端不给→砍（数据真相正确工作） |

常见偷换：把"砍后端不返回的聚合列"（对）滑成"砍 avatar/pill/card/toolbar"（错），拿"数据真相覆盖视觉真相"当借口跳过视觉消费。

## 操作链（对称 observed，穿过下游 vendored 阶段）

下游 plan/subagent/verification 多是 vendored 不改，这些要求由你做前端时携带，checkpoint Q8 闸住"提取"环：

1. **提取** → 实现前从 bundle 提取视觉规格写入 spec 视觉章节（每页容器结构 / 复用视觉模式 / token / 间距）。是"spec 有非空视觉章节"，不是"我读过 handoff"。
2. **传 plan** → 首个页面 Task 前插"视觉基建 Task"（导入 bundle CSS/token、提复用视觉组件）；每页 Task 带 bundle 源引用（文件:行）+ class 清单 + "翻译不重写"。
3. **传 subagent** → prompt 带视觉上下文段（subagent 不接 inject）：bundle 该页源码段 + class 清单 + 硬约束（禁 inline 硬编码色、禁裸组件库默认样式当最终视觉、亮色硬编码进暗色主题＝红旗）。
4. **验收** → tsc/test 绿不证明视觉达标（标准在渲染结果不在代码）。完成前截图与 bundle 并排比。

## token 锚 bundle 真值

把 bundle 真品牌色/背景层级/排版变量导入主题配置，别留历史占位色：早期切片写死的占位主色若从没核对 bundle 真值，组件库暗色算法会把它扩散成满屏廉价蓝——与"契约 doc 漂移于真 provider"同构，对真源核（真源＝bundle token）。
