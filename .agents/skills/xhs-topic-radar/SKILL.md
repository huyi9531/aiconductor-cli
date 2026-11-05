---
name: xhs-topic-radar
display_name: 小红书爆款选题雷达
display_name_en: Xiaohongshu Topic Radar
description: >-
  小红书爆款选题 — 按关键词检索小红书笔记（支持近一天/一周/半年、按最热/收藏最多/评论最多/最新排序、图文或视频），
  清洗去重后给出「哪些内容在爆、共性是什么、你该怎么写」。当用户说"小红书上最近什么在爆""这个赛道谁做起来了"
  "帮我找几个对标笔记""小红书选题""我该写什么""这个方向还能不能做"时使用；即使只给了一个赛道词或一句
  "我想做 XX"，只要意图是找选题/找对标也应使用。只做选题与对标发现；单篇笔记拆解、评论分析、
  账号整体分析、文案提取不在本技能范围。
description_zh: >-
  小红书爆款选题 — 按关键词检索小红书笔记，清洗去重后输出爆款榜单、收藏/点赞比、内容共性与可直接开写的选题建议。
description_en: >-
  Xiaohongshu topic radar — search notes by keyword with time and sort presets, then deliver a cleaned viral
  ranking, collect-to-like signals, shared patterns, and concrete topic ideas.
examples_zh:
  - "小红书上最近一周 AI 编程这个方向什么笔记在爆？"
  - "帮我找几个露营装备赛道的对标笔记，要近期收藏多的"
  - "我在纠结写职场还是副业，你先看看这两个词在小红书上的爆款情况"
examples_en:
  - "What's blowing up on Xiaohongshu in the AI coding niche this week?"
  - "Find me recent high-collect benchmark notes in the camping gear space"
  - "I'm torn between career advice and side hustles — check how both perform on Xiaohongshu"
version: 1.0.0
author: "AI指挥家"
---

# 小红书爆款选题

## 概述

此 Skill 通过全局安装的 `aiconductor-cli` 检索小红书笔记，把搜索结果清洗成「哪些内容在爆、为什么爆、你该怎么写」。

适用环境默认已配置好 CLI 和 API Key。当遇到 `command not found`、缺少密钥、鉴权失败或版本不兼容时，读取 [references/aiconductor-skills-setup.md](references/aiconductor-skills-setup.md)，修好后重试原命令一次；再失败就把原始错误交给用户。仅当用户明确要求初始化或配置 Skill 时才主动读取该文件。

## 什么时候用

- 想开写，但不确定写什么、这个方向还值不值得做
- 找对标笔记，看同行最近在发什么、什么形态奏效
- 判断一个选题词在小红书是"真赛道"还是"自嗨词"

不接这几种，直说原因：

| 不接的请求 | 原因 |
|---|---|
| 这篇笔记为什么爆 | 那是单篇拆解，本技能只做批量发现 |
| 评论区怎么说 | 评论是另一条链路 |
| 把爆款笔记文案扒下来 | 那是笔记拆解技能的事 |
| 某个账号整体怎么样 | 账号维度不在本技能范围 |
| 下载图片/视频 | 不提供 |

## 执行

### 1. 定档

用户没说时间窗就用默认档，不要反问"你要哪个时间段"。

| 档位 | 参数 | 什么时候用 |
|---|---|---|
| 近一周最热（默认） | `--sort popularity_descending --note-time week --max-pages 1` | 看当下什么在跑 |
| 半年爆款池 | `--sort popularity_descending --note-time halfyear --max-pages 2` | 找可复刻的长期赢家 |
| 收藏最多 | `--sort collect_descending --note-time halfyear` | 攻略、清单、干货类（小红书是收藏驱动） |
| 最新起量 | `--sort time_descending --note-time day` | 追热点、看刚冒头的 |
| 只看视频笔记 | 追加 `--note-type video` | 口播、测评、教程类对标 |
| 只看图文笔记 | 追加 `--note-type note` | 图文种草、清单体对标 |

### 2. 跑一次

```bash
aiconductor-cli xhs search "AI编程" --sort popularity_descending --note-time week --max-pages 1 > s1.json
node scripts/clean.mjs s1.json
```

