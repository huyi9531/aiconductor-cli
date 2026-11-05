---
name: wx-account-articles
version: 1.0.0
display_name: 公众号历史文章
display_name_en: WeChat Account Articles
description: 公众号历史文章 — 给一个公众号名称、或这个号任意一篇文章的链接，拉出它近期发过哪些文章（标题、发布时间、阅读、点赞、原创标记、链接）。当用户说"扒一下这个号发过什么""这个公众号最近写了什么""帮我看看 XX 公众号的文章列表""按阅读量列一下他的爆款"时使用；只丢来一个 mp.weixin.qq.com 链接、意图是看这个号整体发文情况时也应使用。只做「一个号 → 一批文章」；单篇文章的互动数据（阅读/点赞/在看/分享/收藏/评论明细）用 wx-article-data，文章正文全文、粉丝数据不在本技能范围。
description_zh: 公众号历史文章 — 按公众号名称或任意一篇文章定位，列出这个号近期发文（标题、时间、阅读、点赞、原创标记、链接），用于摸清更新节奏与选题分布。
description_en: WeChat account article list — locate an account by its name or any of its article links, then list recent posts with title, publish time, reads, likes, original flag, and URL. Useful for understanding posting cadence and topic mix.
author: "AI指挥家"
examples_zh:
  - "帮我扒一下「人民日报」公众号最近发了什么，先来 2 页"
  - "我这边有一篇他的文章链接，按这个号把最近的发文都列一下"
  - "把这个号近期的文章按阅读量排一下，最高的几篇单独列出来：人民日报"
examples_en:
  - "List what the People's Daily (人民日报) WeChat account has published recently — start with two pages"
  - "I have one of their article links — use it to pull the account's recent posts"
  - "Sort this account's recent posts by reads and call out the top ones; the account is 人民日报"
---

# 公众号历史文章

## 概述

通过全局安装的 `aiconductor-cli`，用公众号名称（或这个号任意一篇文章链接）定位公众号，拉回它近期发过的文章列表。交付的是"这个号在写什么、多久发一次、哪几篇数据好"，不是单篇数据。

默认已配置好 CLI 与 API Key。遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求配置环境时才主动读该文件。

## 什么时候用

- 想摸清一个号的盘子：内容结构、更新节奏
- 做对标：拿一批标题 + 阅读看它的选题分布
- 从某篇文章出发，想看这个号还发了什么

不接这几种，直说原因：

| 不接的请求 | 原因 / 转给谁 |
|---|---|
| 这一篇的阅读、点赞、在看、分享、收藏、评论 | 单篇数据走 `wx-article-data` |
| 把文章正文全文抓下来 | 没有正文接口，本技能只给标题、摘要和链接 |
| 粉丝数、粉丝画像、阅读趋势曲线 | 接口不返回 |
| 多个公众号横向对比 | 一次调用只针对一个号，多个号就多次调用并说明 |

## 执行

### 1. 定位公众号

两种方式**二选一**，不要同时给（同时给会一起发给接口）：

```bash
aiconductor-cli wx history --name "人民日报"
aiconductor-cli wx history "https://mp.weixin.qq.com/s?__biz=..."
```

- `--name`：公众号名称或微信号
- 位置参数 `url`：该公众号**任意一篇**文章链接，用来定位这个号
- 名称定位不到（重名、改名、没收录）时，让用户甩一篇他的文章链接过来，比继续猜名字快
- 用户给的链接原样传，不要改写 `__biz` / `mid` / `idx` / `sn` 参数

### 2. 翻页与耗时

```bash
aiconductor-cli wx history --name "人民日报" --max-pages 2 --max-seconds 80
```

- `--max-pages`：最多翻几页，默认 1；**一页 10 篇**
- `--max-seconds`：本次最长运行秒数，默认 50，**上限 170**（超了本地直接报校验错、不发请求）
- 首屏通常十几秒；翻 3 页以上容易顶到 `--max-seconds`，秒数要一起放大
- 先问用户"要几页"，别闷头连跑；要更多页就再加一次调用

### 3. 读响应（真实字段，2026-11-04 线上实测）

JSON 模式打印 `{success, data:{...}}`，文章数组在 `data.data.data[]`：

| 路径 | 含义 |
|---|---|
| `data.data.mp_nickname` | 公众号名称 |
| `data.data.mp_ghid` | 公众号 gh_ 号（用 `--name` 定位时**只有它**；`api_docs` 写的 `mp_wxid` / `head_img` 实际不返回） |
| `data.data.data[]` | 文章数组，每页 10 篇 |
| `data.data.now_page` | 当前页号 |
| `data.data.total_num` / `total_page` / `publish_count` / `masssend_count` | **恒为 0**，别拿来算总数 |

文章项字段：`title`、`url`、`post_time_str`（发布时间）、`read`（阅读）、`zan`（点赞）、`original`（原创标记）、`digest`（摘要）、`cover_url`、`position`、`appmsgid`、`update_time`、`types`、`item_show_type`、`source_url`。

- 篇数一律用**数组长度**，不要用 `total_num`
- 未知字段原样保留，别丢
- 要给人看的版本加 `-f text`：渲染成 公众号 / 篇数 / 翻页 + 每篇的 时间·阅读·点赞·原创·摘要·URL

### 4. 判断与交付

固定四段：

1. **公众号**：`mp_nickname` + `mp_ghid`
2. **抽样说明**：取到最近 N 篇（数组长度）、翻了 now_page 页；**必须说清这是抽样，不是全部**
3. **内容盘子**：按主题把标题分成 3–5 组，写清每组的选题倾向与条数；再给发布时间分布（哪几天/哪个时段发）
4. **数据观察**：阅读最高的 3 篇（标题 + 时间 + 阅读 + 链接），点出高阅读的共性；顺带给个中位数，别只报最大值

用户要"按阅读排序"就排，但要标注阅读数是**抓取时点的快照**。

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| 退出码 1、`api_error`、message 有中文 | 名称没对上、号不存在、被风控 | 转述 message 原话；名称定位失败就让用户给一篇文章链接 |
| `validation_error`（本地就退出） | `url` 与 `name` 都没给，或 `--max-seconds` 超 170 | 按提示补参数；这类错误不会发请求 |
| `network_error` / `http_error` | 网络或平台故障 | 原始错误交给用户，别连续重试 |
| 成功但数组为空 | 这个号近期没有可抓文章，或都不公开 | 说明"这次没抓到"，不要编内容 |

## 限制

- 一页 10 篇；没有 `has_more` 也没有游标，**无法判断是否取全**
- `total_num` 等总数字段恒为 0，篇数以数组长度为准
- 只有标题、摘要、时间、阅读、点赞、原创标记和链接，**没有正文全文**
- 没有粉丝数、粉丝画像、阅读趋势历史
- 阅读数是调用时点的快照，并且带封顶（口径见 `wx-article-data`）
- 名称定位取决于平台能否按名字收录到该号；不行就用文章链接
