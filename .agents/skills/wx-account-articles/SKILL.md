---
name: wx-account-articles
version: 1.0.1
display_name: 公众号历史文章
display_name_en: WeChat Account Articles
description: 公众号历史文章 — 给一个公众号名称、或这个号任意一篇文章的链接，拉出它近期发过哪些文章（标题、发布时间、阅读、点赞、原创标记、链接）。当用户说"扒一下这个号发过什么""这个公众号最近写了什么""帮我看看 XX 公众号的文章列表""按阅读量列一下他的爆款"时使用；只丢来一个 mp.weixin.qq.com 链接、意图是看这个号整体发文情况时也应使用。只做「一个号 → 一批文章」；单篇文章的互动数据（阅读/点赞/在看/分享/收藏/评论明细）用 wx-article-data，文章正文全文、粉丝数据不在本技能范围。
description_zh: 公众号历史文章 — 按公众号名称或任意一篇文章定位，列出这个号近期发文（标题、时间、阅读、点赞、原创标记、链接），用于摸清更新节奏与选题分布。
description_en: WeChat account article list — locate an account by its name or any of its article links, then list recent posts with title, publish time, reads, likes, original flag, and URL. Useful for understanding posting cadence and topic mix.
author: "AI指挥家"
examples_zh:
  - "帮我扒一下「人民日报」公众号最近发了什么，先来 2 页"
  - "我这边有一篇他的文章链接，按这个号把最近的发文都列一下：https://mp.weixin.qq.com/s/zC9sMtbLpIrD4ENZrp213A"
  - "把这个号近期的文章按阅读量排一下，最高的几篇单独列出来：人民日报"
examples_en:
  - "List what the People's Daily (人民日报) WeChat account has published recently — start with two pages"
  - "I have one of their article links — use it to pull the account's recent posts: https://mp.weixin.qq.com/s/zC9sMtbLpIrD4ENZrp213A"
  - "Sort this account's recent posts by reads and call out the top ones; the account is 人民日报"
---

# 公众号历史文章

## 概述

通过全局安装的 `aiconductor-cli`，用公众号名称（或这个号任意一篇文章链接）定位公众号，拉回它近期发过的文章列表。交付的是"这个号在写什么、多久发一次、哪几篇数据好"，不是单篇数据。

开工前先跑 `scripts/preflight.mjs` 自检（不联网、不计费），比跑到一半才发现缺环境划算。遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，同样读 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。

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

### 1. 自检（不联网、不花钱）

```bash
node scripts/preflight.mjs --name "人民日报"
node scripts/preflight.mjs "https://mp.weixin.qq.com/s/zC9sMtbLpIrD4ENZrp213A"
```

一次查四件：`aiconductor-cli` 装没装（且是不是 **1.5.0 及以上**，`wx` 组从 1.5.0 才有）、API Key 有没有、定位方式是名称还是链接、翻页参数在不在区间。全绿时它把下一步该执行的命令直接打印出来；出现 `✗` 就先修那一条，别带着问题硬跑。

### 2. 定位公众号

两种方式**二选一**，不要同时给（同时给会把两个参数都发出去）：

```bash
aiconductor-cli wx history --name "人民日报"
aiconductor-cli wx history "https://mp.weixin.qq.com/s/zC9sMtbLpIrD4ENZrp213A"
```

- 上面两条 2026-11-05 线上实测跑通：名称定位返回人民日报 10 篇（4.0 秒）；短链定位解析到「国家数据局」并返回 10 篇（2.4 秒）
- `--name`：公众号名称或微信号
- 位置参数 `url`：该公众号**任意一篇**文章链接，用来定位这个号
- 名称定位不到（重名、改名、没收录）时，让用户甩一篇他的文章链接过来，比继续猜名字快
- 用户给的链接原样传，不要改写 `__biz` / `mid` / `idx` / `sn` 参数

### 3. 翻页与耗时

```bash
aiconductor-cli wx history --name "人民日报" --max-pages 2 --max-seconds 80
```

- `--max-pages`：最多翻几页，默认 1；**一页 10 篇**
- `--max-seconds`：本次最长运行秒数，默认 50，**上限 170**（超了本地直接报校验错、不发请求）
- 单页实测 2–5 秒（名称 4.0s、短链 2.4s、长链 4.4s，各 10 篇）；翻多页时把 `--max-seconds` 一起放大，上游慢时会更久
- 先问用户"要几页"，别闷头连跑；要更多页就再加一次调用

### 4. 读响应（真实字段，2026-11-05 线上实测）

JSON 模式打印 `{success, data:{...}}`，文章数组在 `data.data.data[]`：

| 路径 | 含义 |
|---|---|
| `data.data.code` | 上游返回码，**`0` 才是成功**；非 0 时 `data.data.data` 一定是空数组 |
| `data.data.mp_nickname` | 公众号名称 |
| `data.data.mp_ghid` | 公众号 gh_ 号（用 `--name` 定位时**只有它**；`api_docs` 写的 `mp_wxid` / `head_img` 实际不返回） |
| `data.data.data[]` | 文章数组，每页 10 篇 |
| `data.data.now_page` | 当前页号 |
| `data.data.total_num` / `total_page` / `publish_count` / `masssend_count` | **恒为 0**，别拿来算总数 |