单次约 3–10 秒，一页 20 条。`has_more` 为 `true` 不代表失败，是还有下一页。

多轮搜索时每轮存一个文件，最后一起喂给脚本：

```bash
node scripts/clean.mjs s1.json s2.json s3.json
```

脚本会按 `noteId` 跨轮去重（同一条笔记被几个词搜到只算一次），再过滤低互动噪声。**别自己临时写合并代码。**

### 3. 关键词怎么给

第一轮用用户原话。第二轮不要凭空想同义词，**从第一轮结果 `desc` 里的 `#xxx[话题]#` 挑 2–3 个高频标签**再搜——话题标签比近义词更接近小红书自己的分类。脚本末尾的「话题」一栏就是干这个用的。

最多 4 个词、串行跑，开跑前说一句"要搜 N 轮"。合并交给 `clean.mjs` 一次传多个文件。

### 4. 清洗后只看三件事

`scripts/clean.mjs` 处理机械部分，这几个口径坑不用你再想：

- **粉丝数拿不到**：搜索结果里的 `userInfo.fansNum` 实测**恒为 0**，所以小红书这侧**算不了赞粉比**。别硬套抖音那套判据。
- **阅读量拿不到**：`noteInfo.readNum` 也恒为 0，不要把它当曝光量写进结论。
- **收藏比点赞更重要**：小红书是「收藏驱动」的平台，`藏/赞 > 1` 通常意味着这条笔记真的有用（清单、教程、攻略），是新人最容易复刻的形态；`藏/赞 < 0.2` 多半靠情绪或账号存量。
- **评论/赞 > 0.1** 说明引发了讨论，适合做「有争议/有共鸣」的题。
- **时间**：`notePublishTime` 已是北京时间字符串，直接用。

剩下两件脚本做不了、只能靠判断：

1. **相关性**：只因为作者昵称或话题蹭词被搜进来的笔记要删掉。搜"AI编程"时会出现纯招聘、纯课程广告，这些不进榜单。
2. **样本量**：清洗后不足 3 条，说明这个词在小红书不是有效赛道，别硬凑结论。直接说"这个词样本不足"，给 2–3 个更口语的替代词（"AI编程" → "AI写代码""程序员副业""用AI做工具"），让用户选。

### 5. 交付

固定四段，不要自由发挥：

1. **榜单** 5–8 条：北京时间 | 点赞 | 收藏 | 评论 | 藏/赞 | 类型（图文/视频） | 作者 | 标题
2. **共性**：标题写法、开头钩子、内容形式（图文清单/口播/测评）、发布时段、常见话题标签。只写榜单里**实际出现过**的，别套模板
3. **选题建议** 3 条：每条一句话，挂 1–2 条支撑笔记（标题或 noteId），说清"照这个写是踩着什么规律"
4. **口径**：数据是抓取时点的快照；`has_more` 为真就明说"只看了 N 页，不是全量"

## 失败怎么说

| 现象 | 多半是 | 怎么讲 |
|---|---|---|
| `success` 为 `false` | 鉴权、余额或上游异常 | 看 `message` 原话，按 references 处理 |
| `items` 为空 | 关键词太窄或时间窗太短 | 这个词近 N 天没搜到内容，换更口语的说法或放宽到半年 |
| 清洗后只剩 1–2 条 | 词不是赛道词 | 直说样本不足，给替代词 |
| `has_more` 为真 | 只取了一页 | 结论里标注"非全量" |
| 用户给的是笔记链接而不是关键词 | 命令会把链接当关键词搜 | 这是搜索命令；单篇分析用笔记拆解技能，先向用户确认要搜的词 |

不要因为结果少就改写结论，也不要拿单条笔记代表赛道。

## 限制

- 单次 `--max-pages` 上限 5（每页约 20 条）；每页成功抓取都会计费，别无脑拉满
- 搜索是关键词匹配，不是赛道理解，噪声是常态
- 图文笔记的正文常常在图片里，搜索结果只给 `desc`，看不到图内文字
- 不下载图片/视频、不读评论、不提取完整文案
