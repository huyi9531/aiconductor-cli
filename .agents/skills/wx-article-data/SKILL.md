---
name: wx-article-data
version: 1.0.0
display_name: 公众号文章数据
display_name_en: WeChat Article Data
description: 公众号文章数据 — 给一篇公众号文章链接，取回它的阅读、点赞、在看、分享、收藏、评论数。当用户说"这篇阅读量多少""这篇文章数据怎么样""点赞在看多少""帮我抓一下这篇公众号的数据""这几篇的数据分别拉一下"时使用；只丢来一个 mp.weixin.qq.com 链接、意图是看这篇的表现时也应使用。只做「一篇链接 → 互动数据」；想看一个号发过哪些文章用 wx-account-articles，文章正文全文、粉丝数据、其他平台内容不在本技能范围。
description_zh: 公众号文章数据 — 输入一篇公众号文章链接，返回阅读、点赞、在看、分享、收藏、评论数，用于判断单篇表现或做投放复盘。
description_en: WeChat article metrics — turn one article URL into reads, likes, wow (looking), shares, saves, and comments, for judging a single post's performance or reviewing a placement.
author: "AI指挥家"
examples_zh:
  - "这篇公众号文章数据怎么样？帮我看看阅读和在看"
  - "我发你几篇链接，一篇一篇把阅读、点赞、收藏、评论拉出来"
  - "对比下这两篇哪个流传度更高，各自的互动数据都给我"
examples_en:
  - "How is this WeChat article performing — reads and the wow (looking) count?"
  - "I'll send a few links; pull reads, likes, saves, and comments for each one"
  - "Compare these two articles — which one traveled further? Give me both sets of metrics"
---

# 公众号文章数据

## 概述

一篇 `mp.weixin.qq.com` 文章链接，换一组互动数据：阅读、点赞、在看、分享、收藏、评论。用于单篇复盘、投放核对、竞品对比。

默认已配置好 CLI 与 API Key。遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求配置环境时才主动读该文件。

## 什么时候用

- 想知道这一篇的传播效果
- 复盘：同一个号的几篇文章横向比
- 投放或合作前，核对对方给的数字

不接这几种，直说原因：

| 不接的请求 | 原因 / 转给谁 |
|---|---|
| 一个号发过哪些文章 | 列表走 `wx-account-articles` |
| 文章正文全文 / 提取文字 | 没有正文接口，只能给数据 |
| 粉丝数、涨粉、阅读来源、完读率 | 接口不返回 |
| 小红书、抖音、普通网页链接 | 只支持公众号文章链接 |

## 执行

### 1. 一次一篇

```bash
aiconductor-cli wx article-data "https://mp.weixin.qq.com/s?__biz=...&mid=...&idx=...&sn=..."
```

- 链接要从文章页复制出来，**原样传**，不要自己改写 `__biz` / `mid` / `idx` / `sn`
- 公众号主页链接、菜单链接换来的不是文章页，先让用户给文章链接
- 多篇就是多次调用：先确认要哪几篇，别一口气跑几十次
- 要给人看的版本加 `-f text`；要做计算或存证就用默认 JSON

### 2. 读响应（真实字段，2026-11-04 线上实测）

`data.data` 直接是数据对象：

| 字段 | 含义 |
|---|---|
| `read` | 阅读数（**有封顶**：100001 表示 10 万+，不是精确值） |
| `zan` | 点赞 |
| `looking` | 在看（不是"正在阅读人数"） |
| `share_num` | 分享 |
| `collect_num` | 收藏 |
| `comment_count` | 评论 |

- `-f text` 渲染成 阅读 / 点赞 / 在看 / 分享 / 收藏 / 评论；上游新增的未知字段会原样附在后面，不会丢
- 字段缺失不要猜：先用 `-f json` 看原始响应，再判断是上游没给还是没抓到
- 业务失败也走退出码 1：平台把失败放在 HTTP 200 的响应体里（`success:false`），CLI 已转成 `api_error` 打到 stderr

### 3. 交付

- **单篇**：一张小表（6 个指标）+ 一句结论，例如"10 万+ 阅读、点赞约 0.6%、分享 2.1 万"
- **多篇**：对比表，按用户关心的维度排序，每篇带上标题与链接
- 不要替用户定性"这是爆款"，除非他给了判定标准（比如阅读 ≥ 某个数）

要算互动率就给公式，别给黑箱：

```text
互动率 = (zan + looking + collect_num + share_num) / read
```

`read` 顶到 100001 时算出来的比率必然偏低，结论里要标注这一点。

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| 退出码 1、`api_error` | 链接不是文章页、文章已删、被限制 | 转述 message 原话；让用户确认链接是从文章页复制的 |
| `validation_error`（本地就退出） | 链接为空 | 补链接重跑；这类错误不会发请求 |
| 字段全是 0 或缺失 | 上游没抓到，或文章刚发 | 用 `-f json` 看原始响应再回答，别把"0 阅读"当结论 |
| `network_error` / `http_error` | 网络或平台故障 | 原始错误交给用户，别连续重试 |

## 限制

- 一次一篇；批量等于多次调用
- 阅读数有封顶（100001 = 10 万+），基于它算的比率会偏低
- 只有 6 个指标：没有阅读来源、完读率、涨粉、粉丝画像
- 数据是调用时点的快照，不会自动刷新
- 只支持公众号文章链接，其他平台链接会失败