文章项字段：`title`、`url`、`post_time_str`（发布时间）、`read`（阅读）、`zan`（点赞）、`original`（原创标记）、`digest`（摘要）、`cover_url`、`position`、`appmsgid`、`update_time`、`types`、`item_show_type`、`source_url`。

- 篇数一律用**数组长度**，不要用 `total_num`
- **数组为空先看 `code`**：`code` 非 0 是上游失败，CLI 会以退出码 1 报 `api_error`（见「失败怎么说」）；不要说成"这个号没发文"
- 未知字段原样保留，别丢
- 要给人看的版本加 `-f text`：渲染成 公众号 / 篇数 / 翻页 + 每篇的 时间·阅读·点赞·原创·摘要·URL

成功时长这样（真实响应，省略了部分字段与长链接）：

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "微信公众号历史文章获取完成。成功获取 1 页数据，共 10 篇文章。",
    "data": {
      "code": 0,
      "msg": "success",
      "mp_nickname": "人民日报",
      "mp_ghid": "gh_363b924965e9",
      "now_page": 1,
      "data": [
        {
          "title": "超实用！这些“过冬神器”又卖爆了",
          "post_time_str": "2026-11-05 11:05:47",
          "read": 100001,
          "zan": 646,
          "original": 1,
          "digest": "",
          "url": "https://mp.weixin.qq.com/s?__biz=MjM5MjAxNDM4MA==&mid=2667043712&idx=1&sn=…"
        }
      ]
    }
  }
}
```

失败时长这样（2026-11-05 实测：`--name` 给一个不存在的号，3 秒返回，本页不计费）：

```json
{ "success": false, "error": "未能获取到任何数据。请检查参数或账户余额。（上游错误码 107）" }
```

错误码是上游给的：`107` 是找不到这个号，`20001` 是平台侧上游故障（换成别的号、换链接都一样），别把两种混为一谈。

### 5. 判断与交付

固定四段：

1. **公众号**：`mp_nickname` + `mp_ghid`
2. **抽样说明**：取到最近 N 篇（数组长度）、翻了 now_page 页；**必须说清这是抽样，不是全部**
3. **内容盘子**：按主题把标题分成 3–5 组，写清每组的选题倾向与条数；再给发布时间分布（哪几天/哪个时段发）
4. **数据观察**：阅读最高的 3 篇（标题 + 时间 + 阅读 + 链接），点出高阅读的共性；顺带给个中位数，别只报最大值

用户要"按阅读排序"就排，但要标注阅读数是**抓取时点的快照**。

## 全部选项

| 选项 | 作用 | 说明 |
|---|---|---|
| `[url]` | 定位用的文章链接 | 短链 `s/xxx`、长链 `s?__biz=…` 都收，原样传；与 `--name` 二选一 |
| `--name <name>` | 公众号名称或微信号 | 与 `url` 二选一 |
| `--max-pages <n>` | 最多翻几页 | 默认 1；一页 10 篇 |
| `--max-seconds <n>` | 本次最长运行秒数 | 默认 50，上限 170；超了本地报校验错、不发请求 |
| `-k, --api-key <key>` | 临时指定 API Key | 优先于环境变量 |
| `-f, --format <fmt>` | 输出格式 | 默认 `json`；`text` 的输出见上一节 |
| `-h, --help` | 查看命令帮助 | — |

密钥解析顺序：`-k` > 环境变量 `AICONDUCTOR_API_KEY` > **当前工作目录**的 `.env`（不向上查找）。

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| 退出码 1、`api_error`、message 有中文 | 名称没对上、号不存在、被风控 | 转述 message 原话；名称定位失败就让用户给一篇文章链接 |
| 退出码 1、message 带「上游错误码 107」 | 名称或链接没对上这个号 | 让用户换准确的公众号名称，或给一篇他的文章链接 |
| 退出码 1、message 带「上游错误码 20001」 | 平台侧上游接口故障，与这个号有没有文章无关 | 照原话说接口暂时取不到数据；**别说成"最近没发文"** |
| `validation_error`（本地就退出） | `url` 与 `name` 都没给，或 `--max-seconds` 超 170 | 按提示补参数；这类错误不会发请求 |
| `network_error` / `http_error` | 网络或平台故障 | 原始错误交给用户，别连续重试 |
| `code: 0` 且数组为空 | 这个号近期确实没有可抓文章，或都不公开 | 说明"这次没抓到"，不要编内容 |

## 限制

- 一页 10 篇；没有 `has_more` 也没有游标，**无法判断是否取全**
- `total_num` 等总数字段恒为 0，篇数以数组长度为准
- 只有标题、摘要、时间、阅读、点赞、原创标记和链接，**没有正文全文**
- 没有粉丝数、粉丝画像、阅读趋势历史
- 阅读数是调用时点的快照，并且带封顶（口径见 `wx-article-data`）
- 名称定位取决于平台能否按名字收录到该号；不行就用文章链接
